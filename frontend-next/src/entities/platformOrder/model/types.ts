export interface PlatformOrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  photo: string;
}

export interface PlatformOrderFulfillmentAddress {
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  zip: string;
}

export interface PlatformOrderFulfillment {
  type: 'parcel_locker' | 'courier' | 'cash_on_delivery';
  parcelLocker: {
    enabled: boolean;
    lockerId: string;
    network: string;
    address: PlatformOrderFulfillmentAddress;
  };
  address: PlatformOrderFulfillmentAddress;
  deliveryFee: number;
}

export interface PlatformOrderShipping {
  provider: string | null;
  packageId: string | null;
  trackingNumber: string | null;
  labelUrl: string | null;
  status: 'pending' | 'created' | 'error';
  error: string | null;
}

export interface PlatformOrderPricing {
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
}

export interface PlatformOrder {
  _id: string;
  tenantId: string;
  tenantName: string;
  buyerType: 'private' | 'business';
  businessName: string;
  nip: string;
  items: PlatformOrderItem[];
  paymentMethod: 'stripe' | 'cash_on_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  fulfillment: PlatformOrderFulfillment;
  pricing: PlatformOrderPricing;
  shipping: PlatformOrderShipping;
  stripePaymentIntentId?: string;
  notes: string;
  fulfillmentNotes: string;
  createdAt: string;
  updatedAt: string;
}
