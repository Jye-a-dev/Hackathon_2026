import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Providers from '@/app/providers';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Bảng Quản Trị Phân Xử Tranh Chấp - Ký Quỹ P2P',
  description: 'Giao diện trọng tài đối soát bằng chứng và giải ngân/hoàn tiền.',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-slate-900 text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
