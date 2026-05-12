import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CircleUser, 
  ChevronRight, 
  MapPin, 
  Star,
  Award,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, sanitizeAvatarUrl } from '../lib/utils';

export default function Professionals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todos');
  const [specialties, setSpecialties] = useState<string[]>(['Todos']);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const fetchProfessionals = async () => {
    setLoading(true);
    try {
      // 1. Fetch profiles first
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_professional', true)
        .order('username', { ascending: true });

      if (profError) throw profError;

      if (profiles) {
        let processedData = profiles.map(p => ({
          ...p,
          avgRating: '0.0',
          reviewCount: 0
        }));

        // 2. Try to fetch reviews for those profiles
        try {
          const { data: reviews, error: reviewError } = await supabase
            .from('professional_reviews')
            .select('professional_id, rating');
          
          if (!reviewError && reviews) {
            processedData = profiles.map((prof: any) => {
              const profReviews = reviews.filter((r: any) => r.professional_id === prof.id);
              const ratings = profReviews.map((r: any) => r.rating);
              const avgRating = ratings.length > 0 
                ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)
                : '0.0';
              
              return {
                ...prof,
                avgRating,
                reviewCount: ratings.length
              };
            });
          }
        } catch (revErr) {
          console.warn('Reviews table might not be ready:', revErr);
        }

        setProfessionals(processedData);
        const uniqueSpecs = Array.from(new Set(processedData.map((p: any) => p.specialty).filter(Boolean))) as string[];
        setSpecialties(['Todos', ...uniqueSpecs]);
      }
    } catch (err) {
      console.error('Error fetching professionals:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = prof.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         prof.specialty?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpec = selectedSpecialty === 'Todos' || prof.specialty === selectedSpecialty;
    return matchesSearch && matchesSpec;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-900" />
            </button>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Profissionais SNS</h1>
          </div>
          <div className="flex items-center space-x-2 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
             <ShieldCheck className="w-4 h-4 text-[#006747]" />
             <span className="text-[10px] font-black text-[#006747] uppercase tracking-wider">Verificados</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Procurar por nome ou especialidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
             <Filter className="w-5 h-5 text-gray-400 shrink-0 mx-2" />
             {specialties.map(spec => (
               <button
                 key={spec}
                 onClick={() => setSelectedSpecialty(spec)}
                 className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                   selectedSpecialty === spec 
                   ? 'bg-[#006747] text-white shadow-lg shadow-emerald-900/20' 
                   : 'bg-white text-gray-500 border border-gray-200 hover:border-emerald-500'
                 }`}
               >
                 {spec}
               </button>
             ))}
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : filteredProfessionals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProfessionals.map((prof) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key={prof.id}
                  className="bg-white rounded-[2rem] p-5 border border-gray-50 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative flex flex-col items-center"
                >
                  <div className="absolute top-4 right-4">
                     <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 shadow-sm transition-transform group-hover:scale-110">
                        <Star className="w-3 h-3 text-amber-500 fill-current" />
                        <span className="text-[10px] font-black text-gray-900">{prof.avgRating}</span>
                     </div>
                  </div>

                  <div className="flex flex-col items-center mb-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white bg-gray-50 flex items-center justify-center mb-3">
                      {sanitizeAvatarUrl(prof.avatar_url) ? (
                        <img src={sanitizeAvatarUrl(prof.avatar_url)!} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <CircleUser className="w-full h-full text-black stroke-[1px] p-2" />
                      )}
                    </div>
                    <div className="text-center">
                       <div className="flex items-center justify-center space-x-1">
                          <h3 className="font-black text-gray-900 text-sm tracking-tight group-hover:text-[#006747] transition-colors">{prof.username}</h3>
                          <ShieldCheck className="w-3 h-3 text-[#006747] fill-current" />
                       </div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{prof.specialty || 'Profissional SNS'}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6 w-full">
                      <div className="flex items-center justify-center text-gray-500 space-x-1.5">
                         <div className="bg-gray-50 p-1.5 rounded-lg shrink-0">
                           <MapPin className="w-3 h-3" />
                         </div>
                         <span className="text-[10px] font-medium leading-tight">
                           {prof.municipality && prof.province 
                             ? `${prof.municipality}, ${prof.province}` 
                             : prof.province || prof.municipality || 'Angola'}
                         </span>
                      </div>
                  </div>

                  <div className="flex gap-2 w-full">
                    <Link 
                      to={`/perfil/${prof.id}`}
                      className="flex-1 bg-[#006747] text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-center shadow-lg shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      Ver Perfil
                    </Link>
                    <button className="px-3.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 hover:text-gray-600 transition-colors">
                       <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
             </div>
             <p className="text-gray-500 font-bold">Nenhum profissional encontrado.</p>
             <button 
              onClick={() => {setSearchQuery(''); setSelectedSpecialty('Todos');}}
              className="mt-4 text-[#006747] text-xs font-black uppercase tracking-widest"
             >
               Limpar Filtros
             </button>
          </div>
        )}
      </main>
    </div>
  );
}
