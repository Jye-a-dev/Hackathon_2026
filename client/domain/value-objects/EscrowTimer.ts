export class EscrowTimer {
  constructor(public readonly expiresAt: Date) {}

  public getRemainingSeconds(): number {
    const diff = Math.floor((this.expiresAt.getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  }

  public isExpired(): boolean {
    return this.getRemainingSeconds() <= 0;
  }

  public formatCountdown(): string {
    const totalSec = this.getRemainingSeconds();
    const hours = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSec % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  public getProgressPercentage(totalDurationSeconds: number = 172800): number {
    const remaining = this.getRemainingSeconds();
    return Math.min(100, Math.max(0, ((totalDurationSeconds - remaining) / totalDurationSeconds) * 100));
  }
}

