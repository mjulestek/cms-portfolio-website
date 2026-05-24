'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CommandPalette } from '@/components/ui/command-palette';
import type { FooterSettingsView, SimpleLink } from '@/lib/homepage-data';

type Props = { children: React.ReactNode };

const defaultFooter: FooterSettingsView = {
  logoText: 'Jules Munyaneza',
  location: 'Kigali, Rwanda',
  email: 'mjules.tek@gmail.com',
  linkedInUrl: 'https://www.linkedin.com/in/mjules-tek',
  copyrightText: '© 2026 Jules Munyaneza. All rights reserved.',
};

function isExternal(url: string) {
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:');
}

function SmartLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (isExternal(href)) return <a href={href} className={className} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>{children}</a>;
  return <Link href={href} className={className}>{children}</Link>;
}

const nav = [
  { href: '/projects', label: 'Projects' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
  { href: '/admin/dashboard', label: 'Admin' },
];

export function SiteChrome({ children }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [footer, setFooter] = useState<FooterSettingsView>(defaultFooter);
  const [footerNav, setFooterNav] = useState<SimpleLink[]>([]);
  const [legalLinks, setLegalLinks] = useState<SimpleLink[]>([]);
  const [socials, setSocials] = useState<SimpleLink[]>([]);

  useEffect(() => {
    let mounted = true;
    fetch('/api/homepage', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!mounted || !data) return;
        setFooter(data.footer ?? defaultFooter);
        setFooterNav(data.footerNav ?? []);
        setLegalLinks(data.legalLinks ?? []);
        setSocials(data.socials ?? []);
      })
      .catch(() => undefined);
    return () => { mounted = false; };
  }, []);
  const isAdmin = pathname?.startsWith('/admin');
  const hideFooter = isAdmin || pathname?.startsWith('/login');

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f3] text-neutral-950">
      <header className="sticky top-0 z-50 border-b border-neutral-300 bg-[#f8f7f3]/90 backdrop-blur-xl">
        <div className="app-container flex h-16 items-center justify-between gap-4">
          <Link href="/" className="text-base font-black tracking-tight text-neutral-950">
            Jules Munyaneza <span className="ml-1 rounded-full border border-neutral-300 px-2 py-0.5 text-xs uppercase tracking-[0.14em]">CMS</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(item => {
              const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
              return <Link key={item.href} href={item.href} className={`rounded-full px-4 py-2 text-sm font-bold transition ${active ? 'bg-neutral-950 text-white' : 'text-neutral-700 hover:bg-white hover:text-neutral-950'}`}>{item.label}</Link>;
            })}
          </nav>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPaletteOpen(true)} className="hidden rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm font-black transition hover:border-neutral-950 sm:inline-flex">⌘K</button>
            <button type="button" onClick={() => setMenuOpen(v => !v)} className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm font-black transition hover:border-neutral-950 md:hidden">Menu</button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-neutral-300 bg-white px-5 py-3 md:hidden">
            <div className="grid gap-2">
              {nav.map(item => <Link key={item.href} onClick={() => setMenuOpen(false)} href={item.href} className="rounded-2xl px-4 py-3 text-sm font-black hover:bg-neutral-100">{item.label}</Link>)}
            </div>
          </nav>
        )}
      </header>
      <main className="min-w-0">{children}</main>
      {!hideFooter && <PublicFooter footer={footer} footerNav={footerNav} legalLinks={legalLinks} socials={socials} />}
      <CommandPalette open={paletteOpen} setOpen={setPaletteOpen} />
    </div>
  );
}

function PublicFooter({ footer, footerNav, legalLinks, socials }: { footer: FooterSettingsView; footerNav: SimpleLink[]; legalLinks: SimpleLink[]; socials: SimpleLink[] }) {
  const grouped = footerNav.reduce<Record<string, SimpleLink[]>>((acc, link) => {
    const key = link.column || 'Navigation';
    acc[key] = [...(acc[key] ?? []), link];
    return acc;
  }, {});

  return (
    <footer className="app-container pb-10 pt-20">
      <div className="grid gap-12 border border-neutral-950 bg-white p-8 sm:p-10 lg:grid-cols-[1.3fr_1fr_1fr] lg:p-14">
        <div>
          <Link href="/" className="text-3xl font-black italic tracking-tight">{footer.logoText || 'Jules Munyaneza'}</Link>
          <div className="mt-10 grid gap-6 text-sm leading-6 text-neutral-800">
            {footer.location && <div><p className="font-black">Location</p><p>{footer.location}</p></div>}
            {footer.email && <div><p className="font-black">Email</p><a className="underline underline-offset-4" href={`mailto:${footer.email}`}>{footer.email}</a></div>}
            {footer.linkedInUrl && <a className="underline underline-offset-4" href={footer.linkedInUrl} target="_blank" rel="noreferrer">LinkedIn</a>}
          </div>
          {socials.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {socials.map(link => (
                <SmartLink key={link.id} href={link.url} className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-neutral-300 bg-white px-3 text-xs font-black transition hover:border-neutral-950">
                  {link.iconUrl ? <img src={link.iconUrl} alt={link.label} className="h-5 w-5 object-contain grayscale" /> : (link.platform ?? link.label).slice(0, 2)}
                </SmartLink>
              ))}
            </div>
          )}
        </div>
        {Object.entries(grouped).slice(0, 2).map(([column, links]) => (
          <div key={column} className="grid content-start gap-5">
            <h3 className="text-sm font-black">{column}</h3>
            {links.map(link => <SmartLink key={link.id} href={link.url} className="text-sm font-black text-neutral-800 hover:underline">{link.label}</SmartLink>)}
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-col justify-between gap-5 text-sm text-neutral-700 md:flex-row md:items-center">
        <p>{footer.copyrightText}</p>
        <div className="flex flex-wrap gap-6">
          {legalLinks.map(link => <SmartLink key={link.id} href={link.url} className="underline underline-offset-4 hover:text-neutral-950">{link.label}</SmartLink>)}
        </div>
      </div>
    </footer>
  );
}
