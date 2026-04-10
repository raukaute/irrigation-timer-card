/** Timer mode — matches Tuya DP encoding */
export enum TimerMode {
  Duration = 0,
  Volume = 1,
}

/** Single timer slot data */
export interface TimerSlot {
  slot: number;
  mode: TimerMode;
  /** Seconds when mode=Duration, liters when mode=Volume */
  value: number;
  hour: number;
  minute: number;
  /** Bitmask: bit0=Mon, bit1=Tue, ..., bit6=Sun */
  daysMask: number;
  enabled: boolean;
}

/** Days of week for UI display */
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Card configuration */
export interface IrrigationTimerCardConfig {
  type: string;
  /** Entity ID of the time_task sensor (summary) */
  entity: string;
  /** Entity ID of the time_task slot sensor */
  slot_entity?: string;
  /** Tuya device ID for sending commands */
  device_id?: string;
  /** Tuya account name (e.g. "solar-valves@mavronero.cy") for call_api */
  tuya_account?: string;
  /** Name override */
  name?: string;
}

/**
 * Encode a timer slot into an 11-byte base64 blob for writing to time_task DP.
 *
 * Layout: [slot_index, count=1, mode, value(4 bytes uint32 BE), hour, minute, days_mask, enabled]
 */
export function encodeTimerSlot(timer: TimerSlot): string {
  const bytes = new Uint8Array(11);
  bytes[0] = timer.slot;
  bytes[1] = 1; // count = 1 timer per message
  bytes[2] = timer.mode;
  // value as uint32 big-endian
  const view = new DataView(bytes.buffer);
  view.setUint32(3, timer.value, false); // false = big-endian
  bytes[7] = timer.hour;
  bytes[8] = timer.minute;
  bytes[9] = timer.daysMask;
  bytes[10] = timer.enabled ? 1 : 0;
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Encode a "delete" command — sets count=0 for the given slot.
 */
export function encodeTimerDelete(slot: number): string {
  const bytes = new Uint8Array(11);
  bytes[0] = slot;
  bytes[1] = 0; // count = 0 = no active timer
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Decode a base64 time_task blob into a TimerSlot (or null if count=0).
 */
export function decodeTimerBlob(base64: string): TimerSlot | null {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  if (bytes.length < 11) return null;

  const count = bytes[1];
  if (count === 0) return null;

  const view = new DataView(bytes.buffer);
  return {
    slot: bytes[0],
    mode: bytes[2] as TimerMode,
    value: view.getUint32(3, false),
    hour: bytes[7],
    minute: bytes[8],
    daysMask: bytes[9],
    enabled: bytes[10] === 1,
  };
}
