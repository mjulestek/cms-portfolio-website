'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
  company: string;
}

const empty: FormState = {
  name: '',
  email: '',
  subject: '',
  message: '',
  company: '',
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(empty);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
    };
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error?.message ?? data?.message ?? 'Something went wrong. Please try again.');
        return;
      }

      setSuccess(true);
      setForm(empty);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <Card>
        <div className="py-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-300 text-3xl text-slate-950">
            ✓
          </div>
          <h2 className="mt-4 text-2xl font-black text-white">Message received</h2>
          <p className="text-slate-400">Thanks — Jules will follow up soon.</p>

          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="mt-6 rounded-2xl bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-200"
          >
            Send another message
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1 text-sm text-slate-300">
          Name
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="Name"
            required
            minLength={2}
            maxLength={120}
            className="rounded-2xl bg-slate-950/60 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-cyan-300/50"
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-300">
          Email
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="Email"
            required
            maxLength={200}
            className="rounded-2xl bg-slate-950/60 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-cyan-300/50"
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-300">
          Subject
          <input
            value={form.subject}
            onChange={set('subject')}
            placeholder="Subject"
            required
            minLength={3}
            maxLength={200}
            className="rounded-2xl bg-slate-950/60 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-cyan-300/50"
          />
        </label>

        <label className="grid gap-1 text-sm text-slate-300">
          Message
          <textarea
            value={form.message}
            onChange={set('message')}
            placeholder="Message"
            required
            minLength={10}
            maxLength={5000}
            className="min-h-36 rounded-2xl bg-slate-950/60 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-cyan-300/50"
          />
        </label>

        {/* Honeypot field for bots */}
        <input
          type="text"
          name="company"
          value={form.company}
          onChange={set('company')}
          tabIndex={-1}
          aria-hidden="true"
          className="hidden"
          autoComplete="off"
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
          {loading ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </Card>
  );
}