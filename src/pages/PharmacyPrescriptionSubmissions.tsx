import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  FileText, 
  Search, 
  Loader2, 
  ArrowLeft, 
  MessageSquare, 
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  ShoppingBag,
  Pill,
  Trash2,
  Package,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Order {
  id: string;
  prescription_code: string | null;
  prescription_image_url: string | null;
  description: string | null;
  delivery_address: string;
  items: any[];
  total_price: number;
  status: 'pending' | 'accepted' | 'rejected' | 'processing' | 'completed' | 'cancelled';
  created_at: string;
  user_id: string;
  user?: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface PrescriptionDetails {
  id: string;
  diagnosis: string;
  professional_name: string;
  items: any[];
}

export default function PharmacyPrescriptionSubmissions() {
  const { pharmacyId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  useEffect(() => {
    if (pharmacyId && user) {
      fetchOrders();
    }
  }, [pharmacyId, user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pharmacy_orders')
        .select(`
          *,
          user:user_id(username, full_name, avatar_url)
        `)
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptionDetails = async (code: string) => {
    try {
      setLoadingDetails(true);
      const { data: prescription, error: pError } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('signature_code', code)
        .single();

      if (pError) throw pError;

      const { data: items, error: iError } = await supabase
        .from('prescription_items')
        .select('*')
        .eq('prescription_id', prescription.id);

      if (iError) throw iError;

      setSelectedPrescription({
        ...prescription,
        items: items || []
      });
    } catch (err) {
      console.error('Error fetching prescription details:', err);
      toast.error('Não foi possível encontrar detalhes desta receita no sistema.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('pharmacy_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      
      setOrders(prev => prev.map(s => s.id === orderId ? { ...s, status: status as any } : s));
      toast.success('Estado atualizado');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao atualizar estado');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Tem a certeza que deseja apagar este pedido?')) return;
    
    try {
      const { error } = await supabase
        .from('pharmacy_orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success('Pedido apagado');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao apagar pedido');
    }
  };

  const handleContactUser = (userId: string) => {
    if (!user) return;
    navigate(`/mensagens?userId=${userId}`);
  };

  const filteredOrders = orders.filter(s => 
    (s.prescription_code?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.delivery_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#dae0e6] pb-24">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-gray-600 transition-all">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de Encomendas</h1>
              <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Farmácia VIVA+ • Pedidos & Entregas</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text"
              placeholder="Procurar por código, utente ou morada..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border-none rounded-[1.5rem] outline-none focus:ring-2 focus:ring-[#006747]/20 font-bold text-gray-700"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-[#006747] animate-spin mb-4" />
            <p className="text-gray-500 font-black tracking-widest text-[10px] uppercase">A sincronizar pedidos...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] p-4 md:p-8 shadow-sm border border-gray-100 group overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row gap-8">
                   {/* Left: Client Info & Status */}
                   <div className="lg:w-1/3 flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                         <div className={cn(
                           "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                           order.status === 'pending' ? "bg-orange-50 text-orange-600" :
                           order.status === 'processing' ? "bg-blue-50 text-blue-600" :
                           order.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                           order.status === 'accepted' ? "bg-emerald-500 text-white" :
                           "bg-red-50 text-red-600"
                         )}>
                            {order.status}
                         </div>
                         <button 
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                         >
                            <Trash2 className="w-5 h-5" />
                         </button>
                      </div>

                      <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100 mb-6">
                          <div className="flex items-center space-x-4 mb-4">
                             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden text-gray-300">
                                {order.user?.avatar_url ? (
                                   <img src={order.user.avatar_url} className="w-full h-full object-cover" />
                                ) : ( <User className="w-6 h-6" /> )}
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Utente VIVA+</p>
                                <h4 className="text-lg font-black text-gray-900">{order.user?.full_name || order.user?.username}</h4>
                             </div>
                          </div>
                          <button 
                            onClick={() => handleContactUser(order.user_id)}
                            className="w-full py-4 bg-white text-[#006747] rounded-xl font-black uppercase text-[10px] tracking-widest border border-emerald-50 hover:bg-emerald-50 transition-all flex items-center justify-center space-x-2"
                          >
                             <MessageSquare className="w-4 h-4" />
                             <span>Enviar Mensagem</span>
                          </button>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-start space-x-3 text-gray-500">
                            <MapPin className="w-5 h-5 shrink-0 text-emerald-500 mt-1" />
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest">Morada de Entrega</p>
                               <p className="text-sm font-bold">{order.delivery_address}</p>
                            </div>
                         </div>
                         <div className="flex items-start space-x-3 text-gray-500">
                            <Clock className="w-5 h-5 shrink-0 text-gray-400 mt-1" />
                            <div>
                               <p className="text-[10px] font-black uppercase tracking-widest">Submetido em</p>
                               <p className="text-sm font-bold">{new Date(order.created_at).toLocaleString('pt-PT')}</p>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Right: Order Content & Actions */}
                   <div className="lg:w-2/3 flex flex-col justify-between">
                      <div className="mb-8">
                         <div className="flex flex-wrap gap-4 mb-6">
                            {order.prescription_code && (
                               <button 
                                onClick={() => fetchPrescriptionDetails(order.prescription_code!)}
                                className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest border border-emerald-200"
                               >
                                  <FileText className="w-4 h-4" />
                                  <span>Receita Digital: {order.prescription_code}</span>
                               </button>
                            )}
                            {order.prescription_image_url && (
                               <button 
                                onClick={() => setShowImageModal(order.prescription_image_url)}
                                className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest border border-blue-200"
                               >
                                  <ImageIcon className="w-4 h-4" />
                                  <span>Ver Foto da Receita</span>
                               </button>
                            )}
                         </div>

                         {order.description && (
                            <div className="mb-6 p-4 bg-gray-50 border-l-4 border-emerald-500 rounded-r-2xl">
                               <p className="text-xs font-bold text-gray-600 leading-relaxed italic">"{order.description}"</p>
                            </div>
                         )}

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {order.items.map((item, idx) => (
                               <div key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                  <div className="flex items-center space-x-3">
                                     <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-[#006747]">
                                        <Pill className="w-5 h-5" />
                                     </div>
                                     <div>
                                        <p className="text-[11px] font-black uppercase tracking-tight line-clamp-1">{item.name}</p>
                                        <p className="text-[9px] font-bold text-gray-400 capitalize">{item.category}</p>
                                     </div>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-sm font-black">{item.quantity}x</p>
                                     <p className="text-[9px] font-bold text-[#006747]">{item.price?.toLocaleString()} Kz</p>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-gray-100 mt-auto">
                         <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total da Encomenda</p>
                            <p className="text-3xl font-black text-gray-900">{order.total_price.toLocaleString()} Kz</p>
                         </div>

                         <div className="flex items-center space-x-3 w-full md:w-auto">
                            {order.status === 'pending' && (
                               <>
                                 <button 
                                  onClick={() => handleUpdateStatus(order.id, 'rejected')}
                                  className="flex-1 md:px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all"
                                 >Rejeitar</button>
                                 <button 
                                  onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                  className="flex-1 md:px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-900/20 active:scale-95 transition-all"
                                 >Aceitar Pedido</button>
                               </>
                            )}
                            
                            {order.status === 'accepted' && (
                               <button 
                                onClick={() => handleUpdateStatus(order.id, 'processing')}
                                className="w-full md:px-12 py-4 bg-[#006747] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest"
                               >Começar Processamento</button>
                            )}

                            {order.status === 'processing' && (
                               <button 
                                onClick={() => handleUpdateStatus(order.id, 'completed')}
                                className="w-full md:px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest"
                               >Marcar como Concluído</button>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] p-20 text-center shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-200">
               <Package className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Sem encomendas de momento</h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto">Tudo pronto! Quando novos utentes fizerem pedidos, eles aparecerão instantaneamente aqui.</p>
          </div>
        )}
      </main>

      {/* Prescription Image Modal */}
      <AnimatePresence>
         {showImageModal && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setShowImageModal(null)}
                 className="absolute inset-0 bg-black/95 backdrop-blur-xl"
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="relative max-w-4xl w-full"
               >
                  <img src={showImageModal} className="w-full h-auto max-h-[80vh] object-contain rounded-3xl" />
                  <button 
                    onClick={() => setShowImageModal(null)}
                    className="absolute -top-12 right-0 text-white flex items-center space-x-2 font-black uppercase text-[10px] tracking-widest"
                  >
                     <XCircle className="w-6 h-6" />
                     <span>Fechar Visualização</span>
                  </button>
               </motion.div>
            </div>
         )}
      </AnimatePresence>

      {/* Prescription Details Modal */}
      <AnimatePresence>
        {selectedPrescription && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPrescription(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[#030303] text-white w-full max-w-2xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-8 pb-32 max-h-[80vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                        <FileText className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Receita Digital</h3>
                        <p className="text-gray-500 font-mono tracking-widest text-xs">VALOR LEGAL SNS • INTEGRIDADE VERIFICADA</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedPrescription(null)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                      <XCircle className="w-6 h-6" />
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-12">
                   <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Profissional Emissor</p>
                      <p className="text-lg font-black">{selectedPrescription.professional_name}</p>
                   </div>
                   <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Diagnóstico Reportado</p>
                      <p className="text-lg font-black truncate">{selectedPrescription.diagnosis}</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Medicamentos Prescritos</p>
                  {selectedPrescription.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-6 bg-white/5 rounded-[2.5rem] border border-white/5 group hover:border-emerald-500/30 transition-all">
                      <div className="flex items-center space-x-6">
                        <div className="w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: item.color || '#10b981' }} />
                        <div>
                          <h4 className="text-lg font-black text-white uppercase tracking-tight">{item.medication}</h4>
                          <p className="text-xs font-bold text-gray-500">{item.frequency}/DIA · {item.duration} DIAS · {item.form}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-white">{item.total_units}<span className="text-xs text-gray-600 ml-1 font-bold">x</span></p>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">DISPONIBILIZAR</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#030303] via-[#030303] to-transparent">
                <button 
                  onClick={() => setSelectedPrescription(null)}
                  className="w-full py-5 bg-white text-[#030303] rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all"
                >
                  Confirmar Leitura
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
