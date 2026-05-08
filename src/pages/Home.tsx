import { useState, useEffect } from 'react';
import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { StoriesBar } from '../components/feed/StoriesBar';
import { CreateReelModal } from '../components/feed/CreateReelModal';
import { FeedPost } from '../components/feed/FeedPost';
import { cn } from '../lib/utils';
import { 
  ShieldCheck, 
  Plus, 
  ImagePlus, 
  Syringe, 
  Loader2, 
  Trophy, 
  TrendingUp, 
  Coins, 
  HeartPulse,
  User,
  Activity,
  Check
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVitus } from '../hooks/useVitus';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, type Post } from '../lib/supabase';
import CreateCommunityModal from '../components/modals/CreateCommunityModal';

import { DEFAULT_AVATAR } from '../lib/constants';

export default function Home() {
  const [activeTab, setActiveTab] = useState<any>('para_ti');
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { balance, addVitus } = useVitus();

  const [posts, setPosts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<Set<string>>(new Set());
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (profile && !loadingPosts) {
      const essentialFields = [
        'full_name', 
        'birth_date', 
        'gender', 
        'id_card_number', 
        'province', 
        'municipality',
        'address'
      ] as const;
      
      const isMissingSomething = essentialFields.some(field => !profile[field as keyof typeof profile]);
      
      if (isMissingSomething) {
        // Show modal after a short delay
        const timer = setTimeout(() => {
          setShowCompleteProfileModal(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [profile, loadingPosts]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateReelModal, setShowCreateReelModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [userPrescriptions, setUserPrescriptions] = useState<any[]>([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(true);
  const [recentPatients, setRecentPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [suggestedProfessionals, setSuggestedProfessionals] = useState<any[]>([]);

  // Helper to check if a medication is active at a certain hour
  const isPeriodActiveAt = (freqStr: string, hour: number) => {
    const f = (freqStr || "").toLowerCase();
    // 1x ao dia ou 24 em 24h
    if (f.includes('1x') || f.includes('24/24') || f.includes('24h')) return hour === 8;
    // 2x ao dia ou 12 em 12h
    if (f.includes('2x') || f.includes('12/12') || f.includes('12h')) return [8, 20].includes(hour);
    // 3x ao dia ou 8 em 8h
    if (f.includes('3x') || f.includes('8/8') || f.includes('8h')) return [8, 16, 0].includes(hour);
    // 4x ao dia ou 6 em 6h
    if (f.includes('4x') || f.includes('6/6') || f.includes('6h')) return [6, 12, 18, 0].includes(hour);
    // 6x ao dia ou 4 em 4h
    if (f.includes('6x') || f.includes('4/4') || f.includes('4h')) return [4, 8, 12, 16, 20, 0].includes(hour);
    return false;
  };

  const getTodaySchedule = () => {
    const todaySchedule: any[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    userPrescriptions.forEach(presc => {
        const dateStr = presc.start_date || presc.created_at;
        const startDate = new Date(dateStr);
        
        // Use local day values to avoid UTC shift issues
        const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        const diffTime = todayDay.getTime() - startDay.getTime();
        const daysSinceStart = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (presc.items && Array.isArray(presc.items)) {
          presc.items.forEach((item: any, idx: number) => {
              const durationDays = parseInt(item.duration) || 0;
              if (daysSinceStart >= 0 && daysSinceStart < durationDays) {
                  // Check all possible hours
                  [0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].forEach(hour => {
                      if (isPeriodActiveAt(item.frequency, hour)) {
                          const doseKey = `${idx}-${daysSinceStart}-${hour}`;
                          const isTaken = (presc.taken_doses && presc.taken_doses[doseKey]) || false;
                          todaySchedule.push({
                              medication: item.medication,
                              hour,
                              isTaken,
                              dosage: item.dosage || '1',
                              form: item.form || 'Comp.',
                              prescId: presc.id,
                              doseKey,
                              isUpcoming: hour >= currentHour
                          });
                      }
                  });
              }
          });
        }
    });
    
    return todaySchedule.sort((a, b) => a.hour - b.hour);
  };

  const todaySchedule = React.useMemo(() => getTodaySchedule(), [userPrescriptions, profile]);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientPrescriptions, setSelectedPatientPrescriptions] = useState<any[]>([]);
  const [loadingPatientTracking, setLoadingPatientTracking] = useState(false);

  const fetchPatientTracking = async (patientId: string) => {
    setLoadingPatientTracking(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          items:prescription_items(*)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSelectedPatientPrescriptions(data || []);
    } catch (err) {
      console.error('Error fetching patient tracking:', err);
    } finally {
      setLoadingPatientTracking(false);
    }
  };

  const handleToggleDoseInFeed = async (prescId: string, doseKey: string) => {
    const presc = userPrescriptions.find(p => p.id === prescId);
    if (!presc) return;

    const now = new Date();
    const newTakenDoses = { 
      ...(presc.taken_doses || {}), 
      [doseKey]: presc.taken_doses?.[doseKey] ? false : now.toISOString() 
    } as Record<string, string | boolean>;
    
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ taken_doses: newTakenDoses })
        .eq('id', prescId);
      
      if (error) throw error;
      fetchUserPrescriptions();
    } catch (err) {
      console.error('Error recording dose from feed:', err);
    }
  };

  // Post Form State
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostFile, setNewPostFile] = useState<File | null>(null);
  const [newPostCategory, setNewPostCategory] = useState('Saúde Pública');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
    fetchGroups();
    if (user) {
      fetchUserMemberships();
      fetchUserPrescriptions();
      fetchSuggestedProfessionals();
      if (profile?.is_professional) {
        fetchRecentPatients();
      }
    } else {
      fetchSuggestedProfessionals();
    }
  }, [user, activeTab, profile?.is_professional]);

  const fetchSuggestedProfessionals = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_professional', true)
        .limit(5);
      
      if (error) throw error;
      if (data) setSuggestedProfessionals(data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const fetchRecentPatients = async () => {
    if (!user || !profile?.is_professional) return;
    setLoadingPatients(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          patient_id,
          created_at,
          profiles:patient_id (
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('professional_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const uniquePatients: any[] = [];
      const seen = new Set();
      data?.forEach(p => {
        if (!seen.has(p.patient_id)) {
          seen.add(p.patient_id);
          const profileData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
          uniquePatients.push({
            patient_id: p.patient_id,
            patient_name: profileData?.full_name || 'Paciente',
            patient_username: profileData?.username || 'viva_user',
            created_at: p.created_at
          });
        }
      });
      
      setRecentPatients(uniquePatients.slice(0, 5));
    } catch (err) {
      console.error('Error fetching recent patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchUserPrescriptions = async () => {
    if (!user) return;
    setLoadingPrescriptions(true);
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          items:prescription_items(*)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        // Ensure items is an array
        const parsedData = data.map(p => ({
          ...p,
          items: Array.isArray(p.items) ? p.items : []
        }));
        setUserPrescriptions(parsedData);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const fetchUserMemberships = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('health_group_members')
        .select('group_id')
        .eq('user_id', user.id);
      
      if (error) {
        // Table might not exist yet, don't crash
        if (error.code === 'PGRST205') {
          console.warn('Membership table not found. Please run the SQL migration.');
        } else {
          console.error('Error fetching memberships:', error);
        }
        return;
      }
      if (data) {
        setUserGroups(new Set(data.map(m => m.group_id)));
      }
    } catch (err) {
      console.error('Error in fetchUserMemberships:', err);
    }
  };

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const { data, error } = await supabase
        .from('health_groups')
        .select('*')
        .order('member_count', { ascending: false });
      
      if (error) throw error;
      if (data) setGroups(data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleJoinGroup = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    if (!user) return;

    const isMember = userGroups.has(groupId);

    try {
      if (isMember) {
        const { error } = await supabase
          .from('health_group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', user.id);
        
        if (error) throw error;

        setUserGroups(prev => {
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        });

        // Update local count
        setGroups(prev => prev.map(g => 
          g.id === groupId ? { ...g, member_count: Math.max(0, (g.member_count || 1) - 1) } : g
        ));
      } else {
        const { error } = await supabase
          .from('health_group_members')
          .insert({
            group_id: groupId,
            user_id: user.id
          });
        
        if (error) {
          if (error.code === '23503') {
             alert('Erro: Perfil de utilizador não encontrado. Por favor, recarregue a página ou faça login novamente.');
          } else {
             alert(`Erro ao aderir ao grupo: ${error.message}`);
          }
          throw error;
        }

        setUserGroups(prev => {
          const next = new Set(prev);
          next.add(groupId);
          return next;
        });

        // Update local count
        setGroups(prev => prev.map(g => 
          g.id === groupId ? { ...g, member_count: (g.member_count || 0) + 1 } : g
        ));
      }
    } catch (err) {
      console.error('Error joining/leaving group:', err);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url,
            is_professional
          ),
          likes!left (
            user_id
          )
        `)
        .neq('category', 'Reels')
        .order('created_at', { ascending: false });

      if (activeTab === 'a_seguir' && user) {
        // Fetch IDs of professionals the user follows
        const { data: followData, error: followError } = await supabase
          .from('professional_followers')
          .select('professional_id')
          .eq('follower_id', user.id);

        if (followError) throw followError;
        
        const followedIds = followData.map(f => f.professional_id);
        
        if (followedIds.length > 0) {
          query = query.in('user_id', followedIds);
        } else {
          // If not following anyone, clear posts and return early
          setPosts([]);
          setLoadingPosts(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const formattedPosts = data.map(p => ({
          id: p.id,
          user: {
            id: p.profiles?.id,
            username: p.profiles?.username || 'viva_user',
            avatar: p.profiles?.avatar_url || DEFAULT_AVATAR,
            isProf: p.profiles?.is_professional || false
          },
          content: p.image_url || p.content_url,
          caption: p.caption,
          likes: p.likes_count || 0,
          category: p.category,
          isLiked: user ? (p.likes || []).some((l: any) => l.user_id === user.id) : false,
          time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setPosts(formattedPosts);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile?.is_professional || !newPostFile) return;

    setIsSubmitting(true);
    try {
      const fileExt = newPostFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `posts/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, newPostFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content_url: publicUrl,
          image_url: publicUrl,
          caption: newPostCaption,
          category: newPostCategory,
          likes_count: 0
        });

      if (error) throw error;
      
      setNewPostCaption('');
      setNewPostFile(null);
      setShowCreateModal(false);
      fetchPosts();
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20 md:pb-0 min-h-screen bg-[#dae0e6]">
      <Header />
      
      <div className="max-w-[1200px] mx-auto flex justify-center md:pt-8 lg:px-4">
        {/* Main Feed Container */}
        <div className="w-full max-w-[700px] flex flex-col">
          
          {/* Create Post Action (Professionals) */}
          {profile?.is_professional && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm mx-4 md:mx-0">
               <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-left px-4 py-2.5 rounded-full text-sm text-gray-400 transition-colors font-medium border border-gray-100"
                  >
                    Partilhar conhecimento de saúde...
                  </button>
                  <button onClick={() => setShowCreateModal(true)} className="p-2 text-[#006747] hover:bg-emerald-50 rounded-full transition-colors">
                    <ImagePlus className="w-6 h-6" />
                  </button>
               </div>
            </div>
          )}

          {/* Feed Switcher - Instagram Style */}
          <div className="flex bg-white border border-gray-200 rounded-xl mb-4 mx-4 md:mx-0 overflow-hidden shadow-sm">
             <button 
                onClick={() => setActiveTab('para_ti')}
                className={cn(
                    "flex-1 md:flex-none md:mr-8 py-3 md:py-0 text-sm font-semibold transition-colors relative",
                    activeTab === 'para_ti' ? "text-black" : "text-gray-400"
                )}
             >
                Para ti
                {activeTab === 'para_ti' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black md:hidden" />}
             </button>
             <button 
                onClick={() => setActiveTab('a_seguir')}
                className={cn(
                    "flex-1 md:flex-none md:mr-8 py-3 md:py-0 text-sm font-semibold transition-colors relative",
                    activeTab === 'a_seguir' ? "text-black" : "text-gray-400"
                )}
             >
                A seguir
                {activeTab === 'a_seguir' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black md:hidden" />}
             </button>
             <button 
                onClick={() => setActiveTab('grupos')}
                className={cn(
                    "flex-1 md:flex-none py-3 md:py-0 text-sm font-semibold transition-colors relative",
                    activeTab === 'grupos' ? "text-black" : "text-gray-400"
                )}
             >
                Grupos
                {activeTab === 'grupos' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-black md:hidden" />}
             </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'para_ti' && (
                <>
                  <StoriesBar />
                  <div className="md:mt-4">
                    {loadingPosts ? (
                      <div className="flex flex-col items-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#006747] mb-2" />
                        <p className="text-gray-400 text-sm">A carregar publicações...</p>
                      </div>
                    ) : posts.length > 0 ? (
                      posts.map(post => (
                        <FeedPost key={post.id} post={post} />
                      ))
                    ) : (
                      <div className="text-center py-20 px-6">
                        <p className="text-gray-400 text-sm italic">Nenhuma publicação oficial disponível ainda.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'a_seguir' && (
                <div className="md:mt-4">
                  {loadingPosts ? (
                    <div className="flex flex-col items-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-[#006747] mb-2" />
                      <p className="text-gray-400 text-sm">A carregar publicações...</p>
                    </div>
                  ) : posts.length > 0 ? (
                    posts.map(post => (
                      <FeedPost key={post.id} post={post} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                        <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center mb-4">
                            <ShieldCheck className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="font-bold text-lg">Sem publicações novas</h3>
                        <p className="text-gray-500 text-sm mt-1">Siga novos profissionais de saúde para ver o conteúdo aqui.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'grupos' && (
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center mb-2 px-2">
                    <h2 className="font-bold text-lg text-gray-900 tracking-tight">Grupos de Literacia</h2>
                    {profile?.is_professional && (
                      <button 
                        onClick={() => setShowCreateGroupModal(true)}
                        className="bg-[#006747] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2 active:scale-95 transition-all"
                      >
                         <Plus className="w-4 h-4" />
                         <span>Criar Novo</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {loadingGroups ? (
                      <div className="flex flex-col items-center justify-center py-20">
                         <Loader2 className="w-8 h-8 animate-spin text-[#006747] opacity-30" />
                         <p className="text-xs text-gray-400 mt-4 font-medium">A procurar grupos...</p>
                      </div>
                    ) : groups.length > 0 ? (
                      groups.map(group => (
                        <div 
                          key={group.id} 
                          onClick={() => navigate(`/c/${encodeURIComponent(group.name)}`)}
                          className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-emerald-200 transition-all hover:shadow-md group cursor-pointer"
                        >
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-inner"
                              style={{ backgroundColor: group.theme_color || '#006747' }}
                            >
                              {group.name[0]}
                            </div>
                            <div>
                               <h4 
                                 className="font-bold text-base text-gray-900 group-hover:text-[#006747] transition-colors"
                               >
                                 g/{group.name}
                               </h4>
                               <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-xs text-gray-400 font-medium">
                                    {group.member_count || 0} membros
                                  </p>
                                  <span className="text-[10px] text-gray-200">•</span>
                                  <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest bg-gray-50 px-2 py-0.5 rounded-full">
                                    {group.category || 'Saúde'}
                                  </p>
                               </div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => handleJoinGroup(e, group.id)}
                            className={cn(
                              "px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm border",
                              userGroups.has(group.id)
                                ? "bg-white text-gray-400 border-gray-100 hover:bg-gray-50"
                                : "bg-[#006747] text-white border-[#006747] hover:bg-emerald-800"
                            )}
                          >
                            {userGroups.has(group.id) ? 'Aderido' : 'Aderir'}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
                         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Plus className="w-8 h-8 text-gray-200" />
                         </div>
                         <h4 className="font-bold text-gray-400">Nenhum grupo encontrado</h4>
                         <p className="text-xs text-gray-300 mt-2 max-w-[200px] mx-auto">Seja o primeiro a criar uma comunidade de saúde em Portugal.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Community Modal */}
        <CreateCommunityModal 
          isOpen={showCreateGroupModal} 
          onClose={() => setShowCreateGroupModal(false)} 
          onCreated={fetchGroups} 
        />

        {/* Create Post Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreateModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10"
              >
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                   <h3 className="font-bold text-lg">Nova Publicação Oficial</h3>
                   <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-black">
                     <Plus className="w-6 h-6 rotate-45" />
                   </button>
                </div>
                <form onSubmit={handleCreatePost} className="p-6 space-y-4">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Categoria</label>
                      <select 
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#006747]"
                      >
                         <option value="Saúde Pública">Saúde Pública</option>
                         <option value="Nutrição">Nutrição</option>
                         <option value="Atividade Física">Atividade Física</option>
                         <option value="Saúde Mental">Saúde Mental</option>
                         <option value="Bem-estar">Bem-estar</option>
                      </select>
                   </div>
                   
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Legenda / Conteúdo</label>
                      <textarea 
                        value={newPostCaption}
                        onChange={(e) => setNewPostCaption(e.target.value)}
                        placeholder="O que quer partilhar com a comunidade?"
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#006747] min-h-[100px] resize-none"
                        required
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase font-sans">Conteúdo Visual (Imagem)</label>
                      <div 
                        onClick={() => document.getElementById('post-file-input')?.click()}
                        className="relative border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                      >
                        {newPostFile ? (
                          <div className="text-center">
                            <ImagePlus className="w-8 h-8 text-[#006747] mx-auto mb-2" />
                            <p className="text-sm font-bold text-gray-700">{newPostFile.name}</p>
                            <p className="text-[10px] text-gray-400">Clique para mudar</p>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Plus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm font-medium text-gray-400">Carregar fotografia ou infográfico</p>
                          </div>
                        )}
                        <input 
                          id="post-file-input"
                          type="file"
                          accept="image/*"
                          onChange={(e) => setNewPostFile(e.target.files?.[0] || null)}
                          className="hidden"
                          required
                        />
                      </div>
                   </div>

                   <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#006747] text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-emerald-800 transition-all disabled:opacity-50"
                   >
                     {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                       <>
                         <Syringe className="w-4 h-4 mr-2" />
                         <span>Publicar no Feed SNS</span>
                       </>
                     )}
                   </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Right Sidebar - Desktop Only Suggestions */}
        <aside className="hidden lg:block w-[320px] ml-12 py-4">
           {/* Current User Info */}
            <Link to="/perfil" className="flex items-center justify-between mb-6 group">
              <div className="flex items-center space-x-3">
                 <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform bg-gray-50 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-gray-300" />
                    )}
                 </div>
                 <div>
                    <p className="text-sm font-bold leading-none group-hover:text-[#006747] transition-colors">{profile?.username || 'viva_user'}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {profile?.is_professional ? (
                        <span className="text-[#006747] font-bold">Profissional de Saúde</span>
                      ) : (
                        'Comunidade VIVA+'
                      )}
                    </p>
                 </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-[#006747]">Perfil</span>
           </Link>
           {/* Suggestions Header */}
           <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-gray-400">Profissionais Sugeridos</h4>
              <button className="text-xs font-bold hover:text-gray-500">Ver tudo</button>
           </div>

           {/* Suggestions List */}
           <div className="space-y-4">
              {suggestedProfessionals.length > 0 ? suggestedProfessionals.map((sug) => (
                <div key={sug.id} className="flex justify-between items-center">
                    <Link to={`/search?q=${sug.username}`} className="flex items-center space-x-3 group">
                        <div className="w-8 h-8 rounded-full overflow-hidden group-hover:scale-105 transition-transform border border-gray-100 bg-gray-50 flex items-center justify-center">
                            {sug.avatar_url ? (
                                <img src={sug.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 text-gray-300" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center">
                              <p className="text-sm font-bold leading-none group-hover:text-[#006747] transition-colors">{sug.username}</p>
                              {sug.is_professional && <ShieldCheck className="w-3 h-3 text-[#006747] ml-1 fill-current" />}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{sug.specialty || 'Profissional SNS'}</p>
                        </div>
                    </Link>
                    <button className="text-xs font-bold text-[#006747] hover:text-emerald-800">Seguir</button>
                </div>
              )) : (
                <p className="text-[10px] text-gray-400 italic">A procurar especialistas...</p>
              )}
           </div>

           {/* Dose Diária / Medicação de hoje - Real Data Companion */}
           <div className="mt-10 bg-emerald-50 rounded-[2rem] p-6 border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform">
                 <Syringe className="w-16 h-16 text-[#006747]" />
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                 <div className="bg-[#006747] p-1.5 rounded-lg text-white">
                    <HeartPulse className="w-3 h-3" />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#006747]">
                   {profile?.is_professional ? 'Pacientes Recentes' : 'Medicação de hoje'}
                 </h4>
              </div>
              
              <div className="space-y-4">
                  {profile?.is_professional ? (
                    recentPatients.length > 0 ? (
                      recentPatients.map((p, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-all" 
                          onClick={() => {
                            setSelectedPatientId(p.patient_id);
                            fetchPatientTracking(p.patient_id);
                          }}
                        >
                           <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-emerald-100 flex items-center justify-center text-[10px] font-bold text-[#006747]">
                                {p.patient_name[0]}
                              </div>
                              <div>
                                 <p className="text-[11px] font-bold text-gray-700 truncate max-w-[120px]">{p.patient_name}</p>
                                 <p className="text-[9px] text-gray-400 font-bold uppercase">@{p.patient_username || 'paciente'}</p>
                              </div>
                           </div>
                           <Activity className="w-3.5 h-3.5 text-gray-200 group-hover:text-[#006747] transition-colors" />
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-400 text-center py-4 italic">Nenhuma receita emitida recentemente.</p>
                    )
                  ) : (
                    /* Patient: Show doses from ALL active prescriptions */
                    (() => {
                      if (loadingPrescriptions) return (
                        <div className="flex justify-center py-6">
                           <Loader2 className="w-5 h-5 animate-spin text-[#006747] opacity-20" />
                        </div>
                      );
                      
                      if (userPrescriptions.length === 0) return (
                        <p className="text-[10px] text-gray-400 text-center py-4 italic font-medium">Nenhuma receita ativa.</p>
                      );
                      
                      if (todaySchedule.length === 0) {
                         return (
                           <div className="text-center py-4">
                              <p className="text-[11px] font-bold text-emerald-800">Tudo em dia!</p>
                              <p className="text-[10px] text-emerald-600/60 mt-1">Nenhuma medicação pendente para hoje.</p>
                           </div>
                         );
                      }
                      
                      return (
                        <div className="space-y-4">
                          {todaySchedule.slice(0, 4).map((item, idx) => (
                            <div key={`${item.prescId}-${item.doseKey}`} className="flex items-center justify-between group px-1">
                               <div className="flex items-center space-x-3">
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    item.isTaken ? "bg-gray-200" : "bg-[#006747] shadow-[0_0_8px_rgba(0,103,71,0.4)]"
                                  )} />
                                  <div>
                                     <p className={cn("text-[11px] font-bold text-gray-700 leading-tight", item.isTaken && "line-through text-gray-400")}>
                                       {item.medication}
                                     </p>
                                     <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                                       {item.hour.toString().padStart(2, '0')}:00 • {item.dosage} {item.form}
                                     </p>
                                  </div>
                               </div>
                               {!item.isTaken ? (
                                 <button 
                                   onClick={(e) => {
                                     e.preventDefault();
                                     handleToggleDoseInFeed(item.prescId, item.doseKey);
                                   }}
                                   className="text-[9px] font-black text-[#006747] bg-white px-2 py-1.5 rounded-lg border border-emerald-100 shadow-sm active:scale-95 transition-all hover:bg-emerald-50"
                                 >
                                   Tomar
                                 </button>
                               ) : (
                                 <span className="text-[9px] font-black text-gray-300 uppercase select-none">Ok</span>
                               )}
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  )}
               </div>
               
               <Link 
                 to={profile?.is_professional ? "/professional/dashboard" : "/historico-receitas"}
                 className="w-full mt-5 block text-center py-2.5 bg-white border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#006747] hover:bg-[#006747] hover:text-white transition-all shadow-sm"
               >
                  {profile?.is_professional ? 'Painel de Gestão' : 'Ver Meu Histórico'}
               </Link>
            </div>

           {/* Health Mission Progress */}
           <div className="mt-6 bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Meta Comunitária</h4>
                 <div className="flex -space-x-1.5">
                    {[1,2,3].map(i => (
                       <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                          <img src={`${DEFAULT_AVATAR}&seed=${i}`} className="w-full h-full object-cover" />
                       </div>
                    ))}
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between items-center mb-1.5">
                       <p className="text-xs font-black text-gray-800">Stop Sedentarismo</p>
                       <span className="text-[10px] font-bold text-[#006747]">84%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                       <div className="w-[84%] h-full bg-gradient-to-r from-emerald-400 to-[#006747] rounded-full" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Small Footer */}
           <div className="mt-10 text-[10px] text-gray-300 font-medium uppercase tracking-widest leading-loose">
              Sobre • Ajuda • Imprensa • Privacidade • Termos • Localizações • Idioma • VIVA verified
              <p className="mt-4">© 2026 VIVA+ DO SNS</p>
           </div>
        </aside>
      </div>

      <AnimatePresence>
        {selectedPatientId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-0 max-w-lg w-full shadow-2xl border border-white/20 relative overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-[#006747]">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">Acompanhamento</h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Estado da Medicação</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPatientId(null)}
                  className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {loadingPatientTracking ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#006747] opacity-20" />
                    <p className="mt-2 text-[10px] text-gray-400 font-black uppercase tracking-widest">Sincronizando...</p>
                  </div>
                ) : selectedPatientPrescriptions.length > 0 ? (
                  selectedPatientPrescriptions.map((presc, pIdx) => (
                    <div key={presc.id} className="bg-gray-50 rounded-3xl p-5 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">#{presc.id.slice(0,6)}</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{new Date(presc.created_at).toLocaleDateString('pt-PT')}</span>
                      </div>

                      <div className="space-y-3">
                        {(() => {
                           const items = Array.isArray(presc.items) ? presc.items : (typeof presc.items === 'string' ? JSON.parse(presc.items) : []);
                           return items.map((item: any, iIdx: number) => (
                            <div key={iIdx} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                                <div>
                                  <p className="text-sm font-bold text-gray-800 leading-none">{item.medication}</p>
                                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">{item.dosage} • {item.frequency}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                {(() => {
                                  // Count taken doses for this specific item
                                  const takenCount = Object.keys(presc.taken_doses || {}).filter(k => k.startsWith(`${iIdx}-`)).length;
                                  const totalPlanned = (parseInt(item.frequency) || 0) * (parseInt(item.duration) || 0);
                                  const perc = totalPlanned > 0 ? (takenCount / totalPlanned) * 100 : 0;
                                  
                                  return (
                                    <div className="flex items-center space-x-3">
                                      <div className="flex flex-col items-end">
                                        <p className="text-xs font-black text-gray-900">{takenCount}/{totalPlanned}</p>
                                        <p className="text-[9px] font-black text-emerald-500 uppercase">{perc.toFixed(0)}%</p>
                                      </div>
                                      <div className="w-10 h-10 rounded-full border-2 border-emerald-50 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-emerald-500 transition-all duration-1000" style={{ height: `${perc}%`, bottom: 0, top: 'auto', opacity: 0.1 }} />
                                        <Check className="w-4 h-4 text-emerald-500" />
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                           ));
                        })()}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-400 italic">Nenhum histórico encontrado.</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => navigate(`/perfil/${selectedPatientId}`)}
                  className="w-full py-4 bg-[#006747] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all active:scale-95 shadow-lg shadow-emerald-100/50"
                >
                  Ver Perfil Completo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateReelModal 
        isOpen={showCreateReelModal} 
        onClose={() => setShowCreateReelModal(false)}
      />

      {/* Complete Profile Notification Modal */}
      <AnimatePresence>
        {showCompleteProfileModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl border border-white/20 relative overflow-hidden"
            >
              {/* Background Decoration */}
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50" />
              
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                  <User className="w-10 h-10 text-[#006747]" />
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">
                  Complete o seu Perfil!
                </h3>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed px-4">
                  A sua segurança e autenticidade são prioritárias. Complete os seus dados essenciais (BI, Província, Município, etc.) para garantir a melhor experiência e acesso total às funcionalidades do VIVA+.
                </p>

                <div className="space-y-3">
                  <Link
                    to="/perfil/editar"
                    className="w-full bg-[#006747] text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-100/50 hover:bg-emerald-800 transition-all active:scale-95"
                  >
                    <span>Completar Agora</span>
                    <HeartPulse className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setShowCompleteProfileModal(false)}
                    className="w-full py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                  >
                    Lembrar-me mais tarde
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
