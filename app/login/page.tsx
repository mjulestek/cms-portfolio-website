'use client';
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button, Card } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (loading) return; setError('');
    if (!email.trim()) { setError('Email is required.'); return; }
    setLoading(true);
    try {
      const result = await signIn('email', { email: email.trim(), redirect: false, callbackUrl: '/admin/dashboard' });
      if (result?.error) { setError('Could not send sign-in link. Check your email address and try again.'); return; }
      setSent(true);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto flex min-h-[72vh] max-w-md items-center px-5 py-12">
      <Card className="w-full">
        {sent ? <div className="py-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-950 text-2xl text-white">✓</div><h1 className="mt-5 text-2xl font-black">Check your email</h1><p className="mt-2 text-neutral-600">A sign-in link has been sent to <span className="font-bold text-neutral-950">{email}</span>.</p><Button type="button" onClick={() => { setSent(false); setEmail(''); setError(''); }} className="mt-6">Use another email</Button></div> : (
          <form onSubmit={handleSubmit} className="grid gap-5">
            <div><p className="eyebrow">Admin</p><h1 className="mt-2 text-3xl font-black">Sign in</h1><p className="mt-2 text-sm text-neutral-600">Enter your admin email to receive a sign-in link.</p></div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" required className="input-base" />
            {error && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send sign-in link'}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
