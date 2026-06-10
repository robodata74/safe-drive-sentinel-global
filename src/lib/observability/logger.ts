type LogLevel = "info" | "warn" | "error";

class Logger {
  private format(level: LogLevel, message: string, meta?: unknown) {
    return JSON.stringify({
      level,
      message,
      meta,
      timestamp: new Date().toISOString(),
    });
  }

  info(message: string, meta?: unknown) {
    console.log(this.format("info", message, meta));
  }

  warn(message: string, meta?: unknown) {
    console.warn(this.format("warn", message, meta));
  }

  error(message: string, meta?: unknown) {
    console.error(this.format("error", message, meta));
  }
}

export const logger = new Logger();
