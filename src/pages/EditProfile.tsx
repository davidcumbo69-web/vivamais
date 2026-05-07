import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, MapPin, Calendar, CreditCard, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';

export default function EditProfile() {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    birth_date: '',
    gender: '',
    address: '',
    marital_status: '',
    id_card_number: '',
    province: '',
    municipality: '',
    bio: ''
  });

  useEffect(() => {
    const fetchLatestProfile = async () => {
      if (!profile?.id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.id)
          .single();

        if (error) throw error;
        
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            birth_date: data.birth_date || '',
            gender: data.gender || '',
            address: data.address || '',
            marital_status: data.marital_status || '',
            id_card_number: data.id_card_number || '',
            province: data.province || '',
            municipality: data.municipality || '',
            bio: data.bio || ''
          });
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProfile();
  }, [profile?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="pb-20 min-h-screen bg-[#dae0e6]">
      <Header />
      
      <div className="max-w-2xl mx-auto pt-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold">Editar Perfil</h1>
          <div className="w-9" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informação Básica */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 text-[#006747] mb-6 font-bold uppercase text-[10px] tracking-widest">
              <User className="w-4 h-4" />
              <span>Dados Pessoais</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#006747] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Data de Nascimento</label>
                  <input
                    type="date"
                    required
                    value={formData.birth_date}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#006747] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Gênero</label>
                  <select
                    required
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#006747] transition-all appearance-none"
                  >
                    <option value="">Selecionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Estado Civil</label>
                <select
                  required
                  value={formData.marital_status}
                  onChange={(e) => setFormData({ ...formData, marital_status: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#006747] transition-all appearance-none"
                >
                  <option value="">Selecionar</option>
                  <option value="Solteiro(a)">Solteiro(a)</option>
                  <option value="Casado(a)">Casado(a)</option>
                  <option value="Divorciado(a)">Divorciado(a)</option>
                  <option value="Viúvo(a)">Viúvo(a)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Nº do BI (Identificação)</label>
                <input
                  type="text"
                  required
                  value={formData.id_card_number}
                  onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
                  placeholder="000000000AA000"
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#006747] transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Localização */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-2 text-[#006747] mb-6 font-bold uppercase text-[10px] tracking-widest">
              <MapPin className="w-4 h-4" />
              <span>Morada e Localização</span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Província</label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Ex: Luanda"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#006747] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Município</label>
                  <input
                    type="text"
                    required
                    value={formData.municipality}
                    onChange={(e) => setFormData({ ...formData, municipality: e.target.value })}
                    placeholder="Ex: Talatona"
                    className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#006747] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-2">Endereço Residencial</label>
                <textarea
                  required
                  rows={3}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, bairro, número da casa..."
                  className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#006747] transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2">Biografia / Sobre mim</label>
             <textarea
               rows={4}
               value={formData.bio}
               onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
               placeholder="Conte-nos um pouco sobre si..."
               className="w-full bg-gray-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#006747] transition-all resize-none"
             />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006747] text-white py-5 rounded-[2rem] font-bold shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2 hover:bg-emerald-800 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Guardar Alterações</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
