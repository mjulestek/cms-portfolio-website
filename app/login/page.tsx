'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('email', {
        email: email.trim(),
        redirect: false,
        callbackUrl: '/admin/dashboard',
      });

      if (result?.error) {
        setError('Could not send sign-in link. Check your email address and try again.');
        return;
      }

      setSent(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-4 py-12">
      <Card className="w-full">
        {sent ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-300 text-3xl text-slate-950">
              ✓
            </div>

            <h1 className="mt-4 text-2xl font-black text-white">Check your email</h1>

            <p className="mt-2 text-slate-400">
              A sign-in link has been sent to{' '}
              <span className="text-white">{email}</span>.
            </p>

            <button
              type="button"
              onClick={() => {
                setSent(false);
                setEmail('');
                setError('');
              }}
              className="mt-6 rounded-2xl bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Use another email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-cyan-300">Admin</p>
              <h1 className="mt-1 text-3xl font-black text-white">Sign in</h1>
              <p className="mt-1 text-sm text-slate-400">
                Enter your admin email to receive a sign-in link.
              </p>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="rounded-2xl bg-slate-950/60 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-cyan-300/50"
            />

            {error && (
              <p className="rounded-xl bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}