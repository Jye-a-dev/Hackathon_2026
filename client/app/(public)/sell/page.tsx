'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  X,
  ShieldCheck,
  ChevronLeft,
  Check,
  AlertCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { listingsApi } from '@/libs/api';
import { useCurrentUser, useListingDetail } from '@/hooks/useMarketplace';
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

const CATEGORY_CHIPS: { value: ListingCategory; label: string; emoji: string }[] = [
  { value: 'ELECTRONICS', label: 'Điện tử', emoji: '💻' },
  { value: 'CAMERA', label: 'Máy ảnh', emoji: '📷' },
  { value: 'SNEAKERS', label: 'Sneaker', emoji: '👟' },
  { value: 'FASHION', label: 'Thời trang', emoji: '👗' },
  { value: 'ACCESSORIES', label: 'Phụ kiện', emoji: '⌚' },
  { value: 'BOOKS', label: 'Sách', emoji: '📚' },
  { value: 'SPORTS', label: 'Thể thao', emoji: '⚽' },
  { value: 'OTHER', label: 'Khác', emoji: '📦' },
];

const CONDITION_OPTIONS: { value: ListingCondition; label: string; desc: string }[] = [
  { value: 'NEW', label: 'Mới 100%', desc: 'Chưa bóc seal' },
  { value: 'LIKE_NEW', label: 'Like New', desc: '99%, lướt nhẹ' },
  { value: 'GOOD', label: 'Còn tốt', desc: 'Dùng cẩn thận' },
  { value: 'FAIR', label: 'Đã dùng', desc: 'Hoạt động tốt' },
];

const QUICK_DISTRICTS = ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh', 'Thủ Đức', 'Cầu Giấy', 'Hoàn Kiếm'];

const INPUT_CLS =
  'w-full h-11 px-3.5 rounded-xl bg-neutral-50/70 border border-neutral-200 text-neutral-900 text-sm placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all';

const LABEL_CLS = 'mb-1.5 block text-xs font-semibold text-neutral-700 uppercase tracking-wider';

function SellFormSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-24 md:pb-12 animate-pulse">
      <div className="w-full space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-20 bg-neutral-200 rounded-lg" />
          <div className="h-4 w-px bg-neutral-200" />
          <div className="h-5 w-36 bg-neutral-200 rounded-lg" />
        </div>
        <div className="space-y-2">
          <div className="h-8 w-72 bg-neutral-200 rounded-xl" />
          <div className="h-4 w-96 bg-neutral-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
          <div className="lg:col-span-5 space-y-5">
            <div className="h-64 bg-neutral-200 rounded-3xl" />
            <div className="h-80 bg-neutral-200 rounded-3xl" />
            <div className="h-32 bg-neutral-200 rounded-3xl" />
          </div>
          <div className="lg:col-span-7 space-y-5">
            <div className="h-130 bg-neutral-200 rounded-3xl" />
            <div className="h-12 bg-neutral-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function SellPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // 1. Query Detection
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);

  // Authentication state
  const { data: user, isLoading: isAuthLoading } = useCurrentUser();

  // 2. Fetch existing listing in edit mode
  const {
    data: listing,
    isLoading: isLoadingListing,
  } = useListingDetail(editId || '');

  // Image management: existing remote URLs vs newly staged files
  const [removedExistingImages, setRemovedExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: 'ELECTRONICS',
      condition: 'LIKE_NEW',
      city: 'Hồ Chí Minh',
      district: 'Quận 1',
    },
  });

  const watchedPrice = useWatch({ control, name: 'price' }) || 0;
  const watchedCategory = useWatch({ control, name: 'category' });
  const watchedCondition = useWatch({ control, name: 'condition' });
  const watchedDistrict = useWatch({ control, name: 'district' });
  const watchedTitle = useWatch({ control, name: 'title' });
  const watchedCity = useWatch({ control, name: 'city' });

  const existingImages = useMemo(() => {
    if (!listing || !isEditMode) return [];

    const images =
      listing.images ||
      (listing as unknown as { imageUrls?: string[] }).imageUrls ||
      [];

    return images.filter((image) => !removedExistingImages.includes(image));
  }, [listing, isEditMode, removedExistingImages]);

  // Clean up object URLs on unmount or when new previews change
  useEffect(() => {
    return () => newPreviews.forEach(URL.revokeObjectURL);
  }, [newPreviews]);

  // Auth Guard: Require logged-in user
  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthLoading) {
      const token = localStorage.getItem('kyquy_token');
      if (!token && !user) {
        toast.error('Vui lòng đăng nhập để tiếp tục');
        router.replace('/auth/login');
      }
    }
  }, [router, isAuthLoading, user]);

  // Ownership Guard in Edit Mode
  useEffect(() => {
    if (isEditMode && listing && user) {
      const currentUserId = String(user.id || '');
      const userWallet = (
        (user as unknown as { walletAddress?: string }).walletAddress ||
        user.wallet_address ||
        user.wallet ||
        ''
      ).toLowerCase();

      const sellerId = String(listing.sellerId || listing.userId || listing.seller?.id || '');
      const sellerWallet = String(listing.sellerWallet || '').toLowerCase();

      const isOwner =
        Boolean(currentUserId && sellerId && currentUserId === sellerId) ||
        Boolean(userWallet && sellerWallet && userWallet === sellerWallet) ||
        Boolean(currentUserId && sellerWallet && currentUserId.toLowerCase() === sellerWallet);

      if (!isOwner) {
        toast.warning('Bạn không có quyền chỉnh sửa bài đăng này');
        router.replace(`/listings/${editId}`);
      }
    }
  }, [isEditMode, listing, user, editId, router]);

  // 3. Pre-fill Form (React Hook Form)
  useEffect(() => {
    if (listing && isEditMode) {
      const locationParts =
        typeof (listing as unknown as { locationName?: string }).locationName === 'string'
          ? (listing as unknown as { locationName: string }).locationName.split(',').map((s) => s.trim())
          : [];

      reset({
        title: listing.title || '',
        category: (listing.category as ListingCategory) || 'FASHION',
        condition: (listing.condition as ListingCondition) || 'LIKE_NEW',
        price: Number(listing.price || 0),
        district: listing.location?.district || locationParts[0] || 'Quận 1',
        city: listing.location?.city || locationParts[1] || 'Hồ Chí Minh',
        description: listing.description || '',
      });

    }
  }, [listing, isEditMode, reset]);

  // Loading skeleton state
  if (isEditMode && isLoadingListing) {
    return <SellFormSkeleton />;
  }

  const formattedPrice =
    watchedPrice > 0
      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(watchedPrice)
      : '';

  const totalImageCount = existingImages.length + newFiles.length;

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    const remainingSlots = Math.max(0, 4 - totalImageCount);
    const allowed = picked.slice(0, remainingSlots);

    if (allowed.length === 0) return;

    setNewFiles((prev) => [...prev, ...allowed]);
    setNewPreviews((prev) => [...prev, ...allowed.map((f) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeExistingImage = (index: number) => {
    const image = existingImages[index];
    if (image) {
      setRemovedExistingImages((prev) => [...prev, image]);
    }
  };

  const removeNewFile = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, idx) => idx !== index));
    setNewPreviews((prev) => prev.filter((_, idx) => idx !== index));
  };

  const onSubmit = async (values: FormValues) => {
    if (totalImageCount === 0) {
      toast.error('Vui lòng thêm ít nhất 1 ảnh thực tế của sản phẩm');
      return;
    }
    if (totalImageCount > 4) {
      toast.error('Tối đa 4 ảnh cho mỗi bài đăng');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('category', values.category);
      formData.append('condition', values.condition);
      formData.append('price', String(values.price));
      formData.append('priceVnd', String(values.price));
      formData.append('district', values.district);
      formData.append('city', values.city);
      formData.append('locationName', `${values.district}, ${values.city}`);
      if (values.description) {
        formData.append('description', values.description);
      }

      if (isEditMode && editId) {
        // Submit existing retained image URLs
        formData.append('existingImages', JSON.stringify(existingImages));
        existingImages.forEach((img) => formData.append('images', img));
        // Append newly staged files
        newFiles.forEach((f) => formData.append('images', f));

        await listingsApi.update(editId, formData);

        // Invalidate remote cache
        await queryClient.invalidateQueries({ queryKey: ['listing', editId] });
        await queryClient.invalidateQueries({ queryKey: ['listings'] });

        setIsSuccess(true);
        toast.success('Cập nhật tin đăng thành công');
        setTimeout(() => router.push(`/listings/${editId}`), 1200);
      } else {
        const sellerWallet = user?.wallet_address || user?.wallet || user?.id || 'seller';
        formData.append('sellerWallet', sellerWallet);
        newFiles.forEach((f) => formData.append('images', f));

        const created = await listingsApi.create(formData);
        await queryClient.invalidateQueries({ queryKey: ['listings'] });

        setIsSuccess(true);
        toast.success('Đăng tin ký quỹ thành công!');
        setTimeout(() => router.push(`/listings/${created.id}`), 1500);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (isEditMode ? 'Không thể cập nhật tin đăng.' : 'Không thể đăng tin. Vui lòng kiểm tra lại kết nối.');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-full min-h-[60vh] flex flex-col items-center justify-center gap-5 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-neutral-900">
            {isEditMode ? 'Cập nhật tin đăng thành công!' : 'Đăng tin thành công!'}
          </h2>
          <p className="mt-1.5 text-xs text-neutral-500">Đang chuyển hướng đến trang chi tiết sản phẩm...</p>
        </div>
      </div>
    );
  }

  // Cover image for Live Preview
  const coverImage = existingImages[0] || newPreviews[0] || null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen pb-24 md:pb-12">
      <div>
        {/* Navigation / Mode Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-950 transition active:scale-[0.98] cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại
            </button>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-800">
                {isEditMode ? 'Chế độ chỉnh sửa tin đăng' : 'Đăng tin với Ký Quỹ 48h'}
              </span>
            </div>
          </div>
          {isEditMode && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Mã tin #{editId}
            </span>
          )}
        </div>

        {/* Dynamic Title & Subtitle */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-900 font-display">
            {isEditMode ? 'Chỉnh sửa tin đăng' : 'Đăng tin pass đồ siêu tốc'}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-neutral-500">
            {isEditMode
              ? 'Cập nhật lại thông tin và hình ảnh sản phẩm của bạn'
              : 'Tạo bài đăng nhanh chóng, an toàn với Ký quỹ 48h'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* 12-Column Split Studio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ── LEFT: Media Dropzone + Live Product Card Preview (col-span-5, sticky on desktop) ── */}
            <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24 lg:self-start">
              {/* Dropzone & Image Grid */}
              <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <label className={`${LABEL_CLS} mb-0`}>
                    Ảnh sản phẩm thực tế <span className="text-rose-500">*</span>
                    <span className="ml-2 text-[11px] font-normal text-neutral-400 normal-case">
                      ({totalImageCount}/4 ảnh)
                    </span>
                  </label>
                  {isEditMode && existingImages.length > 0 && (
                    <span className="text-[10px] font-semibold text-neutral-400">
                      Đã lưu: {existingImages.length}
                    </span>
                  )}
                </div>

                {/* Image grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Render existing images */}
                  {existingImages.map((src, i) => (
                    <div
                      key={`existing-${i}`}
                      className="relative aspect-4/5 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 group"
                    >
                      <Image
                        src={src}
                        alt={`Ảnh ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized={src.startsWith('data:') || src.startsWith('blob:')}
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(i)}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white hover:bg-rose-600 transition shadow-sm cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 rounded-lg bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white tracking-wide">
                          ẢNH BÌA
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Render newly added file previews */}
                  {newPreviews.map((src, i) => {
                    const displayIndex = existingImages.length + i;
                    return (
                      <div
                        key={`new-${i}`}
                        className="relative aspect-4/5 overflow-hidden rounded-2xl border border-emerald-300/80 bg-emerald-50/20 group"
                      >
                        <Image
                          src={src}
                          alt={`Ảnh mới ${i + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={() => removeNewFile(i)}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white hover:bg-rose-600 transition shadow-sm cursor-pointer"
                          title="Xóa ảnh này"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        {displayIndex === 0 && (
                          <span className="absolute bottom-1.5 left-1.5 rounded-lg bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white tracking-wide">
                            ẢNH BÌA
                          </span>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 rounded-lg bg-emerald-600/90 text-white px-1.5 py-0.5 text-[8px] font-bold">
                          MỚI
                        </span>
                      </div>
                    );
                  })}

                  {/* Upload button if less than 4 */}
                  {totalImageCount < 4 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex aspect-4/5 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-neutral-300 text-neutral-400 transition hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 bg-neutral-50/50 active:scale-[0.98] cursor-pointer"
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

                {totalImageCount === 0 && (
                  <p className="mt-3 text-xs text-amber-600 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    Vui lòng tải lên ít nhất 1 ảnh thực tế
                  </p>
                )}
              </div>

              {/* Live Marketplace Feed Preview Card */}
              <div className="rounded-3xl border border-neutral-200/80 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-500">
                  <span className="uppercase tracking-wider text-[11px]">Xem trước tin hiển thị</span>
                  <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    Live Preview
                  </span>
                </div>
                <div className="w-full max-w-65 mx-auto rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
                  <div className="relative aspect-4/5 bg-neutral-100 overflow-hidden">
                    {coverImage ? (
                      <Image
                        src={coverImage}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized={coverImage.startsWith('data:') || coverImage.startsWith('blob:')}
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-neutral-400">
                        <UploadCloud className="h-8 w-8 opacity-40" />
                        <span className="text-[10px]">Chưa có ảnh bìa</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 rounded-lg bg-emerald-500/90 text-white px-2 py-0.5 text-[9px] font-bold backdrop-blur-xs">
                      Ký quỹ 48h
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <p className="text-xs font-bold text-neutral-900 line-clamp-2 leading-snug">
                      {watchedTitle || 'Tiêu đề sản phẩm'}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-extrabold text-neutral-900">
                        {formattedPrice || '0 ₫'}
                      </span>
                      <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[9px] font-semibold text-neutral-600">
                        {CONDITION_OPTIONS.find((c) => c.value === watchedCondition)?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400 pt-0.5">
                      <MapPin className="h-2.5 w-2.5" />
                      <span className="truncate">
                        {watchedDistrict || 'Quận 1'}, {watchedCity || 'Hồ Chí Minh'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Escrow Info Card */}
              <div className="rounded-3xl border border-emerald-200/80 bg-emerald-50/80 p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600">
                    <ShieldCheck className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-900 mb-1">Bảo vệ Ký Quỹ 48h</h3>
                    <p className="text-xs font-medium text-emerald-800 leading-relaxed">
                      Tiền người mua được khóa trong Hệ thống Ký quỹ. Bạn chỉ nhận được tiền sau khi người mua kiểm tra và xác nhận hài lòng sau <strong>48 giờ</strong>.
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-200/60 grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center">
                    <div className="text-emerald-900 font-bold text-base">0%</div>
                    <div className="text-emerald-700 font-medium">Phí bảo vệ Ký quỹ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-emerald-900 font-bold text-base">48h</div>
                    <div className="text-emerald-700 font-medium">Thời gian kiểm tra</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Form Fields (col-span-7) ── */}
            <div className="lg:col-span-7 space-y-5">
              <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-xs space-y-6">
                {/* Title */}
                <div>
                  <label className={LABEL_CLS}>
                    Tiêu đề tin đăng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    {...register('title')}
                    placeholder="VD: Sony Alpha A7 IV Fullbox chính hãng 99%"
                    className={INPUT_CLS}
                  />
                  {errors.title && <p className="mt-1.5 text-xs text-rose-500">{errors.title.message}</p>}
                </div>

                {/* Category Chips */}
                <div>
                  <label className={LABEL_CLS}>
                    Danh mục <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {CATEGORY_CHIPS.map((c) => {
                      const active = watchedCategory === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setValue('category', c.value)}
                          className={`flex items-center gap-1.5 cursor-pointer rounded-xl px-3.5 h-11 sm:h-10 text-xs font-semibold transition active:scale-[0.98] ${
                            active
                              ? 'bg-neutral-900 text-white shadow-sm'
                              : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <span>{c.emoji}</span>
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Condition Segmented */}
                <div>
                  <label className={LABEL_CLS}>
                    Tình trạng <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {CONDITION_OPTIONS.map((o) => {
                      const active = watchedCondition === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setValue('condition', o.value)}
                          className={`flex flex-col cursor-pointer rounded-2xl border min-h-[52px] p-3 text-center transition active:scale-[0.98] ${
                            active
                              ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm ring-1 ring-neutral-900'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="text-xs font-bold">{o.label}</span>
                          <span
                            className={`text-[10px] mt-0.5 line-clamp-1 ${
                              active ? 'text-neutral-300' : 'text-neutral-400'
                            }`}
                          >
                            {o.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <label className={LABEL_CLS}>
                    Giá bán (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      {...register('price')}
                      type="number"
                      min={1000}
                      step={1000}
                      placeholder="25000000"
                      className={`${INPUT_CLS} pr-36`}
                    />
                    {formattedPrice && (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 text-xs font-bold text-emerald-800">
                        {formattedPrice}
                      </div>
                    )}
                  </div>
                  {errors.price && <p className="mt-1.5 text-xs text-rose-500">{errors.price.message}</p>}
                </div>

                {/* Location */}
                <div className="space-y-3">
                  <label className={LABEL_CLS}>
                    Khu vực giao dịch <span className="text-rose-500">*</span>
                  </label>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Gợi ý:
                    </span>
                    {QUICK_DISTRICTS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setValue('district', d)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition active:scale-[0.98] cursor-pointer ${
                          watchedDistrict === d
                            ? 'bg-neutral-900 text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <input
                        {...register('district')}
                        placeholder="Quận / Huyện"
                        className={INPUT_CLS}
                      />
                      {errors.district && (
                        <p className="mt-1 text-xs text-rose-500">{errors.district.message}</p>
                      )}
                    </div>
                    <div>
                      <input
                        {...register('city')}
                        placeholder="Tỉnh / Thành phố"
                        className={INPUT_CLS}
                      />
                      {errors.city && (
                        <p className="mt-1 text-xs text-rose-500">{errors.city.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={LABEL_CLS}>
                    Mô tả chi tiết <span className="text-neutral-400 font-normal normal-case">(không bắt buộc)</span>
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Mô tả phụ kiện kèm theo, số shot chụp, xuất xứ, bảo hành..."
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/70 px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Sticky Action Bar */}
              <div className="sticky bottom-4 z-20 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm rounded-xl shadow-xl transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">
                      {isEditMode ? 'Đang lưu thay đổi...' : 'Đang đăng tin...'}
                    </span>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{isEditMode ? 'Lưu thay đổi' : 'Đăng tin ngay'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SellPage() {
  return (
    <Suspense fallback={<SellFormSkeleton />}>
      <SellPageContent />
    </Suspense>
  );
}
