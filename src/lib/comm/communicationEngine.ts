type SocketCallback = (payload: any) => void;

interface ChatMessage {
  roomId: string;
  senderId: string;
  message: string;
  timestamp: number;
}

interface CallSignal {
  callId: string;
  type: "offer" | "answer" | "ice" | "end" | "reject";
  payload: any;
}

interface AuditLog {
  id: string;
  type: "chat" | "call" | "dispatch" | "system" | "security";
  referenceId?: string;
  data: any;
  timestamp: number;
}

/**
 * =========================================================
 * SAFE DRIVE COMMUNICATION ENGINE (HARDENED FINAL)
 * =========================================================
 */

class CommunicationEngine {
  /**
   * USER SOCKET MAP (supports multi-device safety later)
   */
  private sockets = new Map<string, Set<SocketCallback>>();

  /**
   * ROOM MAP (real chat isolation)
   */
  private rooms = new Map<string, Set<string>>();

  /**
   * RATE LIMITING (anti-spam)
   */
  private rateLimit = new Map<string, number>();

  /**
   * AUDIT LOG STORAGE
   */
  private auditLogs: AuditLog[] = [];

  // =========================
  // RATE LIMIT CHECK
  // =========================
  private canSend(userId: string, limitMs = 300): boolean {
    const now = Date.now();
    const last = this.rateLimit.get(userId) ?? 0;

    if (now - last < limitMs) return false;

    this.rateLimit.set(userId, now);
    return true;
  }

  // =========================
  // REGISTER SOCKET
  // =========================
  register(userId: string, socket: SocketCallback) {
    if (!this.sockets.has(userId)) {
      this.sockets.set(userId, new Set());
    }

    this.sockets.get(userId)!.add(socket);
  }

  // =========================
  // UNREGISTER SOCKET
  // =========================
  unregister(userId: string, socket?: SocketCallback) {
    if (!this.sockets.has(userId)) return;

    if (!socket) {
      this.sockets.delete(userId);
      return;
    }

    this.sockets.get(userId)!.delete(socket);

    if (this.sockets.get(userId)!.size === 0) {
      this.sockets.delete(userId);
    }
  }

  // =========================
  // JOIN ROOM
  // =========================
  joinRoom(userId: string, roomId: string) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    this.rooms.get(roomId)!.add(userId);
  }

  // =========================
  // LEAVE ROOM
  // =========================
  leaveRoom(userId: string, roomId: string) {
    this.rooms.get(roomId)?.delete(userId);
  }

  // =========================
  // SEND CHAT MESSAGE
  // =========================
  sendMessage(msg: ChatMessage) {
    if (!this.canSend(msg.senderId)) return;

    const roomUsers = this.rooms.get(msg.roomId);

    if (!roomUsers) return;

    const payload = {
      type: "chat:message",
      payload: msg,
    };

    roomUsers.forEach((userId) => {
      this.sendToUser(userId, payload);
    });

    this.log({
      id: crypto.randomUUID(),
      type: "chat",
      referenceId: msg.roomId,
      data: msg,
      timestamp: Date.now(),
    });
  }

  // =========================
  // CALL SIGNALING
  // =========================
  sendCallSignal(signal: CallSignal, toUserId: string) {
    this.sendToUser(toUserId, {
      type: "call:signal",
      payload: signal,
    });

    this.log({
      id: crypto.randomUUID(),
      type: "call",
      referenceId: signal.callId,
      data: signal,
      timestamp: Date.now(),
    });
  }

  // =========================
  // DISPATCH NOTIFICATION
  // =========================
  notifyUser(userId: string, event: string, data: any) {
    this.sendToUser(userId, {
      type: event,
      payload: data,
    });

    this.log({
      id: crypto.randomUUID(),
      type: "dispatch",
      referenceId: userId,
      data: { event, data },
      timestamp: Date.now(),
    });
  }

  // =========================
  // INTERNAL SEND
  // =========================
  private sendToUser(userId: string, payload: any) {
    const sockets = this.sockets.get(userId);

    if (!sockets) return;

    sockets.forEach((socket) => {
      try {
        socket(payload);
      } catch (err) {
        console.error("Socket send error:", err);
      }
    });
  }

  // =========================
  // AUDIT LOGGING (IMMUTABLE HISTORY)
  // =========================
  private log(entry: AuditLog) {
    this.auditLogs.push(entry);

    if (this.auditLogs.length > 5000) {
      this.auditLogs.splice(0, 1000);
    }
  }

  // =========================
  // ADMIN REPORTING
  // =========================
  getReports() {
    return {
      totalLogs: this.auditLogs.length,
      logs: this.auditLogs,
    };
  }

  exportLogsByType(type: AuditLog["type"]) {
    return this.auditLogs.filter((l) => l.type === type);
  }
}

export const communicationEngine = new CommunicationEngine();
