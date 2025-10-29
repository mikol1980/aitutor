import { useState } from 'react';

export default function LandingHero() {
  const [showButtons, setShowButtons] = useState(false);

  return (
    <div className="relative w-full mx-auto min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
      <div className="text-center space-y-8">
        <h1
          className={`text-3xl sm:text-5xl md:text-6xl font-bold text-white drop-shadow-2xl transition-all duration-500 ${
            showButtons ? 'opacity-70 scale-95' : 'opacity-100 scale-100 cursor-pointer hover:scale-105'
          }`}
          onClick={() => setShowButtons(true)}
        >
          You can do it — just start learning!
        </h1>

        {showButtons && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fadeIn">
            <a
              href="/auth/login"
              className="px-8 py-4 bg-white text-indigo-900 font-semibold rounded-xl shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-300 text-lg min-w-[200px]"
            >
              Zaloguj się
            </a>
            <a
              href="/auth/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-2xl hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 text-lg min-w-[200px]"
            >
              Zarejestruj się
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
