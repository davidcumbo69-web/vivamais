import React, { useState, useMemo, useCallback, memo, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, ShoppingBag, Loader2, Star, Plus } from 'lucide-react';
import debounce from 'lodash/debounce';
import { useWellnessServices } from '../hooks/queries/useQueries';
import { useBookServiceMutation } from '../hooks/mutations/useMutations';

// --- STYLED COMPONENTS (MEMOIZED) ---

const ServiceCard = memo(({ service, onBook }: { service: any; onBook: (s: any) => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-all group"
    >
      <div className="w-24 h-24 rounded-2xl bg-gray-100 flex-shrink-0 relative overflow-hidden">
        {service.image_url ? (
          <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <ShoppingBag className="w-8 h-8 text-gray-300 absolute inset-0 m-auto" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#006747] bg-[#006747]/10 px-2 py-0.5 rounded-full">
            {service.category}
          </span>
          <div className="flex items-center gap-1 text-[#FFB800]">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-xs font-bold">{service.rating}</span>
          </div>
        </div>
        <h3 className="font-black text-gray-900 mt-1 truncate">{service.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{service.provider_name}</p>
        <div className="flex justify-between items-end mt-2">
          <div>
            <p className="text-[10px] text-gray-400">Preço Base</p>
            <p className="font-black text-[#006747]">{service.base_price} KZ</p>
          </div>
          <button 
            onClick={() => onBook(service)}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-[#006747] hover:text-white transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
});

ServiceCard.displayName = 'ServiceCard';

// --- SKELETON LOADERS ---

const MarketplaceSkeleton = () => (
  <div className="space-y-4 p-6">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="animate-pulse flex gap-4 bg-gray-50 rounded-3xl p-4">
        <div className="w-24 h-24 bg-gray-200 rounded-2xl" />
        <div className="flex-1 space-y-2 py-2">
          <div className="h-4 bg-gray-200 rounded-full w-1/4" />
          <div className="h-6 bg-gray-200 rounded-full w-3/4" />
          <div className="h-4 bg-gray-200 rounded-full w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

// --- MAIN PAGE COMPONENT ---

const OptimizedMarketplace: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  
  // Use TanStack Query with optimized cache
  const { data: services, isLoading, isFetching } = useWellnessServices(category === 'all' ? undefined : category);
  
  // Mutation with internal invalidation
  const bookService = useBookServiceMutation();

  // Debounced Search Implementation
  const debouncedSearch = useMemo(
    () => debounce((val: string) => setSearch(val), 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Optimized Filtered Data
  const filteredServices = useMemo(() => {
    if (!services) return [];
    return services.filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.provider_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [services, search]);

  // Memoized Callback for child interactions
  const handleBooking = useCallback((service: any) => {
    bookService.mutate({
      service_id: service.id,
      status: 'pendente',
      scheduled_at: new Date().toISOString(),
    });
  }, [bookService]);

  return (
    <div className="min-h-screen bg-[#dae0e6] pb-24">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl px-6 pt-6 pb-4 border-b border-gray-50">
        <h1 className="text-2xl font-black text-gray-900 mb-4">Marketplace <span className="text-[#006747] underline decoration-4 underline-offset-4">VIVA+</span></h1>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#006747] transition-colors" />
          <input 
            type="text"
            onChange={handleSearchChange}
            placeholder="Procurar serviços, clínicas..."
            className="w-full bg-gray-100 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all"
          />
          {isFetching && (
             <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-[#006747] animate-spin" />
             </div>
          )}
        </div>

        {/* Horizontal scroll for categories */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
          {['all', 'nutrição', 'psicologia', 'fisioterapia', 'fitness', 'bem-estar'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-black capitalize whitespace-nowrap transition-all ${
                category === cat 
                ? 'bg-[#006747] text-white shadow-lg shadow-[#006747]/20' 
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services List - Optimized with Virtualization Pattern if needed, but for SPA standard grids are easy */}
      <div className="p-6">
        <Suspense fallback={<MarketplaceSkeleton />}>
          {isLoading ? (
            <MarketplaceSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredServices.map((service) => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    onBook={handleBooking} 
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </Suspense>

        {!isLoading && filteredServices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-200" />
            </div>
            <h2 className="text-lg font-black text-gray-900">Nenhum serviço encontrado</h2>
            <p className="text-sm text-gray-500 max-w-[240px] mt-2">
              Não encontramos serviços para "{search}" nesta categoria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(OptimizedMarketplace);
