import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { 
  Apple, 
  HeartPulse, 
  Footprints, 
  Heart, 
  Timer, 
  ChevronRight, 
  ShieldCheck, 
  Activity,
  Smartphone,
  Watch,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useVitus } from '../hooks/useVitus';
import { useAuth } from '../hooks/useAuth';

const CHALLENGES = [
  {
    id: 'steps_10k',
    title: 'Caminhada 10k Passos',
    description: 'Complete 10,000 passos hoje para obter recompensa.',
    reward: 50,
    icon: Footprints,
    color: 'bg-orange-500',
    type: 'physical'
  },
  {
    id: 'heart_zone',
    title: 'Cardio de Alta Intensidade',
    description: 'Mantenha-se na zona de 140bpm por 20 minutos.',
    reward: 80,
    icon: Activity,
    color: 'bg-red-500',
    type: 'physical'
  },
  {
    id: 'fruit_daily',
    title: '5 Peças de Fruta',
    description: 'Registe o seu plano alimentar saudável.',
    reward: 30,
    icon: Apple,
    color: 'bg-green-500',
    type: 'nutrition'
  },
  {
    id: 'rest_balance',
    title: 'Sono de Qualidade',
    description: 'Durma pelo menos 7 horas consecutivas.',
    reward: 40,
    icon: Timer,
    color: 'bg-indigo-500',
    type: 'rest'
  }
];

export default function Gamification() {
  const { balance, addVitus } = useVitus();
  const { profile } = useAuth();
  const [synced, setSynced] = useState(false);
  const [completedToday, setCompletedToday] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  const [showDevToast, setShowDevToast] = useState(false);

  const showDevMessage = () => {
    setShowDevToast(true);
    setTimeout(() => setShowDevToast(false), 3000);
  };

  const simulateSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
    }, 2000);
  };

  const handleClaim = async (challenge: typeof CHALLENGES[0]) => {
    if (completedToday.includes(challenge.id)) return;
    
    const res = await addVitus(challenge.reward, `Desafio Concluído: ${challenge.title}`);
    if (res.success) {
      setCompletedToday([...completedToday, challenge.id]);
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-[#dae0e6]">
      <Header />
      
      <main className="max-w-4xl mx-auto pt-8 px-4">
        {/* Hero Section */}
        <div className="bg-[#006747] rounded-3xl p-8 mb-8 text-white relative overflow-hidden">
           <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-2 bg-white/20 w-max px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                 <Activity className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                 <span>Arena de Saúde VIVA+</span>
              </div>
              <h1 className="text-3xl font-bold mb-4">Transforme esforço em Vitus.</h1>
              <p className="text-emerald-100 max-w-md text-sm leading-relaxed mb-6">
                Ligue o seu relógio ou telemóvel para sincronizar os seus progressos reais. 
                Aqui, o seu suor é a moeda para o SNS do futuro.
              </p>
              
              <div className="flex items-center space-x-4">
                 <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                       <Apple className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                       <p className="text-[10px] uppercase font-bold text-emerald-200">Seu Saldo</p>
                       <p className="text-2xl font-black">{balance} <span className="text-sm font-normal opacity-80">Vitus</span></p>
                    </div>
                 </div>
                 
                 <button 
                  onClick={showDevMessage}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl px-6 py-4 flex flex-col items-center justify-center transition-all border border-white/5 active:scale-95"
                 >
                    <Smartphone className="w-5 h-5 text-emerald-200 mb-1" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-200">Ranking</span>
                 </button>
              </div>
           </div>
           
           {/* Abstract Decoration */}
           <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl" />
           <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl" />
        </div>

        {/* Sync Controls */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-8 shadow-sm">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                 <div className={`p-4 rounded-2xl ${synced ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                    <Watch className="w-8 h-8" />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900">Dispositivo Inteligente</h3>
                    <p className="text-sm text-gray-500">{synced ? 'Apple Watch ligado e sincronizado via SNS Cloud' : 'Ligue o seu Apple Watch, Garmin ou Fitbit'}</p>
                 </div>
              </div>
              <button 
                onClick={showDevMessage}
                className={`w-full md:w-auto px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center space-x-2 ${
                  synced 
                    ? 'bg-green-50 text-green-600 border border-green-100' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                {syncing ? (
                   <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      <span>Sincronizando...</span>
                   </div>
                ) : synced ? (
                   <>
                     <ShieldCheck className="w-5 h-5" />
                     <span>Sincronizado</span>
                   </>
                ) : (
                   <>
                     <Smartphone className="w-5 h-5" />
                     <span>Ligar Dispositivo</span>
                   </>
                )}
              </button>
           </div>
        </div>

        {/* Challenges Grid */}
        <div className="mb-12">
           <h2 className="text-xl font-bold mb-6 flex items-center">
             <HeartPulse className="w-6 h-6 mr-2 text-orange-500" />
             Desafios Diários de Superação
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHALLENGES.map((challenge) => {
                const Icon = challenge.icon;
                const isCompleted = completedToday.includes(challenge.id);
                
                return (
                  <motion.div 
                    key={challenge.id}
                    whileHover={{ y: -4 }}
                    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group"
                  >
                    <div className="flex items-start justify-between mb-4">
                       <div className={`w-12 h-12 rounded-2xl ${challenge.color} flex items-center justify-center text-white shadow-lg`}>
                          <Icon className="w-6 h-6" />
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recompensa</p>
                          <p className="text-xl font-black text-[#006747]">+{challenge.reward} <span className="text-xs font-normal">Vitus</span></p>
                       </div>
                    </div>
                    
                    <div className="mb-6">
                       <h3 className="font-bold text-gray-900 group-hover:text-[#006747] transition-colors">{challenge.title}</h3>
                       <p className="text-xs text-gray-500 mt-1 leading-relaxed">{challenge.description}</p>
                    </div>

                    <button 
                      onClick={showDevMessage}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                        isCompleted 
                          ? 'bg-gray-50 text-gray-300' 
                          : synced 
                            ? 'bg-emerald-50 text-[#006747] hover:bg-[#006747] hover:text-white'
                            : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Concluído</span>
                        </>
                      ) : (
                        <span>{synced ? 'Reivindicar Vitus' : 'Ligue o Dispositivo Primeiro'}</span>
                      )}
                    </button>
                  </motion.div>
                );
              })}
           </div>
        </div>

        {/* Global Progress */}
        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-lg font-bold">Resumo Semanal de Health Score</h3>
                 <p className="text-sm text-gray-400">Desempenho acumulado em todos os pilares.</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent flex items-center justify-center">
                 <span className="font-black text-[#006747]">82%</span>
              </div>
           </div>
           
           <div className="space-y-6">
              {[
                { label: 'Esforço Físico', value: 85, color: 'bg-orange-500' },
                { label: 'Nutrição Equilibrada', value: 62, color: 'bg-green-500' },
                { label: 'Prevenção e Médicos', value: 95, color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                   <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
                      <span>{item.label}</span>
                      <span className="text-gray-900">{item.value}%</span>
                   </div>
                   <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.value}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                   </div>
                </div>
              ))}
           </div>
           
           <button 
             onClick={showDevMessage}
             className="w-full mt-8 py-4 border border-emerald-100 rounded-2xl text-[10px] uppercase font-black tracking-[0.2em] text-[#006747] hover:bg-emerald-50 transition-all flex items-center justify-center space-x-2"
           >
              <Users className="w-4 h-4" />
              <span>Ver Ranking Global da Comunidade</span>
           </button>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {showDevToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 transform bg-black text-white px-6 py-4 rounded-2xl shadow-2xl z-50 font-bold text-xs border border-white/10 flex items-center space-x-4 max-w-[90vw] w-max"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
               <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <p className="leading-tight">
              Funcionalidade em desenvolvimento pelos magnos CEO’s,<br />
              <span className="text-emerald-400">em breve entrará no radar...</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
