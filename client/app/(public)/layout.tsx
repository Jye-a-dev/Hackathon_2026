import type { Metadata } from "next";
import type { ReactNode } from "react";

import PublicSetup from "@/components/layouts/(public)/PublicSetup";

import "../globals.css";

export const metadata: Metadata = {
  title: "Template React",
  description: "Giao diện template React đơn giản.",
};

type PublicLayoutProps = {
  children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[#f6f4ef] text-neutral-900">
        <div className="mx-auto flex min-h-screen w-full max-w-350 flex-col border-x border-neutral-200 bg-white">
          <PublicSetup>{children}</PublicSetup>
        </div>
      </body>
    </html>
  );
}
