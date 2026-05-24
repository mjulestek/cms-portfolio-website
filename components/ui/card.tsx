import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-white/10 bg-white/[.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}>{children}</div>;
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">{children}</span>;
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
};

export function Button({ children, href, onClick, variant = 'primary', type = 'button' }: ButtonProps) {
  const className = `inline-flex rounded-2xl px-5 py-3 text-sm font-bold ${variant === 'primary' ? 'bg-cyan-300 text-slate-950' : 'border border-white/10 bg-white/5 text-white'}`;
  if (href) return <a className={className} href={href}>{children}</a>;
  return <button type={type} className={className} onClick={onClick}>{children}</button>;
}
