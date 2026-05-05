import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ShieldCheck, 
  FileText, 
  Loader2, 
  AlertCircle,
  Clock,
  Activity,
  ArrowLeft,
  Copy,
  Check,
  Calendar,
  Hash,
  Stethoscope,
  User,
  Printer,
  Sunrise,
  Sun,
  CloudSun,
  Moon,
  BedDouble,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

interface Prescription {
  id: string;
  diagnosis: string;
  items: PrescriptionItem[];
  created_at: string;
  signature_code: string;
  patient_id: string;
  professional_id: string;
  professional_name: string;
  professional_specialty: string;
  license_number: string;
  patient_name: string;
  patient_username: string;
}

export default function PrescriptionVerification() {
  const { id } = useParams();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (id) {
      verifyPrescription();
    }
  }, [id]);

  const verifyPrescription = async () => {
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_prescription_by_signature_code', {
        signature_code_in: id
      });

      if (rpcError) throw rpcError;
      
      if (!data || Object.keys(data).length === 0) {
        setError('Receita inválida ou inexistente');
      } else {
        setPrescription(data);
      }
    } catch (err) {
      console.error('RPC Error:', err);
      setError('Ocorreu um erro ao verificar a receita');
    } finally {
      setLoading(false);
    }
  };

  const getHoursFromFrequency = (freq: string) => {
    const f = (freq || "").toLowerCase();
    const hoursMatch = f.match(/(\d+)\s*\/?\s*(\d+)h/);
    if (hoursMatch) return parseInt(hoursMatch[2]);
    if (f.includes('3x')) return 8;
    if (f.includes('2x')) return 12;
    if (f.includes('4x')) return 6;
    if (f.includes('6x')) return 4;
    return 24;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#006747] mx-auto mb-4" />
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Verificando Credenciais...</p>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl border border-red-50">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black tracking-tighter mb-2 text-gray-900">Código não encontrado</h1>
          <p className="text-gray-500 mb-10 font-medium text-sm">Este código de assinatura não corresponde a nenhuma receita ativa no sistema The Cedav.</p>
          <Link to="/" className="inline-flex items-center space-x-2 bg-gray-900 text-white w-full justify-center py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200">
            <ArrowLeft className="w-4 h-4" />
            <span>Tentar outro código</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const parseDurationDays = (durationStr: string) => {
    const d = (durationStr || "").toLowerCase();
    const match = d.match(/(\d+)\s*(dia|day)/);
    return match ? parseInt(match[1]) : 1;
  };

  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500'];
  const dotColors = ['#3b82f6', '#10b981', '#f97316', '#a855f7', '#ec4899'];

  const periods = [
    { id: 'rising', name: 'Sol nascente', icon: Sunrise, hour: '06:00' },
    { id: 'morning', name: 'Manhã cedo', icon: Sun, hour: '08:00' },
    { id: 'midday', name: 'Meio dia', icon: CloudSun, hour: '12:00' },
    { id: 'afternoon', name: 'Tarde', icon: Sun, hour: '16:00' },
    { id: 'night', name: 'Noite', icon: Moon, hour: '20:00' },
    { id: 'sleep', name: 'Dormir', icon: BedDouble, hour: '23:00' },
  ];

  const isPeriodActive = (freqStr: string, periodId: string) => {
    const f = freqStr.toLowerCase();
    if (f.includes('1x')) return periodId === 'midday';
    if (f.includes('2x')) return ['morning', 'night'].includes(periodId);
    if (f.includes('3x')) return ['morning', 'midday', 'night'].includes(periodId);
    if (f.includes('4x')) return ['morning', 'midday', 'afternoon', 'night'].includes(periodId);
    if (f.includes('6x')) return true;
    return false;
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '');
  };

  const getDayNumber = (date: Date) => {
    return date.getDate().toString().padStart(2, '0');
  };

  const startTreatmentDate = prescription.start_date ? new Date(prescription.start_date) : new Date(prescription.created_at);

  return (
    <div className="min-h-screen bg-[#f1f3f5] pt-12 pb-24 px-4 overflow-x-hidden print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto">
        
        {/* Paper Container - Medical Notepad Style */}
        <div className="bg-white shadow-2xl rounded-sm overflow-hidden border border-gray-200 relative print:shadow-none print:border-none">
          
          {/* Top Decorative Bars */}
          <div className="grid grid-cols-12 h-1.5 w-full">
            <div className="col-span-8 bg-[#006747]" />
            <div className="col-span-4 bg-gray-100" />
          </div>
          
          <div className="p-10 md:p-16 relative min-h-[1000px] bg-gradient-to-b from-white via-white to-gray-50/20">
            {/* Ruled Paper Lines (Subtle) */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#006747 1px, transparent 1px)', backgroundSize: '100% 32px' }} />

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
              <Stethoscope className="w-[500px] h-[500px] transform rotate-12" />
            </div>

            {/* Content Container (Above Watermark) */}
            <div className="relative z-10">
              
              {/* Header: Clinic/Professional Info */}
              <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-gray-100 pb-12 mb-12">
                <div>
                  <div className="flex items-center space-x-2 mb-6">
                    <ShieldCheck className="w-8 h-8 text-[#006747]" />
                    <h1 className="text-2xl font-black tracking-tighter text-gray-900">
                      THE CEDAV <span className="font-light text-gray-400">ANGOLA</span>
                    </h1>
                  </div>
                  
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{prescription.professional_name || "Profissional de Saúde"}</h2>
                    <p className="text-[10px] font-black text-[#006747] uppercase tracking-[0.2em]">
                      {prescription.professional_specialty || "Medicina Geral e Familiar"}
                    </p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      Nº Ordem: {prescription.license_number}
                    </p>
                  </div>
                </div>

                <div className="mt-8 md:mt-0 text-left md:text-right flex flex-col md:items-end">
                  <div className="bg-gray-50/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-100 mb-4 inline-block min-w-[200px] shadow-sm">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Destinatário / Paciente</p>
                    <p className="text-sm font-black text-gray-900 leading-tight">{prescription.patient_name}</p>
                    <p className="text-[10px] font-bold text-[#006747] mt-1">u/{prescription.patient_username || "paciente_verificado"}</p>
                  </div>
                  <div className="flex items-center md:justify-end text-[9px] font-black text-gray-400 uppercase tracking-widest space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-[#006747]" />
                    <span>Emissão: {new Date(prescription.created_at).toLocaleDateString('pt-PT')}</span>
                  </div>
                </div>
              </div>

              {/* Rx Body Section */}
              <div className="space-y-20 py-4">
                
                {/* Diagnosis / Initial RP */}
                <div className="max-w-2xl px-6">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                    <Activity className="w-4 h-4 mr-2.5 text-[#006747]" />
                    RP / Diagnóstico Presuntivo
                  </h3>
                  <div className="relative">
                    <div className="absolute -left-6 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                    <p className="text-2xl font-medium text-gray-800 leading-relaxed font-serif italic pl-4 text-wrap">
                      "{prescription.diagnosis || "Controlo clínico e vigilância terapêutica."}"
                    </p>
                  </div>
                </div>

                {/* Medication Items */}
                <div className="grid gap-12">
                  { items.map((item, idx) => (
                    <div key={idx} className="relative pl-14 group">
                      <div className="absolute left-0 top-1 w-8 h-8 rounded-xl bg-[#006747] text-white flex items-center justify-center text-xs font-black shadow-lg shadow-emerald-100 transition-transform group-hover:scale-110">
                        {idx + 1}
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <h4 className="text-2xl font-black text-gray-900 tracking-tight">{item.medication}</h4>
                          <span className={`${colors[idx % colors.length]} text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-sm`}>
                            {item.dosage}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-8 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-2.5 text-[#006747]" />
                            {item.frequency}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2.5 text-[#006747]" />
                            {item.duration}
                          </span>
                        </div>

                        {item.notes && (
                          <div className="mt-4 p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 text-xs italic text-gray-600 leading-relaxed font-medium">
                            <span className="text-[10px] font-black text-[#006747] uppercase not-italic block mb-1 tracking-widest">Observações</span>
                            "{item.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* VISUAL POSOLOGY GRID - DARK THEME STYLE */}
                <div className="pt-20 border-t border-gray-100">
                  <div className="mb-10 flex flex-wrap gap-4">
                    {items.map((item, idx) => (
                      <div key={idx} className="bg-[#1a1a1a] p-4 rounded-2xl flex items-center space-x-4 border border-white/5 shadow-xl min-w-[240px]">
                        <div className={`w-4 h-4 rounded-full ${colors[idx % colors.length]}`} />
                        <div>
                          <p className="text-white text-xs font-black mb-0.5">{item.medication}</p>
                          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">{item.frequency || "2x dia"} — {item.notes || item.duration || "após refeição"}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#1a1a1a] rounded-[2.5rem] p-6 lg:p-10 shadow-2xl border border-white/5 relative overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar">
                      <div className="min-w-[700px]">
                        
                        {/* Grid Header: Days */}
                        <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-4 mb-4">
                          <div />
                          {Array.from({ length: 7 }).map((_, i) => {
                            const date = new Date(startTreatmentDate);
                            date.setDate(startTreatmentDate.getDate() + i);
                            const isToday = i === 2; // Simulating active day selector from image
                            return (
                              <div key={i} className={`text-center py-4 rounded-2xl transition-all ${isToday ? 'bg-white/5 border border-white/10' : ''}`}>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{getDayName(date)}</p>
                                <p className={`text-xs font-black ${isToday ? 'text-white' : 'text-gray-500'}`}>{getDayNumber(date)}</p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Grid Rows: Periods */}
                        <div className="space-y-1">
                          {periods.map((period) => (
                            <div key={period.id} className="grid grid-cols-[140px_repeat(7,1fr)] gap-4 items-center border-b border-white/[0.03] py-5 last:border-0 hover:bg-white/[0.02] rounded-xl transition-colors px-2">
                              {/* Row Label */}
                              <div className="flex items-center space-x-3">
                                <period.icon className="w-4 h-4 text-orange-400/80" />
                                <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{period.name}</span>
                              </div>

                              {/* Day Columns */}
                              {Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="flex flex-wrap items-center justify-center gap-2 min-h-[24px]">
                                  {items.map((item, idx) => {
                                    if (isPeriodActive(item.frequency || "", period.id)) {
                                      return (
                                        <div 
                                          key={idx}
                                          className={`w-3.5 h-3.5 rounded-full ${colors[idx % colors.length]} shadow-lg shadow-${colors[idx%colors.length].split('-')[1]}-500/20 transform hover:scale-125 transition-transform cursor-help`}
                                          title={`${item.medication}: ${period.name} (${period.hour})`}
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

                  {/* Period Detail Panel - Interactive Style */}
                  <div className="mt-10 bg-[#1a1a1a] rounded-[2rem] p-8 border border-white/5 shadow-2xl">
                    <div className="flex items-center space-x-4 mb-6">
                      <span className="text-white text-sm font-black">Quarta 07 — Meio dia (12:00)</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-4">
                      {items.map((item, idx) => {
                        if (isPeriodActive(item.frequency || "", 'midday')) {
                          return (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center space-x-4 min-w-[200px] hover:bg-white/10 transition-colors cursor-pointer">
                              <div className={`w-8 h-8 rounded-xl ${colors[idx % colors.length]} flex items-center justify-center`}>
                                <Pill className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-white text-sm font-black">{item.medication}</p>
                                <div className="flex items-center space-x-4 mt-1">
                                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">12:00</span>
                                  <span className="text-white/40 text-[11px] font-black">1x</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer / Digital Signature */}
                <div className="pt-24 flex flex-col md:flex-row justify-between items-end gap-12 border-t-2 border-gray-100 mt-24">
                  <div className="w-full md:w-auto flex-1">
                    <div className="flex items-center space-x-3 mb-6">
                       <ShieldCheck className="w-6 h-6 text-[#006747]" />
                       <div>
                         <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] leading-none mb-1">Certificação Digital</h4>
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Hash de Integridade RSA-2048</p>
                       </div>
                    </div>
                    <div className="bg-[#f8f9fa] p-6 rounded-[2rem] border border-gray-100 flex items-center justify-between group shadow-inner">
                       <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-[#006747]">
                            <Hash className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-mono font-black text-[#006747] tracking-tighter">{prescription.signature_code}</span>
                       </div>
                       <button 
                        onClick={() => copyToClipboard(prescription.signature_code)}
                        className="p-4 bg-white shadow-lg border border-gray-100 rounded-2xl hover:bg-emerald-50 transition-all text-[#006747]"
                       >
                         {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                       </button>
                    </div>
                  </div>

                  <div className="text-center md:text-right min-w-[300px]">
                     <div className="border-b-2 border-gray-900 pb-4 mb-4 italic font-serif text-3xl text-gray-400 opacity-40 min-h-[50px] tracking-wide">
                       {prescription.professional_name}
                     </div>
                     <p className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] mb-1">{prescription.professional_name || "Profissional Responsável"}</p>
                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Membro da Ordem dos Médicos - Angola</p>
                     <div className="inline-block px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
                        <p className="text-[8px] font-black text-[#006747] uppercase tracking-widest">Validado via Portal The Cedav v1.0</p>
                     </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 print:hidden">
           <Link 
            to="/" 
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-4 bg-white border border-gray-200 text-gray-600 px-12 py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 hover:-translate-y-1 transition-all shadow-xl shadow-gray-200/50"
           >
             <ArrowLeft className="w-5 h-5" />
             <span>Sair da Verificação</span>
           </Link>
           <button 
            onClick={() => window.print()}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-4 bg-gray-900 text-white px-14 py-6 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black hover:-translate-y-1 transition-all shadow-2xl shadow-gray-400/50"
           >
             <Printer className="w-5 h-5" />
             <span>Imprimir Receita Médica</span>
           </button>
        </div>
      </div>
    </div>
  );
}
