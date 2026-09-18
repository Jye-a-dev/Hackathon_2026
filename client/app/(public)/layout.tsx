import type { ReactNode } from 'react';
import PublicNavbar from '@/components/layouts/PublicNavbar';
import PublicFooter from '@/components/layouts/PublicFooter';
import MobileBottomNav from '@/components/layouts/MobileBottomNav';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="w-full max-w-full min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
      <PublicFooter />
      <MobileBottomNav />
    </div>
  );
}
