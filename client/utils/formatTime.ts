// ─────────────────────────────────────────────
// utils/formatTime.ts
// ─────────────────────────────────────────────

/**
 * Format milliseconds còn lại → "mm:ss"
 * VD: 900000 → "15:00"
 */
export function formatCountdownMmSs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format seconds hoặc ms → "mm:ss"
 */
export function formatCountdown(secondsOrMs: number): string {
  const sec = secondsOrMs > 10000 ? Math.floor(secondsOrMs / 1000) : secondsOrMs;
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format milliseconds còn lại → "hh:mm:ss"
 * VD: 172800000 → "48:00:00"
 */
export function formatCountdownHhMmSs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Format seconds còn lại → "hh:mm:ss"
 */
export function format48hCountdown(seconds: number): string {
  const totalSeconds = Math.max(0, seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * Tính thời gian từ createdAt đến hiện tại
 * VD: "vừa xong" | "5 phút trước" | "2 giờ trước" | "3 ngày trước"
 */
export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'vừa xong';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `${months} tháng trước`;
}

/**
 * Tính ms còn lại từ deliveredAt + 48 giờ
 */
export function get48hRemaining(deliveredAt: string): number {
  const end = new Date(deliveredAt).getTime() + 48 * 60 * 60 * 1000;
  return Math.max(0, end - Date.now());
}
