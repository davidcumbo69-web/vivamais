import React, { useState, useEffect } from 'react';
import { supabase, type WellnessService, type Booking, type Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  Stethoscope, 
  Plus, 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Euro,
  MapPin,
  ChevronRight,
  Bell,
  Search,
  Filter,
  MoreVertical,
  LayoutDashboard,
  ShoppingBag,
  Zap,
  Truck,
  PackageCheck,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  HeartPulse as HeartPulseIcon,
  CircleUser,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn, sanitizeAvatarUrl } from '../lib/utils';
import { Skeleton } from '../components/ui/Skeleton';
import { Header } from '../components/layout/Header';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

export default function ProfessionalDashboard() {
  const { user, profile } = useAuth();
  const [services, setServices] = useState<WellnessService[]>([]);
  const [bookings, setBookings] = useState<(Booking & { service?: WellnessService, patient?: Profile })[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'bookings' | 'products' | 'sales' | 'analytics'>('overview');
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

  // Form states
  const [newService, setNewService] = useState({
    name: '',
    category: profile?.specialty || 'Consulta Geral',
    description: '',
    base_price: 40,
    location: '',
  });

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 15,
    category: 'Suplementos',
    stock: 10,
    image_url: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Math.random()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (!uploadError) {
      const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
      setNewProduct(prev => ({ ...prev, image_url: data.publicUrl }));
    }
    setUploadingImage(false);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase.from('products').insert([{
      seller_id: user.id,
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price,
      category: newProduct.category,
      stock_quantity: newProduct.stock,
      image_url: newProduct.image_url
    }]);

    if (!error) {
      setShowProductModal(false);
      setNewProduct({ name: '', description: '', price: 15, category: 'Suplementos', stock: 10, image_url: '' });
      fetchData();
    }
  };
  useEffect(() => {
    if (profile?.specialty) {
      setNewService(prev => ({ ...prev, category: profile.specialty }));
    }
  }, [profile]);

  useEffect(() => {
    if (user && profile?.is_professional) {
      fetchData();
    }
  }, [user, profile]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Auto-confirm orders older than 23h
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
      const { data: expiredOrders } = await supabase
        .from('product_orders')
        .select('id')
        .eq('status', 'enviado')
        .lt('shipped_at', twentyThreeHoursAgo);

      if (expiredOrders && expiredOrders.length > 0) {
        await supabase
          .from('product_orders')
          .update({ status: 'concluído' })
          .in('id', expiredOrders.map(o => o.id));
      }

      // 1. Fetch Services
      const { data: svcs } = await supabase
        .from('wellness_services')
        .select('*')
        .eq('provider_id', user.id);
      if (svcs) setServices(svcs);

      // 2. Fetch Bookings
      const { data: bks } = await supabase
        .from('bookings')
        .select('*, service:service_id(*), patient:user_id(*)')
        .order('scheduled_at', { ascending: false });
      
      if (bks) {
        const filtered = bks.filter(b => b.service?.provider_id === user.id);
        setBookings(filtered);
      }

      // 3. Fetch Products
      const { data: prods } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id);
      if (prods) setProducts(prods);

      // 4. Fetch Sales (Orders)
      const { data: ords } = await supabase
        .from('product_orders')
        .select('*, product:product_id(*), buyer:buyer_id(*)')
        .order('created_at', { ascending: false });
      
      if (ords) {
        const filteredOrds = ords.filter(o => o.product?.seller_id === user.id);
        setOrders(filteredOrds);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const updateData: any = { status };
    if (status === 'enviado') {
      updateData.shipped_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('product_orders')
      .update(updateData)
      .eq('id', orderId);
    if (!error) fetchData();
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const { error } = await supabase.from('wellness_services').insert([{
      name: newService.name,
      provider_id: user.id,
      provider_name: profile.full_name || profile.username,
      category: profile.specialty || newService.category,
      description: newService.description,
      base_price: newService.base_price,
      location: newService.location,
      vitus_discount_cap: 20
    }]);

    if (!error) {
      setShowCreateModal(false);
      setNewService({ 
        name: '', 
        category: profile.specialty || 'Consulta Geral', 
        description: '', 
        base_price: 40, 
        location: '' 
      });
      fetchData();
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    
    if (!error) fetchData();
  };

  if (!profile?.is_professional) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 mb-8">Esta área é exclusiva para profissionais de saúde verificados pelo SNS.</p>
          <button onClick={() => window.history.back()} className="bg-[#006747] text-white px-8 py-3 rounded-2xl font-bold">Voltar</button>
        </div>
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pendente');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmado');
  
  const handleBecomePremium = async () => {
      if (!profile) return;
      
      const premiumCostVitus = 50; // Cost 50 Vitus for Premium
      if (profile.vitus_balance < premiumCostVitus) {
          showNotification('Saldo insuficiente de VITUS. Continue atendendo pacientes para ganhar mais!', 'error');
          return;
      }

      const { error: updateError } = await supabase.from('profiles').update({
          vitus_balance: profile.vitus_balance - premiumCostVitus,
          is_premium: true
      }).eq('id', profile.id);

      if (!updateError) {
          await supabase.from('vitus_transactions').insert([{
              user_id: profile.id,
              amount: -premiumCostVitus,
              reason: 'Assinatura Plano Premium (30 dias)'
          }]);
          showNotification('Parabéns! Agora você é um Specialist Premium ✨');
          fetchData();
      }
  };

  const bookingEarnings = bookings
    .filter(b => b.status === 'concluído' || b.status === 'confirmado')
    .reduce((acc, b) => acc + (b.total_price || 0), 0);
  
  const salesEarnings = orders
    .filter(o => o.status === 'enviado' || o.status === 'concluído')
    .reduce((acc, o) => acc + (o.total_price || 0), 0);
    
  const totalEarnings = bookingEarnings + salesEarnings;
  const vitusBalance = profile?.vitus_balance || 0;
  const vitusWorth = vitusBalance * 3;
  
  // Process data for charts
  const getPatientGrowthData = () => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const currentMonth = new Date().getMonth();
      const data = months.slice(0, currentMonth + 1).map(m => ({ name: m, patients: 0 }));
      
      const uniquePatientsByMonth = new Map();
      
      bookings.forEach(b => {
          const date = new Date(b.created_at || new Date());
          const monthIdx = date.getMonth();
          if (monthIdx <= currentMonth) {
              const key = `${monthIdx}-${b.user_id}`;
              if (!uniquePatientsByMonth.has(key)) {
                  uniquePatientsByMonth.set(key, true);
                  data[monthIdx].patients++;
              }
          }
      });
      
      return data;
  };

  const getStatusDistributionData = () => {
      const statuses: Record<string, number> = {
          'Confirmados': bookings.filter(b => b.status === 'confirmado' || b.status === 'concluído').length,
          'Pendentes': bookings.filter(b => b.status === 'pendente').length,
          'Cancelados': bookings.filter(b => b.status === 'cancelado').length
      };
      return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  };

  const getWeeklyActivityData = () => {
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const data = days.map(day => ({ day, count: 0 }));
      
      bookings.forEach(b => {
          const dayIdx = new Date(b.scheduled_at).getDay();
          data[dayIdx].count++;
      });
      
      return data;
  };

  const getRevenueComparisonData = () => {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const currentMonth = new Date().getMonth();
      const data = months.slice(0, currentMonth + 1).map(m => ({ name: m, serviços: 0, produtos: 0 }));

      bookings.filter(b => b.status === 'concluído' || b.status === 'confirmado').forEach(b => {
          const monthIdx = new Date(b.scheduled_at).getMonth();
          if (monthIdx <= currentMonth) data[monthIdx].serviços += (b.total_price || 0);
      });

      orders.filter(o => o.status === 'enviado' || o.status === 'concluído').forEach(o => {
          const monthIdx = new Date(o.created_at).getMonth();
          if (monthIdx <= currentMonth) data[monthIdx].produtos += (o.total_price || 0);
      });

      return data;
  };

  const getRevenueData = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonth = new Date().getMonth();
    const data = months.slice(0, currentMonth + 1).map(m => ({ name: m, value: 0 }));

    // Add bookings revenue
    bookings.filter(b => b.status === 'concluído' || b.status === 'confirmado').forEach(b => {
      const date = new Date(b.scheduled_at);
      const monthIdx = date.getMonth();
      if (monthIdx <= currentMonth) {
        data[monthIdx].value += (b.total_price || 0);
      }
    });

    // Add product sales revenue
    orders.filter(o => o.status === 'enviado' || o.status === 'concluído').forEach(o => {
      const date = new Date(o.created_at);
      const monthIdx = date.getMonth();
      if (monthIdx <= currentMonth) {
        data[monthIdx].value += (o.total_price || 0);
      }
    });

    return data;
  };

  const getSalesByCategoryData = () => {
    const categories: Record<string, number> = {};
    
    // Revenue from orders
    orders.filter(o => o.status === 'enviado' || o.status === 'concluído').forEach(o => {
      const cat = o.product?.category || 'Outros';
      categories[cat] = (categories[cat] || 0) + (o.total_price || 0);
    });

    // Revenue from bookings
    bookings.filter(b => b.status === 'concluído' || b.status === 'confirmado').forEach(b => {
      const cat = 'Serviços';
      categories[cat] = (categories[cat] || 0) + (b.total_price || 0);
    });

    return Object.entries(categories).map(([category, sales]) => ({ category, sales }));
  };

  const getDistributionData = () => {
    return [
      { name: 'Consultas', value: bookings.length },
      { name: 'Produtos', value: products.length },
      { name: 'Vendas', value: orders.length }
    ];
  };

  return (
    <div className="min-h-screen bg-[#dae0e6]">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 pt-8 pb-24">
        {/* Top Navigation / Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-black text-[#006747] tracking-tight flex items-center">
              Área do Profissional
              {profile.is_premium && (
                <span className="ml-3 bg-gradient-to-r from-amber-200 to-amber-500 text-amber-900 text-[10px] px-2 py-1 rounded-lg uppercase tracking-widest shadow-sm">Premium</span>
              )}
            </h1>
            <p className="text-gray-500 font-medium">{profile.full_name || profile.username} • {profile.specialty || 'Profissional de Saúde'}</p>
          </div>
          <div className="flex items-center space-x-3">
             {!profile.is_premium && (
                 <button 
                    onClick={handleBecomePremium}
                    className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-amber-200 to-amber-500 text-amber-900 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/20"
                 >
                    <Zap className="w-4 h-4" />
                    <span>Tornar-se Premium</span>
                 </button>
             )}
             <button className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-gray-400 hover:text-[#006747] transition-colors relative">
                <Bell className="w-5 h-5" />
                {pendingBookings.length > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
             </button>
             <button 
               onClick={() => activeTab === 'products' ? setShowProductModal(true) : setShowCreateModal(true)}
               className="bg-[#006747] text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 active:scale-95 transition-all"
             >
                <Plus className="w-5 h-5" />
                <span>{activeTab === 'products' ? 'Novo Produto' : 'Novo Serviço'}</span>
             </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-[#006747] p-6 rounded-[2rem] border border-[#006747]/10 shadow-xl shadow-emerald-900/10 text-white col-span-2 lg:col-span-1">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase text-white/60 tracking-wider">Receita Total</p>
                <p className="text-2xl font-black">{totalEarnings.toFixed(2)}€</p>
            </div>

            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-6 rounded-[2rem] border border-amber-200 shadow-xl shadow-amber-900/10 text-white col-span-2 lg:col-span-1">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                    <Zap className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase text-white/80 tracking-wider">Saldo VITUS</p>
                <p className="text-2xl font-black">{vitusBalance.toFixed(1)} <span className="text-xs font-bold">VTS</span></p>
                <p className="text-[9px] font-black text-white/70 uppercase">≈ {vitusWorth.toFixed(2)}€</p>
            </div>
            
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[#006747] mb-3">
                    <Stethoscope className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Receita de Serviços</p>
                <p className="text-xl font-black text-gray-900">{bookingEarnings.toFixed(2)}€</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-3">
                    <ShoppingBag className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Receita de Produtos</p>
                <p className="text-xl font-black text-gray-900">{salesEarnings.toFixed(2)}€</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-3">
                    <Calendar className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Agendas</p>
                <p className="text-xl font-black text-gray-900">{bookings.length}</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 mb-3">
                    <Users className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Vendas</p>
                <p className="text-xl font-black text-gray-900">{orders.length}</p>
            </div>
        </div>

        {/* Secondary Navigation */}
        <div className="flex bg-white/50 p-1 rounded-2xl border border-gray-100 mb-8 max-w-2xl overflow-x-auto scrollbar-hide">
            <button 
                onClick={() => setActiveTab('overview')}
                className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    activeTab === 'overview' ? "bg-white text-[#006747] shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
            >
                Geral
            </button>
            <button 
                onClick={() => setActiveTab('services')}
                className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    activeTab === 'services' ? "bg-white text-[#006747] shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
            >
                Serviços
            </button>
            <button 
                onClick={() => setActiveTab('bookings')}
                className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    activeTab === 'bookings' ? "bg-white text-[#006747] shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
            >
                Agendas
            </button>
            <button 
                onClick={() => setActiveTab('products')}
                className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    activeTab === 'products' ? "bg-white text-[#006747] shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
            >
                Produtos
            </button>
            <button 
                onClick={() => setActiveTab('sales')}
                className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    activeTab === 'sales' ? "bg-white text-[#006747] shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
            >
                Vendas
            </button>
            <button 
                onClick={() => setActiveTab('analytics')}
                className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    activeTab === 'analytics' ? "bg-white text-[#006747] shadow-sm" : "text-gray-400 hover:text-gray-600"
                )}
            >
                Análises
            </button>
            <Link 
                to="/professional/patients"
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap text-gray-400 hover:text-[#006747] flex items-center justify-center space-x-2"
            >
                <HeartPulseIcon className="w-3 h-3" />
                <span>Pacientes</span>
            </Link>
        </div>

        {loading ? (
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {[1, 2].map(i => (
                        <div key={i} className="space-y-4">
                            <Skeleton className="h-8 w-48" />
                            <div className="space-y-4">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="bg-white p-6 rounded-3xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <Skeleton className="w-12 h-12 rounded-2xl" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Skeleton className="w-10 h-10 rounded-2xl" />
                                            <Skeleton className="w-10 h-10 rounded-2xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        ) : (
            <div className="space-y-8">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Pending Approvals */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-gray-900 flex items-center">
                                    <Clock className="w-5 h-5 mr-2 text-orange-500" />
                                    Aguardando Confirmação
                                </h3>
                                <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">
                                    {pendingBookings.length} NOVAS
                                </span>
                            </div>
                            <div className="space-y-4">
                                {pendingBookings.length > 0 ? pendingBookings.map(bk => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={bk.id} 
                                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#006747]/20 transition-all"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                                                {sanitizeAvatarUrl(bk.patient?.avatar_url) ? (
                                                    <img src={sanitizeAvatarUrl(bk.patient.avatar_url)!} className="w-full h-full object-cover" alt="" />
                                                ) : (
                                                    <CircleUser className="w-full h-full text-black stroke-[1px] p-2" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{bk.patient?.full_name || bk.patient?.username}</h4>
                                                <p className="text-xs text-[#006747] font-bold uppercase">{bk.service?.name}</p>
                                                <div className="flex items-center text-[10px] text-gray-400 font-bold mt-1">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {new Date(bk.scheduled_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button 
                                                onClick={() => handleUpdateBookingStatus(bk.id, 'confirmado')}
                                                className="bg-emerald-50 text-[#006747] p-3 rounded-2xl hover:bg-[#006747] hover:text-white transition-all shadow-sm"
                                            >
                                                <CheckCircle2 className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateBookingStatus(bk.id, 'cancelado')}
                                                className="bg-red-50 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="bg-white/50 p-12 text-center rounded-[2rem] border-2 border-dashed border-gray-200">
                                        <p className="text-gray-400 font-bold text-sm">Sem pedidos pendentes.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Recent Activity / Next Appointments */}
                        <section>
                             <h3 className="font-black text-gray-900 flex items-center mb-4">
                                <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                                Próximas Consultas
                            </h3>
                            <div className="space-y-4">
                                {confirmedBookings.length > 0 ? confirmedBookings.slice(0, 5).map(bk => (
                                    <div key={bk.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm">{bk.patient?.full_name || bk.patient?.username}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold">
                                                    {new Date(bk.scheduled_at).toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <button className="text-gray-300 hover:text-gray-600">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                )) : (
                                    <div className="bg-white/50 p-12 text-center rounded-[2rem] border border-gray-200">
                                        <p className="text-gray-400 text-sm">Agenda vazia para os próximos dias.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'services' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map(svc => (
                            <motion.div 
                                layout
                                key={svc.id} 
                                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="text-gray-400 hover:text-gray-900">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006747] mb-4">
                                    <Stethoscope className="w-6 h-6" />
                                </div>
                                <h4 className="text-lg font-black text-gray-900 mb-1">{svc.name}</h4>
                                <p className="text-[10px] font-black text-[#006747] uppercase tracking-widest mb-4">{svc.category}</p>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">
                                    {svc.description || "Sem descrição disponível."}
                                </p>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                    <div className="flex items-center font-black text-gray-900">
                                        <Euro className="w-4 h-4 mr-1 text-[#006747]" />
                                        {svc.base_price}€
                                    </div>
                                    <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {svc.location || 'Online'}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-black text-gray-900">Histórico de Agendas</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Paciente</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Serviço</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Data/Hora</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {bookings.map(bk => (
                                        <tr key={bk.id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                                        {sanitizeAvatarUrl(bk.patient?.avatar_url) ? (
                                                          <img src={sanitizeAvatarUrl(bk.patient.avatar_url)!} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                          <CircleUser className="w-full h-full text-black stroke-[1px] p-1.5" />
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-sm text-gray-900">{bk.patient?.full_name || bk.patient?.username}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-500">{bk.service?.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-500">
                                                    {new Date(bk.scheduled_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={cn(
                                                    "inline-flex px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                                                    bk.status === 'confirmado' ? "bg-green-50 text-green-700" : 
                                                    bk.status === 'pendente' ? "bg-orange-50 text-orange-600" :
                                                    bk.status === 'concluído' ? "bg-blue-50 text-blue-600" :
                                                    "bg-red-50 text-red-600"
                                                )}>
                                                    {bk.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-gray-900">{bk.total_price}€</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map(prod => (
                            <div key={prod.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 overflow-hidden">
                                    {prod.image_url ? (
                                        <img src={prod.image_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <ShoppingBag className="w-6 h-6" />
                                    )}
                                </div>
                                <h4 className="text-lg font-black text-gray-900 mb-1">{prod.name}</h4>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">{prod.category}</p>
                                <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-medium leading-relaxed">{prod.description}</p>
                                <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                                    <span className="font-black text-gray-900">{prod.price}€</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estoque: {prod.stock_quantity}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'sales' && (
                    <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-black text-gray-900">Vendas de Produtos</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Produto</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Qtd</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Comprador</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-wider text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orders.map(order => (
                                        <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-gray-900">{order.product?.name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-black text-[#006747] bg-emerald-50 px-2 py-1 rounded-lg">x{order.quantity}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                                {order.buyer?.full_name || order.buyer?.username}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    {order.status === 'pendente' ? (
                                                        <button 
                                                            onClick={() => handleUpdateOrderStatus(order.id, 'enviado')}
                                                            className="text-[9px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-sans"
                                                        >
                                                            Marcar como Enviado
                                                        </button>
                                                    ) : order.status === 'enviado' ? (
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-700 px-3 py-1 rounded-lg flex items-center">
                                                                <Truck className="w-3 h-3 mr-1" />
                                                                Aguardando Confirmação
                                                            </span>
                                                            <button 
                                                                onClick={() => handleUpdateOrderStatus(order.id, 'pendente')}
                                                                className="text-[9px] font-black uppercase bg-gray-100 text-gray-400 px-2 py-1 rounded-lg hover:bg-red-50 hover:text-red-500 transition-all font-sans"
                                                            >
                                                                Anular
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg ${order.status === 'concluído' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                            {order.status === 'concluído' && <PackageCheck className="w-3 h-3 mr-1 inline" />}
                                                            {order.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="font-black text-gray-900">{order.total_price}€</span>
                                                    {order.vitus_used > 0 && (
                                                        <span className="text-[8px] font-black text-amber-600 uppercase flex items-center mt-0.5">
                                                            <Zap className="w-2.5 h-2.5 mr-0.5" />
                                                            {order.vitus_used.toFixed(1)} Vitus
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-8">
                        {/* Charts Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Revenue Chart */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#006747] mb-8 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Crescimento de Receita
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={getRevenueData()}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#006747" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#006747" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A0AEC0' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A0AEC0' }} />
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 700 }}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="#006747" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Service Categories Distribution */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#006747] mb-8 flex items-center">
                                    <PieChartIcon className="w-4 h-4 mr-2" />
                                    Distribuição de Serviços
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getDistributionData()}
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#006747" />
                                                <Cell fill="#3B82F6" />
                                                <Cell fill="#F59E0B" />
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center space-x-6 mt-4">
                                    <div className="flex items-center text-[10px] font-black uppercase text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-[#006747] mr-2" /> Consultas
                                    </div>
                                    <div className="flex items-center text-[10px] font-black uppercase text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-[#3B82F6] mr-2" /> Produtos
                                    </div>
                                    <div className="flex items-center text-[10px] font-black uppercase text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-[#F59E0B] mr-2" /> Agendas
                                    </div>
                                </div>
                            </div>

                            {/* Sales by Category */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm lg:col-span-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#006747] mb-8 flex items-center">
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Vendas por Categoria de Produto
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getSalesByCategoryData()}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A0AEC0' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A0AEC0' }} />
                                            <Tooltip 
                                                cursor={{ fill: '#F7FAFC' }}
                                                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="sales" fill="#006747" radius={[10, 10, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Patient Growth Line Chart */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#006747] mb-8 flex items-center">
                                    <Users className="w-4 h-4 mr-2" />
                                    Crescimento de Pacientes
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={getPatientGrowthData()}>
                                            <defs>
                                                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A0AEC0' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A0AEC0' }} />
                                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Area type="monotone" dataKey="patients" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorPatients)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Revenue Comparison: Services vs Products */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#006747] mb-8 flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Mix de Receita (Serviços vs Produtos)
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getRevenueComparisonData()}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A0AEC0' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A0AEC0' }} />
                                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="serviços" fill="#006747" stackId="a" radius={[10, 10, 0, 0]} />
                                            <Bar dataKey="produtos" fill="#3B82F6" stackId="a" radius={[10, 10, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Activity Heatmap (Simplified as Weekly Activity) */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#006747] mb-8 flex items-center">
                                    <Clock className="w-4 h-4 mr-2" />
                                    Atividade por Dia da Semana
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={getWeeklyActivityData()}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A0AEC0' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#A0AEC0' }} />
                                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Bar dataKey="count" fill="#F59E0B" radius={[5, 5, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Status Efficiency Pie Chart */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#006747] mb-8 flex items-center">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Eficiência de Agendamento
                                </h3>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getStatusDistributionData()}
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                <Cell fill="#10B981" />
                                                <Cell fill="#F59E0B" />
                                                <Cell fill="#EF4444" />
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center space-x-6 mt-4">
                                    <div className="flex items-center text-[10px] font-black uppercase text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-[#10B981] mr-2" /> Confirmados
                                    </div>
                                    <div className="flex items-center text-[10px] font-black uppercase text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-[#F59E0B] mr-2" /> Pendentes
                                    </div>
                                    <div className="flex items-center text-[10px] font-black uppercase text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-[#EF4444] mr-2" /> Cancelados
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                                <h4 className="text-[10px] font-black uppercase text-emerald-800 mb-2 tracking-widest">Taxa de Confirmação</h4>
                                <p className="text-3xl font-black text-emerald-900">
                                    {bookings.length > 0 
                                        ? ((bookings.filter(b => b.status === 'confirmado' || b.status === 'concluído').length / bookings.length) * 100).toFixed(1)
                                        : '0'}%
                                </p>
                                <p className="text-xs text-emerald-600 mt-1 font-bold">Baseado em {bookings.length} agendas</p>
                            </div>
                            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                                <h4 className="text-[10px] font-black uppercase text-blue-800 mb-2 tracking-widest">Ticket Médio</h4>
                                <p className="text-3xl font-black text-blue-900">
                                    {(totalEarnings / Math.max(1, bookings.length + orders.length)).toFixed(2)}€
                                </p>
                                <p className="text-xs text-blue-600 mt-1 font-bold">Por transação</p>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100">
                                <h4 className="text-[10px] font-black uppercase text-orange-800 mb-2 tracking-widest">Produtos / Cliente</h4>
                                <p className="text-3xl font-black text-orange-900">
                                    {(orders.reduce((acc, o) => acc + o.quantity, 0) / Math.max(1, Array.from(new Set(orders.map(o => o.buyer_id))).length)).toFixed(1)}
                                </p>
                                <p className="text-xs text-orange-600 mt-1 font-bold">Média de itens</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}
      </main>

      {/* CREATE SERVICE MODAL ... */}

      {/* CREATE PRODUCT MODAL */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowProductModal(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative shadow-2xl"
             >
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-[#006747]">Novo Produto</h2>
                    <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-gray-600">
                        <XCircle className="w-8 h-8" />
                    </button>
                </div>

                <form onSubmit={handleCreateProduct} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Imagem do Produto</label>
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden">
                                {newProduct.image_url ? (
                                    <img src={newProduct.image_url} className="w-full h-full object-cover" alt="" />
                                ) : uploadingImage ? (
                                    <div className="w-4 h-4 border-2 border-[#006747] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Plus className="text-gray-300" />
                                )}
                            </div>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="text-xs font-bold text-[#006747]"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Nome do Produto</label>
                        <input 
                            required
                            type="text" 
                            className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold"
                            value={newProduct.name}
                            onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Preço (€)</label>
                            <input 
                                required
                                type="number" 
                                className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold"
                                value={newProduct.price}
                                onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Estoque</label>
                            <input 
                                required
                                type="number" 
                                className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold"
                                value={newProduct.stock}
                                onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Descrição</label>
                        <textarea 
                            rows={3}
                            className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold resize-none"
                            value={newProduct.description}
                            onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                        />
                    </div>
                    <button className="w-full bg-[#006747] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl">
                        Publicar no Mercado
                    </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowCreateModal(false)}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-[2.5rem] w-full max-w-md p-8 relative shadow-2xl"
             >
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-black text-[#006747]">Novo Serviço Profissional</h2>
                    <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 translate-x-2 -translate-y-2">
                        <XCircle className="w-8 h-8" />
                    </button>
                </div>

                <form onSubmit={handleCreateService} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Nome do Serviço</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-[#006747] transition-all"
                                placeholder="Introduza um nome apelativo..."
                                value={newService.name}
                                onChange={e => setNewService({...newService, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Especialidade (Automático)</label>
                            <div className="w-full bg-gray-100 border-gray-100 rounded-2xl p-4 text-sm font-bold text-gray-500 cursor-not-allowed">
                                {profile?.specialty || 'Não definida no perfil'}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Preço Base (€)</label>
                                <input 
                                    required
                                    type="number" 
                                    className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold"
                                    value={newService.base_price}
                                    onChange={e => setNewService({...newService, base_price: parseInt(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Local</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold"
                                    placeholder="Cidade ou Online"
                                    value={newService.location}
                                    onChange={e => setNewService({...newService, location: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Descrição detalhada</label>
                            <textarea 
                                rows={3}
                                className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-bold resize-none"
                                placeholder="..."
                                value={newService.description}
                                onChange={e => setNewService({...newService, description: e.target.value})}
                            />
                        </div>
                    </div>
                    <button className="w-full bg-[#006747] text-white py-5 rounded-[2rem] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:shadow-emerald-900/30 active:scale-[0.98] transition-all mt-4">
                        Ativar Serviço Profissional
                    </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
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
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">Gestão Profissional</p>
                        <p className="text-sm font-bold tracking-tight">{notification.message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
