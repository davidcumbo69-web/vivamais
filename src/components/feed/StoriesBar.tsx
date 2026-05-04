import { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { CreateReelModal } from './CreateReelModal';

export function StoriesBar() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    fetchApprovedReels();
  }, [user]);

  const fetchApprovedReels = async () => {
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
        .limit(15);

      if (user) {
        query = query.or(`is_approved.eq.true,user_id.eq.${user.id}`);
      } else {
        query = query.eq('is_approved', true);
      }

      const { data } = await query;

      if (data) setReels(data);
    } catch (err) {
      console.error('Error fetching stories reels:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl py-3 px-2 mb-4 mx-4 md:mx-0 shadow-sm overflow-hidden">
      <div className="flex space-x-4 overflow-x-auto px-4 scrollbar-hide">
        {/* Your Story Button */}
        <div 
          onClick={() => setShowCreateModal(true)}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
        >
          <div className="relative p-[2px] bg-gray-200 rounded-full group-hover:bg-[#006747] transition-colors">
            <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden bg-gray-50 flex items-center justify-center relative">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} className="w-full h-full object-cover opacity-50" alt="" />
              ) : (
                <div className="bg-gray-100 w-full h-full flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-[#006747]" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-white/20">
                <Plus className="w-5 h-5 text-[#006747] stroke-[3]" />
              </div>
            </div>
          </div>
          <span className="text-[11px] mt-1 text-gray-500 font-bold uppercase tracking-tighter">O seu VIVA</span>
        </div>

        {loading ? (
          <div className="flex space-x-4">
             {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center flex-shrink-0 animate-pulse">
                   <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-200 p-[2px]" />
                   <div className="w-10 h-2 bg-gray-50 rounded mt-2" />
                </div>
             ))}
          </div>
        ) : (
          reels.map((reel) => (
            <div 
              key={reel.id} 
              onClick={() => navigate(`/reels?id=${reel.id}`)}
              className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
            >
              <div className="relative p-[2px] bg-gradient-to-tr from-[#006747] to-emerald-400 rounded-full group-hover:scale-105 transition-transform duration-200">
                <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden bg-white">
                  <img 
                    src={reel.profiles?.avatar_url || 'https://i.pravatar.cc/150'} 
                    alt={reel.profiles?.username} 
                    className="w-full h-full object-cover shadow-inner" 
                  />
                </div>
                {reel.profiles?.is_professional && (
                  <div className="absolute -bottom-1 -right-1 bg-[#006747] rounded-full p-[2px] border border-white">
                     <ShieldCheck className="w-2.5 h-2.5 text-white fill-current" />
                  </div>
                )}
              </div>
              <span className="text-[11px] mt-1 max-w-[64px] truncate text-gray-800 font-medium">
                {reel.profiles?.username}
              </span>
            </div>
          ))
        )}
      </div>

      <CreateReelModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchApprovedReels}
      />
    </div>
  );
}
