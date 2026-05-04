import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { BadgeCheck, Stethoscope, FileText, CheckCircle2, AlertCircle, Loader2, Camera, Building2, GraduationCap, MapPin, Phone, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Header } from '../components/layout/Header';

export default function ProfessionalSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [proImageUrl, setProImageUrl] = useState('');
  const [professionalOrder, setProfessionalOrder] = useState('Ordem dos Médicos');
  const [specialty, setSpecialty] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [workplaceName, setWorkplaceName] = useState('');
  const [workplaceAddress, setWorkplaceAddress] = useState('');
  const [academicDegree, setAcademicDegree] = useState('Licenciatura');
  const [phoneBusiness, setPhoneBusiness] = useState('');
  const [bio, setBio] = useState(profile?.bio || '');
  const [pendingRequest, setPendingRequest] = useState<any>(null);
  const [rejectedRequest, setRejectedRequest] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      setAvatarUrl(profile.avatar_url || '');
      setBio(profile.bio || '');
      fetchProfessionalData();
      fetchLatestRequest();
    }
  }, [profile]);

  const fetchLatestRequest = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('professional_verifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (data && data.length > 0) {
      const latest = data[0];
      if (latest.status === 'pending') {
        setPendingRequest(latest);
      } else if (latest.status === 'rejected') {
        setRejectedRequest(latest);
      }
    }
  };

  const fetchProfessionalData = async () => {
    if (!user) return;
    const { data, error: proError } = await supabase
      .from('health_professionals')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfessionalOrder(data.professional_order);
      setSpecialty(data.specialty);
      setLicenseNumber(data.license_number);
      setWorkplaceName(data.workplace_name || '');
      setWorkplaceAddress(data.workplace_address || '');
      setAcademicDegree(data.academic_degree || 'Licenciatura');
      setPhoneBusiness(data.phone_business || '');
      setProImageUrl(data.image_url || '');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setAvatarUrl(publicUrl);
      setProImageUrl(publicUrl);
      await refreshProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Submit Verification Request
      const { error: reqError } = await supabase
        .from('professional_verifications')
        .insert({
          user_id: user.id,
          professional_order: professionalOrder,
          license_number: licenseNumber,
          workplace_name: workplaceName,
          workplace_address: workplaceAddress,
          specialty,
          academic_degree: academicDegree,
          phone_business: phoneBusiness,
          image_url: proImageUrl || avatarUrl,
          status: 'pending'
        });

      if (reqError) throw reqError;

      // Update bio regardless
      await supabase.from('profiles').update({ bio }).eq('id', user.id);

      await refreshProfile();
      await fetchLatestRequest();
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20 min-h-screen bg-[#dae0e6]">
      <Header />
      
      <div className="max-w-2xl mx-auto pt-8 px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#006747] to-emerald-700 p-8 text-white relative">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Stethoscope className="w-10 h-10 text-white/50" />
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-white text-[#006747] rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handlePhotoUpload} 
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Portal do Profissional SNS</h1>
                <p className="text-emerald-100 text-sm opacity-90 max-w-md">
                  Complete o seu registo profissional para obter autoridade máxima no VIVA+.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {profile?.is_verified && (
              <div className="mb-8 bg-green-50 border border-green-100 rounded-xl p-4 flex items-center space-x-3">
                <BadgeCheck className="w-6 h-6 text-green-600 fill-current" />
                <div>
                  <p className="text-sm font-bold text-green-900">Credencial Verificada pelo Ministério da Saúde</p>
                  <p className="text-xs text-green-700">O seu perfil está ativo e pode criar grupos e publicações oficiais.</p>
                </div>
              </div>
            )}

            {pendingRequest && (
              <div className="mb-8 bg-yellow-50 border border-yellow-100 rounded-xl p-4 flex items-center space-x-3 text-yellow-800">
                <Loader2 className="w-5 h-5 animate-spin" />
                <div>
                  <p className="text-sm font-bold">Candidatura em Processamento</p>
                  <p className="text-xs">Os seus dados estão a ser validados pelo SNS Digital. Receberá uma notificação em breve.</p>
                </div>
              </div>
            )}

            {rejectedRequest && (
              <div className="mb-8 bg-red-50 border border-red-100 rounded-xl p-4 flex items-center space-x-3 text-red-800">
                <XCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-bold">Pedido Rejeitado</p>
                  <p className="text-xs mb-2">Infelizmente a sua candidatura não foi aprovada. Por favor verifique os dados e tente novamente.</p>
                  {rejectedRequest.admin_notes && (
                    <p className="text-xs p-2 bg-white/50 rounded-lg italic border border-red-50">
                      Motivo: {rejectedRequest.admin_notes}
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => setRejectedRequest(null)}
                  className="bg-white px-3 py-1 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-50 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            )}

            {!profile?.is_verified && !pendingRequest && profile?.is_professional === false && (
              <div className="mb-8 bg-emerald-50/50 rounded-xl p-6 border border-emerald-100">
                <p className="text-sm text-emerald-900 font-medium mb-2">Para se tornar um Profissional Verificado:</p>
                <ul className="text-xs text-emerald-800 space-y-2">
                  <li className="flex items-center space-x-2">• Preencha os seus dados de inscrição na Ordem correspondente</li>
                  <li className="flex items-center space-x-2">• Indique o seu local de trabalho atual</li>
                  <li className="flex items-center space-x-2">• Aguarde a aprovação da nossa equipa administrativa</li>
                </ul>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-100 rounded-xl p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-[#006747]" />
                <p className="text-sm text-[#006747] font-medium">Dados profissionais atualizados com sucesso!</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Ordem Profissional</label>
                  <select
                    value={professionalOrder}
                    onChange={(e) => setProfessionalOrder(e.target.value)}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-[#006747] focus:border-[#006747] text-sm"
                  >
                    <option value="Ordem dos Médicos">Ordem dos Médicos</option>
                    <option value="Ordem dos Enfermeiros">Ordem dos Enfermeiros</option>
                    <option value="Ordem dos Psicólogos">Ordem dos Psicólogos</option>
                    <option value="Ordem dos Nutricionistas">Ordem dos Nutricionistas</option>
                    <option value="Ordem dos Farmacêuticos">Ordem dos Farmacêuticos</option>
                    <option value="Ordem dos Médicos Dentistas">Ordem dos Médicos Dentistas</option>
                    <option value="Ordem dos Médicos Veterinários">Ordem dos Médicos Veterinários</option>
                    <option value="Ordem dos Biólogos">Ordem dos Biólogos</option>
                    <option value="Ordem dos Fisioterapeutas">Ordem dos Fisioterapeutas</option>
                    <option value="Ordem dos Assistentes Sociais">Ordem dos Assistentes Sociais</option>
                    <option value="Associação Portuguesa de Termalismo">Associação Portuguesa de Termalismo</option>
                    <option value="Especialista Spa e Bem-estar">Especialista Spa e Bem-estar</option>
                    <option value="Outro (Técnico/Auxiliar)">Outro (Técnico/Auxiliar)</option>
                  </select>
                </div>

                {/* License */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Cédula Profissional</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      required
                      placeholder="Ex: 65432"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-[#006747] focus:border-[#006747] text-sm"
                    />
                  </div>
                </div>

                {/* Specialty */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Especialidade / Título</label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      required
                      placeholder="Ex: Medicina Geral e Familiar"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-[#006747] focus:border-[#006747] text-sm"
                    />
                  </div>
                </div>

                {/* Academic Degree */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Grau Académico</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                    <select
                      value={academicDegree}
                      onChange={(e) => setAcademicDegree(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-[#006747] focus:border-[#006747] text-sm"
                    >
                      <option value="CTeSP">CTeSP</option>
                      <option value="Licenciatura">Licenciatura</option>
                      <option value="Mestrado">Mestrado</option>
                      <option value="Doutoramento">Doutoramento</option>
                      <option value="Agregação">Agregação</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Local de Trabalho
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Instituição</label>
                    <input
                      type="text"
                      value={workplaceName}
                      onChange={(e) => setWorkplaceName(e.target.value)}
                      placeholder="Ex: Hospital de Santa Maria"
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-[#006747] focus:border-[#006747] text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Localização / Cidade</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={workplaceAddress}
                        onChange={(e) => setWorkplaceAddress(e.target.value)}
                        placeholder="Ex: Lisboa"
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-[#006747] focus:border-[#006747] text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Contacto Profissional (Opcional)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={phoneBusiness}
                    onChange={(e) => setPhoneBusiness(e.target.value)}
                    placeholder="+351 210 000 000"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-[#006747] focus:border-[#006747] text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Biografia Profissional</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Descreva a sua experiência clínica..."
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-[#006747] focus:border-[#006747] text-sm resize-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !!pendingRequest}
                  className="w-full bg-[#006747] text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>{pendingRequest ? 'Aguardando Aprovação' : 'Submeter Dados para Aprovação'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
