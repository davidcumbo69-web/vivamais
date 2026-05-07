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
  Pill,
  Sunrise,
  Sun,
  CloudSun,
  Moon,
  BedDouble,
  Info,
  Download
} from 'lucide-react';
import { motion } from 'motion/react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';

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
  pdf_url?: string;
  taken_doses?: Record<string, boolean>;
}

export default function DigitalPrescriptionView() {
  const { id } = useParams();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const prescriptionRef = React.useRef<HTMLDivElement>(null);
  const mapPrintRef = React.useRef<HTMLDivElement>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPDF = async () => {
    if (!prescription) return;
    
    // If we have a pre-generated URL, use it directly
    if (prescription.pdf_url) {
      window.open(prescription.pdf_url, '_blank');
      return;
    }

    if (!prescriptionRef.current || !mapPrintRef.current) return;
    
    setDownloading(true);
    try {
      // Capture Main Prescription
      const dataUrl = await toPng(prescriptionRef.current, {
        quality: 0.95,
        backgroundColor: '#030303',
        pixelRatio: 2,
      });

      // Capture Therapeutic Map
      const mapDataUrl = await toPng(mapPrintRef.current, {
        quality: 0.95,
        backgroundColor: '#030303',
        pixelRatio: 2,
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Page 1: Main Prescription
      const imgProps = pdf.getImageProperties(dataUrl);
      const mainImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, mainImgHeight);
      
      // Page 2: Therapeutic Map
      pdf.addPage();
      const mapImgProps = pdf.getImageProperties(mapDataUrl);
      const mapImgHeight = (mapImgProps.height * pdfWidth) / mapImgProps.width;
      pdf.addImage(mapDataUrl, 'PNG', 0, 0, pdfWidth, Math.min(mapImgHeight, pdfHeight));

      pdf.save(`Receita_${prescription.patient_name.replace(/\s+/g, '_')}_${prescription.signature_code}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  const [takenDoses, setTakenDoses] = useState<Record<string, boolean>>({});
  const [updatingDose, setUpdatingDose] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPrescription();
    }
  }, [id]);

  const loadPrescription = async () => {
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
        // Load taken doses if they exist
        if (data.taken_doses) {
          setTakenDoses(data.taken_doses);
        }
      }
    } catch (err) {
      console.error('RPC Error:', err);
      setError('Ocorreu um erro ao aceder à receita');
    } finally {
      setLoading(false);
    }
  };

  const toggleDose = async (medIdx: number, dIdx: number, hour: number) => {
    if (!prescription || updatingDose) return;
    
    const doseKey = `${medIdx}-${dIdx}-${hour}`;
    setUpdatingDose(doseKey);
    
    const newTakenDoses = { ...takenDoses, [doseKey]: !takenDoses[doseKey] };
    
    try {
      const { error: updateError } = await supabase
        .from('prescriptions')
        .update({ taken_doses: newTakenDoses })
        .eq('id', prescription.id);

      if (updateError) throw updateError;
      
      setTakenDoses(newTakenDoses);
    } catch (err) {
      console.error('Error updating dose:', err);
      // Optional: Show toast error
    } finally {
      setUpdatingDose(null);
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
          <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">A carregar receituário...</p>
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

  const items = prescription.items || [];
  const maxDurationDays = Math.max(...items.map(item => parseDurationDays(item.duration)));
  const startDate = new Date(prescription.created_at);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + maxDurationDays);

  const periods = [
    { id: 'rising', name: 'Sol nascente', icon: Sunrise, hour: '06:00' },
    { id: 'morning', name: 'Manhã cedo', icon: Sun, hour: '08:00' },
    { id: 'midday', name: 'Meio dia', icon: CloudSun, hour: '12:00' },
    { id: 'afternoon', name: 'Tarde', icon: Sun, hour: '16:00' },
    { id: 'night', name: 'Noite', icon: Moon, hour: '20:00' },
    { id: 'sleep', name: 'Dormir', icon: BedDouble, hour: '23:00' },
  ];

  const isPeriodActiveForHour = (freqStr: string, hour: number) => {
    const f = (freqStr || "").toLowerCase();
    
    // Suporte para formatos "X por dia" ou "H/H horas"
    if (f === '1x' || f.includes('24/24')) return hour === 8;
    if (f === '2x' || f.includes('12/12')) return [8, 20].includes(hour);
    if (f === '3x' || f.includes('8/8')) return [8, 16, 0].includes(hour);
    if (f === '4x' || f.includes('6/6')) return [6, 12, 18, 0].includes(hour);
    if (f === '6x' || f.includes('4/4')) return [4, 8, 12, 16, 20, 0].includes(hour);
    
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
    <div className="min-h-screen bg-[#030303] text-[#D7DADC] font-sans selection:bg-[#FF4500] selection:text-white print:bg-white print:text-black">
      {/* Hidden Capture Area for Fallback PDF Generation - EXACT DIGITAL MATCH (DARK) */}
      <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none">
        {/* Page 1: Official Prescription */}
        <div 
          ref={prescriptionRef}
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

            <h1 className="text-2xl font-black text-white tracking-tight mb-8">Receituário Digital #{prescription.id.slice(0,8).toUpperCase()}</h1>
            
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="p-6 bg-[#272729] rounded border border-[#343536]">
                <p className="text-[9px] font-black text-[#006747] uppercase tracking-[0.2em] mb-3">Profissional Responsável</p>
                <h2 className="text-xl font-black text-white leading-tight">Dr(a). {prescription.professional_name}</h2>
                <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">{prescription.professional_specialty} • {prescription.license_number}</p>
                <p className="text-[10px] text-[#006747] font-black uppercase mt-1">Hospital Central de Luanda</p>
              </div>
              <div className="p-6 bg-[#272729] rounded border border-[#343536]">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Paciente / Diagnóstico</p>
                <h2 className="text-xl font-black text-white truncate">{prescription.patient_name}</h2>
                <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">Diagnóstico: {prescription.diagnosis}</p>
                <p className="text-[10px] text-gray-600 font-black uppercase mt-1">Emissão: {new Date(prescription.created_at).toLocaleDateString('pt-PT')}</p>
              </div>
            </div>

            <div className="bg-[#030303] rounded border border-[#343536] overflow-hidden mb-12">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-6 border-b border-[#343536] last:border-0 hover:bg-[#1A1A1B] transition-colors">
                  <div className="flex items-center space-x-6 flex-1">
                    <div className="w-8 h-8 bg-[#343536] rounded-full flex items-center justify-center text-[10px] font-black text-gray-400">
                      {idx + 1}
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full shadow-lg" style={{ backgroundColor: (item as any).color || dotColors[idx % dotColors.length] }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-sm font-black text-white tracking-tight">{item.medication}</h4>
                        <span className="text-[10px] font-medium text-gray-500 uppercase">{item.form || 'Comprimido'}</span>
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
                        {(item as any).totalUnits || (parseInt(item.frequency) * parseInt(item.duration))}<span className="text-[10px] text-gray-500 ml-0.5 font-bold">x</span>
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
                      <p className="text-sm font-mono font-black text-white tracking-[0.2em]">{prescription.signature_code}</p>
                   </div>
                </div>
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">Protocolo Digital The Cedav • 2026</p>
              </div>
              <div className="text-right">
                <div className="mb-6 h-[60px] flex flex-col justify-end opacity-20">
                   <p className="font-serif italic text-3xl text-white mb-2">{prescription.professional_name}</p>
                   <div className="h-[1px] w-[200px] bg-white ml-auto" />
                </div>
                <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Dr(a). {prescription.professional_name}</p>
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
                <p className="text-sm font-black text-white">{prescription.patient_name}</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase">Início: {startTreatmentDate.toLocaleDateString('pt-PT')}</p>
              </div>
            </div>

            <div className="bg-[#030303] rounded border border-[#343536] p-6 mb-10">
               <div className="grid grid-cols-[80px_repeat(14,1fr)] gap-1 mb-6 border-b border-[#343536] pb-4">
                  <div className="text-[10px] font-black text-gray-500 uppercase self-end">Hora</div>
                  {Array.from({ length: 14 }).map((_, i) => {
                      const d = new Date(startTreatmentDate);
                      d.setDate(d.getDate() + i);
                      return (
                        <div key={i} className="text-center">
                            <p className="text-[8px] font-bold text-gray-600 uppercase mb-1">{getDayName(d)}</p>
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
                            {items.map((item, mIdx) => {
                              const dur = parseDurationDays(item.duration);
                              if (dIdx < dur && isPeriodActiveForHour(item.frequency, hour)) {
                                  return (
                                    <div 
                                      key={mIdx}
                                      className="w-3 h-3 rounded-full shadow-lg"
                                      style={{ backgroundColor: (item as any).color || dotColors[mIdx % dotColors.length] }}
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
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-3 bg-[#272729] p-4 rounded border border-[#343536]">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: (item as any).color || dotColors[idx % dotColors.length] }} />
                    <div>
                      <p className="text-sm font-black text-white">{item.medication}</p>
                      <p className="text-[10px] text-gray-500">{item.form || 'Comprimido'} • {item.frequency} / Dia</p>
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

      {/* Top Navbar mimic */}
      <div className="h-12 bg-[#1A1A1B] border-b border-[#343536] fixed top-0 w-full z-50 flex items-center px-4 md:px-8 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#FF4500] rounded-full flex items-center justify-center text-white">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold tracking-tight">r/VIVAplus_Oficial</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 pt-20 pb-12 grid grid-cols-1 lg:grid-cols-[1fr,312px] gap-6">
        {/* Main Content: Reddit "Thread" Column */}
        <div className="space-y-4 print:space-y-0 print:m-0 print:p-0">
          <div className="bg-[#1A1A1B] border border-[#343536] rounded hover:border-[#818384] transition-colors print:bg-white print:border-none print:shadow-none">
            
            {/* Thread Header */}
            <div className="p-4 border-b border-[#343536] flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">V</div>
                <div className="flex flex-col">
                  <p className="text-[12px] font-bold">The Cedav Digital <span className="font-normal text-gray-500">• Documento Oficial</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{new Date(prescription.created_at).toLocaleDateString('pt-PT')}</p>
              </div>
            </div>

            {/* Document Content (The Post) */}
            <div className="p-8 print:p-0">
              <h1 className="text-2xl font-black text-white tracking-tight mb-8 print:text-black print:text-center print:text-3xl">Receituário Digital #{prescription.id.slice(0,8).toUpperCase()}</h1>
              
              {/* Professional & Patient Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 print:grid-cols-2 print:gap-4 print:mb-8">
                <div className="p-6 bg-[#272729] rounded border border-[#343536] print:bg-white print:border-gray-200">
                   <p className="text-[9px] font-black text-[#006747] uppercase tracking-[0.2em] mb-3">Profissional Responsável</p>
                   <h2 className="text-xl font-black text-white leading-tight print:text-black">Dr(a). {prescription.professional_name}</h2>
                   <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">{prescription.professional_specialty} • {prescription.license_number}</p>
                   <p className="text-[10px] text-[#006747] font-black uppercase mt-1">Hospital Central de Luanda</p>
                </div>
                <div className="p-6 bg-[#272729] rounded border border-[#343536] print:bg-white print:border-gray-200">
                   <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Paciente / Diagnóstico</p>
                   <h2 className="text-xl font-black text-white truncate print:text-black">{prescription.patient_name}</h2>
                   <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">Diagnóstico: {prescription.diagnosis}</p>
                   <p className="text-[10px] text-gray-600 font-black uppercase mt-1">Emissão: {new Date(prescription.created_at).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>

              {/* Medication List (The Main "Table") */}
              <div className="bg-[#030303] rounded border border-[#343536] overflow-hidden mb-10 print:bg-white print:border-gray-200">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 border-b border-[#343536] last:border-0 group hover:bg-[#1A1A1B] transition-colors print:border-gray-200 print:p-4">
                    <div className="flex items-center space-x-6 flex-1">
                      <div className="w-8 h-8 bg-[#343536] rounded-full flex items-center justify-center text-[10px] font-black text-gray-400 print:bg-gray-100 print:text-gray-600">
                        {idx + 1}
                      </div>
                      <div className="w-3.5 h-3.5 rounded-full shadow-lg print:shadow-none" style={{ backgroundColor: (item as any).color || dotColors[idx % dotColors.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-black text-white tracking-tight print:text-black">{item.medication}</h4>
                          <span className="text-[10px] font-medium text-gray-500 uppercase">{item.form || 'Comprimido'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-12 ml-6 print:ml-4">
                      <div className="text-right min-w-[140px]">
                        <p className="text-sm font-black text-white/90 leading-tight print:text-black">
                          {item.frequency}/dia · {item.duration} dias
                        </p>
                        <p className="text-[10px] font-medium text-gray-500 mt-1">
                          {item.notes || (item as any).specialInstructions || "Sem observações"}
                        </p>
                      </div>
                      <div className="w-10 text-right">
                        <p className="text-sm font-black text-white print:text-black">
                          {(item as any).totalUnits || (parseInt(item.frequency) * parseInt(item.duration))}<span className="text-[10px] text-gray-500 ml-0.5 font-bold">x</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Therapeutic Map Implementation */}
              <div className="bg-[#030303] rounded border border-[#343536] p-6 mb-10 overflow-hidden print:bg-white print:border-gray-200 print:p-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest print:text-gray-900">Cronograma de Administração</h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-gray-600" />
                    <span className="text-[9px] text-gray-600 font-bold uppercase">{startTreatmentDate.toLocaleDateString('pt-PT')} – {new Date(new Date(startTreatmentDate).setDate(startTreatmentDate.getDate() + 13)).toLocaleDateString('pt-PT')}</span>
                  </div>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <div className="min-w-[700px] print:min-w-0 print:w-full">
                    <div className="grid grid-cols-[80px_repeat(14,1fr)] gap-1 mb-4 border-b border-[#343536] pb-3 print:grid-cols-[60px_repeat(14,1fr)] print:border-gray-200">
                      <div />
                      {Array.from({ length: 14 }).map((_, i) => {
                        const d = new Date(startTreatmentDate);
                        d.setDate(d.getDate() + i);
                        return (
                          <div key={i} className="text-center">
                            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter mb-1">{getDayName(d)}</p>
                            <p className="text-[10px] font-bold text-gray-400 print:text-black">{d.getDate()}</p>
                          </div>
                        );
                      })}
                    </div>

                    {[0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22].map(hour => (
                      <div key={hour} className="grid grid-cols-[80px_repeat(14,1fr)] gap-1 py-2 border-b border-white/[0.01] last:border-0 hover:bg-white/[0.02] transition-colors rounded group print:grid-cols-[60px_repeat(14,1fr)] print:border-gray-100">
                        <div className="text-[10px] font-bold text-gray-500 group-hover:text-gray-300 transition-colors self-center print:text-black">{hour.toString().padStart(2, '0')}:00</div>
                        {Array.from({ length: 14 }).map((_, dIdx) => (
                          <div key={dIdx} className="flex flex-wrap items-center justify-center gap-1 min-h-[24px]">
                            {items.map((item, mIdx) => {
                              const dur = parseDurationDays(item.duration);
                              const isActive = dIdx < dur && isPeriodActiveForHour(item.frequency, hour);
                              
                              if (isActive) {
                                const doseKey = `${mIdx}-${dIdx}-${hour}`;
                                const isTaken = takenDoses[doseKey];
                                
                                return (
                                  <div 
                                    key={mIdx}
                                    style={{ backgroundColor: (item as any).color || dotColors[mIdx % dotColors.length] }}
                                    className={`
                                      w-3 h-3 rounded-full flex items-center justify-center
                                      ${isTaken ? 'opacity-30' : 'opacity-100'}
                                    `}
                                  >
                                    {isTaken && <Check className="w-2 h-2 text-white stroke-[4]" />}
                                  </div>
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
                
                <div className="mt-6 flex items-center justify-center space-x-6 py-4 border-t border-[#343536] print:border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full ring-1 ring-white/20 bg-gray-500 print:ring-gray-200 print:bg-gray-300" />
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest print:text-black">Dose Pendente</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500 opacity-40 flex items-center justify-center print:bg-gray-100">
                      <Check className="w-1.5 h-1.5 text-white print:text-gray-400" />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest print:text-black">Dose Tomada</span>
                  </div>
                </div>
              </div>

              {/* Footer Section (Reddit bottom bar) */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-8 border-t border-[#343536] print:border-gray-200 print:gap-4 print:pt-4">
                 <div className="space-y-4 w-full md:w-auto">
                    <div className="bg-[#272729] border border-[#343536] rounded p-4 flex items-center space-x-4 print:bg-white print:border-gray-100 print:p-2">
                       <div className="w-10 h-10 bg-[#FF4500]/10 rounded flex items-center justify-center text-[#FF4500] print:bg-gray-50">
                          <ShieldCheck className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 print:text-black">CÓDIGO DE AUTENTICIDADE</p>
                          <div className="flex items-center space-x-2 group/copy">
                            <p className="text-sm font-mono font-black text-white tracking-[0.2em] print:text-black">{prescription.signature_code}</p>
                            <button 
                              onClick={() => copyToClipboard(prescription.signature_code)}
                              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-all print:hidden"
                              title="Copiar código"
                            >
                              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                       </div>
                    </div>
                    <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest text-center md:text-left print:text-black">Assinado digitalmente via Protocolo The Cedav • 2026</p>
                 </div>

                 <div className="text-center md:text-right">
                    <div className="mb-6 h-[80px] flex flex-col justify-end opacity-20 print:opacity-100 print:mb-2 print:h-auto">
                       <p className="font-serif italic text-3xl text-white mb-2 print:text-black print:text-2xl">{prescription.professional_name}</p>
                       <div className="h-[1px] w-[200px] bg-white mx-auto md:ml-auto md:mr-0 print:bg-black" />
                    </div>
                    <p className="text-sm font-black text-white uppercase tracking-[0.2em] print:text-black">Dr(a). {prescription.professional_name}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 print:text-black">Delegado de Saúde • Região de Luanda</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 print:hidden">
             <Link 
              to="/" 
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-[#343536] text-[#D7DADC] px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-[#444546] transition-all"
             >
               <ArrowLeft className="w-4 h-4" />
               <span>Início</span>
             </Link>
             
              <motion.button 
                whileTap={{ scale: 0.92, y: 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                onClick={downloadPDF}
                disabled={downloading}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 bg-emerald-600 text-white px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Baixar PDF</span>
              </motion.button>


          </div>
        </div>

        {/* Sidebar mimic */}
        <div className="space-y-4 hidden lg:block">
          <div className="bg-[#1A1A1B] border border-[#343536] rounded overflow-hidden">
            <div className="bg-[#FF4500] h-9" />
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-3 -mt-8">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-black shadow-lg">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="flex flex-col mt-6">
                  <span className="text-sm font-bold">r/TheCedav_Official</span>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Este post contém uma prescrição médica oficial validada. A integridade dos dados foi confirmada via blockchain interno The Cedav.
              </p>
              <div className="grid grid-cols-2 gap-4 py-4 border-t border-[#343536]">
                <div>
                  <p className="text-sm font-bold">Status</p>
                  <p className="text-[10px] text-emerald-500 font-bold">ATIVO</p>
                </div>
                <div>
                  <p className="text-sm font-bold">Created</p>
                  <p className="text-[10px] text-gray-500">{new Date(prescription.created_at).toLocaleDateString('pt-PT')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
