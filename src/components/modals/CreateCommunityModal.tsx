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

const generateColors = () => {
  const colors = [];
  const steps = 15; // 360 / 15 = 24 hues
  const lightnessLevels = [30, 40, 50, 60, 70]; // 5 lightness levels
  const saturationLevels = [60, 70, 80, 90, 100]; // 5 saturation levels
  
  // Total = 24 * 5 * 5 = 600 colors
  
  for (let h = 0; h < 360; h += steps) {
    for (let s of saturationLevels) {
      for (let l of lightnessLevels) {
        colors.push(`hsl(${h}, ${s}%, ${l}%)`);
      }
    }
  }
  return colors;
};

const THEME_COLORS = [
  '#006747', // VIVA Green
  ...generateColors()
];

export default function CreateCommunityModal({ isOpen, onClose, onCreated }: CreateCommunityModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
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
          rules,
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
                  rows={2}
                  placeholder="Sobre o que é este grupo?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Regras do Grupo</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Respeito, Sem Spam, Apenas temas de saúde..."
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center">
                  <Palette className="w-3 h-3 mr-2" />
                   Cor do Tema ({THEME_COLORS.length} opções)
                </label>
                <div className="max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100 flex flex-wrap gap-2 custom-scrollbar">
                   {THEME_COLORS.map((color, idx) => (
                     <button
                       key={idx}
                       type="button"
                       onClick={() => setThemeColor(color)}
                       className={`w-8 h-8 rounded-full border-2 transition-all ${themeColor === color ? 'border-white scale-110 shadow-md ring-2 ring-emerald-500/50' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'}`}
                       style={{ backgroundColor: color }}
                       title={color}
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
