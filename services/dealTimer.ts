import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

/** The one-time offer runs for 15 minutes from the first time it is shown. */
const WINDOW_MS = 15 * 60 * 1000;
const KEY = 'perfumesnap_deal_ends_at';

let endsAt: number | null = null;
let loaded = false;
/** The offer stays over the normal page until its own × is used this launch. */
let offerDismissedThisLaunch = false;
const listeners = new Set<(value: number | null) => void>();

function publish(value: number | null) {
  endsAt = value;
  listeners.forEach((listener) => listener(value));
}

const ready = SecureStore.getItemAsync(KEY)
  .then((raw) => {
    const value = raw ? Number(raw) : NaN;
    if (!Number.isFinite(value)) return;
    if (Date.now() >= value) {
      void SecureStore.deleteItemAsync(KEY).catch(() => undefined);
      return;
    }
    publish(value);
  })
  .catch(() => undefined)
  .finally(() => {
    loaded = true;
  });

/** Starts the countdown the first time the offer appears. Later calls keep the original end. */
export async function startDealTimer(): Promise<number> {
  if (!loaded) await ready;
  if (endsAt !== null) return endsAt;
  const value = Date.now() + WINDOW_MS;
  publish(value);
  void SecureStore.setItemAsync(KEY, String(value)).catch(() => undefined);
  return value;
}

export function dealExpired(): boolean {
  return endsAt !== null && Date.now() >= endsAt;
}

/** Resolves after the saved countdown has been read. */
export function whenDealTimerReady(): Promise<void> {
  return ready.then(() => undefined);
}

/** True while the countdown is running and the offer has not been closed this launch. */
export function offerShouldOpen(): boolean {
  return endsAt !== null && Date.now() < endsAt && !offerDismissedThisLaunch;
}

/** The offer's own × reveals the page underneath for the rest of this launch. */
export function dismissOfferForSession() {
  offerDismissedThisLaunch = true;
}

export function useDealEndsAt(): number | null {
  const [value, setValue] = useState(endsAt);
  useEffect(() => {
    listeners.add(setValue);
    setValue(endsAt);
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
}

/** Milliseconds left, ticking once a second. Null before the offer has been shown. */
export function useDealRemaining(): number | null {
  const ends = useDealEndsAt();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (ends === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [ends]);
  return ends === null ? null : Math.max(0, ends - now);
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
