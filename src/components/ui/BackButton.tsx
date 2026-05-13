import { ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show back button on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <button
      onClick={() => navigate(-1)}
      className={cn(
        "fixed top-3 left-3 z-[100] flex items-center justify-center p-2 rounded-xl bg-white/90 backdrop-blur-md border border-gray-100 shadow-lg text-[#006747] hover:bg-[#006747] hover:text-white transition-all active:scale-95 group",
        "md:sticky md:top-6 md:left-6 md:mb-4 lg:ml-6 md:z-10 md:shadow-sm"
      )}
      title="Voltar"
    >
      <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
      <span className="text-xs font-bold ml-1 hidden md:inline">Voltar</span>
    </button>
  );
}
