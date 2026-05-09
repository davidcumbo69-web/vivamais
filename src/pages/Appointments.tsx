import React, { useState, useEffect } from 'react';
import { supabase, type WellnessService, type Booking, type Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  Search,
  MapPin,
  Euro,
  User,
  LayoutDashboard,
  CalendarCheck2,
  ClipboardList,
  Trophy
} from 'lucide-react';
import { AdCarousel } from '../components/ads/AdCarousel';
import { useVitus } from '../hooks/useVitus';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Skeleton } from '../components/ui/Skeleton';

function AppointmentCard({ svc, user, onClick }: { svc: any, user: any, onClick: () => void, key?: any }) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      checkIfSaved();
    }
  }, [user, svc.id]);

  const checkIfSaved = async () => {
    const { data } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', svc.id)
      .eq('item_type', 'appointment')
      .maybeSingle();
    
    if (data) setIsSaved(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const newState = !isSaved;
    setIsSaved(newState);

    if (newState) {
      await supabase.from('saved_items').insert({
        user_id: user.id,
        item_id: svc.id,
        item_type: 'appointment',
        metadata: {
          title: svc.name,
          image_url: svc.provider?.avatar_url,
          provider_name: svc.provider_name,
          category: svc.category,
          price: svc.base_price
        }
      });
    } else {
      await supabase.from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', svc.id)
        .eq('item_type', 'appointment');
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      key={svc.id} 
      className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all group relative"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006747]">
            {svc.provider?.avatar_url ? (
              <img src={svc.provider.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" />
            ) : (
              <Stethoscope className="w-7 h-7" />
            )}
          </div>
          <div>
            <h3 className="font-black text-lg text-gray-900 group-hover:text-[#006747] transition-colors">{svc.name}</h3>
            <p className="text-xs text-gray-400 font-bold flex items-center uppercase tracking-wider">
              <User className="w-3 h-3 mr-1" />
              {svc.provider_name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleSave}
            className={cn(
              "p-2.5 rounded-xl transition-all active:scale-95",
              isSaved ? "bg-[#006747] text-white" : "bg-gray-50 text-gray-400 hover:text-[#006747]"
            )}
          >
            <ClipboardList className={cn("w-4 h-4", isSaved && "fill-current")} />
          </button>
          <div className="bg-emerald-50 text-[#006747] text-[10px] uppercase font-black px-3 py-1 rounded-full">
            {svc.category}
          </div>
        </div>
      </div>

      <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed font-medium">
        {svc.description || "Descrição profissional detalhada não disponível."}
      </p>

      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-gray-900 font-black">
            <Euro className="w-4 h-4 mr-1 text-[#006747]" />
            {svc.base_price}€
          </div>
          <div className="flex items-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
            <MapPin className="w-3 h-3 mr-1" />
            {svc.location || 'Consultório'}
          </div>
        </div>
        <button 
          onClick={onClick}
          className="bg-[#006747] hover:bg-emerald-700 text-white font-black py-2.5 px-6 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95"
        >
          Agendar Já
        </button>
      </div>
    </motion.div>
  );
}

export default function Appointments() {
  const { user } = useAuth();
  const { balance } = useVitus();
  const [services, setServices] = useState<(WellnessService & { provider?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingModal, setBookingModal] = useState<WellnessService | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: svcs, error: svcErr } = await supabase
        .from('wellness_services')
        .select('*, provider:provider_id(*)');
      if (!svcErr) setServices(svcs || []);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = async () => {
    if (!user || !bookingModal || !bookingDate || !bookingTime) return;
    const scheduledDate = new Date(`${bookingDate}T${bookingTime}:00`);
    const { error } = await supabase.from('bookings').insert([{
      user_id: user.id,
      service_id: bookingModal.id,
      scheduled_at: scheduledDate.toISOString(),
      total_price: bookingModal.base_price,
      status: 'pendente'
    }]);

    if (!error) {
      setBookingModal(null);
      setBookingDate('');
      setBookingTime('');
      console.log('Booking successful');
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-5xl mx-auto md:pb-10 font-sans">
      <div className="relative mb-8">
        <AdCarousel 
          location="profiles" 
          category="Geral" 
          className="shadow-xl shadow-emerald-900/10" 
        />
        
        {/* Vitus Glass Card Overlay */}
        <div className="absolute top-4 right-4 z-10 hidden md:block">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-[2rem] shadow-2xl text-white min-w-[180px]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-70">Saldo Disponível</span>
              <Trophy className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <div className="flex items-baseline space-x-1.5 mb-3">
              <span className="text-2xl font-black tabular-nums tracking-tighter">{balance.toLocaleString()}</span>
              <span className="text-[8px] font-bold opacity-60">VITUS</span>
            </div>
            <div className="bg-white/20 h-1 w-full rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full w-[65%]" />
            </div>
          </motion.div>
        </div>
      </div>
      <header className="mb-8">
        <h1 className="text-3xl font-black text-[#006747] mb-2 tracking-tight">Serviços de Saúde</h1>
        <p className="text-gray-500 font-medium">Explore e agende consultas com os melhores profissionais da rede.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-[2rem] p-6 border border-gray-100 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-14 h-14 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="w-16 h-6 rounded-full" />
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="flex justify-between items-center pt-6 border-t border-gray-50">
                <div className="flex space-x-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="w-24 h-10 rounded-2xl" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.length > 0 ? services.map(svc => (
            <AppointmentCard 
              key={svc.id} 
              svc={svc} 
              user={user} 
              onClick={() => setBookingModal(svc)} 
            />
          )) : (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">Nenhum serviço disponível no momento.</p>
            </div>
          )}
        </div>
      )}

      {/* AGENDAR MODAL (Mesmo de antes, focado no utilizador) */}
      <AnimatePresence>
        {bookingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setBookingModal(null)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative shadow-2xl"
             >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-[#006747]">Marcação</h2>
                    <button onClick={() => setBookingModal(null)} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="w-7 h-7" />
                    </button>
                </div>

                <div className="mb-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <h4 className="font-bold text-[#006747]">{bookingModal.name}</h4>
                    <p className="text-[10px] text-[#006747]/70 font-black uppercase tracking-widest">{bookingModal.provider_name}</p>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Data Sugerida</label>
                        <input 
                            required
                            type="date" 
                            className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#006747] transition-all"
                            value={bookingDate}
                            onChange={e => setBookingDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Hora</label>
                        <input 
                            required
                            type="time" 
                            className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#006747] transition-all"
                            value={bookingTime}
                            onChange={e => setBookingTime(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center justify-between py-4 border-t border-gray-50 mt-6">
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">Preço da Consulta</span>
                        <span className="text-2xl font-black text-[#006747]">{bookingModal.base_price}€</span>
                    </div>
                    <button 
                        onClick={handleBookService}
                        className="w-full bg-[#006747] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all"
                    >
                        Solicitar Marcação
                    </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
