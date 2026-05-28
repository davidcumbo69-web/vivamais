import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Presentation, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  Copy, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  Sparkles, 
  HeartHandshake, 
  Clock, 
  Lock, 
  Database,
  Info,
  Lightbulb,
  Trophy,
  Activity,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react';

interface Slide {
  id: string;
  slide_order: number;
  title: string;
  subtitle?: string;
  content: string;
  category: string;
  duration_seconds: number;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 'default-1',
    slide_order: 1,
    title: 'VIVA+ SAÚDE',
    subtitle: 'Ecossistema Inteligente de Saúde Digital e Bem-Estar',
    category: 'Identificação',
    content: 'Uma plataforma digital de saúde inovadora que conecta pacientes, profissionais de saúde e farmácias num único ecossistema inteligente, moderno e seguro. Focada no bem-estar, na prevenção ativa e na saúde personalizada, revolucionando o acesso e a celeridade no interior de Portugal (Chaves e região do Alto Tâmega).',
    duration_seconds: 40
  },
  {
    id: 'default-2',
    slide_order: 2,
    title: 'A Oportunidade e o Problema',
    subtitle: 'Rompendo a Inacessibilidade no Interior de Portugal',
    category: 'Identificação',
    content: '• Necessidade real de melhorar o acesso à informação médica fidedigna e combater o isolamento geográfico.\n• Falta de controlo na toma e rastreamento inteligente da medicação pelos utentes.\n• Urgência em facilitar a interação digital entre pacientes, clínicas, farmácias e médicos da rede privada ou do SNS.\n• Desperdiço de tempo de deslocações que afeta de forma desproporcional populações envelhecidas e rurais.',
    duration_seconds: 45
  },
  {
    id: 'default-3',
    slide_order: 3,
    title: 'O Produto e Serviço VIVA+',
    subtitle: 'O que oferecemos no ecossistema e plataforma?',
    category: 'Identificação',
    content: '• Acompanhamento inteligente de medicação com alertas de toma automáticos.\n• Consultas de telemedicina e agendamento ágil presencial de especialidades.\n• Acesso a conteúdos e publicações médicas certificadas (Artigos e Dicas).\n• Prescrição desmaterializada e envio de receitas de forma 100% digital.\n• Redes de apoio, partilha de conhecimento (Feeds, Reels e Grupos de Doentes).\n• Integração de stocks com as farmácias locais para encomendas instantâneas.',
    duration_seconds: 45
  },
  {
    id: 'default-4',
    slide_order: 4,
    title: 'Inovação da Empresa',
    subtitle: 'Diferencial de Produto e Inovação Incremental',
    category: 'Inovação',
    content: '• Inovação de Produto/Serviço: Desenvolvimento de plataforma multifuncional integrada que unifica farmácias, clínicas e profissionais num único ecossistema.\n• Inovação Incremental: Melhoria de processos de saúde já existentes através de tecnologia digital robusta, tornando-os céleres, acessíveis e eficientes.\n• Diferencial: Foco na segurança jurídica, conformidade com o RGPD, certificação de médicos, acompanhamento focado em termalismo e reabilitação ativa.',
    duration_seconds: 45
  },
  {
    id: 'default-5',
    slide_order: 5,
    title: 'Business Model Canvas - Clientes & Proposta',
    subtitle: 'A quem servimos e como geramos valor?',
    category: 'Business Canvas',
    content: '• Proposta de Valor: Conectar o ecossistema de saúde num ambiente seguro, de confiança, comodidade e inovação constante.\n• Segmentos de Clientes:\n  - Pacientes digitalmente ativos e cuidadores informais.\n  - Pessoas interessadas em bem-estar, saúde preventiva e termalismo.\n  - Profissionais de saúde autónomos que precisam de ferramentas de telemedicina.\n  - Farmácias locais e clínicas visando captação digital.',
    duration_seconds: 40
  },
  {
    id: 'default-6',
    slide_order: 6,
    title: 'BMC - Canais, Relação e Receitas',
    subtitle: 'Sustentabilidade e Fontes de Rendimento',
    category: 'Business Canvas',
    content: '• Canais: App móvel, Plataforma Web, Redes sociais e Parcerias públicas/privadas.\n• Relacionamento: Atendimento automatizado, Comunidades moderadas por profissionais.\n• Fontes de Receita:\n  - Subscrições Premium de gestão para Profissionais de Saúde (VIVA+ Pro).\n  - Taxa/Comissão sobre consultas realizadas e produtos na Loja VIVA (Marketplace).\n  - Taxa de integração e processamento de receitas para farmácias aderentes.\n  - Publicidade ética de marcas de bem-estar certificadas.',
    duration_seconds: 45
  },
  {
    id: 'default-7',
    slide_order: 7,
    title: 'Missão, Visão e Valores',
    subtitle: 'Guiados pela ética, segurança e futuro',
    category: 'Missão & Valores',
    content: '• Missão: Transformar o acesso à saúde através de tecnologia digital, conectando pacientes, profissionais e farmácias numa rede segura, moderna e intuitiva.\n• Visão: Ser a plataforma líder nacional em saúde preventiva, bem-estar e reabilitação termal, aproximando o interior de Portugal do futuro digital.\n• Valores: Inovação, Segurança extrema de dados clínicos (RGPD), Ética profissional, Transparência, Inclusão de idosos/cuidadores e Responsabilidade Social ativa.',
    duration_seconds: 40
  },
  {
    id: 'default-8',
    slide_order: 8,
    title: 'Forma Jurídica e Finanças',
    subtitle: 'Prontos para escalar o negócio com governança',
    category: 'Forma Jurídica',
    content: '• Promotores principais: David Cumbo e Equipa.\n• Forma Jurídica: Sociedade por Quotas (LDA) constituída legalmente em Portugal.\n• Capital Social Inicial: 10.000€ integralmente subscritos.\n• Estrutura Societária: David Cumbo (70% de quota-parte) e Co-promotores/Parceiros (30%).\n• Aplicação do capital: Desenvolvimento técnico do MVP, conformidade legal rígida e ações de marketing territorial no Alto Tâmega.',
    duration_seconds: 40
  }
];

export default function Pitch() {
  const { user, profile } = useAuth();
  const isAdmin = user?.email === 'davidcumbo69@gmail.com' || profile?.email === 'davidcumbo69@gmail.com';

  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [loading, setLoading] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // Timer States
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 Minutes total = 300 seconds
  const [slideTimeLeft, setSlideTimeLeft] = useState(DEFAULT_SLIDES[0].duration_seconds);
  const [autoProgress, setAutoProgress] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Editing States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<Partial<Slide> | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load slides from Supabase
  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Master Pitch Countdown & Slide Autoforward
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      interval = setInterval(() => {
        // Decrement overall 5 minute timer
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });

        // Decrement current slide timer
        setSlideTimeLeft(prevSlideTime => {
          if (prevSlideTime <= 1) {
            if (autoProgress) {
              setCurrentSlideIndex(prevIdx => {
                const nextIdx = prevIdx + 1;
                if (nextIdx < slides.length) {
                  setSlideTimeLeft(slides[nextIdx].duration_seconds);
                  showNotification(`Avançado para o Slide ${nextIdx + 1}: ${slides[nextIdx].title}`);
                  return nextIdx;
                } else {
                  setIsPlaying(false);
                  showNotification('Apresentação concluída!');
                  return prevIdx;
                }
              });
            } else {
              return 0;
            }
          }
          return prevSlideTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentSlideIndex, slides, autoProgress]);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pitch_slides')
        .select('*')
        .order('slide_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setSlides(data);
        setSlideTimeLeft(data[0].duration_seconds);
      } else {
        // Fallback or empty table load
        setSlides(DEFAULT_SLIDES);
        setSlideTimeLeft(DEFAULT_SLIDES[0].duration_seconds);
      }
    } catch (e: any) {
      console.error('[Pitch] Connect error:', e);
      setSlides(DEFAULT_SLIDES);
    } finally {
      setLoading(false);
    }
  };

  const syncToSupabase = async (updatedSlidesList: Slide[]) => {
    if (!isAdmin) return;
    try {
      // Clear existing records
      const { error: deleteError } = await supabase.from('pitch_slides').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (deleteError) throw deleteError;

      // Re-insert ordered records
      const itemsToInsert = updatedSlidesList.map((s, idx) => ({
        slide_order: idx + 1,
        title: s.title,
        subtitle: s.subtitle || '',
        content: s.content,
        category: s.category || 'Geral',
        duration_seconds: s.duration_seconds || 45
      }));

      const { error: insertError } = await supabase.from('pitch_slides').insert(itemsToInsert);
      if (insertError) throw insertError;

      showNotification('Alterações guardadas e sincronizadas no Supabase!');
      fetchSlides();
    } catch (e: any) {
      console.error('[Pitch] Sync table error:', e);
      showNotification('Guardado localmente. Sem sincronia remota.', 'error');
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      const nextIdx = currentSlideIndex - 1;
      setCurrentSlideIndex(nextIdx);
      setSlideTimeLeft(slides[nextIdx].duration_seconds);
    }
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      const nextIdx = currentSlideIndex + 1;
      setCurrentSlideIndex(nextIdx);
      setSlideTimeLeft(slides[nextIdx].duration_seconds);
    }
  };

  const handleResetTimer = () => {
    setIsPlaying(false);
    setTimeLeft(300);
    setSlideTimeLeft(slides[currentSlideIndex].duration_seconds);
  };

  const openEditModal = (slide: Slide) => {
    setEditingSlide({ ...slide });
    setIsEditModalOpen(true);
  };

  const handleSaveSlideEdit = async () => {
    if (!editingSlide || !editingSlide.title || !editingSlide.content) return;

    const updated = slides.map(s => {
      if (s.id === editingSlide.id) {
        return editingSlide as Slide;
      }
      return s;
    });

    setSlides(updated);
    setIsEditModalOpen(false);
    setEditingSlide(null);
    showNotification('Alterações aplicadas com sucesso!');

    await syncToSupabase(updated);
  };

  const handleAddSlide = async () => {
    const newSlide: Slide = {
      id: 'new-' + Date.now(),
      slide_order: slides.length + 1,
      title: 'Título do Novo Slide',
      subtitle: 'Subtítulo do Slide',
      content: '• Introduza tópicos aqui.\n• Outro tópico de saúde.',
      category: 'Geral',
      duration_seconds: 40
    };

    const updated = [...slides, newSlide];
    setSlides(updated);
    showNotification('Novo slide adicionado!');
    
    await syncToSupabase(updated);
  };

  const handleDeleteSlide = async (id: string) => {
    if (slides.length <= 1) {
      showNotification('Não pode apagar todos os slides!', 'error');
      return;
    }
    if (!confirm('Deseja mesmo eliminar este slide permanentemente?')) return;

    const filtered = slides.filter(s => s.id !== id).map((s, idx) => ({
      ...s,
      slide_order: idx + 1
    }));

    setSlides(filtered);
    if (currentSlideIndex >= filtered.length) {
      setCurrentSlideIndex(filtered.length - 1);
    }
    showNotification('Slide removido!');
    
    await syncToSupabase(filtered);
  };

  const formatMinSec = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  // Spectacular, personalized themes per slide to make it distinct & incredibly high-contrast
  const getSlideTheme = (index: number) => {
    const cleanIndex = index % 8;
    switch(cleanIndex) {
      case 0: // Slide 1 - VIVA+ SAÚDE (Apresentação Principal) - Dark Luxury Emerald
        return {
          bg: 'from-[#033020] via-[#012216] to-[#00100a]',
          accentText: 'text-[#4ade80]', // Bright glowing neon green
          subtitleText: 'text-emerald-100/90',
          badgeBg: 'bg-[#004d32] border border-[#00f79a]/20 text-[#00f79a]',
          bulletLight: 'bg-[#4ade80]',
          borderColor: 'border-emerald-800'
        };
      case 1: // Slide 2 - Oportunidade e Problema - Deep Crimson & Onyx (high warning color contrast)
        return {
          bg: 'from-[#1e0708] via-[#150304] to-[#090001]',
          accentText: 'text-[#fca5a5]', // Eye-safe crisp coral/rose pink
          subtitleText: 'text-rose-100/90',
          badgeBg: 'bg-[#4c0519] border border-[#f43f5e]/20 text-[#fca5a5]',
          bulletLight: 'bg-[#ef4444]',
          borderColor: 'border-rose-950'
        };
      case 2: // Slide 3 - O Produto e Serviço - Cool Tech Sapphire Blue (Clean & accessible)
        return {
          bg: 'from-[#072540] via-[#041528] to-[#010a14]',
          accentText: 'text-[#22d3ee]', // Clean bright electric cyan
          subtitleText: 'text-cyan-100/95',
          badgeBg: 'bg-[#083344] border border-[#06b6d4]/20 text-[#22d3ee]',
          bulletLight: 'bg-[#22d3ee]',
          borderColor: 'border-cyan-900'
        };
      case 3: // Slide 4 - Inovação da Empresa - Deep Futuristic Violet Amethyst & Lavender
        return {
          bg: 'from-[#1f0b35] via-[#110420] to-[#070110]',
          accentText: 'text-[#e879f9]', // Gorgeous glowing orchid fuchsia
          subtitleText: 'text-purple-100/90',
          badgeBg: 'bg-[#4a044e] border border-[#d946ef]/20 text-[#e879f9]',
          bulletLight: 'bg-[#d946ef]',
          borderColor: 'border-fuchsia-900'
        };
      case 4: // Slide 5 - BMC - Clientes & Proposta - Clean Obsidian Aqua Teal
        return {
          bg: 'from-[#052d30] via-[#02181b] to-[#000a0d]',
          accentText: 'text-[#2dd4bf]', // Vibrant sea mint green
          subtitleText: 'text-teal-100/90',
          badgeBg: 'bg-[#115e59] border border-[#0d9488]/20 text-[#2dd4bf]',
          bulletLight: 'bg-[#2dd4bf]',
          borderColor: 'border-teal-900'
        };
      case 5: // Slide 6 - BMC - Canais, Relação e Receitas - Autumn Copper & Rich Amber
        return {
          bg: 'from-[#3a2205] via-[#201202] to-[#100900]',
          accentText: 'text-[#fbbf24]', // Warm golden yellow
          subtitleText: 'text-amber-105/95',
          badgeBg: 'bg-[#78350f] border border-[#d97706]/20 text-[#fbbf24]',
          bulletLight: 'bg-[#fbbf24]',
          borderColor: 'border-[#78350f]'
        };
      case 6: // Slide 7 - Missão, Visão e Valores - Premium Forest Pine & Mint
        return {
          bg: 'from-[#0b2d13] via-[#051608] to-[#010602]',
          accentText: 'text-[#4ade80]', // Spring green
          subtitleText: 'text-emerald-100/95',
          badgeBg: 'bg-[#064e3b] border border-[#059669]/20 text-[#4ade80]',
          bulletLight: 'bg-[#10b981]',
          borderColor: 'border-[#064e3b]'
        };
      case 7: // Slide 8 - Forma Jurídica e Finanças - Platinum Carbon Gray
        return {
          bg: 'from-[#1c2430] via-[#10151d] to-[#080a0f]',
          accentText: 'text-[#94a3b8]', // Steel silver white
          subtitleText: 'text-slate-200/95',
          badgeBg: 'bg-[#334155] border border-[#475569]/20 text-[#cbd5e1]',
          bulletLight: 'bg-[#cbd5e1]',
          borderColor: 'border-slate-800'
        };
      default:
        return {
          bg: 'from-[#0f172a] via-[#020617] to-[#000000]',
          accentText: 'text-white',
          subtitleText: 'text-slate-300',
          badgeBg: 'bg-slate-850 text-slate-200 border border-slate-700/30',
          bulletLight: 'bg-white',
          borderColor: 'border-slate-900'
        };
    }
  };

  // Dynamic presenter notes mapping for David Cumbo's 5 minute pitch delivery
  const getPresenterNotes = (index: number) => {
    const notesList = [
      {
        title: "🔋 DICA 1: Introdução à VIVA+",
        points: [
          "Cumprimente o júri com confiança e olhar firme.",
          "Foque que a VIVA+ preenche um vazio geográfico em Portugal (Chaves, Alto Tâmega).",
          "Destaque o tripé: utentes, médicos privados/SNS e farmácias locais interligados de forma inteligente."
        ]
      },
      {
        title: "🚨 DICA 2: Oportunidade e Dor",
        points: [
          "Seja expressivo no problema. A população aqui no interior envelhece sã e salva, mas é isolada.",
          "Mencione a falta de transporte para ir à farmácia buscar medicamentos e futilidades burocráticas.",
          "Esclareça o alto índice de internamento decorrente da falta de controle de medicação pelos utentes."
        ]
      },
      {
        title: "💡 DICA 3: O ecossistema VIVA+",
        points: [
          "Apresente nossa solução unificada. Tudo em um (receitas, alertas automáticos, marketplace de farmácia).",
          "Ensine que os fóruns e reels de saúde fortalecem o conhecimento médico seguro fidedigno contra fake news."
        ]
      },
      {
        title: "🚀 DICA 4: Diferencial Tecnológico",
        points: [
          "Explique a Inovação Incremental: melhoramos serviços já existentes via automação rápida.",
          "Evidencie a conformidade total com o RGPD, que assegura o sigilo na troca de prescrições em PDF."
        ]
      },
      {
        title: "🎯 DICA 5: BMC - Segmentos",
        points: [
          "Defina clara e objetivamente quem paga e usa: pacientes seniores com cuidadores, médicos liberais e farmácias locais desejando escoar stock de bem-estar."
        ]
      },
      {
        title: "💰 DICA 6: Sustentabilidade e EBITDA",
        points: [
          "Segure no modelo de receita: subscrições VIVA+ Pro para profissionais de saúde, taxas de transação em vendas de fármacos e anúncios médicos verificados.",
          "Mostre que temos alta previsibilidade financeira desde as primeiras parcerias."
        ]
      },
      {
        title: "🌟 DICA 7: Missão e Identidade Social",
        points: [
          "Fale com o coração. Nosso maior valor é a inclusão digital das pessoas rurais e o acompanhamento de reabilitação termal.",
          "Conecte o termalismo tradicional do norte ao modelo tecnológico móvel moderno."
        ]
      },
      {
        title: "🏢 DICA 8: Fecho e Estrutura LDA",
        points: [
          "Apresente que a VIVA+ já nasce legalmente saudável como uma LDA de 10.000€ de capital social inicial.",
          "A maioria de 70% sob controle de coordenação do e-mail de David Cumbo garante celeridade decisória.",
          "Finalize agradecendo e convide a integrar o amanhã da saúde."
        ]
      }
    ];
    return notesList[index % notesList.length] || { title: "Dicas Gerais", points: ["Fale de forma natural.", "Mantenha o tempo controlado."] };
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#eaeff2] p-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Acesso Restrito</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Apenas o administrador do ecossistema VIVA+ saúde (<strong className="text-emerald-800 font-bold">davidcumbo69@gmail.com</strong>) tem privilégios para visualizar ou editar a apresentação do pitch de negócios.
          </p>
          <button 
            onClick={() => window.history.back()}
            className="w-full bg-[#006747] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex] || DEFAULT_SLIDES[0];
  const slideTheme = getSlideTheme(currentSlideIndex);
  const speakerTips = getPresenterNotes(currentSlideIndex);

  // Dynamic slide content renderer designed to fit without forcing scrolling, with clean weight and high legibility
  const renderSlideRows = (content: string, insideFullscreen: boolean = false) => {
    const lines = content.split('\n');
    return (
      <div className={`space-y-2 md:space-y-3 ${insideFullscreen ? 'mt-3' : 'mt-2'}`}>
        {lines.map((line, idx) => {
          const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
          const textWithoutMarker = line.replace(/^[•\-\s]+/, '').trim();

          if (!textWithoutMarker) return null;

          if (isBullet) {
            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.3 }}
                key={idx}
                className={`flex items-start space-x-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all duration-200 ${
                  insideFullscreen ? 'p-2.5 md:p-3.5' : 'p-2'
                }`}
              >
                {/* Visual bullet marker themed with slide aesthetic */}
                <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${slideTheme.bulletLight} shadow-sm`} />
                
                <div className={`font-normal tracking-wide text-white/95 leading-relaxed antialiased ${
                  insideFullscreen 
                    ? 'text-sm md:text-base lg:text-lg font-normal' 
                    : 'text-xs md:text-sm font-normal'
                }`}>
                  {textWithoutMarker}
                </div>
              </motion.div>
            );
          } else {
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.4 }}
                key={idx}
                className={`font-normal leading-relaxed tracking-wide text-gray-200 bg-white/5 rounded-xl border border-white/5 whitespace-pre-line antialiased ${
                  insideFullscreen 
                    ? 'p-3 md:p-4 text-sm md:text-base lg:text-lg font-normal' 
                    : 'p-2.5 md:p-3 text-xs md:text-sm font-normal'
                }`}
              >
                {line}
              </motion.div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#eaeff2] p-4 lg:p-8 pb-32">
      
      {/* Dynamic Fullscreen Presenter Mode overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[200] bg-gradient-to-br ${slideTheme.bg} text-white flex flex-col justify-between p-4 md:p-6 lg:p-10 h-screen overflow-hidden`}
          >
            {/* Fullscreen Main Content Container (Alinhado ao topo, extremamente compacto e responsivo) */}
            <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-start pt-1 md:pt-2 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2 md:space-y-3"
                >
                  <span className={`${slideTheme.accentText} uppercase tracking-widest text-[10px] md:text-xs font-bold`}>
                    Slide {currentSlideIndex + 1} • {currentSlide.category}
                  </span>
                  
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight uppercase leading-snug antialiased">
                    {currentSlide.title}
                  </h1>

                  {currentSlide.subtitle && (
                    <p className={`text-xs md:text-sm lg:text-base font-normal ${slideTheme.subtitleText} leading-normal`}>
                      {currentSlide.subtitle}
                    </p>
                  )}

                  {/* High-contrast list body with auto height limits */}
                  <div className="pt-2 flex-1 overflow-hidden">
                    {renderSlideRows(currentSlide.content, true)}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Fullscreen Progress Indicator & Footer navigation bars */}
            <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-4 rounded-full text-white shadow-xl transition-all ${isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <div className="text-left">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Tempo Restante de Slide</p>
                  <p className="text-sm font-bold text-white/90">{slideTimeLeft} Segundos</p>
                </div>
              </div>

              {/* Huge visual navigation pads and exit button */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl transition-all disabled:opacity-20 flex items-center space-x-2"
                >
                  <ChevronLeft className="w-6 h-6" />
                  <span className="text-xs font-black uppercase">Anterior</span>
                </button>
                
                <button
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="bg-white/15 hover:bg-white/25 text-white px-6 py-4 rounded-2xl transition-all disabled:opacity-20 flex items-center space-x-2"
                >
                  <span className="text-xs font-black uppercase text-emerald-300">Próximo</span>
                  <ChevronRight className="w-6 h-6 text-emerald-300" />
                </button>

                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="bg-red-500/10 hover:bg-red-500/25 border border-red-500/20 text-red-200 px-6 py-4 rounded-2xl transition-all flex items-center space-x-2"
                  title="Sair do Modo de Apresentação"
                >
                  <Minimize2 className="w-6 h-6" />
                  <span className="text-xs font-black uppercase text-red-200">Sair</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Normal Dashboard Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-tight leading-none flex items-center space-x-2">
            <span>Apresentação Profissional VIVA+</span>
          </h1>
          <p className="text-gray-500 text-xs font-medium leading-relaxed mt-2">
            Painel interativo de controle de pitch de 5 minutos desenvolvido para o júri e investidores.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Enter Presentation Mode trigger */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-950/20"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Modo Apresentação (Tela Cheia)</span>
          </button>

          <button
            onClick={handleAddSlide}
            className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Adicionar Slide</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Slide display area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Slide Card themed with custom beautiful color palette, glowing rings, optimized for readability */}
          <div className={`relative bg-gradient-to-br ${slideTheme.bg} text-white rounded-[2rem] p-5 lg:p-6 shadow-2xl border ${slideTheme.borderColor} overflow-hidden flex flex-col justify-between group transition-all duration-500`}>
            
            {/* Ambient Background glows to enrich premium look */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

            {/* Slide Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 z-10">
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${slideTheme.badgeBg}`}>
                {currentSlide.category || 'Geral'}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-white/40 text-[10px] font-mono">
                  Slide {currentSlideIndex + 1} de {slides.length}
                </span>
                <span className="bg-white/10 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold">
                  Duração: {currentSlide.duration_seconds}s
                </span>
              </div>
            </div>

            {/* Slide Body - Large and readable eyes-guard text style */}
            <div className="mt-3 mb-2 z-10 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-1.5 md:space-y-2"
                >
                  <h2 className="text-lg md:text-xl font-bold tracking-tight leading-tight uppercase font-sans text-white antialiased">
                    {currentSlide.title}
                  </h2>
                  
                  {currentSlide.subtitle && (
                    <p className={`text-xs md:text-sm font-normal ${slideTheme.subtitleText} leading-relaxed`}>
                      {currentSlide.subtitle}
                    </p>
                  )}

                  {/* Render Bullets & Content with High-contrast layout */}
                  <div className="pt-1 md:pt-1.5">
                    {renderSlideRows(currentSlide.content)}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Time progress line inside slide */}
            <div className="absolute bottom-0 left-0 h-1.5 bg-white/10 w-full overflow-hidden">
              <motion.div 
                className={`h-full ${slideTheme.bulletLight}`}
                initial={{ width: '0%' }}
                animate={{ width: `${((currentSlide.duration_seconds - slideTimeLeft) / currentSlide.duration_seconds) * 100}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>

            {/* Slide footer controls */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10 z-10">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditModal(currentSlide)}
                  className="bg-white/10 hover:bg-white/25 text-white p-2.5 rounded-xl transition-all"
                  title="Editar este Slide"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSlide(currentSlide.id)}
                  className="bg-red-500/20 hover:bg-red-500 text-red-100 p-2.5 rounded-xl transition-all"
                  title="Eliminar este Slide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="bg-white/10 hover:bg-white/25 text-emerald-300 p-2.5 rounded-xl transition-all disabled:opacity-35 disabled:pointer-events-none"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Presenter Master Controls */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            
            {/* Pitch Clock */}
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-800 flex items-center justify-center">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cronómetro Pitch</p>
                <p className={`text-2xl font-black ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-gray-900'}`}>
                  {formatMinSec(timeLeft)}
                </p>
                <p className="text-[9px] text-gray-400 font-bold">Tempo Limite: 5m (300s)</p>
              </div>
            </div>

            {/* Primary Action controls */}
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-4 rounded-full text-white shadow-lg transition-all ${isPlaying ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-[#006747] hover:bg-emerald-800 shadow-emerald-500/20'}`}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <button
                onClick={handleResetTimer}
                className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-all"
                title="Reiniciar Cronómetro"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Slide Progression setting */}
            <div className="text-right">
              <label className="flex items-center justify-end space-x-2 cursor-pointer select-none">
                <span className="text-xs font-bold text-gray-500">Avanço Automático</span>
                <input
                  type="checkbox"
                  checked={autoProgress}
                  onChange={(e) => setAutoProgress(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded"
                />
              </label>
              <p className="text-[10px] text-gray-400 mt-1 font-bold">
                Transição de slide em: <span className="text-[#006747] font-black">{slideTimeLeft}s</span>
              </p>
            </div>
          </div>
        </div>

        {/* Slide Sequencer & Dynamic Speaker Notes */}
        <div className="space-y-6">
          
          {/* List of Slides */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Sequência de Slides</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {slides.length} slides
              </span>
            </h3>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {slides.map((s, idx) => {
                const isCurrent = idx === currentSlideIndex;
                const slideCol = getSlideTheme(idx);
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentSlideIndex(idx);
                      setSlideTimeLeft(s.duration_seconds);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between ${isCurrent ? 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-sm' : 'bg-gray-55/50 border-gray-100 text-gray-700 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <span className={`w-6 h-6 rounded-lg text-[10px] font-black flex items-center justify-center shrink-0 ${isCurrent ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        {idx + 1}
                      </span>
                      <div className="overflow-hidden">
                        <p className="text-xs font-black truncate uppercase leading-tight">{s.title}</p>
                        <p className="text-[9px] text-gray-400 font-bold truncate">{s.subtitle || s.category}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-gray-400 font-bold shrink-0 ml-1">
                      {s.duration_seconds}s
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-gray-100 pt-4 mt-4 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center space-x-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cronograma total focado em 5 minutos</span>
              </p>
            </div>
          </div>

          {/* State of the art Speaker Notes card (Replacing SQL database setup warnings as completed) */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden relative">
            
            <div className="flex items-center space-x-2 text-emerald-800 font-black text-xs uppercase tracking-widest mb-3 border-b border-gray-50 pb-2">
              <Lightbulb className="w-4 h-4 text-emerald-500" />
              <span>Guia de Discurso do Fundador</span>
            </div>

            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider mb-2">
              {speakerTips.title}
            </h4>

            <div className="space-y-3">
              {speakerTips.points.map((pt, index) => (
                <div key={index} className="flex items-start space-x-2 text-[11px] text-gray-650 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <p className="leading-relaxed font-semibold text-gray-700">{pt}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-gray-100 text-center">
              <p className="text-[9px] font-bold text-gray-400 leading-snug">
                Fale pausadamente. Respire bem para a boa saúde vocal!
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Slide Editing / Creation Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingSlide && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden p-8 border border-gray-100"
            >
              <div className="flex items-center space-x-2 text-[#006747] font-black text-xs uppercase tracking-widest mb-1">
                <Edit className="w-4 h-4 text-emerald-500" />
                <span>Gestão e Detalhes do Slide</span>
              </div>
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">
                Editar Conteúdo do Slide
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Categoria</label>
                    <select
                      value={editingSlide.category || 'Geral'}
                      onChange={(e) => setEditingSlide({ ...editingSlide, category: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 focus:outline-[#006747]"
                    >
                      <option value="Identificação">Identificação</option>
                      <option value="Inovação">Inovação</option>
                      <option value="Business Canvas">Business Canvas</option>
                      <option value="Missão & Valores">Missão & Valores</option>
                      <option value="Forma Jurídica">Forma Jurídica</option>
                      <option value="Geral">Geral</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Duração (Segundos)</label>
                    <input
                      type="number"
                      value={editingSlide.duration_seconds || 45}
                      onChange={(e) => setEditingSlide({ ...editingSlide, duration_seconds: parseInt(e.target.value) || 30 })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 focus:outline-[#006747]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Título do Slide</label>
                  <input
                    type="text"
                    value={editingSlide.title || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:outline-[#006747]"
                    placeholder="Introduza o título"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Subtítulo ou Chamada</label>
                  <input
                    type="text"
                    value={editingSlide.subtitle || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                    className="w-full bg-gray-50 border border-[#eaeff2] rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:outline-[#006747]"
                    placeholder="Subtítulo informativo"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Tópicos / Conteúdo</label>
                  <textarea
                    rows={5}
                    value={editingSlide.content || ''}
                    onChange={(e) => setEditingSlide({ ...editingSlide, content: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs font-bold text-gray-800 focus:outline-[#006747] leading-relaxed resize-none"
                    placeholder="• Primeiro tópico importante&#10;• Próximo aspecto relevante de saúde"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center space-x-3">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSlideEdit}
                  className="flex-1 bg-[#006747] hover:bg-emerald-800 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  Guardar Slide
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating dynamic toast notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center space-x-3 px-6 py-4 rounded-3xl shadow-2xl backdrop-blur-md border border-emerald-800 bg-[#022216] text-[#4ade80]`}
          >
            <span className="text-xs font-black uppercase tracking-wide">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
