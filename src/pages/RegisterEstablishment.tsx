import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Building2, MapPin, Phone, Mail, Clock, Loader2, CheckCircle2, ArrowLeft, ShieldCheck, Info } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';

export default function RegisterEstablishment() {
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
    type: 'Clínica',
    license_number: '',
    province: '',
    municipality: '',
    address: '',
    services: [] as string[],
    phone: '',
    email: '',
    description: '',
    opening_hours: {
      mon: '08:00-18:00',
      tue: '08:00-18:00',
      wed: '08:00-18:00',
      thu: '08:00-18:00',
      fri: '08:00-18:00',
      sat: '09:00-13:00',
      sun: 'Closed'
    }
  });

  const [newService, setNewService] = useState('');

  const PROVINCES = [
    'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cunene', 'Huambo', 'Huíla', 
    'Kuando Kubango', 'Kwanza Norte', 'Kwanza Sul', 'Luanda', 'Lunda Norte', 
    'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'
  ];

  useEffect(() => {
    if (isEditing) {
      fetchEstablishment();
    }
  }, [id]);

  const fetchEstablishment = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_establishments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        if (data.owner_id !== user?.id && profile?.email !== 'davidcumbo69@gmail.com') {
          navigate('/settings/establishments');
          return;
        }

        setFormData({
          name: data.name,
          type: data.type,
          license_number: data.license_number,
          province: data.province || '',
          municipality: data.municipality || '',
          address: data.address,
          services: data.services || [],
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

  const addService = () => {
    if (newService.trim() && !formData.services.includes(newService.trim())) {
      setFormData({
        ...formData,
        services: [...formData.services, newService.trim()]
      });
      setNewService('');
    }
  };

  const removeService = (service: string) => {
    setFormData({
      ...formData,
      services: formData.services.filter(s => s !== service)
    });
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
        status: 'pending',
        updated_at: new Date().toISOString()
      };

      if (isEditing) {
        const { error } = await supabase
          .from('medical_establishments')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('medical_establishments')
          .insert([payload]);
        if (error) throw error;
      }

      setSuccess(true);
      setTimeout(() => navigate('/settings/establishments'), 2000);
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
        <p className="text-gray-500 font-medium">A carregar dados...</p>
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
              {isEditing ? 'Editar Estabelecimento' : 'Registar Estabelecimento'}
            </h1>
            <p className="text-gray-500">Registe a sua clínica, hospital ou posto médico.</p>
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
              <p className="text-lg font-bold text-[#006747]">Dados enviados!</p>
              <p className="text-sm text-[#006747]/80">O registo passará por aprovação administrativa.</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-gray-200/50 space-y-10 border border-gray-100">
          <section className="space-y-6">
            <div className="flex items-center space-x-2 text-[#006747] mb-2">
              <ShieldCheck className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-widest text-[10px]">Dados Oficiais</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Tipo de Estabelecimento</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
                >
                  <option value="Clínica">Clínica</option>
                  <option value="Posto Médico">Posto Médico</option>
                  <option value="Hospital">Hospital</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Nome do Estabelecimento</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Ex: Clínica Boa Saúde"
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
                  className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center space-x-2 text-[#006747] mb-2">
              <MapPin className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-widest text-[10px]">Localização e Contacto</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Província</label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({...formData, province: e.target.value})}
                  required
                  className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
                >
                  <option value="">Selecionar Província</option>
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Município</label>
                <input
                  type="text"
                  value={formData.municipality}
                  onChange={(e) => setFormData({...formData, municipality: e.target.value})}
                  required
                  placeholder="Ex: Maianga"
                  className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
              placeholder="Morada detalhada (Rua, Nº, etc.)"
              className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Telefone"
                className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Email corporativo"
                className="block w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center space-x-2 text-[#006747] mb-2">
              <Info className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-widest text-[10px]">Serviços Disponíveis</h2>
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="Inserir serviço (ex: Pediatria)"
                className="flex-1 px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all text-sm font-medium"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
              />
              <button
                type="button"
                onClick={addService}
                className="bg-[#006747] text-white px-6 rounded-2xl font-bold hover:bg-emerald-800 transition-colors"
              >
                Adicionar
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.services.map(service => (
                <span 
                  key={service}
                  className="bg-emerald-50 text-[#006747] px-3 py-1.5 rounded-xl text-sm font-bold flex items-center"
                >
                  {service}
                  <button 
                    type="button"
                    onClick={() => removeService(service)}
                    className="ml-2 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center space-x-2 text-[#006747] mb-2">
              <Clock className="w-5 h-5" />
              <h2 className="font-bold uppercase tracking-widest text-[10px]">Horários de Funcionamento</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(formData.opening_hours).map(([day, hours]) => (
                <div key={day}>
                  <label className="text-[10px] uppercase font-black text-gray-400 block px-1">{day}</label>
                  <input 
                    type="text"
                    value={hours}
                    onChange={(e) => setFormData({
                      ...formData, 
                      opening_hours: {...formData.opening_hours, [day]: e.target.value}
                    })}
                    className="w-full text-xs p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#006747]/20 transition-all font-bold"
                  />
                </div>
              ))}
            </div>
          </section>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006747] text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-100 disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <span>{isEditing ? 'Atualizar Estabelecimento' : 'Registar Estabelecimento'}</span>}
          </button>
        </form>
      </main>
    </div>
  );
}
