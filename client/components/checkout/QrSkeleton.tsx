// components/checkout/QrSkeleton.tsx
// Animated skeleton matching the VietQR card layout
import { Skeleton } from '@/components/ui/skeleton';

export function QrSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* QR square */}
      <Skeleton className="h-56 w-56 rounded-2xl" />

      {/* Bank info rows */}
      <div className="w-full max-w-sm space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Amount row */}
      <Skeleton className="h-10 w-44 rounded-xl" />
    </div>
  );
}

