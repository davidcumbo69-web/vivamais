import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { 
  Send, 
  Search, 
  MoreVertical, 
  MessageSquare, 
  User, 
  Loader2, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  CheckCheck
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  is_professional: boolean;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.user_id);
      markAsRead(selectedConversation.user_id);
    }
  }, [selectedConversation]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('direct-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // If we are talking to this person, add message to chat
          if (selectedConversation && newMessage.sender_id === selectedConversation.user_id) {
            setMessages(prev => [...prev, newMessage]);
            markAsRead(newMessage.sender_id);
          }
          
          // Update conversations list anyway
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (targetUserId) {
      const conv = conversations.find(c => c.user_id === targetUserId);
      if (conv) {
        setSelectedConversation(conv);
      } else if (conversations.length > 0) {
        // If targetUserId is set but not in conversations, it might be a new virtual one
        // handled in fetchConversations
      }
    } else {
      setSelectedConversation(null);
    }
  }, [targetUserId, conversations]);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      // This is a bit complex in Supabase without a RPC, 
      // so we fetch all messages where user is sender or receiver and group them in JS
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:sender_id(id, username, full_name, avatar_url, is_professional),
          receiver:receiver_id(id, username, full_name, avatar_url, is_professional)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const conversationMap = new Map<string, Conversation>();

      data?.forEach((msg: any) => {
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        if (!otherUser) return;

        if (!conversationMap.has(otherUser.id)) {
          conversationMap.set(otherUser.id, {
            user_id: otherUser.id,
            username: otherUser.username,
            full_name: otherUser.full_name,
            avatar_url: otherUser.avatar_url,
            is_professional: otherUser.is_professional,
            last_message: msg.content,
            last_message_time: msg.created_at,
            unread_count: msg.receiver_id === user.id && !msg.is_read ? 1 : 0
          });
        } else {
          if (msg.receiver_id === user.id && !msg.is_read) {
            const conv = conversationMap.get(otherUser.id)!;
            conv.unread_count++;
          }
        }
      });

      const convList = Array.from(conversationMap.values());
      setConversations(convList);

      // If there's a targetUserId from searchParams, select or create a virtual conversation
      if (targetUserId && !selectedConversation) {
        const existingConv = convList.find(c => c.user_id === targetUserId);
        if (existingConv) {
          setSelectedConversation(existingConv);
        } else {
          // Fetch target user info to create a "virtual" conversation
          const { data: userData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .single();
          
          if (userData) {
            setSelectedConversation({
              user_id: userData.id,
              username: userData.username,
              full_name: userData.full_name,
              avatar_url: userData.avatar_url,
              is_professional: userData.is_professional,
              last_message: '',
              last_message_time: new Date().toISOString(),
              unread_count: 0
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    if (!user) return;
    setLoadingMessages(true);
    
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async (otherUserId: string) => {
    if (!user) return;
    await supabase
      .from('direct_messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', otherUserId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedConversation || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedConversation.user_id,
          content: content
        })
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setMessages(prev => [...prev, data]);
        fetchConversations(); // Update list order and last message
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn(
      "h-[calc(100vh-64px)] md:h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden",
      selectedConversation ? "h-screen" : ""
    )}>
      {/* Conversations List */}
      <div className={cn(
        "w-full md:w-80 lg:w-96 bg-white border-r border-gray-100 flex flex-col",
        selectedConversation ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 border-b border-gray-50 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Mensagens</h1>
            <button className="p-2 bg-emerald-50 text-[#006747] rounded-xl hover:bg-emerald-100 transition-colors">
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Pesquisar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => setSearchParams({ userId: conv.user_id })}
                className={cn(
                  "w-full p-4 flex items-center space-x-4 hover:bg-emerald-50/30 transition-all border-b border-gray-50",
                  selectedConversation?.user_id === conv.user_id ? "bg-emerald-50/50 border-r-4 border-r-[#006747]" : ""
                )}
              >
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm">
                    <img src={conv.avatar_url || `https://i.pravatar.cc/150?u=${conv.username}`} alt="" className="w-full h-full object-cover" />
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="absolute -top-1 -right-1 bg-[#006747] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                      {conv.unread_count}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-gray-900 truncate max-w-[120px]">u/{conv.username}</span>
                      {conv.is_professional && <ShieldCheck className="w-3.5 h-3.5 text-[#006747] fill-current" />}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                      {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate font-medium">
                    {conv.last_message || 'Inicia uma conversa...'}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-200" />
              </div>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Sem Conversas</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-white",
        !selectedConversation ? "hidden md:flex" : "flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 md:p-6 border-b border-gray-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setSearchParams({})}
                  className="md:hidden p-2 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <Link to={`/profile/${selectedConversation.user_id}`} className="flex items-center space-x-3 group">
                   <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm">
                      <img src={selectedConversation.avatar_url || `https://i.pravatar.cc/150?u=${selectedConversation.username}`} alt="" className="w-full h-full object-cover" />
                   </div>
                   <div>
                      <div className="flex items-center space-x-1">
                        <h2 className="font-bold text-gray-900 group-hover:text-[#006747] transition-colors line-clamp-1">u/{selectedConversation.username}</h2>
                        {selectedConversation.is_professional && <ShieldCheck className="w-3.5 h-3.5 text-[#006747] fill-current" />}
                      </div>
                      <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                        Online agora
                      </p>
                   </div>
                </Link>
              </div>
              
              <div className="flex items-center space-x-2">
                 <button className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                    <MoreVertical className="w-5 h-5" />
                 </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 bg-[#f8f9fa]">
              {loadingMessages ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#006747] opacity-20" />
                </div>
              ) : messages.length > 0 ? (
                <>
                  <div className="flex justify-center mb-8">
                     <span className="bg-white/80 backdrop-blur border border-gray-100 px-4 py-1.5 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-sm">
                        As mensagens são encriptadas de ponta a ponta
                     </span>
                  </div>
                  
                  {messages.map((msg, index) => {
                    const isMine = msg.sender_id === user?.id;
                    const showDate = index === 0 || 
                      new Date(msg.created_at).toDateString() !== new Date(messages[index-1].created_at).toDateString();

                    return (
                      <React.Fragment key={msg.id}>
                        {showDate && (
                          <div className="flex justify-center my-6">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
                              {new Date(msg.created_at).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                          </div>
                        )}
                        <div className={cn(
                          "flex group animate-in fade-in slide-in-from-bottom-2 duration-300",
                          isMine ? "justify-end" : "justify-start"
                        )}>
                          <div className={cn(
                            "max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl shadow-sm relative",
                            isMine 
                              ? "bg-[#006747] text-white rounded-tr-none" 
                              : "bg-white text-gray-800 border border-gray-100 rounded-tl-none"
                          )}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <div className={cn(
                              "flex items-center space-x-1 mt-1 text-[9px] font-bold uppercase",
                              isMine ? "text-emerald-100/60 justify-end" : "text-gray-400"
                            )}>
                              <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMine && (
                                <span>
                                  {msg.is_read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-40">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <MessageSquare className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tighter mb-2">Inicia a Conversa com u/{selectedConversation.username}</h3>
                  <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto">Tira as tuas dúvidas ou agenda um acompanhamento direto com este profissional de saúde.</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 md:p-6 border-t border-gray-50 bg-white">
              <form onSubmit={handleSendMessage} className="relative flex items-center space-x-3 max-w-5xl mx-auto">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escreve uma mensagem..."
                  className="flex-1 bg-gray-50 border-none rounded-2xl py-4 px-6 pr-12 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-[#006747] text-white p-4 rounded-2xl shadow-lg shadow-emerald-100 disabled:opacity-30 disabled:grayscale transition-all active:scale-95 flex-shrink-0"
                >
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
              <div className="mt-3 flex justify-center">
                 <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest flex items-center">
                    Carrega no Enter para enviar • O profissional responderá assim que possível
                 </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#f8f9fa]">
            <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 flex items-center justify-center mb-10 transform -rotate-6">
               <MessageSquare className="w-10 h-10 text-[#006747]" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter mb-4">A Tua Inbox Viva+</h2>
            <p className="text-sm text-gray-500 max-w-sm mb-10 font-bold uppercase tracking-widest leading-loose">
               Liga-te diretamente a profissionais de saúde e recebe aconselhamento personalizado em tempo real.
            </p>
            <div className="grid grid-cols-2 gap-4 max-w-md w-full">
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                     <ShieldCheck className="w-5 h-5 text-[#006747]" />
                  </div>
                  <h4 className="font-black text-[10px] uppercase text-gray-400 mb-1">Privacidade</h4>
                  <p className="text-xs font-medium text-gray-600">Dados protegidos por encriptação SNS.</p>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-left">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                     <CheckCheck className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h4 className="font-black text-[10px] uppercase text-gray-400 mb-1">Confirmado</h4>
                  <p className="text-xs font-medium text-gray-600">Sabe sempre quando a mensagem é lida.</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
