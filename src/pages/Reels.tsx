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
    const init = async () => {
      await fetchReels();
    };
    init();
  }, [user]);

  useEffect(() => {
    if (reels.length > 0 && activeIndex === 0) {
      incrementView(reels[0].id);
    }
  }, [reels]);

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

        if (initialId) {
          const index = dbReels.findIndex(r => r.id === initialId);
          if (index !== -1) {
            setActiveIndex(index);
            setTimeout(() => {
              containerRef.current?.scrollTo({
                top: index * window.innerHeight,
                behavior: 'auto'
              });
            }, 100);
          }
        }
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
    if (containerRef.current) {
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
      <div className="h-screen w-full bg-black relative flex items-center justify-center">
        <div className="h-full w-full max-w-lg bg-zinc-900 overflow-hidden relative">
          <Skeleton className="absolute inset-0 w-full h-full bg-zinc-900" />
          <div className="absolute bottom-10 left-4 right-20 space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton className="w-10 h-10 rounded-full bg-emerald-950/30" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-emerald-950/30" />
                <Skeleton className="h-3 w-32 bg-emerald-950/30" />
              </div>
            </div>
            <Skeleton className="h-4 w-3/4 bg-emerald-950/30" />
            <Skeleton className="h-4 w-1/2 bg-emerald-950/30" />
            <Skeleton className="h-8 w-32 rounded-full bg-emerald-950/30" />
          </div>
          <div className="absolute bottom-20 right-4 space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <Skeleton className="w-12 h-12 rounded-full bg-emerald-950/30" />
                <Skeleton className="h-2 w-4 bg-emerald-950/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100vh] w-full bg-black relative flex flex-col md:flex-row items-center justify-center overflow-hidden">
      {/* Close Button */}
      <button 
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-50 p-4 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all border border-white/10 shadow-xl active:scale-90"
        title="Fechar"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Create Button Overlay - Only for professionals */}
      {profile?.is_professional && (
        <button 
          onClick={() => setShowCreateModal(true)}
          className="fixed top-6 right-6 z-50 p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all border border-white/20 shadow-xl active:scale-90"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Main Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full max-w-lg overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-black shadow-2xl relative"
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
            <div className="relative z-10 px-4 pb-20 md:pb-12 flex justify-between items-end w-full">
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
                  <span className="text-[10px] font-bold tracking-tight">VIVA+ SNS Som Original • 2024</span>
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

      <CreateReelModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchReels}
      />
    </div>
  );
}
