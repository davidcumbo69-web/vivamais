import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Building2, Plus, MapPin, Edit2, Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function MyManagedEstablishments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMyEstablishments();
    }
  }, [user]);

  const fetchMyEstablishments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medical_establishments')
        .select('*')
        .eq('owner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEstablishments(data || []);
    } catch (err) {
      console.error('Error fetching establishments:', err);
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
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Meus Estabelecimentos</h1>
              <p className="text-gray-500">Gira as suas clínicas, hospitais ou postos médicos.</p>
            </div>
          </div>
          
          <Link
            to="/estabelecimentos/registar"
            className="bg-[#006747] text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100"
          >
            <Plus className="w-5 h-5" />
            <span>Registar Novo</span>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#006747] animate-spin mb-4" />
            <p className="text-gray-500 font-medium">A carregar estabelecimentos...</p>
          </div>
        ) : establishments.length > 0 ? (
          <div className="space-y-4">
            {establishments.map((est, index) => (
              <motion.div
                key={est.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-all group"
              >
                <div className="flex items-center space-x-5 mb-4 md:mb-0">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-xl font-bold text-gray-900">{est.name}</h3>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        est.status === 'pending' ? "bg-yellow-50 text-yellow-600" :
                        est.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                        "bg-red-50 text-red-600"
                      )}>
                        {est.type} • {est.status === 'pending' ? 'Em Análise' : 
                         est.status === 'approved' ? 'Ativo' : 'Rejeitado'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 mr-1" />
                      {est.address}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Link
                    to={`/estabelecimentos/editar/${est.id}`}
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
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Ainda não registou estabelecimentos</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Se é proprietário de uma clínica, hospital ou posto médico, registe-os aqui.
            </p>
            <Link
              to="/estabelecimentos/registar"
              className="inline-flex items-center space-x-2 bg-[#006747] text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100"
            >
              <Plus className="w-5 h-5" />
              <span>Registar Primeiro</span>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
