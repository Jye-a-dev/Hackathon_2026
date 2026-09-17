'use client';

import { Suspense, useState } from 'react';
import PublicNavbar from '@/components/layouts/(public)/Navbar/PublicNavbar';
import BottomNav from '@/components/common/BottomNav';
import FeedList from '@/components/feed/FeedList';
import type { ListingCategory } from '@/types/listing';

export default function FeedPage() {
  const [category, setCategory] = useState<ListingCategory | 'ALL'>('ALL');
  const [radius, setRadius] = useState(0);

  return (
    <div className="min-h-screen bg-neutral-50">
      <PublicNavbar
        showCategoryBar
        activeCategory={category}
        activeRadius={radius}
        onCategoryChange={setCategory}
        onRadiusChange={setRadius}
      />

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24 text-sm text-neutral-400">
            Đang tải…
          </div>
        }
      >
        <FeedList category={category} radiusKm={radius} />
      </Suspense>

      <div className="pb-24 md:hidden" aria-hidden />
      <BottomNav />
    </div>
  );
}
