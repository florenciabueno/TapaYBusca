import { createContext, useContext, useState } from 'react';

const STORAGE_KEY = 'tapaYBusca_signUpPromoDismissed';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

interface PromoBannerContextValue {
  isPromoDismissed: boolean;
  dismissPromo: () => void;
}

const PromoBannerContext = createContext<PromoBannerContextValue | null>(null);

export function PromoBannerProvider({ children }: { children: React.ReactNode }) {
  const [isPromoDismissed, setIsPromoDismissed] = useState(readDismissed);

  const dismissPromo = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setIsPromoDismissed(true);
  };

  return (
    <PromoBannerContext.Provider value={{ isPromoDismissed, dismissPromo }}>
      {children}
    </PromoBannerContext.Provider>
  );
}

export function usePromoBanner() {
  const ctx = useContext(PromoBannerContext);
  return ctx;
}
