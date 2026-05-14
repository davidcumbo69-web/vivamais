import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Store, Search, MapPin, Loader2, Pill } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPharmacies.map((pharmacy, index) => (
              <motion.div
                key={pharmacy.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-row h-32"
              >
                {/* Left Image Section */}
                <div className="relative w-32 shrink-0 overflow-hidden">
                  {pharmacy.image_url ? (
                    <img 
                      src={pharmacy.image_url} 
                      alt={pharmacy.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                      <Store className="w-8 h-8 text-[#006747]/20" />
                    </div>
                  )}
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
                      {pharmacy.name}
                    </h3>
                    <div className="flex items-center text-[10px] font-bold text-gray-400 mt-1 truncate">
                       <MapPin className="w-3 h-3 mr-1 shrink-0 text-emerald-400" />
                       <span className="truncate">{pharmacy.address}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                     <Link 
                       to={`/farmacia/${pharmacy.id}`}
                       className="flex-1 bg-gray-50 hover:bg-emerald-50 text-emerald-700 py-2 rounded-xl text-[9px] font-black uppercase transition-all text-center border border-emerald-50"
                     >
                       Ver Ficha
                     </Link>
                     <Link 
                       to={`/farmacia/${pharmacy.id}`}
                       className="flex-1 bg-[#006747] hover:bg-emerald-700 text-white py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg shadow-emerald-900/20 text-center"
                     >
                       Pedir Já
                     </Link>
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
