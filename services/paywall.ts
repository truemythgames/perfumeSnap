let paywallDismissedForSession = false;

export function dismissPaywallForSession() {
  paywallDismissedForSession = true;
}

export function resetPaywallDismissal() {
  paywallDismissedForSession = false;
}

export function isPaywallDismissedForSession() {
  return paywallDismissedForSession;
}
