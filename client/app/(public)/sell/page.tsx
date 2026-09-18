'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UploadCloud,
  X,
  ShieldCheck,
  ChevronLeft,
  Check,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';
import { Money } from '@/domain/value-objects/Money';
import { listings } from '@/services/marketplace.service';
import { useCurrentUser } from '@/hooks/useMarketplace';
import type { ListingCategory, ListingCondition } from '@/types/listing';

const schema = z.object({
  title: z.string().min(5, 'Tiêu đề ít nhất 5 ký tự').max(120, 'Tối đa 120 ký tự'),
  category: z.enum([
    'FASHION',
    'ELECTRONICS',
    'ACCESSORIES',
    'SNEAKERS',
    'CAMERA',
    'BOOKS',
    'SPORTS',
    'OTHER',
  ] as const),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'] as const),
  price: z.coerce.number({ invalid_type_error: 'Nhập giá tiền hợp lệ' }).min(1000, 'Tối thiểu 1.000 ₫'),
  district: z.string().min(1, 'Nhập quận/huyện'),
  city: z.string().min(1, 'Nhập tỉnh/thành phố'),
  description: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof schema>;

const CATEGORY_OPTIONS: { value: ListingCategory; label: string }[] = [
  { value: 'ELECTRONICS', label: 'Điện tử' },
  { value: 'CAMERA',      label: 'Máy ảnh' },
  { value: 'SNEAKERS',    label: 'Sneaker' },
  { value: 'FASHION',     label: 'Thời trang' },
  { value: 'ACCESSORIES', label: 'Phụ kiện' },
  { value: 'BOOKS',       label: 'Sách' },
  { value: 'SPORTS',      label: 'Thể thao' },
  { value: 'OTHER',       label: 'Khác' },
];

const CONDITION_OPTIONS: { value: ListingCondition; label: string; desc: string }[] = [
  { value: 'NEW',      label: 'Mới 100%',  desc: 'Chưa qua sử dụng, còn nguyên seal' },
  { value: 'LIKE_NEW', label: 'Like New',  desc: '99%, sử dụng lướt, không trầy xước' },
  { value: 'GOOD',     label: 'Còn tốt',   desc: 'Đã dùng cẩn thận, hoạt động hoàn hảo' },
  { value: 'FAIR',     label: 'Đã dùng',   desc: 'Có dấu hiệu sử dụng, hoạt động bình thường' },
];

export default function SellPage() {
  const router = useRouter();
  const { data: user, isLoading: isAuthLoading } = useCurrentUser();

  // Guard: checks authentication without mock wallet fallback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('kyquy_token');
      if (!token && !isAuthLoading) {
        toast.error('Vui lòng đăng nhập để đăng bán sản phẩm');
        router.replace('/auth/login');
      }
    }
  }, [router, isAuthLoading]);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => previews.forEach(URL.revokeObjectURL);
  }, [previews]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'ELECTRONICS',
      condition: 'LIKE_NEW',
      city: 'Hồ Chí Minh',
    },
  });

  const watchedPrice = watch('price');
  const priceMoney = watchedPrice > 0 ? new Money(watchedPrice, 'VND') : null;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const allowed = picked.slice(0, 4 - files.length);
    const newPreviews = allowed.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...allowed]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removeFile = (i: number) => {
    URL.revokeObjectURL(previews[i]);
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onSubmit = async (values: FormValues) => {
    if (files.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 ảnh thật của sản phẩm');
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('category', values.category);
      fd.append('condition', values.condition);
      fd.append('price_vnd', String(values.price));
      fd.append('location_name', `${values.district}, ${values.city}`);
      if (values.description) fd.append('description', values.description);
      files.forEach((f) => fd.append('images', f));

      const listing = await listings.create(fd);
      setIsSuccess(true);
      toast.success('Đăng tin ký quỹ thành công!');
      setTimeout(() => router.push(`/listings/${listing.id}`), 1500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Không thể đăng tin. Vui lòng kiểm tra lại kết nối.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#fafafa] p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs">
          <Check className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900">Đăng tin thành công!</h2>
          <p className="mt-1.5 text-xs text-neutral-500">Đang chuyển hướng đến trang chi tiết sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-28 md:pb-12">
      <Header title="Đăng tin Bán Ký Quỹ" showLocation={false} />

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition"
        >
          <ChevronLeft className="h-4 w-4" /> Quay lại
        </button>

        {/* Escrow badge callout */}
        <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 shadow-2xs">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-xs font-medium text-emerald-900 leading-relaxed">
            Sản phẩm được bảo vệ tự động qua <strong>Ký quỹ 48h</strong>. Tiền của người mua được khóa trong Vault trước khi bạn gửi hàng.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Multi-File Upload Dropzone */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs">
            <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-neutral-800">
              Ảnh sản phẩm thực tế <span className="text-rose-500">*</span>
              <span className="ml-2 text-xs font-normal text-neutral-400 capitalize">(Tối đa 4 ảnh)</span>
            </label>

            <div className="grid grid-cols-4 gap-3">
              {previews.map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                >
                  <Image src={src} alt={`Ảnh ${i + 1}`} fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    aria-label="Xóa ảnh"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      Ảnh bìa
                    </span>
                  )}
                </div>
              ))}

              {files.length < 4 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-400 transition hover:border-neutral-500 hover:text-neutral-700 bg-neutral-50/50"
                >
                  <UploadCloud className="h-6 w-6" />
                  <span className="text-[10px] font-bold">Thêm ảnh</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFilesChange}
            />

            {files.length === 0 && (
              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Vui lòng chụp và tải lên ít nhất 1 ảnh thực tế của sản phẩm
              </p>
            )}
          </div>

          {/* Details */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-800">
                Tiêu đề tin đăng <span className="text-rose-500">*</span>
              </label>
              <input
                {...register('title')}
                placeholder="VD: Sony Alpha A7 IV Fullbox chính hãng 99%"
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-hidden"
              />
              {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Danh mục
                </label>
                <select
                  {...register('category')}
                  className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-xs sm:text-sm text-neutral-800 bg-white focus:outline-hidden"
                >
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Giá bán (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('price')}
                  type="number"
                  min={1000}
                  step={1000}
                  placeholder="25000000"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:border-neutral-400 focus:outline-hidden"
                />
                {priceMoney && (
                  <p className="mt-1 text-xs font-bold text-emerald-600 font-sans">
                    {priceMoney.format()}
                  </p>
                )}
                {errors.price && <p className="mt-1 text-xs text-rose-500">{errors.price.message}</p>}
              </div>
            </div>

            {/* Condition Options */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-neutral-800">
                Tình trạng sản phẩm
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CONDITION_OPTIONS.map((o) => {
                  const currentVal = watch('condition');
                  return (
                    <label
                      key={o.value}
                      className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition ${
                        currentVal === o.value
                          ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <input type="radio" value={o.value} {...register('condition')} className="sr-only" />
                      <div>
                        <p className="text-xs font-bold text-neutral-900">{o.label}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">{o.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Quận / Huyện <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('district')}
                  placeholder="Quận 1"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-hidden"
                />
                {errors.district && <p className="mt-1 text-xs text-rose-500">{errors.district.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Tỉnh / Thành phố <span className="text-rose-500">*</span>
                </label>
                <input
                  {...register('city')}
                  placeholder="Hồ Chí Minh"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs sm:text-sm text-neutral-900 focus:outline-hidden"
                />
                {errors.city && <p className="mt-1 text-xs text-rose-500">{errors.city.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-800">
                Mô tả chi tiết <span className="text-neutral-400 font-normal lowercase">(không bắt buộc)</span>
              </label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Mô tả phụ kiện kèm theo, số shot chụp, xuất xứ, hóa đơn mua hàng..."
                className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-xs sm:text-sm text-neutral-900 focus:border-neutral-400 focus:outline-hidden resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 py-4 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-neutral-800 active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Đang đăng tin...</span>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Đăng bán với Ký Quỹ bảo vệ 48h</span>
              </>
            )}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
