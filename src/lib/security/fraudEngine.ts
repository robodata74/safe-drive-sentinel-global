class FraudEngine {
  /**
   * DRIVER RISK SCORE
   */
  scoreDriver(driver: any): number {
    let score = 100;

    if (!driver.lastSeen || Date.now() - driver.lastSeen > 60000) {
      score -= 30;
    }

    if (driver.completed_jobs < 3) {
      score -= 20;
    }

    if (driver.rating < 3.5) {
      score -= 25;
    }

    return Math.max(0, score);
  }

  /**
   * BLOCK HIGH-RISK PAYOUTS
   */
  isHighRisk(driver: any): boolean {
    return this.scoreDriver(driver) < 50;
  }
}

export const fraudEngine = new FraudEngine();
