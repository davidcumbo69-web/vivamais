import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, CircleUser, Dna, ClipboardList, ShieldCheck, 
  Apple, HeartPulse, Award, Users, Loader2, Plus, Brain, CalendarCheck2, 
  ShoppingBag, PackageCheck, Truck, Clock, MessageSquare, Microscope, 
  Film, Play, Pill, Hospital, LogOut, LayoutDashboard, FileText, ChevronRight, 
  MapPin, Calendar, ChevronDown, ChevronUp, Activity, Thermometer, Share2,
  Droplet, Ruler, Sparkles, AlertTriangle, Info, CheckCircle2, Check, AlertCircle,
  CalendarRange, X, Star, Edit3, Trash2
} from 'lucide-react';
import { AdCarousel } from '../components/ads/AdCarousel';
import { Skeleton, ProfileHeaderSkeleton, PostSkeleton, CommunityCardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import { useVitus } from '../hooks/useVitus';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, type HealthProfessional, type HealthGroup } from '../lib/supabase';
import CreateCommunityModal from '../components/modals/CreateCommunityModal';
import { FeedPost } from '../components/feed/FeedPost';
import { cn, sanitizeAvatarUrl } from '../lib/utils';
import { geminiService, AIEvolutionResult, AIMedicationSafetyResult } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

function ServiceCard({ svc, user, isOwner, onEdit, onDelete }: { svc: any, user: any, isOwner?: boolean, onEdit?: (svc: any) => void, onDelete?: (id: string) => void, key?: any }) {
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkIfSaved();
    }
  }, [user, svc.id]);

  const checkIfSaved = async () => {
    const { data } = await supabase
      .from('saved_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', svc.id)
      .eq('item_type', 'service')
      .maybeSingle();
    
    if (data) setIsSaved(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    const newState = !isSaved;
    setIsSaved(newState);

    if (newState) {
      await supabase.from('saved_items').insert({
        user_id: user.id,
        item_id: svc.id,
        item_type: 'service',
        metadata: {
          title: svc.name,
          image_url: svc.image_url,
          price: svc.base_price,
          category: svc.category
        }
      });
    } else {
      await supabase.from('saved_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', svc.id)
        .eq('item_type', 'service');
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm hover:border-[#006747]/20 hover:shadow-md transition-all group flex items-center space-x-4 relative">
      <div 
        className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer"
        onClick={() => navigate(`/marketplace/service/${svc.id}`)}
      >
        {svc.image_url ? (
          <img src={svc.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-emerald-50">
            <Stethoscope className="w-8 h-8 text-[#006747]/20" />
          </div>
        )}
      </div>
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/marketplace/service/${svc.id}`)}
      >
        <h4 className="font-bold text-gray-900 group-hover:text-[#006747] transition-colors truncate">{svc.name}</h4>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{svc.category}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-[#006747]">{svc.base_price}€</span>
          <div className="flex items-center space-x-1">
            <Award className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-[10px] font-bold text-gray-600">{svc.rating || 5.0}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col space-y-2">
        {/* Save Button */}
        {!isOwner && (
          <button 
            onClick={handleSave}
            className={cn(
              "p-2.5 rounded-xl transition-all active:scale-95",
              isSaved ? "bg-[#006747] text-white" : "bg-gray-50 text-gray-400 hover:text-[#006747]"
            )}
          >
            <ClipboardList className={cn("w-4 h-4", isSaved && "fill-current")} />
          </button>
        )}

        {isOwner && (
          <>
            <button 
              onClick={() => onEdit?.(svc)}
              className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#006747] rounded-xl transition-all active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete?.(svc.id)}
              className="p-2.5 bg-red-50 text-red-500/60 hover:text-red-500 rounded-xl transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product, user, isOwner, onEdit, onDelete }: { product: any, user: any, isOwner?: boolean, onEdit?: (p: any) => void, onDelete?: (id: string) => void, key?: any }) {
  const [isSaved, setIsSaved] = useState(false);
  const navigate = useNavigate();

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
    e.preventDefault();
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
    <div className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm hover:border-[#006747]/20 hover:shadow-md transition-all group flex items-center space-x-4 relative">
      <div 
        className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer"
        onClick={() => navigate('/marketplace')}
      >
        {product.image_url ? (
          <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ShoppingBag className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>
      <div 
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate('/marketplace')}
      >
        <h4 className="font-bold text-gray-900 group-hover:text-[#006747] transition-colors truncate">{product.name}</h4>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{product.category}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-[#006747]">{product.price}€</span>
          <div className="flex items-center space-x-1">
            <ClipboardList className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-600">{product.stock_quantity}</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col space-y-2">
        {/* Save Button */}
        {!isOwner && (
          <button 
            onClick={handleSave}
            className={cn(
              "p-2.5 rounded-xl transition-all active:scale-95",
              isSaved ? "bg-[#006747] text-white" : "bg-gray-50 text-gray-400 hover:text-[#006747]"
            )}
          >
            <ClipboardList className={cn("w-4 h-4", isSaved && "fill-current")} />
          </button>
        )}

        {isOwner && (
          <>
            <button 
              onClick={() => onEdit?.(product)}
              className="p-2.5 bg-gray-50 text-gray-400 hover:text-[#006747] rounded-xl transition-all active:scale-95"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete?.(product.id)}
              className="p-2.5 bg-red-50 text-red-500/60 hover:text-red-500 rounded-xl transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const MED_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F97316', // orange
  '#8B5CF6', // purple
  '#F59E0B', // yellow
  '#EC4899', // pink
  '#84CC16', // lime
  '#6B7280', // gray
  '#EAB308', // amber
  '#EF4444', // red
];

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { profile: myProfile, signOut } = useAuth();
  const isOwnProfile = !userId || userId === myProfile?.id;
  const [profile, setProfile] = useState<any>(null);
  const { balance } = useVitus();
  const { showAlert } = useAlert();
  const [proData, setProData] = useState<HealthProfessional | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([]);
  const [communities, setCommunities] = useState<HealthGroup[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingReels, setLoadingReels] = useState(false);
  const [loadingYoutubeVideos, setLoadingYoutubeVideos] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'communities' | 'appointments' | 'orders' | 'services' | 'products' | 'prescriptions' | 'patients' | 'clinical_history' | 'tracking' | 'reviews'>('posts');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);

  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [clinicalHistories, setClinicalHistories] = useState<any[]>([]);
  const [selectedVideoForModal, setSelectedVideoForModal] = useState<any | null>(null);
  const [loadingHistories, setLoadingHistories] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [expandedPrescriptions, setExpandedPrescriptions] = useState<Set<string>>(new Set());

  const togglePrescription = (id: string) => {
    setExpandedPrescriptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // AI States
  const [evolutionResult, setEvolutionResult] = useState<AIEvolutionResult | null>(null);
  const [evolutionLoading, setEvolutionLoading] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [safetyResult, setSafetyResult] = useState<AIMedicationSafetyResult | null>(null);
  const [safetyLoading, setSafetyLoading] = useState(false);
  
  // Patient Management States (for visitors)
  const [patientStatus, setPatientStatus] = useState<any>(null);
  const [isPatientOfProf, setIsPatientOfProf] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  
  // Review States
  const [canReview, setCanReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [avgRating, setAvgRating] = useState('0.0');
  const [reviewCount, setReviewCount] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // These are now handled in MyPatients page, but kept empty here to avoid breaking compilation if referenced
  const [myPatients] = useState<any[]>([]);
  const [patientRequests] = useState<any[]>([]);

  useEffect(() => {
    const effectiveUserId = userId || myProfile?.id;
    
    if (effectiveUserId && effectiveUserId !== 'undefined') {
      setLoadingProfile(true);
      fetchProfile(effectiveUserId);
    } else if (!userId && !myProfile?.id) {
      setLoadingProfile(false);
    }
  }, [userId, myProfile]);


  const calculateAge = (birthDate: string | undefined) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateCompletionScore = () => {
    if (!profile) return 0;
    const essentialFields = [
      'full_name',
      'birth_date',
      'gender',
      'address',
      'marital_status',
      'id_card_number',
      'province',
      'municipality',
      'bio'
    ];
    const filledFields = essentialFields.filter(field => !!profile[field as keyof typeof profile]);
    return Math.round((filledFields.length / essentialFields.length) * 100);
  };

  const checkCanReview = async (profId: string) => {
    if (!myProfile) return;
    try {
      // Só quem tem receita pode avaliar
      const { data: prescData } = await supabase
        .from('prescriptions')
        .select('id')
        .eq('patient_id', myProfile.id)
        .eq('professional_id', profId)
        .limit(1);
      
      if (prescData && prescData.length > 0) {
        setCanReview(true);
        // Check for existing review
        const { data: reviewData } = await supabase
          .from('professional_reviews')
          .select('*')
          .eq('professional_id', profId)
          .eq('reviewer_id', myProfile.id)
          .maybeSingle();
        
        if (reviewData) {
          setExistingReview(reviewData);
        }
      }

      // Get reviews stats
      const { data: ratings } = await supabase
        .from('professional_reviews')
        .select('rating')
        .eq('professional_id', profId);
      
      if (ratings && ratings.length > 0) {
        const avg = (ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length).toFixed(1);
        setAvgRating(avg);
        setReviewCount(ratings.length);
      }
    } catch (err) {
      console.error('Error checking review eligibility:', err);
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!myProfile || !profile) return;
    try {
      const reviewData = {
        professional_id: profile.id,
        reviewer_id: myProfile.id,
        rating,
        comment
      };

      if (existingReview) {
        const { error } = await supabase
          .from('professional_reviews')
          .update(reviewData)
          .eq('id', existingReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('professional_reviews')
          .insert(reviewData);
        if (error) throw error;
      }
      
      setShowReviewModal(false);
      checkCanReview(profile.id); // Refresh stats
      fetchProfessionalReviews(profile.id); // Refresh list
      showAlert('Avaliação enviada com sucesso!', 'A sua experiência foi registada.', 'success');
    } catch (err) {
      console.error('Error submitting review:', err);
      showAlert('Erro ao enviar avaliação.', 'Ocorreu um erro ao processar o seu pedido.', 'error');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!profile) return;
    
    // Safety check with alert
    if (!window.confirm('Tens a certeza que desejas eliminar esta avaliação?')) return;

    try {
      const { error } = await supabase
        .from('professional_reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
      
      checkCanReview(profile.id); // Refresh stats
      fetchProfessionalReviews(profile.id); // Refresh list
      showAlert('Avaliação removida', 'A sua avaliação foi eliminada com sucesso.', 'success');
    } catch (err) {
      console.error('Error deleting review:', err);
      showAlert('Erro ao eliminar', 'Não foi possível remover a avaliação.', 'error');
    }
  };

  const fetchProfile = async (targetUserId: string) => {
    try {
      const { data: pData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();
      
      if (error) throw error;
      if (pData) {
        setProfile(pData);
        
        if (pData.is_professional && !isOwnProfile && myProfile) {
          checkCanReview(targetUserId);
        }

        if (pData.is_professional) {
          setActiveTab('posts');
          supabase
            .from('health_professionals')
            .select('*')
            .eq('id', targetUserId)
            .single()
            .then(({ data }) => setProData(data));
        } else {
          setActiveTab(isOwnProfile ? 'appointments' : 'posts');
        }
        
        fetchUserPosts(targetUserId);
        fetchUserReels(targetUserId);
        fetchUserYoutubeVideos(targetUserId);
        fetchUserCommunities(targetUserId);
        fetchUserAppointments(targetUserId);
        fetchUserOrders(targetUserId);
        fetchUserPrescriptions(targetUserId);
        fetchClinicalHistory(targetUserId);
        
        if (isOwnProfile || myProfile?.is_professional) {
          fetchSafetyAlerts(targetUserId, pData.allergies || '');
        }

        if (pData.is_professional) {
          fetchUserServices(targetUserId);
          fetchUserProducts(targetUserId);
          fetchProfessionalReviews(targetUserId);
        }
        
        if (isOwnProfile) {
          fetchSavedItems(targetUserId);
        }
        
        fetchFollowData(targetUserId);

        // Fetch Patient Status
        if (myProfile?.id) {
           fetchPatientData(targetUserId, myProfile.id);
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchUserServices = async (targetUserId: string) => {
    setLoadingServices(true);
    const { data } = await supabase
      .from('wellness_services')
      .select('*')
      .eq('provider_id', targetUserId)
      .order('created_at', { ascending: false });
    
    if (data) setServices(data);
    setLoadingServices(false);
  };

  const fetchUserProducts = async (targetUserId: string) => {
    setLoadingProducts(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', targetUserId)
      .order('created_at', { ascending: false });
    
    if (data) setProducts(data);
    setLoadingProducts(false);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Tens a certeza que desejas eliminar este serviço?')) return;
    
    try {
      const { error } = await supabase
        .from('wellness_services')
        .delete()
        .eq('id', serviceId);
      
      if (error) throw error;
      
      showAlert('Serviço removido', 'O serviço foi eliminado com sucesso.', 'success');
      if (profile) fetchUserServices(profile.id);
    } catch (err) {
      console.error('Error deleting service:', err);
      showAlert('Erro ao eliminar', 'Não foi possível remover o serviço.', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('Tens a certeza que desejas eliminar este produto?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      showAlert('Produto removido', 'O produto foi eliminado com sucesso.', 'success');
      if (profile) fetchUserProducts(profile.id);
    } catch (err) {
      console.error('Error deleting product:', err);
      showAlert('Erro ao eliminar', 'Não foi possível remover o produto.', 'error');
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    
    try {
      const { error } = await supabase
        .from('wellness_services')
        .update({
          name: editingService.name,
          description: editingService.description,
          base_price: parseFloat(editingService.base_price),
          location: editingService.location,
          category: editingService.category
        })
        .eq('id', editingService.id);
      
      if (error) throw error;
      
      showAlert('Serviço atualizado', 'O seu serviço foi atualizado com sucesso.', 'success');
      setShowEditServiceModal(false);
      setEditingService(null);
      if (profile) fetchUserServices(profile.id);
    } catch (err) {
      console.error('Error updating service:', err);
      showAlert('Erro ao atualizar', 'Não foi possível atualizar o serviço.', 'error');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          description: editingProduct.description,
          price: parseFloat(editingProduct.price),
          category: editingProduct.category,
          stock_quantity: parseInt(editingProduct.stock_quantity),
          image_url: editingProduct.image_url
        })
        .eq('id', editingProduct.id);
      
      if (error) throw error;
      
      showAlert('Produto atualizado', 'O seu produto foi atualizado com sucesso.', 'success');
      setShowEditProductModal(false);
      setEditingProduct(null);
      if (profile) fetchUserProducts(profile.id);
    } catch (err) {
      console.error('Error updating product:', err);
      showAlert('Erro ao atualizar', 'Não foi possível atualizar o produto.', 'error');
    }
  };

  const fetchProfessionalReviews = async (profId: string) => {
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('professional_reviews')
        .select(`
          *,
          reviewer:reviewer_id(id, full_name, username, avatar_url)
        `)
        .eq('professional_id', profId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const fetchSavedItems = async (targetUserId: string) => {
    setLoadingSaved(true);
    const { data } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });
    
    if (data) setSavedItems(data);
    setLoadingSaved(false);
  };

  const fetchFollowData = async (targetUserId: string) => {
    // Check if following
    if (myProfile?.id) {
      const { data: followData } = await supabase
        .from('professional_followers')
        .select('*')
        .eq('follower_id', myProfile.id)
        .eq('professional_id', targetUserId)
        .single();
      
      setIsFollowing(!!followData);
    }

    // Get followers count
    const { count: fCount } = await supabase
      .from('professional_followers')
      .select('*', { count: 'exact', head: true })
      .eq('professional_id', targetUserId);
    
    // Get following count
    const { count: fingCount } = await supabase
      .from('professional_followers')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetUserId);

    if (fCount !== null) setFollowersCount(fCount);
    if (fingCount !== null) setFollowingCount(fingCount);
  };

  const getYoutubeId = (url: string) => {
    const match = (url || '').match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/user\/\S+|\/ytscreeningroom\?v=))([\w\-]{10,12})/);
    return match ? match[1] : null;
  };

  const handleFollow = async () => {
    if (!myProfile) {
      showAlert('Autenticação Necessária', 'Por favor, faça login para seguir profissionais.', 'warning');
      return;
    }

    const targetUserId = profile.id;
    
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('professional_followers')
          .delete()
          .eq('follower_id', myProfile.id)
          .eq('professional_id', targetUserId);
        
        if (error) throw error;
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from('professional_followers')
          .insert({
            follower_id: myProfile.id,
            professional_id: targetUserId
          });
        
        if (error) throw error;
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  const fetchUserOrders = async (targetUserId: string) => {
    setLoadingOrders(true);
    const { data } = await supabase
      .from('product_orders')
      .select('*, product:product_id(*)')
      .eq('buyer_id', targetUserId)
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data);
    setLoadingOrders(false);
  };

  const handleConfirmOrderReceipt = async (orderId: string) => {
    const { error } = await supabase
      .from('product_orders')
      .update({ status: 'concluído' })
      .eq('id', orderId);

    if (!error) {
        showAlert('Pedido Concluído', 'Sua confirmação foi registrada com sucesso!', 'success');
        fetchUserOrders(profile.id);
    }
  };

  const fetchUserAppointments = async (targetUserId: string) => {
    setLoadingAppointments(true);
    const { data } = await supabase
      .from('bookings')
      .select('*, service:service_id(*)')
      .eq('user_id', targetUserId)
      .order('scheduled_at', { ascending: false });
    
    if (data) setAppointments(data);
    setLoadingAppointments(false);
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

  const isPeriodActiveForHour = (freqStr: string, hour: number) => {
    const f = (freqStr || "").toLowerCase();
    if (f.includes('1x') || f.includes('24/24') || f.includes('diária') || f.includes('diaria')) return hour === 8;
    if (f.includes('2x') || f.includes('12/12')) return [8, 20].includes(hour);
    if (f.includes('3x') || f.includes('8/8')) return [0, 8, 16].includes(hour);
    if (f.includes('4x') || f.includes('6/6')) return [0, 6, 12, 18].includes(hour);
    if (f.includes('6x') || f.includes('4/4')) return [0, 4, 8, 12, 16, 20].includes(hour);
    const hourlyMatch = f.match(/(\d+)h/);
    if (hourlyMatch) {
      const interval = parseInt(hourlyMatch[1]);
      if (interval > 0) return (hour - 8) % interval === 0 || (hour + 24 - 8) % interval === 0;
    }
    return false;
  };

  const fetchUserPrescriptions = async (targetUserId: string, forceFetch = false) => {
    // Allow if own profile OR if I'm a professional and this is my patient (or if manually forced)
    if (!forceFetch && !isOwnProfile && !(myProfile?.is_professional && isPatientOfProf)) return;
    
    setLoadingPrescriptions(true);
    const { data } = await supabase
      .from('prescriptions')
      .select(`
        *,
        professional:professional_id(full_name, specialty, license_number),
        items:prescription_items(*)
      `)
      .eq('patient_id', targetUserId)
      .order('created_at', { ascending: false });
    
    if (data) setPrescriptions(data);
    setLoadingPrescriptions(false);
  };

  const fetchClinicalHistory = async (targetUserId: string) => {
    setLoadingHistories(true);
    try {
      const { data, error } = await supabase
        .from('clinical_histories')
        .select('*')
        .eq('patient_id', targetUserId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setClinicalHistories(data || []);
    } catch (err) {
      console.error('Error fetching clinical histories:', err);
    } finally {
      setLoadingHistories(false);
    }
  };

  const fetchSafetyAlerts = async (targetUserId: string, allergies: string) => {
    setSafetyLoading(true);
    try {
      // Get most recent prescription
      const { data: prescription } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (prescription) {
        const result = await geminiService.checkMedicationSafety(
          prescription.diagnosis,
          prescription.medications?.map((m: any) => m.name) || [],
          allergies,
          prescription.medications || []
        );
        setSafetyResult(result);
      }
    } catch (err) {
      console.error('Error fetching safety alerts:', err);
    } finally {
      setSafetyLoading(false);
    }
  };

  const handleAnalyzeEvolution = async () => {
    if (clinicalHistories.length < 2) {
      showAlert('Histórico Necessário', 'São necessárias pelo menos duas histórias clínicas para analisar a evolução.', 'info');
      return;
    }
    setEvolutionLoading(true);
    try {
      const result = await geminiService.analyzePatientEvolution(clinicalHistories);
      setEvolutionResult(result);
      setShowEvolutionModal(true);
    } catch (err) {
      console.error('Evolution Analysis Error:', err);
      showAlert('Erro na Análise', 'Não foi possível analisar a evolução do paciente no momento.', 'error');
    } finally {
      setEvolutionLoading(false);
    }
  };

  const fetchUserPosts = async (targetUserId: string) => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', targetUserId)
      .neq('category', 'Reels')
      .order('created_at', { ascending: false });
    
    if (data) setPosts(data);
    setLoadingPosts(false);
  };

  const fetchUserReels = async (targetUserId: string) => {
    setLoadingReels(true);
    const { data } = await supabase
      .from('reels')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });
    
    if (data) setReels(data);
    setLoadingReels(false);
  };

  const fetchUserYoutubeVideos = async (targetUserId: string) => {
    setLoadingYoutubeVideos(true);
    const { data } = await supabase
      .from('post_videos')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });
    
    if (data) setYoutubeVideos(data);
    setLoadingYoutubeVideos(false);
  };

  const fetchPatientData = async (targetUserId: string, currentUserId: string) => {
    if (loadingPatient) return;
    setLoadingPatient(true);
    try {
      if (currentUserId !== targetUserId) {
        // Case 1: Current user (patient) viewing Professional Profile
        const { data: statusAsPatient } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('professional_id', targetUserId)
          .maybeSingle();
        
        // Case 2: Current user (Professional) viewing Patient Profile
        const { data: statusAsProf } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', targetUserId)
          .eq('professional_id', currentUserId)
          .maybeSingle();

        const status = statusAsPatient || statusAsProf;
        
        setPatientStatus(status);
        const accepted = status?.status === 'accepted';
        setIsPatientOfProf(accepted);
        
        // If professional is viewing an accepted patient, fetch clinical info
        if (accepted && myProfile?.is_professional) {
          fetchUserPrescriptions(targetUserId, true);
          fetchClinicalHistory(targetUserId);
        }
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setLoadingPatient(false);
    }
  };

  const requestToBePatient = async () => {
    if (!myProfile) return showAlert('Acesso Restrito', 'Faça login primeiro para solicitar acompanhamento médico.', 'warning');
    setLoadingPatient(true);
    try {
      const { error } = await supabase
        .from('patients')
        .insert({
          user_id: myProfile.id,
          professional_id: profile.id,
          status: 'pending'
        });
      
      if (error) {
        if (error.code === '23505') {
          showAlert('Limite de Profissional', 'Você já é paciente de um profissional ou já possui um pedido pendente. Atualmente, é permitido apenas 1 profissional por paciente.', 'warning');
        } else {
          throw error;
        }
      } else {
        showAlert('Pedido Enviado', 'Seu pedido de acompanhamento foi enviado com sucesso! Aguarde a aprovação do profissional.', 'success');
        fetchPatientData(profile.id, myProfile.id);
      }
    } catch (err) {
      console.error('Error requesting status:', err);
    } finally {
      setLoadingPatient(false);
    }
  };

  const handlePatientRequest = async (requestId: string, action: 'accept' | 'reject' | 'remove') => {
    try {
      if (action === 'accept') {
        const { data: patientRel, error: updateError } = await supabase
          .from('patients')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', requestId)
          .select('user_id, professional_id')
          .single();
        
        if (updateError) throw updateError;

        // Auto-follow logic
        if (patientRel) {
          await supabase.from('professional_followers').upsert({
            follower_id: patientRel.user_id,
            professional_id: patientRel.professional_id
          });
        }
      } else if (action === 'reject' || action === 'remove') {
        await supabase.from('patients').delete().eq('id', requestId);
      }

      // Refresh data
      fetchPatientData(profile.id, myProfile!.id);
      fetchFollowData(profile.id);
    } catch (err) {
      console.error('Error handling patient request:', err);
    }
  };

  const cancelPatientRequest = async () => {
    if (!patientStatus?.id) return;
    if (!confirm('Tem a certeza que deseja cancelar o seu pedido de acompanhamento?')) return;
    
    setLoadingPatient(true);
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientStatus.id);
      
      if (error) throw error;
      
      setPatientStatus(null);
      setIsPatientOfProf(false);
    } catch (err) {
      console.error('Error cancelling request:', err);
    } finally {
      setLoadingPatient(false);
    }
  };

  const fetchUserCommunities = async (targetUserId: string) => {
    setLoadingCommunities(true);
    
    try {
      // Fetch communities where user is a member OR creator
      let membershipIds: string[] = [];
      const { data: membershipData, error: mError } = await supabase
        .from('health_group_members')
        .select('group_id')
        .eq('user_id', targetUserId);
      
      if (!mError && membershipData) {
        membershipIds = membershipData.map(m => m.group_id);
      }
      
      const { data: createdData } = await supabase
        .from('health_groups')
        .select('id')
        .eq('creator_id', targetUserId);

      const createdIds = createdData?.map(g => g.id) || [];
      const allIds = Array.from(new Set([...membershipIds, ...createdIds]));
      
      if (allIds.length > 0) {
        const { data, error } = await supabase
          .from('health_groups')
          .select('*')
          .in('id', allIds);
        
        if (error) throw error;
        if (data) setCommunities(data);
      } else {
        setCommunities([]);
      }
    } catch (err) {
      console.error('Error fetching user communities:', err);
    } finally {
      setLoadingCommunities(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="pb-20 max-w-4xl mx-auto md:pb-10 pt-4 px-4 overflow-x-hidden">
        <Skeleton className="w-full aspect-[21/5] rounded-[2rem] mb-8" />
        <ProfileHeaderSkeleton />
        <div className="flex space-x-4 mb-8 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />)}
        </div>
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="aspect-square w-full rounded-sm" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <CircleUser className="w-16 h-16 text-black stroke-[1px] mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Utilizador não encontrado</h2>
        <Link to="/" className="mt-4 text-[#006747] font-bold">Voltar ao Início</Link>
      </div>
    );
  }

  const user = {
    username: profile.username || 'utilizador_viva',
    name: profile.full_name || 'VIVA User',
    bio: profile.bio || 'O meu percurso rumo a um estilo de vida saudável com o SNS.',
    followers: followersCount.toLocaleString(),
    following: followingCount.toLocaleString(),
    posts: profile.is_professional ? (posts.length + reels.length + youtubeVideos.length) : posts.length || '24',
    streak: 12,
    level: profile.xp_level || 5
  };

  return (
    <div className="pb-20 max-w-4xl mx-auto md:pb-10 pt-4 px-4">
      {/* Dynamic Ad Cover */}
      <AdCarousel location="profiles" category={profile?.specialty || 'Geral'} className="mb-4" />
      
      {/* Header */}
      <div className="flex items-center justify-end -mt-8 relative z-20 px-4">
        <div className="flex items-center space-x-4">
          {isOwnProfile && (
            <Link 
              to="/definicoes" 
              className="group relative w-14 h-14 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
              title="Definições"
            >
              {/* Stylized Intestine Illustration (Black Line Art) */}
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible relative z-10 transition-all duration-300 group-hover:scale-110">
                <path 
                  d="M30,40 C20,40 20,70 30,70 L70,70 C80,70 80,40 70,40 L60,40 C55,40 55,45 60,45 L70,45 C75,45 75,65 70,65 L30,65 C25,65 25,45 30,45 L40,45 C45,45 45,40 40,40 Z" 
                  fill="none" 
                  stroke="black" 
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path 
                  d="M45,52 C47,48 53,48 55,52 C57,56 63,56 65,52 C68,48 68,60 65,60 C60,60 55,65 55,70 C55,65 50,60 45,60 C42,60 42,52 45,52" 
                  fill="none" 
                  stroke="black" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              
              {/* Sub-text or tiny icon removed as requested for a pure drawing */}
            </Link>
          )}
        </div>
      </div>

      {/* Profile Info Section (Reddit Style) */}
      <div className="flex flex-row items-start px-4 mb-6">
        <div className="relative -mt-4 md:-mt-12 flex-shrink-0">
           <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-white flex items-center justify-center">
              {sanitizeAvatarUrl(profile.avatar_url) ? (
                  <img 
                      src={sanitizeAvatarUrl(profile.avatar_url)!} 
                      className="w-full h-full rounded-full object-cover" 
                      alt="" 
                  />
              ) : (
                  <CircleUser className="w-full h-full text-black stroke-[1px] p-2" />
              )}
           </div>
           {profile.is_professional && (
              <div className="absolute -inset-x-12 -top-10 -bottom-20 z-20 pointer-events-none flex items-center justify-center">
                <svg viewBox="0 0 120 160" className="w-[95%] h-[95%] md:w-[135%] md:h-[135%] drop-shadow-xl overflow-visible">
                  {/* Framing tubes - forming a heart-like curvature framing the bottom and sides */}
                  <path 
                    d="M 30 65 
                       C 30 100, 55 110, 60 110 
                       S 90 100, 90 65" 
                    fill="none" 
                    stroke="#006747" 
                    strokeWidth="2.2" 
                    strokeLinecap="round"
                  />
                  
                  {/* Olivas (Ear tips) - grey pods at the center sides of the avatar */}
                  <rect x="27" y="59" width="6" height="12" rx="3" fill="#E5E7EB" stroke="#004d35" strokeWidth="0.6" />
                  <rect x="87" y="59" width="6" height="12" rx="3" fill="#E5E7EB" stroke="#004d35" strokeWidth="0.6" />
                  
                  {/* Bottom wire - mirrored to the left but more compact (junction -> down -> shallow curve left -> end) */}
                  <path 
                    d="M 60 110 
                       L 60 122 
                       C 60 135, 35 135, 35 122" 
                    fill="none" 
                    stroke="#006747" 
                    strokeWidth="2.4" 
                    strokeLinecap="round"
                  />
                  
                  {/* Chest piece (Diaphragm) - positioned at the end of the left-curved wire */}
                  <g transform="translate(35, 122)">
                    <circle r="7" fill="#374151" stroke="white" strokeWidth="1.2" />
                    <circle r="4" fill="#D1D5DB" stroke="#374151" strokeWidth="0.5" />
                  </g>
                </svg>
              </div>
           )}
        </div>
        
        <div className="flex-1 ml-4 pt-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">{profile.full_name || profile.username}</h2>
              </div>
              <p className="text-xs text-gray-400 font-bold tracking-tight">u/{profile.username}</p>
            </div>
            
            {/* Edit Profile Link removed per user request */}
          </div>
          
          <div className="flex items-center space-x-4 mt-3 text-xs font-medium text-gray-500">
             <div className="flex items-center space-x-1">
               <span className="font-bold text-gray-900">{followersCount}</span>
               <span>seguidores</span>
             </div>
             <div className="flex items-center space-x-1">
               <span className="font-bold text-gray-900">{followingCount}</span>
               <span>seguindo</span>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {profile.is_professional && (
              <div 
                onClick={() => setActiveTab('reviews')}
                className="cursor-pointer flex items-center bg-[#FF4500]/5 text-[#FF4500] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.05em] border border-[#FF4500]/10 hover:bg-[#FF4500]/10 transition-colors shadow-sm"
              >
                <div className="w-4 h-4 bg-[#FF4500] rounded-full flex items-center justify-center mr-1.5">
                   <Star className="w-2.5 h-2.5 text-white fill-current" />
                </div>
                {avgRating} <span className="mx-1 opacity-40">•</span> {reviewCount} Avaliações
              </div>
            )}
            {(profile.province || profile.municipality) && (
              <div className="flex items-center bg-gray-100/80 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.05em] border border-gray-100 transition-colors">
                <MapPin className="w-3 h-3 mr-1.5 opacity-60" />
                {profile.municipality && profile.province 
                  ? `${profile.municipality}, ${profile.province}` 
                  : profile.province || profile.municipality}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio Row */}
      <div className="px-4 mb-6">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{profile.bio || 'Sem bio disponível.'}</p>
      </div>

      {/* Primary Action Buttons (Reddit Style - Horizontal Row) */}
      <div className="px-4 mb-8">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide py-1">
          {!isOwnProfile && (
            <>
              {profile.is_professional && (
                <button 
                  onClick={handleFollow}
                  className={cn(
                    "flex-none px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm",
                    isFollowing 
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                      : "bg-[#006747] text-white hover:bg-emerald-800"
                  )}
                >
                  {isFollowing ? 'A seguir' : 'Seguir'}
                </button>
              )}
              
              <Link 
                to={`/mensagens?userId=${profile.id}`}
                className="flex-none bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:bg-gray-50 flex items-center space-x-2 shadow-sm"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </Link>

              {profile.is_professional && (
                <button 
                  onClick={patientStatus?.status === 'pending' ? cancelPatientRequest : requestToBePatient}
                  disabled={loadingPatient || patientStatus?.status === 'accepted'}
                  className={cn(
                    "flex-none px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2 border shadow-sm",
                    patientStatus?.status === 'accepted' ? "bg-emerald-50 border-emerald-100 text-[#006747]" : 
                    patientStatus?.status === 'pending' ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100" :
                    "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>
                    {patientStatus?.status === 'accepted' ? 'Sou Paciente' : 
                     patientStatus?.status === 'pending' ? 'Pendente' : 'Tornar-se Paciente'}
                  </span>
                </button>
              )}

              {canReview && (
                <button 
                  onClick={() => setShowReviewModal(true)}
                  className="flex-none bg-amber-50 border border-amber-200 text-amber-600 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:bg-amber-100 flex items-center space-x-2 shadow-sm"
                >
                  <Star className={cn("w-3.5 h-3.5", existingReview && "fill-current")} />
                  <span>{existingReview ? 'Avaliado' : 'Avaliar'}</span>
                </button>
              )}
            </>
          )}

          {isOwnProfile && profile.is_professional && (
             <Link 
               to="/professional/dashboard" 
               className="flex-none bg-[#006747] text-white px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:bg-emerald-800 shadow-sm shadow-emerald-100"
             >
               Área Profissional
             </Link>
          )}

          {isOwnProfile && profile.is_professional && (
            <Link 
              to="/loja-viva" 
              className="flex-none bg-white border border-gray-200 text-gray-700 px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:bg-gray-50 shadow-sm"
            >
              Publicar Post
            </Link>
          )}
        </div>
      </div>

      {/* Profile Completion Score Card */}
      {isOwnProfile && calculateCompletionScore() < 100 && (
        <div className="mb-6 bg-white rounded-[2rem] p-6 shadow-sm border border-emerald-100 mx-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CircleUser className="w-3 h-3 text-black stroke-[1px]" />
              </div>
              <span className="text-[10px] font-black text-[#006747] uppercase tracking-widest">Completude do Perfil</span>
            </div>
            <span className="text-sm font-bold text-[#006747]">{calculateCompletionScore()}%</span>
          </div>
          
          <div className="w-full bg-emerald-50 h-2 rounded-full overflow-hidden mb-4">
            <div 
              className="bg-[#006747] h-full transition-all duration-1000 ease-out" 
              style={{ width: `${calculateCompletionScore()}%` }}
            />
          </div>
          
          <div className="flex items-start justify-between space-x-4">
            <p className="text-[11px] text-gray-500 leading-relaxed max-w-[240px]">
              Complete o seu perfil para aumentar a sua credibilidade na plataforma e garantir que todos os seus dados são autênticos.
            </p>
            <Link 
              to="/perfil/editar"
              className="flex items-center space-x-1 bg-[#006747] text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-emerald-800 transition-all active:scale-95 shadow-sm shadow-emerald-100"
            >
              <span>Completar</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Gamification Stats (Hide if Professional) */}
      {!profile.is_professional && (
        <div className="grid grid-cols-3 gap-2 mb-10 mx-4">
          <div className="bg-emerald-50 rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center text-center">
              <Apple className="w-5 h-5 md:w-6 md:h-6 text-[#006747] mb-1.5 md:mb-2" />
              <span className="text-[9px] md:text-[10px] uppercase font-bold text-[#006747] opacity-60">Nível XP</span>
              <span className="text-base md:text-lg font-bold text-[#006747]">{user.level}</span>
          </div>
          <div className="bg-orange-50 rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center text-center">
              <HeartPulse className="w-5 h-5 md:w-6 md:h-6 text-orange-500 mb-1.5 md:mb-2" />
              <span className="text-[9px] md:text-[10px] uppercase font-bold text-orange-500 opacity-60">Sessão</span>
              <span className="text-base md:text-lg font-bold text-orange-500">{user.streak} Dias</span>
          </div>
          <div className="bg-indigo-50 rounded-2xl p-2.5 md:p-4 flex flex-col items-center justify-center text-center">
              <Award className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 mb-1.5 md:mb-2" />
              <span className="text-[9px] md:text-[10px] uppercase font-bold text-indigo-600 opacity-60">Vitus</span>
              <span className="text-base md:text-lg font-bold text-indigo-600">{balance}</span>
          </div>
        </div>
      )}

      {/* VIVA+ TV Section for Professionals */}
      {profile.is_professional && youtubeVideos.length > 0 && (
        <div className="bg-white border-y border-gray-100 py-3 mb-6 shadow-sm overflow-hidden rounded-2xl mx-4">
          <div className="max-w-4xl mx-auto px-4 flex items-center space-x-4">
             <div className="flex-shrink-0 flex items-center pr-4 border-r border-gray-100 h-10">
                <div className="w-1.5 h-6 rounded-full mr-2 bg-[#006747]" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">VIVA+ TV</span>
             </div>
             <div className="flex-1 flex space-x-3 overflow-x-auto scrollbar-hide py-1">
                {youtubeVideos.map(video => (
                  <button 
                    key={video.id}
                    onClick={() => setSelectedVideoForModal(video)}
                    className="flex-shrink-0 w-32 h-20 bg-black rounded-xl overflow-hidden relative group border border-gray-100 transition-all hover:scale-105 shadow-sm"
                  >
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                    <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                       <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                    <img 
                      src={`https://img.youtube.com/vi/${getYoutubeId(video.youtube_url)}/mqdefault.jpg`} 
                      className="w-full h-full object-cover"
                      alt="" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.style.backgroundColor = '#111';
                      }}
                    />
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Tabs Section - Reddit Style (Horizontal, Simple) */}
      <div className="border-b border-gray-100 px-4 mb-4">
        <div className="flex items-center space-x-6 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('posts')}
            className={cn(
              "py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-none",
              activeTab === 'posts' ? "border-[#006747] text-[#006747]" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Publicações
          </button>
          
          {profile.is_professional && (
            <button 
              onClick={() => setActiveTab('services')}
              className={cn(
                "py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-none",
                activeTab === 'services' ? "border-[#006747] text-[#006747]" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Serviços
            </button>
          )}

          {profile.is_professional && (
            <button 
              onClick={() => setActiveTab('products')}
              className={cn(
                "py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-none",
                activeTab === 'products' ? "border-[#006747] text-[#006747]" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Produtos
            </button>
          )}

          {profile.is_professional && (
             <button 
               onClick={() => setActiveTab('reels')}
               className={cn(
                 "py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-none",
                 activeTab === 'reels' ? "border-[#006747] text-[#006747]" : "border-transparent text-gray-400 hover:text-gray-600"
               )}
             >
               Vídeos
             </button>
          )}

          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('prescriptions')}
              className={cn(
                "py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-none",
                activeTab === 'prescriptions' ? "border-[#006747] text-[#006747]" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Receitas
            </button>
          )}

          {(isOwnProfile || (myProfile?.is_professional && isPatientOfProf)) && (
            <button 
              onClick={() => setActiveTab('clinical_history')}
              className={cn(
                "py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-none",
                activeTab === 'clinical_history' ? "border-[#006747] text-[#006747]" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              História Clínica
            </button>
          )}

          {profile.is_professional && (
            <button 
              onClick={() => setActiveTab('reviews')}
              className={cn(
                "py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-none",
                activeTab === 'reviews' ? "border-[#006747] text-[#006747]" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Avaliações
            </button>
          )}

          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('saved')}
              className={cn(
                "py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-none",
                activeTab === 'saved' ? "border-[#006747] text-[#006747]" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Guardado
            </button>
          )}
          
          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('orders')}
              className={cn(
                "py-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex-none",
                activeTab === 'orders' ? "border-[#006747] text-[#006747]" : "border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              Encomendas
            </button>
          )}
          
          {/* More tabs as needed... */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-2">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {loadingPosts ? (
                Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)
              ) : posts.length > 0 ? (
                posts.map(post => (
                  <FeedPost 
                    key={post.id} 
                    post={{
                      ...post,
                      user: {
                        id: profile.id,
                        username: profile.username || 'utilizador_viva',
                        avatar: profile.avatar_url,
                        isProf: profile.is_professional
                      },
                      content: post.image_url || post.content_url || '',
                      likes: post.likes_count || 0,
                      time: new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      post_type: 'image'
                    }} 
                    onUpdate={() => fetchUserPosts(profile.id)} 
                  />
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                  <LayoutDashboard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Nenhuma publicação ainda</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              {loadingServices ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex items-center space-x-4">
                    <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </div>
                    <Skeleton className="w-10 h-10 rounded-xl" />
                  </div>
                ))
              ) : services.length > 0 ? (
                services.map(svc => (
                  <ServiceCard 
                    key={svc.id} 
                    svc={svc} 
                    user={myProfile} 
                    isOwner={isOwnProfile}
                    onDelete={handleDeleteService}
                    onEdit={(s) => {
                      setEditingService(s);
                      setShowEditServiceModal(true);
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <HeartPulse className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Sem serviços listados</p>
                 </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              {loadingProducts ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm flex items-center space-x-4">
                    <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="h-4 w-1/2 mt-2" />
                    </div>
                    <Skeleton className="w-10 h-10 rounded-xl" />
                  </div>
                ))
              ) : products.length > 0 ? (
                products.map(prod => (
                  <ProductCard 
                    key={prod.id} 
                    product={prod} 
                    user={myProfile}
                    isOwner={isOwnProfile}
                    onDelete={handleDeleteProduct}
                    onEdit={(p) => {
                      setEditingProduct(p);
                      setShowEditProductModal(true);
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <ShoppingBag className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Sem produtos listados</p>
                 </div>
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="min-h-screen bg-gray-50 -mx-4 -mb-20 px-6 pt-10 pb-32 font-sans">
              {loadingPrescriptions ? (
                <div className="max-w-4xl mx-auto space-y-8">
                  <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
                    <div className="flex justify-between mb-10">
                      <div className="space-y-4">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-3 w-32 ml-auto" />
                        <Skeleton className="h-3 w-40 ml-auto" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
                    </div>
                  </div>
                </div>
              ) : prescriptions.length > 0 ? (
                prescriptions.map(presc => {
                  const items = Array.isArray(presc.items) ? presc.items : [];
                  return (
                    <div key={presc.id} className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      {/* Prescription Paper Style Card */}
                      <div className="bg-white rounded-[2.5rem] p-10 md:p-14 border border-gray-100 shadow-xl relative overflow-hidden">
                        {/* Header Box */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-16 border-b border-gray-50 pb-10">
                          <div className="space-y-1">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Dr. {presc.professional?.full_name || 'Carlos Mendes'}</h3>
                            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                              <p>{presc.professional?.specialty || 'Infectologista'} — Cédula {presc.professional?.license_number || '12.847'}</p>
                              <p>{presc.hospital || 'Hospital Central de Luanda'}</p>
                            </div>
                          </div>
                          
                          <div className="text-right space-y-1 mt-2">
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Data: {new Date(presc.created_at).toLocaleDateString('pt-PT')}</p>
                            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Paciente: <span className="text-gray-900">{profile.full_name}, {profile.age || '34'} anos</span></p>
                            <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Diagnóstico: <span className="text-gray-900">{presc.diagnosis || 'Malária por P. falciparum'}</span></p>
                          </div>
                        </div>

                        {/* Medications list */}
                        <div className="space-y-4 mb-16">
                          {items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between py-4 px-6 rounded-2xl hover:bg-gray-50 transition-all group">
                              <div className="flex items-center space-x-6">
                                <span className="text-[11px] font-black text-gray-200 w-4">{idx + 1}</span>
                                <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: MED_COLORS[idx % MED_COLORS.length] }} />
                                <div className="flex items-center space-x-4">
                                  <h5 className="text-lg font-black text-gray-900 tracking-tight">{item.medication}</h5>
                                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{item.form || 'comprimido'}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-12">
                                <div className="text-right">
                                  <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-1">{item.frequency || '2x/dia'} — {item.duration || '3'} dias</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
                                    {item.instructions || 'com refeição'}
                                  </p>
                                </div>
                                <div className="w-12 text-right">
                                  <span className="text-xl font-black text-gray-900">{((parseInt(item.frequency) || 2) * (parseInt(item.duration) || 3))}x</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Therapeutic Map Grid */}
                        <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-10 text-center">
                            Mapa de administração terapêutica — {new Date(presc.created_at).toLocaleDateString('pt-PT')} — {(() => {
                              const d = new Date(presc.created_at);
                              d.setDate(d.getDate() + 14);
                              return d.toLocaleDateString('pt-PT');
                            })()}
                          </h4>

                          <div className="overflow-x-auto pb-4 scrollbar-hide">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="pb-8 text-[11px] font-bold text-gray-300 uppercase tracking-widest w-24">Horário</th>
                                  {[...Array(14)].map((_, i) => {
                                    const d = new Date(presc.created_at);
                                    d.setDate(d.getDate() + i);
                                    const isToday = new Date().toDateString() === d.toDateString();
                                    return (
                                      <th key={i} className={cn("pb-8 text-center px-1 min-w-[50px]", isToday ? "text-[#006747]" : "text-gray-300")}>
                                        <p className="text-[9px] font-black uppercase mb-1">{d.toLocaleDateString('pt-PT', { weekday: 'short' }).slice(0,3)}</p>
                                        <p className="text-[11px] font-black">{d.getDate()}</p>
                                      </th>
                                    );
                                  })}
                                </tr>
                              </thead>
                              <tbody>
                                {[8, 12, 14, 18, 20, 22].map((hour) => (
                                  <tr key={hour} className="group border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                                    <td className="py-5 text-[11px] font-black text-gray-400 group-hover:text-gray-900">{hour.toString().padStart(2, '0')}:00</td>
                                    {[...Array(14)].map((_, dayIdx) => (
                                      <td key={dayIdx} className="py-5 px-1">
                                         <div className="flex flex-wrap justify-center gap-1.5 min-h-[14px]">
                                           {items.filter((item: any) => isPeriodActiveForHour(item.frequency, hour)).map((_, medIdx) => (
                                             <div 
                                               key={medIdx}
                                               className="w-3 h-3 rounded-full shadow-sm"
                                               style={{ backgroundColor: MED_COLORS[items.indexOf(items.filter((i: any) => isPeriodActiveForHour(i.frequency, hour))[medIdx]) % MED_COLORS.length] }}
                                             />
                                           ))}
                                         </div>
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Legend Area */}
                          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-x-12 gap-y-6">
                             {items.map((item: any, idx: number) => (
                               <div key={idx} className="flex items-center space-x-3">
                                 <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: MED_COLORS[idx % MED_COLORS.length] }} />
                                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.medication}</span>
                               </div>
                             ))}
                          </div>
                        </div>

                        {/* Footer / QR / Signature */}
                        <div className="mt-16 flex flex-col md:flex-row justify-between items-end gap-8 border-t border-gray-50 pt-10">
                           <div className="flex items-center space-x-8">
                              <div className="w-24 h-24 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center">
                                 <svg viewBox="0 0 100 100" className="w-16 h-16 opacity-10">
                                   <rect x="10" y="10" width="20" height="20" fill="currentColor" />
                                   <rect x="70" y="10" width="20" height="20" fill="currentColor" />
                                   <rect x="10" y="70" width="20" height="20" fill="currentColor" />
                                   <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                                   <rect x="50" y="50" width="10" height="10" fill="currentColor" />
                                 </svg>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Código de Verificação</p>
                                 <span className="text-sm font-mono font-bold text-gray-900">#{(presc.signature_code || presc.id.slice(0,8)).toUpperCase()}</span>
                                 <div className="flex items-center space-x-2 text-[#006747] pt-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Receita Digital Validada</span>
                                 </div>
                              </div>
                           </div>
                           
                           <Link 
                             to={`/verificar-receita/${presc.id}`}
                             className="bg-black text-white px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
                           >
                             Imprimir Receituário
                           </Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-40 bg-white rounded-[3rem] border border-gray-100 shadow-xl max-w-4xl mx-auto">
                   <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-gray-100">
                      <FileText className="w-12 h-12 text-gray-100" />
                   </div>
                   <h4 className="text-base font-black text-gray-200 uppercase tracking-widest mb-3">Historial Vazio</h4>
                   <p className="text-xs text-gray-300 font-bold uppercase tracking-widest max-w-xs mx-auto leading-relaxed">Nenhuma prescrição digital foi emitida para este perfil até o momento.</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'clinical_history' && (
            <div className="space-y-6 px-2 pb-10">
              {/* Safety Alerts Banner */}
              {safetyResult && (safetyResult.interactions.length > 0 || safetyResult.allergyConflicts.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 rounded-[2rem] p-6 mb-6"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-xl">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-red-900 uppercase tracking-widest leading-none">Alertas de Segurança Ativos</h4>
                      <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest mt-1">Análise da Receita mais Recente</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {safetyResult.allergyConflicts.map((a, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs font-black text-red-800 bg-white/50 p-3 rounded-2xl border border-red-100">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0" />
                        <span>Alergia: {a}</span>
                      </div>
                    ))}
                    {safetyResult.interactions.map((inter, i) => (
                      <div key={i} className={cn(
                        "flex items-start space-x-2 text-xs font-black p-3 rounded-2xl border",
                        inter.severity === 'high' ? "bg-red-100/50 border-red-200 text-red-900" : "bg-orange-50 border-orange-100 text-orange-900"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0", inter.severity === 'high' ? "bg-red-600" : "bg-orange-500")} />
                        <span>Interacção {inter.severity === 'high' ? 'Grave' : 'Moderada'}: {inter.description}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h3 className="text-gray-900 font-black uppercase tracking-widest text-xs">Registos do Paciente</h3>
                  {myProfile?.is_professional && (
                    <button 
                      onClick={handleAnalyzeEvolution}
                      disabled={evolutionLoading || clinicalHistories.length < 2}
                      className="group relative flex items-center space-x-2 text-[#006747] bg-emerald-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all disabled:opacity-50 overflow-hidden"
                    >
                      {evolutionLoading && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                      )}
                      <Brain className={cn("w-3 h-3", evolutionLoading && "animate-pulse")} />
                      <span>{evolutionLoading ? 'Analisando...' : 'Evolução IA'}</span>
                    </button>
                  )}
                </div>
                {myProfile?.is_professional && (
                   <Link 
                     to={`/professional/clinical-history/${profile.id}`}
                     className="bg-[#006747] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all flex items-center space-x-2 shadow-lg shadow-emerald-50"
                   >
                     <Plus className="w-3 h-3" />
                     <span>Nova História</span>
                   </Link>
                )}
              </div>

              {loadingHistories ? (
                <div className="space-y-4">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="bg-white rounded-[2.5rem] p-6 border border-gray-100">
                       <div className="flex items-center space-x-4 mb-4">
                         <Skeleton className="w-12 h-12 rounded-2xl" />
                         <div className="space-y-2">
                           <Skeleton className="h-5 w-48" />
                           <Skeleton className="h-3 w-32" />
                         </div>
                       </div>
                       <Skeleton className="h-20 w-full rounded-2xl" />
                     </div>
                   ))}
                </div>
              ) : clinicalHistories.length > 0 ? (
                <div className="space-y-4">
                  {clinicalHistories.map((history) => (
                    <div 
                      key={history.id} 
                      className="bg-white rounded-[2.5rem] p-6 border border-gray-100 shadow-sm hover:border-[#006747]/20 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006747] group-hover:scale-110 transition-all">
                             <ClipboardList className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-base leading-none mb-1.5">{history.primary_diagnosis || history.primaryDiagnosis}</h4>
                            
                            {history.prescription_code && (
                              <div className="flex items-center space-x-2 mb-2">
                                <Pill className="w-3 h-3 text-[#FF4500]" />
                                <span className="text-[10px] font-black text-[#FF4500] uppercase tracking-widest bg-[#FF4500]/5 px-2 py-0.5 rounded-full">
                                  Receita: {history.prescription_code}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center space-x-3 text-gray-400">
                               <p className="text-[10px] font-black uppercase tracking-widest flex items-center">
                                 <Calendar className="w-3 h-3 mr-1.5" />
                                 {new Date(history.created_at).toLocaleDateString()}
                               </p>
                               <span className="text-[8px] opacity-20">•</span>
                               <p className="text-[10px] font-black uppercase tracking-widest flex items-center italic">
                                 Por: {history.professional_name}
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
                            onClick={() => setExpandedHistoryId(expandedHistoryId === history.id ? null : history.id)}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-black"
                          >
                            {expandedHistoryId === history.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                         <div className="p-3 bg-gray-50 rounded-2xl">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">IMC</p>
                            <p className="text-xs font-black text-[#006747]">{history.calculated_imc}</p>
                         </div>
                         <div className="p-3 bg-gray-50 rounded-2xl">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Temp</p>
                            <p className="text-xs font-black text-gray-900">{history.temperature}°C</p>
                         </div>
                         <div className="p-3 bg-gray-50 rounded-2xl">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">T. Arterial</p>
                            <p className="text-xs font-black text-gray-900">{history.bloodPressure || history.blood_pressure}</p>
                         </div>
                         <div className="p-3 bg-gray-50 rounded-2xl">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">SpO2</p>
                            <p className="text-xs font-black text-[#006747]">{history.spo2}%</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Queixa Principal</p>
                            <p className="text-xs text-gray-600 line-clamp-2">{history.mainComplaint || history.main_complaint}</p>
                         </div>
                         
                         {expandedHistoryId === history.id && (
                           <div className="pt-6 space-y-6 border-t border-gray-100 mt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                             {/* Section 1: Detailed Physical Exam */}
                             <div>
                               <h5 className="text-[8px] font-black text-[#006747] uppercase tracking-[0.2em] mb-4">Exame Físico Detalhado</h5>
                               <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                 <div className="p-3 bg-emerald-50/30 rounded-2xl border border-emerald-50">
                                   <p className="text-[8px] font-black text-emerald-600/70 uppercase mb-1">Peso / Altura</p>
                                   <p className="text-[11px] font-bold text-gray-700">{history.weight}kg / {history.height}m</p>
                                 </div>
                                 <div className="p-3 bg-emerald-50/30 rounded-2xl border border-emerald-50">
                                   <p className="text-[8px] font-black text-emerald-600/70 uppercase mb-1">Frequência</p>
                                   <p className="text-[11px] font-bold text-gray-700">{history.heart_rate || history.heartRate} bpm / {history.respiratory_rate || history.respiratoryRate} rpm</p>
                                 </div>
                                 <div className="p-3 bg-emerald-50/30 rounded-2xl border border-emerald-50 col-span-2 md:col-span-1">
                                   <p className="text-[8px] font-black text-emerald-600/70 uppercase mb-1">Duração Sintomas</p>
                                   <p className="text-[11px] font-bold text-gray-700">{history.duration}</p>
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
                                       <p className="text-[7px] font-black text-indigo-600 uppercase mb-1" >Próxima Consulta</p>
                                       <p className="text-[10px] text-gray-700 font-black">{new Date(history.next_appointment_date).toLocaleDateString()}</p>
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
                                    {history.clinicalNotes || history.clinical_notes}
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
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                      <HeartPulse className="w-8 h-8 text-gray-200" />
                   </div>
                   <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Sem histórico clínico</p>
                   <p className="text-xs text-gray-400 px-10">Os registos clínicos do paciente aparecerão aqui após as consultas.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tracking' && myProfile?.is_professional && isPatientOfProf && (
            <div className="space-y-6 px-2 pb-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#006747]">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight">Acompanhamento</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado da Medicação</p>
                </div>
              </div>
              {loadingPrescriptions ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-3xl p-5 border border-gray-100 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="w-10 h-10 rounded-2xl" />
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                        </div>
                        <Skeleton className="w-8 h-8 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : prescriptions.length > 0 ? (
                <div className="space-y-6">
                  {prescriptions.map((presc) => {
                    const isExpanded = expandedPrescriptions.has(presc.id);
                    return (
                      <div key={presc.id} className="bg-gray-50 rounded-3xl p-5 border border-gray-100 transition-all hover:bg-white/50">
                        <button 
                          onClick={() => togglePrescription(presc.id)}
                          className="w-full flex items-center justify-between group/header"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-50 transition-all group-hover/header:scale-105",
                              isExpanded ? "text-emerald-500" : "text-gray-400"
                            )}>
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1.5 flex items-center">
                                <Activity className="w-3 h-3 mr-1 text-emerald-300" />
                                {presc.diagnosis || 'Diagnóstico não especificado'}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className={cn(
                                  "text-xs font-bold transition-colors",
                                  isExpanded ? "text-[#006747]" : "text-gray-900"
                                )}>
                                  Receita #{presc.id.slice(0,6).toUpperCase()}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-200" />
                                <span className="text-[10px] font-bold text-gray-400">
                                  {new Date(presc.created_at).toLocaleDateString('pt-PT')}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className={cn(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                            isExpanded ? "bg-emerald-50 text-emerald-500 rotate-180" : "bg-white border border-gray-100 text-gray-400"
                          )}>
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="space-y-3 pt-6 mt-5 border-t border-gray-100">
                            {(() => {
                               const items = Array.isArray(presc.items) ? presc.items : (typeof presc.items === 'string' ? JSON.parse(presc.items) : []);
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
                                 
                                 const isWrong = diffHours > 1 || actualTime.toLocaleDateString('pt-PT') !== scheduledTime.toLocaleDateString('pt-PT');

                                 return { timestamp: val as string, isWrong };
                               })
                               .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                             const takenCount = history.length;
                             const totalPlanned = parseDurationDays(item.duration) * (parseInt(item.frequency) || (item.frequency?.match(/(\d+)/)?.[1]) || 3);
                             const perc = totalPlanned > 0 ? (takenCount / totalPlanned) * 100 : 0;

                             return (
                              <div key={iIdx} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 group transition-all hover:bg-emerald-50/10">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <div className={cn(
                                      "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]",
                                      perc > 0 ? "bg-emerald-500 blink-soft" : "bg-gray-200"
                                    )} />
                                    <div>
                                      <p className="text-sm font-black text-gray-900 leading-none group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{item.medication}</p>
                                      <p className="text-[10px] text-gray-400 font-black mt-2 uppercase tracking-widest leading-none">
                                        {item.dosage || '1'} {item.form || ''} • {item.frequency}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right flex items-center space-x-4">
                                    <div className="flex flex-col items-end">
                                      <p className="text-sm font-black text-gray-900 leading-none">{takenCount}/{totalPlanned}</p>
                                      <p className={cn(
                                        "text-[10px] font-black uppercase mt-1.5 tracking-tighter",
                                        perc > 0 ? "text-emerald-500" : "text-gray-300"
                                      )}>{perc.toFixed(0)}%</p>
                                    </div>
                                    <div className="w-11 h-11 rounded-full border-2 border-emerald-50 flex items-center justify-center relative shadow-sm overflow-hidden bg-gray-50/20">
                                      <div 
                                        className="absolute inset-x-0 bottom-0 bg-emerald-500 transition-all duration-1000" 
                                        style={{ height: `${Math.min(perc, 100)}%`, opacity: 0.1 }} 
                                      />
                                      <Check className={cn(
                                        "w-4 h-4 transition-colors", 
                                        perc > 0 ? "text-emerald-500" : "text-gray-200"
                                      )} />
                                    </div>
                                  </div>
                                </div>

                                {history.length > 0 && (
                                  <div className="pt-3 border-t border-gray-50">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2.5 flex items-center">
                                      <Clock className="w-3 h-3 mr-1.5" /> Registro de Tomadas
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {history.map((entry, tIdx) => {
                                        const date = new Date(entry.timestamp);
                                        return (
                                          <div key={tIdx} className={cn(
                                            "px-2.5 py-1.5 rounded-xl border transition-all flex items-center space-x-2",
                                            entry.isWrong ? 'bg-red-50 border-red-100/50' : 'bg-emerald-50/50 border-emerald-100/50'
                                          )}>
                                            <p className={cn(
                                              "text-[9px] font-black",
                                              entry.isWrong ? 'text-red-700' : 'text-emerald-700'
                                            )}>
                                              {date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })} • {date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                            {entry.isWrong && <AlertCircle className="w-2.5 h-2.5 text-red-500" />}
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
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
                <div className="text-center py-24 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-50">
                    <Activity className="w-10 h-10 text-gray-200" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">Sem Acompanhamento Ativo</h4>
                  <p className="text-xs text-gray-400 px-12 leading-relaxed">Não foram encontradas receitas ou registos de medicação para este paciente.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4 px-2">
              {loadingOrders ? (
                <div className="space-y-4">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                           <Skeleton className="w-12 h-12 rounded-xl" />
                           <div className="space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                           </div>
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                     </div>
                   ))}
                </div>
              ) : orders.length > 0 ? (
                orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between group hover:border-[#006747]/20 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden">
                        <img src={order.product?.image_url} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{order.product?.name}</h4>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center mt-0.5">
                          Qtd: {order.quantity} • Total: {order.total_price}€
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex items-center space-x-4">
                       <div className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center",
                          order.status === 'pendente' ? "bg-yellow-50 text-yellow-700" : 
                          order.status === 'enviado' ? "bg-blue-50 text-blue-700 font-bold animate-pulse" : 
                          order.status === 'concluído' ? "bg-green-50 text-green-700" :
                          "bg-red-50 text-red-700"
                       )}>
                          {order.status === 'enviado' ? <Truck className="w-3 h-3 mr-1.5" /> : null}
                          {order.status === 'concluído' ? <PackageCheck className="w-3 h-3 mr-1.5" /> : null}
                          {order.status}
                       </div>
                       
                       {order.status === 'enviado' && (
                           <button 
                             onClick={() => handleConfirmOrderReceipt(order.id)}
                             className="bg-[#006747] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100"
                           >
                             Confirmar Receção
                           </button>
                       )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                   <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Sem encomendas</p>
                   <p className="text-xs text-gray-400 px-10">Ainda não realizou compras no Marketplace VIVA.</p>
                   <Link to="/loja-viva" className="mt-6 inline-block text-[#006747] font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-2xl hover:bg-emerald-100 transition-all">Ir para a Loja</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-4 px-2">
              {loadingAppointments ? (
                <div className="space-y-4">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                           <Skeleton className="w-12 h-12 rounded-xl" />
                           <div className="space-y-2">
                              <Skeleton className="h-4 w-40" />
                              <Skeleton className="h-3 w-48" />
                           </div>
                        </div>
                        <Skeleton className="h-8 w-16 rounded-full" />
                     </div>
                   ))}
                </div>
              ) : appointments.length > 0 ? (
                appointments.map(bk => (
                  <div key={bk.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between group hover:border-[#006747]/20 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <CalendarCheck2 className="w-6 h-6 text-[#006747]" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-[#006747] transition-colors">{bk.service?.name}</h4>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center mt-0.5">
                          {new Date(bk.scheduled_at).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-0 flex items-center justify-between md:space-x-8">
                       <div className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center",
                          bk.status === 'pendente' ? "bg-yellow-50 text-yellow-700" : 
                          bk.status === 'confirmado' ? "bg-green-50 text-green-700" : 
                          "bg-red-50 text-red-700"
                       )}>
                          {bk.status}
                       </div>
                       <span className="font-bold text-[#006747] text-lg">{bk.total_price}€</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                   <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Sem marcações</p>
                   <p className="text-xs text-gray-400 px-10">Ainda não marcou nenhuma consulta na rede VIVA.</p>
                   <Link to="/consultas" className="mt-6 inline-block text-[#006747] font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-2xl hover:bg-emerald-100 transition-all">Explorar Serviços</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reels' && (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {(loadingReels || loadingYoutubeVideos) ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="aspect-[9/16] w-full rounded-2xl" />
                ))
              ) : (() => {
                const combinedVideos = [
                  ...reels.map(r => ({ ...r, isReel: true })),
                  ...youtubeVideos.map(v => ({ ...v, isYoutube: true }))
                ].sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                return combinedVideos.length > 0 ? (
                  combinedVideos.map((item) => (
                    <div 
                      key={item.id} 
                      className="aspect-[9/16] bg-black hover:opacity-90 transition-all cursor-pointer overflow-hidden rounded-[2rem] relative group border border-gray-100 shadow-sm"
                      onClick={() => {
                        if (item.isYoutube) {
                          setSelectedVideoForModal(item);
                        }
                      }}
                    >
                      {item.isYoutube ? (
                        <>
                          <img 
                            src={`https://img.youtube.com/vi/${getYoutubeId(item.youtube_url)}/maxresdefault.jpg`} 
                            className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-500" 
                            alt="" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${getYoutubeId(item.youtube_url)}/mqdefault.jpg`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-125 transition-transform duration-300 shadow-xl">
                               <Play className="w-6 h-6 text-white fill-white" />
                             </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <video src={`${item.video_url}#t=0.1`} className="w-full h-full object-cover" preload="metadata" playsInline />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </>
                      )}
                      
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest line-clamp-2 drop-shadow-md">
                          {item.caption || item.category || 'VIVA+ Vídeo'}
                        </p>
                      </div>

                      {!item.is_approved && (
                        <div className="absolute top-4 left-4 bg-orange-500/90 backdrop-blur px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest shadow-lg">
                          Em Moderação
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <Film className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Sem Vídeos diponíveis</p>
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'communities' && (
            <div className="space-y-4">
                {isOwnProfile && profile.is_professional && (
                  <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-gray-200 mb-8 shadow-sm">
                     <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-[#006747]" />
                     </div>
                     <h4 className="font-bold text-gray-900">Gestão de Grupos de Literacia</h4>
                     <p className="text-xs text-gray-400 max-w-xs mx-auto mt-2 font-medium">Partilhe o seu conhecimento e acompanhe os seus seguidores em grupos exclusivos.</p>
                     <button 
                       onClick={() => setIsModalOpen(true)}
                       className="mt-6 bg-[#006747] text-white px-8 py-3 rounded-2xl text-sm font-bold flex items-center mx-auto space-x-2 shadow-lg shadow-emerald-100 hover:scale-105 transition-all"
                     >
                        <Plus className="w-4 h-4 text-white" />
                        <span>Criar Nova Comunidade</span>
                     </button>
                  </div>
                )}

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loadingCommunities ? (
                    [1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center space-x-4">
                         <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
                         <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                         </div>
                      </div>
                    ))
                  ) : communities.length > 0 ? (
                    communities.map((community) => (
                      <Link 
                        key={community.id}
                        to={`/c/${community.name}`}
                        className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center space-x-4 hover:border-emerald-200 hover:shadow-md transition-all group"
                      >
                         <div 
                           className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-inner"
                           style={{ backgroundColor: community.theme_color || '#006747' }}
                         >
                            {community.name[0]}
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 group-hover:text-[#006747] transition-colors truncate">g/{community.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                               <p className="text-xs text-gray-400 font-medium">{community.member_count} membros</p>
                               <span className="text-gray-200 text-xs">•</span>
                               <span className="text-[10px] text-[#006747] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-50 rounded-full">
                                 {community.category || 'Saúde'}
                               </span>
                            </div>
                         </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full py-16 text-center bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                       <p className="text-sm text-gray-400 font-medium">Ainda não pertence a nenhuma comunidade.</p>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="grid grid-cols-3 gap-1 md:gap-2">
              {loadingSaved ? (
                [1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="aspect-square w-full rounded-sm" />
                ))
              ) : savedItems.length > 0 ? (
                savedItems.map((item) => (
                  <Link 
                    key={item.id} 
                    to={
                      item.item_type === 'post' ? '/' :
                      item.item_type === 'direct_message' ? `/messages?userId=${item.metadata?.sender_id}` :
                      item.item_type === 'group_message' ? `/communities` : // Topic navigation is complex without more metadata
                      item.item_type === 'service' ? `/marketplace/service/${item.item_id}` :
                      item.item_type === 'product' ? `/marketplace` :
                      item.item_type === 'appointment' ? `/appointments` : '#'
                    }
                    className="relative aspect-square bg-gray-100 rounded-sm overflow-hidden group cursor-pointer border border-gray-100"
                  >
                    {item.metadata?.image_url ? (
                      <img 
                        src={item.metadata.image_url} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt="" 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-emerald-50/30">
                        <MessageSquare className="w-5 h-5 text-[#006747]/20 mb-2" />
                        <p className="text-[8px] text-gray-400 font-medium text-center line-clamp-3">
                          {item.metadata?.content || 'Mensagem Guardada'}
                        </p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                      <div className="flex items-center space-x-1 mb-1">
                        {item.item_type === 'post' && <Film className="w-2.5 h-2.5 text-white" />}
                        {item.item_type === 'direct_message' && <MessageSquare className="w-2.5 h-2.5 text-white" />}
                        {item.item_type === 'group_message' && <Users className="w-2.5 h-2.5 text-white" />}
                        {item.item_type === 'service' && <Stethoscope className="w-2.5 h-2.5 text-white" />}
                        {item.item_type === 'product' && <ShoppingBag className="w-2.5 h-2.5 text-white" />}
                        {item.item_type === 'appointment' && <CalendarCheck2 className="w-2.5 h-2.5 text-white" />}
                        <span className="text-[7px] text-white font-black uppercase tracking-[0.2em]">
                          {item.item_type === 'direct_message' || item.item_type === 'group_message' ? 'Mensagem' : 
                           item.item_type === 'service' ? 'Serviço' :
                           item.item_type === 'post' ? 'Post' :
                           item.item_type === 'product' ? 'Produto' : 'Consulta'}
                        </span>
                      </div>
                      <p className="text-white text-[9px] font-bold text-center line-clamp-2 px-1">
                        {item.metadata?.title || (item.item_type.includes('message') ? item.metadata?.content?.substring(0, 20) + '...' : 'Item Guardado')}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm font-medium">Ainda não guardou nada.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6 px-4 py-6">
              {loadingReviews ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm animate-pulse">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 bg-gray-100 rounded" />
                        <div className="h-3 w-48 bg-gray-50 rounded" />
                      </div>
                    </div>
                    <div className="h-20 bg-gray-50 rounded-2xl" />
                  </div>
                ))
              ) : reviews.length > 0 ? (
                <>
                  {/* Summary Card */}
                  <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 mb-8 flex flex-col items-center text-center">
                     <div className="flex items-center space-x-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            className={cn(
                              "w-6 h-6",
                              star <= parseFloat(avgRating) ? "text-amber-500 fill-current" : "text-amber-200"
                            )} 
                          />
                        ))}
                     </div>
                     <h3 className="text-3xl font-black text-amber-900 leading-none">{avgRating}</h3>
                     <p className="text-xs font-black text-amber-600 uppercase tracking-widest mt-2">{reviewCount} avaliações verificadas</p>
                  </div>

                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:border-[#FF4500]/20 transition-all group relative">
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="w-6 h-6 rounded-full border border-gray-100 overflow-hidden bg-gray-50">
                                {review.reviewer?.avatar_url ? (
                                  <img src={review.reviewer.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <CircleUser className="w-3 h-3 text-black stroke-[1px] mt-1 mx-auto" />
                                )}
                              </div>
                              <span className="text-xs font-black text-gray-900 leading-none">u/{review.reviewer?.username || 'utilizador'}</span>
                              <span className="text-[10px] text-gray-400 font-bold">• {new Date(review.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <p className="text-sm text-gray-700 leading-relaxed mb-4">{review.comment || 'Sem comentário.'}</p>
                            
                            <div className="flex items-center">
                               {myProfile && review.reviewer_id === myProfile.id && (
                                 <div className="flex items-center space-x-4 ml-auto">
                                   <button 
                                     onClick={() => setShowReviewModal(true)}
                                     className="flex items-center space-x-1.5 text-[#006747] hover:text-emerald-800 transition-colors"
                                   >
                                      <Edit3 className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Editar</span>
                                   </button>
                                   <button 
                                     onClick={() => handleDeleteReview(review.id)}
                                     className="flex items-center space-x-1.5 text-red-400 hover:text-red-600 transition-colors"
                                   >
                                      <Trash2 className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest">Apagar</span>
                                   </button>
                                 </div>
                               )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <Award className="w-8 h-8 text-gray-200" />
                  </div>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Sem avaliações ainda</p>
                </div>
              )}
            </div>
          )}

        </div>

      {/* Evolution Modal */}
      <AnimatePresence>
        {showEvolutionModal && evolutionResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-[#006747] p-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                      <Brain className="w-6 h-6 text-emerald-200" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black leading-none">Análise de Evolução</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Inteligência Clínica VIVA+</p>
                    </div>
                  </div>
                  <button onClick={() => setShowEvolutionModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                    <Plus className="w-5 h-5 text-white/60 rotate-45" />
                  </button>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 mt-6 border border-white/10">
                  <p className="text-sm font-medium leading-relaxed">
                    {evolutionResult.summary}
                  </p>
                </div>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8 custom-scrollbar">
                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-[#006747]" />
                    Padrões e Tendências
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {evolutionResult.patterns.map((pattern, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                        <CheckCircle2 className="w-3 h-3 text-[#006747]" />
                        <span className="text-[10px] font-bold text-gray-700">{pattern}</span>
                      </div>
                    ))}
                    {evolutionResult.trends.map((trend, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <Activity className="w-3 h-3 text-blue-600" />
                        <span className="text-[10px] font-bold text-gray-700">{trend}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                      <Pill className="w-4 h-4 mr-2 text-[#006747]" />
                      Últimas Medicações
                    </h4>
                    <div className="space-y-2">
                      {evolutionResult.lastMedications.length > 0 ? evolutionResult.lastMedications.map((med, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[10px] font-bold text-gray-600">
                          {med}
                        </div>
                      )) : <p className="text-[10px] text-gray-400 italic">Nenhum registado</p>}
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                      <Microscope className="w-4 h-4 mr-2 text-[#006747]" />
                      Exames Realizados
                    </h4>
                    <div className="space-y-2">
                      {evolutionResult.lastExams.length > 0 ? evolutionResult.lastExams.map((exam, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[10px] font-bold text-gray-600">
                          {exam}
                        </div>
                      )) : <p className="text-[10px] text-gray-400 italic">Nenhum registado</p>}
                    </div>
                  </section>
                </div>

                <section>
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                    <Stethoscope className="w-4 h-4 mr-2 text-[#006747]" />
                    Condutas Recomendadas
                  </h4>
                  <div className="space-y-3">
                    {evolutionResult.recommendations.map((rec, i) => (
                      <div key={i} className="p-4 bg-[#f8fafc] rounded-2xl border border-gray-100 flex items-start space-x-3">
                         <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Sparkles className="w-3 h-3 text-[#006747]" />
                         </div>
                         <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            {rec}
                         </p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setShowEvolutionModal(false)}
                  className="w-full py-4 rounded-3xl bg-[#006747] text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateCommunityModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => fetchUserCommunities(profile.id)}
      />

      {/* Video Detail Modal */}
      <AnimatePresence>
        {selectedVideoForModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-lg overflow-y-auto overflow-x-hidden">
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="w-full max-w-2xl relative my-auto"
             >
                <button 
                  onClick={() => setSelectedVideoForModal(null)}
                  className="absolute -top-14 right-0 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                  <X className="w-8 h-8" />
                </button>
                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <FeedPost 
                    post={{
                      id: selectedVideoForModal.id,
                      user: {
                        id: profile.id || '',
                        username: profile.username || 'Especialista',
                        avatar: profile.avatar_url,
                        isProf: profile.is_professional || false
                      },
                      content: selectedVideoForModal.youtube_url || '',
                      caption: selectedVideoForModal.caption || '',
                      likes: selectedVideoForModal.likes_count || 0,
                      category: selectedVideoForModal.category || profile.specialty || 'Saúde',
                      time: new Date(selectedVideoForModal.created_at).toLocaleDateString(),
                      post_type: 'video',
                      youtube_url: selectedVideoForModal.youtube_url
                    }}
                  />
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#1A1A1B]/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                 <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#FF4500] rounded-full flex items-center justify-center">
                       <Award className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-sm font-black text-gray-900 tracking-tight">Avaliar Profissional</h3>
                 </div>
                 <button 
                  onClick={() => setShowReviewModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                    Partilha a tua experiência com {profile.full_name || profile.username}
                  </p>
                </div>

                <ReviewForm 
                  initialRating={existingReview?.rating || 5}
                  initialComment={existingReview?.comment || ''}
                  onSubmit={handleSubmitReview}
                  onCancel={() => setShowReviewModal(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Edit Service Modal */}
      <AnimatePresence>
        {showEditServiceModal && editingService && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#006747]">Editar Serviço</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Atualiza os detalhes do teu serviço</p>
                </div>
                <button onClick={() => setShowEditServiceModal(false)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateService} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Serviço</label>
                  <input 
                    type="text" 
                    value={editingService.name}
                    onChange={(e) => setEditingService({...editingService, name: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                    <input 
                      type="text" 
                      value={editingService.category}
                      onChange={(e) => setEditingService({...editingService, category: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço Base (€)</label>
                    <input 
                      type="number" 
                      value={editingService.base_price}
                      onChange={(e) => setEditingService({...editingService, base_price: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localização</label>
                  <input 
                    type="text" 
                    value={editingService.location}
                    onChange={(e) => setEditingService({...editingService, location: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm"
                    placeholder="Ex: Luanda, Online, Homecare"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea 
                    value={editingService.description}
                    onChange={(e) => setEditingService({...editingService, description: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm min-h-[100px] resize-none"
                  />
                </div>
                
                <div className="pt-4 flex items-center space-x-3">
                  <button 
                    type="button"
                    onClick={() => setShowEditServiceModal(false)}
                    className="flex-1 py-4 text-xs font-black uppercase text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 rounded-2xl bg-[#006747] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Guardar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {showEditProductModal && editingProduct && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#006747]">Editar Produto</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Atualiza os detalhes do teu produto</p>
                </div>
                <button onClick={() => setShowEditProductModal(false)} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateProduct} className="p-8 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nome do Produto</label>
                  <input 
                    type="text" 
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Categoria</label>
                    <input 
                      type="text" 
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Preço (€)</label>
                    <input 
                      type="number" 
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantidade em Stock</label>
                  <input 
                    type="number" 
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({...editingProduct, stock_quantity: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">URL da Imagem</label>
                  <input 
                    type="text" 
                    value={editingProduct.image_url}
                    onChange={(e) => setEditingProduct({...editingProduct, image_url: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm"
                    placeholder="https://exemplo.com/imagem.png"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
                  <textarea 
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#006747]/20 transition-all font-medium text-sm min-h-[100px] resize-none"
                  />
                </div>
                
                <div className="pt-4 flex items-center space-x-3">
                  <button 
                    type="button"
                    onClick={() => setShowEditProductModal(false)}
                    className="flex-1 py-4 text-xs font-black uppercase text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 rounded-2xl bg-[#006747] text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Guardar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReviewForm({ initialRating, initialComment, onSubmit, onCancel }: { 
  initialRating: number, 
  initialComment: string, 
  onSubmit: (rating: number, comment: string) => void, 
  onCancel: () => void 
}) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const trimmedComment = comment.trim();
  const charCount = trimmedComment.length;
  const minChars = 100;
  const maxChars = 1000;

  // Real-time validation for UI feedback
  const isTooShort = charCount > 0 && charCount < minChars;
  const isTooLong = charCount > maxChars;

  const validateAndSubmit = () => {
    setError(null);

    // 1. Minimum chars
    if (charCount < minChars) {
      setError("A tua avaliação é valiosa! Por favor, escreve pelo menos 100 caracteres para ajudar outros utilizadores.");
      return;
    }

    // 2. Maximum chars
    if (charCount > maxChars) {
      setError("Ups! O teu texto é demasiado longo. Tenta resumir a tua experiência para menos de 1.000 caracteres.");
      return;
    }

    // 3. Repeated characters (>5)
    // regex checks for a character followed by itself 5 times (total 6+)
    const repeatedCharRegex = /(.)\1{5,}/;
    if (repeatedCharRegex.test(trimmedComment)) {
      setError("Por favor, evita utilizar caracteres repetidos excessivamente.");
      return;
    }

    // 4. URL blocking
    const urlRegex = /(http|www|\.com|\.pt|\.net|\.org)/i;
    if (urlRegex.test(trimmedComment)) {
      setError("Não são permitidos links ou URLs nas avaliações.");
      return;
    }

    onSubmit(rating, trimmedComment);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Qualidade do Atendimento</label>
        <div className="flex justify-center items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 transition-all"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            >
              <Star 
                className={cn(
                  "w-10 h-10 transition-all",
                  (hoveredRating || rating) >= star 
                    ? "text-[#FF4500] fill-current scale-110" 
                    : "text-gray-200"
                )} 
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">A tua opinião</label>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest",
            isTooLong || isTooShort ? "text-red-500" : "text-gray-400"
          )}>
            {charCount} / {maxChars}
          </span>
        </div>
        <textarea
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Descreve detalhadamente a tua experiência... O que gostaste mais? O que poderia ser melhor?"
          className={cn(
            "w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-[#FF4500] focus:border-[#FF4500] outline-none transition-all resize-none h-40",
            (isTooLong || isTooShort) && "border-red-200"
          )}
        />
        
        {isTooShort && charCount > 0 && (
          <p className="text-[10px] text-gray-400 font-bold px-1">Faltam {minChars - charCount} caracteres.</p>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-600 font-bold leading-relaxed">{error}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end space-x-3 pt-2">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 text-gray-500 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95"
        >
          Agora não
        </button>
        <button
          onClick={validateAndSubmit}
          disabled={isTooLong || charCount < minChars}
          className={cn(
            "px-6 py-2.5 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm",
            isTooLong || charCount < minChars 
              ? "bg-gray-200 cursor-not-allowed text-gray-400" 
              : "bg-[#FF4500] hover:bg-[#FF3000]"
          )}
        >
          Publicar
        </button>
      </div>
    </div>
  );
}
