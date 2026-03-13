import type { ReactNode } from 'react';
import { Sidebar, Header } from '../../../../shared/components/layout';
import { useAuthStore } from '../../../../stores';
import { COLORS } from '../../../../config/theme';

interface EquationsLayoutProps {
  children: ReactNode;
}

export const EquationsLayout = ({ children }: EquationsLayoutProps) => {
  const user = useAuthStore((state) => state.user);

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ backgroundColor: COLORS.background }}
    >
      {user && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header />

        <main className={`flex-1 min-h-0 py-6 overflow-auto relative flex flex-col ${user ? 'pl-8 pr-4' : 'px-6'}`}>
          <div className={`flex-1 flex flex-col min-h-full ${user ? '' : 'max-w-7xl mx-auto w-full'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
