import React, { useState, useEffect } from 'react';
import { supabase, type WellnessService, type Booking, type Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  Stethoscope, 
  Plus, 
  Calendar, 
  Users, 
  CheckCircle2, 
  X,
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
  FileText,
  Hospital,
  Pill,
  Package,
  MessageSquare
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

const SubTabButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
    <button 
        onClick={onClick}
        className={cn(
            "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            active ? "bg-white text-[#006747] shadow-sm shadow-emerald-900/5 ring-1 ring-emerald-100" : "text-gray-400 hover:text-gray-600"
        )}
    >
        {label}
    </button>
);

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={cn(
            "flex items-center space-x-2 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
            active ? "bg-[#006747] text-white shadow-lg shadow-emerald-900/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
        )}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export default function ProfessionalDashboard() {
  const { user, profile } = useAuth();
  const [services, setServices] = useState<WellnessService[]>([]);
  const [bookings, setBookings] = useState<(Booking & { service?: WellnessService, patient?: Profile })[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pharmacyOrders, setPharmacyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'products' | 'pharmacies' | 'patients' | 'analytics'>('overview');
  const [subTab, setSubTab] = useState<string>('list');
  const [myPharmacies, setMyPharmacies] = useState<any[]>([]);
  const [patients, setPatients] = useState<Profile[]>([]);
  const [selectedPharmacyOrder, setSelectedPharmacyOrder] = useState<any | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setSubTab('list');
  }, [activeTab]);

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
        
        // Extract unique patients
        const uniquePatientsMap = new Map();
        filtered.forEach(b => {
          if (b.patient) {
            uniquePatientsMap.set(b.user_id, b.patient);
          }
        });
        setPatients(Array.from(uniquePatientsMap.values()));
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

      // 5. Fetch Pharmacy Prescription Submissions
      const isAdmin = profile?.email === 'davidcumbo69@gmail.com';
      
      let pharmaciesQuery = supabase.from('pharmacies').select('*');
      if (!isAdmin) {
        pharmaciesQuery = pharmaciesQuery.eq('owner_id', user.id);
      }
      
      const { data: myPharms } = await pharmaciesQuery;
      
      if (myPharms) {
        setMyPharmacies(myPharms);
        if (myPharms.length > 0) {
          const pharmIds = myPharms.map(p => p.id);
          const { data: ords } = await supabase
            .from('pharmacy_orders')
            .select(`
              *,
              user:profiles(full_name, username),
              pharmacy:pharmacies(name)
            `)
            .in('pharmacy_id', pharmIds)
            .order('created_at', { ascending: false });
          
          if (ords) {
             setPharmacyOrders(ords);
          }
        }
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

  const handleUpdatePharmacyOrderStatus = async (orderId: string, status: string) => {
    setIsUpdatingOrder(true);
    try {
      const { error } = await supabase
        .from('pharmacy_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      fetchData();
      if (selectedPharmacyOrder?.id === orderId) {
        setSelectedPharmacyOrder((prev: any) => ({ ...prev, status }));
      }
    } catch (err) {
      console.error('Error updating pharmacy order status:', err);
    } finally {
      setIsUpdatingOrder(false);
    }
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

            {pharmacyOrders.length > 0 && (
              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[#006747] mb-3 group-hover:scale-110 transition-transform">
                      <Hospital className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pedidos Farmácia</p>
                  <p className="text-xl font-black text-gray-900">{pharmacyOrders.length}</p>
                  <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <Hospital className="w-20 h-20" />
                  </div>
              </div>
            )}
        </div>

        {/* Secondary Navigation - Professional Tabs */}
        <div className="sticky top-4 z-40 flex bg-white/90 backdrop-blur-md p-1.5 rounded-[2rem] border border-gray-100 mb-8 overflow-x-auto scrollbar-hide shadow-lg">
            <TabButton 
                active={activeTab === 'overview'} 
                onClick={() => { setActiveTab('overview'); setSubTab('default'); }}
                icon={<LayoutDashboard className="w-4 h-4" />}
                label="Geral"
            />
            <TabButton 
                active={activeTab === 'services'} 
                onClick={() => { setActiveTab('services'); setSubTab('list'); }}
                icon={<Stethoscope className="w-4 h-4" />}
                label="Serviços"
            />
            <TabButton 
                active={activeTab === 'products'} 
                onClick={() => { setActiveTab('products'); setSubTab('list'); }}
                icon={<ShoppingBag className="w-4 h-4" />}
                label="Produtos"
            />
            <TabButton 
                active={activeTab === 'pharmacies'} 
                onClick={() => { setActiveTab('pharmacies'); setSubTab('list'); }}
                icon={<Hospital className="w-4 h-4" />}
                label="Farmácias"
            />
            <TabButton 
                active={activeTab === 'patients'} 
                onClick={() => { setActiveTab('patients'); setSubTab('default'); }}
                icon={<Users className="w-4 h-4" />}
                label="Pacientes"
            />
            <TabButton 
                active={activeTab === 'analytics'} 
                onClick={() => { setActiveTab('analytics'); setSubTab('default'); }}
                icon={<TrendingUp className="w-4 h-4" />}
                label="Análises"
            />
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
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Summary of Performance */}
                        <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center">
                            <h3 className="font-black text-gray-900 flex items-center mb-6">
                                <TrendingUp className="w-5 h-5 mr-3 text-emerald-500" />
                                Desempenho Hoje
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Novos Pacientes</p>
                                    <p className="text-2xl font-black text-gray-900">+{patients.filter(p => new Date(p.created_at || '').toDateString() === new Date().toDateString()).length}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Atendimentos</p>
                                    <p className="text-2xl font-black text-gray-900">{bookings.filter(b => b.status === 'concluído').length}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">VITUS Hoje</p>
                                    <p className="text-2xl font-black text-amber-500">+{bookings.filter(b => b.status === 'concluído' && new Date(b.scheduled_at).toDateString() === new Date().toDateString()).length * 10} VTS</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nível de Satisfação</p>
                                    <p className="text-2xl font-black text-emerald-600">98%</p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                             <h3 className="font-black text-gray-900 flex items-center mb-4">
                                <Bell className="w-5 h-5 mr-3 text-emerald-500" />
                                Alertas de Sistema
                            </h3>
                            <div className="space-y-4">
                                {pendingBookings.length > 0 && (
                                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center space-x-3">
                                        <div className="bg-white p-2 rounded-xl text-orange-500 shadow-sm">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-orange-900 uppercase">Novos Agendamentos</p>
                                            <p className="text-[10px] font-bold text-orange-700">Você tem {pendingBookings.length} consultas pendentes para confirmar.</p>
                                            <button onClick={() => { setActiveTab('services'); setSubTab('bookings'); }} className="text-[10px] font-black text-orange-900 underline mt-2">VER AGENDAS</button>
                                        </div>
                                    </div>
                                )}
                                {pharmacyOrders.filter(o => o.status === 'pending').length > 0 && (
                                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center space-x-3">
                                        <div className="bg-white p-2 rounded-xl text-emerald-600 shadow-sm">
                                            <Hospital className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-[#006747] uppercase">Pedidos de Farmácia</p>
                                            <p className="text-[10px] font-bold text-emerald-700">Existem {pharmacyOrders.filter(o => o.status === 'pending').length} novos pedidos aguardando ação.</p>
                                            <button onClick={() => { setActiveTab('pharmacies'); setSubTab('orders'); }} className="text-[10px] font-black text-[#006747] underline mt-2">VER PEDIDOS</button>
                                        </div>
                                    </div>
                                )}
                                {pendingBookings.length === 0 && pharmacyOrders.filter(o => o.status === 'pending').length === 0 && (
                                    <div className="py-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sem alertas novos</p>
                                        <p className="text-[9px] text-gray-400">Tudo em ordem no seu consultório.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {pharmacyOrders.length > 0 && (
                        <section className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-gray-900 flex items-center">
                                    <Hospital className="w-5 h-5 mr-3 text-emerald-500" />
                                    Últimos Pedidos de Farmácia
                                </h3>
                                <button 
                                    onClick={() => { setActiveTab('pharmacies'); setSubTab('orders'); }}
                                    className="text-[10px] font-black text-[#006747] uppercase tracking-widest hover:underline"
                                >
                                    Ver Todos
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pharmacyOrders.slice(0, 3).map(order => (
                                    <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#006747]/20 transition-all">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[#006747]">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 leading-tight">{order.user?.full_name || order.user?.username}</h4>
                                                <p className="text-[10px] text-gray-400 font-bold">{order.items?.length || 0} Items • {order.total_price?.toLocaleString()} Kz</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setSelectedPharmacyOrder(order)}
                                            className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-[#006747] group-hover:bg-emerald-50 transition-all"
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                  </>
                )}

                {activeTab === 'services' && (
                  <div className="space-y-8">
                    <div className="bg-white/40 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-100 flex space-x-2 w-fit">
                        <SubTabButton active={subTab === 'list'} onClick={() => setSubTab('list')} label="Meus Serviços" />
                        <SubTabButton active={subTab === 'bookings'} onClick={() => setSubTab('bookings')} label="Agendas e Reservas" />
                    </div>

                    {subTab === 'list' ? (
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
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                                <h3 className="font-black text-gray-900 uppercase tracking-tight">Gestão de Agendamentos</h3>
                                <div className="flex items-center space-x-2">
                                    <span className="text-[10px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">{pendingBookings.length} PENDENTES</span>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Paciente</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Serviço</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Data / Hora</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Ação / Status</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Preço</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {bookings.map(bk => (
                                            <tr key={bk.id} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                                                            {sanitizeAvatarUrl(bk.patient?.avatar_url) ? (
                                                              <img src={sanitizeAvatarUrl(bk.patient.avatar_url)!} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                              <CircleUser className="w-full h-full text-black stroke-[1px] p-2" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-gray-900 text-sm">{bk.patient?.full_name || bk.patient?.username}</p>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ID: {bk.id.slice(0, 4)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <span className="text-xs font-black text-[#006747] uppercase bg-emerald-50 px-3 py-1.5 rounded-lg">{bk.service?.name}</span>
                                                </td>
                                                <td className="px-8 py-5">
                                                    <div className="text-xs font-black text-gray-600">
                                                        {new Date(bk.scheduled_at).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-gray-400">
                                                        {new Date(bk.scheduled_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5">
                                                    {bk.status === 'pendente' ? (
                                                        <div className="flex items-center space-x-2">
                                                            <button onClick={() => handleUpdateBookingStatus(bk.id, 'confirmado')} className="p-2 bg-emerald-50 text-[#006747] rounded-lg hover:bg-[#006747] hover:text-white transition-all shadow-sm">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleUpdateBookingStatus(bk.id, 'cancelado')} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                                                <XCircle className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className={cn(
                                                            "inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                                            bk.status === 'confirmado' ? "bg-green-50 text-green-700" : 
                                                            bk.status === 'concluído' ? "bg-blue-50 text-blue-600" :
                                                            "bg-red-50 text-red-600"
                                                        )}>
                                                            {bk.status}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <span className="font-black text-gray-900 text-sm">{bk.total_price}€</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                  </div>
                )}

                {activeTab === 'products' && (
                  <div className="space-y-8">
                    <div className="bg-white/40 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-100 flex space-x-2 w-fit">
                        <SubTabButton active={subTab === 'list'} onClick={() => setSubTab('list')} label="Meus Produtos" />
                        <SubTabButton active={subTab === 'sales'} onClick={() => setSubTab('sales')} label="Histórico de Vendas" />
                    </div>

                    {subTab === 'list' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map(prod => (
                                <div key={prod.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm group">
                                    <div className="w-full aspect-square bg-gray-50 rounded-[1.5rem] mb-4 overflow-hidden relative border border-gray-100">
                                        {prod.image_url ? (
                                            <img src={prod.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                <ShoppingBag className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <div className="bg-[#006747] text-white px-3 py-1.5 rounded-xl text-[10px] font-black">{prod.price}€</div>
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-gray-900 mb-1 leading-tight">{prod.name}</h4>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">{prod.category}</p>
                                    <p className="text-gray-500 text-xs line-clamp-2 mb-6 font-medium leading-relaxed">{prod.description}</p>
                                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">ESTOQUE</span>
                                            <span className="text-xs font-black text-gray-900">{prod.stock_quantity} unidades</span>
                                        </div>
                                        <button className="text-[9px] font-black text-gray-400 uppercase hover:text-gray-900 transition-colors">Editar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                                <h3 className="font-black text-gray-900 uppercase tracking-tight">Controle de Vendas</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Produto</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status Envio</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Data</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Valor Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                                                            {order.product?.image_url && <img src={order.product.image_url} className="w-full h-full object-cover" />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900">{order.product?.name}</p>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">QTD: x{order.quantity} • {order.buyer?.full_name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    {order.status === 'pendente' ? (
                                                        <button 
                                                            onClick={() => handleUpdateOrderStatus(order.id, 'enviado')}
                                                            className="text-[9px] font-black uppercase bg-[#006747] text-white px-4 py-2 rounded-xl shadow-lg shadow-emerald-900/10 hover:scale-105 transition-all"
                                                        >
                                                            Despachar Pedido
                                                        </button>
                                                    ) : (
                                                        <div className={cn(
                                                            "inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                                            order.status === 'enviado' ? "bg-blue-50 text-blue-600" :
                                                            order.status === 'concluído' ? "bg-emerald-50 text-emerald-600" :
                                                            "bg-gray-100 text-gray-400"
                                                        )}>
                                                            {order.status === 'enviado' && <Truck className="w-3 h-3 mr-1.5" />}
                                                            {order.status}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-8 py-5 text-center">
                                                    <span className="text-xs font-bold text-gray-400">{new Date(order.created_at).toLocaleDateString('pt-PT')}</span>
                                                </td>
                                                <td className="px-8 py-5 text-right">
                                                    <p className="text-sm font-black text-gray-900">{order.total_price}€</p>
                                                    {order.vitus_used > 0 && <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">+{order.vitus_used.toFixed(1)} VITUS UTILIZADOS</p>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                  </div>
                )}

                {activeTab === 'pharmacies' && (
                    <div className="space-y-8">
                        <div className="bg-white/40 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-100 flex space-x-2 w-fit">
                            <SubTabButton active={subTab === 'list'} onClick={() => setSubTab('list')} label="Unidades Farmacêuticas" />
                            <SubTabButton active={subTab === 'orders'} onClick={() => setSubTab('orders')} label="Pedidos e Receitas" />
                        </div>

                        {subTab === 'list' ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Gestão de Unidades</h3>
                                    <Link to="/farmacias/registar" className="bg-[#006747] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/10 hover:scale-105 active:scale-95 transition-all">
                                        Registar Nova Unidade
                                    </Link>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {myPharmacies.map(pharm => (
                                        <div key={pharm.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm group hover:border-[#006747]/20 transition-all flex flex-col md:flex-row gap-6">
                                            <div className="w-20 h-20 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-[#006747] shrink-0">
                                                <Hospital className="w-10 h-10" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xl font-black text-gray-900">{pharm.name}</h4>
                                                    <div className={cn(
                                                        "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest",
                                                        pharm.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-400"
                                                    )}>
                                                        {pharm.status === 'active' ? 'Ativa' : 'Pendente'}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-400 font-bold mb-4 flex items-center">
                                                    <MapPin className="w-3 h-3 mr-1" />
                                                    {pharm.address}
                                                </p>
                                                <div className="flex items-center space-x-3 pt-6 border-t border-gray-50 mt-4">
                                                    <Link to={`/farmacias/${pharm.id}`} className="text-[10px] font-black uppercase text-[#006747] hover:bg-emerald-50 p-2 rounded-xl transition-all">Perfil Público</Link>
                                                    <button className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors p-2">Definições</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {myPharmacies.length === 0 && (
                                        <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-gray-200">
                                            <Hospital className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                            <p className="text-gray-400 font-bold">Nenhuma farmácia vinculada ao seu perfil profissional.</p>
                                            <Link to="/farmacias/registar" className="mt-6 inline-block text-[#006747] font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-8 py-3 rounded-2xl hover:bg-emerald-100 transition-all">Criar Agora</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight">Fila de Atendimento de Receitas</h3>
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">Ativos: {pharmacyOrders.length}</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50/50">
                                            <tr>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Cliente / Paciente</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Unidade Destino</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status Pedido</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {pharmacyOrders.map(sub => (
                                                <tr key={sub.id} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-10 h-10 rounded-xl bg-[#006747]/5 flex items-center justify-center text-[#006747] border border-[#006747]/10">
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-sm text-gray-900">{sub.user?.full_name || sub.user?.username}</p>
                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items: {sub.items?.length || 0}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-xs font-black text-[#006747] uppercase leading-tight">{sub.pharmacy?.name}</p>
                                                        <p className="text-[9px] font-bold text-gray-400">Total: {sub.total_price?.toLocaleString()} Kz</p>
                                                    </td>
                                                    <td className="px-8 py-5 text-center">
                                                        <div className={cn(
                                                            "inline-flex px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest",
                                                            sub.status === 'pending' ? "bg-orange-50 text-orange-600" :
                                                            sub.status === 'processing' ? "bg-blue-50 text-blue-600" :
                                                            sub.status === 'completed' ? "bg-emerald-50 text-emerald-600 shadow-sm" :
                                                            "bg-gray-100 text-gray-400"
                                                        )}>
                                                            {sub.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end space-x-2">
                                                            <button 
                                                                onClick={() => setSelectedPharmacyOrder(sub)}
                                                                className="text-[9px] font-black uppercase text-[#006747] bg-emerald-50 px-4 py-2 rounded-xl hover:bg-[#006747] hover:text-white transition-all shadow-sm"
                                                            >
                                                                Processar
                                                            </button>
                                                            <Link 
                                                                to={`/mensagens?userId=${sub.user_id}`}
                                                                className="p-2 border border-gray-100 text-gray-400 rounded-xl hover:text-[#006747] hover:bg-gray-50 transition-all"
                                                            >
                                                                <MessageSquare className="w-4 h-4" />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {pharmacyOrders.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-8 py-12 text-center text-gray-400 font-bold italic">
                                                        Nenhum pedido de farmácia encontrado.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
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
                {activeTab === 'patients' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Meus Pacientes</h3>
                            <div className="flex items-center space-x-3">
                                <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">Total: {patients.length}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {patients.map(patient => (
                                <div key={patient.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center transition-all hover:border-[#006747]/20 group">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden mb-4 border-4 border-white shadow-md relative group-hover:scale-105 transition-transform">
                                        {sanitizeAvatarUrl(patient.avatar_url) ? (
                                            <img src={sanitizeAvatarUrl(patient.avatar_url)!} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <CircleUser className="w-full h-full text-black stroke-[1px] p-4" />
                                        )}
                                    </div>
                                    <h4 className="font-black text-lg text-gray-900 mb-1">{patient.full_name || patient.username}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Paciente desde {new Date(patient.created_at || Date.now()).toLocaleDateString('pt-PT')}</p>
                                    
                                    <div className="flex items-center justify-center space-x-3 w-full">
                                        <Link 
                                            to={`/mensagens?userId=${patient.id}`}
                                            className="flex-1 bg-emerald-50 text-[#006747] px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#006747] hover:text-white transition-all shadow-sm"
                                        >
                                            Mensagem
                                        </Link>
                                        <button className="flex items-center justify-center w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl hover:text-gray-900 transition-all border border-gray-100">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {patients.length === 0 && (
                                <div className="col-span-full py-24 text-center bg-white/50 rounded-[3rem] border border-dashed border-gray-200">
                                    <Users className="w-16 h-16 text-gray-200 mx-auto mb-6 opacity-30" />
                                    <p className="text-lg font-bold text-gray-400">Você ainda não tem pacientes registados.</p>
                                    <p className="text-sm text-gray-400 mt-2 px-12">Pacientes aparecerão aqui assim que agendarem consultas com você.</p>
                                </div>
                            )}
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

        {/* Pharmacy Order Details Modal */}
        <AnimatePresence>
          {selectedPharmacyOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setSelectedPharmacyOrder(null)}
                 className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
               >
                  <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                     <div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none mb-1">
                          Pedido #{selectedPharmacyOrder.id.slice(0, 8).toUpperCase()}
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalhes da Encomenda de Farmácia</p>
                     </div>
                     <button onClick={() => setSelectedPharmacyOrder(null)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                     {/* Client Info */}
                     <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                              <CircleUser className="w-6 h-6 text-[#006747]" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Cliente</p>
                              <p className="font-bold text-gray-900">{selectedPharmacyOrder.user?.full_name || selectedPharmacyOrder.user?.username}</p>
                           </div>
                        </div>
                        <Link 
                           to={`/mensagens?userId=${selectedPharmacyOrder.user_id}`}
                           className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#006747] border border-emerald-100 shadow-sm hover:bg-emerald-50 transition-all"
                        >
                           <MessageSquare className="w-4 h-4" />
                           <span>Abrir Chat</span>
                        </Link>
                     </div>

                     {/* Items */}
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Medicamentos Solicitados</p>
                        <div className="space-y-2">
                           {selectedPharmacyOrder.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                 <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-[#006747]">
                                       <Pill className="w-4 h-4" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-black uppercase text-gray-900 leading-none">{item.name}</p>
                                       <p className="text-[9px] font-bold text-gray-400 mt-1">{item.category}</p>
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs font-black">{item.price?.toLocaleString()} Kz</p>
                                    <p className="text-[10px] font-bold text-gray-400">Qtd: {item.quantity || 1}</p>
                                 </div>
                              </div>
                           ))}
                           {(!selectedPharmacyOrder.items || selectedPharmacyOrder.items.length === 0) && (
                              <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                 <Package className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nenhum item listado</p>
                                 <p className="text-[9px] text-gray-400 italic">O cliente pode ter enviado apenas a receita.</p>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Prescription Details */}
                     {(selectedPharmacyOrder.prescription_code || selectedPharmacyOrder.prescription_image_url) && (
                        <div className="space-y-4">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Receita Médica</p>
                           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6">
                              {selectedPharmacyOrder.prescription_code && (
                                 <div className="flex-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Código da Receita</p>
                                    <div className="p-4 bg-emerald-50 rounded-xl text-center border border-emerald-100">
                                       <p className="text-xl font-black text-[#006747] tracking-[0.3em] font-mono">{selectedPharmacyOrder.prescription_code}</p>
                                    </div>
                                 </div>
                              )}
                              {selectedPharmacyOrder.prescription_image_url && (
                                 <div className="flex-1">
                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Foto da Receita</p>
                                    <a 
                                      href={selectedPharmacyOrder.prescription_image_url} 
                                      target="_blank" 
                                      rel="no-referrer"
                                      className="block group relative rounded-xl overflow-hidden shadow-sm"
                                    >
                                       <img src={selectedPharmacyOrder.prescription_image_url} className="w-full h-24 object-cover" />
                                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Abrir Imagem</p>
                                       </div>
                                    </a>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}

                     {/* Delivery & Notes */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Morada de Entrega</p>
                           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <p className="text-xs font-bold text-gray-700 leading-relaxed">{selectedPharmacyOrder.delivery_address || 'Entrega na farmácia / Não especificado'}</p>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Observações</p>
                           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                              <p className="text-xs font-bold text-gray-500 italic leading-relaxed">{selectedPharmacyOrder.description || selectedPharmacyOrder.notes || 'Sem observações adicionais.'}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="flex items-center space-x-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status:</p>
                        <div className={cn(
                           "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest",
                           selectedPharmacyOrder.status === 'pending' ? "bg-orange-50 text-orange-600 border border-orange-100" :
                           selectedPharmacyOrder.status === 'processing' ? "bg-blue-50 text-blue-600 border border-blue-100 font-bold" :
                           selectedPharmacyOrder.status === 'completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                           "bg-red-50 text-red-600 border border-red-100"
                        )}>
                           {selectedPharmacyOrder.status}
                        </div>
                     </div>

                     <div className="flex items-center space-x-3 w-full md:w-auto">
                        {selectedPharmacyOrder.status === 'pending' && (
                           <>
                              <button 
                                 disabled={isUpdatingOrder}
                                 onClick={() => handleUpdatePharmacyOrderStatus(selectedPharmacyOrder.id, 'cancelled')}
                                 className="flex-1 md:flex-none px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 border border-red-100 hover:bg-red-50 transition-all"
                              >
                                 Rejeitar
                              </button>
                              <button 
                                 disabled={isUpdatingOrder}
                                 onClick={() => handleUpdatePharmacyOrderStatus(selectedPharmacyOrder.id, 'processing')}
                                 className="flex-1 md:flex-none px-8 py-3 bg-[#006747] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all"
                              >
                                 Aceitar Pedido
                              </button>
                           </>
                        )}
                        {selectedPharmacyOrder.status === 'processing' && (
                           <button 
                              disabled={isUpdatingOrder}
                              onClick={() => handleUpdatePharmacyOrderStatus(selectedPharmacyOrder.id, 'completed')}
                              className="w-full md:w-auto px-8 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                           >
                              Marcar como Pronto / Entregue
                           </button>
                        )}
                        {selectedPharmacyOrder.status === 'completed' && (
                           <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center">
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Pedido Concluído
                           </p>
                        )}
                     </div>
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
