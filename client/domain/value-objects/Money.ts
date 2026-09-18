export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: 'VND' | 'SOL' = 'VND'
  ) {
    if (amount < 0) throw new Error("Số tiền không thể là số âm");
  }

  public format(): string {
    if (this.currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(this.amount);
    }
    return `${this.amount.toFixed(3)} SOL`;
  }

  public toSolEquivalent(solVndRate: number): Money {
    if (solVndRate <= 0) throw new Error("Tỷ giá SOL không hợp lệ");
    return new Money(this.amount / solVndRate, 'SOL');
  }

  public add(other: Money): Money {
    if (this.currency !== other.currency) throw new Error("Không thể cộng khác loại tiền tệ");
    return new Money(this.amount + other.amount, this.currency);
  }
}

