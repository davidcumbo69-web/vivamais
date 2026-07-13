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
  ChevronLeft,
  Bell,
  Search,
  Filter,
  MoreVertical,
  LayoutDashboard,
  ShoppingBag,
  Trash2,
  Loader2,
  Zap,
  Truck,
  PackageCheck,
  Copy,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  HeartPulse,
  HeartPulse as HeartPulseIcon,
  CircleUser,
  FileText,
  Hospital,
  Pill,
  Package,
  MessageSquare,
  Brain,
  Sparkles,
  History,
  AlertCircle,
  ArrowUpRight,
  Activity,
  Check,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn, sanitizeAvatarUrl } from '../lib/utils';
import { Skeleton } from '../components/ui/Skeleton';
import { Header } from '../components/layout/Header';
import { geminiService, type AIEvolutionResult } from '../services/geminiService';
import AiCopilotDashboard from '../components/AiCopilotDashboard';
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
  const isAdmin = user?.email === 'davidcumbo69@gmail.com' || profile?.email === 'davidcumbo69@gmail.com' || user?.email === 'viva@gmail.com' || profile?.email === 'viva@gmail.com' || profile?.is_admin === true || profile?.role === 'admin';
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [services, setServices] = useState<WellnessService[]>([]);
  const [bookings, setBookings] = useState<(Booking & { service?: WellnessService, patient?: Profile })[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [pharmacyOrders, setPharmacyOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const activeTab = (urlTab && ['overview', 'services', 'products', 'pharmacies', 'patients', 'analytics'].includes(urlTab))
    ? (urlTab as 'overview' | 'services' | 'products' | 'pharmacies' | 'patients' | 'analytics')
    : 'overview';

  const setActiveTab = (newTab: 'overview' | 'services' | 'products' | 'pharmacies' | 'patients' | 'analytics') => {
    setSearchParams({ tab: newTab });
  };
  const [subTab, setSubTab] = useState<string>('list');
  const [bookingTab, setBookingTab] = useState<'pendentes' | 'confirmados'>('pendentes');
  const [myPharmacies, setMyPharmacies] = useState<any[]>([]);
  const [patients, setPatients] = useState<Profile[]>([]);
  const [selectedPharmacyOrder, setSelectedPharmacyOrder] = useState<any | null>(null);
  
  // Patient details state
  const [selectedPatient, setSelectedPatient] = useState<Profile | null>(null);
  const [patientTab, setPatientTab] = useState<'history' | 'ai' | 'prescriptions' | 'notes' | 'medications' | 'evolution' | 'alerts'>('history');
  const [patientHistories, setPatientHistories] = useState<any[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([]);
  const [historiesLoading, setHistoriesLoading] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [patientAiResult, setPatientAiResult] = useState<AIEvolutionResult | null>(null);
  const [privateNotes, setPrivateNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [expandedHistories, setExpandedHistories] = useState<Record<string, boolean>>({});

  const getEvolutionChartData = () => {
    return [...patientHistories]
      .reverse()
      .map(h => {
        let sys = null;
        let dia = null;
        if (h.systolic_bp) {
          sys = Number(h.systolic_bp);
          dia = Number(h.diastolic_bp);
        } else if (h.blood_pressure) {
          const parts = h.blood_pressure.split('/');
          sys = Number(parts[0]);
          dia = Number(parts[1]);
        }
        return {
          date: new Date(h.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
          sys,
          dia,
          spo2: h.oxygen_saturation || h.spo2 ? Number(h.oxygen_saturation || h.spo2) : null,
          fc: h.heart_rate ? Number(h.heart_rate) : null,
          temp: h.temperature ? Number(h.temperature) : null
        };
      });
  };

  const getSmartAlerts = () => {
    const alerts: { title: string; desc: string; severity: 'critical' | 'warning' | 'info'; date: string }[] = [];
    
    if (patientHistories.length > 0) {
      const latest = patientHistories[0];
      
      if (latest.systolic_bp || latest.blood_pressure) {
        let sys = 0;
        let dia = 0;
        if (latest.systolic_bp) {
          sys = Number(latest.systolic_bp);
          dia = Number(latest.diastolic_bp || 80);
        } else if (typeof latest.blood_pressure === 'string') {
          const parts = latest.blood_pressure.split('/');
          sys = Number(parts[0]);
          dia = Number(parts[1]);
        }

        if (sys >= 160 || dia >= 100) {
          alerts.push({
            title: "Crise Hipertensiva Potencial",
            desc: `Pressão arterial medida em ${sys}/${dia} mmHg. Risco de acidente cardiovascular imediato se sintomático.`,
            severity: 'critical',
            date: new Date(latest.created_at).toLocaleDateString('pt-PT')
          });
        } else if (sys >= 140 || dia >= 90) {
          alerts.push({
            title: "Hipertensão Não Controlada (Grau I/II)",
            desc: `Valores de ${sys}/${dia} mmHg indicam controle subótimo. Reavaliar medicação.`,
            severity: 'warning',
            date: new Date(latest.created_at).toLocaleDateString('pt-PT')
          });
        }
      }

      const spo2 = Number(latest.oxygen_saturation || latest.spo2 || 100);
      if (spo2 > 0 && spo2 < 92) {
        alerts.push({
          title: "Hipoxemia Moderada/Grave",
          desc: `Saturação de Oxigénio em ${spo2}%. Risco imediato de insuficiência respiratória.`,
          severity: 'critical',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      } else if (spo2 > 0 && spo2 < 95) {
        alerts.push({
          title: "Hipóxia Ligeira",
          desc: `Saturação de Oxigénio limítrofe em ${spo2}%. Acompanhar clinicamente.`,
          severity: 'warning',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      }

      const hr = Number(latest.heart_rate || 0);
      if (hr > 120) {
        alerts.push({
          title: "Taquicardia Severa",
          desc: `Frequência cardíaca em ${hr} bpm em repouso. Investigar arritmia ou resposta sistémica.`,
          severity: 'critical',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      } else if (hr > 100) {
        alerts.push({
          title: "Taquicardia Leve",
          desc: `Frequência cardíaca elevada (${hr} bpm).`,
          severity: 'warning',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      } else if (hr > 0 && hr < 50) {
        alerts.push({
          title: "Bradicardia Sinusal / Bloqueio",
          desc: `Frequência cardíaca em ${hr} bpm. Avaliar sintomas de tontura ou desmaios.`,
          severity: 'critical',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      }

      const temp = Number(latest.temperature || 36.5);
      if (temp >= 38.5) {
        alerts.push({
          title: "Febre Alta / Possível Sépsis",
          desc: `Temperatura axilar de ${temp}°C. Se acompanhada de taquicardia ou hipotensão, monitorizar critérios de sépsis (SIRS/qSOFA).`,
          severity: 'critical',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      } else if (temp >= 37.8) {
        alerts.push({
          title: "Estado Febril",
          desc: `Temperatura de ${temp}°C. Indício de atividade inflamatória ou infecção ativa.`,
          severity: 'warning',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      }
    }

    if (privateNotes.toLowerCase().includes("não melhora") || privateNotes.toLowerCase().includes("sem melhoras")) {
      alerts.push({
        title: "Sinal de Alerta: Falha Terapêutica",
        desc: "As notas clínicas do profissional indicam que o paciente não está a obter melhoras, sugerindo necessidade urgente de reavaliação diagnóstica ou alteração do esquema de medicação.",
        severity: 'warning',
        date: "Atual"
      });
    }

    if (privateNotes.toLowerCase().includes("esquece") || privateNotes.toLowerCase().includes("não tomou") || privateNotes.toLowerCase().includes("não cumpre")) {
      alerts.push({
        title: "Adesão Terapêutica Comprometida",
        desc: "Notas indicam esquecimento ou recusa na medicação prescrita. Risco elevado de progressão da doença.",
        severity: 'critical',
        date: "Atual"
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        title: "Sinais Vitais Estáveis",
        desc: "Não foram identificados desvios críticos imediatos nos parâmetros laboratoriais e de sinais vitais.",
        severity: 'info',
        date: "Sincronizado"
      });
    }

    return alerts;
  };

  const parseDurationDays = (durationStr: string) => {
    if (!durationStr) return 1;
    const d = durationStr.toString().toLowerCase();
    const numMatch = d.match(/(\d+)/);
    if (!numMatch) return 1;
    
    const num = parseInt(numMatch[1]);
    if (d.includes('semana') || d.includes('week')) return num * 7;
    if (d.includes('mês') || d.includes('mes') || d.includes('month')) return num * 30;
    return num;
  };

  // Fetch patient details on select
  useEffect(() => {
    if (selectedPatient) {
      fetchPatientDetails(selectedPatient.id);
      // Load saved notes for this patient from localStorage
      const savedNotes = localStorage.getItem(`patient_notes_${selectedPatient.id}`) || '';
      setPrivateNotes(savedNotes);
      setPatientAiResult(null);
      setPatientTab('history');
    }
  }, [selectedPatient]);

  const fetchPatientDetails = async (patientId: string) => {
    setHistoriesLoading(true);
    setPrescriptionsLoading(true);
    try {
      // 1. Fetch histories
      const { data: histories, error: hError } = await supabase
        .from('clinical_histories')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (hError) throw hError;
      setPatientHistories(histories || []);

      // 2. Fetch prescriptions
      const { data: prescs, error: pError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          items:prescription_items(*)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (pError) throw pError;
      setPatientPrescriptions(prescs || []);
    } catch (err) {
      console.error('Error fetching patient clinical details:', err);
    } finally {
      setHistoriesLoading(false);
      setPrescriptionsLoading(false);
    }
  };

  const handleAnalyzeEvolution = async () => {
    if (!selectedPatient) return;
    setAiAnalyzing(true);
    setPatientAiResult(null);
    try {
      if (patientHistories.length === 0) {
        showNotification('Nenhum histórico clínico encontrado para este paciente.', 'error');
        setAiAnalyzing(false);
        return;
      }
      const result = await geminiService.analyzePatientEvolution(patientHistories, {
        profile: selectedPatient,
        prescriptions: patientPrescriptions,
        privateNotes: privateNotes
      });
      setPatientAiResult(result);
    } catch (error: any) {
      console.error('Error analyzing evolution:', error);
      showNotification(error.message || 'Erro ao analisar evolução do paciente.', 'error');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSavePrivateNotes = () => {
    if (!selectedPatient) return;
    setIsSavingNotes(true);
    try {
      localStorage.setItem(`patient_notes_${selectedPatient.id}`, privateNotes);
      showNotification('Notas guardadas com sucesso!', 'success');
    } catch (err) {
      console.error('Error saving notes:', err);
      showNotification('Erro ao guardar notas.', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };
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
    if (user && (profile?.is_professional || isAdmin)) {
      fetchData();
    }
  }, [user, profile, isAdmin]);

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
      let svcsQuery = supabase.from('wellness_services').select('*');
      if (!isAdmin) {
        svcsQuery = svcsQuery.eq('provider_id', user.id);
      }
      const { data: svcs } = await svcsQuery;
      if (svcs) setServices(svcs);

      // 2. Fetch Bookings
      const { data: bks } = await supabase
        .from('bookings')
        .select('*, service:service_id(*), patient:user_id(*)')
        .order('scheduled_at', { ascending: false });
      
      if (bks) {
        const filtered = bks.filter(b => isAdmin || b.service?.provider_id === user.id);
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
      let prodsQuery = supabase.from('products').select('*');
      if (!isAdmin) {
        prodsQuery = prodsQuery.eq('seller_id', user.id);
      }
      const { data: prods } = await prodsQuery;
      if (prods) setProducts(prods);

      // 4. Fetch Sales (Orders)
      const { data: ords } = await supabase
        .from('product_orders')
        .select('*, product:product_id(*), buyer:buyer_id(*)')
        .order('created_at', { ascending: false });
      
      if (ords) {
        const filteredOrds = ords.filter(o => isAdmin || o.product?.seller_id === user.id);
        setOrders(filteredOrds);
      }

      // 5. Fetch Pharmacy Prescription Submissions
      // Use user.email for immediate detection if profile is not yet loaded
      console.log('[Dashboard DEBUG] user.email:', user?.email, 'isAdmin:', isAdmin);
      
      let pharmaciesQuery = supabase.from('pharmacies').select('*');
      if (!isAdmin) {
        pharmaciesQuery = pharmaciesQuery.eq('owner_id', user.id);
      }
      
      const { data: myPharms, error: pharmsError } = await pharmaciesQuery;
      
      if (pharmsError) console.error('[Dashboard DEBUG] Error fetching pharmacies:', pharmsError);
      console.log('[Dashboard DEBUG] Pharmacies count:', myPharms?.length);
      
      if (myPharms) {
        setMyPharmacies(myPharms);
        
        // If Admin, fetch ALL orders. If not, only for my pharmacies.
        let ordersQuery = supabase
          .from('pharmacy_orders')
          .select(`
            *,
            user:profiles(full_name, username),
            pharmacy:pharmacies(name)
          `)
          .order('created_at', { ascending: false });

        if (!isAdmin && myPharms.length > 0) {
          const pharmIds = myPharms.map(p => p.id);
          ordersQuery = ordersQuery.in('pharmacy_id', pharmIds);
        } else if (!isAdmin && myPharms.length === 0) {
          // If not admin and has no pharmacies, no orders to show
          setPharmacyOrders([]);
          return;
        }

        const { data: ords, error: ordsError } = await ordersQuery;
          
        if (ordsError) console.error('[Dashboard DEBUG] Error fetching pharmacy orders:', ordsError);
        console.log('[Dashboard DEBUG] Pharmacy Orders count:', ords?.length);
        
        // Final fallback: try fetching absolute raw count without any joins or filters if count was 0
        if (!ords || ords.length === 0) {
          const { count, error: countError } = await supabase
            .from('pharmacy_orders')
            .select('*', { count: 'exact', head: true });
          console.log('[Dashboard DEBUG] RAW TOTAL COUNT in pharmacy_orders table:', count, 'Error:', countError);
        }

        if (ords) {
           setPharmacyOrders(ords);
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

  const handleDeleteService = async (serviceId: string) => {
    console.log('[ProfessionalDashboard] handleDeleteService initiating for ID:', serviceId);
    if (!confirm('Tem certeza que deseja eliminar este serviço permanentemente?')) {
      console.log('[ProfessionalDashboard] Delete canceled');
      return;
    }
    
    setProcessingId(serviceId);
    try {
      console.log('[ProfessionalDashboard] Calling Supabase delete for wellness_services...');
      const { data, error, status } = await supabase
        .from('wellness_services')
        .delete()
        .eq('id', serviceId)
        .select();

      console.log('[ProfessionalDashboard] Supabase response:', { data, error, status });

      if (error) {
        console.error('[ProfessionalDashboard] Error deleting service:', error);
        showNotification('Erro ao eliminar serviço: ' + error.message, 'error');
      } else {
        console.log('[ProfessionalDashboard] Service deleted successfully');
        showNotification('✅ Serviço eliminado com sucesso!');
        await fetchData();
      }
    } catch (err: any) {
      console.error('[ProfessionalDashboard] Exception in handleDeleteService:', err);
      showNotification('Erro inesperado: ' + err.message, 'error');
    } finally {
      console.log('[ProfessionalDashboard] handleDeleteService finished');
      setProcessingId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    console.log('[ProfessionalDashboard] handleDeleteProduct initiating for ID:', productId);
    if (!confirm('Tem certeza que deseja eliminar este produto permanentemente?')) {
      console.log('[ProfessionalDashboard] Delete canceled');
      return;
    }
    
    setProcessingId(productId);
    try {
      console.log('[ProfessionalDashboard] Calling Supabase delete for products...');
      const { data, error, status } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .select();

      console.log('[ProfessionalDashboard] Supabase response:', { data, error, status });

      if (error) {
        console.error('[ProfessionalDashboard] Error deleting product:', error);
        showNotification('Erro ao eliminar produto: ' + error.message, 'error');
      } else {
        console.log('[ProfessionalDashboard] Product deleted successfully');
        showNotification('✅ Produto eliminado com sucesso!');
        await fetchData();
      }
    } catch (err: any) {
      console.error('[ProfessionalDashboard] Exception in handleDeleteProduct:', err);
      showNotification('Erro inesperado: ' + err.message, 'error');
    } finally {
      console.log('[ProfessionalDashboard] handleDeleteProduct finished');
      setProcessingId(null);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);
    
    if (!error) fetchData();
  };

  if (!profile?.is_professional && !isAdmin) {
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
        {activeTab === 'overview' && (
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
        )}

        {/* Secondary Navigation is now handled by the professional sidebar */}

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
                                                <p className="text-[10px] text-gray-400 font-bold">{order.items?.length || 0} Items • {order.total_price?.toLocaleString('pt-PT')}€</p>
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
                                    <div className={`absolute top-0 right-0 p-4 transition-opacity flex items-center space-x-2 ${isAdmin ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <button 
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              handleDeleteService(svc.id);
                                            }}
                                            disabled={processingId === svc.id}
                                            className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-50"
                                            title="Eliminar Serviço"
                                        >
                                            {processingId === svc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                        </button>
                                        <button className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-gray-400 hover:text-gray-900 transition-all shadow-sm">
                                            <MoreVertical className="w-4 h-4" />
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
                            <div className="p-8 border-b border-gray-50 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <h3 className="font-black text-gray-900 uppercase tracking-tight">Gestão de Agendamentos</h3>
                                <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                                    <button
                                        onClick={() => setBookingTab('pendentes')}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap",
                                            bookingTab === 'pendentes'
                                                ? "bg-white text-orange-600 shadow-sm shadow-orange-900/5 ring-1 ring-orange-100"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        Pendentes ({pendingBookings.length})
                                    </button>
                                    <button
                                        onClick={() => setBookingTab('confirmados')}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap",
                                            bookingTab === 'confirmados'
                                                ? "bg-white text-emerald-600 shadow-sm shadow-emerald-900/5 ring-1 ring-emerald-100"
                                                : "text-gray-400 hover:text-gray-600"
                                        )}
                                    >
                                        Confirmados ({bookings.filter(b => b.status === 'confirmado' || b.status === 'concluído').length})
                                    </button>
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
                                        {(() => {
                                            const filteredBookings = bookings.filter(b => {
                                                if (bookingTab === 'pendentes') {
                                                    return b.status === 'pendente';
                                                } else {
                                                    return b.status === 'confirmado' || b.status === 'concluído';
                                                }
                                            });

                                            if (filteredBookings.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={5} className="px-8 py-16 text-center">
                                                            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                                            <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest">Sem Agendamentos</h5>
                                                            <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">Nenhum agendamento {bookingTab === 'pendentes' ? 'pendente' : 'confirmado'} encontrado.</p>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return filteredBookings.map(bk => (
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
                                                                <button onClick={() => handleUpdateBookingStatus(bk.id, 'confirmado')} className="p-2 bg-emerald-50 text-[#006747] rounded-lg hover:bg-[#006747] hover:text-white transition-all shadow-sm cursor-pointer">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => handleUpdateBookingStatus(bk.id, 'cancelado')} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm cursor-pointer">
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
                                            ));
                                        })()}
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
                                        <div className="flex items-center space-x-3">
                                            <button className="text-[9px] font-black text-gray-400 uppercase hover:text-gray-900 transition-colors">Editar</button>
                                            <button 
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleDeleteProduct(prod.id);
                                                }}
                                                disabled={processingId === prod.id}
                                                className="text-[9px] font-black text-red-400 uppercase hover:text-red-600 transition-colors disabled:opacity-50"
                                            >
                                                {processingId === prod.id ? 'Eliminando...' : 'Eliminar'}
                                            </button>
                                        </div>
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
                                                                <div className="flex items-center space-x-2">
                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Código: {sub.prescription_code}</p>
                                                                    <button 
                                                                        onClick={() => {
                                                                            if (sub.prescription_code) {
                                                                                navigator.clipboard.writeText(sub.prescription_code);
                                                                                const btn = document.getElementById(`copy-btn-${sub.id}`);
                                                                                if (btn) btn.classList.add('text-emerald-500');
                                                                                setTimeout(() => {
                                                                                    if (btn) btn.classList.remove('text-emerald-500');
                                                                                }, 2000);
                                                                            }
                                                                        }}
                                                                        id={`copy-btn-${sub.id}`}
                                                                        className="text-gray-300 hover:text-[#006747] transition-all"
                                                                        title="Copiar código"
                                                                    >
                                                                        <Copy className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-xs font-black text-[#006747] uppercase leading-tight">{sub.pharmacy?.name}</p>
                                                        <p className="text-[9px] font-bold text-gray-400">Total: {sub.total_price?.toLocaleString('pt-PT')}€</p>
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
                    selectedPatient ? (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center space-x-4">
                                    <Link to={`/perfil/${selectedPatient.id}`} className="w-16 h-16 bg-gray-100 rounded-3xl overflow-hidden shadow-md border-2 border-white relative hover:scale-105 transition-transform block">
                                        {sanitizeAvatarUrl(selectedPatient.avatar_url) ? (
                                            <img src={sanitizeAvatarUrl(selectedPatient.avatar_url)!} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <CircleUser className="w-full h-full text-black stroke-[1.5px] p-3" />
                                        )}
                                    </Link>
                                    <div>
                                        <Link to={`/perfil/${selectedPatient.id}`} className="hover:text-[#006747] transition-colors block">
                                            <h3 className="text-2xl font-black text-gray-900 leading-none mb-1">
                                                {selectedPatient.full_name || selectedPatient.username}
                                            </h3>
                                        </Link>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            @{selectedPatient.username} • Paciente desde {new Date(selectedPatient.created_at || Date.now()).toLocaleDateString('pt-PT')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 self-end md:self-auto">
                                    <button 
                                        onClick={() => {
                                            setSelectedPatient(null);
                                            setActiveTab('patients');
                                        }} 
                                        className="flex items-center space-x-2 px-5 py-3 bg-white hover:bg-gray-50 text-gray-700 hover:text-black rounded-2xl border border-gray-100 shadow-sm transition-all cursor-pointer font-black text-[10px] uppercase tracking-widest"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-[#006747]" />
                                        <span>Voltar aos Meus Pacientes</span>
                                    </button>
                                </div>
                            </div>

                            {/* Subtabs Navigation */}
                            <div className="bg-white/40 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-100 flex items-center space-x-1 overflow-x-auto no-scrollbar w-fit">
                                <button
                                    onClick={() => setPatientTab('history')}
                                    className={cn(
                                        "flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                                        patientTab === 'history' 
                                            ? "bg-[#006747] text-white shadow-md shadow-emerald-900/10" 
                                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    )}
                                >
                                    <History className="w-4 h-4" />
                                    <span>Painel</span>
                                    {patientHistories.length > 0 && (
                                        <span className={cn(
                                            "ml-1.5 px-2 py-0.5 rounded-md text-[8px]",
                                            patientTab === 'history' ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                        )}>
                                            {patientHistories.length}
                                        </span>
                                    )}
                                </button>
                                
                                <button
                                    onClick={() => setPatientTab('evolution')}
                                    className={cn(
                                        "flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                                        patientTab === 'evolution' 
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-900/10" 
                                            : "text-gray-400 hover:text-blue-600 hover:bg-blue-50/50"
                                    )}
                                >
                                    <LineChartIcon className="w-4 h-4" />
                                    <span>Evolução</span>
                                </button>

                                <button
                                    onClick={() => setPatientTab('alerts')}
                                    className={cn(
                                        "flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                                        patientTab === 'alerts' 
                                            ? "bg-red-600 text-white shadow-md shadow-red-900/10" 
                                            : "text-gray-400 hover:text-red-600 hover:bg-red-50/50"
                                    )}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Alertas</span>
                                    {getSmartAlerts().filter(a => a.severity === 'critical' || a.severity === 'warning').length > 0 && (
                                        <span className={cn(
                                            "ml-1.5 px-2 py-0.5 rounded-md text-[8px]",
                                            patientTab === 'alerts' ? "bg-white/20 text-white" : "bg-red-100 text-red-600"
                                        )}>
                                            {getSmartAlerts().filter(a => a.severity === 'critical' || a.severity === 'warning').length}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setPatientTab('ai')}
                                    className={cn(
                                        "flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                                        patientTab === 'ai' 
                                            ? "bg-purple-600 text-white shadow-md shadow-purple-900/10" 
                                            : "text-gray-400 hover:text-purple-600 hover:bg-purple-50/50"
                                    )}
                                >
                                    <Brain className="w-4 h-4" />
                                    <span>Análise IA</span>
                                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                                </button>

                                <button
                                    onClick={() => setPatientTab('medications')}
                                    className={cn(
                                        "flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                                        patientTab === 'medications' 
                                            ? "bg-rose-600 text-white shadow-md shadow-rose-900/10" 
                                            : "text-gray-400 hover:text-rose-600 hover:bg-rose-50/50"
                                    )}
                                >
                                    <Activity className="w-4 h-4" />
                                    <span>Medicações</span>
                                </button>

                                <button
                                    onClick={() => setPatientTab('prescriptions')}
                                    className={cn(
                                        "flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                                        patientTab === 'prescriptions' 
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-900/10" 
                                             : "text-gray-400 hover:text-blue-600 hover:bg-blue-50/50"
                                    )}
                                >
                                    <Pill className="w-4 h-4" />
                                    <span>Receitas (e mais)</span>
                                    {patientPrescriptions.length > 0 && (
                                         <span className={cn(
                                             "ml-1.5 px-2 py-0.5 rounded-md text-[8px]",
                                             patientTab === 'prescriptions' ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                         )}>
                                             {patientPrescriptions.length}
                                         </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setPatientTab('notes')}
                                    className={cn(
                                        "flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                                        patientTab === 'notes' 
                                            ? "bg-amber-600 text-white shadow-md shadow-amber-900/10" 
                                            : "text-gray-400 hover:text-amber-600 hover:bg-amber-50/50"
                                    )}
                                >
                                    <FileText className="w-4 h-4" />
                                    <span>Notas Clínicas</span>
                                </button>
                            </div>

                            {/* Subtabs Body */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                {patientTab === 'history' && (
                                    <div className="space-y-8 animate-in fade-in duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                            {/* Coluna da Esquerda: Evolução Clínico-Terapêutica IA */}
                                            <div className="lg:col-span-5 space-y-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100/85">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <div className="p-2.5 bg-purple-50 rounded-2xl text-purple-600">
                                                        <Brain className="w-5 h-5 animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-gray-950 uppercase tracking-widest">Evolução do Paciente</h4>
                                                        <p className="text-[10px] text-purple-600 font-extrabold uppercase tracking-wider">Médico de Família IA (80+ Anos Exp.)</p>
                                                    </div>
                                                </div>

                                                {/* Biopsicossocial Identification Card */}
                                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                                    <h5 className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center">
                                                        <CircleUser className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                                        Perfil Biopsicossocial & Familiar
                                                    </h5>
                                                    <div className="grid grid-cols-2 gap-3.5 text-left">
                                                        <div className="p-2 bg-gray-50/75 rounded-xl">
                                                            <p className="text-[7px] font-black text-gray-400 uppercase">Idade & Sexo</p>
                                                            <p className="text-[11px] font-black text-gray-850">
                                                                {patientHistories[0]?.year || 'Não informada'} • {patientHistories[0]?.gender || 'Não especificado'}
                                                            </p>
                                                        </div>
                                                        <div className="p-2 bg-gray-50/75 rounded-xl">
                                                            <p className="text-[7px] font-black text-gray-400 uppercase">Contacto</p>
                                                            <p className="text-[11px] font-bold text-gray-800">
                                                                {patientHistories[0]?.contact || 'Não informado'}
                                                            </p>
                                                        </div>
                                                        <div className="p-2 bg-gray-50/75 rounded-xl col-span-2">
                                                            <p className="text-[7px] font-black text-gray-400 uppercase">Residência / Região</p>
                                                            <p className="text-[11px] font-bold text-gray-800 flex items-center">
                                                                <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                                                {patientHistories[0]?.address || 'Não especificada'}
                                                            </p>
                                                        </div>
                                                        <div className="p-2 bg-gray-50/75 rounded-xl">
                                                            <p className="text-[7px] font-black text-gray-400 uppercase">Profissão</p>
                                                            <p className="text-[11px] font-bold text-gray-800 truncate">
                                                                {patientHistories[0]?.profession || 'Não informada'}
                                                            </p>
                                                        </div>
                                                        <div className="p-2 bg-gray-50/75 rounded-xl">
                                                            <p className="text-[7px] font-black text-gray-400 uppercase">Estado Civil</p>
                                                            <p className="text-[11px] font-bold text-gray-800">
                                                                {patientHistories[0]?.marital_status || patientHistories[0]?.maritalStatus || 'Não informado'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action / Trigger */}
                                                {!patientAiResult && !aiAnalyzing && (
                                                    <div className="bg-purple-50/30 border border-purple-100 p-5 rounded-2xl text-center space-y-4">
                                                        <Sparkles className="w-7 h-7 text-purple-400 mx-auto animate-bounce" />
                                                        <div>
                                                            <p className="text-[11px] text-purple-950 font-black uppercase tracking-wider">Acompanhamento Evolutivo Ativo</p>
                                                            <p className="text-[10px] text-gray-500 mt-1 max-w-xs mx-auto">
                                                                Relacione de forma sistêmica as anamneses, sinais vitais, hábitos, alergias e receitas para traçar o plano evolutivo biopsicossocial do paciente.
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={handleAnalyzeEvolution}
                                                            className="w-full flex items-center justify-center space-x-2 bg-purple-950 hover:bg-purple-900 text-white py-3 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-purple-900/10 cursor-pointer animate-in fade-in"
                                                        >
                                                            <Brain className="w-4 h-4" />
                                                            <span>Analisar Evolução do Paciente</span>
                                                        </button>
                                                    </div>
                                                )}

                                                {aiAnalyzing && (
                                                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-center space-y-4">
                                                        <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                                                        <div>
                                                            <p className="text-xs font-black text-purple-950 uppercase tracking-widest animate-pulse">Cruzando dados de saúde do paciente...</p>
                                                            <p className="text-[10px] text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
                                                                O Copiloto Familiar está a correlacionar anamneses antigas, dosagens de medicamentos, relatos de queixas e especificidades regionais para formular o parecer.
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {patientAiResult && !aiAnalyzing && (
                                                    <div className="space-y-5 animate-in fade-in duration-500">
                                                        {/* Re-analyze Button */}
                                                        <button
                                                            onClick={handleAnalyzeEvolution}
                                                            className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 text-purple-950 py-2.5 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border border-purple-100 shadow-sm transition-all cursor-pointer"
                                                        >
                                                            <Brain className="w-3.5 h-3.5" />
                                                            <span>Reanalisar Evolução Clínica</span>
                                                        </button>

                                                        {/* 1. Summary/Parecer */}
                                                        <div className="bg-gradient-to-br from-purple-950 to-indigo-900 text-white p-5 rounded-2xl shadow-md space-y-2">
                                                            <h5 className="text-[8px] font-black text-purple-300 uppercase tracking-widest">Parecer Evolutivo do Médico de Família</h5>
                                                            <p className="text-[11px] leading-relaxed text-purple-50/95 font-medium whitespace-pre-wrap italic">
                                                                "{patientAiResult.summary}"
                                                            </p>
                                                        </div>

                                                        {/* 2. Recommendations / Plan of Care / Medications Adjustment / Cancellations */}
                                                        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                                                            <div>
                                                                <h5 className="text-[9px] font-black text-[#006747] uppercase tracking-widest">Plano de Cuidado & Alertas Farmacológicos</h5>
                                                                <p className="text-[8px] text-gray-400 mt-0.5">Orientações, suspensões ou desprescrições baseadas nos dados históricos</p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {patientAiResult.recommendations?.map((rec, idx) => {
                                                                    const isCancellation = /cancelamento|cancelar|suspender|parar|interromper|despresc|descontinuar|retirar|evitar|atent/i.test(rec);
                                                                    return (
                                                                        <div 
                                                                            key={idx} 
                                                                            className={cn(
                                                                                "p-3 rounded-xl border flex items-start space-x-2.5 text-left text-[11px]",
                                                                                isCancellation 
                                                                                    ? "bg-red-50/50 border-red-100 text-red-950" 
                                                                                    : "bg-emerald-50/20 border-emerald-50/50 text-gray-800"
                                                                            )}
                                                                        >
                                                                            {isCancellation ? (
                                                                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                                                            ) : (
                                                                                <Check className="w-4 h-4 text-[#006747] shrink-0 mt-0.5" />
                                                                            )}
                                                                            <div className="space-y-0.5">
                                                                                {isCancellation && (
                                                                                    <span className="inline-block text-[7px] font-black uppercase tracking-widest bg-red-100 text-red-700 px-1.5 py-0.5 rounded mb-1">
                                                                                        Cancelamento / Atenção
                                                                                    </span>
                                                                                )}
                                                                                <p className="leading-relaxed font-medium">{rec}</p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* 3. Patterns & Trends */}
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                                                                <h5 className="text-[9px] font-black text-purple-950 uppercase tracking-widest flex items-center">
                                                                    <Activity className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
                                                                    Padrões Identificados
                                                                </h5>
                                                                <ul className="space-y-1.5 text-left text-[11px] text-gray-700">
                                                                    {patientAiResult.patterns?.map((pat, idx) => (
                                                                        <li key={idx} className="flex items-start space-x-2">
                                                                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full shrink-0 mt-1.5" />
                                                                            <span className="leading-tight">{pat}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>

                                                            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-3">
                                                                <h5 className="text-[9px] font-black text-blue-950 uppercase tracking-widest flex items-center">
                                                                    <TrendingUp className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                                                                    Tendências Clínicas
                                                                </h5>
                                                                <ul className="space-y-1.5 text-left text-[11px] text-gray-700">
                                                                    {patientAiResult.trends?.map((trend, idx) => (
                                                                        <li key={idx} className="flex items-start space-x-2">
                                                                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full shrink-0 mt-1.5" />
                                                                            <span className="leading-tight">{trend}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        {/* 4. Active Medications & Suggested Exams */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                                                                <h5 className="text-[8px] font-black text-rose-600 uppercase tracking-widest flex items-center">
                                                                    <Pill className="w-3 h-3 mr-1" />
                                                                    Medicamentos
                                                                </h5>
                                                                <div className="space-y-1 text-left">
                                                                    {patientAiResult.lastMedications?.length > 0 ? (
                                                                        patientAiResult.lastMedications.map((med, idx) => (
                                                                            <p key={idx} className="text-[10px] font-bold text-gray-700 leading-tight bg-rose-50/30 p-1.5 rounded-lg border border-rose-50/50 truncate" title={med}>
                                                                                {med}
                                                                            </p>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-[10px] text-gray-400 italic">Nenhum registado</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
                                                                <h5 className="text-[8px] font-black text-emerald-600 uppercase tracking-widest flex items-center">
                                                                    <FileText className="w-3 h-3 mr-1" />
                                                                    Exames Alvo
                                                                </h5>
                                                                <div className="space-y-1 text-left">
                                                                    {patientAiResult.lastExams?.length > 0 ? (
                                                                        patientAiResult.lastExams.map((ex, idx) => (
                                                                            <p key={idx} className="text-[10px] font-bold text-gray-700 leading-tight bg-emerald-50/30 p-1.5 rounded-lg border border-emerald-50/50 truncate" title={ex}>
                                                                                {ex}
                                                                            </p>
                                                                        ))
                                                                    ) : (
                                                                        <p className="text-[10px] text-gray-400 italic">Nenhum registado</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Coluna da Direita: Historial de Consultas */}
                                            <div className="lg:col-span-7 space-y-6">
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                    <div>
                                                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest text-left">Consultas e Historial Médico</h4>
                                                        <p className="text-xs text-gray-400 mt-1 text-left">Registos de consultas e anamneses anteriores</p>
                                                    </div>
                                                    <Link
                                                        to={`/professional/clinical-history/${selectedPatient.id}`}
                                                        className="flex items-center justify-center space-x-2 bg-[#006747] text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md shadow-emerald-900/10 cursor-pointer"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        <span>Nova Consulta</span>
                                                    </Link>
                                                </div>

                                                {historiesLoading ? (
                                                    <div className="space-y-4">
                                                        {[1, 2].map(i => (
                                                            <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                                                <Skeleton className="h-5 w-1/4" />
                                                                <Skeleton className="h-4 w-1/2" />
                                                                <Skeleton className="h-12 w-full" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : patientHistories.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {patientHistories.map((history) => {
                                                            const isExpanded = !!expandedHistories[history.id];
                                                            return (
                                                                <div 
                                                                    key={history.id} 
                                                                    className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:border-[#006747]/20 transition-all group text-left"
                                                                >
                                                                    <div className="flex items-start justify-between mb-4">
                                                                        <div className="flex items-center space-x-4">
                                                                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006747] group-hover:scale-110 transition-all">
                                                                                <ClipboardList className="w-6 h-6" />
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="font-black text-gray-900 text-base leading-none mb-1.5">{history.primary_diagnosis || 'Diagnóstico Geral'}</h4>
                                                                                
                                                                                {history.prescription_code && (
                                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                                        <Pill className="w-3 h-3 text-[#FF4500]" />
                                                                                        <span className="text-[10px] font-black text-[#FF4500] uppercase tracking-widest bg-[#FF4500]/5 px-2 py-0.5 rounded-full">
                                                                                            Receita: {history.prescription_code}
                                                                                        </span>
                                                                                    </div>
                                                                                )}

                                                                                {/* Collapsed Patient Identification Header Row */}
                                                                                <div className="flex flex-wrap gap-1.5 mb-2.5">
                                                                                    <span className="bg-gray-100 text-gray-700 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                                                                                        Paciente: {history.full_name || history.fullName || selectedPatient.full_name}
                                                                                    </span>
                                                                                    <span className="bg-gray-100 text-gray-700 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                                                                                        Idade: {history.year || 'Não informada'}
                                                                                    </span>
                                                                                    <span className="bg-gray-100 text-gray-700 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                                                                                        Contacto: {history.contact || 'Não informado'}
                                                                                    </span>
                                                                                    <span className="bg-gray-100 text-gray-700 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                                                                                        Morada: {history.address || 'Não informada'}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex items-center space-x-3 text-gray-400">
                                                                                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center">
                                                                                        <Calendar className="w-3 h-3 mr-1.5" />
                                                                                        {new Date(history.created_at).toLocaleDateString('pt-PT')}
                                                                                    </p>
                                                                                    <span className="text-[8px] opacity-20">•</span>
                                                                                    <p className="text-[10px] font-black uppercase tracking-widest flex items-center italic">
                                                                                        Por: {history.professional_name || 'Profissional'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <div className={cn(
                                                                                "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest",
                                                                                (history.referral === 'Sem referenciação' || !history.referral) ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"
                                                                            )}>
                                                                                {history.referral || 'Geral'}
                                                                            </div>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    setExpandedHistories(prev => ({
                                                                                        ...prev,
                                                                                        [history.id]: !prev[history.id]
                                                                                    }));
                                                                                }}
                                                                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-black"
                                                                            >
                                                                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                                        <div className="p-3 bg-gray-50 rounded-2xl">
                                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">IMC</p>
                                                                            <p className="text-xs font-black text-[#006747]">{history.calculated_imc || history.imc || '-'}</p>
                                                                        </div>
                                                                        <div className="p-3 bg-gray-50 rounded-2xl">
                                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Temp</p>
                                                                            <p className="text-xs font-black text-gray-900">{history.temperature ? `${history.temperature}°C` : '-'}</p>
                                                                        </div>
                                                                        <div className="p-3 bg-gray-50 rounded-2xl">
                                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">T. Arterial</p>
                                                                            <p className="text-xs font-black text-gray-900">{history.bloodPressure || history.blood_pressure || '-'}</p>
                                                                        </div>
                                                                        <div className="p-3 bg-gray-50 rounded-2xl">
                                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">SpO2</p>
                                                                            <p className="text-xs font-black text-[#006747]">{history.spo2 ? `${history.spo2}%` : '-'}</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-3">
                                                                        <div>
                                                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Queixa Principal</p>
                                                                            <p className="text-xs text-gray-600 line-clamp-2">{history.mainComplaint || history.main_complaint || 'Nenhuma queixa descrita'}</p>
                                                                        </div>
                                                                        
                                                                        {isExpanded && (
                                                                            <div className="pt-6 space-y-6 border-t border-gray-100 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                                                                {/* Section 1: Detailed Physical Exam */}
                                                                                <div>
                                                                                    {/* Section 0: Identificação */}
                                                                                    <div className="mb-6">
                                                                                        <h5 className="text-[8px] font-black text-[#006747] uppercase tracking-[0.2em] mb-4">Identificação do Paciente</h5>
                                                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Nome Completo</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.full_name || history.fullName || '-'}</p>
                                                                                            </div>
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Idade</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.year || '-'}</p>
                                                                                            </div>
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Género</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.gender || '-'}</p>
                                                                                            </div>
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Nº Identificação</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.id_number || history.idNumber || '-'}</p>
                                                                                            </div>
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Contacto</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.contact || '-'}</p>
                                                                                            </div>
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Profissão</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.profession || '-'}</p>
                                                                                            </div>
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Estado Civil</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.marital_status || history.maritalStatus || '-'}</p>
                                                                                            </div>
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Morada</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.address || '-'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    {/* Section 0.5: Caracterização dos Sintomas */}
                                                                                    <div className="mb-6">
                                                                                        <h5 className="text-[8px] font-black text-[#006747] uppercase tracking-[0.2em] mb-4">Caracterização dos Sintomas</h5>
                                                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Início dos Sintomas</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.symptoms_start_date || history.symptomsStartDate || '-'}</p>
                                                                                            </div>
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Duração</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.duration || '-'}</p>
                                                                                            </div>
                                                                                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Intensidade da Dor</p>
                                                                                                <p className="text-xs font-black text-gray-800">{history.pain_intensity ? `${history.pain_intensity}/10` : '-'}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    <h5 className="text-[8px] font-black text-[#006747] uppercase tracking-[0.2em] mb-4">Exame Físico Detalhado</h5>
                                                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                                                        <div className="p-3 bg-emerald-50/30 rounded-2xl border border-emerald-50">
                                                                                            <p className="text-[8px] font-black text-emerald-600/70 uppercase mb-1">Peso / Altura</p>
                                                                                            <p className="text-[11px] font-bold text-gray-700">{history.weight ? `${history.weight}kg` : '-'} / {history.height ? `${history.height}m` : '-'}</p>
                                                                                        </div>
                                                                                        <div className="p-3 bg-emerald-50/30 rounded-2xl border border-emerald-50">
                                                                                            <p className="text-[8px] font-black text-emerald-600/70 uppercase mb-1">Frequência</p>
                                                                                            <p className="text-[11px] font-bold text-gray-700">{(history.heart_rate || history.heartRate) ? `${history.heart_rate || history.heartRate} bpm` : '-'} / {(history.respiratory_rate || history.respiratoryRate) ? `${history.respiratory_rate || history.respiratoryRate} rpm` : '-'}</p>
                                                                                        </div>
                                                                                        <div className="p-3 bg-emerald-50/30 rounded-2xl border border-emerald-50 col-span-2 md:col-span-1">
                                                                                            <p className="text-[8px] font-black text-emerald-600/70 uppercase mb-1">Duração Sintomas</p>
                                                                                            <p className="text-[11px] font-bold text-gray-700">{history.duration || '-'}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    {history.physical_exam_observations && (
                                                                                        <div className="mt-3 p-4 bg-gray-50 rounded-2xl">
                                                                                            <p className="text-[8px] font-black text-gray-400 uppercase mb-1.5 ml-1">Observações do Exame</p>
                                                                                            <p className="text-[11px] text-gray-600 leading-relaxed">{history.physical_exam_observations}</p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                {/* Section 2: Clinical Details */}
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                                    <div className="space-y-4">
                                                                                        <h5 className="text-[8px] font-black text-[#006747] uppercase tracking-[0.2em]">Antecedentes & Hábitos</h5>
                                                                                        <div className="space-y-3">
                                                                                            {[
                                                                                                { label: 'Doenças Prévias', val: history.previous_diseases },
                                                                                                { label: 'Cirurgias', val: history.surgeries_history },
                                                                                                { label: 'Alergias', val: history.allergies },
                                                                                                { label: 'Estado Vacinal', val: history.vaccination_status || history.vaccinationStatus },
                                                                                                { label: 'Medicação Habitual', val: history.habitual_medication },
                                                                                                { label: 'Histórico Familiar', val: history.hereditary_diseases }
                                                                                            ].map((item, idx) => item.val && (
                                                                                                <div key={idx} className="bg-gray-50 p-3 rounded-xl">
                                                                                                    <p className="text-[7px] font-black text-gray-400 uppercase mb-1">{item.label}</p>
                                                                                                    <p className="text-[10px] text-gray-700 leading-tight">{item.val}</p>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                        <div className="flex space-x-2">
                                                                                            {history.smoking_habits && (
                                                                                                <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[8px] font-black uppercase rounded-lg border border-amber-100">Fumador: {history.smoking_habits}</span>
                                                                                            )}
                                                                                            {history.alcohol_consumption && (
                                                                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[8px] font-black uppercase rounded-lg border border-blue-100">Álcool: {history.alcohol_consumption}</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="space-y-4">
                                                                                        <h5 className="text-[8px] font-black text-[#006747] uppercase tracking-[0.2em]">Diagnóstico & Plano</h5>
                                                                                        <div className="space-y-3">
                                                                                            {history.secondary_diagnosis && (
                                                                                                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                                                                                                    <p className="text-[7px] font-black text-emerald-600 uppercase mb-1">Diagnóstico Secundário</p>
                                                                                                    <p className="text-[10px] text-gray-700 font-medium">{history.secondary_diagnosis}</p>
                                                                                                </div>
                                                                                            )}
                                                                                            {history.requested_exams && (
                                                                                                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                                                                                    <p className="text-[7px] font-black text-blue-600 uppercase mb-1">Exames Solicitados</p>
                                                                                                    <p className="text-[10px] text-gray-700 whitespace-pre-wrap">{history.requested_exams}</p>
                                                                                                </div>
                                                                                            )}
                                                                                            {history.next_appointment_date && (
                                                                                                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                                                                                                    <p className="text-[7px] font-black text-indigo-600 uppercase mb-1">Próxima Consulta</p>
                                                                                                    <p className="text-[10px] text-gray-700 font-black">{new Date(history.next_appointment_date).toLocaleDateString('pt-PT')}</p>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Section 3: Notes */}
                                                                                <div>
                                                                                    <p className="text-[8px] font-black text-[#006747] uppercase tracking-[0.2em] mb-2">Descrição Detalhada & Conduta</p>
                                                                                    <div className="bg-gray-50 p-5 rounded-[2rem] border border-gray-100">
                                                                                        <p className="text-[11px] text-gray-600 whitespace-pre-wrap leading-relaxed">
                                                                                            {history.clinicalNotes || history.clinical_notes || 'Sem observações clínicas.'}
                                                                                        </p>
                                                                                        {(history.detailedDescription || history.detailed_description) && (
                                                                                            <div className="mt-4 pt-4 border-t border-gray-200/50">
                                                                                                <p className="text-[7px] font-black text-gray-400 uppercase mb-2">Desenvolvimento do Caso</p>
                                                                                                <p className="text-[11px] text-gray-600 leading-relaxed italic">
                                                                                                    {history.detailedDescription || history.detailed_description}
                                                                                                </p>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="py-16 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-8">
                                                        <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                        <p className="font-black text-gray-500 uppercase text-xs tracking-widest">Sem Histórico Clínico</p>
                                                        <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto mb-6">Este paciente ainda não possui anamneses ou registos de consultas clínicas.</p>
                                                        <Link
                                                            to={`/professional/clinical-history/${selectedPatient.id}`}
                                                            className="inline-flex items-center space-x-2 bg-[#006747] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md cursor-pointer"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            <span>Iniciar Primeiro Registo</span>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {patientTab === 'ai' && (
                                    <AiCopilotDashboard
                                        selectedPatient={selectedPatient}
                                        patientHistories={patientHistories}
                                        patientPrescriptions={patientPrescriptions}
                                        privateNotes={privateNotes}
                                        showNotification={showNotification}
                                    />
                                )}

                                {patientTab === 'evolution' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Evolução de Parâmetros Clínicos</h4>
                                            <p className="text-xs text-gray-400 mt-0.5 font-semibold">Visualização gráfica do histórico de sinais vitais registados em consultas anteriores</p>
                                        </div>

                                        {patientHistories.length === 0 ? (
                                            <div className="py-20 text-center bg-gray-50 rounded-3xl">
                                                <LineChartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                                <p className="text-xs text-gray-400 font-semibold">Dados insuficientes para traçar gráficos de tendências temporais.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Blood pressure trend */}
                                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                                    <h5 className="font-black text-gray-900 text-xs uppercase tracking-wider border-b pb-2">Pressão Arterial (Sistólica/Diastólica)</h5>
                                                    <div className="h-[220px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={getEvolutionChartData()}>
                                                                <defs>
                                                                    <linearGradient id="sysColorProf" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                                                    </linearGradient>
                                                                    <linearGradient id="diaColorProf" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                                                                <YAxis stroke="#9ca3af" fontSize={10} domain={[40, 200]} />
                                                                <Tooltip />
                                                                <Area type="monotone" dataKey="sys" name="Sistólica" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#sysColorProf)" />
                                                                <Area type="monotone" dataKey="dia" name="Diastólica" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#diaColorProf)" />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>

                                                {/* Heart rate and Oxygen Sat */}
                                                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                                    <h5 className="font-black text-gray-900 text-xs uppercase tracking-wider border-b pb-2">Frequência Cardíaca (bpm) & Saturação (%)</h5>
                                                    <div className="h-[220px]">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={getEvolutionChartData()}>
                                                                <defs>
                                                                    <linearGradient id="spo2ColorProf" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                                                    </linearGradient>
                                                                    <linearGradient id="fcColorProf" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                                                                <YAxis stroke="#9ca3af" fontSize={10} domain={[40, 120]} />
                                                                <Tooltip />
                                                                <Area type="monotone" dataKey="spo2" name="Saturação SpO2 %" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#spo2ColorProf)" />
                                                                <Area type="monotone" dataKey="fc" name="Frequência Cardíaca" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#fcColorProf)" />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {patientTab === 'alerts' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div>
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Mapeamento de Alertas e Riscos Sistémicos</h4>
                                            <p className="text-xs text-gray-400 mt-0.5 font-semibold">Algoritmo clínico de varredura proativa em busca de sinais de degradação aguda</p>
                                        </div>

                                        <div className="space-y-3">
                                            {getSmartAlerts().map((alert, idx) => (
                                                <div key={idx} className={cn(
                                                    "p-5 rounded-3xl border flex items-start space-x-4",
                                                    alert.severity === 'critical' ? "bg-red-50/50 border-red-100" :
                                                    alert.severity === 'warning' ? "bg-amber-50/50 border-amber-100" :
                                                    "bg-gray-50 border-gray-100"
                                                )}>
                                                    <div className={cn(
                                                        "p-3 rounded-2xl flex items-center justify-center shrink-0",
                                                        alert.severity === 'critical' ? "bg-red-100 text-red-600" :
                                                        alert.severity === 'warning' ? "bg-amber-100 text-amber-600" :
                                                        "bg-blue-100 text-blue-600"
                                                    )}>
                                                        <AlertCircle className="w-5 h-5" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <h5 className={cn(
                                                                "font-black text-xs uppercase",
                                                                alert.severity === 'critical' ? "text-red-950" :
                                                                alert.severity === 'warning' ? "text-amber-950" :
                                                                "text-gray-950"
                                                            )}>{alert.title}</h5>
                                                            <span className="text-[8px] font-bold text-gray-400 uppercase font-mono">{alert.date}</span>
                                                        </div>
                                                        <p className="text-xs text-gray-600 leading-relaxed font-semibold">{alert.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {patientTab === 'prescriptions' && (
                                    <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                            <div>
                                                <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">Receitas Emitidas</h4>
                                                <p className="text-xs text-gray-400 mt-1">Lista de todas as prescrições médicas passadas</p>
                                            </div>
                                            <Link
                                                to={`/prescrever/${selectedPatient.id}`}
                                                className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md shadow-blue-900/10 cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4" />
                                                <span>Nova Prescrição</span>
                                            </Link>
                                        </div>

                                        {prescriptionsLoading ? (
                                            <div className="space-y-4">
                                                {[1, 2].map(i => (
                                                    <div key={i} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                                                        <Skeleton className="h-5 w-1/4" />
                                                        <Skeleton className="h-4 w-1/2" />
                                                        <Skeleton className="h-12 w-full" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : patientPrescriptions.length > 0 ? (
                                            <div className="space-y-4">
                                                {patientPrescriptions.map(prescription => (
                                                    <div key={prescription.id} className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4 mb-4 gap-2">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                                                    <Pill className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <p className="text-xs font-black text-gray-900 uppercase">Receita Médica</p>
                                                                        <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase font-mono tracking-wider">{prescription.signature_code}</span>
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-400 mt-0.5">Emitida em {new Date(prescription.created_at).toLocaleDateString('pt-PT')} por {prescription.professional_name || 'Profissional'}</p>
                                                                </div>
                                                            </div>
                                                            <Link
                                                                to={`/verificar-receita/${prescription.id}`}
                                                                className="self-start md:self-auto flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-xl transition-colors border border-blue-100 cursor-pointer"
                                                            >
                                                                <span>Visualizar Receita</span>
                                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                                            </Link>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {prescription.diagnosis && (
                                                                <div>
                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Diagnóstico Declarado</p>
                                                                    <p className="text-xs font-semibold text-gray-800">{prescription.diagnosis}</p>
                                                                </div>
                                                            )}
                                                            
                                                            <div>
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Medicamentos Prescritos</p>
                                                                <div className="space-y-2">
                                                                    {prescription.items?.map((item: any, idx: number) => (
                                                                        <div key={item.id || idx} className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-gray-100">
                                                                            <div>
                                                                                <p className="text-xs font-black text-gray-900">{item.medication}</p>
                                                                                <p className="text-[10px] text-gray-400 mt-0.5">{item.dosage} • {item.frequency} • {item.duration}</p>
                                                                            </div>
                                                                            {item.special_instructions && (
                                                                                <p className="text-[10px] text-gray-500 italic max-w-xs text-right line-clamp-1">"{item.special_instructions}"</p>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {(!prescription.items || prescription.items.length === 0) && (
                                                                        <p className="text-xs text-gray-400 italic">Nenhum item adicionado a esta receita.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-16 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-8">
                                                <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                <p className="font-black text-gray-500 uppercase text-xs tracking-widest">Sem Receitas</p>
                                                <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto mb-6">Não existem receitas médicas emitidas para este paciente ainda.</p>
                                                <Link
                                                    to={`/prescrever/${selectedPatient.id}`}
                                                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-md cursor-pointer"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    <span>Emitir Nova Receita</span>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {patientTab === 'notes' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Bloco de Notas Clínicas Privadas</h4>
                                            <p className="text-xs text-gray-400 mt-1">Notas pessoais e rascunhos sobre o paciente (apenas visível para si)</p>
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                            <textarea
                                                rows={8}
                                                value={privateNotes}
                                                onChange={(e) => setPrivateNotes(e.target.value)}
                                                placeholder="Escreva notas clínicas privadas sobre o paciente aqui (por exemplo, comportamentos, rascunho de sintomas, histórico familiar relevante, etc.). Estas notas são totalmente seguras."
                                                className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-xs font-semibold leading-relaxed focus:ring-2 focus:ring-amber-500/20 focus:bg-white transition-all outline-none resize-none"
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    disabled={isSavingNotes}
                                                    onClick={handleSavePrivateNotes}
                                                    className="bg-amber-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 active:scale-[0.98] transition-all shadow-md shadow-amber-900/10 cursor-pointer"
                                                >
                                                    {isSavingNotes ? 'A Guardar...' : 'Guardar Notas'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {patientTab === 'medications' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-sm font-black text-rose-900 uppercase tracking-widest">Acompanhamento de Medicações do Paciente</h4>
                                            <p className="text-xs text-gray-400 mt-1">Histórico detalhado e taxa de cumprimento/adesão da medicação prescrita</p>
                                        </div>

                                        {patientPrescriptions.length > 0 ? (
                                            <div className="space-y-6">
                                                {patientPrescriptions.map((presc) => (
                                                    <div key={presc.id} className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200/50">
                                                            <div className="flex items-center space-x-2">
                                                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Receita #{presc.id.slice(0, 6)}</span>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-400">{new Date(presc.created_at).toLocaleDateString('pt-PT')}</span>
                                                        </div>

                                                        <div className="space-y-4">
                                                            {(() => {
                                                                const items = Array.isArray(presc.items) ? presc.items : [];
                                                                if (items.length === 0) {
                                                                    return <p className="text-xs text-gray-400 italic">Sem medicações associadas.</p>;
                                                                }
                                                                return items.map((item: any, iIdx: number) => {
                                                                    const history = Object.entries(presc.taken_doses || {})
                                                                        .filter(([key, val]) => key.startsWith(`${iIdx}-`) && typeof val === 'string')
                                                                        .map(([key, val]) => {
                                                                            const parts = key.split('-');
                                                                            const dayIdx = parseInt(parts[1]);
                                                                            const scheduledHour = parseInt(parts[2]);
                                                                            
                                                                            const startDate = new Date(presc.start_date || presc.created_at);
                                                                            const scheduledTime = new Date(startDate);
                                                                            scheduledTime.setDate(scheduledTime.getDate() + dayIdx);
                                                                            scheduledTime.setHours(scheduledHour, 0, 0, 0);
                                                                            
                                                                            const actualTime = new Date(val as string);
                                                                            const diffMs = Math.abs(actualTime.getTime() - scheduledTime.getTime());
                                                                            const diffHours = diffMs / (1000 * 60 * 60);
                                                                            const isWrong = diffHours > 1 || actualTime.toLocaleDateString() !== scheduledTime.toLocaleDateString();

                                                                            return {
                                                                                timestamp: val as string,
                                                                                isWrong
                                                                            };
                                                                        })
                                                                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                                                                    const takenCount = history.length;
                                                                    const totalPlanned = parseDurationDays(item.duration) * (parseInt(item.frequency) || (item.frequency?.match(/(\d+)/)?.[1]) || 3);
                                                                    const perc = totalPlanned > 0 ? (takenCount / totalPlanned) * 100 : 0;

                                                                    return (
                                                                        <div key={iIdx} className="bg-white p-5 rounded-[2rem] border border-gray-100 space-y-4 shadow-sm hover:shadow-md transition-shadow">
                                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                                <div className="flex items-center space-x-3">
                                                                                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006747]">
                                                                                        <Pill className="w-5 h-5" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-black text-gray-800 leading-none">{item.medication}</p>
                                                                                        <p className="text-[10px] text-gray-400 font-bold mt-1.5 uppercase">{item.dosage} • {item.frequency} • {item.duration}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center space-x-3 self-end sm:self-auto">
                                                                                    <div className="flex flex-col items-end">
                                                                                        <p className="text-xs font-black text-gray-900">{takenCount}/{totalPlanned} doses</p>
                                                                                        <p className="text-[9px] font-black text-emerald-500 uppercase">Adesão: {perc.toFixed(0)}%</p>
                                                                                    </div>
                                                                                    <div className="w-10 h-10 rounded-full border-2 border-emerald-50 flex items-center justify-center relative overflow-hidden shrink-0">
                                                                                        <div className="absolute inset-0 bg-emerald-500 transition-all duration-1000" style={{ height: `${perc}%`, bottom: 0, top: 'auto', opacity: 0.1 }} />
                                                                                        <Check className="w-4 h-4 text-emerald-500" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {history.length > 0 && (
                                                                                <div className="pt-3 border-t border-gray-100">
                                                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2.5 flex items-center">
                                                                                        <Clock className="w-3.5 h-3.5 mr-1" /> Registro de Tomadas Realizadas
                                                                                    </p>
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        {history.map((entry, tIdx) => {
                                                                                            const date = new Date(entry.timestamp);
                                                                                            return (
                                                                                                <div key={tIdx} className={`${entry.isWrong ? 'bg-red-50 border-red-100/50 text-red-700' : 'bg-emerald-50/50 border-emerald-100/50 text-emerald-700'} px-2.5 py-1 rounded-xl border font-bold text-[9px] flex items-center`}>
                                                                                                    {date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })} às {date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                                                                                    {entry.isWrong && <AlertCircle className="w-2.5 h-2.5 ml-1 opacity-70" />}
                                                                                                </div>
                                                                                            );
                                                                                        })}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                });
                                                            })()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-16 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                                <Pill className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                <p className="font-black text-gray-500 uppercase text-xs tracking-widest">Sem Medicações</p>
                                                <p className="text-sm text-gray-400 mt-2">Não existem medicações ou receitas ativas registradas para este paciente.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Meus Pacientes</h3>
                                <div className="flex items-center space-x-3">
                                    <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">Total: {patients.length}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {patients.map(patient => (
                                    <div 
                                        key={patient.id} 
                                        onClick={() => setSelectedPatient(patient)}
                                        className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center transition-all hover:border-[#006747]/20 hover:shadow-md hover:scale-[1.01] cursor-pointer group"
                                    >
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center overflow-hidden mb-4 border-4 border-white shadow-md relative group-hover:scale-105 transition-transform">
                                            {sanitizeAvatarUrl(patient.avatar_url) ? (
                                                <img src={sanitizeAvatarUrl(patient.avatar_url)!} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <CircleUser className="w-full h-full text-black stroke-[1px] p-4" />
                                            )}
                                        </div>
                                        <h4 className="font-black text-lg text-gray-900 mb-1">{patient.full_name || patient.username}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Paciente desde {new Date(patient.created_at || Date.now()).toLocaleDateString('pt-PT')}</p>
                                        
                                        <div className="flex items-center justify-center space-x-3 w-full animate-fade-in" onClick={(e) => e.stopPropagation()}>
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
                    )
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
                                    <p className="text-xs font-black">{item.price?.toLocaleString('pt-PT')}€</p>
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
