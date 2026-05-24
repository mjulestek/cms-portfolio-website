'use client';
import Link from 'next/link';
export function CommandPalette({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  if (!open) return null;
  const items = [['Home','/'],['Projects','/projects'],['Blog','/blog'],['Contact','/contact'],['Admin','/admin/dashboard']];
  return (
    <div className="fixed inset-0 z-[60] bg-neutral-950/30 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div onClick={e => e.stopPropagation()} className="mx-auto mt-20 max-w-xl rounded-[2rem] border border-neutral-300 bg-white p-3 shadow-2xl">
        <input autoFocus placeholder="Type a command..." className="input-base" />
        <div className="mt-2 grid gap-1">
          {items.map(([label, href]) => <Link onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 text-sm font-black text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950" key={href} href={href}>{label}</Link>)}
        </div>
      </div>
    </div>
  );
}
