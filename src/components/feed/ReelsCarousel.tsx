import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Eye, ShieldCheck, Play, Plus, CircleUser } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn, sanitizeAvatarUrl } from '../../lib/utils';
import { Skeleton } from '../ui/Skeleton';

interface ReelsCarouselProps {
  onAddClick?: () => void;
}

export function ReelsCarousel({ onAddClick }: ReelsCarouselProps) {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchReels();
  }, [user]);

  const fetchReels = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('reels')
        .select(`
          *,
          profiles (
            username,
            avatar_url,
            is_professional
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (user) {
        query = query.or(`is_approved.eq.true,user_id.eq.${user.id}`);
      } else {
        query = query.eq('is_approved', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        setReels(data);
      }
    } catch (err) {
      console.error('Error fetching carousel reels:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl py-6 px-4 mb-4 mx-4 md:mx-0 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center space-x-2">
            <Skeleton className="w-5 h-5" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="flex space-x-3 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="flex-shrink-0 w-32 aspect-[9/16] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (reels.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl py-6 px-4 mb-4 mx-4 md:mx-0 shadow-sm overflow-hidden relative">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-[#006747]" />
          <h3 className="font-black text-sm uppercase tracking-tighter italic">Saúde em Movimento</h3>
        </div>
        <button 
          onClick={() => navigate('/reels')}
          className="text-[10px] font-black uppercase tracking-widest text-[#006747] hover:text-emerald-800"
        >
          Ver Tudo
        </button>
      </div>

      <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
        {/* Add Reel Card */}
        <div 
          onClick={onAddClick}
          className="flex-shrink-0 w-32 aspect-[9/16] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-[#006747] group-hover:scale-110 transition-transform">
             <Plus className="w-6 h-6" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-tighter mt-3 text-gray-400 group-hover:text-[#006747]">O seu Reel</p>
        </div>

        {reels.map((reel) => (
          <div 
            key={reel.id} 
            onClick={() => navigate(`/reels?id=${reel.id}`)}
            className="flex-shrink-0 w-32 aspect-[9/16] bg-black rounded-xl overflow-hidden relative cursor-pointer group hover:scale-[1.02] transition-all"
          >
            <video 
              src={reel.video_url} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
              muted 
              playsInline
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2">
              <div className="flex items-center space-x-1 mb-1">
                <div className="w-4 h-4 rounded-full border border-white/50 overflow-hidden bg-gray-100 flex items-center justify-center">
                   {sanitizeAvatarUrl(reel.profiles?.avatar_url) ? (
                     <img src={sanitizeAvatarUrl(reel.profiles.avatar_url)!} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <CircleUser className="w-full h-full text-black stroke-[1px] p-0.5" />
                   )}
                </div>
                <span className="text-[8px] text-white font-bold truncate max-w-[60px] drop-shadow-sm">
                   {reel.profiles?.username}
                </span>
                {reel.profiles?.is_professional && <ShieldCheck className="w-2.5 h-2.5 text-[#006747] fill-white" />}
              </div>
              <p className="text-[7px] text-white/90 line-clamp-2 leading-tight font-medium drop-shadow-sm">
                {reel.caption}
              </p>
            </div>

            <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md rounded-full p-1 border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-3 h-3 text-white fill-current" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
