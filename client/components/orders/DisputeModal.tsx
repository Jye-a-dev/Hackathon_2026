'use client';

import { useState } from 'react';
import { AlertCircle, UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { AlertCircle, X } from 'lucide-react';

interface DisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, evidenceUrls: string[]) => Promise<void>;
  orderId: string;
}

export default function DisputeModal({
  isOpen,
  onClose,
  onSubmit,
  orderId,
}: DisputeModalProps) {
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceList, setEvidenceList] = useState<string[]>([
    'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&w=600&q=80',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddUrl = () => {
    if (!evidenceUrl.trim()) return;
    setEvidenceList([...evidenceList, evidenceUrl.trim()]);
    setEvidenceUrl('');
  };

  const handleRemove = (index: number) => {
    setEvidenceList(evidenceList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(reason, evidenceList);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-base font-bold text-slate-900">Khiếu nại / Yêu cầu Trả hàng</h3>
            <h3 className="text-base font-bold text-slate-900">Khiếu nại đơn #{orderId}</h3>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Đơn hàng sẽ được chuyển vào chế độ <strong>Tranh chấp (Dispute)</strong>. Tiền ký quỹ được đóng băng an toàn cho đến khi Ban quản trị phân xử dựa trên bằng chứng unbox của bạn.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lý do khiếu nại chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Mô tả cụ thể vấn đề: hàng không đúng mô tả, lỗi tính năng, vỡ hỏng trong lúc vận chuyển..."
              className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Hình ảnh / Video bằng chứng unbox mở kiện
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Dán link ảnh hoặc video Google Drive/Imgur..."
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Thêm
              </button>
            </div>

            {/* List of evidence previews */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {evidenceList.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`evidence-${i}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white shadow-sm hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

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
              disabled={isSubmitting || !reason.trim()}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi...' : 'Nộp Khiếu nại'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
