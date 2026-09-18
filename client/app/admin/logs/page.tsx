'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { http } from '@/libs/api';
import { io, Socket } from 'socket.io-client';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Wifi,
  WifiOff,
  X,
  Search,
  RefreshCw,
  ChevronDown,
  Zap,
  Shield,
  Truck,
  Globe,
} from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
type LogSource = 'ALL' | 'VIETQR' | 'SOLANA' | 'SHIPPING' | 'AUTH';
type TimeRange = '1h' | '24h' | '7d';

interface AuditLog {
  id: string;
  timestamp: string;
  source: string;
  event: string;
  orderId?: string;
  txHash?: string;
  status: 'SUCCESS' | 'WARN' | 'ERROR' | 'CRITICAL' | 'INFO';
  level: LogLevel;
  statusCode?: number;
  payload?: Record<string, unknown>;
  durationMs?: number;
}

interface LogsApiResponse {
  logs: AuditLog[];
  meta: {
    total: number;
    webhookCount24h: number;
    onchainSuccess: number;
    errorCount: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SOURCE_OPTIONS: { id: LogSource; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'ALL',      label: 'Tất cả',              Icon: Globe },
  { id: 'VIETQR',   label: 'VietQR Webhook',       Icon: Zap },
  { id: 'SOLANA',   label: 'Solana Escrow',         Icon: Shield },
  { id: 'SHIPPING', label: 'GHN / J&T Shipping',   Icon: Truck },
  { id: 'AUTH',     label: 'Auth & Guard',          Icon: Shield },
];

const LEVEL_OPTIONS: LogLevel[] = ['INFO', 'WARN', 'ERROR', 'CRITICAL'];

const TIME_RANGES: { id: TimeRange; label: string }[] = [
  { id: '1h',  label: '1 giờ qua' },
  { id: '24h', label: '24 giờ qua' },
  { id: '7d',  label: '7 ngày qua' },
];

function statusBadgeClass(status: AuditLog['status']): string {
  switch (status) {
    case 'SUCCESS': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case 'WARN':    return 'bg-amber-50 text-amber-700 border border-amber-200';
    case 'ERROR':   return 'bg-rose-50 text-rose-700 border border-rose-200';
    case 'CRITICAL':return 'bg-rose-100 text-rose-900 border border-rose-300 font-extrabold';
    case 'INFO':    return 'bg-neutral-50 text-neutral-600 border border-neutral-200';
    default:        return 'bg-neutral-100 text-neutral-500';
  }
}

function levelDotClass(level: LogLevel): string {
  switch (level) {
    case 'INFO':     return 'bg-neutral-400';
    case 'WARN':     return 'bg-amber-500';
    case 'ERROR':    return 'bg-rose-500';
    case 'CRITICAL': return 'bg-rose-700';
  }
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

// ─── JSON Viewer Modal ────────────────────────────────────────────────────────

function JsonModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const jsonStr = JSON.stringify(log.payload ?? {}, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-neutral-200/80 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="min-w-0">
            <p className="text-sm font-bold text-neutral-900 truncate">{log.event}</p>
            <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{formatTs(log.timestamp)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Đã sao chép' : 'Sao chép JSON'}
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {/* JSON body */}
        <div className="flex-1 overflow-auto p-5 bg-neutral-950">
          <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap break-all">
            {jsonStr}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
  label, value, sub, accent = false, error = false,
}: {
  label: string; value: string | number; sub?: string; accent?: boolean; error?: boolean;
}) {
  return (
    <div className={clsx(
      'rounded-2xl border p-4 shadow-xs',
      error ? 'bg-rose-50/60 border-rose-200/80' : accent ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-white border-neutral-200/80',
    )}>
      <p className={clsx('text-[11px] font-semibold uppercase tracking-wider mb-1.5', error ? 'text-rose-600' : accent ? 'text-emerald-700' : 'text-neutral-500')}>
        {label}
      </p>
      <p className={clsx('text-2xl font-extrabold', error ? 'text-rose-800' : accent ? 'text-emerald-900' : 'text-neutral-900')}>
        {value}
      </p>
      {sub && <p className={clsx('text-[11px] mt-0.5', error ? 'text-rose-500' : accent ? 'text-emerald-600' : 'text-neutral-400')}>{sub}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminLogsPage() {
  const [source, setSource] = useState<LogSource>('ALL');
  const [level, setLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [liveFeed, setLiveFeed] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [liveBuffer, setLiveBuffer] = useState<AuditLog[]>([]);
  const tableBottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch logs via TanStack Query
  const { data, isLoading, refetch, isFetching } = useQuery<LogsApiResponse>({
    queryKey: ['admin-logs', source, level, timeRange, debouncedSearch],
    queryFn: () =>
      http.get('/admin/logs', {
        params: {
          source: source === 'ALL' ? undefined : source,
          level: level === 'ALL' ? undefined : level,
          timeRange,
          search: debouncedSearch || undefined,
        },
      }).then((r) => r.data),
    staleTime: 1000 * 15,
    refetchInterval: liveFeed ? false : 30_000,
  });

  // Live WebSocket feed
  useEffect(() => {
    if (!liveFeed) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setLiveConnected(false);
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('kyquy_token') : null;
    const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001').replace(/\/+$/, '');
    const socket = io(`${SOCKET_URL}/admin/logs`, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setLiveConnected(true));
    socket.on('disconnect', () => setLiveConnected(false));
    socket.on('log:entry', (entry: AuditLog) => {
      setLiveBuffer((prev) => [entry, ...prev].slice(0, 200));
    });

    return () => {
      socket.disconnect();
      setLiveConnected(false);
    };
  }, [liveFeed]);

  // Auto-scroll when live feed active
  useEffect(() => {
    if (liveFeed && tableBottomRef.current) {
      tableBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveBuffer, liveFeed]);

  const logs = useMemo<AuditLog[]>(() => {
    const base = data?.logs ?? [];
    return liveFeed ? [...liveBuffer, ...base].slice(0, 500) : base;
  }, [data, liveBuffer, liveFeed]);

  const meta = data?.meta;

  const handleRefetch = useCallback(() => {
    setLiveBuffer([]);
    refetch();
  }, [refetch]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            Nhật ký Hệ thống & Audit Logs
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            VietQR Webhooks · Solana On-Chain Events · GHN/J&T Shipping · Auth Guards
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live feed toggle */}
          <button
            type="button"
            onClick={() => setLiveFeed((v) => !v)}
            className={clsx(
              'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition border',
              liveFeed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200',
            )}
          >
            {liveFeed && liveConnected ? (
              <><Wifi className="h-3.5 w-3.5" /><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Live Feed</>
            ) : liveFeed ? (
              <><WifiOff className="h-3.5 w-3.5 animate-pulse" />Đang kết nối...</>
            ) : (
              <><Wifi className="h-3.5 w-3.5" />Tự động cuộn (Live)</>
            )}
          </button>
          <button
            onClick={handleRefetch}
            disabled={isFetching}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', isFetching && 'animate-spin')} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Tổng Webhook nhận (24h)"
          value={isLoading ? '—' : (meta?.webhookCount24h ?? 0).toLocaleString()}
          sub="Uptime: 99.98%"
          accent
        />
        <MetricCard
          label="Giao dịch On-Chain thành công"
          value={isLoading ? '—' : (meta?.onchainSuccess ?? 0).toLocaleString()}
          sub="Solana Escrow PDA releases"
        />
        <MetricCard
          label="Lỗi / Cảnh báo"
          value={isLoading ? '—' : (meta?.errorCount ?? 0).toLocaleString()}
          sub="Webhook timeouts & reverts"
          error={(meta?.errorCount ?? 0) > 0}
        />
      </div>

      {/* Filter Controls */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-4">
        {/* Source pills */}
        <div className="flex flex-wrap gap-2">
          {SOURCE_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setSource(id)}
              className={clsx(
                'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition border',
                source === id
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Level filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 p-1">
            {(['ALL', ...LEVEL_OPTIONS] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={clsx(
                  'rounded-lg px-3 py-1 text-[11px] font-bold transition',
                  level === l
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-200',
                )}
              >
                {l === 'ALL' ? 'Tất cả' : l}
              </button>
            ))}
          </div>

          {/* Time range */}
          <div className="flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800 p-1">
            {TIME_RANGES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTimeRange(id)}
                className={clsx(
                  'rounded-lg px-3 py-1 text-[11px] font-bold whitespace-nowrap transition',
                  timeRange === id
                    ? 'bg-neutral-700 text-white'
                    : 'text-neutral-500 hover:text-neutral-200',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm Order ID, TX Hash, lỗi..."
              className="w-full h-9 pl-8.5 pr-3 rounded-xl border border-neutral-700 bg-neutral-800 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[140px_120px_1fr_140px_80px_100px] gap-3 px-4 py-3 border-b border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          <span>Timestamp</span>
          <span>Nguồn</span>
          <span>Sự kiện</span>
          <span>Mã đơn / Hash</span>
          <span>Trạng thái</span>
          <span className="text-right">Payload</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-neutral-800/60">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse bg-neutral-800/30 mx-4 my-1 rounded-xl" />
            ))
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <Activity className="h-8 w-8 text-neutral-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-neutral-500">Không có log nào</p>
              <p className="text-xs text-neutral-600 mt-1">Thử thay đổi bộ lọc hoặc khoảng thời gian</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-[140px_120px_1fr_140px_80px_100px] gap-3 px-4 py-3 items-center hover:bg-neutral-800/40 transition group"
              >
                {/* Timestamp */}
                <span className="font-mono text-[10px] text-neutral-400 leading-snug">
                  {formatTs(log.timestamp)}
                </span>

                {/* Source */}
                <span className="text-xs text-neutral-300 truncate font-medium">
                  <span className={clsx('inline-block h-1.5 w-1.5 rounded-full mr-1.5', levelDotClass(log.level))} />
                  {log.source}
                </span>

                {/* Event */}
                <span className="text-xs text-neutral-200 truncate font-semibold">
                  {log.event}
                  {log.durationMs !== undefined && (
                    <span className="ml-2 text-[10px] text-neutral-600 font-normal">{log.durationMs}ms</span>
                  )}
                </span>

                {/* Order ID / Hash */}
                <span className="font-mono text-[10px] text-neutral-500 truncate">
                  {log.orderId || log.txHash
                    ? (log.orderId || log.txHash || '').slice(0, 14) + '…'
                    : <span className="text-neutral-700">—</span>
                  }
                </span>

                {/* Status badge */}
                <span className={clsx(
                  'inline-flex items-center justify-center rounded-lg px-1.5 py-0.5 text-[9px] font-bold text-center',
                  statusBadgeClass(log.status),
                )}>
                  {log.statusCode ? `${log.status} ${log.statusCode}` : log.status}
                </span>

                {/* Actions */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 hover:border-neutral-600 hover:bg-neutral-700 px-2.5 py-1 text-[10px] font-semibold text-neutral-400 hover:text-neutral-200 transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronDown className="h-3 w-3" />
                    JSON
                  </button>
                </div>
              </div>
            ))
          )}
          <div ref={tableBottomRef} />
        </div>

        {/* Table footer */}
        {!isLoading && logs.length > 0 && (
          <div className="px-4 py-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-600">
            <span>
              {liveFeed && (
                <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Live — {liveBuffer.length} mục mới
                </span>
              )}
            </span>
            <span>Tổng: <strong className="text-neutral-400">{meta?.total ?? logs.length}</strong> log entries</span>
          </div>
        )}
      </div>

      {/* JSON Viewer Modal */}
      {selectedLog && (
        <JsonModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}

