import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchClient, updateClient,
  createChangeRequest, updateChangeRequest, deleteChangeRequest,
  type Client, type ChangeRequest,
} from '../../../features/clients/api/clientsApi';

const CR_STATUS_COLOR: Record<string, string> = {
  new:         '#2563eb',
  approved:    '#7c3aed',
  in_progress: '#d97706',
  done:        '#16a34a',
  rejected:    '#dc2626',
};

const CR_STATUSES = ['new', 'approved', 'in_progress', 'done', 'rejected'] as const;
const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient]   = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Change request form
  const [showCRForm, setShowCRForm] = useState(false);
  const [crForm, setCrForm] = useState({
    title: '', description: '', price: 0,
    billable: false, priority: 'Medium' as const, assignedTo: '',
  });
  const [savingCR, setSavingCR] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchClient(id)
      .then(setClient)
      .catch(() => setError('Failed to load client'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCreateCR = async () => {
    if (!id || !crForm.title.trim()) return;
    setSavingCR(true);
    try {
      const created = await createChangeRequest({ ...crForm, clientId: id, status: 'new' });
      setClient(prev => prev ? {
        ...prev,
        changeRequests: [created, ...(prev.changeRequests || [])],
      } : null);
      setCrForm({ title: '', description: '', price: 0, billable: false, priority: 'Medium', assignedTo: '' });
      setShowCRForm(false);
    } catch { setError('Failed to create request'); }
    finally { setSavingCR(false); }
  };

  const handleCRStatusChange = async (crId: string, status: ChangeRequest['status']) => {
    try {
      const updated = await updateChangeRequest(crId, { status });
      setClient(prev => prev ? {
        ...prev,
        changeRequests: prev.changeRequests?.map(r => r._id === crId ? updated : r),
      } : null);
    } catch { setError('Failed to update request'); }
  };

  const handleDeleteCR = async (crId: string) => {
    if (!window.confirm('Delete this request?')) return;
    try {
      await deleteChangeRequest(crId);
      setClient(prev => prev ? {
        ...prev,
        changeRequests: prev.changeRequests?.filter(r => r._id !== crId),
      } : null);
    } catch { setError('Failed to delete request'); }
  };

  const inputStyle = {
    width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb',
    borderRadius: '6px', outline: 'none', fontSize: '14px', boxSizing: 'border-box' as const,
  };
  const labelStyle = {
    display: 'block', fontSize: '11px', fontWeight: 600 as const,
    color: '#6b7280', marginBottom: '5px',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  };
  const cardStyle = {
    background: 'white', border: '1px solid #e5e7eb',
    borderRadius: '12px', padding: '24px', marginBottom: '20px',
  };

  if (loading) return <div style={{ padding: '40px', color: '#9ca3af' }}>Loading...</div>;
  if (!client) return <div style={{ padding: '40px', color: '#dc2626' }}>Client not found</div>;

  const sub = client.subscription;

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#6b7280' }}>
        <Link to="/admin/clients" style={{ color: '#6b7280', textDecoration: 'none' }}>
          Clients
        </Link>
        {' / '}
        <span style={{ color: '#111827', fontWeight: 500 }}>{client.name}</span>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error}
          <button onClick={() => setError('')} style={{ marginLeft: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* Client info */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0' }}>{client.name}</h2>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              {client.businessType} · {client.country || 'No country'}
            </p>
          </div>
          <span style={{
            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
            background: client.status === 'active' ? '#dcfce7' : '#fee2e2',
            color: client.status === 'active' ? '#15803d' : '#dc2626',
          }}>
            {client.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { label: 'Phone',    value: client.phone },
            { label: 'Email',    value: client.email || '—' },
            { label: 'Assigned', value: client.assignedTo || '—' },
            { label: 'Client since', value: fmt(client.createdAt) },
            { label: 'Website',  value: client.websiteUrl },
            { label: 'Source',   value: client.source || '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ margin: 0, ...labelStyle }}>{label}</p>
              {label === 'Website' && value && value !== '—' ? (
                <a href={value} target="_blank" rel="noreferrer"
                  style={{ color: '#2563eb', fontSize: '14px', fontWeight: 500 }}>
                  🔗 {value}
                </a>
              ) : (
                <p style={{ margin: '3px 0 0 0', fontWeight: 500, fontSize: '14px' }}>{value}</p>
              )}
            </div>
          ))}
        </div>

        {client.notes && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 4px 0', ...labelStyle }}>Notes</p>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>{client.notes}</p>
          </div>
        )}
      </div>

      {/* Subscription (новая модель) */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 20px 0' }}>Subscription</h3>
        {sub ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div>
              <p style={{ margin: 0, ...labelStyle }}>Plan</p>
              <p style={{ margin: '3px 0 0 0', fontWeight: 600, fontSize: '15px' }}>
                {sub.subscriptionPlan !== 'none' ? sub.subscriptionPlan.toUpperCase() : 'None'}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, ...labelStyle }}>Status</p>
              <p style={{ margin: '3px 0 0 0', fontWeight: 600, fontSize: '15px' }}>
                {sub.subscriptionStatus}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, ...labelStyle }}>Next Billing</p>
              <p style={{ margin: '3px 0 0 0', fontWeight: 600, fontSize: '15px' }}>
                {sub.currentPeriodEnd ? fmt(sub.currentPeriodEnd) : '—'}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, ...labelStyle }}>Stripe ID</p>
              <p style={{ margin: '3px 0 0 0', fontWeight: 500, fontSize: '13px', color: '#6b7280' }}>
                {sub.stripeSubscriptionId || '—'}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No subscription found.</p>
        )}
      </div>

      {/* Change Requests */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>
            Change Requests
            <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 400, color: '#9ca3af' }}>
              ({client.changeRequests?.length || 0})
            </span>
          </h3>
          <button onClick={() => setShowCRForm(v => !v)}
            style={{ padding: '7px 14px', background: 'black', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
            {showCRForm ? '✕ Cancel' : '+ New Request'}
          </button>
        </div>

        {showCRForm && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Title *</label>
                <input style={inputStyle} type="text" placeholder="e.g. Add new dish to menu"
                  value={crForm.title}
                  onChange={e => setCrForm({ ...crForm, title: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea rows={2} style={{ ...inputStyle, resize: 'vertical' }}
                  placeholder="More details..."
                  value={crForm.description}
                  onChange={e => setCrForm({ ...crForm, description: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Price (€) — 0 if included</label>
                <input style={inputStyle} type="number" min={0}
                  value={crForm.price}
                  onChange={e => setCrForm({ ...crForm, price: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select style={{ ...inputStyle, background: 'white' }}
                  value={crForm.priority}
                  onChange={e => setCrForm({ ...crForm, priority: e.target.value as any })}>
                  {['Low', 'Medium', 'High'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Assigned To</label>
                <input style={inputStyle} type="text" placeholder="Andrii"
                  value={crForm.assignedTo}
                  onChange={e => setCrForm({ ...crForm, assignedTo: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                <input type="checkbox" id="billable" checked={crForm.billable}
                  onChange={e => setCrForm({ ...crForm, billable: e.target.checked })} />
                <label htmlFor="billable" style={{ fontSize: '14px', cursor: 'pointer' }}>
                  Billable (extra charge)
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCreateCR} disabled={savingCR || !crForm.title.trim()}
                style={{ padding: '8px 16px', background: 'black', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                {savingCR ? 'Saving...' : 'Save Request'}
              </button>
              <button onClick={() => setShowCRForm(false)}
                style={{ padding: '8px 16px', background: 'white', color: '#374151', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {!client.changeRequests?.length ? (
          <p style={{ color: '#9ca3af', fontSize: '14px' }}>No change requests yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {client.changeRequests.map(cr => (
              <div key={cr._id} style={{
                border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 16px',
                borderLeft: `4px solid ${CR_STATUS_COLOR[cr.status] || '#e5e7eb'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{cr.title}</span>
                      {cr.billable && cr.price > 0 && (
                        <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px' }}>
                          €{cr.price}
                        </span>
                      )}
                      {!cr.billable && (
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                          included
                        </span>
                      )}
                    </div>
                    {cr.description && (
                      <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280' }}>{cr.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>{fmt(cr.createdAt)}</span>
                      {cr.assignedTo && <span style={{ fontSize: '12px', color: '#6b7280' }}>👤 {cr.assignedTo}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '12px' }}>
                    <select
                      value={cr.status}
                      onChange={e => handleCRStatusChange(cr._id, e.target.value as any)}
                      style={{
                        border: `1px solid ${CR_STATUS_COLOR[cr.status]}40`,
                        background: CR_STATUS_COLOR[cr.status] + '12',
                        color: CR_STATUS_COLOR[cr.status],
                        borderRadius: '6px', padding: '4px 8px',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {CR_STATUSES.map(s => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
                    <button onClick={() => handleDeleteCR(cr._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px', padding: '2px 4px' }}>
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}