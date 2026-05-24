import type { Metadata } from 'next';
import './globals.css';
import { SiteShell } from '@/components/layout/site-shell';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Jules Munyaneza — Cloud & DevOps Engineer', template: '%s | Jules Munyaneza' },
  description: 'Premium portfolio CMS for Cloud, DevOps, SRE, AWS, Terraform, CI/CD and observability case studies.',
  openGraph: { title: 'Jules Munyaneza — Cloud & DevOps Engineer', description: 'Cloud & DevOps engineering portfolio and CMS.', url: '/', siteName: 'Jules Munyaneza Portfolio', images: [{ url: '/og/jules-cloud-devops.svg', width: 1200, height: 630 }], type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Jules Munyaneza — Cloud & DevOps Engineer', images: ['/og/jules-cloud-devops.svg'] },
  robots: { index: true, follow: true }
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body><SiteShell>{children}</SiteShell></body></html>;
}
