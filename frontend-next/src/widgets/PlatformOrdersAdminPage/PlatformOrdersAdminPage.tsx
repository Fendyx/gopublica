'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/shared/ui/Button';
import { Card, CardTitle, CardContent } from '@/shared/ui/Card';
import {
  fetchAllOrders,
  updateOrderStatus,
  markOrderAsPaid,
  updateOrderNotes,
} from '@/entities/platformOrder/api/ordersApi';
import type { PlatformOrder } from '@/entities/platformOrder/model/types';
import {
  Search, ShoppingCart, Package, Truck, CheckCircle, XCircle, Clock, CreditCard,
} from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-orange-100 text-orange-700',
};
const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function PlatformOrdersAdminPage() {
  const [orders, setOrders] = useState<PlatformOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');

  const loadOrders = async () => {
    try {
      const data = await fetchAllOrders({
        status: filterStatus || undefined,
        paymentMethod: filterPayment || undefined,
      });
      setOrders(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [filterStatus, filterPayment]);

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.tenantId.toLowerCase().includes(q) ||
        o.tenantName.toLowerCase().includes(q) ||
        o._id.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const selected = useMemo(
    () => orders.find((o) => o._id === selectedId) || null,
    [orders, selectedId]
  );

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const updated = await updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      const updated = await markOrderAsPaid(id);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleNotesChange = async (id: string, notes: string) => {
    try {
      const updated = await updateOrderNotes(id, notes);
      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-[var(--text-muted)]">Loading orders…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ─── LEFT: Order List ─── */}
      <div className="lg:w-1/2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Platform Orders
          </h1>
        </div>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        {/* Filters */}
        <div className="flex gap-2 mb-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs"
          >
            <option value="">All payments</option>
            <option value="stripe">Stripe</option>
            <option value="cash_on_delivery">Cash on Delivery</option>
          </select>
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tenant…"
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filtered.map((o) => (
            <div
              key={o._id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedId === o._id
                  ? 'border-[var(--primary-color)] bg-[var(--primary-color)]/5'
                  : 'border-[var(--border)] hover:border-[var(--primary-color)]/40'
              }`}
              onClick={() => setSelectedId(o._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {o.tenantName || o.tenantId}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {o.items.length} item{o.items.length !== 1 ? 's' : ''} ·{' '}
                    {o.pricing.currency} {o.pricing.total.toFixed(2)} ·{' '}
                    {o.paymentMethod === 'stripe' ? '💳 Stripe' : '📦 COD'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      ORDER_STATUS_COLORS[o.orderStatus] || ''
                    }`}
                  >
                    {o.orderStatus}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      PAYMENT_STATUS_COLORS[o.paymentStatus] || ''
                    }`}
                  >
                    {o.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">No orders found.</p>
          )}
        </div>
      </div>

      {/* ─── RIGHT: Order Detail ─── */}
      <div className="lg:w-1/2">
        <Card>
          <CardTitle className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4" />
            {selected ? `Order #${selected._id.slice(-8).toUpperCase()}` : 'Select an order'}
          </CardTitle>

          {selected && (
            <CardContent>
              <div className="space-y-4">
                {/* Tenant Info */}
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50">
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Tenant</p>
                  <p className="text-sm font-medium">{selected.tenantName || selected.tenantId}</p>
                  <p className="text-xs text-[var(--text-muted)]">ID: {selected.tenantId}</p>
                </div>

                {/* Items */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Items</p>
                  {selected.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-[var(--border)] last:border-0">
                      {item.photo && (
                        <img src={item.photo} alt="" className="w-10 h-10 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {selected.pricing.currency} {item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {selected.pricing.currency} {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[var(--text-muted)]">Subtotal</span>
                    <span>
                      {selected.pricing.currency} {selected.pricing.subtotal.toFixed(2)}
                    </span>
                  </div>
                  {selected.pricing.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--text-muted)]">Delivery</span>
                      <span>
                        {selected.pricing.currency} {selected.pricing.deliveryFee.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>
                      {selected.pricing.currency} {selected.pricing.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Buyer Info */}
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50">
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Buyer</p>
                  <p className="text-sm">{selected.buyerType === 'business' ? (selected.businessName || 'Business') : 'Private person'}</p>
                  {selected.buyerType === 'business' && selected.nip && (
                    <p className="text-xs text-[var(--text-muted)]">NIP: {selected.nip}</p>
                  )}
                </div>

                {/* Fulfillment */}
                <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50">
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Fulfillment</p>
                  <p className="text-sm">
                    {selected.fulfillment.type === 'parcel_locker'
                      ? `Paczkomaty — ${selected.fulfillment.parcelLocker?.lockerId || '—'}`
                      : selected.fulfillment.type === 'courier'
                      ? 'Courier (DPD)'
                      : 'Cash on Delivery'}
                  </p>
                  {selected.fulfillment.deliveryFee > 0 && (
                    <p className="text-xs text-[var(--text-muted)]">
                      Delivery fee: {selected.pricing.currency} {selected.fulfillment.deliveryFee.toFixed(2)}
                    </p>
                  )}
                  {selected.fulfillment.type === 'courier' && selected.fulfillment.address?.street && (
                    <p className="text-xs text-[var(--text-muted)]">
                      {selected.fulfillment.address.street}, {selected.fulfillment.address.city} {selected.fulfillment.address.zip}
                    </p>
                  )}
                  {selected.shipping?.trackingNumber && (
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Tracking: {selected.shipping.trackingNumber}
                    </p>
                  )}
                </div>

                {/* Status Controls */}
                <div>
                  <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Order Status</p>
                  <div className="flex flex-wrap gap-1">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(selected._id, s)}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          selected.orderStatus === s
                            ? 'bg-[var(--primary-color)] text-white border-[var(--primary-color)]'
                            : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--primary-color)]/40'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* COD Payment */}
                {selected.paymentMethod === 'cash_on_delivery' &&
                  selected.paymentStatus !== 'paid' && (
                    <div>
                      <Button
                        onClick={() => handleMarkPaid(selected._id)}
                        size="sm"
                      >
                        <CreditCard className="w-4 h-4 mr-1" /> Mark as Paid
                      </Button>
                    </div>
                  )}

                {/* Fulfillment Notes */}
                <div>
                  <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
                    Fulfillment Notes
                  </label>
                  <textarea
                    rows={2}
                    defaultValue={selected.fulfillmentNotes}
                    onBlur={(e) => handleNotesChange(selected._id, e.target.value)}
                    placeholder="Internal notes…"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm"
                  />
                </div>

                {/* Tenant Notes */}
                {selected.notes && (
                  <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]/50">
                    <p className="text-xs font-medium text-[var(--text-muted)] mb-1">Tenant Notes</p>
                    <p className="text-sm">{selected.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          )}

          {!selected && (
            <CardContent>
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                Select an order to view details.
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
