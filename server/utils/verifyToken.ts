import jwt from "jsonwebtoken";

export interface DecodedDriverToken {
  driverId: string;
  role: "driver" | "admin";
}

/**
 * =========================
 * VERIFY DRIVER TOKEN
 * =========================
 */
export function verifyDriverToken(token: string): DecodedDriverToken | null {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET not set");
    }

    const decoded = jwt.verify(token, secret) as DecodedDriverToken;

    if (!decoded.driverId) return null;

    return decoded;
  } catch {
    return null;
  }
}
