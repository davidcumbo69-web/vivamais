import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { HeartPulse, Brain, Syringe, Music, Share2, ShieldCheck, Plus, Play, Pause, Loader2, Camera, X, CircleUser } from 'lucide-react';
import { useVitus } from '../hooks/useVitus';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '../hooks/useAlert';
import { supabase } from '../lib/supabase';
import { cn, sanitizeAvatarUrl } from '../lib/utils';
import { Skeleton } from '../components/ui/Skeleton';
import { ReelsCarousel } from '../components/feed/ReelsCarousel';
import { CreateReelModal } from '../components/feed/CreateReelModal';

export default function Reels() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialId = searchParams.get('id');
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'player'>(initialId ? 'player' : 'grid');
  const containerRef = useRef<HTMLDivElement>(null);
  const { addVitus } = useVitus();
  const { user, profile } = useAuth();
  const { showAlert } = useAlert();
  
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userLikes, setUserLikes] = useState<Record<string, boolean>>({});
  const viewedReels = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (initialId && reels.length > 0) {
      const index = reels.findIndex(r => r.id === initialId);
      if (index !== -1) {
        setActiveIndex(index);
        setViewMode('player');
        setTimeout(() => {
          containerRef.current?.scrollTo({
            top: index * window.innerHeight,
            behavior: 'auto'
          });
        }, 100);
      }
    }
  }, [initialId, reels.length]);

  useEffect(() => {
    const init = async () => {
      await fetchReels();
    };
    init();
  }, [user]);

  useEffect(() => {
    if (reels.length > 0 && activeIndex === 0 && viewMode === 'player') {
      incrementView(reels[0].id);
    }
  }, [reels, viewMode]);

  const fetchReels = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reels')
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url,
            is_professional
          ),
          reel_likes!left (
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (user) {
        query = query.or(`is_approved.eq.true,user_id.eq.${user.id}`);
      } else {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        // Map user likes
        const likesMap: Record<string, boolean> = {};
        if (user) {
          data.forEach(reel => {
            likesMap[reel.id] = (reel.reel_likes || []).some((l: any) => l.user_id === user.id);
          });
        }
        setUserLikes(likesMap);

        const dbReels = data.map(p => ({
          id: p.id,
          content_url: p.video_url,
          user: {
            id: p.profiles?.id,
            username: p.profiles?.username || 'viva_user',
            avatar: p.profiles?.avatar_url,
            isProf: p.profiles?.is_professional || false
          },
          caption: p.caption,
          likes_count: p.likes_count || 0,
          views_count: p.views_count || 0,
          comments_count: Math.floor(Math.random() * 50),
        }));
        
        setReels(dbReels);
      } else {
        setReels([]);
      }
    } catch (err) {
      console.error('Error fetching reels:', err);
    } finally {
      setLoading(false);
    }
  };

  const incrementView = async (reelId: string) => {
    if (viewedReels.current.has(reelId)) return;
    
    try {
      await supabase.rpc('increment_reel_view', { reel_id: reelId });
      viewedReels.current.add(reelId);
      
      setReels(prev => prev.map(r => 
        r.id === reelId ? { ...r, views_count: (r.views_count || 0) + 1 } : r
      ));
    } catch (err) {
      console.error('Error incrementing view:', err);
    }
  };

  const handleScroll = () => {
    if (containerRef.current && viewMode === 'player') {
      const scrollPos = containerRef.current.scrollTop;
      const index = Math.round(scrollPos / window.innerHeight);
      if (index !== activeIndex) {
        setActiveIndex(index);
        setIsPlaying(true);
        
        const currentReel = reels[index];
        if (currentReel) {
          incrementView(currentReel.id);
        }

        // Award Vitus for watching reels (gamification)
        addVitus(2, 'Visualização de Reel Proativa');
      }
    }
  };

  const handleSelectReel = (index: number) => {
    setActiveIndex(index);
    setViewMode('player');
    setTimeout(() => {
      containerRef.current?.scrollTo({
        top: index * window.innerHeight,
        behavior: 'auto'
      });
    }, 100);
  };

  const handleToggleLike = async (reelId: string) => {
    if (!user) {
      showAlert('Login Necessário', 'Inicie sessão para interagir e curtir vídeos nos Reels VIVA.', 'info');
      return;
    }

    const isLiked = userLikes[reelId];
    
    // Optimistic UI update
    setUserLikes(prev => ({ ...prev, [reelId]: !isLiked }));
    setReels(prev => prev.map(r => 
      r.id === reelId ? { ...r, likes_count: isLiked ? r.likes_count - 1 : r.likes_count + 1 } : r
    ));

    try {
      if (isLiked) {
        await supabase
          .from('reel_likes')
          .delete()
          .match({ reel_id: reelId, user_id: user.id });
      } else {
        await supabase
          .from('reel_likes')
          .insert({ reel_id: reelId, user_id: user.id });
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert if error
      setUserLikes(prev => ({ ...prev, [reelId]: isLiked }));
      setReels(prev => prev.map(r => 
        r.id === reelId ? { ...r, likes_count: isLiked ? r.likes_count + 1 : r.likes_count - 1 } : r
      ));
    }
  };

  if (loading && reels.length === 0) {
    return (
      <div className="h-screen w-full bg-[#dae0e6] relative flex items-center justify-center">
        <div className="h-full w-full max-w-lg bg-white overflow-hidden relative shadow-2xl">
          <Skeleton className="absolute inset-0 w-full h-full bg-gray-200" />
          <div className="absolute bottom-10 left-4 right-20 space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full bg-gray-300" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-gray-300" />
                <Skeleton className="h-3 w-32 bg-gray-300" />
              </div>
            </div>
            <Skeleton className="h-4 w-3/4 bg-gray-300" />
            <Skeleton className="h-4 w-1/2 bg-gray-300" />
            <Skeleton className="h-8 w-32 rounded-full bg-gray-300" />
          </div>
          <div className="absolute bottom-20 right-4 space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <Skeleton className="w-12 h-12 rounded-full bg-gray-300" />
                <Skeleton className="h-2 w-4 bg-gray-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#dae0e6] flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-4xl px-4 py-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-40 border-b border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-900 transition-all border border-gray-200 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic flex items-center">
              VIVA+ <span className="text-[#006747] ml-2">Reels</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Saúde em Movimento</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
           {profile?.is_professional && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-[#006747] text-white rounded-full text-xs font-black uppercase tracking-wider hover:bg-emerald-600 transition-all flex items-center space-x-2 shadow-md shadow-emerald-900/20"
              >
                <Plus className="w-4 h-4" />
                <span>Criar</span>
              </button>
            )}
        </div>
      </div>

      {/* Content Grid */}
      <main className="w-full max-w-4xl px-4 pt-6 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {reels.map((reel, index) => (
            <motion.div
              key={reel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectReel(index)}
              className="relative aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer border border-gray-200 bg-white shadow-lg"
            >
              {/* Thumbnail Video */}
              <video 
                src={reel.content_url} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                preload="metadata"
                muted
                playsInline
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              
              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end h-full">
                <div className="flex items-center mb-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 mr-2 shrink-0 bg-zinc-800 flex items-center justify-center">
                    {sanitizeAvatarUrl(reel.user.avatar) ? (
                      <img src={sanitizeAvatarUrl(reel.user.avatar)!} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <CircleUser className="w-full h-full text-black stroke-[1px] p-1" />
                    )}
                  </div>
                  <span className="text-white text-[10px] font-bold truncate opacity-80 group-hover:opacity-100 transition-opacity">
                    @{reel.user.username}
                  </span>
                </div>
                <p className="text-white text-[11px] leading-tight font-medium line-clamp-2 mb-2">
                  {reel.caption}
                </p>
                <div className="flex items-center justify-between text-[10px] text-white/60 font-black tracking-tighter">
                  <div className="flex items-center">
                    <Play className="w-3 h-3 mr-1 fill-current text-white/40" />
                    {reel.views_count || 0}
                  </div>
                  <div className="flex items-center">
                    <HeartPulse className="w-3 h-3 mr-1 text-red-500/80" />
                    {reel.likes_count}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md rounded-full p-1.5 border border-white/20">
                 {reel.user.isProf ? (
                   <ShieldCheck className="w-3 h-3 text-[#006747] fill-white" />
                 ) : (
                   <Play className="w-3 h-3 text-white fill-current" />
                 )}
              </div>
            </motion.div>
          ))}
        </div>

        {reels.length === 0 && (
           <div className="flex flex-col items-center justify-center py-40">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 border border-gray-200 shadow-sm text-gray-300">
                 <Play className="w-10 h-10 fill-current opacity-30" />
              </div>
              <h3 className="text-gray-900 font-black uppercase tracking-tighter italic text-xl mb-2">Nenhum Reel Encontrado</h3>
              <p className="text-gray-500 text-sm max-w-[250px] text-center font-medium">A nossa rede de especialistas ainda está a preparar conteúdo valioso para si.</p>
           </div>
        )}
      </main>

      {/* Reel Player Modal */}
      <AnimatePresence>
        {viewMode === 'player' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-0 md:p-4"
          >
            {/* Modal Container */}
            <div className="relative w-full h-[100dvh] md:h-full max-w-lg bg-black md:rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center">
              {/* Close Modal Button */}
              <button 
                onClick={() => setViewMode('grid')}
                className="absolute top-6 left-6 z-[110] p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md border border-white/10 transition-all active:scale-95 shadow-2xl"
                title="Voltar para a Galeria"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Create Button Overlay - Only for professionals */}
              {profile?.is_professional && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="absolute top-6 right-6 z-[110] p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md border border-white/20 transition-all active:scale-95 shadow-2xl"
                >
                  <Plus className="w-6 h-6" />
                </button>
              )}

              {/* Main Player Scroll Area */}
              <div 
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black relative"
              >
                {reels.map((reel, index) => (
                  <div key={reel.id} className="h-full w-full snap-start relative flex flex-col justify-end bg-black">
                    {/* Video Player */}
                    <video 
                      src={reel.content_url} 
                      className="absolute inset-0 w-full h-full object-cover" 
                      autoPlay={index === activeIndex && isPlaying}
                      loop 
                      muted={false} 
                      playsInline
                      onClick={() => setIsPlaying(!isPlaying)}
                    />
                    
                    {/* Play/Pause Indicator (Overlay) */}
                    {!isPlaying && index === activeIndex && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                         <Pause className="w-16 h-16 text-white/50" />
                      </div>
                    )}

                    {/* Dark Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                    <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

                    {/* Reel Content */}
                    <div className="relative z-10 px-4 pb-12 flex justify-between items-end w-full">
                      <div className="flex-1 mr-6">
                        <div className="flex items-center mb-4">
                          <Link to={`/perfil/${reel.user.id}`} className="flex items-center group pointer-events-auto">
                            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden mr-3 shadow-lg group-hover:scale-105 transition-transform bg-zinc-800 flex items-center justify-center">
                              {sanitizeAvatarUrl(reel.user.avatar) ? (
                                <img src={sanitizeAvatarUrl(reel.user.avatar)!} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <CircleUser className="w-full h-full text-black stroke-[1px] p-2" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white font-bold text-sm flex items-center drop-shadow-md group-hover:text-emerald-400 transition-colors">
                                {reel.user.username}
                                {reel.user.isProf && <ShieldCheck className="ml-1.5 w-4 h-4 text-[#006747] fill-white" />}
                              </span>
                              <span className="text-[10px] text-white/60 font-medium tracking-wider uppercase group-hover:text-white transition-colors">Membro VIVA+ Health</span>
                            </div>
                          </Link>
                          <button className="ml-4 px-4 py-1.5 bg-white text-black text-[10px] rounded-full font-black uppercase tracking-wider hover:bg-gray-200 transition-colors shadow-lg">
                            Seguir
                          </button>
                        </div>
                        
                        <p className="text-white text-sm leading-relaxed mb-4 drop-shadow-md line-clamp-3">
                          {reel.caption}
                        </p>
                        
                        <div className="flex items-center text-white/80 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                          <Music className="w-3 h-3 mr-2 text-[#006747]" />
                          <span className="text-[10px] font-bold tracking-tight">VIVA+ Som Original • 2024</span>
                        </div>
                      </div>

                      {/* Sidebar Actions */}
                      <div className="flex flex-col items-center space-y-6 pb-2">
                        <div className="flex flex-col items-center group">
                          <button 
                            onClick={() => handleToggleLike(reel.id)}
                            className={cn(
                              "w-12 h-12 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full border transition-all active:scale-150",
                              userLikes[reel.id] 
                                ? "text-red-500 border-red-500 bg-red-500/20" 
                                : "text-white border-white/10 group-hover:bg-red-500/20 group-hover:border-red-500/50"
                            )}
                          >
                            <HeartPulse className={cn("w-6 h-6", userLikes[reel.id] && "fill-current")} />
                          </button>
                          <span className="text-white text-[10px] mt-2 font-black drop-shadow-lg">{reel.likes_count}</span>
                        </div>

                        <div className="flex flex-col items-center group">
                          <div className="w-12 h-12 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10 transition-all group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50">
                            <Play className="w-5 h-5 fill-current" />
                          </div>
                          <span className="text-white text-[10px] mt-2 font-black drop-shadow-lg">{reel.views_count || 0}</span>
                        </div>

                        <button className="w-12 h-12 flex items-center justify-center bg-black/20 backdrop-blur-md rounded-full text-white border border-white/10 transition-all group-hover:bg-blue-500/20 group-hover:border-blue-500/50">
                          <Syringe className="w-6 h-6" />
                        </button>

                        <button className="w-10 h-10 rounded-xl border-2 border-white/50 overflow-hidden bg-white/20 shadow-lg animate-pulse flex items-center justify-center">
                          {sanitizeAvatarUrl(reel.user.avatar) ? (
                            <img src={sanitizeAvatarUrl(reel.user.avatar)!} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <CircleUser className="w-full h-full text-black stroke-[1px] p-1.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CreateReelModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchReels}
      />
    </div>
  );
}
