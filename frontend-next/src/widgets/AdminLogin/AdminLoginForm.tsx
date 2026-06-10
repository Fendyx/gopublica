'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AdminLoginForm() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      // Бекенд возвращает { token, user: { id, name, email, role } }
      login(data.token, data.user);
      router.push('/admin/leads'); // или '/admin/dashboard'
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Login</h1>
        {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
          <div>
            <label className="text-sm font-semibold">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          </div>
          <div>
            <label className="text-sm font-semibold">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full mt-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-lg bg-[var(--primary-color)] text-white py-2.5 font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}