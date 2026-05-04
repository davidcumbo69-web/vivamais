import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, type HealthGroup, type Post } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { 
  Users, 
  PlusSquare, 
  MessageSquare, 
  Share2, 
  ArrowBigUp, 
  ArrowBigDown,
  Info,
  BadgeCheck,
  Loader2,
  ChevronLeft,
  Flame,
  Clock,
  Hash,
  Send,
  Trash2,
  Reply,
  X,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function CommunityDetail() {
  const { name } = useParams<{ name: string }>();
  const { user, profile } = useAuth();
  const [group, setGroup] = useState<HealthGroup | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [activeTab, setActiveTab] = useState<'temas'>('temas');
  
  // Topic Creation State
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicContent, setNewTopicContent] = useState('');
  const [creatingTopic, setCreatingTopic] = useState(false);

  // Topic View State
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null); // Now stores the message object being replied to

  useEffect(() => {
    if (name) {
      fetchGroup();
    }
  }, [name]);

  useEffect(() => {
    if (group && user) {
      checkMembership();
      fetchTopics();
    }
  }, [group, user]);

  useEffect(() => {
    if (!selectedTopic) return;

    const channel = supabase
      .channel(`topic:${selectedTopic.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_topic_messages',
          filter: `topic_id=eq.${selectedTopic.id}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('health_topic_messages')
              .select('*, profiles:user_id(*), parent:reply_to_id(*, profiles:user_id(*))')
              .eq('id', payload.new.id)
              .single();
            
            if (data) {
              setMessages(prev => {
                if (prev.some(m => m.id === data.id)) return prev;
                return [...prev, data];
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTopic]);

  const fetchGroup = async () => {
    const { data, error } = await supabase
      .from('health_groups')
      .select('*')
      .eq('name', name)
      .single();
    
    if (data) {
      setGroup(data);
    }
    setLoading(false);
  };

  const checkMembership = async () => {
    if (!user || !group) return;
    try {
      const { data, error } = await supabase
        .from('health_group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found", which is normal
        console.warn('Membership check failed:', error.message);
        return;
      }
      setIsMember(!!data);
    } catch (err) {
      console.error('Error checking membership:', err);
    }
  };

  const fetchTopics = async () => {
    if (!group) return;
    setLoadingTopics(true);
    const { data } = await supabase
      .from('health_group_topics')
      .select('*, profiles:creator_id(*)')
      .eq('group_id', group.id)
      .order('created_at', { ascending: false });
    
    if (data) setTopics(data);
    setLoadingTopics(false);
  };

  const handleJoinLeave = async () => {
    if (!user || !group) return;
    setJoining(true);

    try {
      if (isMember) {
        const { error } = await supabase
          .from('health_group_members')
          .delete()
          .eq('group_id', group.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        setIsMember(false);
        setGroup(prev => prev ? { ...prev, member_count: Math.max(0, (prev.member_count || 1) - 1) } : null);
      } else {
        const { error } = await supabase
          .from('health_group_members')
          .insert({
            group_id: group.id,
            user_id: user.id
          });
        
        if (error) {
          if (error.code === '23503') {
            alert('Erro: Perfil de utilizador não encontrado. Por favor, recarregue a página ou faça login novamente.');
          } else {
            alert(`Erro ao aderir ao grupo: ${error.message}`);
          }
          throw error;
        }
        
        setIsMember(true);
        setGroup(prev => prev ? { ...prev, member_count: (prev.member_count || 0) + 1 } : null);
      }
    } catch (err) {
      console.error('Error joining group:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !group || !newTopicTitle.trim()) return;

    setCreatingTopic(true);
    try {
      const { data, error } = await supabase
        .from('health_group_topics')
        .insert({
          group_id: group.id,
          creator_id: user.id,
          title: newTopicTitle,
          content: newTopicContent,
        })
        .select('*, profiles:creator_id(*)')
        .single();

      if (data) {
        setTopics([data, ...topics]);
        setShowCreateTopic(false);
        setNewTopicTitle('');
        setNewTopicContent('');
      }
    } catch (err) {
      console.error('Error creating topic:', err);
    } finally {
      setCreatingTopic(false);
    }
  };

  const openTopic = async (topic: any) => {
    setSelectedTopic(topic);
    fetchMessages(topic.id);
  };

  const fetchMessages = async (topicId: string) => {
    const { data } = await supabase
      .from('health_topic_messages')
      .select('*, profiles:user_id(*), parent:reply_to_id(*, profiles:user_id(*))')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const handleDeleteTopic = async (topicId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Tens a certeza que queres apagar este tema? Todos os comentários serão removidos.')) return;

    try {
      // First delete messages
      await supabase.from('health_topic_messages').delete().eq('topic_id', topicId);
      
      const { error } = await supabase
        .from('health_group_topics')
        .delete()
        .eq('id', topicId);
      
      if (error) throw error;

      setTopics(prev => prev.filter(t => t.id !== topicId));
      if (selectedTopic?.id === topicId) setSelectedTopic(null);
    } catch (err) {
      console.error('Error deleting topic:', err);
      alert('Erro ao apagar o tema.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTopic || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const { data, error } = await supabase
        .from('health_topic_messages')
        .insert({
          topic_id: selectedTopic.id,
          user_id: user.id,
          content: newMessage,
          reply_to_id: replyingTo?.id || null
        })
        .select('*, profiles:user_id(*), parent:reply_to_id(*, profiles:user_id(*))')
        .single();
      
      if (data) {
        setMessages([...messages, data]);
        setNewMessage('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#006747]" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold">Comunidade não encontrada</h1>
        <p className="text-gray-500 mt-2">O grupo que procura pode ter sido removido ou o URL está incorreto.</p>
        <Link to="/" className="mt-6 text-[#006747] font-bold">Voltar para a Home</Link>
      </div>
    );
  }

  return (
    <div className="pb-20 min-h-screen bg-[#dae0e6] font-sans">
      <Header />
      
      {/* Community Header */}
      <div style={{ backgroundColor: group.theme_color || '#006747' }} className="h-44 md:h-64 shadow-inner" />
      
      <div className="bg-white border-b border-gray-300 shadow-sm relative z-10">
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="flex items-end -mt-10 mb-4">
             <div className="w-24 h-24 rounded-full border-[6px] border-white bg-white overflow-hidden shadow-xl ring-1 ring-gray-100 flex items-center justify-center">
                <div 
                  className="w-full h-full flex items-center justify-center text-white font-black text-4xl"
                  style={{ backgroundColor: group.theme_color || '#006747' }}
                >
                  {group.name[0]}
                </div>
             </div>
             <div className="ml-5 mb-2 flex-1">
                <div className="flex items-end justify-between">
                   <div>
                      <h1 className="text-3xl font-black text-gray-900 tracking-tight">{group.name}</h1>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-500 font-bold tracking-wide">g/{group.name}</p>
                        <span className="text-gray-200">•</span>
                        <p className="text-xs text-[#006747] font-black uppercase tracking-widest">{group.category || 'Saúde'}</p>
                      </div>
                   </div>
                   <div className="flex items-center space-x-3 mb-1">
                      <button className="p-2.5 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all">
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={handleJoinLeave}
                        disabled={joining}
                        className={cn(
                          "px-10 py-3 rounded-full font-black text-sm transition-all shadow-lg active:scale-95",
                          isMember 
                           ? "bg-white text-gray-400 border-2 border-gray-100 hover:bg-gray-50" 
                           : "bg-[#006747] text-white hover:bg-emerald-800 shadow-emerald-100"
                        )}
                      >
                        {joining ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : isMember ? 'Aderido' : 'Entrar na Comunidade'}
                      </button>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex items-center space-x-8 mt-4 border-t border-gray-100 pt-1 text-left">
             <button 
               className={cn(
                 "flex items-center space-x-2 py-3 px-1 border-b-4 transition-all font-black text-xs uppercase tracking-widest border-[#006747] text-gray-900"
               )}
             >
               <Hash className="w-4 h-4" />
               <span>Temas Discussion</span>
             </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-4">
             <div className="space-y-4">
                <div className="flex justify-between items-center mb-6 px-1">
                   <h2 className="text-xl font-black text-gray-900 tracking-tight">Temas de Discussão</h2>
                   <button 
                     onClick={() => setShowCreateTopic(true)}
                     disabled={!isMember}
                     className="bg-black text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-md hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center space-x-2"
                   >
                     <Plus className="w-4 h-4" />
                     <span>Iniciar Tema</span>
                   </button>
                </div>

                {loadingTopics ? (
                   <div className="flex justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                   </div>
                ) : topics.length === 0 ? (
                   <div className="bg-white p-20 rounded-md border border-gray-300 text-center shadow-sm">
                      <Hash className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <h4 className="font-bold text-gray-900 text-left">Ainda não há debates</h4>
                      <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto text-left">Cria o primeiro tema de discussão para interagir com a comunidade em tempo real.</p>
                   </div>
                ) : (
                   topics.map(topic => (
                      <div 
                         key={topic.id} 
                         onClick={() => openTopic(topic)}
                         className="bg-white p-5 rounded-xl border border-gray-200 hover:border-[#006747] cursor-pointer transition-all shadow-sm hover:shadow-md group flex items-start space-x-4 text-left"
                      >
                         <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-[#006747] shrink-0 group-hover:bg-[#006747] group-hover:text-white transition-colors">
                            <Hash className="w-6 h-6" />
                         </div>
                         <div className="flex-1">
                            <h3 className="font-black text-gray-900 text-lg leading-tight group-hover:text-[#006747] transition-colors">{topic.title}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{topic.content}</p>
                            <div className="flex items-center space-x-4 mt-4">
                               <div className="flex items-center space-x-1">
                                  <div className="w-5 h-5 rounded-full overflow-hidden">
                                     <img src={topic.profiles?.avatar_url || 'https://i.pravatar.cc/150'} alt="" />
                                  </div>
                                  <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Por {topic.profiles?.username}</span>
                               </div>
                               <span className="text-[10px] text-gray-300 uppercase font-bold tracking-widest">• {new Date(topic.created_at).toLocaleDateString()}</span>
                               <div className="flex items-center space-x-1 text-[10px] font-black text-[#006747] tracking-widest uppercase bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <MessageSquare className="w-3 h-3" />
                                  <span>Discussão Ativa</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex flex-col items-center justify-between self-stretch py-1">
                             <ArrowBigUp className="w-6 h-6 text-gray-200 group-hover:text-orange-500" />
                             {user?.id === topic.creator_id && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTopic(topic.id);
                                  }}
                                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                             )}
                          </div>
                      </div>
                   ))
                )}
             </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="lg:col-span-4 space-y-4">
           {/* Community Summary Card */}
           <div className="bg-white rounded-md border border-gray-300 overflow-hidden shadow-sm">
              <div style={{ backgroundColor: group.theme_color || '#006747' }} className="h-10 opacity-80" />
              <div className="p-4 pt-4">
                 <div className="flex items-center space-x-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-inner border border-white"
                      style={{ backgroundColor: group.theme_color || '#006747' }}
                    >
                      {group.name[0]}
                    </div>
                    <h3 className="font-black text-gray-900 text-xl tracking-tight">Comunidade</h3>
                 </div>
                 <p className="text-sm text-gray-700 mb-6 leading-relaxed font-medium">
                   {group.description || 'Uma comunidade dedicada à literacia de saúde e bem-estar em Portugal.'}
                 </p>
                 
                 <div className="grid grid-cols-2 gap-4 border-y border-gray-100 py-6 mb-6">
                    <div>
                       <p className="text-2xl font-black text-gray-900">{group.member_count?.toLocaleString() || 0}</p>
                       <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Membros</p>
                    </div>
                    <div>
                       <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                          <p className="text-2xl font-black text-gray-900">Online</p>
                       </div>
                       <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Agora</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-xs text-gray-400 font-bold uppercase tracking-widest">
                       <Clock className="w-4 h-4" />
                       <span>Criada em {new Date(group.created_at).toLocaleDateString()}</span>
                    </div>
                    <button 
                      onClick={() => setShowCreateTopic(true)}
                      disabled={!isMember}
                      className="w-full bg-[#006747] text-white py-4 rounded-full font-black text-sm shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                       Iniciar Discussão
                    </button>
                    <button className="w-full bg-white text-[#006747] border-2 border-[#006747] py-3.5 rounded-full font-black text-sm hover:bg-emerald-50 transition-all">
                       Ver Regras
                    </button>
                 </div>
              </div>
           </div>

           {/* Moderation section (only if creator) */}
           {group.creator_id === user?.id && (
             <div className="bg-white rounded-md border border-gray-300 p-4 shadow-sm border-l-4 border-l-orange-500">
                <h3 className="text-xs font-black text-gray-900 uppercase mb-4 tracking-widest flex items-center justify-between">
                   <span>Painel de Fundador</span>
                   <BadgeCheck className="w-4 h-4 text-orange-500" />
                </h3>
                <div className="space-y-2">
                   <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-xs font-bold text-gray-600">Configurar Grupo</button>
                   <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-xs font-bold text-gray-600">Ver Denúncias</button>
                   <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-xs font-bold text-gray-600">Enviar Mensagem Geral</button>
                </div>
             </div>
           )}

           <div className="bg-white rounded-md border border-gray-300 p-5 shadow-sm">
              <h3 className="text-xs font-black text-gray-400 uppercase mb-5 tracking-widest">Regras de Conduta</h3>
              <ul className="space-y-4">
                 {[
                   'Respeito mútuo entre membros',
                   'Partilhar apenas informação fidedigna',
                   'Não substitui acompanhamento médico',
                   'Sem publicidade ou spam'
                 ].map((rule, i) => (
                   <li key={i} className="text-xs flex items-start group">
                      <span className="font-black text-gray-300 mr-3 text-sm group-hover:text-[#006747] transition-colors">{i+1}.</span>
                      <span className="text-gray-600 font-medium leading-relaxed">{rule}</span>
                   </li>
                 ))}
              </ul>
           </div>
        </div>
      </main>

      {/* Creation Topic Modal */}
      <AnimatePresence>
        {showCreateTopic && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 bg-[#006747] text-white">
                 <h2 className="text-2xl font-black tracking-tight text-left">Novo Tema de Discussão</h2>
                 <p className="text-emerald-100 text-sm mt-1 text-left">Inicia um debate saudável com a comunidade.</p>
              </div>
              <form onSubmit={handleCreateTopic} className="p-6 space-y-4">
                 <div className="text-left">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Título do Debate</label>
                    <input 
                      required
                      type="text" 
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                      placeholder="Ex: Como lidar com stress pós-vacinal?"
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 px-5 focus:outline-none focus:border-[#006747] transition-all font-bold"
                    />
                 </div>
                 <div className="text-left">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1 px-1">Contexto ou Pergunta</label>
                    <textarea 
                      rows={4}
                      value={newTopicContent}
                      onChange={(e) => setNewTopicContent(e.target.value)}
                      placeholder="Explica o que queres discutir ou partilha a tua dúvida..."
                      className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 px-5 focus:outline-none focus:border-[#006747] transition-all font-medium resize-none"
                    />
                 </div>
                 <div className="flex space-x-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowCreateTopic(false)}
                      className="flex-1 py-4 text-gray-400 font-black text-sm uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={creatingTopic}
                      className="flex-1 py-4 bg-[#006747] text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 rounded-2xl transition-all disabled:opacity-50"
                    >
                      {creatingTopic ? 'A criar...' : 'Lançar Tema'}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Topic Discussion Modal (Full Screen style) */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="fixed inset-0 z-[70] flex flex-col bg-gray-50">
             <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm sticky top-0">
                <div className="flex items-center space-x-4">
                   <button onClick={() => setSelectedTopic(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <ChevronLeft className="w-6 h-6 text-gray-900" />
                   </button>
                   <div className="text-left">
                      <h2 className="font-black text-gray-900 text-lg leading-tight line-clamp-1">{selectedTopic.title}</h2>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discussão em g/{group.name}</p>
                   </div>
                </div>
                <div className="flex items-center space-x-2">
                   {user?.id === selectedTopic.creator_id && (
                      <button 
                        onClick={() => handleDeleteTopic(selectedTopic.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                   )}
                   <MoreHorizontal className="w-6 h-6 text-gray-400" />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="max-w-3xl mx-auto">
                   {/* Opener */}
                   <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-10 text-left">
                      <div className="flex items-center space-x-3 mb-4">
                         <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
                            <img src={selectedTopic.profiles?.avatar_url || 'https://i.pravatar.cc/150'} alt="" />
                         </div>
                         <div>
                            <p className="font-black text-gray-900 text-sm">u/{selectedTopic.profiles?.username}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(selectedTopic.created_at).toLocaleDateString()} • Fundador do Tema</p>
                         </div>
                      </div>
                      <h1 className="text-2xl font-black text-gray-900 mb-4 leading-tight">{selectedTopic.title}</h1>
                      <p className="text-gray-700 leading-relaxed font-normal text-lg">{selectedTopic.content}</p>
                   </div>

                   {/* Messages list */}
                   <div className="space-y-4 mb-40 text-left">
                      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Acompanha o Debate</h3>
                      {messages.map((msg, i) => (
                        <div key={msg.id} className="flex space-x-4">
                           <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm border border-white shrink-0">
                              <img src={msg.profiles?.avatar_url || 'https://i.pravatar.cc/150'} alt="" />
                           </div>
                           <div className="bg-white px-5 py-4 rounded-3xl shadow-sm border border-gray-100 flex-1">
                              <div className="flex justify-between items-center mb-1">
                                 <p className="font-black text-gray-900 text-xs text-left">u/{msg.profiles?.username}</p>
                                 <span className="text-[9px] text-gray-300 font-bold uppercase">{new Date(msg.created_at).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed text-left">{msg.content}</p>
                              
                              {msg.parent && (
                                <div className="mt-2 mb-2 p-2 bg-gray-50 rounded-xl border-l-4 border-emerald-500 text-xs text-gray-500">
                                   <p className="font-bold mb-1">Reposta a u/{msg.parent.profiles?.username}</p>
                                   <p className="line-clamp-1 italic">"{msg.parent.content}"</p>
                                </div>
                              )}
                              
                              <div className="mt-3 pt-2 border-t border-gray-50 flex items-center">
                                 <button 
                                   onClick={() => {
                                     setReplyingTo(msg);
                                     const input = document.getElementById('topic-message-input');
                                     if (input) input.focus();
                                   }}
                                   className="flex items-center space-x-1.5 text-[10px] font-black text-[#006747] uppercase tracking-widest hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                                 >
                                    <Reply className="w-3 h-3" />
                                    <span>Responder</span>
                                 </button>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             {/* Sticky Message Input */}
             <div className="p-4 bg-white border-t border-gray-200 sticky bottom-0 safe-bottom">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto space-y-3">
                   {replyingTo && (
                      <div className="flex items-center justify-between bg-emerald-50 px-4 py-2 rounded-xl text-emerald-800">
                         <div className="flex items-center space-x-2 text-xs font-bold">
                            <Reply className="w-3.5 h-3.5" />
                            <span>A responder a u/{replyingTo.profiles?.username || replyingTo.username}</span>
                         </div>
                         <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-emerald-100 rounded-full">
                            <X className="w-3.5 h-3.5" />
                         </button>
                      </div>
                   )}
                   <div className="flex items-center space-x-3">
                      <div className="flex-1 relative">
                         <input 
                           id="topic-message-input"
                           type="text" 
                           value={newMessage}
                           onChange={(e) => setNewMessage(e.target.value)}
                           placeholder={replyingTo ? "Escreve a tua resposta..." : "Adiciona a tua opinião ao debate..."}
                           className="w-full bg-gray-50 border-2 border-gray-100 rounded-full py-4 px-6 focus:outline-none focus:border-[#006747] transition-all font-bold pr-12 text-left"
                         />
                         <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <BadgeCheck className="w-5 h-5 text-gray-200" />
                         </div>
                      </div>
                      <button 
                        type="submit"
                        disabled={sendingMessage || !newMessage.trim()}
                        className="bg-[#006747] text-white p-4 rounded-full shadow-lg shadow-emerald-100 disabled:opacity-30 transition-all hover:scale-110 active:scale-95"
                      >
                        <Send className="w-6 h-6" />
                      </button>
                   </div>
                </form>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

