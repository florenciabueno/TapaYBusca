import type { ReactNode } from 'react';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';

interface EquationsLayoutProps {
  children: ReactNode;
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const EquationsLayout = ({ children }: EquationsLayoutProps) => {
  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(135deg, #EDEDCE 0%, #f5f5e8 50%, #EDEDCE 100%)' }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 pl-8 pr-6 py-6 overflow-auto relative">
          {children}

          <button
            type="button"
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 text-white"
            style={{ backgroundColor: '#0C2C55' }}
            aria-label="Ayuda"
          >
            <HelpIcon className="w-6 h-6" />
          </button>
        </main>
      </div>
    </div>
  );
};
