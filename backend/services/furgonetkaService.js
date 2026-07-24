const axios = require('axios');

/**
 * Получение OAuth токена доступа для Фургонетки
 */
async function getFurgonetkaAccessToken(authConfig, isSandbox) {
  try {
    const tokenUrl = isSandbox
      ? 'https://sandbox.furgonetka.pl/oauth/token'
      : 'https://furgonetka.pl/oauth/token';

    const response = await axios.post(tokenUrl, {
      grant_type: 'client_credentials',
      client_id: authConfig.clientId,
      client_secret: authConfig.clientSecret,
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data.access_token;
  } catch (err) {
    console.error('❌ Furgonetka Auth Error:', err.response?.data || err.message);
    throw new Error('Failed to authenticate with Furgonetka API');
  }
}

/**
 * Создание отправки (накладной) в Фургонетке после успешной оплаты
 */
async function createFurgonetkaShipment(order, tenant) {
  try {
    // Проверяем, включена ли логистика Фургонетки у тенанта
    if (!tenant.logistics || tenant.logistics.provider !== 'furgonetka') {
      console.log('ℹ️ Furgonetka logistics is not active for this tenant.');
      return;
    }

    const authConfig = tenant.logistics.auth;
    if (!authConfig?.clientId || !authConfig?.clientSecret) {
      console.warn('⚠️ Furgonetka credentials (clientId/clientSecret) are missing in tenant settings.');
      return;
    }

    // Проверяем, выбран ли пачкомат для этого заказа
    if (!order.fulfillment?.parcelLocker?.enabled || !order.fulfillment.parcelLocker.lockerId) {
      console.log('ℹ️ Order fulfillment is not via parcel locker, skipping Furgonetka shipment creation.');
      return;
    }

    // Определяем окружение (sandbox / production)
    // Можно регулировать через переменные среды или настройки тенанта
    const isSandbox = process.env.NODE_ENV !== 'production' || tenant.logistics.env === 'sandbox';
    
    const apiUrl = isSandbox
      ? 'https://api.sandbox.furgonetka.pl/packages'
      : 'https://api.furgonetka.pl/packages';

    // Получаем актуальный access token
    const accessToken = await getFurgonetkaAccessToken(authConfig, isSandbox);

    const locker = order.fulfillment.parcelLocker;

    // Формируем полезную нагрузку для API Фургонетки
    const payload = {
      service: locker.network.toLowerCase(), // например: 'inpost', 'orlen', 'dpd'
      point_id: locker.lockerId,             // код пункта/пачкомата (например, WAW01M)
      receiver: {
        name: order.customer.name,
        email: order.customer.email || 'client@gopublica.com',
        phone: order.customer.phone,
      },
      // Дополнительные параметры при необходимости (напр. габариты, кодирование наложенного платежа и т.д.)
    };

    console.log(`🚀 Sending shipment request to Furgonetka (${isSandbox ? 'Sandbox' : 'Production'})...`);

    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Успешно создано — сохраняем трек-номер и ссылку на этикетку в заказ
    order.shipping = {
      provider: 'furgonetka',
      packageId: response.data.package_id || response.data.id,
      trackingNumber: response.data.tracking_number || response.data.waybill,
      labelUrl: response.data.label_url || response.data.pdf_url,
      status: 'created',
    };

    await order.save();
    console.log(`✅ Furgonetka shipment successfully created! Tracking: ${order.shipping.trackingNumber}`);

  } catch (err) {
    console.error('❌ Furgonetka Shipment Creation Error:', err.response?.data || err.message);
    
    // Фиксируем ошибку в заказе, чтобы администратор ресторана видел её в админке
    order.shipping = {
      provider: 'furgonetka',
      status: 'error',
      error: typeof err.response?.data === 'string' ? err.response.data : JSON.stringify(err.response?.data || err.message),
    };
    await order.save();
  }
}

module.exports = { createFurgonetkaShipment, getFurgonetkaAccessToken };