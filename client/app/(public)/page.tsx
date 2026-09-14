'use client';

import { Suspense } from 'react';
import FeedList from '@/components/feed/FeedList';
import Header from '@/components/common/Header';
import BottomNav from '@/components/common/BottomNav';

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header showLocation />
      <main className="pb-24">
        <Suspense fallback={<div className="p-8 text-center text-sm text-slate-400">Đang tải bảng tin...</div>}>
          <FeedList />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
