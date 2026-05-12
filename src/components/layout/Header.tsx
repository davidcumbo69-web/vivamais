import { HeartPulse, Brain, Hospital, MessageSquare, Menu, X, Stethoscope, ShieldCheck, Film, CalendarCheck, FileText, Apple, Pill, CircleUser as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Link, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export function Header() {
  const { profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  return (
    <header className="sticky top-0 bg-white border-b border-gray-100 z-50 md:hidden">
      <div className="flex justify-between items-center h-14 px-4 max-w-lg mx-auto">
        <Link to="/" onClick={() => setIsMenuOpen(false)}>
          <h1 className="text-xl font-black text-[#006747] tracking-tighter italic">VIVA+</h1>
        </Link>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 pr-2 border-r border-gray-100">
            <Link to="/mensagens" className="relative text-gray-700 hover:text-[#006747] transition-colors p-1" onClick={() => setIsMenuOpen(false)}>
              <MessageSquare className="w-5 h-5" />
              <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full border border-white" />
            </Link>
            <button className="text-gray-700 hover:text-[#006747] transition-colors p-1">
              <HeartPulse className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6 animate-in fade-in zoom-in duration-200" /> : <Menu className="w-6 h-6 animate-in fade-in zoom-in duration-200" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ y: -100, opacity: 0, scale: 0.95 }}
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
                y: -20, 
                opacity: 0, 
                scale: 0.95,
                transition: {
                  duration: 0.2
                }
              }}
              className="absolute top-14 left-0 right-0 bg-white border-b border-gray-100 shadow-2xl z-50 overflow-hidden rounded-b-[2rem]"
            >
              <div className="p-6 grid grid-cols-3 gap-4">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl transition-all space-y-2",
                        isActive ? "bg-emerald-50 text-[#006747]" : "bg-gray-50 text-gray-500"
                      )
                    }
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                  </NavLink>
                ))}
                
                <button
                  onClick={() => {
                    signOut();
                    setIsMenuOpen(false);
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 text-red-600 transition-all space-y-2 col-span-3 mt-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Sair da Conta</span>
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">VIVA+ Saúde Digital &copy; 2026</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
