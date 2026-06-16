// Позже заменить на SMS/Telegram
module.exports = {
  notifyNewOrder(order) {
    console.log(`📢 New order #${order._id} for tenant ${order.tenantId}. Status: ${order.status}`);
  },
  notifyOrderAccepted(order) {
    console.log(`✅ Order #${order._id} accepted.`);
  },
  notifyOrderDeclined(order, reason) {
    console.log(`❌ Order #${order._id} declined. Reason: ${reason}`);
  },
};