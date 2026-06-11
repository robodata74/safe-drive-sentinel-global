export interface UserSessionMemory {
  userId: string;
  lastKnownLocation?: {
    lat: number;
    lng: number;
  };

  lastBookingId?: string;

  preferredService?: string;

  lastActiveAt: number;

  routeHistory: {
    from: { lat: number; lng: number };
    to: { lat: number; lng: number };
    timestamp: number;
  }[];

  meta?: Record<string, unknown>;
}

/**
 * =========================
 * AI MEMORY ENGINE
 * =========================
 * Lightweight "brain layer" for SafeDrive
 */
class UserMemoryEngine {
  private memory = new Map<string, UserSessionMemory>();

  /**
   * LOAD OR CREATE SESSION
   */
  get(userId: string): UserSessionMemory {
    const existing = this.memory.get(userId);

    if (existing) return existing;

    const fresh: UserSessionMemory = {
      userId,
      lastActiveAt: Date.now(),
      routeHistory: [],
    };

    this.memory.set(userId, fresh);

    return fresh;
  }

  /**
   * UPDATE LOCATION (GPS FEED)
   */
  updateLocation(userId: string, lat: number, lng: number): void {
    const session = this.get(userId);

    session.lastKnownLocation = { lat, lng };
    session.lastActiveAt = Date.now();

    this.memory.set(userId, session);
  }

  /**
   * SAVE BOOKING CONTEXT
   */
  setLastBooking(userId: string, bookingId: string): void {
    const session = this.get(userId);

    session.lastBookingId = bookingId;
    session.lastActiveAt = Date.now();

    this.memory.set(userId, session);
  }

  /**
   * SAVE ROUTE HISTORY (AI LEARNING DATA)
   */
  pushRoute(
    userId: string,
    from: { lat: number; lng: number },
    to: { lat: number; lng: number },
  ): void {
    const session = this.get(userId);

    session.routeHistory.push({
      from,
      to,
      timestamp: Date.now(),
    });

    // keep memory clean
    if (session.routeHistory.length > 50) {
      session.routeHistory.shift();
    }

    this.memory.set(userId, session);
  }

  /**
   * AI CONTEXT FOR DISPATCH ENGINE
   */
  getAIContext(userId: string) {
    const session = this.get(userId);

    return {
      location: session.lastKnownLocation,
      lastBooking: session.lastBookingId,
      preferredService: session.preferredService,
      routePatterns: session.routeHistory,
    };
  }

  /**
   * CLEAR SESSION (LOGOUT)
   */
  clear(userId: string): void {
    this.memory.delete(userId);
  }
}

export const userMemory = new UserMemoryEngine();
