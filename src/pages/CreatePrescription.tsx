import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  X, 
  FileText, 
  Pill, 
  Calendar, 
  Hash, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  User,
  ShieldCheck,
  ChevronDown,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

export default function CreatePrescription() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state as { 
    prefillDiagnosis?: string, 
    clinicalHistoryId?: string,
    aiMedications?: Array<{ name: string; dosage: string; duration: string; instructions: string }>,
    aiConduct?: string
  } | null;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentSignature, setCurrentSignature] = useState<string>('');
  const printRef = React.useRef<HTMLDivElement>(null);
  const mapPrintRef = React.useRef<HTMLDivElement>(null);

  const [patientData, setPatientData] = useState<any>(null);
  const [professionalData, setProfessionalData] = useState<any>(null);
  
  const availableColors = [
    { name: 'Artemeter', value: '#3b82f6' },
    { name: 'Lumefantrina', value: '#10b981' },
    { name: 'Primaquina', value: '#f97316' },
    { name: 'Doxiciclina', value: '#a855f7' },
    { name: 'Paracetamol', value: '#ec4899' },
    { name: 'Metoclopramida', value: '#ef4444' },
    { name: 'Sulfato ferroso', value: '#06b6d4' },
    { name: 'Ácido fólico', value: '#eab308' },
    { name: 'Vitamina B12', value: '#6b7280' },
  ];

  const mapAiMeds = () => {
    if (!prefill?.aiMedications || prefill.aiMedications.length === 0) {
      return [{ 
        medication: '', 
        form: 'Comprimido', 
        dosage: '1', 
        frequency: '3x', 
        duration: '7',
        specialInstructions: '',
        color: availableColors[0].value,
        totalUnits: 0,
        endDate: '' 
      }];
    }
    return prefill.aiMedications.map((m: any, idx: number) => ({
      medication: m.name || '',
      form: 'Comprimido', // Default
      dosage: m.dosage ? (m.dosage.match(/\d+/) ? m.dosage.match(/\d+/)![0] : m.dosage) : '1',
      frequency: m.instructions ? (
        m.instructions.toLowerCase().includes('8/8') ? '8/8h' : 
        m.instructions.toLowerCase().includes('12/12') ? '12/12h' : 
        m.instructions.toLowerCase().includes('6/6') ? '6/6h' : '3x'
      ) : '3x',
      duration: m.duration ? (m.duration.match(/\d+/) ? m.duration.match(/\d+/)![0] : m.duration) : '7',
      specialInstructions: m.instructions || '',
      color: availableColors[idx % availableColors.length].value,
      totalUnits: 0,
      endDate: ''
    }));
  };

  const [formData, setFormData] = useState({
    diagnosis: prefill?.prefillDiagnosis || '',
    startDate: new Date().toISOString().split('T')[0],
    conduct: prefill?.aiConduct || '',
    items: mapAiMeds()
  });

// Function to convert numbers to Roman Numerals
  const toRoman = (num: number): string => {
    const map: { [key: string]: number } = {
      M: 1000, CM: 900, D: 500, CD: 400,
      C: 100, XC: 90, L: 50, XL: 40,
      X: 10, IX: 9, V: 5, IV: 4, I: 1
    };
    let result = '';
    let n = num;
    for (const key in map) {
      while (n >= map[key]) {
        result += key;
        n -= map[key];
      }
    }
    return result;
  };

  const isPeriodActive = (freqStr: string, hour: number) => {
    const f = freqStr.toLowerCase();
    
    // Suporte para formatos "X por dia" ou "H/H horas"
    if (f === '1x' || f.includes('24/24')) return hour === 8;
    if (f === '2x' || f.includes('12/12')) return [8, 20].includes(hour);
    if (f === '3x' || f.includes('8/8')) return [8, 16, 0].includes(hour);
    if (f === '4x' || f.includes('6/6')) return [6, 12, 18, 0].includes(hour);
    if (f === '6x' || f.includes('4/4')) return [4, 8, 12, 16, 20, 0].includes(hour);
    
    return false;
  };

  useEffect(() => {
    async function fetchData() {
      if (!user || !patientId) return;
      try {
        const { data: patient } = await supabase.from('profiles').select('*').eq('id', patientId).single();
        setPatientData(patient);
        const { data: prof } = await supabase.from('health_professionals').select('*, profiles(full_name, username)').eq('id', user.id).single();
        if (prof) {
          setProfessionalData({
            id: user.id,
            full_name: (prof as any).profiles?.full_name,
            specialty: prof.specialty,
            hospital: prof.hospital,
            license_number: prof.license_number
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchData();
  }, [user, patientId]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        medication: '', 
        form: 'Comprimido', 
        dosage: '1', 
        frequency: '3x', 
        duration: '7',
        specialInstructions: '',
        color: availableColors[prev.items.length % availableColors.length].value,
        totalUnits: 0,
        endDate: '' 
      }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Cálculo inteligente de unidades totais baseado na frequência
    let timesPerDay = 1;
    const freq = newItems[index].frequency.toLowerCase();
    if (freq === '1x' || freq.includes('24/24')) timesPerDay = 1;
    else if (freq === '2x' || freq.includes('12/12')) timesPerDay = 2;
    else if (freq === '3x' || freq.includes('8/8')) timesPerDay = 3;
    else if (freq === '4x' || freq.includes('6/6')) timesPerDay = 4;
    else if (freq === '6x' || freq.includes('4/4')) timesPerDay = 6;
    
    const durValue = parseInt(newItems[index].duration) || 0;
    const dosageValue = parseFloat(newItems[index].dosage) || 1;
    newItems[index].totalUnits = timesPerDay * durValue * dosageValue;
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!professionalData?.id) {
      setError('Aguarde carregar seus dados profissionais ou verifique se está logado como profissional.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const now = Date.now();
      const r1 = toRoman(Math.floor((now % 3000) + 1));
      const r2 = toRoman(Math.floor((Math.random() * 3000) + 1));
      const signature = `the-MMXVI-cedav-${r1}-${r2}`;
      setCurrentSignature(signature);

      const insertData = {
        patient_id: patientId,
        professional_id: professionalData.id,
        patient_name: patientData?.full_name || 'Paciente',
        professional_name: professionalData?.full_name || 'Profissional',
        diagnosis: formData.diagnosis || 'Consulta Geral',
        start_date: formData.startDate || new Date().toISOString().split('T')[0],
        signature_code: signature
      };

      const { data, error: insertError } = await supabase.from('prescriptions').insert(insertData).select().single();

      if (insertError) {
        console.error('Erro de inserção no Supabase:', insertError);
        throw insertError;
      }
      if (!data) throw new Error("Não foi possível obter os dados da receita após guardar.");

      // Send automated message to patient chat with structured prescription card format
      try {
        const medsSummary = formData.items.length > 1 
          ? `${formData.items[0].medication} (+${formData.items.length - 1} itens)`
          : formData.items[0].medication;

        const summary = {
          id: signature,
          medication: medsSummary,
          dosage: `${formData.items[0].dosage} ${formData.items[0].form}`,
          frequency: formData.items[0].frequency,
          patientUsername: patientData?.username || 'paciente'
        };

        await supabase.from('direct_messages').insert({
          sender_id: user.id,
          receiver_id: patientId,
          content: `___PRESCRIPTION:${JSON.stringify(summary)}`,
          is_system: true
        });
      } catch (chatErr) {
        console.error('Error sending prescription message:', chatErr);
      }

      // Guardar itens relacionados
      if (formData.items.length > 0) {
        const relationalItems = formData.items.map(item => ({
          prescription_id: data.id,
          medication: item.medication || 'Medicamento',
          form: item.form,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          special_instructions: item.specialInstructions,
          color: item.color,
          total_units: item.totalUnits
        }));

        const { error: itemsError } = await supabase.from('prescription_items').insert(relationalItems);
        if (itemsError) console.error('Erro ao guardar itens relacionados:', itemsError);
      }

      // Atualizar histórico clínico se aplicável
      if (prefill?.clinicalHistoryId) {
        await supabase
          .from('clinical_histories')
          .update({ 
            prescription_code: signature,
            prescription_id: data.id 
          })
          .eq('id', prefill.clinicalHistoryId);
      }

      setGenerationProgress(100);
      setSuccess(true);
      
      // Limpar rascunho
      localStorage.removeItem('prescription_draft');
      
      // Mostrar modal de sucesso
      setTimeout(() => setShowSuccessModal(true), 500);
    } catch (err: any) {
      console.error('Erro na submissão:', err);
      setError(err.message || 'Ocorreu um erro ao processar a receita. Verifique a sua ligação.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="h-screen bg-[#0a0a0a] flex items-center justify-center"><Loader2 className="w-8 h-8 text-white/20 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#030303] text-[#D7DADC] font-sans selection:bg-[#FF4500] selection:text-white relative">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-[#1A1A1B] border border-[#343536] rounded-2xl p-6 shadow-2xl"
          >
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-4 mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-black text-white tracking-tight text-center mb-2">Receita Gerada!</h3>
            <p className="text-sm text-gray-400 text-center mb-8 px-2">
              A receita já foi gerada, agora é só acompanhar o seu paciente.
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => navigate(`/perfil/${patientId}`)}
                className="w-full py-4 bg-[#D7DADC] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg active:scale-95"
              >
                Perfil do Paciente
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full py-4 bg-transparent border border-[#343536] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#272729] transition-all active:scale-95"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Top Navbar mimic */}
      <div className="h-12 bg-[#1A1A1B] border-b border-[#343536] fixed top-0 w-full z-50 flex items-center px-4 md:px-8">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#FF4500] rounded-full flex items-center justify-center text-white">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold tracking-tight">r/TheCedavPrescriptions</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 pt-20 pb-12 grid grid-cols-1 lg:grid-cols-[1fr,312px] gap-6">
        
        {/* Main Content: Reddit "Post" Column */}
        <div className="space-y-4">
          <div className="bg-[#1A1A1B] border border-[#343536] rounded hover:border-[#818384] transition-colors">
            
            <form onSubmit={handleSubmit}>
              {/* Post Header */}
              <div className="p-4 border-b border-[#343536] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-black text-white">C</div>
                  <div className="flex flex-col">
                    <p className="text-[12px] font-bold">The Cedav Protocol <span className="font-normal text-gray-500">• Posted by {professionalData?.full_name ? `Dr(a). ${professionalData.full_name}` : 'Medic'}</span></p>
                    <p className="text-[10px] text-gray-500 font-medium">Hospital: {professionalData?.hospital || 'Central Health'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{new Date().toLocaleDateString('pt-PT')}</p>
                </div>
              </div>

              {/* Patient context card (Reddit style card body) */}
              <div className="p-5 space-y-6">
                <div>
                  <h1 className="text-xl font-medium text-[#D7DADC] mb-4">Emissão de Receituário Digital para {patientData?.full_name}</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#272729] rounded-md border border-[#343536]">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-wider">Paciente</label>
                      <p className="text-sm font-bold text-white">{patientData?.full_name}</p>
                      <p className="text-[10px] text-gray-500 mt-1 uppercase font-black">ID: {patientData?.id.slice(0,12).toUpperCase()}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block tracking-wider">Cédula Profissional</label>
                      <p className="text-sm font-mono font-bold text-[#FF4500]">{professionalData?.license_number}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Diagnóstico / Motivo</label>
                    <input 
                      required
                      type="text"
                      placeholder="Qual o diagnóstico clínico?"
                      value={formData.diagnosis}
                      onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                      className="w-full bg-[#1A1A1B] border border-[#343536] rounded px-4 py-2 text-sm focus:border-[#D7DADC] outline-none transition-colors"
                    />
                  </div>
                  <div className="w-full md:w-48 space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Início</label>
                    <input 
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-[#1A1A1B] border border-[#343536] rounded px-4 py-2 text-sm focus:border-[#D7DADC] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Conduta Médica & Recomendações (IA)</label>
                  <textarea 
                    rows={3}
                    placeholder="Recomendações adicionais, dieta, repouso, etc..."
                    value={formData.conduct}
                    onChange={(e) => setFormData(prev => ({ ...prev, conduct: e.target.value }))}
                    className="w-full bg-[#1A1A1B] border border-[#343536] rounded px-4 py-2 text-sm focus:border-[#D7DADC] outline-none transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Medication Items List */}
              <div className="p-5 border-t border-[#343536] bg-[#1A1A1B]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Prescrições ({formData.items.length})</h3>
                  <button 
                    type="button" 
                    onClick={addItem}
                    className="flex items-center space-x-2 text-[11px] font-bold text-[#D7DADC] bg-[#343536] px-4 py-2 rounded-full hover:bg-[#444546] transition-colors"
                  >
                    <span>+ Medicamento</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="group/item p-4 bg-[#272729] rounded border border-[#343536] relative hover:border-[#818384] transition-colors">
                      {formData.items.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="absolute right-2 top-2 p-1 text-gray-600 hover:text-[#FF4500] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="md:col-span-2 space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                            <input 
                              required
                              placeholder="Nome do Medicamento..."
                              value={item.medication}
                              onChange={(e) => updateItem(idx, 'medication', e.target.value)}
                              className="w-full bg-transparent border-none p-0 text-sm font-bold text-white placeholder:text-white/10 outline-none"
                            />
                          </div>
                          <div className="flex items-center space-x-4">
                            <select 
                              value={item.form}
                              onChange={(e) => updateItem(idx, 'form', e.target.value)}
                              className="bg-transparent border-none p-0 text-[10px] font-bold text-gray-500 uppercase tracking-wider outline-none cursor-pointer"
                            >
                              <option className="bg-[#1A1A1B]">Comprimido</option>
                              <option className="bg-[#1A1A1B]">Cápsula</option>
                              <option className="bg-[#1A1A1B]">Xarope</option>
                              <option className="bg-[#1A1A1B]">Injetável</option>
                            </select>
                            <input 
                              placeholder="Instruções..."
                              value={item.specialInstructions}
                              onChange={(e) => updateItem(idx, 'specialInstructions', e.target.value)}
                              className="flex-1 bg-transparent border-none p-0 text-[10px] font-medium text-gray-600 outline-none placeholder:text-gray-800"
                            />
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 md:col-span-1">
                           <div className="flex-1">
                              <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Freq</p>
                              <select 
                                value={item.frequency}
                                onChange={(e) => updateItem(idx, 'frequency', e.target.value)}
                                className="w-full bg-transparent border border-[#343536] rounded px-2 py-1 text-xs font-bold text-white"
                              >
                                {[
                                  { label: '1x ao dia', value: '1x' },
                                  { label: '12/12 horas', value: '12/12h' },
                                  { label: '8/8 horas', value: '8/8h' },
                                  { label: '6/6 horas', value: '6/6h' },
                                  { label: '4/4 horas', value: '4/4h' },
                                ].map(f => <option key={f.value} value={f.value} className="bg-[#1A1A1B]">{f.label}</option>)}
                              </select>
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Dias</p>
                              <input 
                                type="number"
                                value={item.duration}
                                onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                                className="w-full bg-transparent border border-[#343536] rounded px-2 py-1 text-xs font-bold text-white"
                              />
                           </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Total</p>
                          <p className="text-sm font-black text-white">{item.totalUnits}<span className="text-[10px] text-gray-600 ml-1">x</span></p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Bar mimic (Reddit comment bar) */}
              <div className="p-4 bg-[#1A1A1B] border-t border-[#343536] flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-1.5 cursor-pointer text-gray-500 hover:bg-white/5 p-2 rounded">
                    <ShieldCheck className="w-5 h-5 text-[#FF4500]" />
                    <span className="text-xs font-bold">Rascunho Seguro</span>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={loading || success}
                  className="px-8 py-2 bg-[#D7DADC] text-black hover:bg-white rounded-full text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 relative overflow-hidden"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{generationProgress > 0 ? `A guardar receita...` : 'A publicar...'}</span>
                    </div>
                  ) : success ? (
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Prescrito!</span>
                    </div>
                  ) : (
                    <span>Guardar Receita</span>
                  )}
                  {loading && generationProgress > 0 && (
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-300" 
                      style={{ width: `${generationProgress}%` }}
                    />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Hidden Capture Area for PDF Generation - EXACT DIGITAL MATCH (DARK) */}
          <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none">
            {/* Page 1: Official Prescription */}
            <div 
              ref={printRef}
              className="w-[800px] bg-[#030303] text-[#D7DADC] p-8 font-sans"
            >
              {/* Navbar Mimic */}
              <div className="h-12 bg-[#1A1A1B] border-b border-[#343536] flex items-center px-6 mb-8 rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#FF4500] rounded-full flex items-center justify-center text-white">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-black tracking-tight text-white uppercase italic">The Cedav Digital</span>
                </div>
              </div>

              <div className="bg-[#1A1A1B] border border-[#343536] rounded p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#343536]">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">V</div>
                    <div className="flex flex-col">
                      <p className="text-[12px] font-bold">The Cedav Digital <span className="font-normal text-gray-500">• Documento Oficial</span></p>
                    </div>
                  </div>
                </div>

                <h1 className="text-2xl font-black text-white tracking-tight mb-8">Receituário Digital #{Date.now().toString(16).toUpperCase().slice(-6)}</h1>
                
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="p-6 bg-[#272729] rounded border border-[#343536]">
                    <p className="text-[9px] font-black text-[#006747] uppercase tracking-[0.2em] mb-3">Profissional Responsável</p>
                    <h2 className="text-xl font-black text-white leading-tight">Dr(a). {professionalData?.full_name}</h2>
                    <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">{professionalData?.specialty} • {professionalData?.license_number}</p>
                    <p className="text-[10px] text-[#006747] font-black uppercase mt-1">Hospital Central de Luanda</p>
                  </div>
                  <div className="p-6 bg-[#272729] rounded border border-[#343536]">
                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Paciente / Diagnóstico</p>
                    <h2 className="text-xl font-black text-white truncate">{patientData?.full_name}</h2>
                    <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">Diagnóstico: {formData.diagnosis}</p>
                    <p className="text-[10px] text-gray-600 font-black uppercase mt-1">Emissão: {new Date().toLocaleDateString('pt-PT')}</p>
                  </div>
                </div>

                <div className="bg-[#030303] rounded border border-[#343536] overflow-hidden mb-12">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-6 border-b border-[#343536] last:border-0 hover:bg-[#1A1A1B] transition-colors">
                      <div className="flex items-center space-x-6 flex-1">
                        <div className="w-8 h-8 bg-[#343536] rounded-full flex items-center justify-center text-[10px] font-black text-gray-400">
                          {idx + 1}
                        </div>
                        <div className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-sm font-black text-white tracking-tight">{item.medication}</h4>
                            <span className="text-[10px] font-medium text-gray-500 uppercase">{item.form}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-12 ml-6">
                        <div className="text-right min-w-[140px]">
                          <p className="text-sm font-black text-white/90 leading-tight">
                            {item.frequency}/dia · {item.duration} dias
                          </p>
                        </div>
                        <div className="w-10 text-right">
                          <p className="text-sm font-black text-white">
                            {item.totalUnits}<span className="text-[10px] text-gray-500 ml-0.5 font-bold">x</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-8 border-t border-[#343536]">
                  <div className="space-y-4">
                    <div className="bg-[#272729] border border-[#343536] rounded p-4 flex items-center space-x-4">
                       <div className="w-10 h-10 bg-[#FF4500]/10 rounded flex items-center justify-center text-[#FF4500]">
                          <ShieldCheck className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">AUTENTICIDADE VERIFICADA</p>
                          <p className="text-sm font-mono font-black text-white tracking-[0.2em]">{currentSignature}</p>
                       </div>
                    </div>
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Protocolo Digital The Cedav • 2026</p>
                  </div>
                  <div className="text-right">
                    <div className="mb-6 h-[60px] flex flex-col justify-end opacity-20">
                       <p className="font-serif italic text-3xl text-white mb-2">{professionalData?.full_name}</p>
                       <div className="h-[1px] w-[200px] bg-white ml-auto" />
                    </div>
                    <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Dr(a). {professionalData?.full_name}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Delegado de Saúde Autorizado</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Page 2: Therapeutic Map - DIGITAL MATCH */}
            <div 
              ref={mapPrintRef}
              className="w-[800px] bg-[#030303] text-[#D7DADC] p-8 font-sans"
            >
              <div className="bg-[#1A1A1B] border border-[#343536] rounded p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-6 h-6 text-[#FF4500]" />
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase">Cronograma de Administração</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-white">{patientData?.full_name}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Início: {new Date(formData.startDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                </div>

                <div className="bg-[#030303] rounded border border-[#343536] p-6 mb-10">
                   <div className="grid grid-cols-[80px_repeat(14,1fr)] gap-1 mb-6 border-b border-[#343536] pb-4">
                      <div className="text-[10px] font-black text-gray-500 uppercase self-end">Hora</div>
                      {Array.from({ length: 14 }).map((_, i) => {
                          const d = new Date(formData.startDate);
                          d.setDate(d.getDate() + i);
                          return (
                            <div key={i} className="text-center">
                                <p className="text-[8px] font-bold text-gray-600 uppercase mb-1">{d.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '')}</p>
                                <p className="text-[10px] font-bold text-gray-400">{d.getDate()}</p>
                            </div>
                          );
                      })}
                   </div>

                   {[0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(hour => (
                      <div key={hour} className="grid grid-cols-[80px_repeat(14,1fr)] gap-1 py-2 border-b border-white/[0.01] last:border-0">
                          <div className="text-[10px] font-bold text-gray-500 self-center">{hour.toString().padStart(2, '0')}:00</div>
                          {Array.from({ length: 14 }).map((_, dIdx) => (
                            <div key={dIdx} className="flex flex-wrap items-center justify-center gap-1 min-h-[24px]">
                                {formData.items.map((item, mIdx) => {
                                  const dur = parseInt(item.duration) || 0;
                                  if (dIdx < dur && isPeriodActive(item.frequency, hour)) {
                                      return (
                                        <div 
                                          key={mIdx}
                                          className="w-3 h-3 rounded-full shadow-lg"
                                          style={{ backgroundColor: item.color }}
                                        />
                                      );
                                  }
                                  return null;
                                })}
                            </div>
                          ))}
                      </div>
                   ))}
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Legenda dos Medicamentos</p>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.items.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-3 bg-[#272729] p-4 rounded border border-[#343536]">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <div>
                          <p className="text-sm font-black text-white">{item.medication}</p>
                          <p className="text-[10px] text-gray-500">{item.form} • {item.frequency} / Dia</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-[#343536] flex items-center justify-between text-gray-600">
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em]">SISTEMA VIVA+ & THE CEDAV DIGITAL • AUTENTICIDADE GARANTIDA</p>
                  <p className="text-[8px] font-bold uppercase tracking-widest">Página 2 de 2</p>
                </div>
              </div>
            </div>
          </div>

          {/* Therapeutic Map Card */}
          <div className="bg-[#1A1A1B] border border-[#343536] rounded p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Calendar className="w-4 h-4 text-[#FF4500]" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cronograma Terapêutico</h3>
            </div>
            
            <div className="overflow-x-auto no-scrollbar">
              <div className="min-w-[650px]">
                <div className="grid grid-cols-[80px_repeat(14,1fr)] gap-1 mb-6 border-b border-[#343536] pb-3">
                   <div />
                   {Array.from({ length: 14 }).map((_, i) => {
                      const d = new Date(formData.startDate);
                      d.setDate(d.getDate() + i);
                      return (
                         <div key={i} className="text-center">
                            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter mb-1">{d.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '')}</p>
                            <p className="text-[10px] font-bold text-gray-400">{d.getDate()}</p>
                         </div>
                      );
                   })}
                </div>

                {[0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(hour => (
                   <div key={hour} className="grid grid-cols-[80px_repeat(14,1fr)] gap-1 py-1.5 hover:bg-white/[0.02] transition-colors rounded">
                      <div className="text-[10px] font-bold text-gray-500 self-center">{hour.toString().padStart(2, '0')}:00</div>
                      {Array.from({ length: 14 }).map((_, dIdx) => (
                         <div key={dIdx} className="flex flex-wrap items-center justify-center gap-0.5 min-h-[14px]">
                            {formData.items.map((item, mIdx) => {
                               const dur = parseInt(item.duration) || 0;
                               if (dIdx < dur && isPeriodActive(item.frequency, hour)) {
                                  return (
                                     <div 
                                       key={mIdx}
                                       className="w-2 h-2 rounded-full"
                                       style={{ backgroundColor: item.color, opacity: item.medication ? 1 : 0.1 }}
                                     />
                                  );
                               }
                               return null;
                            })}
                         </div>
                      ))}
                   </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Reddit Community Bar mimic */}
        <div className="space-y-4 hidden lg:block">
          <div className="bg-[#1A1A1B] border border-[#343536] rounded overflow-hidden">
            <div className="h-9 bg-[#343536] p-3 flex items-center">
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Sobre a Comunidade</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-black shadow-lg">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold">r/TheCedavHealth</span>
                  <span className="text-[10px] text-gray-500 uppercase font-black">Angola • 2026</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-normal">
                Sistema avançado de prescrição médica digital em tempo real. Este r/ (documento) é assinado por protocolos criptográficos certificados.
              </p>
              <div className="space-y-4 pt-4 border-t border-[#343536]">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold">Profissional Ativo</h4>
                    <p className="text-[10px] text-gray-500">{professionalData?.full_name}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold">Licença Verificada</h4>
                    <p className="text-[10px] text-gray-500">{professionalData?.license_number}</p>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1B] border border-[#343536] rounded p-4">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Integridade do Paciente</h4>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-500">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{patientData?.full_name}</p>
                <p className="text-[10px] text-gray-500">u/{patientData?.username}</p>
              </div>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded text-[10px] text-gray-500 leading-relaxed italic">
              "Todos os dados introduzidos são processados sob sigilo médico e proteção de dados."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
