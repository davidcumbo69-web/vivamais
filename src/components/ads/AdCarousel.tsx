import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, Megaphone, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  target_category: string;
  ad_type: 'image' | 'text';
}

interface AdCarouselProps {
  location: 'groups' | 'profiles';
  category?: string;
  className?: string;
  backgroundOnly?: boolean;
}

export function AdCarousel({ location, category = 'Geral', className, backgroundOnly }: AdCarouselProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAds();
  }, [location, category]);

  const fetchAds = async () => {
    try {
      let query = supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)
        .or(`display_location.eq.all,display_location.eq.${location}`);

      if (category && category !== 'Geral') {
        query = query.or(`target_category.eq.Geral,target_category.eq.${category}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data && data.length > 0) {
        setAds(data);
      } else {
        // Fallback ads for empty database
        setAds([
          {
            id: 'fallback-1',
            title: 'Cuidados de Saúde de Elite',
            description: 'Acesse os melhores especialistas e clínicas modernas em todo o país.',
            image_url: 'https://images.unsplash.com/photo-1576091160550-2173dad99901?auto=format&fit=crop&q=80',
            link_url: '',
            target_category: 'Geral',
            ad_type: 'image'
          },
          {
            id: 'fallback-2',
            title: 'Farmácias de Plantão 24/7',
            description: 'Encontre medicamentos e cuidados emergenciais sempre que precisar.',
            image_url: 'https://images.unsplash.com/photo-1587854680352-936b22b91030?auto=format&fit=crop&q=80',
            link_url: '',
            target_category: 'Geral',
            ad_type: 'image'
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching ads:', err);
      // Fallback on error too
      setAds([
        {
          id: 'fallback-1',
          title: 'VIVA+ Saúde Digital',
          description: 'A revolução na gestão de saúde ao seu alcance.',
          image_url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80',
          link_url: '',
          target_category: 'Geral',
          ad_type: 'image'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ads.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [ads.length]);

  if (loading || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className={cn("relative group overflow-hidden rounded-2xl bg-gray-900 shadow-xl", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={cn(
            "relative w-full",
            backgroundOnly ? "h-full" : "aspect-[3/1] md:aspect-[4/1]"
          )}
        >
          {currentAd.image_url ? (
            <>
              <img 
                src={currentAd.image_url} 
                alt={currentAd.title}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[#006747]/20" />
          )}

          {!backgroundOnly && (
            <div className="absolute inset-0 p-6 flex flex-col justify-center items-center text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="bg-[#006747] text-white text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full flex items-center">
                  <Megaphone className="w-2.5 h-2.5 mr-1" />
                  Publicidade VIVA+
                </span>
                {currentAd.target_category !== 'Geral' && (
                  <span className="bg-white/10 backdrop-blur-md text-white/80 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                    {currentAd.target_category}
                  </span>
                )}
              </div>
              
              <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight leading-none mb-2">
                {currentAd.title}
              </h3>
              <p className="text-xs md:text-sm text-gray-300 font-medium max-w-lg line-clamp-2 mb-4 leading-relaxed mx-auto">
                {currentAd.description}
              </p>

              {currentAd.link_url && (
                <a 
                  href={currentAd.link_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-colors w-fit mx-auto"
                >
                  <span>Saiba Mais</span>
                  <ChevronRight className="w-3 h-3" />
                </a>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {ads.length > 1 && !backgroundOnly && (
        <div className="absolute bottom-4 right-6 flex items-center space-x-2">
          {ads.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "h-1 transition-all duration-300 rounded-full",
                idx === currentIndex ? "w-6 bg-white" : "w-2 bg-white/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
