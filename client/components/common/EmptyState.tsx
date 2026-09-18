'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { RefreshCw, PackageOpen } from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

// ─── EmptyState ───────────────────────────────────────────────────────────────

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`mx-auto mt-16 max-w-xs rounded-3xl border border-neutral-200 bg-white p-12 text-center shadow-sm ${className}`}
    >
      <Icon className="mx-auto h-12 w-12 text-neutral-300" aria-hidden />
      <h3 className="mt-4 text-base font-semibold text-neutral-800">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-neutral-500">{description}</p>
      )}
      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="mt-6 inline-block rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className="mt-6 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              {action.label}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── ErrorBanner ──────────────────────────────────────────────────────────────

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({ message, onRetry, className = '' }: ErrorBannerProps) {
  // Auto-fire Sonner toast on mount
  useEffect(() => {
    toast.error(message);
  }, [message]);

  return (
    <div
      className={`mx-auto mt-16 max-w-xs rounded-3xl border border-red-100 bg-white p-10 text-center shadow-sm ${className}`}
    >
      <p className="text-4xl">⚠️</p>
      <h3 className="mt-4 text-base font-semibold text-neutral-800">Không thể tải dữ liệu</h3>
      <p className="mt-1.5 text-sm text-neutral-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </button>
      )}
    </div>
  );
}

