import { HeartPulse, Brain, Hospital, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

export function Header() {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 bg-white border-b border-gray-100 z-40 md:hidden">
      <div className="flex justify-between items-center h-12 px-4 max-w-lg mx-auto">
        <Link to="/">
          <h1 className="text-xl font-bold text-[#006747]">VIVA+</h1>
        </Link>
        
        <div className="flex items-center space-x-5">
          <Link to="/mensagens" className="relative text-gray-700 hover:text-[#006747] transition-colors">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full border border-white" />
          </Link>
          {profile?.is_professional && (
            <button className="text-gray-700 hover:text-[#006747] transition-colors">
              <Hospital className="w-6 h-6" />
            </button>
          )}
          <button className="relative text-gray-700 hover:text-[#006747] transition-colors">
            <HeartPulse className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full border border-white" />
          </button>
          <button className="text-gray-700 hover:text-[#006747] transition-colors">
            <Brain className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
