'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CommandPalette } from '@/components/ui/command-palette';

export function SiteShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen overflow-x-hidden bg-white text-slate-950 dark:bg-[#050814] dark:text-slate-100">
        <Background />
        <header className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-black text-black dark:text-white">
              Jules Munyaneza<span className="ml-2 text-cyan-500 dark:text-cyan-300">CMS</span>
            </Link>
            <nav className="hidden gap-2 md:flex">
              <Link className="nav" href="/projects">Projects</Link>
              <Link className="nav" href="/blog">Blog</Link>
              <Link className="nav" href="/contact">Contact</Link>
              <Link className="nav" href="/admin/dashboard">Admin</Link>
            </nav>
            <div className="flex gap-2">
              <button onClick={() => setOpen(true)} className="rounded-2xl border border-black/10 px-3 py-2 text-sm dark:border-white/10">⌘K</button>
              <button onClick={() => setDark(!dark)} className="rounded-2xl border border-black/10 px-3 py-2 text-sm dark:border-white/10">{dark ? 'Light' : 'Dark'}</button>
            </div>
          </div>
        </header>
        <main className="relative z-10">{children}</main>
        <CommandPalette open={open} setOpen={setOpen} />
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden dark:block hidden">
      <div className="absolute left-1/2 top-[-10rem] h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute right-[-12rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-blue-600/15 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,.08)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
    </div>
  );
}
