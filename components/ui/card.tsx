import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`app-container ${className}`}>{children}</div>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 overflow-hidden rounded-[2rem] border border-neutral-300 bg-white p-6 shadow-sm ${className}`}>{children}</div>;
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' }) {
  const styles = {
    neutral: 'border-neutral-300 bg-neutral-100 text-neutral-900',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    danger: 'border-rose-200 bg-rose-50 text-rose-800',
  };
  return <span className={`inline-flex max-w-full items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${styles[tone]}`}>{children}</span>;
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  className?: string;
  disabled?: boolean;
};

const buttonBase = 'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-black transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f7f3] disabled:cursor-not-allowed disabled:opacity-60';
const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'border border-neutral-950 bg-neutral-950 text-white hover:bg-white hover:text-neutral-950',
  secondary: 'border border-neutral-300 bg-white text-neutral-950 hover:border-neutral-950',
  ghost: 'border border-transparent bg-transparent text-neutral-950 hover:bg-neutral-100',
  danger: 'border border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-700',
};

export function Button({ children, href, onClick, variant = 'primary', type = 'button', className = '', disabled }: ButtonProps) {
  const classes = `${buttonBase} ${buttonStyles[variant]} ${className}`;
  if (href) return <a className={classes} href={href}>{children}</a>;
  return <button type={type} className={classes} onClick={onClick} disabled={disabled}>{children}</button>;
}

export function CardAction({ children, className = '', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={`${buttonBase} ${buttonStyles.secondary} ${className}`} {...props}>{children}</a>;
}

export function CardActionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`${buttonBase} ${buttonStyles.secondary} ${className}`}>{children}</span>;
}

export function MediaPlaceholder({ label = 'Image unavailable' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[12rem] w-full items-center justify-center border border-dashed border-neutral-300 bg-neutral-100 text-center text-neutral-400">
      <div className="px-4">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-neutral-400 shadow-sm">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-neutral-500">{label}</p>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="app-container py-12 sm:py-16 lg:py-20">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="lead">{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <Card className="text-center">
      <h2 className="text-2xl font-black text-neutral-950">{title}</h2>
      {message && <p className="mx-auto mt-2 max-w-xl text-neutral-600">{message}</p>}
    </Card>
  );
}
