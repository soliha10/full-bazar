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
