'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageCarouselProps {
  images: string[];
  alt: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape' | string;
}

export default function ImageCarousel({
  images,
  alt,
  aspectRatio = 'square',
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : images.length - 1));
  const next = () => setCurrent((c) => (c < images.length - 1 ? c + 1 : 0));

  if (!images || images.length === 0) return null;

  const ratioClass =
    aspectRatio === 'portrait'
      ? 'aspect-[4/5]'
      : aspectRatio === 'landscape'
      ? 'aspect-[4/3]'
      : aspectRatio.startsWith('aspect-')
      ? aspectRatio
      : 'aspect-square';

  return (
    <div className={clsx('relative w-full overflow-hidden rounded-2xl bg-slate-100', ratioClass)}>
      {/* Images */}
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((src, i) => (
          <div key={i} className="relative h-full w-full shrink-0">
            <Image
              src={src}
              alt={`${alt} - ảnh ${i + 1}`}
              fill
              className="object-cover"
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 480px"
            />
          </div>
        ))}
      </div>

      {/* Navigation arrows (only if > 1 image) */}
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/50"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-200',
                i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/50',
              )}
              aria-label={`Xem ảnh ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image count badge */}
      {images.length > 1 && (
        <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
          {current + 1}/{images.length}
        </span>
      )}
    </div>
  );
}
