
/**
 * =========================
 * TERMS GUARD SYSTEM
 * =========================
 * Blocks drivers who have not accepted legal terms
 */

class TermsGuard {
  private acceptedUsers = new Set<string>();

  accept(userId: string) {
    this.acceptedUsers.add(userId);
  }

  hasAccepted(userId: string): boolean {
    return this.acceptedUsers.has(userId);
  }

  /**
   * BLOCK DISPATCH IF NOT COMPLIANT
   */
  canAssignDriver(driverId: string): boolean {
    return this.hasAccepted(driverId);
  }
}

export const termsGuard = new TermsGuard();
