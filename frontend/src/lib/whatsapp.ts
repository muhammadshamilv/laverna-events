/**
 * Open the WhatsApp tab at the moment of the click, then point it at the
 * wa.me link once the server has built it. Browsers only allow a new tab
 * during the click itself, so opening it after the request finished is
 * often blocked.
 */
export function openPendingWhatsAppWindow(): Window | null {
    const popup = window.open("", "_blank");
  
    if (popup) {
      try {
        popup.opener = null;
        popup.document.title = "Opening WhatsApp...";
        popup.document.body.style.fontFamily = "sans-serif";
        popup.document.body.textContent = "Opening WhatsApp...";
      } catch {
        // Cosmetic only - ignore.
      }
    }
  
    return popup;
  }
  
  /** Returns false if the browser blocked the window. */
  export function navigateWhatsAppWindow(popup: Window | null, url: string): boolean {
    if (popup && !popup.closed) {
      popup.location.href = url;
      return true;
    }
  
    const fallback = window.open(url, "_blank");
  
    return fallback !== null;
  }