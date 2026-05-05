import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  FileText, 
  Pill, 
  Clock, 
  CalendarCheck2, 
  ChevronRight, 
  Loader2,
  ShieldCheck,
  Search,
  Activity,
  Copy,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function MyPrescriptions() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (e: React.MouseEvent, text: string, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          professional:professional_id(full_name, specialty, license_number)
        `)
        .eq('patient_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPrescriptions(data);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => 
    p.medication?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.professional?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24 md:pb-10 pt-4 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Minhas Receitas</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Histórico de Prescrições The Cedav</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-[#006747] transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar medicamento ou médico..."
              className="w-full md:w-80 bg-white border border-gray-100 rounded-2xl py-3 pl-11 pr-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
             <Loader2 className="w-10 h-10 animate-spin text-[#006747]/20 mb-4" />
             <p className="text-xs font-black text-gray-400 uppercase tracking-widest">A carregar o seu historial...</p>
          </div>
        ) : filteredPrescriptions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredPrescriptions.map((presc, idx) => (
              <motion.div 
                key={presc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link 
                  to={`/verificar-receita/${presc.id}`}
                  className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between group hover:border-[#006747]/20 hover:shadow-xl hover:shadow-emerald-900/5 transition-all"
                >
                  <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center relative flex-shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-7 h-7 text-[#006747]" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-50">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-black text-[#006747] uppercase tracking-widest opacity-60">
                          {presc.professional?.full_name}
                        </span>
                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {new Date(presc.created_at).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-black text-gray-900 tracking-tighter mb-1.5 group-hover:text-[#006747] transition-colors">
                        {presc.medication || 'Tratamento Múltiplo'}
                        {(presc.items?.length > 1) && (
                          <span className="ml-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            +{presc.items.length - 1} itens
                          </span>
                        )}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3">
                         <div className="flex items-center space-x-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{presc.frequency}</span>
                         </div>
                         {presc.diagnosis && (
                           <div className="flex items-center space-x-1.5 bg-emerald-50/50 px-2.5 py-1 rounded-lg">
                              <Activity className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter truncate max-w-[150px]">{presc.diagnosis}</span>
                           </div>
                         )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex items-center justify-between md:flex-col md:items-end gap-3">
                    <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors flex items-center space-x-3">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Assinatura Digital</p>
                        <span className="text-xs font-mono font-black text-gray-500 group-hover:text-[#006747]">{presc.signature_code}</span>
                      </div>
                      <button 
                        onClick={(e) => copyToClipboard(e, presc.signature_code, presc.id)}
                        className="p-1.5 hover:bg-white rounded-lg transition-all text-gray-400 hover:text-[#006747]"
                      >
                        {copiedId === presc.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="md:hidden lg:flex items-center space-x-2 text-[#006747] font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <span>Ver Receita</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-100 shadow-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Pill className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">Sem receitas emitidas</h3>
            <p className="text-gray-400 font-medium max-w-sm mx-auto text-sm mb-8">O seu histórico de prescrições digitais aparecerá aqui assim que um profissional as emitir.</p>
            <Link 
              to="/messages" 
              className="inline-flex items-center space-x-2 bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-lg"
            >
              <span>Falar com um Profissional</span>
            </Link>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-12 text-center">
           <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Documentação Digital Certificada pela Rede The Cedav</span>
           </div>
        </div>
      </div>
    </div>
  );
}
