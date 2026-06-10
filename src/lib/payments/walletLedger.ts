export type LedgerEntryType =
  | "booking_earn"
  | "commission"
  | "payout"
  | "refund";

export interface LedgerEntry {
  id: string;
  driverId: string;
  bookingId: string;
  type: LedgerEntryType;
  amount: number;
  currency: "USD";
  timestamp: number;
}

class WalletLedger {
  private entries: LedgerEntry[] = [];

  add(entry: LedgerEntry) {
    this.entries.push(entry);
  }

  getDriverBalance(driverId: string): number {
    return this.entries
      .filter((e) => e.driverId === driverId)
      .reduce((sum, e) => {
        if (e.type === "booking_earn") return sum + e.amount;
        if (e.type === "commission") return sum - e.amount;
        if (e.type === "payout") return sum - e.amount;
        return sum;
      }, 0);
  }

  getAll() {
    return this.entries;
  }
}

export const walletLedger = new WalletLedger();
