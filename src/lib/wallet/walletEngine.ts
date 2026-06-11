import { supabase } from "@/lib/supabaseClient";

/**
 * =========================================================
 * SAFE DRIVE WALLET ENGINE (LEDGER SYSTEM)
 * =========================================================
 */

interface WalletTransaction {
  id: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  currency: "USD";
  referenceId: string;
  description: string;
  createdAt: number;
}

class WalletEngine {
  /**
   * =========================
   * CREDIT DRIVER
   * =========================
   */
  async creditDriver(
    driverId: string,
    amount: number,
    referenceId: string,
    description = "Trip earnings",
  ) {
    await this.createTransaction({
      id: crypto.randomUUID(),
      userId: driverId,
      type: "credit",
      amount,
      currency: "USD",
      referenceId,
      description,
      createdAt: Date.now(),
    });
  }

  /**
   * =========================
   * DEBIT DRIVER (withdrawals, fees)
   * =========================
   */
  async debitDriver(
    driverId: string,
    amount: number,
    referenceId: string,
    description = "Payout withdrawal",
  ) {
    await this.createTransaction({
      id: crypto.randomUUID(),
      userId: driverId,
      type: "debit",
      amount,
      currency: "USD",
      referenceId,
      description,
      createdAt: Date.now(),
    });
  }

  /**
   * =========================
   * GET BALANCE
   * =========================
   */
  async getBalance(userId: string): Promise<number> {
    const { data } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("userId", userId);

    if (!data) return 0;

    return data.reduce((sum: number, tx: any) => {
      return tx.type === "credit" ? sum + tx.amount : sum - tx.amount;
    }, 0);
  }

  /**
   * =========================
   * TRANSACTION CREATION
   * =========================
   */
  private async createTransaction(tx: WalletTransaction) {
    await supabase.from("wallet_transactions").insert(tx);
  }
}

export const walletEngine = new WalletEngine();
