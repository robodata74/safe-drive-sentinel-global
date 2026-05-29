// ─── Booking State Machine ────────────────────────────────
// Enforces valid status transitions throughout the lifecycle

export type BookingStatus =
  | 'searching'   // customer submitted, looking for provider
  | 'matched'     // PayPal captured, driver assigned
  | 'accepted'    // driver confirmed job
  | 'en_route'    // driver heading to pickup
  | 'arrived'     // driver at pickup location
  | 'loading'     // vehicle being loaded
  | 'in_transit'  // vehicle in transport
  | 'delivered'   // arrived at dropoff
  | 'completed'   // customer confirmed, payment released
  | 'cancelled'   // cancelled by either party

// Valid transitions: from → allowed next states
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  searching:  ['matched',   'cancelled'],
  matched:    ['accepted',  'cancelled'],
  accepted:   ['en_route',  'cancelled'],
  en_route:   ['arrived',   'cancelled'],
  arrived:    ['loading'],
  loading:    ['in_transit'],
  in_transit: ['delivered'],
  delivered:  ['completed'],
  completed:  [],
  cancelled:  [],
}

// Who can trigger each transition
const ACTOR: Record<string, 'system' | 'driver' | 'customer' | 'admin'> = {
  'searching→matched':    'system',
  'matched→accepted':     'driver',
  'accepted→en_route':    'driver',
  'en_route→arrived':     'driver',
  'arrived→loading':      'driver',
  'loading→in_transit':   'driver',
  'in_transit→delivered': 'driver',
  'delivered→completed':  'customer',
  'searching→cancelled':  'customer',
  'matched→cancelled':    'admin',
  'accepted→cancelled':   'admin',
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function getActor(from: BookingStatus, to: BookingStatus) {
  return ACTOR[`${from}→${to}`] ?? 'admin'
}

export function getNextStates(current: BookingStatus): BookingStatus[] {
  return TRANSITIONS[current] ?? []
}

export function isFinalState(status: BookingStatus): boolean {
  return status === 'completed' || status === 'cancelled'
}

export class BookingStateMachineError extends Error {
  constructor(from: BookingStatus, to: BookingStatus) {
    super(`Invalid transition: ${from} → ${to}`)
    this.name = 'BookingStateMachineError'
  }
}
