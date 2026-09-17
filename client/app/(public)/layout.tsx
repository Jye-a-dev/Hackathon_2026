import type { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="relative mx-auto flex min-h-screen w-full flex-col">
        {children}
      </div>
    </div>
  );
}
