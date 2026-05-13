import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Store, Plus, MapPin, Clock, Edit2, Loader2, CheckCircle2, AlertCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function MyManagedPharmacies() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyPharmacies();
    }
  }, [user]);

  const fetchMyPharmacies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPharmacies(data || []);
    } catch (err) {
      console.error('Error fetching pharmacies:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#dae0e6] pb-24">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Minhas Farmácias</h1>
              <p className="text-gray-500">Gira os seus registos e estabelecimentos na rede.</p>
            </div>
          </div>
          
          <Link
            to="/farmacias/registar"
            className="bg-[#006747] text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus className="w-5 h-5" />
            <span>Registar Nova</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#006747] animate-spin mb-4" />
            <p className="text-gray-500 font-medium">A carregar as suas farmácias...</p>
          </div>
        ) : pharmacies.length > 0 ? (
          <div className="space-y-4">
            {pharmacies.map((pharmacy, index) => (
              <motion.div
                key={pharmacy.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-5 mb-4 md:mb-0">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006747] shrink-0">
                    <Store className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-gray-900">{pharmacy.name}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        pharmacy.status === 'pending' ? "bg-yellow-50 text-yellow-600" :
                        pharmacy.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {pharmacy.status === 'pending' ? 'Em Análise' : 
                         pharmacy.status === 'approved' ? 'Ativa' : 'Rejeitada'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {pharmacy.address}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Link
                    to={`/farmacias/editar/${pharmacy.id}`}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-2 bg-gray-50 text-gray-700 px-5 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Editar</span>
                  </Link>
                  <div className="hidden md:block">
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Store className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ainda não registou nenhuma farmácia</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Junte-se à nossa rede profissional e facilite o acesso a cuidados de saúde para todos os utentes VIVA+.
            </p>
            <Link
              to="/farmacias/registar"
              className="inline-flex items-center space-x-2 bg-[#006747] text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100"
            >
              <Plus className="w-5 h-5" />
              <span>Registar Primeira Farmácia</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
