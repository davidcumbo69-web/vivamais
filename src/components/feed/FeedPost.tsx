import { ShieldCheck, Brain, Syringe, ClipboardList, Dna, HeartPulse, Share2, MessageCircle, Facebook, Instagram, Link2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useVitus } from '../../hooks/useVitus';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

type FeedPostProps = {
  key?: string | number;
  post: {
    id: string;
    user: {
      id: string;
      username: string;
      avatar: string;
      isProf: boolean;
    };
    content: string;
    caption: string;
    likes: number;
    category: string;
    time: string;
    isLiked?: boolean;
  };
};

export function FeedPost({ post }: FeedPostProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [likeCount, setLikeCount] = useState(typeof post.likes === 'number' ? post.likes : 0);
  const { addVitus } = useVitus();

  useEffect(() => {
    if (user) {
      checkIfSaved();
      checkIfLiked();
    }
  }, [user, post.id]);

  const checkIfLiked = async () => {
    try {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (data) setIsLiked(true);
    } catch (err) {
      console.error('Error checking like status:', err);
    }
  };

  const checkIfSaved = async () => {
    try {
      const { data } = await supabase
        .from('saved_items')
        .select('id')
        .eq('user_id', user?.id)
        .eq('item_id', post.id)
        .eq('item_type', 'post')
        .maybeSingle();

      if (data) {
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Erro ao verificar se post está guardado:', err);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      if (newLikedState) {
        // Add like
        await supabase.from('likes').insert({
          post_id: post.id,
          user_id: user.id
        });

        // Award vitus for supporting health professional
        if (post.user.isProf) {
          await addVitus(5, 'Apoio à Saúde Profissional');
        }
      } else {
        // Remove like
        await supabase.from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert local state on error
      setIsLiked(!newLikedState);
      setLikeCount(prev => newLikedState ? prev - 1 : prev + 1);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    const newSavedState = !isSaved;
    setIsSaved(newSavedState);

    try {
      if (newSavedState) {
        // Salvar
        await supabase.from('saved_items').insert({
          user_id: user.id,
          item_id: post.id,
          item_type: 'post',
          metadata: {
            title: post.caption,
            image_url: post.content,
            username: post.user.username
          }
        });
      } else {
        // Remover
        await supabase.from('saved_items')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', post.id)
          .eq('item_type', 'post');
      }
    } catch (err) {
      console.error('Erro ao guardar/remover post:', err);
      // Revert state on error
      setIsSaved(!newSavedState);
    }
  };

  const shareUrl = `${window.location.origin}/?post=${post.id}`;
  const shareText = encodeURIComponent(`Confira este post de ${post.user.username} no VIVA+: ${post.caption}`);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'VIVA+',
          text: post.caption,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className="bg-white border border-gray-200 mb-4 rounded-xl shadow-sm md:max-w-[700px] md:mx-auto overflow-hidden">
      {/* Media with Overlaid User Info */}
      <div className="relative aspect-video bg-gray-200 overflow-hidden md:rounded-sm border-y border-gray-50 sm:border-none" onDoubleClick={handleLike}>
        <img src={post.content} className="w-full h-full object-cover" alt="" />
        
        {/* User Info Overlay - Bottom Center */}
        <div className="absolute bottom-0 left-0 right-0 pb-2 md:pb-6 pt-12 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end pointer-events-none">
           <Link to={`/perfil/${post.user.id}`} className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-white overflow-hidden shadow-2xl mb-2 pointer-events-auto cursor-pointer active:scale-95 transition-transform group">
              <img src={post.user.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
           </Link>
           <Link to={`/perfil/${post.user.id}`} className="flex flex-col items-center group pointer-events-auto">
              <div className="flex items-center space-x-1 mb-0.5">
                 <span className="text-white font-bold text-sm leading-none drop-shadow-lg group-hover:text-emerald-400 transition-colors">{post.user.username}</span>
                 {post.user.isProf && <ShieldCheck className="w-4 h-4 text-[#006747] fill-white" />}
              </div>
              <span className="text-white/70 text-[9px] font-black uppercase tracking-widest drop-shadow-md">{post.category}</span>
           </Link>
        </div>
        
        {/* Like feedback animation */}
        <AnimatePresence>
          {isLiked && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="filter drop-shadow-2xl">
                <HeartPulse className="w-24 h-24 text-red-500" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-5">
            <button 
              onClick={handleLike} 
              className={cn("transition-all active:scale-110 flex items-center space-x-2 group", isLiked ? "text-red-500" : "text-gray-800 hover:text-gray-400")}
            >
              <div className="relative">
                <HeartPulse className={cn("w-6 h-6 transition-all", isLiked && "fill-current")} />
              </div>
              <span className="text-sm font-black tracking-tight tabular-nums">
                {likeCount.toLocaleString()}
              </span>
            </button>
            <button 
              onClick={() => setShowShareMenu(true)}
              className="text-gray-800 hover:text-gray-400 transition-all active:scale-110"
              title="Partilhar"
            >
              <Syringe className="w-6 h-6 -rotate-12" />
            </button>
          </div>
          <button 
            onClick={handleSave}
            className={cn("transition-all active:scale-125", isSaved ? "text-[#006747]" : "text-gray-800 hover:text-gray-400")}
            title={isSaved ? "Remover dos guardados" : "Guardar post"}
          >
            <ClipboardList className={cn("w-6 h-6", isSaved && "fill-current")} />
          </button>
        </div>

        {/* Share Menu Overlay */}
        <AnimatePresence>
          {showShareMenu && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowShareMenu(false)}
                className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] p-8 z-[70] shadow-2xl shadow-black/50"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Partilhar Saúde</h3>
                  <button onClick={() => setShowShareMenu(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-6 mb-8 text-center">
                  <button 
                    onClick={() => window.open(`https://wa.me/?text=${shareText}%20${encodeURIComponent(shareUrl)}`, '_blank')}
                    className="flex flex-col items-center group"
                  >
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-2 group-active:scale-95 transition-transform">
                      <MessageCircle className="w-7 h-7 text-green-500 fill-current" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">WhatsApp</span>
                  </button>
                  
                  <button 
                    onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}
                    className="flex flex-col items-center group"
                  >
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-2 group-active:scale-95 transition-transform">
                      <Facebook className="w-7 h-7 text-blue-600 fill-current" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Facebook</span>
                  </button>

                  <button 
                    onClick={() => window.open(`https://www.instagram.com/`, '_blank')} // No direct web share for IG
                    className="flex flex-col items-center group"
                  >
                    <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mb-2 group-active:scale-95 transition-transform">
                      <Instagram className="w-7 h-7 text-pink-600" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Instagram</span>
                  </button>

                  <button 
                    onClick={handleNativeShare}
                    className="flex flex-col items-center group"
                  >
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-2 group-active:scale-95 transition-transform">
                      <Share2 className="w-7 h-7 text-[#006747]" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mais</span>
                  </button>
                </div>

                <button 
                  onClick={handleCopyLink}
                  className={cn(
                    "w-full py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all font-black text-xs uppercase tracking-widest",
                    copied ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-900 active:bg-gray-200"
                  )}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Link Copiado</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4" />
                      <span>Copiar Link do Post</span>
                    </>
                  )}
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>



        <div 
          className={cn(
            "text-sm leading-relaxed mb-1 cursor-pointer transition-all duration-300",
            !isExpanded && "line-clamp-1"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Link 
            to={`/perfil/${post.user.id}`} 
            className="font-semibold mr-2 hover:text-[#006747] transition-colors inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            {post.user.username}
          </Link>
          <span className={cn(isExpanded ? "inline" : "")}>
            {post.caption}
          </span>
        </div>
        
        <div className="mt-2 text-[10px] font-medium text-gray-400 uppercase tracking-widest">
           {post.time} ATRÁS
        </div>
      </div>
    </div>
  );
}
