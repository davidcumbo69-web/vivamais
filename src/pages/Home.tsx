import { useState, useEffect } from 'react';
import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { StoriesBar } from '../components/feed/StoriesBar';
import { CreateReelModal } from '../components/feed/CreateReelModal';
import { FeedPost } from '../components/feed/FeedPost';
import { cn } from '../lib/utils';
import { ShieldCheck, Plus, ImagePlus, Syringe, Loader2, Trophy, TrendingUp, Coins, HeartPulse } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVitus } from '../hooks/useVitus';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, type Post } from '../lib/supabase';
import CreateCommunityModal from '../components/modals/CreateCommunityModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState<any>('para_ti');
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { balance, addVitus } = useVitus();
  const [posts, setPosts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<Set<string>>(new Set());
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateReelModal, setShowCreateReelModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

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
    }
  }, [user]);

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
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (
          id,
          username,
          avatar_url,
          is_professional
        )
      `)
      .neq('category', 'Reels')
      .order('created_at', { ascending: false });

    if (data) {
      const formattedPosts = data.map(p => ({
        id: p.id,
        user: {
          id: p.profiles?.id,
          username: p.profiles?.username || 'viva_user',
          avatar: p.profiles?.avatar_url || 'https://i.pravatar.cc/150',
          isProf: p.profiles?.is_professional || false
        },
        content: p.image_url || p.content_url,
        caption: p.caption,
        likes: p.likes_count,
        category: p.category,
        time: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
      setPosts(formattedPosts);
    }
    setLoadingPosts(false);
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

  const SUGGESTIONS = [
    { username: 'cruzvermelha_pt', name: 'Cruz Vermelha', avatar: 'https://i.pravatar.cc/150?u=cv', isProf: true },
    { username: 'medico_responde', name: 'Dr. Ricardo M.', avatar: 'https://i.pravatar.cc/150?u=doctor', isProf: true },
    { username: 'yoga_viva', name: 'Yoga Portugal', avatar: 'https://i.pravatar.cc/150?u=yoga', isProf: false }
  ];

  const MOCK_GROUPS = [
    { id: '1', name: 'Diabetes Tipo 2 - Portugal', members: 1240, category: 'Saúde Crónica', prof: 'Dr. Ricardo M.' },
    { id: '2', name: 'Mães e Grávidas SNS', members: 4500, category: 'Maternidade', prof: 'Enfª Helena' },
    { id: '3', name: 'Saúde Mental em Casa', members: 890, category: 'Bem-estar', prof: 'Psic. João' }
  ];

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
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                    <img src={profile?.avatar_url || "https://i.pravatar.cc/150"} alt="" className="w-full h-full object-cover" />
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
                <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="font-bold text-lg">Sem publicações novas</h3>
                    <p className="text-gray-500 text-sm mt-1">Siga novos profissionais de saúde para ver o conteúdo aqui.</p>
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
           <Link to="/profile" className="flex items-center justify-between mb-6 group">
              <div className="flex items-center space-x-3">
                 <div className="w-11 h-11 rounded-full overflow-hidden border border-gray-100 group-hover:scale-105 transition-transform">
                    <img src={profile?.avatar_url || "https://i.pravatar.cc/150?u=me"} alt="" className="w-full h-full object-cover" />
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

           {/* Gamification Section - Vitus Balance */}
           <div className="bg-gradient-to-br from-[#006747] to-emerald-800 rounded-3xl p-6 mb-6 shadow-xl shadow-emerald-900/10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                 <HeartPulse className="w-32 h-32 text-white" />
              </div>
              
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[2px] opacity-70">O Seu Saldo Viva</span>
                    <Trophy className="w-4 h-4 text-emerald-300" />
                 </div>
                 
                 <div className="flex items-end space-x-2">
                    <span className="text-4xl font-black tracking-tighter tabular-nums">{balance.toLocaleString()}</span>
                    <span className="text-sm font-bold opacity-70 mb-1">VITUS</span>
                 </div>

                 <div className="mt-6 grid grid-cols-2 gap-2">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex flex-col items-center">
                       <TrendingUp className="w-3 h-3 mb-1 text-emerald-300" />
                       <span className="text-[9px] font-bold opacity-60">Nível</span>
                       <span className="text-[11px] font-black tracking-tighter">PRATA</span>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 flex flex-col items-center">
                       <Coins className="w-3 h-3 mb-1 text-emerald-300" />
                       <span className="text-[9px] font-bold opacity-60">Rank</span>
                       <span className="text-[11px] font-black tracking-tighter">TOP 5%</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Suggestions Header */}
           <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-gray-400">Profissionais Sugeridos</h4>
              <button className="text-xs font-bold hover:text-gray-500">Ver tudo</button>
           </div>

           {/* Suggestions List */}
           <div className="space-y-4">
              {SUGGESTIONS.map((sug) => (
                <div key={sug.username} className="flex justify-between items-center">
                    <Link to="/explore" className="flex items-center space-x-3 group">
                        <div className="w-8 h-8 rounded-full overflow-hidden group-hover:scale-105 transition-transform">
                            <img src={sug.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="flex items-center">
                              <p className="text-sm font-bold leading-none group-hover:text-[#006747] transition-colors">{sug.username}</p>
                              {sug.isProf && <ShieldCheck className="w-3 h-3 text-[#006747] ml-1 fill-current" />}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">{sug.isProf ? 'Profissional SNS' : 'Sugerido'}</p>
                        </div>
                    </Link>
                    {sug.isProf ? (
                      <button className="text-xs font-bold text-[#006747] hover:text-emerald-800">Seguir</button>
                    ) : (
                      <button className="text-xs font-bold text-gray-300 cursor-not-allowed">Membro</button>
                    )}
                </div>
              ))}
           </div>

           {/* Dose Diária - Promoção de Saúde */}
           <div className="mt-10 bg-emerald-50 rounded-3xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-5 group-hover:rotate-12 transition-transform">
                 <Syringe className="w-16 h-16 text-[#006747]" />
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                 <div className="bg-[#006747] p-1.5 rounded-lg text-white">
                    <Syringe className="w-3 h-3" />
                 </div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#006747]">Dose Diária Viva</h4>
              </div>
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center space-x-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#006747]" />
                       <p className="text-[11px] font-bold text-gray-700 group-hover:text-[#006747] transition-colors">Beber 2L de Água</p>
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 bg-white px-2 py-0.5 rounded-full">+50V</span>
                 </div>
                 <div className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center space-x-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                       <p className="text-[11px] font-bold text-gray-700 group-hover:text-[#006747] transition-colors">Caminhada 30 Min</p>
                    </div>
                    <span className="text-[9px] font-black text-emerald-600 bg-white px-2 py-0.5 rounded-full">+120V</span>
                 </div>
              </div>
              
              <button className="w-full mt-5 py-2.5 bg-white border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#006747] hover:bg-[#006747] hover:text-white transition-all">
                 Ver Desafios
              </button>
           </div>

           {/* Health Mission Progress */}
           <div className="mt-6 bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Meta Comunitária</h4>
                 <div className="flex -space-x-1.5">
                    {[1,2,3].map(i => (
                       <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?u=${i}`} className="w-full h-full object-cover" />
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
              Sobre • Ajuda • Imprensa • Privatidade • Termos • Localizações • Idioma • VIVA verified
              <p className="mt-4">© 2024 VIVA+ DO SNS</p>
           </div>
        </aside>
      </div>

      <CreateReelModal 
        isOpen={showCreateReelModal} 
        onClose={() => setShowCreateReelModal(false)}
      />
    </div>
  );
}
