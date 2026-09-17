'use client';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-bold">Đã có lỗi xảy ra!</h2>
        <p className="text-xs text-slate-400 font-mono">{error?.message}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}

