/**
 * Admin notification service.
 *
 * Sends a Telegram message to the sales/admin chat whenever a notable
 * public event happens (e.g. a new "Get a Free Demo" request).
 *
 * Env vars (set tomorrow in .env):
 *   TELEGRAM_BOT_TOKEN   — the bot token from @BotFather
 *   TELEGRAM_ADMIN_CHAT_ID — target chat/channel id (negative for channels)
 *
 * Until the env vars are present, every call gracefully falls back to a
 * console.log so the app never crashes today and "magically" starts
 * delivering messages once the keys are added.
 */

const TELEGRAM_API_BASE = 'https://api.telegram.org';

/**
 * Send a text message to the admin Telegram chat.
 * @param {string} text — message body (Markdown / plain text)
 * @returns {Promise<boolean>} true if sent, false if skipped/failed
 */
async function sendTelegramMessage(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    // Graceful fallback — do not crash, just log locally.
    console.log('🔔 [Telegram skipped — env not configured]', text);
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
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('❌ Telegram sendMessage failed:', res.status, errBody);
      return false;
    }

    return true;
  } catch (err) {
    // Network / runtime error — never let this break the user flow.
    console.error('❌ Telegram notification error:', err.message);
    return false;
  }
}

/**
 * Build a human-readable Markdown summary of a new DemoRequest
 * and push it to the admin Telegram chat.
 *
 * @param {import('../models/DemoRequest')} demoRequest
 */
async function notifyNewDemoRequest(demoRequest) {
  if (!demoRequest) return;

  const bt = demoRequest.businessType || {};
  const businessTypeLabel = bt.custom
    ? `Other: ${bt.custom}`
    : bt.preset || '—';

  const goals = demoRequest.goals || {};
  const goalsLabel = [
    ...(Array.isArray(goals.preset) ? goals.preset : []),
    goals.custom ? `Other: ${goals.custom}` : '',
  ]
    .filter(Boolean)
    .join(', ') || '—';

  const c = demoRequest.contact || {};
  const contactLines = [`• Name: ${c.name || '—'}`];

  if (demoRequest.contactMethod === 'telegram') {
    contactLines.push(`• Telegram: ${c.telegramHandle || '—'}`);
    if (c.phone) contactLines.push(`• Phone: ${c.phone}`);
  } else {
    contactLines.push(`• Phone: ${c.phone || '—'}`);
    if (c.preferredLanguage) contactLines.push(`• Language: ${c.preferredLanguage}`);
    if (c.bestTimeToCall) contactLines.push(`• Best time to call: ${c.bestTimeToCall}`);
  }

  const text = [
    '🎉 *New Demo Request*',
    '',
    `*Business type:* ${businessTypeLabel}`,
    `*Goals:* ${goalsLabel}`,
    `*Preferred contact:* ${demoRequest.contactMethod || '—'}`,
    '',
    '*Contact details:*',
    ...contactLines,
    '',
    `*Locale:* ${demoRequest.locale || '—'}`,
    `*ID:* \`${demoRequest._id}\``,
    `*Submitted:* ${new Date(demoRequest.createdAt || Date.now()).toISOString()}`,
  ].join('\n');

  await sendTelegramMessage(text);
}

module.exports = {
  sendTelegramMessage,
  notifyNewDemoRequest,
};
