import { Brain, Hospital, MessageSquare, CircleUser as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import { sanitizeAvatarUrl } from '../../lib/utils';

export function Header() {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 bg-white border-b border-gray-100 z-50 md:hidden">
      <div className="flex justify-between items-center h-14 px-4 max-w-lg mx-auto">
        <Link to="/">
          <h1 className="text-xl font-black text-[#006747] tracking-tighter italic">VIVA+</h1>
        </Link>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pr-2 border-r border-gray-100">
            <Link to="/mensagens" className="relative text-black hover:text-[#006747] transition-colors p-1">
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full border border-white" />
            </Link>
          </div>

          <Link 
            to="/perfil"
            className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#006747] hover:bg-emerald-100 transition-colors"
          >
            <Brain className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </header>
  );
}
