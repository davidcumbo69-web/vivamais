import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  Store, 
  MapPin, 
  Clock, 
  Phone, 
  ShieldCheck, 
  Star, 
  ArrowLeft, 
  Pill, 
  Search, 
  Loader2, 
  MessageSquare,
  Share2,
  Calendar,
  Package,
  Info,
  X,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Header } from '../components/layout/Header';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Pharmacy {
  id: string;
  name: string;
  owner_id: string;
  address: string;
  phone: string;
  image_url: string | null;
  description: string | null;
  opening_hours: Record<string, string> | null;
  rating: number;
  municipality: string;
  province: string;
}

export default function PharmacyProfile() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [medSearch, setMedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [prescriptionType, setPrescriptionType] = useState<'code' | 'photo' | 'none'>('none');
  const [orderDetails, setOrderDetails] = useState({
    code: '',
    description: '',
    address: '',
    imageUrl: ''
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPharmacy();
      fetchMedicines();
    }
  }, [id]);

  const addToCart = (med: any) => {
    const existing = cart.find(item => item.id === med.id);
    if (existing) {
      setCart(cart.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...med, quantity: 1 }]);
    }
    toast.success(`${med.name} adicionado ao carrinho`);
  };

  const removeFromCart = (medId: string) => {
    setCart(cart.filter(item => item.id !== medId));
  };

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `prescriptions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('medical-records')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('medical-records')
        .getPublicUrl(filePath);

      setOrderDetails(prev => ({ ...prev, imageUrl: publicUrl }));
      toast.success('Foto da receita carregada!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (cart.length === 0 && prescriptionType === 'none') {
      toast.error('Selecione medicamentos ou envie uma receita');
      return;
    }
    
    setSubmittingOrder(true);
    try {
      const { error } = await supabase
        .from('pharmacy_orders')
        .insert([{
          pharmacy_id: id,
          user_id: user.id,
          prescription_code: orderDetails.code,
          prescription_image_url: orderDetails.imageUrl,
          description: orderDetails.description,
          delivery_address: orderDetails.address,
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category
          })),
          total_price: totalPrice,
          status: 'pending'
        }]);

      if (error) throw error;
      
      toast.success('Pedido enviado com sucesso!');
      setShowOrderModal(false);
      setCart([]);
      setOrderDetails({ code: '', description: '', address: '', imageUrl: '' });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao processar pedido');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const categories = ['Todos', ...Array.from(new Set(medicines.map(m => m.category || 'Geral')))];

  const handleContact = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!pharmacy?.owner_id) return;
    navigate(`/mensagens?userId=${pharmacy.owner_id}`);
  };

  const fetchPharmacy = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setPharmacy(data);
    } catch (err) {
      console.error(err);
      navigate('/farmacias');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      setLoadingMeds(true);
      const { data, error } = await supabase
        .from('Pharm_medicines')
        .select('*')
        .eq('pharmacy_id', id)
        .eq('in_stock', true)
        .order('name');
      
      if (error) throw error;
      setMedicines(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMeds(false);
    }
  };

  const filteredMedicines = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
                          m.category?.toLowerCase().includes(medSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || (m.category || 'Geral') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#dae0e6] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#006747] animate-spin" />
        </div>
      </div>
    );
  }

  if (!pharmacy) return null;

  return (
    <div className="min-h-screen bg-[#dae0e6] pb-24">
      <Header />
      
      {/* Hero Header */}
      <div className="relative h-[400px] w-full overflow-hidden">
        {pharmacy.image_url ? (
          <img 
            src={pharmacy.image_url} 
            className="w-full h-full object-cover" 
            alt={pharmacy.name} 
          />
        ) : (
          <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
            <Store className="w-32 h-32 text-[#006747]/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#dae0e6] via-black/20 to-transparent" />
        
        <div className="absolute top-8 left-8">
          <button 
            onClick={() => navigate(-1)}
            className="bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-3 rounded-2xl transition-all border border-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <div className="absolute bottom-12 left-8 right-8">
           <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1">
                 <div className="flex items-center space-x-3 mb-4">
                    <span className="bg-[#006747] text-white text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg shadow-emerald-900/40">
                      Platina VIVA+
                    </span>
                    <div className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-white text-xs font-black">
                       <Star className="w-3 h-3 mr-1.5 fill-current text-yellow-400" />
                       {pharmacy.rating.toFixed(1)}
                    </div>
                 </div>
                 <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-4 drop-shadow-2xl">
                    {pharmacy.name}
                 </h1>
                 <div className="flex flex-wrap items-center gap-4 text-white/80 font-bold">
                    <div className="flex items-center">
                       <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
                       {pharmacy.address}, {pharmacy.municipality}
                    </div>
                    <div className="flex items-center">
                       <Clock className="w-4 h-4 mr-2 text-emerald-400" />
                       Aberta 24 Horas
                    </div>
                 </div>
              </div>

              {user?.id !== pharmacy.owner_id && (
                <div className="flex items-center space-x-3">
                   <button className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white p-4 rounded-2xl border border-white/20 transition-all">
                      <Share2 className="w-5 h-5" />
                   </button>
                   <button 
                    onClick={handleContact}
                    className="bg-white text-[#006747] hover:bg-emerald-50 px-8 py-4 rounded-2xl font-black uppercase text-sm transition-all shadow-xl shadow-black/10 flex items-center space-x-2"
                   >
                      <MessageSquare className="w-5 h-5" />
                      <span>Contactar</span>
                   </button>
                </div>
              )}
           </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
               <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-6 flex items-center">
                  <Info className="w-5 h-5 mr-3 text-[#006747]" />
                  Sobre Nós
               </h3>
               <p className="text-gray-500 font-bold leading-relaxed mb-8">
                  {pharmacy.description || "Farmácia de referência integrante da rede VIVA+, oferecendo atendimento farmacêutico personalizado e stock completo de medicamentos essenciais."}
               </p>
               
               <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="flex items-center text-[#006747] font-black uppercase text-[10px] tracking-widest mb-2">
                        <Clock className="w-4 h-4 mr-2" /> Horário de Plantão
                     </div>
                     <div className="text-gray-900 font-black">24 Horas / 7 Dias</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <div className="flex items-center text-[#006747] font-black uppercase text-[10px] tracking-widest mb-2">
                        <Phone className="w-4 h-4 mr-2" /> Contacto Direto
                     </div>
                     <div className="text-gray-900 font-black">{pharmacy.phone}</div>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                     <div className="flex items-center text-[#006747] font-black uppercase text-[10px] tracking-widest">
                        <ShieldCheck className="w-4 h-4 mr-2" /> Certificação VIVA+
                     </div>
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  </div>
               </div>
            </div>

            {/* Opening Hours Detailed if exists */}
            {pharmacy.opening_hours && (
               <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-6">Escala Semanal</h3>
                  <div className="space-y-3">
                     {Object.entries(pharmacy.opening_hours).map(([day, hours]) => (
                        <div key={day} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                           <span className="text-xs font-black uppercase text-gray-400 tracking-widest">{day}</span>
                           <span className="text-sm font-bold text-gray-700">{hours}</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </div>

          {/* Right Column: Stock Search */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Stock Digital</h3>
                    <p className="text-gray-400 text-sm font-bold">Consulte em tempo real a disponibilidade de medicamentos.</p>
                  </div>
                  
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="text"
                      placeholder="Pesquisar medicamento..."
                      value={medSearch}
                      onChange={(e) => setMedSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#006747]/20 font-bold text-gray-700"
                    />
                  </div>
               </div>

               {/* Categories Filter */}
               <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "whitespace-nowrap px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        selectedCategory === cat 
                          ? "bg-[#006747] text-white border-[#006747] shadow-lg shadow-emerald-900/20" 
                          : "bg-gray-50 text-gray-400 border-gray-100 hover:border-emerald-200"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
               </div>

               <div className="space-y-3">
                  {loadingMeds ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-10 h-10 text-[#006747] animate-spin mb-4" />
                      <p className="text-gray-500 font-medium tracking-widest text-[10px] uppercase">A sincronizar inventário...</p>
                    </div>
                  ) : filteredMedicines.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5">
                      {filteredMedicines.map((med) => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          key={med.id} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-xl border border-gray-100 group hover:border-[#006747]/30 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[#006747] shadow-sm group-hover:scale-110 transition-transform shrink-0">
                              <Pill className="w-4 h-4" />
                            </div>
                            <div>
                               <h4 className="font-black text-gray-900 uppercase text-[11px] leading-tight line-clamp-1">{med.name}</h4>
                               <p className="text-[7px] font-black text-emerald-600 uppercase tracking-wider">
                                 {med.category || 'Geral'}
                               </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                             <div className="text-emerald-700 font-black text-[10px]">
                                {med.price?.toLocaleString('pt-PT')} Kz
                             </div>
                             {user?.id !== pharmacy.owner_id && (
                               <button 
                                onClick={() => addToCart(med)}
                                className="bg-[#006747] text-white px-4 py-1.5 rounded-lg text-[8px] font-black uppercase shadow-lg shadow-emerald-900/10 active:scale-95 transition-all"
                               >
                                  Pedir
                               </button>
                             )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                      <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-black uppercase tracking-widest text-sm">
                        {medSearch ? 'Nenhum medicamento encontrado' : 'Inventário digital vazio'}
                      </p>
                    </div>
                  )}
               </div>
            </div>

            {/* Cart Sticky Info */}
            <AnimatePresence>
               {cart.length > 0 && user?.id !== pharmacy.owner_id && (
                  <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] w-[90%] max-w-lg bg-[#006747] text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between border border-white/20"
                  >
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-0.5">{cart.length} Medicamentos Selecionados</p>
                        <p className="text-2xl font-black">{totalPrice.toLocaleString('pt-PT')} Kz</p>
                     </div>
                     <button 
                       onClick={() => setShowOrderModal(true)}
                       className="bg-white text-[#006747] px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-50 active:scale-95 transition-all"
                     >
                        Finalizar Pedido
                     </button>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* Additional Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
               <div className="bg-[#0b1424] rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                     <h4 className="text-xl font-black uppercase tracking-tight mb-4">Entrega à Domicílio</h4>
                     <p className="text-white/60 font-bold text-sm mb-6">Peça os seus medicamentos sem sair de casa. Entrega rápida garantida pela rede VIVA+.</p>
                     <button className="bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all">
                        Consultar Taxas
                     </button>
                  </div>
                  <Calendar className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
               </div>
               
               <div className={cn(
                 "rounded-[2.5rem] p-8 text-white relative overflow-hidden group",
                 user?.id === pharmacy.owner_id ? "bg-[#006747]/60" : "bg-[#006747]"
               )}>
                  <div className="relative z-10">
                     <h4 className="text-xl font-black uppercase tracking-tight mb-4">Realizar Pedido</h4>
                     <p className="text-white/60 font-bold text-sm mb-6">Submeta a sua receita (digital ou foto) e selecione medicamentos para entrega imediata.</p>
                     {user?.id !== pharmacy.owner_id && (
                       <button 
                        onClick={() => {
                          setShowOrderModal(true);
                          setPrescriptionType('code');
                        }}
                        className="bg-white text-[#006747] px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all"
                       >
                          Fazer Pedido
                       </button>
                     )}
                  </div>
                  <ShieldCheck className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 -rotate-12 group-hover:scale-110 transition-transform" />
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Order Modal */}
      <AnimatePresence>
        {showOrderModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrderModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh]"
            >
              {/* Left Side: Order Summary */}
              <div className="w-full md:w-[350px] bg-gray-50 p-8 border-r border-gray-100 overflow-y-auto no-scrollbar">
                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">Resumo</h3>
                <div className="space-y-4 mb-8">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-black uppercase text-gray-900 leading-tight">{item.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 mt-1">{item.quantity}x • {item.category}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black">{(item.price * item.quantity).toLocaleString()} Kz</p>
                         <button onClick={() => removeFromCart(item.id)} className="text-[9px] font-black text-red-400 uppercase mt-1">Remover</button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                     <div className="py-12 text-center">
                        <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-300 italic">Carrinho vazio</p>
                     </div>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-200 space-y-2">
                   <div className="flex justify-between items-center text-gray-500">
                       <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                       <span className="text-xs font-bold">{totalPrice.toLocaleString()} Kz</span>
                   </div>
                   <div className="flex justify-between items-center bg-[#006747] p-4 rounded-2xl text-white">
                       <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total</span>
                       <span className="text-xl font-black">{totalPrice.toLocaleString()} Kz</span>
                   </div>
                </div>
              </div>

              {/* Right Side: Order Info Form */}
              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-8">
                  <div>
                     <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Checkout</h3>
                     <p className="text-gray-400 font-bold text-sm">Preencha os detalhes para entrega</p>
                  </div>
                  <button onClick={() => setShowOrderModal(false)} className="bg-gray-50 p-2 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                    <X className="w-8 h-8" />
                  </button>
                </div>

                <form onSubmit={handleSubmitOrder} className="space-y-8">
                  {/* Prescription Section */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center">
                       <FileText className="w-3 h-3 mr-2 text-[#006747]" /> Receita Médica (Opcional)
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                       <button 
                        type="button" 
                        onClick={() => setPrescriptionType('code')}
                        className={cn(
                          "py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                          prescriptionType === 'code' ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                        )}
                       >Inserir Código</button>
                       <button 
                        type="button" 
                        onClick={() => setPrescriptionType('photo')}
                        className={cn(
                          "py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                          prescriptionType === 'photo' ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                        )}
                       >Tirar Foto</button>
                       <button 
                        type="button" 
                        onClick={() => setPrescriptionType('none')}
                        className={cn(
                          "py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all",
                          prescriptionType === 'none' ? "bg-gray-50 border-gray-200 text-gray-900" : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50"
                        )}
                       >Nenhuma</button>
                    </div>

                    {prescriptionType === 'code' && (
                       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                         <input 
                          required
                          value={orderDetails.code}
                          onChange={(e) => setOrderDetails({...orderDetails, code: e.target.value})}
                          placeholder="EX: VIVA-1234-5678"
                          className="w-full p-5 bg-gray-50 border-none rounded-2xl font-black text-center tracking-[0.2em] text-lg placeholder:tracking-normal placeholder:font-bold"
                         />
                       </motion.div>
                    )}

                    {prescriptionType === 'photo' && (
                       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative h-32 border-2 border-dashed border-gray-100 rounded-3xl flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden group hover:border-[#006747]/30 transition-all">
                          {orderDetails.imageUrl ? (
                             <>
                               <img src={orderDetails.imageUrl} className="w-full h-full object-cover opacity-30" />
                               <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                                  <p className="text-[10px] font-black uppercase text-emerald-700">Foto Carregada • Alterar</p>
                               </div>
                             </>
                          ) : (
                             <div className="text-center">
                               {uploadingImage ? <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /> : <Package className="w-8 h-8 mx-auto text-gray-200" />}
                               <p className="text-[10px] font-black uppercase text-gray-300 mt-2">Clique para carregar foto</p>
                             </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                       </motion.div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center">
                       <MapPin className="w-3 h-3 mr-2 text-[#006747]" /> Detalhes de Entrega
                    </p>
                    <div className="space-y-4">
                      <input 
                        required
                        value={orderDetails.address}
                        onChange={(e) => setOrderDetails({...orderDetails, address: e.target.value})}
                        placeholder="Morada completa de entrega..."
                        className="w-full p-5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#006747]/20 font-bold"
                      />
                      <textarea 
                        value={orderDetails.description}
                        onChange={(e) => setOrderDetails({...orderDetails, description: e.target.value})}
                        placeholder="Observações adicionais para o farmacêutico..."
                        rows={3}
                        className="w-full p-5 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#006747]/20 font-bold resize-none"
                      />
                    </div>
                  </div>

                  <button
                    disabled={submittingOrder || uploadingImage}
                    className="w-full bg-[#006747] text-white py-6 rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {submittingOrder ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Finalizar e Enviar Pedido'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
