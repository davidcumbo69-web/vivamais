import { Heart, Microscope, Pill, Hospital, Stethoscope, Film, UserCircle as UserIcon, Apple, CalendarCheck, ShoppingBag, LogOut, MessageSquare, FileText, ShieldCheck } from 'lucide-react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const isChatOpenOnMobile = location.pathname === '/messages' && searchParams.has('userId');
  
  const navItems = [
    { icon: Stethoscope, label: 'Feed', path: '/' },
    { icon: ShieldCheck, label: 'Validador', path: '/verificar' },
    { icon: Film, label: 'Reels', path: '/reels' },
    { icon: CalendarCheck, label: 'Consultas', path: '/appointments' },
    { icon: MessageSquare, label: 'Mensagens', path: '/messages' },
    { icon: FileText, label: 'Receitas', path: '/prescriptions' },
    ...(profile?.is_professional ? [
      { icon: Hospital, label: 'Criar', path: '/create' }
    ] : [
      { icon: Apple, label: 'Game', path: '/gamification' }
    ]),
    { icon: Pill, label: 'Mercado', path: '/marketplace' },
    { icon: UserIcon, label: 'Perfil', path: '/profile' },
  ];

  const bottomNavItems = [
    { icon: Stethoscope, label: 'Início', path: '/' },
    { icon: ShieldCheck, label: 'Validador', path: '/verificar' },
    { icon: Pill, label: 'Mercado', path: '/marketplace' },
    { icon: CalendarCheck, label: 'Agenda', path: '/appointments' },
    { icon: UserIcon, label: 'Perfil', path: '/profile' },
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:top-0 md:left-0 md:bottom-0 md:w-20 lg:w-64 md:border-r md:border-t-0 shadow-lg md:shadow-none",
      isChatOpenOnMobile ? "hidden md:flex" : "flex"
    )} style={{ transition: 'transform 0.3s ease' }}>
      <div className="flex justify-around items-center h-16 md:flex-col md:h-full md:justify-start md:pt-8 md:px-4 w-full">
          <div className="hidden md:block mb-10 w-full">
            <Link to="/">
              <h1 className="text-2xl font-black text-[#006747] lg:px-4 tracking-tighter hover:opacity-80 transition-opacity">VIVA+</h1>
            </Link>
          </div>
          
          {/* Desktop Nav Items (Hidden on Mobile) */}
          <div className="hidden md:flex flex-col w-full overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center p-2 rounded-xl transition-all w-full mb-2 px-4 group",
                    isActive ? "bg-emerald-50 text-[#006747] font-black" : "text-gray-500 hover:bg-gray-50"
                  )
                }
              >
                <item.icon className="w-6 h-6 transition-transform group-hover:scale-110 mr-4" />
                <span className="text-sm font-bold lg:inline hidden whitespace-nowrap">
                  {item.label}
                </span>
              </NavLink>
            ))}
          </div>

          {/* Mobile Bottom Nav Items (Hidden on Desktop) */}
          <div className="md:hidden flex justify-around items-center w-full h-full px-2">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center py-1 transition-all h-full px-1 relative",
                    isActive ? "text-[#006747]" : "text-gray-400"
                  )
                }
              >
                <item.icon className={cn(
                  "w-6 h-6 mb-1",
                  location.pathname === item.path ? "animate-pulse" : ""
                )} />
                <span className="text-[10px] font-bold tracking-tight">
                  {item.label}
                </span>
                {location.pathname === item.path && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#006747] rounded-full" />
                )}
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
