import { SiteChrome } from '@/components/layout/site-chrome';

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
