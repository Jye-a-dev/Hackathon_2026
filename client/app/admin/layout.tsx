import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Bảng Quản Trị Phân Xử Tranh Chấp - Ký Quỹ P2P',
  description: 'Giao diện trọng tài đối soát bằng chứng và giải ngân/hoàn tiền.',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {children}
    </div>
  );
}
