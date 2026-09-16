import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "@/app/providers";
import "../globals.css";

export const metadata: Metadata = {
  title: "Chợ Ký Quỹ - Mua Bán P2P An Toàn Bảo Vệ 48h",
  description: "Nền tảng mua bán đồ cũ an toàn với cơ chế Ký quỹ bảo vệ 48h, thanh toán VietQR tiện lợi 100% VNĐ.",
};

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        <Providers>
          <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col bg-white shadow-xl shadow-slate-200/50">
            {children}
          </div>
        </Providers>
      </body>
    </html>
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <Providers>
        <div className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col bg-white shadow-xl shadow-slate-200/50">
          {children}
        </div>
      </Providers>
    </div>
  );
}
