import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

export function TestModeBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-linear-to-r from-orange-500 via-amber-500 to-orange-500 animate-gradient-x text-white py-2 relative overflow-hidden group">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">
            Test Rejimi
          </span>
        </div>
        <p className="text-[10px] sm:text-xs font-bold tracking-wider">
          Sayt hozirda test rejimida ishlamoqda. Ma'lumotlar real vaqtda
          yangilanmoqda.
        </p>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Animated Shine Effect */}
      <div className="absolute inset-y-0 -left-full w-1/3 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] group-hover:left-[150%] transition-all duration-1000 ease-in-out" />
    </div>
  );
}
