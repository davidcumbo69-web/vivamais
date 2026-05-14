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
  UserCheck
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
        supabase.from('wellness_services').select('*').limit(20),
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
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent z-0" />
          
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
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResults.establishments.slice(0, 3).map((est) => (
                    <div key={est.id} className="bg-white rounded-3xl p-6 border border-gray-100 hover:shadow-xl transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-emerald-600">
                          <Hospital className="w-8 h-8" />
                        </div>
                        <span className="bg-gray-100 text-gray-500 text-[9px] font-black uppercase px-2 py-1 rounded">
                          {est.type}
                        </span>
                      </div>
                      <h3 className="font-black text-lg mb-1 leading-tight">{est.name}</h3>
                      <div className="flex items-center text-gray-400 text-xs mb-4">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {est.municipality}, {est.province}
                      </div>
                      <Link to="/estabelecimentos" className="w-full bg-emerald-50 text-[#006747] py-3 rounded-xl font-bold text-xs flex items-center justify-center hover:bg-[#006747] hover:text-white transition-all">
                        Detalhes da Unidade
                      </Link>
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
                    <div className="p-2 bg-purple-50 rounded-xl">
                      <Pill className="w-5 h-5 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tight">Farmácias de Plantão</h2>
                  </div>
                  <Link to="/farmacias" className="text-sm font-bold text-[#006747] hover:underline flex items-center">
                    Ver todas <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResults.pharmacies.slice(0, 3).map((pharm) => (
                    <div key={pharm.id} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                        <Pill className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold truncate">{pharm.name}</h4>
                        <p className="text-[10px] text-gray-400 truncate">{pharm.address}</p>
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
    </div>
  );
}
