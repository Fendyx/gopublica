/**
 * Tenant Telegram Notification Service
 *
 * Dedicated Telegram bot for tenant notifications (separate from agency lead bot).
 * Uses Telegram Deep Linking pattern: t.me/OurTenantBot?start=<UNIQUE_TOKEN>
 *
 * Note: Link tokens use crypto.randomBytes (32 chars base64url) instead of JWTs
 * because Telegram's /start deep link parameter is limited to 64 bytes.
 * JWT tokens (~200+ chars) were silently truncated/dropped by Telegram.
 *
 * Env vars required:
 *   TENANT_TELEGRAM_BOT_TOKEN   - bot token from @BotFather
 *   TENANT_TELEGRAM_BOT_USERNAME - bot username (e.g., "OurTenantBot")
 */

const crypto = require('crypto');
const TenantUser = require('../../models/TenantUser');
const TenantSettings = require('../../models/TenantSettings');
const Branch = require('../../models/Branch');
const Order = require('../../models/food/Order');
const Reservation = require('../../models/food/Reservation');
const JobApplication = require('../../models/hr/JobApplication');

const TELEGRAM_API_BASE = 'https://api.telegram.org';
const LINK_TOKEN_TTL_MINUTES = 10;
const LINK_TOKEN_LENGTH = 32; // 32 bytes = 32 chars in base64url (fits well within Telegram's 64-byte limit)

/**
 * Get bot token from environment
 */
function getBotToken() {
  return process.env.TENANT_TELEGRAM_BOT_TOKEN;
}

/**
 * Get bot username from environment
 */
function getBotUsername() {
  return process.env.TENANT_TELEGRAM_BOT_USERNAME || 'OurTenantBot';
}

/**
 * Escape user-provided text for safe inclusion in Telegram Markdown messages.
 * Wraps the text in backtick code spans to prevent Markdown interpretation.
 * Any backticks inside the value are replaced with a similar-looking character.
 * @param {*} text - Any value
 * @returns {string} Safely escaped string for Markdown
 */
function escapeMd(text) {
  if (text == null) return '-';
  const str = String(text).replace(/`/g, '\u02CB'); // replace backticks with modifier letter grave accent
  return '`' + str + '`';
}

/**
 * Send a text message to a Telegram chat
 * @param {string} chatId - Telegram chat ID
 * @param {string} text - Message text (Markdown supported)
 * @param {object} options - Additional options (parse_mode, disable_web_page_preview, etc.)
 * @returns {Promise<boolean>} true if sent successfully
 */
async function sendTelegramMessage(chatId, text, options = {}) {
  const token = getBotToken();
  if (!token) {
    console.log('🔔 [Tenant Telegram skipped - TENANT_TELEGRAM_BOT_TOKEN not configured]', text);
    return false;
  }

  try {
    const url = `${TELEGRAM_API_BASE}/bot${token}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('❌ Tenant Telegram sendMessage failed:', res.status, errBody);
      return false;
    }

    console.log(`✅ [Telegram] Message sent to chat ${chatId}`);
    return true;
  } catch (err) {
    console.error('❌ Tenant Telegram notification error:', err.message);
    return false;
  }
}

/**
 * Answer a Telegram callback query (required to dismiss the loading indicator on inline buttons)
 * @param {string} callbackQueryId - The callback_query.id from the update
 * @param {string} [text] - Optional text to show as a popup notification
 * @returns {Promise<boolean>}
 */
async function answerCallbackQuery(callbackQueryId, text) {
  const token = getBotToken();
  if (!token || !callbackQueryId) return false;

  try {
    const url = `${TELEGRAM_API_BASE}/bot${token}/answerCallbackQuery`;
    const body = { callback_query_id: callbackQueryId };
    if (text) body.text = text;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('❌ answerCallbackQuery failed:', res.status, errBody);
      return false;
    }
    return true;
  } catch (err) {
    console.error('❌ answerCallbackQuery error:', err.message);
    return false;
  }
}

/**
 * Generate a deep link token for a TenantUser.
 * Uses a short random token (base64url) that fits within Telegram's 64-byte start parameter limit.
 * Previous JWT tokens were ~200+ chars, which Telegram silently truncated/dropped.
 * @param {string} tenantUserId - TenantUser ObjectId
 * @returns {object} { token, expiresAt, deepLink }
 */
function generateLinkToken(tenantUserId) {
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MINUTES * 60 * 1000);
  // base64url uses only A-Z, a-z, 0-9, _, - (all allowed by Telegram's start param)
  const token = crypto.randomBytes(LINK_TOKEN_LENGTH).toString('base64url');
  const botUsername = getBotUsername();
  const deepLink = `https://t.me/${botUsername}?start=${token}`;
  return { token, expiresAt, deepLink };
}

/**
 * Validate a link token format (must be a valid base64url string of expected length)
 * @param {string} token - Raw token from /start command
 * @returns {boolean} true if format is valid
 */
function validateLinkTokenFormat(token) {
  if (!token || typeof token !== 'string') return false;
  // base64url tokens: only A-Z, a-z, 0-9, _, -
  // Length: LINK_TOKEN_LENGTH bytes → 32 chars in base64url
  return /^[A-Za-z0-9_-]+$/.test(token) && token.length <= 64;
}

/**
 * Consume a link token: find the TenantUser with the matching raw token,
 * then save the chatId and clear the token.
 * @param {string} token - Raw token from /start command
 * @param {string} chatId - Telegram chat ID from the update
 * @param {object} from - Telegram User object (from, id, username, first_name, last_name)
 * @returns {Promise<TenantUser|null>} Updated TenantUser or null if failed
 */
async function consumeLinkToken(token, chatId, from) {
  // Validate token format
  if (!validateLinkTokenFormat(token)) {
    console.log('❌ Invalid Telegram link token format');
    return null;
  }

  // Find the user with this pending link token (raw token stored directly)
  // The token is short-lived (10 min) and single-use, so plaintext storage is acceptable.
  const user = await TenantUser.findOne({
    telegramLinkToken: token,
    telegramLinkTokenExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    console.log('❌ No matching TenantUser found for link token (expired or already used)');
    return null;
  }

  // Success! Link the chat ID
  user.telegramChatId = chatId.toString();
  user.telegramLinkedAt = new Date();
  user.telegramLinkToken = null;
  user.telegramLinkTokenExpiresAt = null;
  await user.save();

  console.log(`✅ TenantUser ${user._id} linked to Telegram chat ${chatId}`);
  return user;
}

// ─── Menu & Inline Keyboard Helpers ─────────────────────────────────────────────

/**
 * Inline keyboard markup for the /menu command.
 * Callback data uses short prefixes to stay within Telegram's 64-byte limit.
 * Format: m:<category>:<period>   (e.g. "m:o:t" = menu → orders → today)
 */
const MENU_KEYBOARD = {
  inline_keyboard: [
    [
      { text: '🛒 Orders', callback_data: 'm:o:menu' },
      { text: '🍽️ Reservations', callback_data: 'm:r:menu' },
    ],
    [
      { text: '🤝 Partner Requests', callback_data: 'm:p:menu' },
      { text: '💼 Job Applications', callback_data: 'm:j:menu' },
    ],
  ],
};

const PERIOD_KEYBOARD = (category) => ({
  inline_keyboard: [
    [
      { text: '📅 Today', callback_data: `m:${category}:t` },
      { text: '📆 This Week', callback_data: `m:${category}:w` },
    ],
    [
      { text: '🗓 This Month', callback_data: `m:${category}:m` },
      { text: '♾ All Time', callback_data: `m:${category}:a` },
    ],
    [{ text: '« Back to Menu', callback_data: 'm:back' }],
  ],
});

const BACK_KEYBOARD = {
  inline_keyboard: [[{ text: '« Back to Menu', callback_data: 'm:back' }]],
};

/**
 * Show the main /menu inline keyboard to a chat
 * @param {string|number} chatId
 * @returns {Promise<boolean>}
 */
async function sendMenuKeyboard(chatId) {
  const tenantUser = await TenantUser.findOne({ telegramChatId: String(chatId) }).lean();
  const tenantName = tenantUser
    ? (await TenantSettings.findOne({ tenantId: tenantUser.tenantId }).lean())?.businessName || 'your business'
    : 'your business';

  return sendTelegramMessage(
    chatId,
    `📊 *${escapeMd(tenantName)} - Dashboard*\n\nSelect a category to view statistics:`,
    { reply_markup: MENU_KEYBOARD }
  );
}

/**
 * Look up tenantId and all branchIds from a chatId.
 * @param {string|number} chatId
 * @returns {Promise<{ tenantId: string, branchIds: string[] }|null>}
 */
async function resolveTenantFromChat(chatId) {
  const tenantUser = await TenantUser.findOne({ telegramChatId: String(chatId) }).lean();
  if (!tenantUser) return null;

  const branches = await Branch.find({ tenantId: tenantUser.tenantId, isActive: true })
    .select('_id')
    .lean();
  const branchIds = branches.map(b => b._id.toString());

  return { tenantId: tenantUser.tenantId, branchIds };
}

/**
 * Compute a date range from a period code
 * @param {'t'|'w'|'m'|'a'} period - today / this week / this month / all time
 * @returns {{ $gte: Date } | {}} MongoDB date filter (empty object = no filter)
 */
function getDateFilter(period) {
  const now = new Date();
  switch (period) {
    case 't': { // Today
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { $gte: start };
    }
    case 'w': { // This week (Monday → Sunday)
      const day = now.getDay(); // 0=Sun, 1=Mon …
      const diff = day === 0 ? 6 : day - 1; // days since Monday
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      return { $gte: start };
    }
    case 'm': { // This month
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { $gte: start };
    }
    case 'a':
    default:
      return {}; // no filter
  }
}

const PERIOD_LABELS = { t: 'Today', w: 'This Week', m: 'This Month', a: 'All Time' };

/**
 * Get order statistics for a tenant within a date range
 */
async function getOrderStats(tenantId, branchIds, period) {
  const dateFilter = getDateFilter(period);
  const match = { tenantId };
  if (Object.keys(dateFilter).length) match.createdAt = dateFilter;
  // If the tenant has branches, filter to those branches (orders may have branchId = null for default)
  if (branchIds.length) {
    match.$or = [
      { branchId: { $in: branchIds } },
      { branchId: { $in: [null, ''] } },
    ];
  }

  const total = await Order.countDocuments(match);
  const byStatus = await Order.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const revenue = await Order.aggregate([
    { $match: { ...match, status: { $nin: ['cancelled'] } } },
    { $group: { _id: null, total: { $sum: '$pricing.total' }, currency: { $first: '$pricing.currency' } } },
  ]);

  return { total, byStatus, revenue: revenue[0] || { total: 0, currency: 'PLN' } };
}

/**
 * Get reservation statistics for a tenant within a date range
 */
async function getReservationStats(tenantId, branchIds, period) {
  const dateFilter = getDateFilter(period);
  const match = { tenantId };
  if (Object.keys(dateFilter).length) match.createdAt = dateFilter;
  if (branchIds.length) match.branchId = { $in: branchIds };

  const total = await Reservation.countDocuments(match);
  const byStatus = await Reservation.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return { total, byStatus };
}

/**
 * Get partner request stats (JobApplication records that HAVE a sourceSectionId)
 */
async function getPartnerRequestStats(tenantId, branchIds, period) {
  const dateFilter = getDateFilter(period);
  const match = { tenantId, sourceSectionId: { $exists: true, $ne: null } };
  if (Object.keys(dateFilter).length) match.createdAt = dateFilter;
  if (branchIds.length) {
    match.$or = [
      { branchId: { $in: branchIds } },
      { branchId: { $in: [null, ''] } },
    ];
  }

  const total = await JobApplication.countDocuments(match);
  const byStatus = await JobApplication.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return { total, byStatus };
}

/**
 * Get job application stats (JobApplication records that do NOT have a sourceSectionId)
 */
async function getJobApplicationStats(tenantId, branchIds, period) {
  const dateFilter = getDateFilter(period);
  const match = { tenantId, $or: [{ sourceSectionId: null }, { sourceSectionId: { $exists: false } }] };
  if (Object.keys(dateFilter).length) match.createdAt = dateFilter;
  if (branchIds.length) {
    match.$or = [
      { branchId: { $in: branchIds } },
      { branchId: { $in: [null, ''] } },
    ];
  }

  const total = await JobApplication.countDocuments(match);
  const byStatus = await JobApplication.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return { total, byStatus };
}

/**
 * Format status label for display
 */
function formatStatus(status) {
  const labels = {
    pending_payment: '⏳ Pending Payment',
    paid: '💰 Paid',
    accepted: '✅ Accepted',
    preparing: '👨‍🍳 Preparing',
    ready: '📦 Ready',
    out_for_delivery: '🚚 Out for Delivery',
    completed: '✅ Completed',
    cancelled: '❌ Cancelled',
    confirmed: '✅ Confirmed',
    pending: '⏳ Pending',
    new: '🆕 New',
    viewed: '👁 Viewed',
    invited: '📩 Invited',
    rejected: '🚫 Rejected',
    hired: '🎉 Hired',
  };
  return labels[status] || status || 'Unknown';
}

/**
 * Build a summary report string for a given category
 */
function buildReport(category, period, stats) {
  const periodLabel = PERIOD_LABELS[period] || period;
  const headers = {
    o: '🛒 *Orders*',
    r: '🍽️ *Reservations*',
    p: '🤝 *Partner Requests*',
    j: '💼 *Job Applications*',
  };

  const lines = [headers[category] || '📊 *Statistics*', '', `📅 *Period:* ${periodLabel}`, ''];

  if (stats.byStatus && stats.byStatus.length) {
    lines.push('*Breakdown:*');
    for (const s of stats.byStatus) {
      lines.push(`  ${formatStatus(s._id)}: ${s.count}`);
    }
    lines.push('');
  }

  lines.push(`*Total:* ${stats.total}`);

  // Add revenue line for orders
  if (category === 'o' && stats.revenue) {
    lines.push(`*Revenue:* ${Number(stats.revenue.total || 0).toFixed(2)} ${(stats.revenue.currency || 'PLN').toUpperCase()}`);
  }

  return lines.join('\n');
}

/**
 * Handle a callback_query (inline button press)
 * @param {object} query - Telegram callback_query object
 * @returns {Promise<void>}
 */
async function handleCallbackQuery(query) {
  const data = query.data;
  const chatId = query.message?.chat?.id;
  const callbackQueryId = query.id;

  if (!chatId || !data) {
    await answerCallbackQuery(callbackQueryId);
    return;
  }

  // Back to main menu
  if (data === 'm:back') {
    await sendMenuKeyboard(chatId);
    await answerCallbackQuery(callbackQueryId);
    return;
  }

  // Parse callback data:  m:<category>:<period>
  // Categories: o=orders, r=reservations, p=partner requests, j=job applications
  // Periods: t=today, w=week, m=month, a=all, menu=show sub-menu, back=main menu
  const match = data.match(/^m:([oprj]):(.+)$/);
  if (!match) {
    await answerCallbackQuery(callbackQueryId);
    return;
  }

  const [, category, period] = match;

  // Show sub-menu keyboard (period selection)
  if (period === 'menu') {
    const categoryLabels = { o: 'Orders', r: 'Reservations', p: 'Partner Requests', j: 'Job Applications' };
    await sendTelegramMessage(
      chatId,
      `📊 *${categoryLabels[category]} - Select period:*`,
      { reply_markup: PERIOD_KEYBOARD(category) }
    );
    await answerCallbackQuery(callbackQueryId);
    return;
  }

  // Validate period
  if (!['t', 'w', 'm', 'a'].includes(period)) {
    await answerCallbackQuery(callbackQueryId, 'Unknown period');
    return;
  }

  // Resolve tenant from chatId
  const tenant = await resolveTenantFromChat(chatId);
  if (!tenant) {
    await sendTelegramMessage(chatId, '❌ Your Telegram account is not linked to any business. Use /start to connect.');
    await answerCallbackQuery(callbackQueryId);
    return;
  }

  await answerCallbackQuery(callbackQueryId, '⏳ Loading…');

  try {
    let stats;
    switch (category) {
      case 'o':
        stats = await getOrderStats(tenant.tenantId, tenant.branchIds, period);
        break;
      case 'r':
        stats = await getReservationStats(tenant.tenantId, tenant.branchIds, period);
        break;
      case 'p':
        stats = await getPartnerRequestStats(tenant.tenantId, tenant.branchIds, period);
        break;
      case 'j':
        stats = await getJobApplicationStats(tenant.tenantId, tenant.branchIds, period);
        break;
      default:
        await sendTelegramMessage(chatId, '❓ Unknown category');
        return;
    }

    const report = buildReport(category, period, stats);
    await sendTelegramMessage(chatId, report, { reply_markup: BACK_KEYBOARD });
  } catch (err) {
    console.error('❌ Callback query error:', err);
    await sendTelegramMessage(chatId, '❌ Failed to load statistics. Please try again.');
  }
}

/**
 * Handle incoming Telegram update (webhook or polling)
 * @param {object} update - Telegram Update object
 * @returns {Promise<void>}
 */
async function handleUpdate(update) {
  // Safely handle different types of Telegram updates
  // See: https://core.telegram.org/bots/api#update

  // ─── Handle callback_query (inline button presses) ─────────────────────────
  if (update.callback_query) {
    try {
      await handleCallbackQuery(update.callback_query);
    } catch (err) {
      console.error('❌ handleCallbackQuery error:', err);
    }
    return;
  }

  // ─── Handle message updates ────────────────────────────────────────────────
  if (!update || !update.message) {
    // Log other update types for debugging but don't crash
    if (update) {
      const updateType = Object.keys(update).find(key => key !== 'update_id');
      if (updateType) {
        console.log(`📩 Received Telegram update type: ${updateType} (ignored)`);
      }
    }
    return;
  }

  // Only handle text messages
  if (!update.message.text) {
    console.log('📩 Received non-text message (ignored)');
    return;
  }

  const text = update.message.text.trim();
  const chatId = update.message.chat?.id;
  const from = update.message.from;

  // Validate required fields
  if (!chatId || !from) {
    console.warn('⚠️ Received message without chatId or from, skipping');
    return;
  }

  // ─── /menu command ─────────────────────────────────────────────────────────
  if (/^\/menu(?:@\w+)?$/.test(text)) {
    console.log(`📩 Received /menu from chat ${chatId}`);
    const tenant = await resolveTenantFromChat(chatId);
    if (!tenant) {
      await sendTelegramMessage(chatId, '❌ Your Telegram account is not linked to any business. Use /start to connect.');
      return;
    }
    await sendMenuKeyboard(chatId);
    return;
  }

  // ─── /start <token> (deep link for account linking) ────────────────────────
  const match = text.match(/^\/start(?:@\w+)?\s+(\S+)$/);
  if (!match) {
    // Unrecognized command or text - show menu if linked, otherwise hint to link
    const tenant = await resolveTenantFromChat(chatId);
    if (tenant) {
      await sendMenuKeyboard(chatId);
    } else {
      await sendTelegramMessage(chatId, '👋 Welcome! Please link your account from the admin panel to get started.');
    }
    return;
  }

  const token = match[1];
  console.log(`📩 Received /start with token for chat ${chatId}`);

  const user = await consumeLinkToken(token, chatId, from);
  if (user) {
    // Enable Telegram notifications for this tenant on first connect
    try {
      const settings = await TenantSettings.findOne({ tenantId: user.tenantId });
      if (settings) {
        if (!settings.notifications) settings.notifications = {};
        if (!settings.notifications.telegram) {
          settings.notifications.telegram = {
            enabled: true,
            events: { newOrder: true, newReservation: true, newJobApplication: true, newPartnerRequest: true },
            branchOverrides: [],
          };
        } else {
          settings.notifications.telegram.enabled = true;
        }
        await settings.save();
      }
    } catch (err) {
      console.error('Failed to enable Telegram notifications for tenant:', err.message);
    }

    // Build dynamic welcome message based on actual saved preferences
    const tenant = await TenantSettings.findOne({ tenantId: user.tenantId }).lean();
    const tenantName = tenant?.businessName || 'your tenant';
    const tg = tenant?.notifications?.telegram;
    const events = tg?.events || {};

    const enabledList = [];
    if (events.newOrder !== false) enabledList.push('• New orders 🛒');
    if (events.newReservation !== false) enabledList.push('• New reservations 🍽️');
    if (events.newJobApplication !== false) enabledList.push('• New job applications 💼');
    if (events.newPartnerRequest !== false) enabledList.push('• New partner requests 🤝');

    const notificationsText = enabledList.length > 0
      ? enabledList.join('\n')
      : '• No notifications enabled (configure in admin panel)';

    await sendTelegramMessage(
      chatId,
      `✅ *Telegram connected successfully!*\n\n` +
      `You're now linked to **${tenantName}**.\n` +
      `You'll receive notifications for:\n` +
      `${notificationsText}\n\n` +
      `📊 Type */menu* to view statistics & reports.\n` +
      `Manage preferences in your admin panel.`
    );
  } else {
    await sendTelegramMessage(
      chatId,
      `❌ *Invalid or expired link*\n\n` +
      `This link has expired or was already used.\n` +
      `Please generate a new link from your admin panel.`
    );
  }
}

/**
 * Check if tenant has Telegram notifications enabled for a specific event
 * @param {string} tenantId
 * @param {string} eventKey - 'newOrder' | 'newReservation' | 'newJobApplication' | 'newPartnerRequest'
 * @param {string} [branchId] - Optional branch ID for branch-specific override
 * @returns {Promise<boolean>}
 */
async function isEventEnabled(tenantId, eventKey, branchId) {
  const tenant = await TenantSettings.findOne({ tenantId }).select('notifications.telegram').lean();
  if (!tenant) {
    console.warn(`⚠️ [Telegram] No TenantSettings found for tenantId=${tenantId}`);
    return false;
  }
  if (!tenant?.notifications?.telegram?.enabled) {
    console.warn(`⚠️ [Telegram] Notifications disabled for tenantId=${tenantId} (telegram.enabled=${tenant?.notifications?.telegram?.enabled})`);
    return false;
  }

  const events = tenant.notifications.telegram.events;
  if (!events[eventKey]) {
    console.warn(`⚠️ [Telegram] Event "${eventKey}" disabled for tenantId=${tenantId} (events=${JSON.stringify(events)})`);
    return false;
  }

  // Check branch override
  if (branchId && tenant.notifications.telegram.branchOverrides?.length) {
    const override = tenant.notifications.telegram.branchOverrides.find(
      o => o.branchId?.toString() === branchId.toString()
    );
    if (override?.events && override.events[eventKey] === false) {
      console.warn(`⚠️ [Telegram] Event "${eventKey}" disabled by branch override for tenantId=${tenantId} branchId=${branchId}`);
      return false;
    }
  }

  return true;
}

/**
 * Get all TenantUsers for a tenant who have Telegram linked and should receive notifications
 * @param {string} tenantId
 * @returns {Promise<Array<{ _id, telegramChatId }>>}
 */
async function getLinkedUsers(tenantId) {
  const users = await TenantUser.find({
    tenantId,
    telegramChatId: { $ne: null, $exists: true },
    isActive: true,
  }).select('_id telegramChatId').lean();

  if (!users.length) {
    console.warn(`⚠️ [Telegram] No linked Telegram users found for tenantId=${tenantId}`);
  } else {
    console.log(`📩 [Telegram] Found ${users.length} linked user(s) for tenantId=${tenantId}: ${users.map(u => u.telegramChatId).join(', ')}`);
  }

  return users;
}

/**
 * Send notification to all linked users for a tenant (with branch filtering)
 * @param {string} tenantId
 * @param {string} eventKey
 * @param {string} text
 * @param {string} [branchId]
 * @returns {Promise<void>}
 */
async function broadcastToTenant(tenantId, eventKey, text, branchId) {
  console.log(`📤 [Telegram] broadcastToTenant called: tenantId=${tenantId} event=${eventKey} branchId=${branchId || 'none'}`);

  const enabled = await isEventEnabled(tenantId, eventKey, branchId);
  if (!enabled) {
    console.warn(`⛔ [Telegram] Skipping broadcast: event "${eventKey}" not enabled for tenantId=${tenantId}`);
    return;
  }

  const users = await getLinkedUsers(tenantId);
  if (!users.length) {
    console.warn(`⛔ [Telegram] Skipping broadcast: no linked users for tenantId=${tenantId}`);
    return;
  }

  console.log(`📤 [Telegram] Sending "${eventKey}" to ${users.length} user(s) for tenantId=${tenantId}`);
  const promises = users.map(u => sendTelegramMessage(u.telegramChatId, text));
  const results = await Promise.allSettled(promises);
  const succeeded = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - succeeded;
  console.log(`✅ [Telegram] broadcastToTenant complete: ${succeeded} sent, ${failed} failed`);
}

/**
 * Format and send New Order notification
 * @param {string} tenantId
 * @param {string} branchId
 * @param {object} order - Order document
 * @returns {Promise<void>}
 */
async function notifyNewOrder(tenantId, branchId, order) {
  const branch = await Branch.findById(branchId).select('name city').lean();
  const branchName = branch?.name || 'Unknown Branch';
  const branchCity = branch?.city || '';

  const text = [
    '🛒 *New Order*',
    '',
    `*Order:* #${order._id.toString().slice(-6)}`,
    `*Branch:* ${escapeMd(branchName)}${branchCity ? ` (${escapeMd(branchCity)})` : ''}`,
    `*Customer:* ${escapeMd(order.customer?.name)}`,
    `*Phone:* ${escapeMd(order.customer?.phone)}`,
    `*Total:* ${order.pricing?.total || 0} ${(order.pricing?.currency || 'PLN').toUpperCase()}`,
    `*Time:* ${new Date(order.createdAt).toLocaleString()}`,
    '',
    `[View in Admin](${process.env.FRONTEND_URL || 'https://app.gopublica.com'}/admin/orders/${order._id})`,
  ].join('\n');

  await broadcastToTenant(tenantId, 'newOrder', text, branchId);
}

/**
 * Format and send New Reservation notification
 * @param {string} tenantId
 * @param {string} branchId
 * @param {object} reservation - Reservation document
 * @returns {Promise<void>}
 */
async function notifyNewReservation(tenantId, branchId, reservation) {
  const branch = await Branch.findById(branchId).select('name city').lean();
  const branchName = branch?.name || 'Unknown Branch';
  const branchCity = branch?.city || '';

  const text = [
    '🍽️ *New Reservation*',
    '',
    `*Branch:* ${escapeMd(branchName)}${branchCity ? ` (${escapeMd(branchCity)})` : ''}`,
    `*Guest:* ${escapeMd(reservation.name)}`,
    `*Phone:* ${escapeMd(reservation.phone)}`,
    `*Date:* ${reservation.date} at ${reservation.time}`,
    `*Guests:* ${reservation.guests || '-'}`,
    `*Comment:* ${escapeMd(reservation.comment)}`,
    `*Time:* ${new Date(reservation.createdAt).toLocaleString()}`,
    '',
    `[View in Admin](${process.env.FRONTEND_URL || 'https://app.gopublica.com'}/admin/reservations/${reservation._id})`,
  ].join('\n');

  await broadcastToTenant(tenantId, 'newReservation', text, branchId);
}

/**
 * Format and send New Job Application notification
 * @param {string} tenantId
 * @param {string} branchId
 * @param {object} application - JobApplication document
 * @returns {Promise<void>}
 */
async function notifyNewJobApplication(tenantId, branchId, application) {
  let branchName = 'Main';
  let branchCity = '';

  if (branchId) {
    const branch = await Branch.findById(branchId).select('name city').lean();
    branchName = branch?.name || 'Unknown Branch';
    branchCity = branch?.city || '';
  } else {
    // Try to get tenant's default branch city
    const tenant = await TenantSettings.findOne({ tenantId }).select('address city').lean();
    branchCity = tenant?.city || '';
  }

  const fields = application.fields || new Map();
  const getField = (key) => fields.get(key) || '-';

  const text = [
    '💼 *New Job Application*',
    '',
    `*Branch:* ${escapeMd(branchName)}${branchCity ? ` (${escapeMd(branchCity)})` : ''}`,
    `*Applicant:* ${escapeMd(getField('fullName'))}`,
    `*Email:* ${escapeMd(getField('email'))}`,
    `*Phone:* ${escapeMd(getField('phone'))}`,
    `*Position:* ${escapeMd(getField('position'))}`,
    `*Resume:* ${application.resumeUrl ? 'Attached' : 'Not provided'}`,
    `*Time:* ${new Date(application.createdAt).toLocaleString()}`,
    '',
    `[View in Admin](${process.env.FRONTEND_URL || 'https://app.gopublica.com'}/admin/jobs/applications/${application._id})`,
  ].join('\n');

  await broadcastToTenant(tenantId, 'newJobApplication', text, branchId);
}

/**
 * Format and send New Partner Request (dynamic form) notification
 * @param {string} tenantId
 * @param {string} branchId
 * @param {object} application - JobApplication document (used for dynamic forms too)
 * @returns {Promise<void>}
 */
async function notifyNewPartnerRequest(tenantId, branchId, application) {
  let branchName = 'Main';
  let branchCity = '';

  if (branchId) {
    const branch = await Branch.findById(branchId).select('name city').lean();
    branchName = branch?.name || 'Unknown Branch';
    branchCity = branch?.city || '';
  }

  // Try to get the source section title
  let formTitle = 'Partner Form';
  if (application.sourceSectionId) {
    const BranchSection = require('../../models/BranchSection');
    const section = await BranchSection.findById(application.sourceSectionId).select('settings.title').lean();
    if (section?.settings?.title) formTitle = section.settings.title;
  }

  const fields = application.fields || new Map();
  const fieldLines = [];
  for (const [key, value] of fields) {
    if (value !== undefined && value !== null && value !== '') {
      fieldLines.push(`• ${escapeMd(key)}: ${escapeMd(value)}`);
    }
  }

  const text = [
    '🤝 *New Partner Request*',
    '',
    `*Branch:* ${escapeMd(branchName)}${branchCity ? ` (${escapeMd(branchCity)})` : ''}`,
    `*Form:* ${escapeMd(formTitle)}`,
    '',
    ...fieldLines,
    '',
    `*Time:* ${new Date(application.createdAt).toLocaleString()}`,
    '',
    `[View in Admin](${process.env.FRONTEND_URL || 'https://app.gopublica.com'}/admin/forms/submissions/${application._id})`,
  ].join('\n');

  await broadcastToTenant(tenantId, 'newPartnerRequest', text, branchId);
}

/**
 * Set webhook URL for the bot (call on startup)
 * @returns {Promise<boolean>}
 */
async function setWebhook() {
  const token = getBotToken();
  const webhookUrl = process.env.TENANT_TELEGRAM_WEBHOOK_URL;
  const secret = process.env.TENANT_TELEGRAM_WEBHOOK_SECRET;

  if (!token || !webhookUrl) {
    console.log('⚠️ Tenant Telegram webhook not configured (missing token or URL)');
    return false;
  }

  try {
    const url = `${TELEGRAM_API_BASE}/bot${token}/setWebhook`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ['message', 'callback_query', 'edited_message', 'channel_post', 'edited_channel_post'],
        drop_pending_updates: true,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      console.log('✅ Tenant Telegram webhook set:', webhookUrl);
      return true;
    } else {
      console.error('❌ Failed to set Tenant Telegram webhook:', data.description);
      return false;
    }
  } catch (err) {
    console.error('❌ Error setting Tenant Telegram webhook:', err.message);
    return false;
  }
}

/**
 * Delete webhook (for cleanup)
 * @returns {Promise<boolean>}
 */
async function deleteWebhook() {
  const token = getBotToken();
  if (!token) return false;

  try {
    const url = `${TELEGRAM_API_BASE}/bot${token}/deleteWebhook`;
    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();
    return data.ok;
  } catch (err) {
    console.error('❌ Error deleting Tenant Telegram webhook:', err.message);
    return false;
  }
}

module.exports = {
  // Core messaging
  sendTelegramMessage,

  // Token management
  generateLinkToken,
  validateLinkTokenFormat,
  consumeLinkToken,

  // Webhook handler
  handleUpdate,

  // Event notifications
  notifyNewOrder,
  notifyNewReservation,
  notifyNewJobApplication,
  notifyNewPartnerRequest,

  // Menu & inline keyboard
  sendMenuKeyboard,

  // Webhook management
  setWebhook,
  deleteWebhook,

  // Utility
  isEventEnabled,
  getLinkedUsers,
  broadcastToTenant,
};