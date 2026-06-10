import { type ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar, Header, HelpManualButton } from '../../../../shared/components/layout';
import { PromoBannerProvider } from '../../../../shared/context/PromoBannerContext';
import { useAuthStore } from '../../../../stores';
import { COLORS } from '../../../../config/theme';

interface EquationsLayoutProps {
  children: ReactNode;
}

export const EquationsLayout = ({ children }: EquationsLayoutProps) => {
  const user = useAuthStore((state) => state.user);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  return (
    <PromoBannerProvider>
      <div
        className="flex h-dvh overflow-hidden"
        style={{ backgroundColor: COLORS.background }}
      >
        {user && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <Header
            onMenuClick={user ? () => setIsSidebarOpen((o) => !o) : undefined}
          />

          <main className="relative flex flex-1 min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6">
            <div className={`flex min-h-0 w-full min-w-0 flex-1 flex-col ${user ? '' : 'max-w-7xl mx-auto'}`}>
              {children}
            </div>
          </main>
        </div>

        <HelpManualButton />
      </div>
    </PromoBannerProvider>
  );
};
