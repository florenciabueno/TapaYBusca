import { LoginForm } from '../components/LoginForm';

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-yellow-50">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center mb-4 shadow-md">
            <span className="text-white text-2xl font-bold">TB</span>
          </div>
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            TapaYBusca
          </h1>
          <p className="text-gray-600 text-sm">
            Aplicación educativa de matemáticas
          </p>
        </div>

        <LoginForm />

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-around">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center mb-2">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="16" rx="2" fill="#10B981"/>
                  <rect x="5" y="7" width="14" height="2" fill="white"/>
                  <rect x="5" y="11" width="10" height="2" fill="#EF4444"/>
                  <rect x="5" y="15" width="12" height="2" fill="#3B82F6"/>
                </svg>
              </div>
              <span className="text-sm text-gray-700">Aprende</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center mb-2">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.71 7.04C21.1 6.65 21.1 6 20.71 5.63L18.37 3.29C18 2.9 17.35 2.9 16.96 3.29L15.12 5.12L18.87 8.87M3 17.25V21H6.75L17.81 9.93L14.06 6.18L3 17.25Z" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </div>
              <span className="text-sm text-gray-700">Practica</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 flex items-center justify-center mb-2">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#EF4444"/>
                  <circle cx="12" cy="12" r="6" fill="white"/>
                  <circle cx="12" cy="12" r="2" fill="#EF4444"/>
                </svg>
              </div>
              <span className="text-sm text-gray-700">Mejora</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
