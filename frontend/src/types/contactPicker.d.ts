// The browser Contact Picker API (navigator.contacts.select) is not part
// of TypeScript's standard DOM lib yet. This is a minimal ambient
// declaration covering only what GuestContactImport.tsx uses.
// Supported in Chrome/Edge on Android only (desktop Chrome and all other
// browsers lack it entirely) - the component always needs a manual-entry
// fallback for every other browser.

interface ContactAddress {
    city?: string[];
    country?: string[];
    dependentLocality?: string[];
    organization?: string[];
    phone?: string[];
    postalCode?: string[];
    recipient?: string[];
    region?: string[];
    sortingCode?: string[];
  }
  
  interface ContactInfo {
    name?: string[];
    email?: string[];
    tel?: string[];
    address?: ContactAddress[];
    icon?: Blob[];
  }
  
  interface ContactsSelectOptions {
    multiple?: boolean;
  }
  
  interface ContactsManager {
    select(
      properties: string[],
      options?: ContactsSelectOptions
    ): Promise<ContactInfo[]>;
    getProperties(): Promise<string[]>;
  }
  
  interface Navigator {
    contacts?: ContactsManager;
  }