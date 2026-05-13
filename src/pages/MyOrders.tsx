import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { 
  ShoppingBag, 
  PackageCheck, 
  Truck, 
  Clock, 
  Loader2, 
  ChevronRight,
  Zap,
  ArrowLeft,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../components/ui/Skeleton';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_orders')
        .select(`
          *,
          product:product_id (*)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification('Erro ao carregar as suas encomendas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('product_orders')
        .update({ status: 'concluído' })
        .eq('id', orderId);

      if (error) throw error;
      
      showNotification('Receção confirmada! O seu pedido foi concluído com sucesso.');
      fetchOrders();
    } catch (error: any) {
      console.error('Error confirming receipt:', error);
      showNotification('Erro ao confirmar a receção. Tente novamente.', 'error');
    }
  };

  const handleDenyReceipt = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('product_orders')
        .update({ status: 'pendente', shipped_at: null })
        .eq('id', orderId);

      if (error) throw error;
      
      showNotification('Confirmação negada. O pedido voltou ao estado Pendente e o profissional foi notificado para reenviar.', 'success');
      fetchOrders();
    } catch (error: any) {
      console.error('Error denying receipt:', error);
      showNotification('Erro ao processar a contestação. Tente novamente.', 'error');
    }
  };

  const getTimeRemaining = (shippedAt: string) => {
    if (!shippedAt) return null;
    const deadline = new Date(shippedAt).getTime() + 23 * 60 * 60 * 1000;
    const now = new Date().getTime();
    const remaining = deadline - now;
    
    if (remaining <= 0) return 'A expirar...';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m restantes`;
  };

  return (
    <div className="min-h-screen bg-[#dae0e6]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
            <div>
                <Link to="/marketplace" className="text-[10px] font-black uppercase text-gray-400 flex items-center hover:text-[#006747] transition-colors mb-2">
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Voltar à Loja
                </Link>
                <h1 className="text-3xl font-black text-[#006747] tracking-tight">As Minhas Encomendas</h1>
            </div>
            <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-3">
                <ShoppingBag className="w-5 h-5 text-[#006747]" />
                <span className="font-black text-gray-900">{orders.length}</span>
            </div>
        </div>

        {loading ? (
            <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm flex items-center space-x-6">
                    <Skeleton className="w-20 h-20 rounded-[1.5rem] flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="flex space-x-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-1/2" />
                      <div className="flex space-x-4">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="w-32 h-10 rounded-2xl hidden md:block" />
                  </div>
                ))}
            </div>
        ) : orders.length > 0 ? (
            <div className="space-y-6">
                {orders.map((order, idx) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={order.id} 
                        className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all group"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center space-x-6">
                                <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                                    <img src={order.product?.image_url} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-[10px] font-black text-[#006747] bg-emerald-50 px-2 py-0.5 rounded-lg">ID: #{order.id.slice(0, 8)}</span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-[#006747] transition-colors">{order.product?.name}</h3>
                                    <div className="flex items-center mt-2 space-x-4">
                                        <div className="flex items-center text-xs font-bold text-gray-500">
                                            Qt: {order.quantity}
                                        </div>
                                        <div className="flex items-center text-xs font-black text-[#006747]">
                                            Total: {order.total_price}€
                                        </div>
                                        {order.vitus_used > 0 && (
                                            <div className="flex items-center text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded-lg">
                                                <Zap className="w-3 h-3 mr-1 fill-amber-500" />
                                                -{order.vitus_used.toFixed(1)} Vitus
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end space-y-4">
                                <div className={cn(
                                    "px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center shadow-sm",
                                    order.status === 'pendente' ? "bg-yellow-50 text-yellow-700 border border-yellow-100" : 
                                    order.status === 'enviado' ? "bg-blue-50 text-blue-700 animate-pulse border border-blue-100" : 
                                    order.status === 'concluído' ? "bg-emerald-50 text-[#006747] border border-emerald-100" : 
                                    "bg-red-50 text-red-700 border border-red-100"
                                )}>
                                    {order.status === 'pendente' && (
                                        <>
                                            <Clock className="w-3 h-3 mr-2" />
                                            A Aguardar Envio
                                        </>
                                    )}
                                    {order.status === 'enviado' && (
                                        <>
                                            <Truck className="w-3 h-3 mr-2" />
                                            A Caminho
                                        </>
                                    )}
                                    {order.status === 'concluído' && (
                                        <>
                                            <PackageCheck className="w-3 h-3 mr-2" />
                                            Entregue
                                        </>
                                    )}
                                    {order.status !== 'pendente' && order.status !== 'enviado' && order.status !== 'concluído' && order.status}
                                </div>

                                {order.status === 'enviado' && (
                                    <div className="w-full md:w-auto space-y-2">
                                        <div className="flex items-center justify-center md:justify-end text-[9px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                                            <Clock className="w-3 h-3 mr-1.5" />
                                            Confirmação automática em: {getTimeRemaining(order.shipped_at)}
                                        </div>
                                        <button 
                                            onClick={() => handleConfirmReceipt(order.id)}
                                            className="w-full bg-[#006747] text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 active:scale-95 transition-all"
                                        >
                                            Confirmar Receção
                                        </button>
                                        <button 
                                            onClick={() => handleDenyReceipt(order.id)}
                                            className="w-full bg-white text-red-500 border border-red-100 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 transition-all flex items-center justify-center"
                                        >
                                            <XCircle className="w-3 h-3 mr-2" />
                                            Não Recebi / Refutar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        ) : (
            <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Sem pedidos ativos</h3>
                <p className="text-gray-400 font-medium mb-8 max-w-xs mx-auto text-sm">Ainda não realizou nenhuma compra no Marketplace VIVA.</p>
                <Link 
                    to="/marketplace" 
                    className="inline-flex items-center space-x-2 bg-[#006747] text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
                >
                    <span>Explorar Produtos</span>
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        )}
      </main>

      {/* Notification Toast */}
      <AnimatePresence>
          {notification && (
              <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                      "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center space-x-3 px-6 py-4 rounded-3xl shadow-2xl backdrop-blur-md border",
                      notification.type === 'success' 
                          ? "bg-emerald-900/90 border-emerald-500/30 text-emerald-50" 
                          : "bg-red-900/90 border-red-500/30 text-red-50"
                  )}
              >
                  <div className={cn(
                      "p-2 rounded-xl",
                      notification.type === 'success' ? "bg-emerald-500/20" : "bg-red-500/20"
                  )}>
                      {notification.type === 'success' ? (
                          <Zap className="w-5 h-5 text-emerald-400" />
                      ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                      )}
                  </div>
                  <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Notificação VIVA+</p>
                      <p className="text-sm font-bold tracking-tight">{notification.message}</p>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
