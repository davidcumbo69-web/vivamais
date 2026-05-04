import { Stethoscope, Dna, ClipboardList, UserCircle as UserIcon, ShieldCheck, Apple, HeartPulse, Award, Users, Loader2, Plus, Brain, CalendarCheck2, ShoppingBag, PackageCheck, Truck, Clock, MessageSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVitus } from '../hooks/useVitus';
import { useParams, Link } from 'react-router-dom';
import { supabase, type HealthProfessional, type HealthGroup } from '../lib/supabase';
import { useState, useEffect } from 'react';
import CreateCommunityModal from '../components/modals/CreateCommunityModal';
import { cn } from '../lib/utils';

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const { profile: myProfile } = useAuth();
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
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved' | 'communities' | 'appointments' | 'orders' | 'services'>('posts');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    const effectiveUserId = userId || myProfile?.id;
    
    if (effectiveUserId && effectiveUserId !== 'undefined') {
      setLoadingProfile(true);
      fetchProfile(effectiveUserId);
    } else if (!userId && !myProfile?.id) {
      setLoadingProfile(false);
    }
  }, [userId, myProfile]);

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
        if (pData.is_professional) {
          fetchUserServices(targetUserId);
        }
        
        fetchFollowData(targetUserId);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-bold text-xl">{user.username}</h1>
        <div className="flex items-center space-x-4">
          <Link to="/settings" className="text-gray-700 hover:text-black transition-colors">
            <Stethoscope className="w-6 h-6" />
          </Link>
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
            <h2 className="text-xl font-semibold">{user.username}</h2>
            {isOwnProfile ? (
              <>
                <Link to="/settings" className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors font-sans">Editar Perfil</Link>
                {profile.is_professional && (
                  <Link to="/professional/dashboard" className="bg-[#006747] text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all hover:bg-emerald-800 shadow-sm shadow-emerald-100">Área Profissional</Link>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-2">
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

          <div className="md:hidden space-y-1">
            <h3 className="font-black text-lg text-gray-900">{user.name}</h3>
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
                 <Link to="/settings" className="flex-1 bg-gray-100 py-2 rounded-lg text-sm font-bold text-center">Editar Perfil</Link>
                 {profile.is_professional && (
                    <Link to="/professional/dashboard" className="flex-1 bg-[#006747] text-white py-2 rounded-lg text-sm font-bold text-center">Área Pro</Link>
                 )}
               </>
             ) : (
               <div className="flex w-full space-x-2">
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

        <div className="flex justify-between border-y border-gray-100 py-4">
           <div className="text-center"><span className="font-bold block">{user.posts}</span> <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest">publicações</span></div>
           <div className="text-center">
              <span className="font-bold block">{user.followers}</span> 
              <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest"> seguidores</span>
           </div>
           <div className="text-center"><span className="font-bold block">{user.following}</span> <span className="text-gray-500 text-[10px] uppercase font-black tracking-widest"> a seguir</span></div>
        </div>
      </div>

      <div className="hidden md:block">
          <div className="flex md:justify-start md:space-x-10 mb-4 md:border-none md:py-0">
             <div className="text-center md:text-left"><span className="font-bold block md:inline">{user.posts}</span> <span className="text-gray-500 text-sm">publicações</span></div>
             <div className="text-center md:text-left">
                <span className="font-bold block md:inline">{user.followers}</span> 
                <span className="text-gray-500 text-sm"> seguidores</span>
             </div>
             <div className="text-center md:text-left"><span className="font-bold block md:inline">{user.following}</span> <span className="text-gray-500 text-sm"> a seguir</span></div>
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
                  <Link 
                    key={svc.id} 
                    to={`/marketplace/service/${svc.id}`}
                    className="bg-white rounded-[2rem] p-4 border border-gray-100 shadow-sm hover:border-[#006747]/20 hover:shadow-md transition-all group flex items-center space-x-4"
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
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                   <HeartPulse className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                   <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Sem serviços listados</p>
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
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              {loadingReels ? (
                <div className="col-span-3 flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : reels.length > 0 ? (
                reels.map((reel) => (
                  <div key={reel.id} className="aspect-[9/16] bg-black hover:opacity-90 transition-opacity cursor-pointer overflow-hidden rounded-lg relative">
                    <video src={reel.video_url} className="w-full h-full object-cover" />
                    {!reel.is_approved && (
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">
                        Pendente
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-20 text-center">
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
            <div className="py-20 text-center">
              <ClipboardList className="w-12 h-12 text-gray-100 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Ainda não guardou nenhuma publicação pública.</p>
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
