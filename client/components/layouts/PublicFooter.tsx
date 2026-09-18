'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowUpRight, Lock, CheckCircle2 } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-white border-t border-neutral-200/80 pt-12 pb-24 md:pb-12 text-neutral-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Column 1: Brand TrustPass & Commitment */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-emerald-400 shadow-sm">
                <ShieldCheck className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-base font-extrabold tracking-tight text-neutral-950">
                TrustPass
              </span>
            </Link>
            
            <p className="text-xs leading-relaxed text-neutral-500">
              Sàn giao dịch đồ cũ P2P giải quyết rủi ro bùng hàng và boom COD bằng Ký quỹ thông minh. Tiền chỉ được giải ngân cho người bán khi người mua đã nhận và kiểm tra trong 48 giờ.
            </p>

            <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <Lock className="h-3.5 w-3.5 text-emerald-600" />
              <span>Solana Anchor Vault PDA Verified</span>
            </div>
          </div>

          {/* Column 2: Khám phá danh mục */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-4">
              Khám phá danh mục
            </h3>
            <ul className="space-y-2.5 text-xs font-medium">
              {[
                ['Điện tử & Công nghệ', '/?category=ELECTRONICS'],
                ['Máy ảnh & Quay phim', '/?category=CAMERA'],
                ['Sneakers & Giày hiệu', '/?category=SNEAKERS'],
                ['Thời trang & Quần áo', '/?category=FASHION'],
                ['Đồng hồ & Phụ kiện', '/?category=ACCESSORIES'],
                ['Thiết bị âm thanh', '/?category=OTHER'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-neutral-500 hover:text-neutral-950 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-neutral-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Hỗ trợ & Trọng tài */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-4">
              Hỗ trợ & Trọng tài
            </h3>
            <ul className="space-y-2.5 text-xs font-medium">
              {[
                ['Quy trình ký quỹ 48h', '/user/orders'],
                ['Trung tâm giải quyết khiếu nại', '/admin/disputes'],
                ['Biểu phí minh bạch (0% Buyer)', '/user/dashboard'],
                ['Chính sách bảo vệ người mua', '/user/orders'],
                ['Chính sách bảo vệ người bán', '/user/sales'],
                ['Quy chuẩn đóng gói & đối soát', '/user/settings'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-neutral-500 hover:text-neutral-950 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-neutral-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Đăng ký & Đối tác vận chuyển / Cổng thanh toán */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Kết nối đối tác & VietQR
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Tích hợp luồng đối soát tự động qua webhook vận chuyển và Napas 247.
            </p>

            {/* Logistics & Payment Badges */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                  GHN Express
                </span>
                <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                  J&T Express
                </span>
                <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                  VietQR Pro
                </span>
                <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-semibold text-neutral-700">
                  Napas 247
                </span>
              </div>
            </div>

            {/* Trust Assurance Pill */}
            <div className="rounded-xl border border-neutral-200/80 bg-neutral-50 p-3 text-[11px] text-neutral-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Bảo vệ quyền lợi 100%</span>
              </div>
              <p className="text-[10px] text-neutral-500">
                Tiền gửi được cô lập trong Hợp đồng thông minh Anchor, ngăn chặn hoàn toàn gian lận COD.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright bar */}
        <div className="mt-12 border-t border-neutral-200/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          <p>© {new Date().getFullYear()} TrustPass / Chợ Ký Quỹ. All rights reserved.</p>
          <p className="text-center sm:text-right max-w-xl text-neutral-400 text-[10px] leading-relaxed">
            Hệ thống áp dụng cơ chế Web3 Fiat Abstraction: Người dùng giao dịch bằng Việt Nam Đồng (VNĐ) qua VietQR thông thường, trong khi toàn bộ trạng thái ký quỹ được neo minh bạch on-chain.
          </p>
        </div>
      </div>
    </footer>
  );
}

