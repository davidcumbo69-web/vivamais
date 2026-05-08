import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Bell, 
  Shield, 
  Stethoscope, 
  ChevronRight, 
  LogOut, 
  HelpCircle,
  Smartphone,
  Info,
  CheckCircle,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import { useVitus } from '../hooks/useVitus';
import { motion, AnimatePresence } from 'motion/react';

export default function Settings() {
  const { signOut, profile } = useAuth();
  const [showProRules, setShowProRules] = useState(false);

  const isAdmin = profile?.email === 'davidcumbo69@gmail.com';

  const settingsGroups = [
    ...(isAdmin ? [{
      title: 'Administração',
      items: [
        { icon: ShieldCheck, label: 'Painel de Verificações', path: '/admin', color: 'text-red-500' },
      ]
    }] : []),
    {
      title: 'Conta',
      items: [
        { icon: User, label: 'Editar Perfil', path: '/perfil/editar', color: 'text-[#006747]' },
        { icon: Smartphone, label: 'Dispositivos e Apps', path: '/settings/devices', color: 'text-green-500' },
      ]
    },
    {
      title: 'Privacidade e Segurança',
      items: [
        { icon: Shield, label: 'Palavra-passe e Segurança', path: '/settings/security', color: 'text-gray-600' },
        { icon: Bell, label: 'Notificações', path: '/settings/notifications', color: 'text-orange-500' },
      ]
    },
    {
      title: 'Suporte',
      items: [
        { icon: HelpCircle, label: 'Centro de Ajuda', path: '/help', color: 'text-purple-500' },
      ]
    }
  ];

  return (
    <div className="pb-20 min-h-screen bg-[#dae0e6]">
      <Header />
      
      <div className="max-w-2xl mx-auto pt-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Definições</h1>

        <div className="space-y-8">
          {/* Professional Section (Special Handling) */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">
              Profissional
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div 
                onClick={() => setShowProRules(!showProRules)}
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${showProRules ? 'bg-emerald-50/30' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-white border border-gray-100 shadow-sm text-[#006747]`}>
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-700 text-sm md:text-base">
                    {profile?.is_professional ? 'Painel de Gestão Profissional' : 'Tornar-se Profissional de Saúde'}
                  </span>
                </div>
                {showProRules ? <ChevronDown className="w-5 h-5 text-[#006747]" /> : <ChevronRight className="w-5 h-5 text-gray-300" />}
              </div>

              <AnimatePresence>
                {showProRules && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white border-t border-gray-50"
                  >
                    <div className="p-6 space-y-6">
                      <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                        <div className="flex items-center space-x-2 text-[#006747] mb-2 font-bold text-sm">
                          <Info className="w-4 h-4" />
                          <span>Instruções de Candidatura</span>
                        </div>
                        <p className="text-xs text-emerald-900 leading-relaxed">
                          Para garantir a integridade da rede VIVA+, todos os profissionais devem submeter provas de acreditação da respetiva Ordem Profissional Portuguesa.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Regras de Conduta</h4>
                          <ul className="space-y-2">
                            <li className="flex items-start space-x-2 text-xs text-gray-600">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                              <span>Informação baseada em evidência científica.</span>
                            </li>
                            <li className="flex items-start space-x-2 text-xs text-gray-600">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                              <span>Linguagem acessível mas rigorosa.</span>
                            </li>
                            <li className="flex items-start space-x-2 text-xs text-gray-600">
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                              <span>Respeito pelo Código Deontológico.</span>
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Benefícios Sociais</h4>
                          <ul className="space-y-2">
                            <li className="flex items-start space-x-2 text-xs text-gray-600">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>Selo de Autoridade SNS no Perfil.</span>
                            </li>
                            <li className="flex items-start space-x-2 text-xs text-gray-600">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>Capacidade de criar Grupos de Apoio.</span>
                            </li>
                            <li className="flex items-start space-x-2 text-xs text-gray-600">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>Conversão de XP em prémios exclusivos.</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link 
                          to="/professional/settings"
                          className="w-full bg-[#006747] text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100"
                        >
                          <span>Validar Cédula e Continuar</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Other Groups */}
          {settingsGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">
                {group.title}
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {group.items.map((item, itemIdx) => (
                  <Link
                    key={itemIdx}
                    to={item.path}
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                      itemIdx !== group.items.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-white border border-gray-100 shadow-sm ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-semibold text-gray-700">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </Link>
                ))}
              </div>
            </div>
          ))}

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center space-x-2 p-4 bg-white border border-red-100 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-colors shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair da Conta</span>
          </button>
        </div>

        <div className="mt-8 text-center px-4">
          <p className="text-[10px] text-gray-400 leading-normal">
            A VIVA+ é uma plataforma do ecossistema SNS Digital.<br />
            Processamos os seus dados de acordo com o RGPD Nacional.
          </p>
        </div>
      </div>
    </div>
  );
}
