import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[.045] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100">
      {children}
    </span>
  );
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  className?: string;
};

const buttonBase =
  'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-bold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70';

const buttonStyles = {
  primary:
    'bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(103,232,249,0.25)] hover:bg-cyan-200',
  secondary: 'border border-white/10 bg-white/5 text-white hover:border-cyan-300/30 hover:bg-cyan-300/10',
};

export function Button({ children, href, onClick, variant = 'primary', type = 'button', className = '' }: ButtonProps) {
  const classes = `${buttonBase} ${buttonStyles[variant]} ${className}`;

  if (href) {
    return (
      <a className={classes} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  );
}

export function CardAction({ children, className = '', ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${buttonBase} ${buttonStyles.secondary} ${className}`} {...props}>
      {children}
    </a>
  );
}

export function CardActionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`${buttonBase} ${buttonStyles.secondary} ${className}`}>{children}</span>;
}

export function MediaPlaceholder({ label = 'Image unavailable' }: { label?: string }) {
  return (
    <div className="flex h-full min-h-[12rem] w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/40 text-center">
      <div className="px-4">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-cyan-200">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-300">{label}</p>
        <p className="mt-1 text-xs text-slate-500">Select or re-save media from the admin dashboard.</p>
      </div>
    </div>
  );
}
