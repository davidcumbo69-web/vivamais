import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { X, Shield, Palette, Layout, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const THEME_COLORS = [
  '#006747', // VIVA Green
  '#dc2626', // Red
  '#16a34a', // Green
  '#ea580c', // Orange
  '#9333ea', // Purple
  '#111827', // Black
  '#0891b2', // Cyan
];

export default function CreateCommunityModal({ isOpen, onClose, onCreated }: CreateCommunityModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [themeColor, setThemeColor] = useState(THEME_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data: group, error: createError } = await supabase
        .from('health_groups')
        .insert({
          creator_id: user.id,
          name,
          description,
          theme_color: themeColor
        })
        .select()
        .single();

      if (createError) throw createError;

      // Automatically join as mod/admin
      await supabase.from('health_group_members').insert({
        group_id: group.id,
        user_id: user.id,
        role: 'admin'
      });

      if (onCreated) onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message === 'duplicate key value violates unique constraint "communities_name_key"' 
        ? 'Este nome de comunidade já existe.' 
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative z-10"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                 <Shield className="w-5 h-5 text-[#006747]" />
                 <h2 className="text-xl font-bold">Criar Comunidade</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome da Comunidade</label>
                <input
                  required
                  type="text"
                  placeholder="ex: MedicinaPreventiva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
                <p className="text-[10px] text-gray-400">O nome deve ser único e representativo.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Sobre o que é este grupo?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                  <Palette className="w-3 h-3 mr-2" />
                  Cor do Tema
                </label>
                <div className="flex flex-wrap gap-3">
                   {THEME_COLORS.map(color => (
                     <button
                       key={color}
                       type="button"
                       onClick={() => setThemeColor(color)}
                       className={`w-10 h-10 rounded-full border-4 transition-all ${themeColor === color ? 'border-gray-200 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                       style={{ backgroundColor: color }}
                     />
                   ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium flex items-center">
                   <Layout className="w-4 h-4 mr-2" />
                   {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !name}
                className="w-full bg-[#006747] text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Lançar Comunidade VIVA+'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
