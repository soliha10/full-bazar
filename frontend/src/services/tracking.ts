declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackGaEvent(name: string, params?: Record<string, unknown>): void {
  try {
    window.gtag?.('event', name, params);
  } catch {
    // GA should never break the UI
  }
}

const SESSION_KEY = 'fb_session_id';

function initSession(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export const sessionId = initSession();

export async function trackEvent(
  event_type: 'view' | 'search' | 'cart_add',
  product_id?: string,
  search_query?: string,
): Promise<void> {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, event_type, product_id, search_query }),
    });
  } catch {
    // tracking should never break the UI
  }
}

// Fired whenever a user clicks through to a store to (presumably) buy —
// the closest purchase-intent signal we can capture, since the actual
// checkout happens on the store's own site, outside our visibility.
export function trackStoreClick(productId: string | number, source: string, price?: number): void {
  trackEvent('cart_add', String(productId));
  trackGaEvent('store_click', { store: source, product_id: String(productId), price });
}
