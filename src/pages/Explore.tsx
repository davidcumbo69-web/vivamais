import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  Microscope, 
  Hospital, 
  Stethoscope, 
  Pill, 
  Sparkles, 
  Filter, 
  Loader2, 
  MapPin, 
  Star, 
  ArrowRight,
  TrendingUp,
  UserCheck,
  Calendar,
  Clock
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { AdCarousel } from '../components/ads/AdCarousel';

type Category = 'all' | 'establishments' | 'professionals' | 'services' | 'pharmacies';

export default function Explore() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any>(null);
  
  const [results, setResults] = useState<{
    establishments: any[];
    professionals: any[];
    services: any[];
    pharmacies: any[];
  }>({
    establishments: [],
    professionals: [],
    services: [],
    pharmacies: []
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [
        { data: establishments },
        { data: professionals },
        { data: services },
        { data: pharmacies }
      ] = await Promise.all([
        supabase.from('medical_establishments').select('*').eq('status', 'approved').limit(20),
        supabase.from('profiles').select('*').eq('is_professional', true).limit(20),
        supabase.from('wellness_services').select(`
          *,
          provider:provider_id (
            id,
            full_name,
            avatar_url
          )
        `).limit(20),
        supabase.from('pharmacies').select('*').eq('status', 'approved').limit(20)
      ]);

      setResults({
        establishments: establishments || [],
        professionals: professionals || [],
        services: services || [],
        pharmacies: pharmacies || []
      });
    } catch (err) {
      console.error('Error fetching explore data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    const filter = (item: any, fields: string[]) => {
      return fields.some(field => item[field]?.toString().toLowerCase().includes(query));
    };

    return {
      establishments: results.establishments.filter(e => filter(e, ['name', 'address', 'municipality', 'province', 'type'])),
      professionals: results.professionals.filter(p => filter(p, ['full_name', 'username', 'medical_specialty', 'bio'])),
      services: results.services.filter(s => filter(s, ['name', 'category', 'description'])),
      pharmacies: results.pharmacies.filter(ph => filter(ph, ['name', 'address', 'municipality']))
    };
  }, [results, searchQuery]);

  const hasAnyResults = 
    filteredResults.establishments.length > 0 || 
    filteredResults.professionals.length > 0 || 
    filteredResults.services.length > 0 || 
    filteredResults.pharmacies.length > 0;

  return (
    <div className="min-h-screen bg-[#dae0e6] pb-24">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 pt-8">
        {/* Hero Search Section */}
        <div className="rounded-[2.5rem] p-8 md:p-12 mb-8 relative overflow-hidden shadow-2xl shadow-zinc-900/20 bg-zinc-900">
          <AdCarousel 
            location="profiles" 
            backgroundOnly 
            className="absolute inset-0 w-full h-full opacity-100 z-0 pointer-events-none"
          />
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-0" />
          
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none z-0">
            <Microscope className="w-64 h-64 text-white rotate-12" />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tighter leading-none">
              Explore o Ecossistema <span className="text-emerald-400">VIVA+</span>
            </h1>
            <p className="text-emerald-50/70 text-lg mb-8 font-medium">
              Encontre profissionais certificados, clínicas modernas e serviços de saúde de elite.
            </p>
            
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-900 w-6 h-6" />
              <input 
                type="text"
                placeholder="Pesquisar clínicas, médicos, serviços..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/90 backdrop-blur-md border-none rounded-2xl py-5 pl-14 pr-6 shadow-2xl shadow-emerald-950/20 outline-none focus:bg-white transition-all text-gray-900 font-bold placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex overflow-x-auto pb-4 scrollbar-hide space-x-2 mb-8">
          {[
            { id: 'all', label: 'Tudo', icon: Sparkles },
            { id: 'professionals', label: 'Profissionais', icon: Stethoscope },
            { id: 'establishments', label: 'Estabelecimentos', icon: Hospital },
            { id: 'pharmacies', label: 'Farmácias', icon: Pill },
            { id: 'services', label: 'Serviços', icon: TrendingUp }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveCategory(item.id as Category)}
              className={cn(
                "flex items-center space-x-2 px-6 py-3 rounded-2xl font-black text-xs whitespace-nowrap transition-all border shrink-0",
                activeCategory === item.id 
                  ? "bg-[#006747] text-white border-[#006747] shadow-lg shadow-emerald-200" 
                  : "bg-white text-gray-500 border-gray-100 hover:border-emerald-200"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
              <Microscope className="absolute inset-0 m-auto w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-gray-500 mt-6 font-bold tracking-tight">Sincronizando com a rede VIVA+...</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* Professionals Section */}
            {(activeCategory === 'all' || activeCategory === 'professionals') && filteredResults.professionals.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <Stethoscope className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Profissionais Certificados</h2>
                  </div>
                  <Link to="/profissionais" className="text-sm font-bold text-[#006747] hover:underline flex items-center">
                    Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredResults.professionals.slice(0, 4).map((prof) => (
                    <Link to={`/perfil/${prof.id}`} key={prof.id} className="bg-white p-4 rounded-3xl border border-gray-100 hover:shadow-xl transition-all group">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden shrink-0 border-2 border-white group-hover:border-emerald-500 transition-all shadow-sm">
                          {prof.avatar_url ? (
                            <img src={prof.avatar_url} alt={prof.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-600">
                              <UserCheck className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{prof.full_name}</h3>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest truncate">{prof.medical_specialty || 'Profissional'}</p>
                          <div className="flex items-center mt-1 text-xs text-gray-400">
                            <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                            <span className="font-bold">5.0</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Establishments Section */}
            {(activeCategory === 'all' || activeCategory === 'establishments') && filteredResults.establishments.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <Hospital className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Hospitais & Clínicas</h2>
                  </div>
                  <Link to="/estabelecimentos" className="text-sm font-bold text-[#006747] hover:underline flex items-center">
                    Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResults.establishments.slice(0, 4).map((est) => (
                    <div key={est.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-row h-32">
                      {/* Left Image Section */}
                      <div className="relative w-32 shrink-0 overflow-hidden">
                        <img 
                          src={est.type === 'Hospital' 
                            ? "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop"
                            : "https://images.unsplash.com/photo-1512678080530-7760d81faba6?q=80&w=2074&auto=format&fit=crop"
                          } 
                          alt={est.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">{est.type}</span>
                            <span className="text-[8px] font-black uppercase text-[#006747]">VIVA+ OFICIAL</span>
                          </div>
                          <h3 className="text-base font-black text-gray-900 uppercase truncate leading-tight">
                            {est.name}
                          </h3>
                          <div className="flex items-center text-[10px] font-bold text-gray-400 mt-1 truncate">
                             <MapPin className="w-3 h-3 mr-1 shrink-0" />
                             <span className="truncate">{est.municipality}, {est.province}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                           <Link 
                             to="/estabelecimentos"
                             className="flex-1 bg-gray-50 hover:bg-emerald-50 text-emerald-700 py-2 rounded-xl text-[9px] font-black uppercase transition-all text-center border border-emerald-50"
                           >
                             Ver Unidade
                           </Link>
                           <Link 
                             to="/estabelecimentos"
                             className="flex-1 bg-[#006747] hover:bg-emerald-700 text-white py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg shadow-emerald-900/20 text-center"
                           >
                             Reservar
                           </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(activeCategory === 'all' || activeCategory === 'services') && filteredResults.services.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Experiências & Serviços</h2>
                  </div>
                  <Link to="/consultas" className="text-sm font-bold text-[#006747] hover:underline flex items-center">
                    Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResults.services.slice(0, 6).map((svc) => (
                    <div key={svc.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-row h-32">
                      {/* Left Image Section */}
                      <div className="relative w-32 shrink-0 overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1540339832862-47459980783f?q=80&w=2070&auto=format&fit=crop"
                          alt={svc.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] font-black uppercase text-emerald-600 tracking-widest">{svc.category}</span>
                            <span className="text-[10px] font-black text-[#006747]">
                              {svc.base_price ? `${svc.base_price.toLocaleString('pt-PT')} Kz` : 'Sob Consulta'}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-gray-900 uppercase truncate leading-tight">
                            {svc.name}
                          </h3>
                          <div className="flex items-center text-[10px] font-bold text-gray-400 mt-1 truncate">
                             <Sparkles className="w-3 h-3 mr-1 shrink-0 text-emerald-400" />
                             <span className="truncate">Experiência VIVA+ Certificada</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                           <button 
                             onClick={() => setSelectedService(svc)}
                             className="flex-1 bg-gray-50 hover:bg-emerald-50 text-emerald-700 py-2 rounded-xl text-[9px] font-black uppercase transition-all text-center border border-emerald-50"
                           >
                             Detalhes
                           </button>
                           <Link 
                             to="/consultas"
                             className="flex-1 bg-[#006747] hover:bg-emerald-700 text-white py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg shadow-emerald-900/20 text-center"
                           >
                             Reservar
                           </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pharmacies Section */}
            {(activeCategory === 'all' || activeCategory === 'pharmacies') && filteredResults.pharmacies.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-50 rounded-xl">
                      <Pill className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Farmácias de Plantão</h2>
                  </div>
                  <Link to="/farmacias" className="text-sm font-bold text-[#006747] hover:underline flex items-center">
                    Ver todas <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResults.pharmacies.slice(0, 6).map((pharm) => (
                    <div key={pharm.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-row h-32">
                      {/* Left Image Section */}
                      <div className="relative w-32 shrink-0 overflow-hidden">
                        <img 
                          src="https://images.unsplash.com/photo-1576602976047-174ef57a4645?q=80&w=2070&auto=format&fit=crop"
                          alt={pharm.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                        <div className="absolute top-2 left-2">
                          <Pill className="w-3 h-3 text-white opacity-50" />
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest">ABERTA 24H</span>
                            <span className="text-[10px] font-black text-[#006747]">PLANTÃO</span>
                          </div>
                          <h3 className="text-base font-black text-gray-900 uppercase truncate leading-tight">
                            {pharm.name}
                          </h3>
                          <div className="flex items-center text-[10px] font-bold text-gray-400 mt-1 truncate">
                             <MapPin className="w-3 h-3 mr-1 shrink-0 text-emerald-400" />
                             <span className="truncate">{pharm.address} • {pharm.municipality}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                           <Link 
                             to={`/farmacia/${pharm.id}`}
                             className="flex-1 bg-gray-50 hover:bg-emerald-50 text-emerald-700 py-2 rounded-xl text-[9px] font-black uppercase transition-all text-center border border-emerald-50"
                           >
                             Ver Stock
                           </Link>
                           <Link 
                             to={`/farmacia/${pharm.id}`}
                             className="flex-1 bg-[#006747] hover:bg-emerald-700 text-white py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg shadow-emerald-900/20 text-center"
                           >
                             Pedir Já
                           </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!hasAnyResults && searchQuery && (
              <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
                <Microscope className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-400 uppercase tracking-tighter">Sem resultados encontrados</h3>
                <p className="text-gray-400 font-medium">Tente pesquisar por outros termos ou categorias.</p>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedService(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <div className="relative h-64">
                <img 
                  src="https://images.unsplash.com/photo-1540339832862-47459980783f?q=80&w=2070&auto=format&fit=crop"
                  alt={selectedService.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedService(null)}
                  className="absolute top-6 right-6 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="bg-[#006747] text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
                      {selectedService.category}
                    </span>
                    {selectedService.provider && (
                      <Link 
                        to={`/perfil/${selectedService.provider.id}`}
                        className="bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase px-3 py-1 rounded-full border border-white/20 hover:bg-white/20 transition-all flex items-center"
                      >
                        <UserCheck className="w-3 h-3 mr-1.5" />
                        {selectedService.provider.full_name || 'Profissional'}
                      </Link>
                    )}
                  </div>
                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
                    {selectedService.name}
                  </h2>
                </div>
              </div>
              
              <div className="p-8">
                <p className="text-gray-500 text-lg font-bold mb-8 leading-relaxed">
                  {selectedService.description || "Uma experiência exclusiva desenhada para oferecer o máximo de bem-estar e performance à sua saúde. Inovação e cuidado premium em cada detalhe."}
                </p>

                <div className="grid grid-cols-2 gap-6 mb-8">
                   <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="flex items-center text-[#006747] font-black uppercase text-[10px] tracking-widest mb-1">
                        <Calendar className="w-3.5 h-3.5 mr-2" /> Próxima Data
                      </div>
                      <div className="text-gray-900 font-black">Disponível Hoje</div>
                   </div>
                   <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                      <div className="flex items-center text-[#006747] font-black uppercase text-[10px] tracking-widest mb-1">
                        <MapPin className="w-3.5 h-3.5 mr-2" /> Localização
                      </div>
                      <div className="text-gray-900 font-black truncate">Unidade VIVA+, Luanda</div>
                   </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-[#006747] rounded-[2rem]">
                  <div>
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Investimento</p>
                    <p className="text-3xl font-black text-white">
                      {selectedService.base_price ? `${selectedService.base_price.toLocaleString('pt-PT')} Kz` : 'Sob Consulta'}
                    </p>
                  </div>
                  <Link 
                    to="/consultas"
                    className="bg-white text-[#006747] hover:bg-emerald-50 px-10 py-5 rounded-2xl text-xs font-black uppercase transition-all shadow-xl shadow-black/20 active:scale-95"
                  >
                    Reservar Agora
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
