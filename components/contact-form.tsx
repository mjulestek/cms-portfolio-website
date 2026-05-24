'use client';

import React, { useState } from 'react';
import { Button, Card } from '@/components/ui/card';

interface FormState { name: string; email: string; subject: string; message: string; company: string; }
const empty: FormState = { name: '', email: '', subject: '', message: '', company: '' };

export function ContactForm() {
  const [form, setForm] = useState<FormState>(empty);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(''); setSuccess(false); setLoading(true);
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error?.message ?? data?.message ?? 'Something went wrong. Please try again.'); return; }
      setSuccess(true); setForm(empty);
    } catch { setError('Network error. Please check your connection and try again.'); }
    finally { setLoading(false); }
  }

  if (success) return (
    <Card>
      <div className="py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-neutral-950 bg-neutral-950 text-2xl text-white">✓</div>
        <h2 className="mt-5 text-2xl font-black">Message received</h2>
        <p className="mt-2 text-neutral-600">Thanks — Jules will follow up soon.</p>
        <Button type="button" onClick={() => setSuccess(false)} className="mt-6">Send another message</Button>
      </div>
    </Card>
  );

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-5">
        <label className="label-base">Name<input value={form.name} onChange={set('name')} placeholder="Your name" required minLength={2} maxLength={120} className="input-base" /></label>
        <label className="label-base">Email<input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required maxLength={200} className="input-base" /></label>
        <label className="label-base">Subject<input value={form.subject} onChange={set('subject')} placeholder="Project, collaboration, or question" required minLength={3} maxLength={200} className="input-base" /></label>
        <label className="label-base">Message<textarea value={form.message} onChange={set('message')} placeholder="Tell me what you are building..." required minLength={10} maxLength={5000} className="input-base min-h-40" /></label>
        <input type="text" name="company" value={form.company} onChange={set('company')} tabIndex={-1} aria-hidden="true" className="hidden" autoComplete="off" />
        {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send message'}</Button>
      </form>
    </Card>
  );
}
