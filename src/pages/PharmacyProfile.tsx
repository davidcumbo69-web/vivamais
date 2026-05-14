import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Store, 
  MapPin, 
  Clock, 
  Phone, 
  ShieldCheck, 
  Star, 
  ArrowLeft, 
  Pill, 
  Search, 
  Loader2, 
  MessageSquare,
  Share2,
  Calendar,
  Package,
  Info
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  image_url: string | null;
  description: string | null;
  opening_hours: Record<string, string> | null;
  rating: number;
  municipality: string;
  province: string;
}

export default function PharmacyProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [medSearch, setMedSearch] = useState('');

  useEffect(() => {
    if (id) {
      fetchPharmacy();
      fetchMedicines();
    }
  }, [id]);

  const fetchPharmacy = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPharmacy(data);
    } catch (err) {
      console.error(err);
      navigate('/farmacias');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoadingMeds(true);
      const { data, error } = await supabase
        .from('Pharm_medicines')
        .select('*')
        .eq('pharmacy_id', id)
        .eq('in_stock', true)
        .order('name');
      
      if (error) throw error;
      setMedicines(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMeds(false);
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
    m.category?.toLowerCase().includes(medSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#dae0e6] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#006747] animate-spin" />
        </div>
      </div>
    );
  }

  if (!pharmacy) return null;

  return (
    <div className="min-h-screen bg-[#dae0e6] pb-24">
      <Header />
      
      {/* Hero Header */}
      <div className="relative h-[400px] w-full overflow-hidden">
        {pharmacy.image_url ? (
          <img 
            src={pharmacy.image_url} 
            className="w-full h-full object-cover" 
            alt={pharmacy.name} 
          />
        ) : (
          <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
            <Store className="w-32 h-32 text-[#006747]/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#dae0e6] via-black/20 to-transparent" />
        
        <div className="absolute top-8 left-8">
          <button 
            onClick={() => navigate(-1)}
            className="bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-3 rounded-2xl transition-all border border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="absolute bottom-12 left-8 right-8">
           <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                 <div className="flex items-center space-x-3 mb-4">
                    <span className="bg-[#006747] text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg shadow-emerald-900/40">
                      Platina VIVA+
                    </span>
                    <div className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white text-xs font-black">
                       <Star className="w-3 h-3 mr-1.5 fill-current text-yellow-400" />
                       {pharmacy.rating.toFixed(1)}
                    </div>
                 </div>
                 <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-4 drop-shadow-2xl">
                    {pharmacy.name}
                 </h1>
                 <div className="flex flex-wrap items-center gap-4 text-white/80 font-bold">
                    <div className="flex items-center">
                       <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
                       {pharmacy.address}, {pharmacy.municipality}
                    </div>
                    <div className="flex items-center">
                       <Clock className="w-4 h-4 mr-2 text-emerald-400" />
                       Aberta 24 Horas
                    </div>
                 </div>
              </div>

              <div className="flex items-center space-x-3">
                 <button className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-4 rounded-2xl border border-white/20 transition-all">
                    <Share2 className="w-5 h-5" />
                 </button>
                 <button className="bg-white text-[#006747] hover:bg-emerald-50 px-8 py-4 rounded-2xl font-black uppercase text-sm transition-all shadow-xl shadow-black/10 flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Contactar</span>
                 </button>
              </div>
           </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center">
                  <Info className="w-5 h-5 mr-3 text-[#006747]" />
                  Sobre Nós
               </h3>
               <p className="text-gray-500 font-bold leading-relaxed mb-8">
                  {pharmacy.description || "Farmácia de referência integrante da rede VIVA+, oferecendo atendimento farmacêutico personalizado e stock completo de medicamentos essenciais."}
               </p>
               
               <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="flex items-center text-[#006747] font-black uppercase text-[10px] tracking-widest mb-2">
                        <Clock className="w-4 h-4 mr-2" /> Horário de Plantão
                     </div>
                     <div className="text-gray-900 font-black">24 Horas / 7 Dias</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="flex items-center text-[#006747] font-black uppercase text-[10px] tracking-widest mb-2">
                        <Phone className="w-4 h-4 mr-2" /> Contacto Direto
                     </div>
                     <div className="text-gray-900 font-black">{pharmacy.phone}</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                     <div className="flex items-center text-[#006747] font-black uppercase text-[10px] tracking-widest">
                        <ShieldCheck className="w-4 h-4 mr-2" /> Certificação VIVA+
                     </div>
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
               </div>
            </div>

            {/* Opening Hours Detailed if exists */}
            {pharmacy.opening_hours && (
               <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6">Escala Semanal</h3>
                  <div className="space-y-3">
                     {Object.entries(pharmacy.opening_hours).map(([day, hours]) => (
                        <div key={day} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                           <span className="text-xs font-black uppercase text-gray-400 tracking-widest">{day}</span>
                           <span className="text-sm font-bold text-gray-700">{hours}</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </div>

          {/* Right Column: Stock Search */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Stock Digital</h3>
                    <p className="text-gray-400 text-sm font-bold">Consulte em tempo real a disponibilidade de medicamentos.</p>
                  </div>
                  
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="text"
                      placeholder="Pesquisar medicamento..."
                      value={medSearch}
                      onChange={(e) => setMedSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#006747]/20 font-bold text-gray-700"
                    />
                  </div>
               </div>

               <div className="space-y-4">
                  {loadingMeds ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-10 h-10 text-[#006747] animate-spin mb-4" />
                      <p className="text-gray-500 font-medium tracking-widest text-[10px] uppercase">A sincronizar inventário...</p>
                    </div>
                  ) : filteredMedicines.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredMedicines.map((med) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          key={med.id} 
                          className="flex items-center justify-between p-5 bg-gray-50 rounded-3xl border border-gray-100 group hover:border-[#006747]/30 transition-all"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#006747] shadow-sm group-hover:scale-110 transition-transform">
                              <Pill className="w-6 h-6" />
                            </div>
                            <div>
                               <h4 className="font-black text-gray-900 uppercase text-sm leading-tight">{med.name}</h4>
                               <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                                 {med.category || 'Geral'}
                               </p>
                            </div>
                          </div>
                          <div className="text-right">
                             <div className="text-emerald-700 font-black text-sm mb-1">
                                {med.price?.toLocaleString('pt-PT')} Kz
                             </div>
                             <button className="bg-[#006747] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-emerald-900/20 active:scale-95 transition-all">
                                Pedir
                             </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                      <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
                        {medSearch ? 'Nenhum medicamento encontrado' : 'Inventário digital vazio'}
                      </p>
                    </div>
                  )}
               </div>
            </div>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-[#0b1424] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                     <h4 className="text-xl font-black uppercase tracking-tight mb-4">Entrega à Domicílio</h4>
                     <p className="text-white/60 font-bold text-sm mb-6">Peça os seus medicamentos sem sair de casa. Entrega rápida garantida pela rede VIVA+.</p>
                     <button className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all">
                        Consultar Taxas
                     </button>
                  </div>
                  <Calendar className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
               </div>
               
               <div className="bg-[#006747] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                     <h4 className="text-xl font-black uppercase tracking-tight mb-4">Receita Digital</h4>
                     <p className="text-white/60 font-bold text-sm mb-6">Submeta a sua receita digital para validação e prepare o seu pedido antecipadamente.</p>
                     <button className="bg-white text-[#006747] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all">
                        Enviar Receita
                     </button>
                  </div>
                  <ShieldCheck className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 -rotate-12 group-hover:scale-110 transition-transform" />
               </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
