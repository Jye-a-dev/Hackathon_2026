'use client';

import { useState, useRef, useEffect } from 'react';
import { AlertCircle, UploadCloud, X, FileImage } from 'lucide-react';
import { useRaiseDispute } from '@/hooks/useMarketplace';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export default function DisputeModal({ isOpen, onClose, orderId }: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: raiseDispute, isPending } = useRaiseDispute();

  // Revoke object URLs on unmount / files change
  useEffect(() => {
    return () => previews.forEach(URL.revokeObjectURL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previews]);

  const handleFiles = (picked: FileList | null) => {
    if (!picked) return;
    const newFiles = Array.from(picked).slice(0, 5 - files.length);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...newFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const fd = new FormData();
    fd.append('reason', reason.trim());
    files.forEach((f) => fd.append('evidence', f));

    raiseDispute({ orderId, formData: fd }, {
      onSuccess: () => {
        setReason('');
        setFiles([]);
        setPreviews([]);
        onClose();
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-base font-bold text-slate-900">
              Khiếu nại đơn #{orderId.slice(-6)}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Đơn hàng sẽ được chuyển sang chế độ{' '}
          <strong>Tranh chấp</strong>. Tiền ký quỹ được đóng băng an toàn cho đến khi
          Ban quản trị phân xử dựa trên bằng chứng của bạn.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Lý do khiếu nại <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              minLength={10}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả cụ thể vấn đề: hàng không đúng mô tả, lỗi tính năng, vỡ hỏng trong lúc vận chuyển..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-400"
            />
          </div>

          {/* File upload — real files only, no preloaded Unsplash */}
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Ảnh / video bằng chứng mở kiện (tối đa 5 file)
            </label>

            {files.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-slate-400 transition hover:border-slate-400 hover:text-slate-600"
              >
                <UploadCloud className="h-5 w-5" />
                Chọn ảnh / video
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
                  >
                    {files[i]?.type.startsWith('video') ? (
                      <div className="flex h-full items-center justify-center">
                        <FileImage className="h-8 w-8 text-slate-400" />
                        <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] text-slate-500 truncate px-1">
                          {files[i].name}
                        </span>
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={src} alt={`evidence-${i}`} className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isPending || !reason.trim()}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Đang gửi...' : 'Nộp khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
