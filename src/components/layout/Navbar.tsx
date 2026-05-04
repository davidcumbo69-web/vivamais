import { Heart, Microscope, Pill, Hospital, Stethoscope, Film, UserCircle as UserIcon, Apple, Trophy, CalendarCheck, ShoppingBag, LogOut, MessageSquare } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const { profile, signOut } = useAuth();
  
  const navItems = [
    { icon: Stethoscope, label: 'Feed', path: '/' },
    { icon: Microscope, label: 'Explorar', path: '/explore' },
    { icon: Film, label: 'Reels', path: '/reels' },
    { icon: Trophy, label: 'Desafios', path: '/challenges' },
    ...(!profile?.is_professional ? [
      { icon: ShoppingBag, label: 'Encomendas', path: '/my-orders' }
    ] : []),
    { icon: CalendarCheck, label: 'Consultas', path: '/appointments' },
    { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
    ...(profile?.is_professional ? [
      { icon: Hospital, label: 'Criar', path: '/create' }
    ] : [
      { icon: Apple, label: 'Game', path: '/gamification' }
    ]),
    { icon: Pill, label: 'Mercado', path: '/marketplace' },
    { icon: UserIcon, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:top-0 md:left-0 md:bottom-0 md:w-20 lg:w-64 md:border-r md:border-t-0 shadow-lg md:shadow-none">
      <div className="flex justify-around items-center h-16 md:flex-col md:h-full md:justify-start md:pt-8 md:px-4">
        <div className="hidden md:block mb-10 w-full">
            <h1 className="text-2xl font-black text-[#006747] lg:px-4 tracking-tighter">VIVA+</h1>
        </div>
        
        <div className="flex justify-around items-center w-full md:flex-col md:h-[calc(100%-120px)] md:justify-start overflow-y-auto no-scrollbar pb-2 md:pb-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center p-2 rounded-xl transition-all w-full md:flex-row md:justify-start md:mb-2 md:px-4 group",
                  isActive ? "bg-emerald-50 text-[#006747] font-black" : "text-gray-500 hover:bg-gray-50"
                )
              }
            >
              <item.icon className={cn(
                "w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:scale-110",
                "md:mr-4"
              )} />
              <span className="text-[9px] md:text-sm font-bold lg:inline hidden whitespace-nowrap">
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex mt-auto w-full pb-8">
          <button
            onClick={() => signOut()}
            className="flex items-center p-2 rounded-xl transition-all w-full md:flex-row md:justify-start md:px-4 text-gray-400 hover:text-red-600 hover:bg-red-50 group"
          >
            <LogOut className="w-6 h-6 md:w-6 md:h-6 transition-transform group-hover:scale-110 md:mr-4" />
            <span className="text-sm font-bold lg:inline hidden">Sair da Conta</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
