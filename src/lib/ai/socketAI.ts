import { dispatchStore } from "@/lib/dispatch/dispatchStore";
import { userMemory } from "./userMemory";

interface SocketSession {
  userId: string;
  role: "driver" | "customer";
  socketId: string;
  lastActive: number;
}

/**
 * =========================
 * SOCKET AI SESSION ENGINE
 * =========================
 * Restores full system state on reconnect
 */
class SocketAIEngine {
  private sessions = new Map<string, SocketSession>();

  /**
   * =========================
   * REGISTER CONNECTION
   * =========================
   */
  connect(userId: string, role: "driver" | "customer", socketId: string) {
    const memory = userMemory.get(userId);

    const session: SocketSession = {
      userId,
      role,
      socketId,
      lastActive: Date.now(),
    };

    this.sessions.set(socketId, session);

    console.log("🔌 SOCKET CONNECTED:", {
      userId,
      role,
      lastKnownLocation: memory.lastKnownLocation,
      lastBooking: memory.lastBookingId,
    });

    /**
     * =========================
     * RESTORE CONTEXT
     * =========================
     */
    return {
      type: "session_restored",
      payload: {
        userId,
        role,
        memory,
        snapshot: dispatchStore.getSnapshot(),
      },
    };
  }

  /**
   * =========================
   * UPDATE ACTIVITY
   * =========================
   */
  heartbeat(socketId: string) {
    const session = this.sessions.get(socketId);
    if (!session) return;

    session.lastActive = Date.now();
    this.sessions.set(socketId, session);
  }

  /**
   * =========================
   * HANDLE DISCONNECT
   * =========================
   */
  disconnect(socketId: string) {
    const session = this.sessions.get(socketId);

    if (!session) return;

    console.log("❌ SOCKET DISCONNECTED:", session.userId);

    this.sessions.delete(socketId);
  }

  /**
   * =========================
   * GET SESSION
   * =========================
   */
  getSession(socketId: string) {
    return this.sessions.get(socketId);
  }
}

export const socketAI = new SocketAIEngine();
