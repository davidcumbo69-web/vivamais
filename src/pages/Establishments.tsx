import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Hospital, Search, MapPin, Phone, ExternalLink, Loader2, Star, ShieldCheck, Clock, Building2 } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Establishment {
  id: string;
  name: string;
  type: string;
  province: string;
  municipality: string;
  address: string;
  image_url?: string;
  description?: string;
  owner_id: string;
  rating: number;
  opening_hours: { [key: string]: string };
  services: string[];
}

export default function Establishments() {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');

  useEffect(() => {
    fetchEstablishments();
  }, []);

  const fetchEstablishments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medical_establishments')
        .select('*')
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;
      setEstablishments(data || []);
    } catch (err) {
      console.error('Error fetching establishments:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEstablishments = establishments.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         e.municipality.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'todos' || e.type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#dae0e6] pb-24">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 pt-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">Estabelecimentos Médicos</h1>
            <p className="text-gray-600">Explore hospitais, clínicas e postos médicos da rede VIVA+.</p>
          </div>
          <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit">
            {['todos', 'Hospital', 'Clínica', 'Posto Médico'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  filterType === type 
                    ? "bg-white text-[#006747] shadow-sm" 
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Procurar por nome, município ou morada..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#006747] animate-spin mb-4" />
            <p className="text-gray-500 font-medium tracking-tight">A carregar rede de saúde...</p>
          </div>
        ) : filteredEstablishments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEstablishments.map((est, index) => (
              <motion.div
                key={est.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-gray-100"
              >
                <div className="h-48 relative overflow-hidden">
                  {est.image_url ? (
                    <img 
                      src={est.image_url} 
                      alt={est.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                      <Hospital className="w-16 h-16 text-[#006747]/20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-[#006747] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {est.type}
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                    <span className="text-xs font-bold text-gray-700">{est.rating?.toFixed(1) || '5.0'}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#006747] transition-colors line-clamp-1">
                      {est.name}
                    </h3>
                  </div>

                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
                    <span className="truncate">{est.municipality}, {est.province}</span>
                  </div>

                  {est.services && est.services.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {est.services.slice(0, 3).map((service, idx) => (
                        <span key={idx} className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-100">
                          {service}
                        </span>
                      ))}
                      {est.services.length > 3 && (
                        <span className="text-[10px] font-bold text-gray-400 px-2 py-0.5">
                          +{est.services.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center text-[10px] font-black text-gray-400 uppercase mb-2">
                      <Clock className="w-3 h-3 mr-1" />
                      Horário & Morada
                    </div>
                    <p className="text-[10px] text-gray-600 font-medium mb-1 line-clamp-1">{est.address}</p>
                    <p className="text-[10px] text-[#006747] font-black uppercase">Aberto hoje</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center text-xs font-bold text-[#006747] bg-emerald-50 px-2 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      Certificado
                    </div>
                    <button className="flex items-center text-sm font-bold text-gray-900 hover:text-[#006747] transition-colors">
                      Detalhes
                      <ExternalLink className="w-4 h-4 ml-1.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-400 mb-2 uppercase tracking-tighter">Sem resultados</h3>
            <p className="text-gray-400 text-sm">Nenhum estabelecimento encontrado com estes critérios.</p>
          </div>
        )}
      </main>
    </div>
  );
}
