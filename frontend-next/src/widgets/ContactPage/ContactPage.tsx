'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';

type FormState = 'idle' | 'sending' | 'success' | 'error';

interface FormData {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}

export default function ContactPage() {
    const t = useTranslations('contact');
    const [form, setForm] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });
    const [formState, setFormState] = useState<FormState>('idle');
    const formRef = useRef<HTMLFormElement>(null);

    // Используем t.raw() вместо returnObjects
    const subjects = t.raw('form.subjects') as string[];

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormState('sending');
        // TODO: реальный API
        await new Promise((r) => setTimeout(r, 1800));
        setFormState('success');
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    };

    const messengers = [
        {
            name: 'Telegram',
            icon: <FaTelegramPlane size={22} />,
            href: 'https://t.me/',
            label: '@yourhandle',
            color: '#2AABEE',
        },
        {
            name: 'WhatsApp',
            icon: <FaWhatsapp size={22} />,
            href: 'https://wa.me/4917612345678',
            label: '+49 176 12 345 678',
            color: '#25D366',
        },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans">
            {/* Hero */}
            <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)] px-6 py-20 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,color-mix(in_srgb,var(--primary-color)_8%,transparent),transparent_70%)] pointer-events-none" />
                <h1 className="relative text-4xl md:text-5xl font-bold tracking-tight mb-4">
                    {t('title')}
                </h1>
                <p className="relative max-w-lg mx-auto text-lg text-[var(--text-muted)]">
                    {t('subtitle')}
                </p>
            </section>

            {/* Main grid */}
            <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.4fr] gap-12 py-16 px-6">
                {/* Left: contact info */}
                <div className="space-y-10">
                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                            {t('messengerLabel')}
                        </span>
                        <div className="mt-3 flex gap-3">
                            {messengers.map((m) => (
                                <a
                                    key={m.name}
                                    href={m.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ '--m-color': m.color } as React.CSSProperties}
                                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 hover:shadow-md hover:border-[var(--m-color)] hover:-translate-y-0.5 transition-all flex-1"
                                >
                                    <span className="text-[var(--m-color)] flex shrink-0">
                                        {m.icon}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold">{m.name}</div>
                                        <div className="text-xs text-[var(--text-muted)] truncate">
                                            {m.label}
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                            {t('emailLabel')}
                        </span>
                        <a
                            href="mailto:support@gopublica.com"
                            className="mt-1 inline-flex items-center gap-2 text-lg font-medium text-[var(--primary-color)] hover:underline"
                        >
                            support@gopublica.com
                        </a>
                    </div>
                </div>

                {/* Right: form */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm lg:sticky lg:top-24">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold">{t('form.title')}</h2>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{t('form.subtitle')}</p>
                    </div>

                    {formState === 'success' ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 animate-[fadeUp_0.4s_ease-out_both]">
                            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-500 flex items-center justify-center text-2xl font-bold text-green-600">
                                ✓
                            </div>
                            <h3 className="text-xl font-bold">{t('form.successTitle')}</h3>
                            <p className="text-sm text-[var(--text-muted)]">{t('form.successText')}</p>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-[var(--primary-color)] text-white font-semibold hover:opacity-90 transition-opacity"
                                onClick={() => setFormState('idle')}
                            >
                                {t('form.sendMore')}
                            </button>
                        </div>
                    ) : (
                        <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label htmlFor="name" className="text-sm font-semibold text-[var(--text-muted)]">
                                        {t('form.name')}
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        placeholder={t('form.namePlaceholder')}
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        autoComplete="name"
                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-shadow"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-sm font-semibold text-[var(--text-muted)]">
                                        {t('form.email')}
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="hello@company.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        autoComplete="email"
                                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-shadow"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="phone" className="text-sm font-semibold text-[var(--text-muted)]">
                                    {t('form.phone')}
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+49 / +48"
                                    value={form.phone}
                                    onChange={handleChange}
                                    autoComplete="tel"
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-shadow"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="subject" className="text-sm font-semibold text-[var(--text-muted)]">
                                    {t('form.subject')}
                                </label>
                                <select
                                    id="subject"
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-shadow appearance-none bg-no-repeat bg-[length:12px] bg-[right_12px_center]"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3e%3cpath fill='%236b7280' d='M1 1l5 5 5-5'/%3e%3c/svg%3e")`,
                                    }}
                                >
                                    <option value="">{t('form.subjectPlaceholder')}</option>
                                    {subjects.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="message" className="text-sm font-semibold text-[var(--text-muted)]">
                                    {t('form.message')}
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows={5}
                                    placeholder={t('form.messagePlaceholder')}
                                    value={form.message}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] transition-shadow resize-y min-h-[100px]"
                                />
                            </div>

                            {formState === 'error' && (
                                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-600">
                                    {t('form.error')}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={formState === 'sending'}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--primary-color)] text-white py-3 font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
                            >
                                {formState === 'sending' ? (
                                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    t('form.submit')
                                )}
                            </button>

                            <p className="text-xs text-center text-[var(--text-muted)]">
                                {t('form.privacyStart')}
                                <a href="/privacy" className="text-[var(--primary-color)] hover:underline">
                                    {t('form.privacyLink')}
                                </a>
                                {t('form.privacyEnd')}
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}