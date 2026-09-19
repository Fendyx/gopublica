const axios = require('axios');

/**
 * Platform-level Furgonetka service.
 * Uses GoPublica's own credentials from .env (not per-tenant).
 */

function getPlatformAuthConfig() {
  return {
    clientId: process.env.PLATFORM_FURGONETKA_CLIENT_ID,
    clientSecret: process.env.PLATFORM_FURGONETKA_CLIENT_SECRET,
  };
}

function isSandbox() {
  return process.env.PLATFORM_FURGONETKA_ENV !== 'production';
}

function getApiUrl() {
  return isSandbox()
    ? 'https://api.sandbox.furgonetka.pl/packages'
    : 'https://api.furgonetka.pl/packages';
}

/**
 * Get OAuth access token from Furgonetka using platform credentials.
 */
async function getPlatformFurgonetkaToken() {
  const auth = getPlatformAuthConfig();
  if (!auth.clientId || !auth.clientSecret) {
    throw new Error('Platform Furgonetka credentials not configured');
  }

  const tokenUrl = isSandbox()
    ? 'https://sandbox.furgonetka.pl/oauth/token'
    : 'https://furgonetka.pl/oauth/token';

  const response = await axios.post(tokenUrl, {
    grant_type: 'client_credentials',
    client_id: auth.clientId,
    client_secret: auth.clientSecret,
  }, {
    headers: { 'Content-Type': 'application/json' },
  });

  return response.data.access_token;
}

/**
 * Create a Furgonetka shipment for a platform order (parcel locker delivery).
 * @param {Object} platformOrder - PlatformOrder document
 * @returns {Object} shipment result or null on failure
 */
async function createPlatformFurgonetkaShipment(platformOrder) {
  try {
    if (!platformOrder.fulfillment?.parcelLocker?.enabled || !platformOrder.fulfillment.parcelLocker.lockerId) {
      console.log('ℹ️ Order is not via parcel locker, skipping Furgonetka shipment.');
      return null;
    }

    const locker = platformOrder.fulfillment.parcelLocker;
    const accessToken = await getPlatformFurgonetkaToken();

    const receiver = platformOrder.buyerContact?.name
      ? platformOrder.buyerContact
      : platformOrder.fulfillment?.address?.name
        ? platformOrder.fulfillment.address
        : { name: platformOrder.tenantName || 'GoPublica Client', email: 'client@gopublica.com', phone: '' };

    const payload = {
      service: locker.network.toLowerCase(),
      point_id: locker.lockerId,
      receiver: {
        name: receiver.name || 'GoPublica Client',
        email: receiver.email || 'client@gopublica.com',
        phone: receiver.phone || '',
      },
    };

    console.log(`🚀 Creating Furgonetka shipment for platform order ${platformOrder._id} (${isSandbox() ? 'Sandbox' : 'Production'})...`);

    const response = await axios.post(getApiUrl(), payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    platformOrder.shipping = {
      provider: 'furgonetka',
      packageId: response.data.package_id || response.data.id,
      trackingNumber: response.data.tracking_number || response.data.waybill,
      labelUrl: response.data.label_url || response.data.pdf_url,
      status: 'created',
    };

    await platformOrder.save();
    console.log(`✅ Platform Furgonetka shipment created! Tracking: ${platformOrder.shipping.trackingNumber}`);
    return platformOrder.shipping;
  } catch (err) {
    console.error('❌ Platform Furgonetka Shipment Error:', err.response?.data || err.message);

    platformOrder.shipping = {
      provider: 'furgonetka',
      packageId: null,
      trackingNumber: null,
      labelUrl: null,
      status: 'error',
      error: err.response?.data ? JSON.stringify(err.response.data) : err.message,
    };
    await platformOrder.save();
    return null;
  }
}

module.exports = {
  getPlatformFurgonetkaToken,
  createPlatformFurgonetkaShipment,
};
