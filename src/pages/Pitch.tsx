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
  Settings,
  ArrowRight,
  Shield,
  Users,
  Target,
  TrendingUp,
  Coins,
  Layers,
  Table
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
    content: '• Introdução: Uma plataforma digital de saúde inovadora que conecta pacientes, profissionais de saúde e farmácias num único ecossistema inteligente, moderno e seguro. Focada no bem-estar, na prevenção ativa e na saúde personalizada, revolucionando o acesso e a celeridade em Portugal, com expansão estratégica para o mercado europeu.\n• Pacientes: Inclusão digital avançada, acompanhamento inteligente e alertas de medicação em tempo real em Portugal e na Europa.\n• Médicos & SNS: Telemedicina ágil integrada, prescrições eletrónicas e interligação com clínicas e hospitais nacionais.\n• Farmácias: Integração inteligente de stocks e aviamento rápido de receitas de bem-estar com cobertura universal.',
    duration_seconds: 40
  },
  {
    id: 'default-2',
    slide_order: 2,
    title: 'A Oportunidade e o Problema',
    subtitle: 'Rompendo a Inacessibilidade em Portugal e na Europa',
    category: 'Identificação',
    content: '• Cobertura Integrada: Combater a descentralização e otimizar o acesso à saúde célere em Portugal e em toda a Europa.\n• Falta de Rastreamento: Ausência de rastreio inteligente e dinâmico de medicação pelos próprios pacientes.\n• Interação Desconectada: Lacunas severas na ligação digital célere entre pacientes, médicos e farmácias locais.\n• Desperdício de Deslocações: Horas perdidas em viagens cansativas por pacientes e cuidadores de todo o país.',
    duration_seconds: 45
  },
  {
    id: 'default-3',
    slide_order: 3,
    title: 'O Produto e Serviço VIVA+',
    subtitle: 'O que oferecemos no ecossistema e plataforma?',
    category: 'Identificação',
    content: '• Alertas Inteligentes: Acompanhamento de medicação com notificações e avisos automáticos em tempo real.\n• Telemedicina Ágil: Consultas digitais integradas e agendamento de cuidados de saúde privados e públicos.\n• Saúde Certificada: Artigos científicos oficiais de médicos parceiros credenciados na nossa rede.\n• Receitas Digitais: Prescrições desmaterializadas em PDF enviadas diretamente ao smartphone do utente.\n• Redes & Comunidade: Fóruns moderados, Reels educativos e comunidades ativas de apoio familiar.\n• Sincronia Farmácias: Encomendas instantâneas integradas ao stock de receitas nas farmácias aderentes.',
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
    subtitle: 'Guiados pela ética, segurança e escala europeia',
    category: 'Missão & Valores',
    content: '• Missão: Transformar o acesso à saúde através de tecnologia digital, conectando pacientes, profissionais e farmácias numa rede segura, moderna e intuitiva.\n• Visão: Ser a plataforma líder nacional em Portugal e de referência na Europa em saúde preventiva, bem-estar e reabilitação ativa.\n• Valores: Inovação continuada, Segurança de dados (RGPD), Ética profissional, Transparência, Inclusão de doentes rurais/urbanos e Responsabilidade Social ativa.',
    duration_seconds: 40
  },
  {
    id: 'default-8',
    slide_order: 8,
    title: 'Forma Jurídica e Finanças',
    subtitle: 'Prontos para escalar o negócio com governança',
    category: 'Forma Jurídica',
    content: '• Promotores principais: David Cumbo e Equipa.\n• Forma Jurídica: Sociedade por Quotas (LDA) constituída legalmente em Portugal.\n• Capital Social Inicial: 10.000 € de capital social registado.\n• Estrutura Societária: David Cumbo (70% de quota-parte) e Co-promotores/Parceiros (30%).\n• Aplicação do capital: Desenvolvimento do MVP nacional, conformidade com o RGPD europeu e marketing estratégico de Portugal ao mercado europeu.',
    duration_seconds: 40
  },
  {
    id: 'default-9',
    slide_order: 9,
    title: 'Porquê Investir na VIVA+?',
    subtitle: 'Conclusão & Apelo de Negócio para Investidores',
    category: 'Investimento',
    content: '• Escalabilidade Europeia: Iniciando com piloto ágil em Chaves/Alto Tâmega, projetado para rápida expansão por todo o Portugal e escalabilidade subsequente na Europa.\n• Rentabilidade Recorrente SaaS: Modelo financeiro escalável baseado em subscrições clínicas mensais estáveis (SaaS) e comissões sobre consultas privadas e vendas digitais em toda a UE.\n• Forte Impacto Social (ESG): Alinhamento rigoroso com os Objetivos de Desenvolvimento Sustentável da UE, elegível para fundos de fomento nacional e de coesão europeus.',
    duration_seconds: 45
  },
  {
    id: 'default-10',
    slide_order: 10,
    title: 'Agradecimentos & Contactos',
    subtitle: 'O Futuro da Saúde Digital Começa Hoje',
    category: 'Encerramento',
    content: '• David Cumbo: Fundador e Diretor do Ecossistema VIVA+\n• Contacto Directo: davidcumbo69@gmail.com\n• Sede Registral: Chaves, Alto Tâmega, Portugal (Hub para Europa)\n• Visão Final: "Unindo inovação de excelência, segurança extrema de dados clínicos e empatia humana para garantir que ninguém seja deixado para trás no futuro da saúde digital em Portugal e na Europa."',
    duration_seconds: 35
  }
];

// Helper to parse content string to structured topics { title: string, desc: string }
export function parseTopics(textContent: string): { title: string; desc: string }[] {
  if (!textContent) return [];
  const lines = textContent.split('\n').filter(line => line.trim());
  const list: { title: string; desc: string }[] = [];
  
  for (const line of lines) {
    // Remove leading bullets and spaces
    const cleanLine = line.replace(/^[•\-\*\s]+/, '').trim();
    if (!cleanLine) continue;
    
    const colonIdx = cleanLine.indexOf(':');
    if (colonIdx > -1) {
      list.push({
        title: cleanLine.substring(0, colonIdx).trim(),
        desc: cleanLine.substring(colonIdx + 1).trim()
      });
    } else {
      list.push({
        title: cleanLine,
        desc: ''
      });
    }
  }
  return list;
}

// Helper to serialize structured topics to content string
export function serializeTopics(list: { title: string; desc: string }[]): string {
  return list
    .map(t => {
      const title = t.title.trim();
      const desc = t.desc.trim();
      if (title && desc) return `• ${title}: ${desc}`;
      if (title) return `• ${title}`;
      if (desc) return `• ${desc}`;
      return '';
    })
    .filter(Boolean)
    .join('\n');
}

export default function Pitch() {
  const { user, profile } = useAuth();
  const isAdmin = user?.email === 'davidcumbo69@gmail.com' || profile?.email === 'davidcumbo69@gmail.com';

  const [slides, setSlides] = useState<Slide[]>(() => {
    try {
      const cached = localStorage.getItem('viva_pitch_slides');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to parse cached slides from localStorage:', e);
    }
    return DEFAULT_SLIDES;
  });
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
  const [isStructuredMode, setIsStructuredMode] = useState(true);
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
      const hasCache = localStorage.getItem('viva_pitch_slides') !== null;
      if (!hasCache) {
        setLoading(true);
      }
      
      const { data, error } = await supabase
        .from('pitch_slides')
        .select('*')
        .order('slide_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setSlides(data);
        localStorage.setItem('viva_pitch_slides', JSON.stringify(data));
        if (!isPlaying) {
          setSlideTimeLeft(data[currentSlideIndex]?.duration_seconds || data[0].duration_seconds);
        }
      } else {
        if (error) {
          console.warn('[Pitch] Sync load error (using cache fallback):', error);
        } else {
          setSlides(DEFAULT_SLIDES);
          localStorage.setItem('viva_pitch_slides', JSON.stringify(DEFAULT_SLIDES));
          if (!isPlaying) {
            setSlideTimeLeft(DEFAULT_SLIDES[currentSlideIndex]?.duration_seconds || DEFAULT_SLIDES[0].duration_seconds);
          }
        }
      }
    } catch (e: any) {
      console.error('[Pitch] Connect error:', e);
    } finally {
      setLoading(false);
    }
  };

  const syncToSupabase = async (updatedSlidesList: Slide[]) => {
    // 1. Instant Cache Update (No latency waiting)
    try {
      localStorage.setItem('viva_pitch_slides', JSON.stringify(updatedSlidesList));
    } catch (e) {
      console.warn('Failed to commit local cache storage', e);
    }

    // 2. Admin Check
    if (!isAdmin) {
      showNotification('Modificado offline localmente com sucesso!');
      return;
    }

    try {
      // Clear existing records safely
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
      
      // Refresh the state quietly in background
      const { data } = await supabase
        .from('pitch_slides')
        .select('*')
        .order('slide_order', { ascending: true });
      if (data && data.length > 0) {
        setSlides(data);
        localStorage.setItem('viva_pitch_slides', JSON.stringify(data));
      }
    } catch (e: any) {
      console.error('[Pitch] Sync table error:', e);
      showNotification('Guardado em cache offline. Sem sincronia de rede.', 'error');
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
    const cleanIndex = index % 10;
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
      case 8: // Slide 9 - Conclusão / Investimento - Elegant Dark Gold Forest
        return {
          bg: 'from-[#1a1c0d] via-[#0b0c05] to-[#000000]',
          accentText: 'text-[#f59e0b]', // Vibrant Amber Gold
          subtitleText: 'text-amber-100/90',
          badgeBg: 'bg-[#451a03] border border-[#f59e0b]/20 text-[#f59e0b]',
          bulletLight: 'bg-[#f59e0b]',
          borderColor: 'border-amber-900'
        };
      case 9: // Slide 10 - Agradecimento & Contactos - Modern Emerald Jade
        return {
          bg: 'from-[#012217] via-[#00140e] to-[#000000]',
          accentText: 'text-[#34d399]', // Soft emerald mint
          subtitleText: 'text-emerald-100/95',
          badgeBg: 'bg-[#042f1a] border border-[#34d399]/20 text-[#34d399]',
          bulletLight: 'bg-[#34d399]',
          borderColor: 'border-emerald-950'
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
          "Prepare o terreno para o apelo do investimento final."
        ]
      },
      {
        title: "⚡ DICA 9: Conclusão e Investimento",
        points: [
          "Explique que o Tâmega é um oceano azul livre de concorrentes estruturados.",
          "Destaque as margens de lucro elevadas e a receita recorrente do modelo SaaS.",
          "Foque no forte valor ESG que facilita a captação de subsídios de fomento europeus."
        ]
      },
      {
        title: "🤝 DICA 10: Encerramento & Agradecimento",
        points: [
          "Faça os agradecimentos formais em nome de David Cumbo.",
          "Apresente os contactos para reuniões pós-pitch e atração de novos investidores.",
          "Encerre com paixão: 'Unindo inovação e proximidade para cuidar da nossa população! Muito obrigado!'"
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
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);
    const cleanIndex = currentSlideIndex % 10;
    const isSlide2OrMore = currentSlideIndex >= 1;

    // Helper for beautiful visually rich cards with dynamic padding that stretches
    const cardPadding = isSlide2OrMore
      ? (insideFullscreen ? 'p-5 md:p-6 lg:p-7' : 'p-4 md:p-5')
      : (insideFullscreen ? 'p-3 md:p-4' : 'p-2.5 md:p-3');

    // Dynamically increase font sizes for slide 2 through the last slide (currentSlideIndex >= 1)
    const textBase = isSlide2OrMore
      ? (insideFullscreen ? 'text-sm sm:text-base md:text-lg lg:text-xl' : 'text-xs sm:text-sm md:text-base lg:text-lg')
      : (insideFullscreen ? 'text-xs md:text-sm lg:text-base' : 'text-[11px] md:text-xs lg:text-sm');

    const titleBase = isSlide2OrMore
      ? (insideFullscreen ? 'text-base sm:text-lg md:text-xl lg:text-2xl font-black' : 'text-xs sm:text-sm md:text-base lg:text-lg font-bold')
      : (insideFullscreen ? 'text-sm md:text-base font-bold' : 'text-xs md:text-sm font-semibold');

    // Slide 1 Layout (Index 0): Welcome & Stakeholder hub layout
    if (cleanIndex === 0) {
      const parsed = parseTopics(content);
      let introText = "Uma plataforma digital de saúde inovadora que conecta pacientes, profissionais de saúde e farmácias num único ecossistema inteligente, moderno e seguro.";
      let hubs = [
        { title: "Pacientes", desc: "Inclusão digital avançada, acompanhamento inteligente e alertas de medicação em tempo real em Portugal e na Europa.", check: "✓ Foco no Utente" },
        { title: "Médicos & SNS", desc: "Telemedicina ágil integrada, prescrições eletrónicas e interligação com clínicas e hospitais nacionais.", check: "✓ Celeridade" },
        { title: "Farmácias", desc: "Integração inteligente de stocks e aviamento rápido de receitas de bem-estar com cobertura universal.", check: "✓ Logística Ágil" }
      ];

      if (parsed.length > 0) {
        // Find if any topic acts as the introduction (matches 'introdução', 'ecossistema', 'plataforma', or is a long sentence)
        const introTopic = parsed.find(t => 
          t.title.toLowerCase() === 'introdução' || 
          t.title.toLowerCase().includes('plataforma') || 
          t.title.toLowerCase().includes('ecossistema') || 
          t.title.length > 40
        );

        if (introTopic) {
          introText = introTopic.desc || introTopic.title;
          // Clean introText from duplicate bullet points if any
          introText = introText.replace(/^[•\-\*\s]+/, '').trim();
        }

        // The remaining topics become the cards (hubs), filtered to not repeat the introTopic
        const cardTopics = parsed.filter(t => t !== introTopic);

        cardTopics.forEach((item, idx) => {
          if (idx < 3) {
            hubs[idx] = {
              title: item.title,
              desc: item.desc || "Acompanhamento e integração fidedigna do ecossistema de saúde.",
              check: idx === 0 ? "✓ Foco no Utente" : idx === 1 ? "✓ Celeridade" : "✓ Logística Ágil"
            };
          }
        });
      }

      const icons = [Users, Activity, Layers];

      return (
        <div className="flex flex-col justify-between h-full space-y-2.5 antialiased text-left">
          {/* Top Hero introductory text */}
          <div className="bg-gradient-to-r from-[#012216] to-[#00100a] border border-emerald-500/10 rounded-2xl p-3 md:p-4">
            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest block mb-0.5">Ecossistema VIVA+</span>
            <p className={`${insideFullscreen ? 'text-xs md:text-sm lg:text-base' : 'text-[11px] md:text-xs lg:text-sm'} text-emerald-50/95 font-medium leading-relaxed`}>
              {introText}
            </p>
          </div>
          
          {/* Stakeholder cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-3">
            {hubs.map((item, idx) => {
              const IconComp = icons[idx] || Users;
              return (
                <div key={idx} className={`${cardPadding} bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-all`}>
                  <div>
                    <div className="flex items-center space-x-2 mb-1.5">
                      <div className={`p-1.5 rounded-lg ${slideTheme.badgeBg}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <h3 className={`${titleBase} text-white`}>{item.title}</h3>
                    </div>
                    <p className={`${textBase} text-white/70 font-normal leading-relaxed`}>
                      {item.desc}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono text-white/35 mt-1">{item.check}</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Slide 2 Layout (Index 1): Problems Bento warning Grid (2x2)
    if (cleanIndex === 1) {
      const problemTitles = [
        "Isolamento Geográfico",
        "Falta de Rastreamento",
        "Interação Desconectada",
        "Desperdício de Deslocações"
      ];
      const icons = [Info, Clock, Users, Activity];

      const pItems = lines.slice(0, 4).map((line, idx) => {
        const cleaned = line.replace(/^[•\-\s]+/, '').trim();
        const colonIdx = cleaned.indexOf(':');
        const heading = colonIdx > -1 ? cleaned.substring(0, colonIdx).trim() : (problemTitles[idx] || "Desafio Identificado");
        const textContent = colonIdx > -1 ? cleaned.substring(colonIdx + 1).trim() : cleaned;
        return { heading, textContent };
      });

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 h-full items-stretch flex-1">
          {pItems.map((item, idx) => {
            const IconComponent = icons[idx] || Info;
            return (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                key={idx}
                className={`${cardPadding} bg-red-950/20 hover:bg-red-950/30 border border-red-500/10 rounded-2xl flex flex-col justify-between transition-all h-full shadow-md`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 bg-red-500/10 rounded-xl text-red-400 shrink-0">
                    <IconComponent className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-red-350 font-black text-xs sm:text-sm md:text-base lg:text-lg uppercase tracking-wider leading-snug mb-1.5">{item.heading}</h4>
                    <p className={`${textBase} text-white/90 font-normal leading-relaxed`}>
                      {item.textContent}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      );
    }

    // Slide 3 Layout (Index 2): 3x2 Feature Grid (O Produto e Serviço VIVA+)
    if (cleanIndex === 2) {
      const titles = ["Alertas Inteligentes", "Telemedicina Ágil", "Saúde Certificada", "Receitas Digitais", "Redes & Comunidade", "Sincronia Farmácias"];
      const fItems = lines.slice(0, 6).map((line, idx) => {
        const cleaned = line.replace(/^[•\-\s]+/, '').trim();
        const colonIdx = cleaned.indexOf(':');
        const title = colonIdx > -1 ? cleaned.substring(0, colonIdx).trim() : (titles[idx] || "Funcionalidade");
        const textContent = colonIdx > -1 ? cleaned.substring(colonIdx + 1).trim() : cleaned;
        return { title, textContent };
      });

      const featTextBase = insideFullscreen ? 'text-xs sm:text-sm md:text-base' : 'text-[11px] sm:text-xs md:text-sm';
      const featTitleBase = insideFullscreen ? 'text-[10px] sm:text-xs md:text-sm' : 'text-[8px] sm:text-[10px] md:text-xs';
      
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 md:gap-4.5 h-full items-stretch flex-1">
          {fItems.map((item, idx) => {
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
                key={idx}
                className="p-4 md:p-5 bg-cyan-950/15 hover:bg-cyan-950/30 border border-cyan-500/10 rounded-2xl transition-all flex flex-col justify-between h-full shadow-sm"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-2.5 bg-cyan-500/5 px-2.5 py-1 rounded-lg w-fit">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 animate-pulse" />
                    <span className={`font-black uppercase tracking-widest text-cyan-300 ${featTitleBase}`}>
                      {item.title}
                    </span>
                  </div>
                  <p className={`${featTextBase} text-white/90 leading-relaxed font-normal`}>
                    {item.textContent}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      );
    }

    // Slide 4 Layout (Index 3): Chevron stages / Three pillars layout (Inovação da Empresa)
    if (cleanIndex === 3) {
      const innovationTitles = [
        "Inovação de Produto",
        "Inovação Incremental",
        "Diferencial Chaves"
      ];
      const colors = ["border-fuchsia-500/20 bg-fuchsia-950/15", "border-indigo-500/20 bg-indigo-950/15", "border-purple-500/20 bg-purple-950/15"];
      const badgeColors = ["text-fuchsia-400 bg-fuchsia-500/15", "text-indigo-400 bg-indigo-500/15", "text-purple-400 bg-purple-500/15"];

      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-full items-stretch flex-1">
          {lines.slice(0, 3).map((line, idx) => {
            const textContent = line.replace(/^[•\-\s]+/, '').trim();
            const parts = textContent.split(':');
            const mainTitle = parts[0] || innovationTitles[idx];
            const desc = parts[1] || parts[0];

            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={idx}
                className={`p-4 md:p-5 lg:p-6 rounded-2xl border ${colors[idx]} flex flex-col justify-between hover:scale-[1.01] transition-all h-full shadow-md`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${badgeColors[idx]}`}>
                      Etapa 0{idx + 1}
                    </span>
                    <Layers className="w-5 h-5 text-white/20" />
                  </div>
                  <h4 className="text-white font-extrabold text-sm sm:text-base md:text-lg lg:text-xl uppercase tracking-tight leading-tight mb-2">
                    {mainTitle}
                  </h4>
                  <p className={`${textBase} text-white/90 leading-relaxed font-normal`}>
                    {desc.trim()}
                  </p>
                </div>
                <div className="border-t border-white/5 pt-2 mt-4 text-[10px] md:text-xs font-mono text-white/30 flex items-center justify-between">
                  <span>VIVA+ Inovação</span>
                  <ArrowRight className="w-4 h-4 text-white/25" />
                </div>
              </motion.div>
            );
          })}
        </div>
      );
    }

    // Slide 5 Layout (Index 4): BMC - Clientes & Proposta split layout
    if (cleanIndex === 4) {
      const proposta = lines.find(l => l.toLowerCase().includes("proposta")) || "Conectar o ecossistema de saúde num ambiente seguro, de confiança, comodidade e inovação constante.";
      const clientSegments = lines.filter(l => !l.toLowerCase().includes("proposta"));

      return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-5 h-full items-stretch flex-1">
          {/* Proposta de Valor banner */}
          <div className="p-4 md:p-6 md:col-span-2 bg-teal-950/15 border border-teal-500/15 rounded-3xl flex flex-col justify-between hover:bg-teal-950/20 transition-all duration-300 shadow-md">
            <div>
              <span className="text-[10px] md:text-xs uppercase font-extrabold text-teal-400 tracking-widest font-mono">Business Canvas</span>
              <h4 className="text-teal-100 font-black text-sm sm:text-base md:text-lg lg:text-xl uppercase tracking-tight mt-1 mb-3">Proposta de Valor</h4>
              <p className={`${textBase} text-white/95 font-medium leading-relaxed`}>
                {proposta.replace(/^[•\-\s]+(Proposta de Valor:)?/i, '').trim()}
              </p>
            </div>
            <div className="p-3 bg-teal-500/10 rounded-xl flex items-center space-x-2 mt-4 border border-teal-500/20">
              <Shield className="w-5 h-5 text-teal-400 shrink-0" />
              <span className="text-xs text-teal-355 font-bold font-mono">100% Protegido & RGPD</span>
            </div>
          </div>

          {/* Segmentos de Clientes */}
          <div className="p-4 md:p-6 md:col-span-3 bg-white/5 border border-white/5 rounded-3xl flex flex-col justify-start hover:bg-white/10 transition-all duration-300 shadow-md">
            <span className="text-[10px] md:text-xs uppercase font-extrabold text-white/50 tracking-widest mb-3 font-mono">Segmentos de Clientes</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1 items-stretch">
              {clientSegments.map((segment, idx) => {
                const text = segment.replace(/^[•\-\s]+(Segmentos de Clientes:)?/i, '').trim();
                if (!text) return null;
                return (
                  <div key={idx} className="p-3.5 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl border border-white/5 flex items-start space-x-3 transition-all h-full">
                    <span className="w-2 rounded-full bg-teal-400 mt-1.5 shrink-0 animate-pulse" />
                    <span className="text-xs sm:text-sm md:text-base text-white/95 font-medium leading-snug">{text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Slide 6 Layout (Index 5): BMC - Canais, Relações e Receitas 3-Column horizontal boards
    if (cleanIndex === 5) {
      const canais = lines.filter(l => l.toLowerCase().startsWith("• canais") || l.toLowerCase().includes("canais:"));
      const relacao = lines.filter(l => l.toLowerCase().includes("relacionamento") || l.toLowerCase().includes("relação:"));

      const parseSectionItems = (list: string[], defaultVal: string) => {
        if (!list.length) return [defaultVal];
        const text = list[0].replace(/^[•\-\s]+(Canais:|Relacionamento:|Fontes de Receita:)?/gi, '').trim();
        if (text.includes(',')) {
          return text.split(',').map(s => s.trim());
        }
        return [text];
      };

      const canaisItems = canais.length ? parseSectionItems(canais, "App, Web, Redes") : ["App móvel", "Plataforma Web", "Redes sociais", "Parcerias locais"];
      const relacaoItems = relacao.length ? parseSectionItems(relacao, "Suporte ativo") : ["Atendimento automatizado", "Comunidade de Profissionais"];
      const receitasItems = ["VIVA+ Pro Subscrições (Profissionais)", "Taxas de Transação Loja & Farmácia", "Publicidade ética verificada"];

      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 h-full items-stretch flex-1">
          {/* Canais */}
          <div className="p-4 md:p-5 bg-amber-950/10 border border-amber-500/10 rounded-2xl flex flex-col justify-between hover:bg-amber-950/15 transition-all">
            <div>
              <div className="flex items-center space-x-2.5 mb-3 border-b border-amber-500/15 pb-2">
                <Target className="w-5 h-5 text-amber-400" />
                <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider shrink-0">Canais de Distribuição</span>
              </div>
              <div className="space-y-2">
                {canaisItems.map((item, id) => (
                  <div key={id} className="text-xs sm:text-sm md:text-base text-white/85 font-normal leading-relaxed flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Relacionamento */}
          <div className="p-4 md:p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-all">
            <div>
              <div className="flex items-center space-x-2.5 mb-3 border-b border-white/10 pb-2">
                <Users className="w-5 h-5 text-amber-300" />
                <span className="text-xs sm:text-sm font-black text-white/90 uppercase tracking-wider shrink-0">Relação Especial</span>
              </div>
              <div className="space-y-2">
                {relacaoItems.map((item, id) => (
                  <div key={id} className="text-xs sm:text-sm md:text-base text-white/85 font-normal leading-relaxed flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-sm shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Receitas */}
          <div className="p-4 md:p-5 bg-amber-950/15 border border-amber-500/15 rounded-2xl flex flex-col justify-between hover:bg-amber-950/20 transition-all">
            <div>
              <div className="flex items-center space-x-2.5 mb-3 border-b border-amber-500/20 pb-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wider shrink-0">Fontes de Receita</span>
              </div>
              <div className="space-y-2">
                {receitasItems.map((item, id) => (
                  <div key={id} className="text-xs sm:text-sm md:text-base text-white/95 font-semibold leading-relaxed flex items-center space-x-2">
                    <span className="text-amber-400 font-extrabold shrink-0 text-sm">$</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Slide 7 Layout (Index 6): Missão, Visão e Valores Horizontal Column Cards
    if (cleanIndex === 6) {
      const titles = ["Missão", "Visão", "Valores"];
      const items = lines.slice(0, 3);

      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 h-full items-stretch flex-1">
          {titles.map((title, idx) => {
            const line = items[idx] || "";
            const textContent = line.replace(/^[•\-\s]+(Missão:|Visão:|Valores:)?/gi, '').trim();

            return (
              <div key={idx} className="p-4 md:p-6 bg-emerald-950/10 border border-emerald-500/10 rounded-2xl flex flex-col justify-between hover:bg-emerald-950/15 transition-all duration-300 shadow-md h-full">
                <div>
                  <div className="flex items-center space-x-2.5 mb-3 pb-2 border-b border-emerald-500/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs sm:text-sm md:text-base font-black text-emerald-300 uppercase tracking-wider">{title}</span>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base text-white/95 leading-relaxed font-normal">
                    {textContent || "Garantir inclusão digital, saúde célere preventiva e ética exemplar em Portugal e na Europa."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Slide 8 Layout (Index 7): Governance social stats & Shares (Forma Jurídica e Finanças)
    if (cleanIndex === 7) {
      let founderPct = 70;
      let founderName = "David Cumbo (Fundador)";
      let teamPct = 30;
      let teamName = "Equipa & Consultores";
      let capitalSocial = "10.000 €";
      let sede = "Chaves, Portugal";
      let formaJuridica = "Sociedade por Quotas (LDA)";
      let promotores = "David Cumbo e Equipa";
      const aplFundos: string[] = [];

      lines.forEach(line => {
        const cleaned = line.replace(/^[•\-\s]+/, '').trim();
        const colonIdx = cleaned.indexOf(':');
        const key = colonIdx > -1 ? cleaned.substring(0, colonIdx).trim().toLowerCase() : cleaned.toLowerCase();
        const val = colonIdx > -1 ? cleaned.substring(colonIdx + 1).trim() : '';

        if (key.includes("estrutura societ") || key.includes("quota-parte") || (key.includes("david cumbo") && !key.includes("promotores"))) {
          const match = cleaned.match(/(\d+)%/);
          if (match) {
            founderPct = parseInt(match[1]);
            teamPct = 100 - founderPct;
          }
          if (colonIdx > -1) {
            founderName = cleaned.substring(0, colonIdx).trim();
          }
        } else if (key.includes("equipa") || key.includes("parceiros") || key.includes("consultores")) {
          const match = cleaned.match(/(\d+)%/);
          if (match) {
            teamPct = parseInt(match[1]);
          }
          if (colonIdx > -1) {
            teamName = cleaned.substring(0, colonIdx).trim();
          }
        } else if (key.includes("capital social") || (key.startsWith("capital") && !key.includes("aplicação") && !key.includes("alocação"))) {
          capitalSocial = val || cleaned;
        } else if (key.includes("forma juríd") || key === "forma") {
          formaJuridica = val || cleaned;
        } else if (key.includes("sede")) {
          sede = val || cleaned;
        } else if (key.includes("promotore")) {
          promotores = val || cleaned;
        } else if (cleaned) {
          if (key.includes("aplicação") || key.includes("alocação") || key.includes("investimento")) {
            const listStr = val || cleaned;
            const parts = listStr.split(/[,;.]+/).map(p => p.trim()).filter(p => p.length > 5);
            parts.forEach(p => {
              if (!aplFundos.includes(p)) aplFundos.push(p);
            });
          } else {
            aplFundos.push(cleaned);
          }
        }
      });

      // Filter out any overlap with standard labels in application of funds
      const finalApl = aplFundos.filter(item => {
        const lower = item.toLowerCase();
        return !lower.includes("david cumbo e equipa") && 
               !lower.includes("sociedade por quotas") && 
               !lower.includes("10.000 €") &&
               !lower.includes("promotores principais");
      });

      if (finalApl.length === 0) {
        finalApl.push(
          "Desenvolvimento do MVP nacional focado no ecossistema e portal VIVA+",
          "Conformidade total com as normas do RGPD português e diretrizes europeias",
          "Marketing estratégico de ativação e inserção célere nos mercados alvo"
        );
      }

      const r = 40;
      const circ = 2 * Math.PI * r; // ~251.32
      const founderDash = (founderPct / 100) * circ;
      const teamDash = (teamPct / 100) * circ;

      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5 h-full items-stretch flex-1 text-left">
          {/* Card 1: Estudo Societário com Gráfico Real de Quotas */}
          <div className="p-4 md:p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-all shadow-lg backdrop-blur-md">
            <div>
              <div className="flex items-center gap-1.5 mb-2 bg-white/[0.04] w-fit px-2 py-0.5 rounded-full border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[9px] uppercase font-bold text-white/50 tracking-widest font-mono">Governação & Quotas</span>
              </div>
              <h4 className="text-xs md:text-sm font-extrabold text-white tracking-tight uppercase mb-2">Estrutura Societária</h4>
              
              {/* Gráfico Real Dividido SVG */}
              <div className="flex justify-center items-center py-2 relative my-2">
                <svg width="110" height="110" className="transform -rotate-90">
                  {/* Background Track */}
                  <circle
                    cx="55"
                    cy="55"
                    r={r}
                    fill="transparent"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="10"
                  />
                  {/* Founder Segment (Emerald) */}
                  <circle
                    cx="55"
                    cy="55"
                    r={r}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${founderDash} ${circ}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  {/* Team Segment (Blue) */}
                  <circle
                    cx="55"
                    cy="55"
                    r={r}
                    fill="transparent"
                    stroke="#3b82f6"
                    strokeWidth="10"
                    strokeDasharray={`${teamDash} ${circ}`}
                    strokeDashoffset={-founderDash}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                
                {/* Center Badge */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest font-mono">Total LDA</span>
                  <span className="text-xs font-black text-emerald-400 tracking-tight">100%</span>
                </div>
              </div>

              {/* Legenda do Gráfico */}
              <div className="space-y-1.5 mt-2">
                <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[11px] text-white/95 font-medium truncate" title={founderName}>{founderName}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 font-mono">{founderPct}%</span>
                </div>

                <div className="bg-white/[0.02] p-2 rounded-xl border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 max-w-[70%]">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-[11px] text-white/70 font-medium truncate" title={teamName}>{teamName}</span>
                  </div>
                  <span className="text-xs font-bold text-blue-400 font-mono">{teamPct}%</span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-xl text-xs font-medium font-sans flex items-center justify-between mt-3">
              <span className="text-white/60 text-[10px]">Capital de Registo:</span>
              <span className="font-bold text-white text-[10px] font-mono">{capitalSocial}</span>
            </div>
          </div>

          {/* Card 2: Detalhes Societários */}
          <div className="p-4 md:p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-all shadow-lg backdrop-blur-md">
            <div>
              <div className="flex items-center gap-1.5 mb-2 bg-white/[0.04] w-fit px-2 py-0.5 rounded-full border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-[9px] uppercase font-bold text-white/50 tracking-widest font-mono">Enquadramento Legal</span>
              </div>
              <h4 className="text-xs md:text-sm font-extrabold text-white tracking-tight uppercase mb-2">Dados da Sociedade</h4>

              <div className="space-y-2 mt-2 text-[11px]">
                {/* Promotores */}
                <div className="p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-[8px] text-white/40 uppercase font-mono tracking-wider block mb-0.5">Promotores Principais</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 font-bold text-[9px]">
                      V+
                    </div>
                    <span className="text-white font-medium truncate max-w-[180px]">{promotores}</span>
                  </div>
                </div>

                {/* Forma Jurídica */}
                <div className="p-2 bg-white/[0.02] border border-white/5 rounded-xl">
                  <span className="text-[8px] text-white/40 uppercase font-mono tracking-wider block mb-0.5">Forma Jurídica</span>
                  <span className="text-white font-medium leading-snug block">{formaJuridica}</span>
                </div>

                {/* Sede Registal */}
                <div className="p-2 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[8px] text-white/40 uppercase font-mono tracking-wider block">Sede Registal</span>
                    <span className="text-white font-bold mt-0.5 block">{sede}</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] px-1.5 py-0.5 rounded-full font-extrabold tracking-widest uppercase font-mono">PT</span>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-white/30 mt-3 pt-2 border-t border-white/5 flex justify-between items-center font-mono">
              <span>Jurisdição: Portugal (UE)</span>
              <span>Ativo 100%</span>
            </div>
          </div>

          {/* Card 3: Aplicação Estratégica / Alocação */}
          <div className="p-4 md:p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-all shadow-lg backdrop-blur-md">
            <div>
              <div className="flex items-center gap-1.5 mb-2 bg-white/[0.04] w-fit px-2 py-0.5 rounded-full border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span className="text-[9px] uppercase font-bold text-white/50 tracking-widest font-mono">Aplicação do Capital</span>
              </div>
              <h4 className="text-xs md:text-sm font-extrabold text-white tracking-tight uppercase mb-2">Ativos do MVP</h4>

              <div className="space-y-2 mt-2">
                {finalApl.slice(0, 3).map((item, idx) => {
                  const colors = [
                    { border: "border-emerald-500/20", bg: "bg-emerald-500/10", text: "text-emerald-400", label: "01. MVP" },
                    { border: "border-blue-500/20", bg: "bg-blue-500/10", text: "text-blue-400", label: "02. RGPD" },
                    { border: "border-amber-500/20", bg: "bg-amber-500/10", text: "text-amber-400", label: "03. GO-TO-MARKET" }
                  ];
                  const scheme = colors[idx % colors.length];

                  return (
                    <div key={idx} className="p-2 bg-white/[0.02] border border-white/5 rounded-xl flex items-start gap-2 transition-all hover:bg-white/[0.04]">
                      <span className={`px-1 rounded text-[7px] font-black tracking-wider uppercase font-mono shrink-0 ${scheme.bg} ${scheme.border} ${scheme.text} border mt-0.5`}>
                        {scheme.label}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-white/90 leading-tight font-normal">
                        {item}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white/5 text-white/50 text-[9px] p-2 rounded-xl flex items-center justify-center gap-1 mt-3 font-mono">
              <span className="text-amber-400">⚡</span>
              <span>Escalar nacional e europeu</span>
            </div>
          </div>
        </div>
      );
    }

    // Slide 9 Layout (Index 8): Investor Conviction & Pitch Conclusion
    if (cleanIndex === 8) {
      const defaultPillars = [
        { title: "Escalabilidade Europeia", text: "Iniciando com piloto ágil no Alto Tâmega, projetado para rápida expansão por todo o Portugal e escalabilidade subsequente na Europa.", badge: "Escala & Crescimento" },
        { title: "Previsibilidade SaaS", text: "Modelo financeiro robusto baseado em subscrições clínicas (SaaS) e comissões sobre transações farmacêuticas e consultas particulares na UE.", badge: "EBITDA Saudável" },
        { title: "Alto Valor Social / ESG", text: "Combate ativo à exclusão digital e isolamento geográfico na Europa. Totalmente elegível para fundos europeus de inovação e coesão.", badge: "Impacto Global" }
      ];

      const pillars = lines.length >= 3 ? lines.slice(0, 3).map((line, i) => {
        const cleaned = line.replace(/^[•\-\s]+/, '').trim();
        const colonIdx = cleaned.indexOf(':');
        const title = colonIdx > -1 ? cleaned.substring(0, colonIdx).trim() : (defaultPillars[i]?.title || "Pilar");
        const text = colonIdx > -1 ? cleaned.substring(colonIdx + 1).trim() : cleaned;
        return { title, text, badge: defaultPillars[i]?.badge || "VIVA+ Ativo" };
      }) : defaultPillars;

      const icons = [Target, TrendingUp, Shield];

      return (
        <div className="flex flex-col justify-between h-full space-y-4 font-sans text-left flex-1">
          {/* Top slogan */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span className="text-xs sm:text-sm md:text-base font-black uppercase text-amber-300 tracking-widest font-mono">Porquê Investir Convosco Hoje?</span>
            </div>
            <span className="text-[10px] sm:text-xs bg-amber-500/25 text-white px-3 py-1 rounded-full font-mono font-bold">Retorno & Impacto</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full items-stretch">
            {pillars.map((p, idx) => {
              const IconComp = icons[idx] || Target;
              return (
                <div key={idx} className="p-4 md:p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col justify-between hover:bg-white/10 transition-all h-full shadow-md">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-300">
                        <IconComp className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-amber-400/80 bg-amber-400/5 px-2.5 py-1 rounded-md">{p.badge}</span>
                    </div>
                    <h4 className="text-xs sm:text-sm md:text-base font-black text-white uppercase mb-2 leading-tight tracking-tight">{p.title}</h4>
                    <p className="text-xs sm:text-sm text-white/85 font-normal leading-relaxed">{p.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center py-3 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-transparent border border-white/5 rounded-2xl">
            <span className="text-xs sm:text-sm md:text-base font-semibold text-white tracking-wide">"Investir na VIVA+ é consolidar a saúde digital onde ela é mais valiosa e necessária."</span>
          </div>
        </div>
      );
    }

    // Slide 10 Layout (Index 9): Encerramento & Agradecimentos
    if (cleanIndex === 9) {
      let fName = "David Cumbo";
      let fRole = "Fundador & Core Promotor";
      let fEmail = "davidcumbo69@gmail.com";
      let fSede = "Chaves, Alto Tâmega, Portugal (Hub para Europa)";
      let fQuote = "Unindo inovação de excelência, segurança extrema de dados clínicos e empatia humana para garantir que ninguém seja deixado para trás no futuro da saúde digital em Portugal e na Europa.";

      lines.forEach(line => {
        const cleaned = line.replace(/^[•\-\s]+/, '').trim();
        const colonIdx = cleaned.indexOf(':');
        const key = colonIdx > -1 ? cleaned.substring(0, colonIdx).trim().toLowerCase() : cleaned.toLowerCase();
        const val = colonIdx > -1 ? cleaned.substring(colonIdx + 1).trim() : '';

        if (key.includes("david cumbo") || key.includes("fundador")) {
          fName = colonIdx > -1 ? key.replace(/([•\-\s]*david cumbo[•\-\s]*)/gi, '').trim() || "David Cumbo" : "David Cumbo";
          if (val) fRole = val;
        } else if (key.includes("contacto") || key.includes("directo") || key.includes("email") || key.includes("@")) {
          fEmail = val || cleaned;
        } else if (key.includes("sede") || key.includes("registal")) {
          fSede = val || cleaned;
        } else if (key.includes("visão final") || key.includes("quote") || key.includes("viva+") || key.includes("unindo") || cleaned.startsWith('"')) {
          fQuote = val || cleaned;
        }
      });

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 h-full font-sans text-left items-stretch flex-1">
          {/* Left Column: Thank statement & contact cards */}
          <div className="p-5 md:p-6 bg-gradient-to-br from-[#012217] to-[#00140e] border border-emerald-500/10 rounded-3xl flex flex-col justify-between hover:bg-emerald-950/20 transition-all shadow-lg h-full">
            <div>
              <span className="text-[10px] md:text-xs uppercase font-black text-emerald-400 tracking-widest block mb-1">Contacto Oficial</span>
              <h3 className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-tight mb-4">Agenda de Reuniões</h3>
              
              <div className="space-y-3.5 mt-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/20 transition-all">
                  <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-widest leading-none mb-1">{fRole}</span>
                  <span className="text-sm sm:text-base font-bold text-white block mt-0.5">{fName}</span>
                  <span className="text-xs sm:text-sm text-white/80 block mt-1 font-mono">{fEmail}</span>
                </div>

                <div className="px-1 text-xs sm:text-sm text-white/70 font-mono flex items-center space-x-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                  <span>Sede: {fSede}</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-white/40 mt-3 border-t border-white/5 pt-2">
              VIVA+ Saúde Digital LDA © 2026
            </div>
          </div>

          {/* Right Column: Thank core image & premium quote */}
          <div className="p-5 md:p-6 bg-white/5 border border-white/5 rounded-3xl flex flex-col justify-between hover:bg-white/10 transition-all text-left shadow-lg h-full">
            <div>
              <span className="text-[9px] uppercase font-bold text-white/45 tracking-widest block mb-1 font-mono">Agradecimento</span>
              <h4 className="text-xl sm:text-2xl md:text-3xl font-black text-emerald-300 uppercase leading-none mt-1 mb-3">Muito Obrigado!</h4>
              
              <p className="text-xs sm:text-sm md:text-base text-white/95 italic leading-relaxed mt-4 border-l-3 border-emerald-400 pl-4 py-1.5 bg-white/5 rounded-r-xl">
                {fQuote}
              </p>
            </div>

            <div className="bg-emerald-500 text-neutral-950 p-3 md:p-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest text-center mt-4 hover:scale-101 active:scale-99 transition-all cursor-pointer">
              <span>Unir Vidas, Cuidar do Futuro</span>
            </div>
          </div>
        </div>
      );
    }

    // Default Fallback Layout for user created slides:
    const isBulletList = lines.some(line => line.trim().startsWith('•') || line.trim().startsWith('-'));
    if (isBulletList && lines.length > 1) {
      const itemsToRender = lines.map(line => line.replace(/^[•\-\s]+/, '').trim());
      const itemCount = itemsToRender.length;
      
      // Determine grid layout
      let gridClass = "grid-cols-1";
      if (itemCount === 2) gridClass = "grid-cols-1 md:grid-cols-2";
      else if (itemCount >= 3) gridClass = "grid-cols-1 md:grid-cols-3";

      return (
        <div className={`grid ${gridClass} gap-4 h-full items-stretch flex-1`}>
          {itemsToRender.map((text, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              key={idx}
              className="p-4 md:p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 flex items-start space-x-3 transition-all h-full shadow-sm"
            >
              <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${slideTheme.bulletLight}`} />
              <p className={`${textBase} text-white/95 font-normal leading-relaxed`}>
                {text}
              </p>
            </motion.div>
          ))}
        </div>
      );
    }

    // Default basic text line-by-line fallback
    const fallbackPlainBase = insideFullscreen ? 'text-sm sm:text-base md:text-lg lg:text-xl p-4' : 'text-xs sm:text-sm md:text-base lg:text-lg p-3.5';

    return (
      <div className={`space-y-3.5 md:space-y-4 ${insideFullscreen ? 'mt-4' : 'mt-3'} h-full flex flex-col justify-start flex-1`}>
        {lines.map((line, idx) => {
          const textWithoutMarker = line.replace(/^[•\-\s]+/, '').trim();
          return (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
              key={idx}
              className={`font-normal leading-relaxed text-gray-200 bg-white/5 rounded-2xl border border-white/5 whitespace-pre-line antialiased h-full ${fallbackPlainBase}`}
            >
              {textWithoutMarker}
            </motion.div>
          );
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
                  
                  <h1 className="text-base md:text-lg lg:text-xl font-bold tracking-tight uppercase leading-tight antialiased">
                    {currentSlide.title}
                  </h1>

                  {currentSlide.subtitle && (
                    <p className={`text-[11px] md:text-xs font-normal ${slideTheme.subtitleText} leading-normal opacity-90`}>
                      {currentSlide.subtitle}
                    </p>
                  )}

                  {/* High-contrast list body with auto height limits */}
                  <div className="pt-1 flex-1 overflow-hidden">
                    {renderSlideRows(currentSlide.content, true)}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Fullscreen Progress Indicator & Footer navigation bars - reduced height by ~5x, thinner buttons, compact layout */}
            <div className="border-t border-white/10 pt-2 md:pt-2.5 flex flex-row items-center justify-between gap-2.5">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-1.5 md:p-2 rounded-lg text-white shadow-sm transition-all border border-white/10 flex items-center justify-center ${isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-700 hover:bg-emerald-800'}`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="text-left">
                  <p className="text-[9px] text-white/45 font-semibold uppercase tracking-widest leading-none">Tempo Restante</p>
                  <p className="text-xs font-bold text-white/95 leading-none mt-0.5">{slideTimeLeft}s</p>
                </div>
              </div>

              {/* Thinner, elegant, non-fat visual navigation pads and exit button */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handlePrevSlide}
                  disabled={currentSlideIndex === 0}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 text-white/90 px-3 py-1.5 rounded-lg transition-all disabled:opacity-20 flex items-center space-x-1 hover:border-white/10"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Anterior</span>
                </button>
                
                <button
                  onClick={handleNextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-20 flex items-center space-x-1 hover:border-white/15"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 hidden sm:inline">Próximo</span>
                  <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
                </button>

                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="bg-red-500/10 hover:bg-red-500/15 border border-red-500/15 text-red-200 px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1"
                  title="Sair do Modo de Apresentação"
                >
                  <Minimize2 className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-100 hidden sm:inline">Sair</span>
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
                  <h2 className="text-sm md:text-base font-bold tracking-tight leading-tight uppercase font-sans text-white antialiased">
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

          {/* Editor Rápido de Tópicos e Conteúdo (Direct slide layout modifier) */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl space-y-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
              <div className="flex items-center space-x-2 text-[#006747]">
                <Edit className="w-4.5 h-4.5 text-[#006747] shrink-0" />
                <span className="font-black text-xs uppercase tracking-widest">Painel de Tópicos e Edição Rápida (Slide {currentSlideIndex + 1})</span>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 px-3 py-0.5 rounded-full font-black uppercase w-fit">
                Tema: {currentSlide.category}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Título do Slide</label>
                <input
                  type="text"
                  value={currentSlide.title}
                  onChange={(e) => {
                    const updated = slides.map((s, idx) => idx === currentSlideIndex ? { ...s, title: e.target.value } : s);
                    setSlides(updated);
                    syncToSupabase(updated);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-800 focus:outline-[#006747] transition-all"
                  placeholder="Título do Slide"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Subtítulo do Slide</label>
                <input
                  type="text"
                  value={currentSlide.subtitle || ''}
                  onChange={(e) => {
                    const updated = slides.map((s, idx) => idx === currentSlideIndex ? { ...s, subtitle: e.target.value } : s);
                    setSlides(updated);
                    syncToSupabase(updated);
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold text-gray-800 focus:outline-[#006747] transition-all"
                  placeholder="Subtítulo do slide"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 mt-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">
                  Tópicos / Conteúdo do Slide
                </label>
                <div className="flex bg-gray-100 p-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider self-start sm:self-auto border border-gray-200 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setIsStructuredMode(true)}
                    className={`px-3 py-1 rounded-md transition-all ${isStructuredMode ? 'bg-[#006747] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Estruturado (Recomendado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsStructuredMode(false)}
                    className={`px-3 py-1 rounded-md transition-all ${!isStructuredMode ? 'bg-[#006747] text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Texto Livre (Raw)
                  </button>
                </div>
              </div>

              {isStructuredMode ? (
                <div className="space-y-2.5">
                  {parseTopics(currentSlide.content).map((topic, idx, allTopics) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl relative hover:border-gray-300 transition-all shadow-sm">
                      <div className="w-full sm:w-[150px] shrink-0">
                        <label className="block text-[8px] font-black uppercase text-gray-400 mb-0.5 tracking-wider">Tópico</label>
                        <input
                          type="text"
                          value={topic.title}
                          onChange={(e) => {
                            const updatedTopics = [...allTopics];
                            updatedTopics[idx] = { ...topic, title: e.target.value };
                            const newText = serializeTopics(updatedTopics);
                            const updatedSlidesList = slides.map((s, sIdx) => sIdx === currentSlideIndex ? { ...s, content: newText } : s);
                            setSlides(updatedSlidesList);
                            syncToSupabase(updatedSlidesList);
                          }}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-850 focus:outline-[#006747] focus:ring-1 focus:ring-[#006747]"
                          placeholder="Ex: Pacientes"
                        />
                      </div>
                      <div className="flex-1 w-full flex items-end sm:items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[8px] font-black uppercase text-gray-400 mb-0.5 tracking-wider">Conteúdo</label>
                          <textarea
                            rows={1}
                            value={topic.desc}
                            onChange={(e) => {
                              const updatedTopics = [...allTopics];
                              updatedTopics[idx] = { ...topic, desc: e.target.value };
                              const newText = serializeTopics(updatedTopics);
                              const updatedSlidesList = slides.map((s, sIdx) => sIdx === currentSlideIndex ? { ...s, content: newText } : s);
                              setSlides(updatedSlidesList);
                              syncToSupabase(updatedSlidesList);
                            }}
                            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-750 focus:outline-[#006747] focus:ring-1 focus:ring-[#006747] leading-normal resize-none"
                            placeholder="Descrição d'este aspecto..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updatedTopics = allTopics.filter((_, i) => i !== idx);
                            const newText = serializeTopics(updatedTopics);
                            const updatedSlidesList = slides.map((s, sIdx) => sIdx === currentSlideIndex ? { ...s, content: newText } : s);
                            setSlides(updatedSlidesList);
                            syncToSupabase(updatedSlidesList);
                          }}
                          className="text-red-500 hover:text-red-700 hover:scale-105 p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-all self-end mb-0.5"
                          title="Apagar Tópico"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const updatedTopics = [...parseTopics(currentSlide.content), { title: 'Novo Tópico', desc: '' }];
                      const newText = serializeTopics(updatedTopics);
                      const updatedSlidesList = slides.map((s, sIdx) => sIdx === currentSlideIndex ? { ...s, content: newText } : s);
                      setSlides(updatedSlidesList);
                      syncToSupabase(updatedSlidesList);
                    }}
                    className="w-full py-2.5 bg-[#006747]/5 hover:bg-[#006747]/10 text-[#006747] rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center space-x-1 border border-[#006747]/15 shadow-sm hover:scale-[1.01]"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0 animate-pulse text-emerald-600" />
                    <span>Adicionar Novo Tópico</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={6}
                    value={currentSlide.content}
                    onChange={(e) => {
                      const updated = slides.map((s, idx) => idx === currentSlideIndex ? { ...s, content: e.target.value } : s);
                      setSlides(updated);
                      syncToSupabase(updated);
                    }}
                    className="w-full bg-gray-50 border border-gray-250 rounded-2xl p-4 text-xs font-bold text-gray-800 focus:outline-[#006747] leading-relaxed resize-none font-sans"
                    placeholder="• Tópico 1&#10;• Tópico 2&#10;• Titulo Coluna: Conteúdo do tópico..."
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const hasContent = currentSlide.content.trim() !== "";
                        const endsWithNewline = currentSlide.content.endsWith('\n');
                        const newContent = currentSlide.content + (hasContent && !endsWithNewline ? '\n' : '') + '• ';
                        const updated = slides.map((s, idx) => idx === currentSlideIndex ? { ...s, content: newContent } : s);
                        setSlides(updated);
                        syncToSupabase(updated);
                      }}
                      className="bg-emerald-50 hover:bg-emerald-100 text-[#006747] px-3.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center space-x-1.5 border border-emerald-100/50"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>+ Adicionar Novo Tópico (Raw)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const templateText = "• Título Principal: Descrição fidedigna do projeto\n• Detalhe Importante: Estatísticas ou informação\n• Próximo Passo: Marcos futuros no mercado";
                        const updated = slides.map((s, idx) => idx === currentSlideIndex ? { ...s, content: templateText } : s);
                        setSlides(updated);
                        syncToSupabase(updated);
                      }}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center space-x-1.5 border border-blue-100/30"
                      title="Carrega uma estrutura de tópicos em colunas"
                    >
                      <Table className="w-3.5 h-3.5 shrink-0" />
                      <span>Carregar Modelo Tabela/Colunas</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Helper Tools - Admin Reset Only */}
            <div className="flex flex-wrap gap-2 pt-1 mt-1 border-t border-gray-100">
              {isAdmin && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("Pretende restaurar a apresentação oficial para os slides padrão (Portugal todo e Europa)? Isto irá substituir as modificações atuais no Supabase.")) {
                      setSlides(DEFAULT_SLIDES);
                      await syncToSupabase(DEFAULT_SLIDES);
                      setCurrentSlideIndex(0);
                    }
                  }}
                  className="bg-amber-50 hover:bg-amber-100 text-[#b45309] px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center space-x-1.5 border border-amber-100/75 w-full justify-center shadow-sm"
                  title="Restaura os slides originais do Pitch cobrindo Portugal e Europa"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Restaurar Slides Padrão (Portugal & Europa)</span>
                </button>
              )}
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
        {isEditModalOpen && editingSlide && (() => {
          const editingSlideTheme = getSlideTheme(currentSlideIndex);
          return (
            <div className="fixed inset-0 bg-gray-50 z-[100] flex flex-col overflow-hidden">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="flex-grow flex flex-col h-full w-full bg-gray-50 overflow-hidden"
              >
                {/* Header Navbar */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-xs">
                  <div className="flex items-center space-x-3 text-left">
                    <div className="p-2.5 bg-[#006747]/5 rounded-2xl">
                      <Edit className="w-5 h-5 text-[#006747]" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-950 uppercase tracking-tight leading-none">
                        Editar Conteúdo do Slide
                      </h3>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">
                        Modo Editor Interativo em Tela Cheia e Sincronizado
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-gray-250 shadow-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSlideEdit}
                      className="bg-[#006747] hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-900/10 hover:shadow-lg hover:scale-[1.01]"
                    >
                      Guardar Slide
                    </button>
                  </div>
                </div>

                {/* Grid Split Content */}
                <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-gray-50">
                  {/* Left Column: Real-time Slide Preview & Overall Slide Settings */}
                  <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-white border-r border-gray-200 space-y-6 flex flex-col text-left">
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest leading-none">Antevisão em Tempo Real do Slide</h4>
                      
                      {/* Realistic themed slide preview container */}
                      <div className={`relative bg-gradient-to-br ${editingSlideTheme.bg} text-white rounded-[2rem] p-5 md:p-6 shadow-xl border ${editingSlideTheme.borderColor} overflow-hidden flex flex-col justify-between min-h-[260px] md:min-h-[320px] transition-all`}>
                        {/* Ambient Background glows */}
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

                        {/* Slide Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2 z-10">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${editingSlideTheme.badgeBg}`}>
                            {editingSlide.category || 'Geral'}
                          </span>
                          <div className="flex items-center space-x-1.5 text-[9px] text-white/40 font-mono">
                            <span>Slide {currentSlideIndex + 1} de {slides.length}</span>
                            <span className="bg-white/10 text-white px-2 py-0.5 rounded-md text-[8px] font-bold">
                              {editingSlide.duration_seconds || 40}s
                            </span>
                          </div>
                        </div>

                        {/* Slide Body Custom Frame rendering edited state */}
                        <div className="mt-4 mb-2 z-10 text-left overflow-y-auto max-h-[190px] pr-1 flex-1 flex flex-col justify-center">
                          <h2 className="text-sm md:text-base font-bold tracking-tight leading-tight uppercase font-sans text-white mb-1">
                            {editingSlide.title || ''}
                          </h2>
                          {editingSlide.subtitle && (
                            <p className={`text-xs md:text-xs font-normal ${editingSlideTheme.subtitleText} leading-relaxed mb-3`}>
                              {editingSlide.subtitle}
                            </p>
                          )}
                          
                          {/* Live render of topics inside edit modal */}
                          <div className="pt-1.5 select-none">
                            {renderSlideRows(editingSlide.content || '', true)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Configurações Gerais do Slide</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Categoria</label>
                          <select
                            value={editingSlide.category || 'Geral'}
                            onChange={(e) => setEditingSlide({ ...editingSlide, category: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 focus:outline-[#006747] focus:ring-1 focus:ring-[#006747] focus:bg-white"
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
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 focus:outline-[#006747]"
                          placeholder="Ex: Introduza o título"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-400 mb-1.5 tracking-widest">Subtítulo ou Chamada</label>
                        <input
                          type="text"
                          value={editingSlide.subtitle || ''}
                          onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-800 focus:outline-[#006747]"
                          placeholder="Subtítulo ou descrição sumária"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Advanced Topic Editor - Extra Spacious */}
                  <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-gray-50 space-y-4 flex flex-col text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3 shrink-0">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest">
                          Tópicos / Conteúdo do Slide
                        </label>
                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">Organize os tópicos para serem exibidos em colunas, tabelas ou listas</p>
                      </div>
                      <div className="flex bg-gray-200 p-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border border-gray-300 shadow-sm shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsStructuredMode(true)}
                          className={`px-3.5 py-1.5 rounded-md transition-all ${isStructuredMode ? 'bg-[#006747] text-white shadow-sm' : 'text-gray-500 hover:text-[#006747]'}`}
                        >
                          Estruturado
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsStructuredMode(false)}
                          className={`px-3.5 py-1.5 rounded-md transition-all ${!isStructuredMode ? 'bg-[#006747] text-white shadow-sm' : 'text-gray-500 hover:text-[#006747]'}`}
                        >
                          Texto Livre (Raw)
                        </button>
                      </div>
                    </div>

                    {isStructuredMode ? (
                      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                        {parseTopics(editingSlide.content || '').map((topic, idx, allTopics) => (
                          <div key={idx} className="flex flex-col lg:flex-row items-stretch gap-3 p-4 bg-white border border-gray-200 rounded-2xl hover:border-emerald-300/60 hover:shadow-xs transition-all relative">
                            {/* Bullet order badge */}
                            <div className="flex lg:flex-col items-center justify-between lg:justify-center border-b lg:border-b-0 lg:border-r border-gray-100 pb-1.5 lg:pb-0 lg:pr-3 shrink-0">
                              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                #{idx + 1}
                              </span>
                            </div>

                            {/* Spacious Wide inputs */}
                            <div className="flex-1 space-y-2 text-left">
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                                <div className="lg:col-span-4">
                                  <label className="block text-[8px] font-black uppercase text-gray-400 mb-0.5 tracking-wider">Tópico</label>
                                  <input
                                    type="text"
                                    value={topic.title}
                                    onChange={(e) => {
                                      const updatedTopics = [...allTopics];
                                      updatedTopics[idx] = { ...topic, title: e.target.value };
                                      setEditingSlide({ ...editingSlide, content: serializeTopics(updatedTopics) });
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-800 focus:bg-white focus:outline-[#006747]"
                                    placeholder="Ex: Farmácias"
                                  />
                                </div>
                                <div className="lg:col-span-8">
                                  <label className="block text-[8px] font-black uppercase text-gray-400 mb-0.5 tracking-wider">Conteúdo descritivo</label>
                                  <textarea
                                    rows={1}
                                    value={topic.desc}
                                    onChange={(e) => {
                                      const updatedTopics = [...allTopics];
                                      updatedTopics[idx] = { ...topic, desc: e.target.value };
                                      setEditingSlide({ ...editingSlide, content: serializeTopics(updatedTopics) });
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-750 focus:bg-white focus:outline-[#006747] leading-relaxed resize-none"
                                    placeholder="Explique este aspecto do ecossistema..."
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Deletion btn */}
                            <div className="flex items-center justify-end justify-center shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedTopics = allTopics.filter((_, i) => i !== idx);
                                  setEditingSlide({ ...editingSlide, content: serializeTopics(updatedTopics) });
                                }}
                                className="text-red-500 hover:text-red-700 p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-all"
                                title="Apagar Tópico"
                              >
                                <Trash2 className="w-4 h-4 shrink-0" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const updatedTopics = [...parseTopics(editingSlide.content || ''), { title: 'Novo Tópico', desc: '' }];
                            setEditingSlide({ ...editingSlide, content: serializeTopics(updatedTopics) });
                          }}
                          className="w-full py-3 bg-[#006747]/5 hover:bg-[#006747]/10 text-[#006747] rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center space-x-1 border border-[#006747]/15 shadow-sm hover:scale-[1.005]"
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span>Adicionar Novo Tópico</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col flex-1 space-y-2">
                        <textarea
                          rows={10}
                          value={editingSlide.content || ''}
                          onChange={(e) => setEditingSlide({ ...editingSlide, content: e.target.value })}
                          className="w-full flex-grow bg-white border border-gray-200 rounded-2xl p-4 text-xs font-bold text-gray-800 focus:outline-[#006747] leading-relaxed resize-none font-sans min-h-[300px]"
                          placeholder="• Tópico 1&#10;• Tópico 2&#10;• Titulo Coluna: Conteúdo do tópico..."
                        />
                        <p className="text-[10px] font-medium text-gray-400 text-left">
                          Dica: Digite <span className="font-bold">"• Assunto: Descrição"</span> em cada linha para convertê-lo perfeitamente ao formato estruturado em colunas bento.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
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
