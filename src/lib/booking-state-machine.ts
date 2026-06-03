import type { BookingStatus } from "@/types";

export type Actor = "system" | "driver" | "customer" | "admin";

type TransitionKey = `${BookingStatus}→${BookingStatus}`;

const TRANSITIONS: Readonly<Record<BookingStatus, BookingStatus[]>> = {
  pending: ["matched", "cancelled"],

  matched: ["in_progress", "cancelled"],

  in_progress: ["completed", "cancelled"],

  completed: [],

  cancelled: [],
};

const ACTOR_MAP: Partial<Record<TransitionKey, Actor>> = {
  "pending→matched": "system",

  "matched→in_progress": "driver",

  "in_progress→completed": "customer",

  "pending→cancelled": "customer",

  "matched→cancelled": "admin",

  "in_progress→cancelled": "admin",
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getActor(from: BookingStatus, to: BookingStatus): Actor {
  return ACTOR_MAP[`${from}→${to}`] ?? "admin";
}

export function getNextStates(current: BookingStatus): BookingStatus[] {
  return TRANSITIONS[current] ?? [];
}

export function isFinalState(status: BookingStatus): boolean {
  return status === "completed" || status === "cancelled";
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new BookingStateMachineError(from, to);
  }
}

export class BookingStateMachineError extends Error {
  readonly from: BookingStatus;

  readonly to: BookingStatus;

  constructor(from: BookingStatus, to: BookingStatus) {
    super(`Invalid booking transition: ${from} → ${to}`);

    this.name = "BookingStateMachineError";

    this.from = from;
    this.to = to;
  }
}
