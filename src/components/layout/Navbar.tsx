import { Heart, Microscope, Pill, Hospital, Stethoscope, Film, CircleUser as UserIcon, Apple, CalendarCheck, ShoppingBag, LogOut, MessageSquare, FileText, ShieldCheck, Menu, X } from 'lucide-react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Navbar() {
  const { profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const isChatOpenOnMobile = location.pathname === '/mensagens' && searchParams.has('userId');
  
  const navItems = [
    { icon: Stethoscope, label: 'Vital', path: '/' },
    { icon: ShieldCheck, label: 'Validar', path: '/verificar' },
    { icon: Film, label: 'Educação', path: '/reels' },
    { icon: CalendarCheck, label: 'Consultas', path: '/consultas' },
    { icon: MessageSquare, label: 'Mensagens', path: '/mensagens' },
    { icon: FileText, label: 'Receitas', path: '/historico-receitas' },
    ...(profile?.is_professional ? [
      { icon: Hospital, label: 'Criar', path: '/professional/dashboard' }
    ] : [
      { icon: Apple, label: 'Saúde', path: '/conquistas' }
    ]),
    { icon: Pill, label: 'Loja VIVA', path: '/loja-viva' },
    { icon: UserIcon, label: 'Perfil', path: '/perfil' },
  ];

  const bottomNavItems = [
    { icon: Stethoscope, label: 'Início', path: '/' },
    { icon: CalendarCheck, label: 'Consultas', path: '/consultas' },
    { icon: Pill, label: 'Loja', path: '/loja-viva' },
    { icon: Film, label: 'Educação', path: '/reels' },
  ];

  const mobileMenuItems = navItems.filter(item => 
    !bottomNavItems.some(bottomItem => bottomItem.path === item.path) &&
    item.path !== '/mensagens' &&
    item.path !== '/perfil'
  );

  return (
    <>
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:top-0 md:left-0 md:bottom-0 md:w-20 lg:w-64 md:border-r md:border-t-0 shadow-lg md:shadow-none",
        isChatOpenOnMobile ? "hidden md:flex" : "flex"
      )} style={{ transition: 'transform 0.3s ease' }}>
        <div className="flex justify-around items-center h-16 md:flex-col md:h-full md:justify-start md:pt-8 md:px-2 lg:px-4 w-full">
            <div className="hidden md:block mb-10 w-full lg:px-4 text-center lg:text-left">
              <Link to="/">
                <h1 className="text-2xl font-black text-[#006747] tracking-tighter hover:opacity-80 transition-opacity">VIVA+</h1>
              </Link>
            </div>
            
            {/* Desktop Nav Items (Hidden on Mobile) */}
            <div className="hidden md:flex flex-col w-full overflow-y-auto no-scrollbar items-center lg:items-start">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center justify-center lg:justify-start p-3 lg:p-2 rounded-xl transition-all w-full mb-2 lg:px-4 group",
                      isActive ? "bg-emerald-50 text-[#006747] font-black shadow-sm" : "text-black hover:bg-gray-100"
                    )
                  }
                >
                  <item.icon className="w-6 h-6 transition-transform group-hover:scale-110 lg:mr-4 shrink-0" />
                  <span className="text-sm font-bold lg:block hidden whitespace-nowrap text-inherit">
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
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center justify-center py-1 transition-all h-full px-1 relative",
                      isActive ? "text-[#006747]" : "text-black"
                    )
                  }
                >
                  <item.icon className={cn(
                    "w-6 h-6",
                    location.pathname === item.path ? "animate-pulse" : ""
                  )} />
                  {location.pathname === item.path && !isMenuOpen && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#006747] rounded-full" />
                  )}
                </NavLink>
              ))}
              
              {/* Hamburger Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "flex flex-col items-center justify-center py-1 transition-all h-full px-1 relative w-[20%]",
                  isMenuOpen ? "text-[#006747]" : "text-black"
                )}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                {isMenuOpen && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#006747] rounded-full" />
                )}
              </button>
            </div>

            <div className="hidden md:flex mt-auto w-full pb-8 lg:px-4 justify-center lg:justify-start">
              <button
                onClick={() => signOut()}
                className="flex items-center justify-center lg:justify-start p-3 lg:p-2 rounded-xl transition-all w-full lg:px-4 text-black hover:text-red-600 hover:bg-red-50 group"
              >
                <LogOut className="w-6 h-6 transition-transform group-hover:scale-110 lg:mr-4 shrink-0" />
                <span className="text-sm font-bold lg:block hidden whitespace-nowrap">Sair da Conta</span>
              </button>
            </div>
          </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-md z-[45] md:hidden"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0, scale: 0.95 }}
              animate={{ 
                y: 0, 
                opacity: 1, 
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 0.8
                }
              }}
              exit={{ 
                y: "100%", 
                opacity: 0, 
                scale: 0.95,
                transition: {
                  duration: 0.3,
                  ease: "easeInOut"
                }
              }}
              className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.15)] z-[46] md:hidden overflow-hidden rounded-t-[2.5rem]"
            >
              <div className="p-6 grid grid-cols-3 gap-3">
                {mobileMenuItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl transition-all space-y-1.5",
                        isActive ? "bg-emerald-50 text-[#006747] shadow-sm" : "bg-gray-100 text-black hover:bg-gray-200"
                      )
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">{item.label}</span>
                  </NavLink>
                ))}
                
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 text-red-600 transition-all space-y-1.5 col-span-3 mt-1"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sair da Conta</span>
                </button>
              </div>
              
              <div className="bg-gray-50/50 p-4 text-center border-t border-gray-100">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">VIVA+ Saúde Digital &copy; 2026</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
