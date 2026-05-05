import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useVitus } from '../hooks/useVitus';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Euro,
  XCircle,
  Zap,
  ClipboardList,
  ExternalLink,
  Trophy
} from 'lucide-react';
import { AdCarousel } from '../components/ads/AdCarousel';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Header } from '../components/layout/Header';

function ProductCard({ product, user, setSelectedProduct }: { product: any, user: any, setSelectedProduct: any, key?: any }) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) {
      checkIfSaved();
    }
  }, [user, product.id]);

  const checkIfSaved = async () => {
    const { data } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', product.id)
      .eq('item_type', 'product')
      .maybeSingle();
    
    if (data) setIsSaved(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const newState = !isSaved;
    setIsSaved(newState);

    if (newState) {
      await supabase.from('saved_items').insert({
        user_id: user.id,
        item_id: product.id,
        item_type: 'product',
        metadata: {
          title: product.name,
          image_url: product.image_url,
          price: product.price,
          category: product.category
        }
      });
    } else {
      await supabase.from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', product.id)
        .eq('item_type', 'product');
    }
  };

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={product.id} 
        className="group"
    >
        <div className="aspect-[4/5] bg-[#F8FAFC] rounded-[2.5rem] mb-6 relative overflow-hidden transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-[#006747]/10 group-hover:translate-y-[-8px] border border-gray-100/50">
            <div className="h-full flex flex-col items-center justify-center">
                {product.image_url ? (
                    <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} />
                ) : (
                    <ShoppingBag className="w-20 h-20 text-[#006747]/20 group-hover:scale-110 transition-transform duration-500" />
                )}
            </div>
            
            {/* Save Button */}
            <button 
              onClick={handleSave}
              className={cn(
                "absolute top-6 right-6 p-3 rounded-2xl transition-all active:scale-95 shadow-sm",
                isSaved ? "bg-[#006747] text-white" : "bg-white/80 backdrop-blur-md text-gray-400 hover:text-[#006747]"
              )}
            >
              <ClipboardList className={cn("w-4 h-4", isSaved && "fill-current")} />
            </button>

            <div className="absolute bottom-6 left-6 right-6">
                <button 
                    onClick={() => setSelectedProduct(product)}
                    className="w-full bg-[#006747] text-white py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300"
                >
                    Comprar
                </button>
            </div>
        </div>
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase text-[#006747]/50 tracking-widest">{product.category}</span>
                <div className="flex items-center text-gray-900 font-black">
                    <Euro className="w-3 h-3 mr-0.5" />
                    {product.price}
                </div>
            </div>
            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-[#006747] transition-colors">{product.name}</h3>
            <p className="text-[10px] text-gray-400 font-black mt-1 uppercase tracking-wider">{product.seller?.username || 'Profissional VIVA'}</p>
        </div>
    </motion.div>
  );
}

export default function Marketplace() {
  const { user, profile } = useAuth();
  const { balance } = useVitus();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');

  const categories = ['Todos', 'Suplementos', 'Equipamento', 'Livros', 'Alimentação'];

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [useVitusSelection, setUseVitusSelection] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [activeCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase.from('products').select('*, seller:seller_id(*)');
    
    if (activeCategory !== 'Todos') {
      query = query.eq('category', activeCategory);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

    const handleConfirmOrder = async () => {
        if (!user || !selectedProduct) {
            alert('Faça login para comprar.');
            return;
        }

        setIsOrdering(true);
        const totalPrice = selectedProduct.price * orderQuantity;
        
        // Calculate Vitus usage if selected (1 Vitus = 3 EUR)
        const userVitus = profile?.vitus_balance || 0;
        const maxVitusNeeded = totalPrice / 3;
        const vitusToUse = useVitusSelection ? Math.min(userVitus, maxVitusNeeded) : 0;
        const cashToPay = Math.max(0, totalPrice - (vitusToUse * 3));

        const { error: orderError } = await supabase.from('product_orders').insert([{
            buyer_id: user.id,
            product_id: selectedProduct.id,
            quantity: orderQuantity,
            total_price: totalPrice,
            vitus_used: vitusToUse,
            cash_paid: cashToPay,
            status: 'pendente'
        }]);

        if (!orderError) {
            // Subtract Vitus from user balance immediately
            if (vitusToUse > 0) {
                await supabase.from('profiles').update({
                    vitus_balance: userVitus - vitusToUse
                }).eq('id', user.id);

                await supabase.from('vitus_transactions').insert([{
                    user_id: user.id,
                    amount: -vitusToUse,
                    reason: `Pagamento parcial do produto ${selectedProduct.name}`,
                    reference_id: selectedProduct.id
                }]);
            }
            
            alert(`Pedido realizado! Total: ${totalPrice}€ (Pago com ${vitusToUse.toFixed(1)} Vitus + ${cashToPay.toFixed(2)}€ em dinheiro)`);
            setSelectedProduct(null);
            setOrderQuantity(1);
        } else {
            alert('Erro ao realizar pedido: ' + orderError.message);
        }
        setIsOrdering(false);
    };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-24">
        {/* Hero Publicity Section */}
        <div className="relative mb-12">
          <AdCarousel 
            location="profiles" 
            category="Geral" 
            className="!rounded-[3rem] shadow-2xl shadow-emerald-900/20" 
          />
          
          {/* Vitus Glass Card Overlay */}
          <div className="absolute top-8 right-8 z-10 hidden md:block">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-[2.5rem] shadow-2xl text-white min-w-[200px]"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">Saldo Disponível</span>
                <Trophy className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="flex items-baseline space-x-2 mb-4">
                <span className="text-4xl font-black tabular-nums tracking-tighter">{balance.toLocaleString()}</span>
                <span className="text-xs font-bold opacity-60">VITUS</span>
              </div>
              <div className="bg-white/20 h-1 w-full rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[70%]" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center space-x-3 mb-10 overflow-x-auto scrollbar-hide py-2">
            {categories.map(cat => (
                <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                        "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                        activeCategory === cat 
                            ? "bg-[#006747] text-white shadow-lg shadow-emerald-900/10" 
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    )}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Product Grid */}
        {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1,2,3,4].map(i => (
                    <div key={i} className="aspect-[4/5] bg-gray-50 rounded-[2.5rem] animate-pulse" />
                ))}
             </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
                {products.length > 0 ? products.map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      user={user} 
                      setSelectedProduct={setSelectedProduct} 
                    />
                )) : (
                    <div className="col-span-full py-24 text-center bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                        <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Sem produtos disponíveis</p>
                    </div>
                )}
            </div>
        )}
      </main>

      {/* Buy Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                onClick={() => setSelectedProduct(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 relative shadow-2xl overflow-hidden"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-[#006747]">Confirmar Pedido</h2>
                    <button onClick={() => setSelectedProduct(null)} className="text-gray-400">
                        <XCircle className="w-7 h-7" />
                    </button>
                </div>

                <div className="flex items-center space-x-4 mb-8 bg-gray-50 p-4 rounded-2xl">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden flex-shrink-0">
                        <img src={selectedProduct.image_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">{selectedProduct.name}</h4>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedProduct.price}€ / unidade</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest">Quantidade</label>
                        <div className="flex items-center justify-between bg-gray-100 rounded-2xl p-2">
                            <button 
                                onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                                className="w-10 h-10 bg-white rounded-xl font-black text-gray-900"
                            >-</button>
                            <span className="font-black text-lg">{orderQuantity}</span>
                            <button 
                                onClick={() => setOrderQuantity(orderQuantity + 1)}
                                className="w-10 h-10 bg-white rounded-xl font-black text-gray-900"
                            >+</button>
                        </div>
                    </div>

                    {profile?.vitus_balance > 0 && (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center text-white">
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-amber-800 tracking-widest">Usar Vitus</p>
                                        <p className="text-xs font-bold text-amber-600">Saldo: {profile.vitus_balance.toFixed(1)} VTS</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setUseVitusSelection(!useVitusSelection)}
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-colors relative",
                                        useVitusSelection ? "bg-amber-500" : "bg-gray-200"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform",
                                        useVitusSelection ? "left-7" : "left-1"
                                    )} />
                                </button>
                            </div>
                            {useVitusSelection && (
                                <div className="mt-3 text-[10px] font-black text-amber-700 uppercase flex justify-between">
                                    <span>Desconto aplicado:</span>
                                    <span>-{(Math.min(profile.vitus_balance, (selectedProduct.price * orderQuantity) / 3) * 3).toFixed(2)}€</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total a Pagar</span>
                            <div className="text-right">
                                <span className="text-2xl font-black text-[#006747]">
                                    {(Math.max(0, (selectedProduct.price * orderQuantity) - (useVitusSelection ? Math.min(profile?.vitus_balance || 0, (selectedProduct.price * orderQuantity) / 3) * 3 : 0))).toFixed(2)}€
                                </span>
                                {useVitusSelection && profile?.vitus_balance > 0 && (
                                    <p className="text-[10px] font-black text-gray-400 line-through">{(selectedProduct.price * orderQuantity).toFixed(2)}€</p>
                                )}
                            </div>
                        </div>
                        <button 
                            disabled={isOrdering}
                            onClick={handleConfirmOrder}
                            className="w-full bg-[#006747] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/10 hover:shadow-emerald-900/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isOrdering ? 'Processando...' : 'Finalizar Pedido'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
      )}
    </div>
  );
}
