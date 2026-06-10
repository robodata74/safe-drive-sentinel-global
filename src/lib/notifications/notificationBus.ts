export type NotificationType =
  | "warning"
  | "violation"
  | "suspension"
  | "payout_hold"
  | "info";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}

class NotificationBus {
  private listeners = new Map<string, (n: Notification) => void>();

  /**
   * =========================
   * SUBSCRIBE (socket / app client)
   * =========================
   */
  subscribe(userId: string, callback: (n: Notification) => void) {
    this.listeners.set(userId, callback);
  }

  /**
   * =========================
   * UNSUBSCRIBE
   * =========================
   */
  unsubscribe(userId: string) {
    this.listeners.delete(userId);
  }

  /**
   * =========================
   * SEND NOTIFICATION
   * =========================
   */
  send(notification: Notification) {
    const listener = this.listeners.get(notification.userId);

    if (listener) {
      listener(notification);
    }

    console.log("📢 NOTIFICATION SENT:", notification);
  }
}

export const notificationBus = new NotificationBus();
