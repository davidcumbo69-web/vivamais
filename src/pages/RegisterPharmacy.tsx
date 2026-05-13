import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Store, MapPin, Phone, Mail, Clock, Loader2, CheckCircle2, ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';

export default function RegisterPharmacy() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    opening_hours: {
      mon: '09:00-19:00',
      tue: '09:00-19:00',
      wed: '09:00-19:00',
      thu: '09:00-19:00',
      fri: '09:00-19:00',
      sat: '09:00-13:00',
      sun: 'Closed'
    }
  });

  useEffect(() => {
    if (isEditing) {
      fetchPharmacy();
    }
  }, [id]);

  const fetchPharmacy = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        // Security check
        if (data.owner_id !== user?.id && profile?.email !== 'davidcumbo69@gmail.com') {
          navigate('/settings/pharmacies');
          return;
        }

        setFormData({
          name: data.name,
          license_number: data.license_number,
          address: data.address,
          phone: data.phone || '',
          email: data.email || '',
          description: data.description || '',
          opening_hours: data.opening_hours
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const payload = {
        ...formData,
        owner_id: user.id,
        status: isEditing ? 'pending' : 'pending', // Re-verify on edit too for safety
        updated_at: new Date().toISOString()
      };

      if (isEditing) {
        const { error } = await supabase
          .from('pharmacies')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pharmacies')
          .insert([payload]);
        if (error) throw error;
      }

      setSuccess(true);
      setTimeout(() => navigate('/settings/pharmacies'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#dae0e6] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#006747] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">A carregar dados da farmácia...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#dae0e6] pb-24">
      <Header />
      
      <main className="max-w-3xl mx-auto px-4 pt-8">
        <div className="flex items-center space-x-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {isEditing ? 'Editar Farmácia' : 'Registar Farmácia'}
            </h1>
            <p className="text-gray-500">Preencha os detalhes oficiais do estabelecimento.</p>
          </div>
        </div>

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-emerald-50 border border-emerald-100 rounded-3xl p-6 flex items-center space-x-4"
          >
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#006747]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#006747]">Dados enviados com sucesso!</p>
              <p className="text-sm text-[#006747]/80">O seu registo será analisado e estará disponível em breve.</p>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 rounded-3xl p-6 text-red-800 flex items-center space-x-3">
             <AlertCircle className="w-6 h-6" />
             <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-gray-200/50 space-y-10 border border-gray-100">
          {/* Base Info */}
          <section className="space-y-6">
            <div className="flex items-center space-x-2 text-[#006747] mb-2">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-widest text-[10px]">Identificação Oficial</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Nome da Farmácia</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Ex: Farmácia Central"
                  className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Nº de Alvara / Licença</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  required
                  placeholder="Ex: LF-12345"
                  className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </section>

          {/* Contact and Location */}
          <section className="space-y-6">
            <div className="flex items-center space-x-2 text-[#006747] mb-2">
              <MapPin className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-widest text-[10px]">Localização e Contacto</h2>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Morada Completa</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
                placeholder="Ex: Rua Garrett 23, Lisboa"
                className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+351 210 000 000"
                  className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Email Comercial</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="comercial@farmacia.pt"
                  className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </section>

          {/* Opening Hours */}
          <section className="space-y-6">
            <div className="flex items-center space-x-2 text-[#006747] mb-2">
              <Clock className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-widest text-[10px]">Horários de Funcionamento</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(formData.opening_hours).map(([day, hours]) => (
                <div key={day} className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-gray-400 block px-1">{day}</label>
                  <input 
                    type="text"
                    value={hours}
                    onChange={(e) => setFormData({
                      ...formData, 
                      opening_hours: {...formData.opening_hours, [day]: e.target.value}
                    })}
                    className="w-full text-xs p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#006747]/20 transition-all font-bold"
                    placeholder="09:00-19:00"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Description */}
          <section className="space-y-4">
             <div className="flex items-center space-x-2 text-[#006747] mb-2">
              <Info className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-widest text-[10px]">Serviços e Notas</h2>
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
              placeholder="Descreva os serviços disponíveis (ex: Entregas 24h, Testes Rápido, etc.)"
              className="block w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium resize-none"
            />
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006747] text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6" />
                <span>{isEditing ? 'Atualizar e Re-submeter' : 'Registar Farmácia'}</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
