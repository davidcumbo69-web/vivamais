import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { Pill, Plus, Search, Trash2, Edit2, Check, X, Loader2, Package, ArrowLeft } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function ManagePharmacyStock() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const [newMed, setNewMed] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    in_stock: true
  });

  useEffect(() => {
    if (id) {
      fetchPharmacy();
      fetchMedicines();
    }
  }, [id]);

  const fetchPharmacy = async () => {
    const { data } = await supabase.from('pharmacies').select('*').eq('id', id).single();
    setPharmacy(data);
  };

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Pharm_medicines')
        .select('*')
        .eq('pharmacy_id', id)
        .order('name');
      
      if (error) throw error;
      setMedicines(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('Pharm_medicines').insert([{
        pharmacy_id: id,
        name: newMed.name,
        category: newMed.category,
        price: parseFloat(newMed.price) || 0,
        description: newMed.description,
        in_stock: newMed.in_stock
      }]);

      if (error) throw error;
      
      setNewMed({ name: '', category: '', price: '', description: '', in_stock: true });
      setIsAdding(false);
      fetchMedicines();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStock = async (medId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('Pharm_medicines')
        .update({ in_stock: !currentStatus })
        .eq('id', medId);
      
      if (error) throw error;
      setMedicines(medicines.map(m => m.id === medId ? { ...m, in_stock: !currentStatus } : m));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMedicine = async (medId: string) => {
    if (!confirm('Tem certeza que deseja remover este medicamento?')) return;
    try {
      const { error } = await supabase.from('Pharm_medicines').delete().eq('id', medId);
      if (error) throw error;
      setMedicines(medicines.filter(m => m.id !== medId));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#dae0e6] pb-24">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-8">
        <button 
          onClick={() => navigate('/settings/pharmacies')}
          className="flex items-center text-gray-500 font-bold mb-6 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar às Farmácias
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gestão de Stock</h1>
            <p className="text-gray-500 font-medium">
              {pharmacy?.name || 'Carregando...'} • Actualize os medicamentos disponíveis.
            </p>
          </div>
          
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="mt-4 md:mt-0 bg-[#006747] text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100"
          >
            {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            <span>{isAdding ? 'Cancelar' : 'Adicionar Medicamento'}</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Pesquisar no seu stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white border-none rounded-3xl shadow-sm focus:ring-2 focus:ring-[#006747]/20 outline-none font-bold text-gray-700"
          />
        </div>

        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[2rem] p-8 border border-emerald-100 shadow-xl mb-12"
            >
              <form onSubmit={handleAddMedicine} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Nome do Medicamento</label>
                  <input 
                    required
                    value={newMed.name}
                    onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                    placeholder="Ex: Amoxicilina 500mg"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Categoria</label>
                  <input 
                    value={newMed.category}
                    onChange={(e) => setNewMed({...newMed, category: e.target.value})}
                    placeholder="Ex: Antibiótico"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Preço (Kz)</label>
                  <input 
                    type="number"
                    value={newMed.price}
                    onChange={(e) => setNewMed({...newMed, price: e.target.value})}
                    placeholder="0.00"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">Descrição Curta</label>
                  <input 
                    value={newMed.description}
                    onChange={(e) => setNewMed({...newMed, description: e.target.value})}
                    placeholder="Ex: Caixa com 20 comprimidos"
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    disabled={saving}
                    className="bg-[#006747] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Stock'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#006747] animate-spin mb-4" />
            <p className="text-gray-500 font-medium">A carregar stock...</p>
          </div>
        ) : filteredMedicines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMedicines.map((med, index) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                    med.in_stock ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-400"
                  )}>
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 leading-tight">{med.name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                      {med.category || 'Geral'} • {med.price?.toLocaleString('pt-PT')} Kz
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleStock(med.id, med.in_stock)}
                    className={cn(
                      "p-2.5 rounded-xl transition-all border",
                      med.in_stock 
                        ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                        : "bg-red-50 border-red-100 text-red-600"
                    )}
                    title={med.in_stock ? "Marcar como Esgotado" : "Marcar como Disponível"}
                  >
                    {med.in_stock ? <Check className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteMedicine(med.id)}
                    className="p-2.5 bg-gray-50 border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 hover:border-red-100 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white/50 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-200">
            <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum medicamento inventariado</h3>
            <p className="text-gray-500 font-medium">Comece a adicionar medicamentos ao seu stock para que os utentes possam encontrá-los.</p>
          </div>
        )}
      </main>
    </div>
  );
}
