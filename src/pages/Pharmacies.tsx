import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Store, Search, MapPin, Phone, ExternalLink, Loader2, Star, ShieldCheck, Clock } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  image_url?: string;
  description?: string;
  owner_id: string;
  rating: number;
  opening_hours: { [key: string]: string };
}

export default function Pharmacies() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;
      setPharmacies(data || []);
    } catch (err) {
      console.error('Error fetching pharmacies:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPharmacies = pharmacies.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#dae0e6] pb-24">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Rede de Farmácias</h1>
          <p className="text-gray-600">Encontre farmácias parceiras e verifique disponibilidade de serviços.</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Procurar por nome ou localização..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#006747] animate-spin mb-4" />
            <p className="text-gray-500 font-medium">A carregar rede de farmácias...</p>
          </div>
        ) : filteredPharmacies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPharmacies.map((pharmacy, index) => (
              <motion.div
                key={pharmacy.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-gray-100"
              >
                <div className="h-48 relative overflow-hidden">
                  {pharmacy.image_url ? (
                    <img 
                      src={pharmacy.image_url} 
                      alt={pharmacy.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                      <Store className="w-16 h-16 text-[#006747]/20" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center space-x-1 shadow-sm">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                    <span className="text-xs font-bold text-gray-700">{pharmacy.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#006747] transition-colors">
                      {pharmacy.name}
                    </h3>
                  </div>

                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
                    <span className="truncate">{pharmacy.address}</span>
                  </div>

                  {pharmacy.opening_hours && (
                    <div className="mb-4 bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center text-[10px] font-black text-gray-400 uppercase mb-2">
                        <Clock className="w-3 h-3 mr-1" />
                        Horário
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-gray-600">
                        {Object.entries(pharmacy.opening_hours).map(([day, hours]) => (
                          <div key={day} className="flex justify-between">
                            <span className="font-bold uppercase">{day}:</span>
                            <span>{hours}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pharmacy.description && (
                    <p className="text-sm text-gray-600 mb-6 line-clamp-2 italic">
                      "{pharmacy.description}"
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div className="flex items-center text-xs font-bold text-[#006747] bg-emerald-50 px-2 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                      SNS Digital
                    </div>
                    <button className="flex items-center text-sm font-bold text-gray-900 hover:text-[#006747] transition-colors">
                      Ver Ficha
                      <ExternalLink className="w-4 h-4 ml-1.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Store className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma farmácia encontrada</h3>
            <p className="text-gray-500">Tente ajustar a sua pesquisa ou explorar outras regiões.</p>
          </div>
        )}
      </main>
    </div>
  );
}
