'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  UploadCloud,
  X,
  Plus,
  ShieldCheck,
  ChevronLeft,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { formatVND } from '@/utils/formatCurrency';
import { listingsApi } from '@/libs/api';
import { useAuthStore } from '@/store/useAuthStore';
import type { ListingCategory, ListingCondition } from '@/types/listing';

const sampleUploads = [
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=800&q=80',
];

export default function SellPage() {
  const router = useRouter();
  const { wallet } = useAuthStore();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState<ListingCategory>('ELECTRONICS');
  const [condition, setCondition] = useState<ListingCondition>('LIKE_NEW');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState('Quận 1');
  const [city, setCity] = useState('Hồ Chí Minh');
  const [images, setImages] = useState<string[]>(sampleUploads);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddSampleImage = () => {
    if (images.length >= 4) return;
    const moreUrls = [
      'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    ];
    setImages([...images, moreUrls[images.length % moreUrls.length]]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const sellerWallet = wallet || 'SellerMockWallet47523322222222222222222';
      await listingsApi.create({
        sellerWallet,
        title: title.trim(),
        priceVnd: Number(price),
        category,
        condition,
        description: description.trim() || undefined,
        images,
        locationName: `${district}, ${city}`,
      });

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Lỗi khi lưu sản phẩm lên máy chủ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-12">
      <Header title="Đăng tin bán đồ" showLocation={false} />

      <main className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="mb-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-600 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Quay lại</span>
          </button>
        </div>

        {isSuccess ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-emerald-100 shadow-sm animate-bounce-in">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Đăng tin thành công lên máy chủ!
            </h3>
            <p className="text-xs text-slate-500">
              Món đồ của bạn đã được ghi nhận và hiển thị ngay trên bảng tin Khám phá.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Upload Photos Section */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Hình ảnh sản phẩm{' '}
                  <span className="text-slate-400 font-normal">({images.length}/4)</span>
                </label>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  Tỉ lệ vuông 1:1 chuẩn Instagram
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group"
                  >
                    <Image
                      src={url}
                      alt={`upload-${i}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {images.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddSampleImage}
                    className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 transition"
                  >
                    <Plus className="h-6 w-6" />
                    <span className="text-[10px] font-semibold mt-1">Thêm ảnh</span>
                  </button>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tiêu đề món đồ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Tai nghe Sony WH-1000XM5 Fullbox 99%..."
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Giá bán (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={price}
                    onChange={(e) =>
                      setPrice(e.target.value ? Number(e.target.value) : '')
                    }
                    placeholder="VD: 4500000"
                    className="w-full rounded-2xl border border-slate-200 p-3.5 pr-16 text-sm font-bold text-emerald-600 focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">
                    VNĐ
                  </span>
                </div>
                {typeof price === 'number' && price > 0 && (
                  <p className="mt-1 text-xs text-emerald-600 font-semibold">
                    ≈ {formatVND(price)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Danh mục
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ListingCategory)}
                    className="w-full rounded-2xl border border-slate-200 p-3 text-xs bg-white focus:outline-none"
                  >
                    <option value="ELECTRONICS">📱 Điện tử / Công nghệ</option>
                    <option value="CAMERA">📷 Máy ảnh</option>
                    <option value="FASHION">👗 Thời trang</option>
                    <option value="SNEAKERS">👟 Sneakers</option>
                    <option value="ACCESSORIES">💍 Phụ kiện</option>
                    <option value="BOOKS">📚 Sách</option>
                    <option value="SPORTS">⚽ Thể thao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tình trạng
                  </label>
                  <select
                    value={condition}
                    onChange={(e) =>
                      setCondition(e.target.value as ListingCondition)
                    }
                    className="w-full rounded-2xl border border-slate-200 p-3 text-xs bg-white focus:outline-none"
                  >
                    <option value="NEW">Mới 100%</option>
                    <option value="LIKE_NEW">Như mới (99%)</option>
                    <option value="GOOD">Còn đẹp (90%)</option>
                    <option value="FAIR">Đã qua sử dụng</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location & Description */}
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tỉnh / Thành
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mô tả món đồ
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả nguồn gốc mua, thời gian sử dụng, phụ kiện đi kèm..."
                  className="w-full rounded-2xl border border-slate-200 p-3.5 text-xs focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Escrow note */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-3xl p-4 text-xs text-emerald-800 flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>
                Tin đăng được bảo vệ bởi <strong>Ký quỹ 48h</strong>. Bạn nhận đủ 100% tiền khi người mua kiểm tra hài lòng.
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !price}
              className="gradient-primary w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:opacity-95 active:scale-98 disabled:opacity-40"
            >
              {isSubmitting ? 'Đang gửi dữ liệu lên máy chủ...' : 'Đăng tin bán ngay'}
            </button>
          </form>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
