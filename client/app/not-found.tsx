import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-4xl font-black text-slate-900">404</h1>
        <p className="text-sm text-slate-600">Trang bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}

