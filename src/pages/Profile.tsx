import React, { useState, useEffect } from 'react';
import { Stethoscope, Dna, ClipboardList, UserCircle as UserIcon, ShieldCheck, Apple, HeartPulse, Award, Users, Loader2, Plus, Brain, CalendarCheck2, ShoppingBag, PackageCheck, Truck, Clock, MessageSquare, Microscope, Film, Pill, Hospital, LogOut, LayoutDashboard, FileText, ChevronRight, MapPin } from 'lucide-react';
import { AdCarousel } from '../components/ads/AdCarousel';
import { useAuth } from '../hooks/useAuth';
import { useVitus } from '../hooks/useVitus';
import { useParams, Link } from 'react-router-dom';
import { supabase, type HealthProfessional, type HealthGroup } from '../lib/supabase';
import CreateCommunityModal from '../components/modals/CreateCommunityModal';
import { cn } from '../lib/utils';

function ServiceCard({ svc, user }: { svc: any, user: any, key?: any }) {
  const [isSaved, setIsSaved] = useState(false);

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
    <Link 
      key={svc.id} 
      to={`/marketplace/service/${svc.id}`}
      className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm hover:border-[#006747]/20 hover:shadow-md transition-all group flex items-center space-x-4 relative"
    >
      <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
        <img src={svc.image_url || 'https://images.unsplash.com/photo-1576091160550-2173599bd14e?auto=format&fit=crop&q=80&w=200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 group-hover:text-[#006747] transition-colors truncate">{svc.name}</h4>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{svc.category}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="font-bold text-[#006747]">{svc.base_price}€</span>
          <div className="flex items-center space-x-1">
            <Award className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-[10px] font-bold text-gray-600">{svc.rating}</span>
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <button 
        onClick={handleSave}
        className={cn(
          "p-2.5 rounded-xl transition-all active:scale-95",
          isSaved ? "bg-[#006747] text-white" : "bg-gray-50 text-gray-400 hover:text-[#006747]"
        )}
      >
        <ClipboardList className={cn("w-4 h-4", isSaved && "fill-current")} />
      </button>
    </Link>
  );
}

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { profile: myProfile, signOut } = useAuth();
  const isOwnProfile = !userId || userId === myProfile?.id;
  const [profile, setProfile] = useState<any>(null);
  const { balance } = useVitus();
  const [proData, setProData] = useState<HealthProfessional | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [communities, setCommunities] = useState<HealthGroup[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingReels, setLoadingReels] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'communities' | 'appointments' | 'orders' | 'services' | 'prescriptions' | 'patients' | 'clinical_history'>('posts');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [clinicalHistories, setClinicalHistories] = useState<any[]>([]);
  const [loadingHistories, setLoadingHistories] = useState(false);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  
  // Patient Management States (for visitors)
  const [patientStatus, setPatientStatus] = useState<any>(null);
  const [isPatientOfProf, setIsPatientOfProf] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  
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
        fetchUserCommunities(targetUserId);
        fetchUserAppointments(targetUserId);
        fetchUserOrders(targetUserId);
        fetchUserPrescriptions(targetUserId);
        fetchClinicalHistory(targetUserId);
        if (pData.is_professional) {
          fetchUserServices(targetUserId);
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

  const handleFollow = async () => {
    if (!myProfile) {
      alert('Por favor, faça login para seguir profissionais.');
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
        alert('Compra concluída com sucesso!');
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

  const fetchUserPrescriptions = async (targetUserId: string) => {
    if (!isOwnProfile) return;
    setLoadingPrescriptions(true);
    const { data } = await supabase
      .from('prescriptions')
      .select(`
        *,
        professional:professional_id(full_name, specialty, license_number)
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
      
      if (error) throw error;
      setClinicalHistories(data || []);
    } catch (err) {
      console.error('Error fetching clinical histories:', err);
    } finally {
      setLoadingHistories(false);
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

  const fetchPatientData = async (targetProfId: string, currentUserId: string) => {
    if (loadingPatient) return;
    setLoadingPatient(true);
    try {
      // 1. Check status of current viewer vs this profile
      if (currentUserId !== targetProfId) {
        const { data: status } = await supabase
          .from('patients')
          .select('*')
          .eq('user_id', currentUserId)
          .eq('professional_id', targetProfId)
          .maybeSingle();
        
        setPatientStatus(status);
        setIsPatientOfProf(status?.status === 'accepted');
      }
    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setLoadingPatient(false);
    }
  };

  const requestToBePatient = async () => {
    if (!myProfile) return alert('Faça login primeiro');
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
          alert('Você já é paciente de um profissional ou ja tem um pedido pendente. Só é permitido ter 1 profissional por paciente.');
        } else {
          throw error;
        }
      } else {
        alert('Pedido enviado com sucesso!');
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
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#006747]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <UserIcon className="w-16 h-16 text-gray-200 mb-4" />
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
    posts: profile.is_professional ? posts.length : posts.length || '24',
    streak: 12,
    level: profile.xp_level || 5
  };

  return (
    <div className="pb-20 max-w-4xl mx-auto md:pb-10 pt-4 px-4">
      {/* Dynamic Ad Cover */}
      <AdCarousel location="profiles" category={profile?.specialty || 'Geral'} className="mb-8" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-xl">{user.username}</h1>
        <div className="flex items-center space-x-4">
          {isOwnProfile && (
            <Link 
              to="/settings" 
              className="group relative w-14 h-14 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300"
              title="Definições"
            >
              {/* Organic Intestine Illustration */}
              <svg viewBox="0 20 100 80" className="w-full h-full drop-shadow-md overflow-visible relative z-10">
                <defs>
                  <linearGradient id="intestineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffb7b2" />
                    <stop offset="100%" stopColor="#ff9aa2" />
                  </linearGradient>
                </defs>
                
                {/* Large Intestine (Stylized outer frame) */}
                <path 
                  d="M20,35 C15,35 15,75 25,75 L75,75 C85,75 85,35 75,35 L65,35 C60,35 60,40 65,40 L75,40 C80,40 80,70 75,70 L25,70 C20,70 20,40 25,40 L35,40 C40,40 40,35 35,35 Z" 
                  fill="url(#intestineGrad)" 
                  stroke="#ff8289" 
                  strokeWidth="1.5"
                  className="transition-all duration-700 group-hover:scale-105 group-hover:rotate-2"
                />
                
                {/* Small Intestine (Stylized inner coiling) */}
                <path 
                  d="M40,45 C42,40 48,40 50,45 C52,50 58,50 60,45 C65,40 65,55 60,55 C55,55 50,60 50,65 C50,60 45,55 40,55 C35,55 35,45 40,45" 
                  fill="#ffc1bc" 
                  stroke="#ff8289" 
                  strokeWidth="2" 
                  strokeLinecap="round"
                  className="animate-[pulse_4s_ease-in-out_infinite]"
                />
                
                {/* Texture and Organic gloss effect */}
                <path d="M22,50 Q25,45 28,50" fill="none" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
                <path d="M72,55 Q75,60 78,55" fill="none" stroke="#ff8289" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
              </svg>
              
              {/* Sub-text or tiny icon removed as requested for a pure drawing */}
            </Link>
          )}
        </div>
      </div>

      {/* Profile Bio */}
      <div className="flex flex-row items-center md:items-start space-x-6 md:space-x-12 mb-10">
        <div className="relative flex-shrink-0">
             <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-2 border-[#006747] p-1 shadow-sm">
                <img 
                    src={profile.avatar_url || `https://i.pravatar.cc/150?u=${user.username}`} 
                    className="w-full h-full rounded-full object-cover" 
                    alt="" 
                />
             </div>
             {profile.is_professional && (
                <div className="absolute -bottom-1 -right-1 bg-[#006747] rounded-full p-1.5 border-2 border-white shadow-md">
                    <ShieldCheck className="w-5 h-5 text-white fill-current" />
                </div>
             )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="hidden md:flex items-center space-x-4 mb-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-gray-900">{profile.full_name || profile.username}</h2>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none">@{profile.username}</span>
                {profile.birth_date && (
                  <span className="text-[10px] bg-emerald-50 text-[#006747] px-2 py-0.5 rounded-full font-bold">
                    {calculateAge(profile.birth_date)} anos
                  </span>
                )}
                {profile.province && (
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold flex items-center">
                    <MapPin className="w-2.5 h-2.5 mr-1" />
                    {profile.province}
                  </span>
                )}
              </div>
            </div>
            {isOwnProfile ? (
              <>
                <Link to="/profile/edit" className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors font-sans">Editar Perfil</Link>
                {profile.is_professional && (
                  <Link to="/professional/dashboard" className="bg-[#006747] text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all hover:bg-emerald-800 shadow-sm shadow-emerald-100">Área Profissional</Link>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-2">
                {profile.is_professional && (
                  <button 
                    onClick={handleFollow}
                    className={cn(
                      "px-8 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm",
                      isFollowing 
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200" 
                        : "bg-[#006747] text-white hover:bg-emerald-800 shadow-emerald-100"
                    )}
                  >
                    {isFollowing ? 'A seguir' : 'Seguir'}
                  </button>
                )}
                {profile.is_professional && !isOwnProfile && (
                  <button 
                    onClick={patientStatus?.status === 'pending' ? cancelPatientRequest : requestToBePatient}
                    disabled={loadingPatient || patientStatus?.status === 'accepted'}
                    className={cn(
                      "px-4 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 border-2",
                      patientStatus?.status === 'accepted' ? "bg-emerald-50 border-emerald-100 text-[#006747]" : 
                      patientStatus?.status === 'pending' ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100" :
                      "bg-white border-[#006747]/10 text-[#006747] hover:bg-emerald-50"
                    )}
                  >
                    <HeartPulse className="w-4 h-4" />
                    <span>
                      {patientStatus?.status === 'accepted' ? 'Sou Paciente' : 
                       patientStatus?.status === 'pending' ? 'Cancelar Pedido' : 'Tornar-se Paciente'}
                    </span>
                  </button>
                )}
                <Link 
                  to={`/messages?userId=${profile.id}`}
                  className="bg-white border-2 border-emerald-50 text-[#006747] px-4 py-1.5 rounded-lg text-sm font-bold transition-all hover:bg-emerald-50 flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Mensagem</span>
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden space-y-0.5">
            <h3 className="font-black text-lg text-gray-900 leading-tight">{profile.full_name || profile.username}</h3>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">@{profile.username}</p>
             
             <div className="flex flex-wrap gap-2 mt-2">
                {profile.birth_date && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-bold">
                    {calculateAge(profile.birth_date)} anos
                  </span>
                )}
                {profile.province && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-[10px] font-bold flex items-center">
                    <MapPin className="w-3 h-3 mr-1" />
                    {profile.province}
                  </span>
                )}
             </div>

            {profile?.is_professional && (
               <div className="flex flex-col">
                  <p className="text-xs font-bold text-[#006747]">
                    {profile.specialty} Verificado
                  </p>
                  {proData?.workplace_name && (
                    <p className="text-[10px] text-gray-500 font-medium">🏥 {proData.workplace_name}</p>
                  )}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* Bio and Stats for Mobile (Moved below Avatar+Name row) */}
      <div className="md:hidden mb-8">
        <p className="text-sm text-gray-800 whitespace-pre-wrap mb-6">{user.bio}</p>
        
        <div className="flex md:hidden items-center space-x-2 mb-6">
             {isOwnProfile ? (
               <>
                 <Link to="/profile/edit" className="flex-1 bg-gray-100 py-2 rounded-lg text-sm font-bold text-center">Editar Perfil</Link>
                 {profile.is_professional && (
                    <Link to="/professional/dashboard" className="flex-1 bg-[#006747] text-white py-2 rounded-lg text-sm font-bold text-center">Área Pro</Link>
                 )}
               </>
             ) : (
               <div className="flex w-full space-x-2">
                 {profile.is_professional && (
                   <button 
                     onClick={handleFollow}
                     className={cn(
                       "flex-1 py-2 rounded-lg text-sm font-bold text-center transition-all",
                       isFollowing 
                         ? "bg-gray-100 text-gray-700" 
                         : "bg-[#006747] text-white"
                     )}
                   >
                     {isFollowing ? 'A seguir' : 'Seguir'}
                   </button>
                 )}
                 <Link 
                   to={`/messages?userId=${profile.id}`}
                   className="flex-1 bg-white border-2 border-emerald-50 text-[#006747] py-2 rounded-lg text-sm font-bold text-center flex items-center justify-center space-x-2"
                 >
                   <MessageSquare className="w-4 h-4" />
                   <span>Mensagem</span>
                 </Link>
               </div>
             )}
        </div>

        {profile.is_professional && (
          <div className="flex justify-between border-y border-gray-100 py-4">
             <div className="text-center"><span className="font-bold block">{user.posts}</span> <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest">publicações</span></div>
          </div>
        )}
      </div>

      <div className="hidden md:block">
          <div className="flex md:justify-start md:space-x-10 mb-4 md:border-none md:py-0">
             {profile.is_professional && <div className="text-center md:text-left"><span className="font-bold block md:inline">{user.posts}</span> <span className="text-gray-500 text-sm">publicações</span></div>}
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-sm">{user.name}</h3>
            {profile?.is_professional && (
               <div className="flex flex-col space-y-0.5">
                  <p className="text-xs font-bold text-[#006747] flex items-center">
                    {profile.specialty} Verificado
                  </p>
                  {proData?.workplace_name && (
                    <p className="text-[11px] text-gray-500 font-medium">🏥 {proData.workplace_name}</p>
                  )}
               </div>
            )}
            <p className="text-sm text-gray-800 whitespace-pre-wrap mt-2">{user.bio}</p>
          </div>
      </div>

      {/* Quick Access Grid - Mobile Only */}
      {isOwnProfile && (
        <div className="mb-6 md:hidden">
          <div className="flex items-center space-x-2 mb-3 px-1">
            <LayoutDashboard className="w-3 h-3 text-[#006747]" />
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Atalhos</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Link to="/" className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group active:scale-90">
               <Stethoscope className="w-5 h-5 text-[#006747] group-hover:scale-110 transition-transform" />
            </Link>
            
            <Link to="/explore" className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group active:scale-90">
               <Microscope className="w-5 h-5 text-[#006747] group-hover:scale-110 transition-transform" />
            </Link>

            <Link to="/reels" className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group active:scale-90">
               <Film className="w-5 h-5 text-[#006747] group-hover:scale-110 transition-transform" />
            </Link>

            <Link to="/messages" className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group active:scale-90">
               <MessageSquare className="w-5 h-5 text-[#006747] group-hover:scale-110 transition-transform" />
            </Link>

            {profile.is_professional ? (
              <Link to="/create" className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group active:scale-90">
                <Hospital className="w-5 h-5 text-[#006747] group-hover:scale-110 transition-transform" />
              </Link>
            ) : (
              <Link to="/gamification" className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group active:scale-90">
                <Apple className="w-5 h-5 text-[#006747] group-hover:scale-110 transition-transform" />
              </Link>
            )}

            <Link to="/appointments" className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group active:scale-90">
               <CalendarCheck2 className="w-5 h-5 text-[#006747] group-hover:scale-110 transition-transform" />
            </Link>

            <Link to="/marketplace" className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:border-emerald-100 hover:bg-emerald-50/30 transition-all group active:scale-90">
               <Pill className="w-5 h-5 text-[#006747] group-hover:scale-110 transition-transform" />
            </Link>

            <div className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl hover:border-red-100 hover:bg-red-50/30 transition-all group active:scale-90 cursor-pointer" onClick={() => signOut()}>
               <LogOut className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {/* Profile Completion Score Card */}
      {isOwnProfile && calculateCompletionScore() < 100 && (
        <div className="mb-6 bg-white rounded-[2rem] p-6 shadow-sm border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                <UserIcon className="w-3 h-3 text-[#006747]" />
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
              to="/profile/edit"
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
        <div className="grid grid-cols-3 gap-2 mb-10">
          <div className="bg-emerald-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Apple className="w-6 h-6 text-[#006747] mb-2" />
              <span className="text-[10px] uppercase font-bold text-[#006747] opacity-60">Nível XP</span>
              <span className="text-lg font-bold text-[#006747]">{user.level}</span>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <HeartPulse className="w-6 h-6 text-orange-500 mb-2" />
              <span className="text-[10px] uppercase font-bold text-orange-500 opacity-60">Sessão</span>
              <span className="text-lg font-bold text-orange-500">{user.streak} Dias</span>
          </div>
          <div className="bg-indigo-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
              <Award className="w-6 h-6 text-indigo-600 mb-2" />
              <span className="text-[10px] uppercase font-bold text-indigo-600 opacity-60">Vitus</span>
              <span className="text-lg font-bold text-indigo-600">{balance}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-t border-gray-200">
        <div className="flex overflow-x-auto scrollbar-hide px-4 md:px-0 space-x-8 md:space-x-12 md:justify-center">
          {profile.is_professional && (
            <button 
              onClick={() => setActiveTab('services')}
              className={`flex items-center space-x-2 py-4 border-t whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest leading-none ${activeTab === 'services' ? 'border-black text-black -mt-[1px]' : 'border-transparent text-gray-400'}`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>Serviços</span>
            </button>
          )}

          {isOwnProfile && profile.is_professional && (
            <Link 
              to="/professional/patients"
              className={`flex items-center space-x-2 py-4 border-t whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest leading-none border-transparent text-gray-400 hover:text-black`}
            >
              <Users className="w-4 h-4" />
              <span>Pacientes</span>
            </Link>
          )}

          {profile.is_professional && (
            <button 
              onClick={() => setActiveTab('posts')}
              className={`flex items-center space-x-2 py-4 border-t whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest leading-none ${activeTab === 'posts' ? 'border-black text-black -mt-[1px]' : 'border-transparent text-gray-400'}`}
            >
              <Dna className="w-4 h-4" />
              <span>Publicações</span>
            </button>
          )}

          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center space-x-2 py-4 border-t whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest leading-none ${activeTab === 'appointments' ? 'border-black text-black -mt-[1px]' : 'border-transparent text-gray-400'}`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Agenda</span>
            </button>
          )}

          {profile.is_professional && (
            <button 
              onClick={() => setActiveTab('reels')}
              className={`flex items-center space-x-2 py-4 border-t whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest leading-none ${activeTab === 'reels' ? 'border-black text-black -mt-[1px]' : 'border-transparent text-gray-400'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Reels</span>
            </button>
          )}

          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('prescriptions')}
              className={`flex items-center space-x-2 py-4 border-t whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest leading-none ${activeTab === 'prescriptions' ? 'border-black text-black -mt-[1px]' : 'border-transparent text-gray-400'}`}
            >
              <Pill className="w-4 h-4" />
              <span>Receitas</span>
            </button>
          )}

          {(isOwnProfile || (myProfile?.is_professional)) && (
            <button 
              onClick={() => setActiveTab('clinical_history')}
              className={`flex items-center space-x-2 py-4 border-t whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest leading-none ${activeTab === 'clinical_history' ? 'border-black text-black -mt-[1px]' : 'border-transparent text-gray-400'}`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>Histórico Clínico</span>
            </button>
          )}

          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('orders')}
              className={`flex items-center space-x-2 py-4 border-t whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest leading-none ${activeTab === 'orders' ? 'border-black text-black -mt-[1px]' : 'border-transparent text-gray-400'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Encomendas</span>
            </button>
          )}
          
          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('communities')}
              className={`flex items-center space-x-2 py-4 border-t whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest leading-none ${activeTab === 'communities' ? 'border-black text-black -mt-[1px]' : 'border-transparent text-gray-400'}`}
            >
              <Users className="w-4 h-4" />
              <span>Meus Grupos</span>
            </button>
          )}

          {isOwnProfile && (
            <button 
              onClick={() => setActiveTab('saved')}
              className={`flex items-center space-x-2 py-4 border-t whitespace-nowrap transition-all text-xs font-bold uppercase tracking-widest leading-none ${activeTab === 'saved' ? 'border-black text-black -mt-[1px]' : 'border-transparent text-gray-400'}`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Guardado</span>
            </button>
          )}
        </div>

        {/* Post Grid or Other Content */}
        <div className="mt-4">
          {activeTab === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
              {loadingServices ? (
                <div className="col-span-full flex justify-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin text-[#006747] opacity-20" />
                </div>
              ) : services.length > 0 ? (
                services.map(svc => (
                  <ServiceCard 
                    key={svc.id} 
                    svc={svc} 
                    user={myProfile} 
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

          {activeTab === 'prescriptions' && (
            <div className="space-y-4 px-2">
              {loadingPrescriptions ? (
                <div className="flex justify-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin text-[#006747] opacity-20" />
                </div>
              ) : prescriptions.length > 0 ? (
                prescriptions.map(presc => (
                  <Link 
                    key={presc.id} 
                    to={`/verificar-receita/${presc.id}`}
                    className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm flex items-center justify-between group hover:border-[#006747]/20 transition-all"
                  >
                    <div className="flex items-center space-x-5">
                       <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-[#006747]" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-[#006747] uppercase tracking-widest mb-1">
                            Emitida por {presc.professional?.full_name}
                          </p>
                          <h4 className="text-lg font-black text-gray-900 tracking-tighter mb-1">{presc.medication}</h4>
                          <div className="flex items-center space-x-3 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                             <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {presc.frequency}
                             </span>
                             <span className="flex items-center">
                                <CalendarCheck2 className="w-3 h-3 mr-1" />
                                {new Date(presc.created_at).toLocaleDateString('pt-PT')}
                             </span>
                          </div>
                       </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <div className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 mb-2">
                          <span className="text-[9px] font-mono font-bold text-gray-500">{presc.signature_code}</span>
                       </div>
                       <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#006747] transition-colors" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                   <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                      <Pill className="w-8 h-8 text-gray-200" />
                   </div>
                   <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Sem receitas médicas</p>
                   <p className="text-xs text-gray-400 px-10">As suas receitas médicas digitais aparecerão aqui após serem emitidas por um profissional.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'clinical_history' && (
            <div className="space-y-6 px-2 pb-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-gray-900 font-black uppercase tracking-widest text-xs">Registos do Paciente</h3>
                {myProfile?.is_professional && (
                   <Link 
                     to={`/professional/clinical-history/${profile.id}`}
                     className="bg-[#006747] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all flex items-center space-x-2 shadow-lg shadow-emerald-50"
                   >
                     <span>Nova História</span>
                   </Link>
                )}
              </div>

              {loadingHistories ? (
                <div className="flex justify-center py-20">
                   <Loader2 className="w-10 h-10 animate-spin text-[#006747] opacity-20" />
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
                            <h4 className="font-black text-gray-900 text-base leading-none mb-1.5">{history.primaryDiagnosis}</h4>
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
                        <div className={cn(
                          "px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest",
                          history.referral === 'Sem referenciação' ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"
                        )}>
                          {history.referral}
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
                            <p className="text-xs font-black text-gray-900">{history.bloodPressure}</p>
                         </div>
                         <div className="p-3 bg-gray-50 rounded-2xl">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">SpO2</p>
                            <p className="text-xs font-black text-[#006747]">{history.spo2}%</p>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Queixa Principal</p>
                            <p className="text-xs text-gray-600 line-clamp-2">{history.mainComplaint}</p>
                         </div>
                         <div className="pt-3 border-t border-gray-50">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Notas Clínicas</p>
                            <p className="text-xs text-gray-600 whitespace-pre-wrap">{history.clinicalNotes}</p>
                         </div>
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

          {activeTab === 'orders' && (
            <div className="space-y-4 px-2">
              {loadingOrders ? (
                <div className="flex justify-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin text-[#006747] opacity-20" />
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
                   <Link to="/marketplace" className="mt-6 inline-block text-[#006747] font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-2xl hover:bg-emerald-100 transition-all">Ir para a Loja</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'appointments' && (
            <div className="space-y-4 px-2">
              {loadingAppointments ? (
                <div className="flex justify-center py-12">
                   <Loader2 className="w-8 h-8 animate-spin text-[#006747] opacity-20" />
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
                   <Link to="/appointments" className="mt-6 inline-block text-[#006747] font-black text-[10px] uppercase tracking-widest bg-emerald-50 px-6 py-3 rounded-2xl hover:bg-emerald-100 transition-all">Explorar Serviços</Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              {loadingPosts ? (
                <div className="col-span-3 flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="aspect-square bg-gray-100 hover:opacity-90 transition-opacity cursor-pointer overflow-hidden rounded-lg border border-gray-100">
                    <img src={post.image_url || post.content_url} className="w-full h-full object-cover" alt="" />
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-20 text-center">
                  <Dna className="w-8 h-8 text-gray-100 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sem Publicações</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reels' && (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1 md:gap-2">
              {loadingReels ? (
                <div className="col-span-full flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : reels.length > 0 ? (
                reels.map((reel) => (
                  <div key={reel.id} className="aspect-[9/16] bg-black hover:opacity-90 transition-opacity cursor-pointer overflow-hidden rounded-lg relative">
                    <video src={`${reel.video_url}#t=0.1`} className="w-full h-full object-cover" preload="metadata" playsInline />
                    {!reel.is_approved && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">
                        Pendente
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <ShieldCheck className="w-8 h-8 text-gray-100 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sem Reels</p>
                </div>
              )}
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
                    <div className="col-span-full flex flex-col items-center justify-center py-20">
                       <Loader2 className="w-8 h-8 animate-spin text-[#006747] opacity-20" />
                    </div>
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
                <div className="col-span-full flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
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



        </div>
      </div>

      <CreateCommunityModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => fetchUserCommunities(profile.id)}
      />
    </div>
  );
}
