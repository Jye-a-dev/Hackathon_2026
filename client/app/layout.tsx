import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Providers from "@/app/providers";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "TrustPass - Mua Bán P2P An Toàn Bảo Vệ 48h",
  description: "Nền tảng mua bán đồ cũ an toàn với cơ chế Ký quỹ bảo vệ 48h, thanh toán VietQR tiện lợi 100% VNĐ.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className="w-full min-h-screen overflow-x-hidden m-0 p-0 bg-[#fafafa] text-neutral-900 antialiased">
      <body className="w-full min-h-screen overflow-x-hidden m-0 p-0 bg-[#fafafa] text-neutral-900 antialiased selection:bg-emerald-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
