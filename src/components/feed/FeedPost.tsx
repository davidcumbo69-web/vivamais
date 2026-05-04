import { ShieldCheck, Brain, Syringe, ClipboardList, Dna } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useVitus } from '../../hooks/useVitus';
import { AnatomicalHeartIcon } from '../icons/AnatomicalHeart';

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
  };
};

export function FeedPost({ post }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const { addVitus } = useVitus();

  const handleLike = async () => {
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikeCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    if (newLikedState && post.user.isProf) {
      // Award vitus for supporting health professional
      await addVitus(5, 'Apoio à Saúde Profissional');
    }
  };

  return (
    <div className="bg-white border border-gray-200 mb-4 rounded-xl shadow-sm md:max-w-[700px] md:mx-auto overflow-hidden">
      {/* Media with Overlaid User Info */}
      <div className="relative aspect-video bg-gray-200 overflow-hidden md:rounded-sm border-y border-gray-50 sm:border-none" onDoubleClick={handleLike}>
        <img src={post.content} className="w-full h-full object-cover" alt="" />
        
        {/* User Info Overlay - Bottom Center */}
        <div className="absolute bottom-0 left-0 right-0 pb-2 md:pb-6 pt-12 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-end pointer-events-none">
           <Link to={`/profile/${post.user.id}`} className="w-10 h-10 md:w-14 md:h-14 rounded-full border-2 border-white overflow-hidden shadow-2xl mb-2 pointer-events-auto cursor-pointer active:scale-95 transition-transform group">
              <img src={post.user.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
           </Link>
           <Link to={`/profile/${post.user.id}`} className="flex flex-col items-center group pointer-events-auto">
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
                <AnatomicalHeartIcon className="w-24 h-24 text-red-500" />
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
              className={cn("transition-all active:scale-125 flex items-center justify-center", isLiked ? "text-red-500" : "text-gray-800 hover:text-gray-400")}
            >
              <AnatomicalHeartIcon className="w-6 h-6" />
            </button>
            <button className="text-gray-800 hover:text-gray-400">
              <Brain className="w-6 h-6" />
            </button>
            <button className="text-gray-800 hover:text-gray-400">
              <Syringe className="w-6 h-6 -rotate-12" />
            </button>
          </div>
          <button className="text-gray-800">
            <ClipboardList className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-2">
           <span className="font-bold text-sm text-gray-900">
             {likeCount.toLocaleString()} Apoios
           </span>
        </div>

        <div className="text-sm leading-relaxed mb-1">
          <Link to={`/profile/${post.user.id}`} className="font-semibold mr-2 hover:text-[#006747] transition-colors">{post.user.username}</Link>
          {post.caption}
        </div>
        
        <div className="mt-2 text-[10px] font-medium text-gray-400 uppercase tracking-widest">
           {post.time} ATRÁS
        </div>

        <button className="text-gray-500 text-sm mt-1 hover:text-gray-400">
          Ver todos os 28 comentários
        </button>
      </div>
    </div>
  );
}
