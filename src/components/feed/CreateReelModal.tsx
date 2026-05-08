import { useState, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Plus, Play, Loader2, Camera, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../hooks/useAlert';
import { supabase } from '../../lib/supabase';

interface CreateReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateReelModal({ isOpen, onClose, onCreated }: CreateReelModalProps) {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newReelFile, setNewReelFile] = useState<File | null>(null);
  const [newReelCaption, setNewReelCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!newReelFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(newReelFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [newReelFile]);

  const handleCreateReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newReelFile) return;

    // Check file size (limit to 50MB for better reliability)
    if (newReelFile.size > 50 * 1024 * 1024) {
      showAlert('Ficheiro Muito Grande', 'O vídeo é demasiado pesado. Por favor, carregue um vídeo com menos de 50MB para garantir a estabilidade do SNS VIVA.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const fileExt = newReelFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reels')
        .upload(filePath, newReelFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      const { data } = supabase.storage
        .from('reels')
        .getPublicUrl(filePath);
      
      const publicUrl = data.publicUrl;

      const { error } = await supabase
        .from('reels')
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          caption: newReelCaption,
          is_approved: false
        });

      if (error) throw error;
      
      setNewReelCaption('');
      setNewReelFile(null);
      onClose();
      if (onCreated) onCreated();
    } catch (err: any) {
      console.error('Error creating reel:', err);
      showAlert('Erro na Publicação', `Não foi possível publicar o reel: ${err.message || 'Verifique o tamanho do ficheiro e a ligação.'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 50 }}
            className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl relative z-10"
          >
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-black text-xl tracking-tighter">PUBLIKAR REEL</h3>
              <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:text-black hover:bg-gray-200 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateReel} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-gray-400">Conteúdo do Reel (Vídeo Vertical)</label>
                <div 
                  onClick={() => document.getElementById('reel-video-input-shared')?.click()}
                  className="relative aspect-[9/16] max-h-[300px] border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-all overflow-hidden group"
                >
                  {newReelFile ? (
                    <div className="absolute inset-0 bg-black flex items-center justify-center">
                      {previewUrl ? (
                        <video 
                          src={previewUrl} 
                          className="w-full h-full object-cover"
                          controls={false}
                          autoPlay
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <div className="text-white p-4 text-center">
                          <Play className="w-12 h-12 mx-auto mb-4 text-[#006747]" />
                          <p className="font-bold text-sm truncate px-4 italic">{newReelFile.name}</p>
                          <p className="text-[10px] opacity-60 mt-2 font-black uppercase tracking-widest">A carregar...</p>
                        </div>
                      )}
                      
                      {/* Overlay to allow clicking even when video is present */}
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Camera className="w-10 h-10 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center group-hover:scale-110 transition-transform">
                      <Camera className="w-12 h-12 text-gray-200 mx-auto mb-4 group-hover:text-[#006747]" />
                      <p className="text-xs font-bold text-gray-400">Arraste ou clique para carregar</p>
                      <p className="text-[10px] text-gray-300 mt-2 font-medium">Recomendado: 1080x1920 (9:16)</p>
                    </div>
                  )}
                  <input 
                    id="reel-video-input-shared"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setNewReelFile(e.target.files?.[0] || null)}
                    className="hidden"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-[2px] text-gray-400">Legenda de Saúde</label>
                <textarea 
                  value={newReelCaption}
                  onChange={(e) => setNewReelCaption(e.target.value)}
                  placeholder="Explique este conhecimento VIVA+..."
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-[#006747] min-h-[100px] resize-none font-medium text-gray-700"
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#006747] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center space-x-3 hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Music className="w-5 h-5" />
                    <span>PUBLICAR NO SNS VIVA</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
