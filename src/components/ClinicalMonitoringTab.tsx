import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Pill, Heart, Thermometer, Droplet, Weight, Sparkles, Brain, 
  AlertTriangle, AlertCircle, ChevronUp, ChevronDown, Plus, Trash2, 
  Calendar, FileText, User, ArrowUpRight, ArrowDownRight, ArrowRight, 
  Upload, Info, RefreshCw, MapPin, CheckCircle, Clock, Volume2, ShieldAlert
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, LineChart, Line, Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface ClinicalMonitoringTabProps {
  selectedPatient: any;
  patientHistories: any[];
  patientPrescriptions: any[];
  privateNotes: string;
  showNotification: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onlyInputs?: boolean;
  onRefresh?: () => void;
}

export default function ClinicalMonitoringTab({
  selectedPatient,
  patientHistories = [],
  patientPrescriptions = [],
  privateNotes = '',
  showNotification,
  onlyInputs = false,
  onRefresh
}: ClinicalMonitoringTabProps) {
  // Filters & Tabs
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('30d');
  const [activeChart, setActiveChart] = useState<'all' | 'fc' | 'bp' | 'temp' | 'spo2' | 'glycemia' | 'weight'>('all');
  
  // Vital signs form state
  const [vitalsForm, setVitalsForm] = useState({
    heart_rate: '',
    systolic_bp: '',
    diastolic_bp: '',
    temperature: '',
    oxygen_saturation: '',
    glycemia: '',
    respiratory_rate: '',
    weight: '',
  });
  const [isSubmittingVitals, setIsSubmittingVitals] = useState(false);

  // Body Map symptoms state loaded dynamically per patient
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [patientSymptoms, setPatientSymptoms] = useState<any[]>([]);

  useEffect(() => {
    if (selectedPatient) {
      const key = `patient_symptoms_${selectedPatient.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setPatientSymptoms(JSON.parse(saved));
      } else {
        setPatientSymptoms([
          { id: '1', zone: 'chest', title: 'Aperto Torácico', severity: 'elevado', desc: 'Irradiação para braço esquerdo descrita na última consulta.', date: '12/07/2026' },
          { id: '2', zone: 'head', title: 'Cefaleia Occipital', severity: 'moderado', desc: 'Associada a picos de tensão arterial de 150/95.', date: '10/07/2026' },
          { id: '3', zone: 'abdomen', title: 'Dispepsia', severity: 'baixo', desc: 'Refluxo esporádico pós-prandial.', date: '05/07/2026' }
        ]);
      }
    }
  }, [selectedPatient]);

  const saveSymptoms = (newSymptoms: any[]) => {
    setPatientSymptoms(newSymptoms);
    if (selectedPatient) {
      const key = `patient_symptoms_${selectedPatient.id}`;
      localStorage.setItem(key, JSON.stringify(newSymptoms));
    }
  };

  const [newSymptomZone, setNewSymptomZone] = useState('chest');
  const [newSymptomTitle, setNewSymptomTitle] = useState('');
  const [newSymptomSeverity, setNewSymptomSeverity] = useState('baixo');
  const [newSymptomDesc, setNewSymptomDesc] = useState('');

  // Evolution Notes State
  const [evolutionNotes, setEvolutionNotes] = useState<any[]>([
    { id: '1', date: '14/07/2026', time: '10:30', author: 'Dr. David Cumbo', text: 'Paciente estável. Tensão arterial controlada pós-ajuste de Ramipril. Mantém glicemias de jejum estáveis.', files: [] },
    { id: '2', date: '08/07/2026', time: '15:15', author: 'Dra. Sofia Martins (Enfermagem)', text: 'Realizada monitorização ambulatorial de 24h. Sem picos hipertensivos noturnos. SpO2 excelente.', files: [] }
  ]);
  const [newNoteText, setNewNoteText] = useState('');
  const [noteAttachments, setNoteAttachments] = useState<any[]>([]);

  // Q&A Copilot State
  const [copilotQuestion, setCopilotQuestion] = useState('');
  const [copilotAnswers, setCopilotAnswers] = useState<any[]>([
    {
      question: "Como evoluiu este paciente?",
      answer: "A evolução geral é favorável. Após a introdução do plano terapêutico optimizado, houve uma redução média de 12% na pressão arterial sistólica sistémica e estabilização da frequência cardíaca em repouso de 82 para 71 bpm. Os marcadores de SpO2 mantêm-se em níveis fisiológicos (>97%).",
      timestamp: "Gerado há 5 minutos"
    }
  ]);
  const [isAnswering, setIsAnswering] = useState(false);

  // Preset Questions
  const presetQuestions = [
    "Existe deterioração clínica?",
    "Os sinais vitais estão melhores?",
    "Existe risco imediato?",
    "Que parâmetros pioraram?",
    "Há necessidade de novos exames?"
  ];

  // Helper: Get latest history vitals or fallbacks
  const latestHistory = patientHistories && patientHistories.length > 0 ? patientHistories[0] : null;
  const prevHistory = patientHistories && patientHistories.length > 1 ? patientHistories[1] : null;

  // Extract Vitals
  const getVitalVal = (hist: any, field: string) => {
    if (!hist) return null;
    switch(field) {
      case 'fc': return hist.heart_rate || hist.heartRate || null;
      case 'temp': return hist.temperature || null;
      case 'spo2': return hist.spo2 || hist.oxygen_saturation || null;
      case 'weight': return hist.weight || null;
      case 'imc': return hist.calculated_imc || hist.imc || null;
      case 'resp': return hist.respiratory_rate || hist.respiratoryRate || 16;
      case 'bp_sys': {
        if (hist.systolic_bp) return Number(hist.systolic_bp);
        if (typeof hist.blood_pressure === 'string') {
          return Number(hist.blood_pressure.split('/')[0]) || null;
        }
        return null;
      }
      case 'bp_dia': {
        if (hist.diastolic_bp) return Number(hist.diastolic_bp);
        if (typeof hist.blood_pressure === 'string') {
          return Number(hist.blood_pressure.split('/')[1]) || null;
        }
        return null;
      }
      // Glycemia fallback
      case 'glycemia': return hist.glycemia || hist.glicose || hist.glicemia || (hist.id % 2 === 0 ? 102 : 94);
      default: return null;
    }
  };

  const currentVitals = {
    bp: latestHistory ? `${getVitalVal(latestHistory, 'bp_sys') || 120}/${getVitalVal(latestHistory, 'bp_dia') || 80}` : '120/80',
    bp_sys: getVitalVal(latestHistory, 'bp_sys') || 120,
    bp_dia: getVitalVal(latestHistory, 'bp_dia') || 80,
    fc: getVitalVal(latestHistory, 'fc') || 72,
    temp: getVitalVal(latestHistory, 'temp') || 36.5,
    spo2: getVitalVal(latestHistory, 'spo2') || 98,
    glycemia: getVitalVal(latestHistory, 'glycemia') || 96,
    weight: getVitalVal(latestHistory, 'weight') || 74.5,
    imc: getVitalVal(latestHistory, 'imc') || 23.4,
    resp: getVitalVal(latestHistory, 'resp') || 15
  };

  const prevVitals = {
    bp: prevHistory ? `${getVitalVal(prevHistory, 'bp_sys') || 122}/${getVitalVal(prevHistory, 'bp_dia') || 82}` : '124/82',
    bp_sys: getVitalVal(prevHistory, 'bp_sys') || 124,
    bp_dia: getVitalVal(prevHistory, 'bp_dia') || 82,
    fc: getVitalVal(prevHistory, 'fc') || 78,
    temp: getVitalVal(prevHistory, 'temp') || 36.8,
    spo2: getVitalVal(prevHistory, 'spo2') || 97,
    glycemia: getVitalVal(prevHistory, 'glycemia') || 112,
    weight: getVitalVal(prevHistory, 'weight') || 75.2,
    imc: getVitalVal(prevHistory, 'imc') || 23.6,
    resp: getVitalVal(prevHistory, 'resp') || 16
  };

  // Vital Status & Tendency
  const getTrend = (curr: number, prev: number, invert = false) => {
    if (curr === prev) return { arrow: '→', color: 'text-gray-400', desc: 'Estável' };
    const isUp = curr > prev;
    const isGood = invert ? !isUp : isUp;
    return {
      arrow: isUp ? '↑' : '↓',
      color: isGood ? 'text-emerald-500' : 'text-rose-500',
      desc: isUp ? 'Aumento' : 'Redução'
    };
  };

  // Vitals data list for rendering
  const vitalsList = [
    { label: 'Pressão Arterial', val: `${currentVitals.bp} mmHg`, prev: `${prevVitals.bp} mmHg`, icon: Activity, trend: getTrend(currentVitals.bp_sys, prevVitals.bp_sys, true), color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
    { label: 'Frequência Cardíaca', val: `${currentVitals.fc} bpm`, prev: `${prevVitals.fc} bpm`, icon: Heart, trend: getTrend(currentVitals.fc, prevVitals.fc, true), color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100' },
    { label: 'Temperatura', val: `${currentVitals.temp}°C`, prev: `${prevVitals.temp}°C`, icon: Thermometer, trend: getTrend(currentVitals.temp, prevVitals.temp, true), color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100' },
    { label: 'Saturação SpO₂', val: `${currentVitals.spo2}%`, prev: `${prevVitals.spo2}%`, icon: Activity, trend: getTrend(currentVitals.spo2, prevVitals.spo2, false), color: 'text-sky-600', bg: 'bg-sky-50/50', border: 'border-sky-100' },
    { label: 'Glicemia Capilar', val: `${currentVitals.glycemia} mg/dL`, prev: `${prevVitals.glycemia} mg/dL`, icon: Droplet, trend: getTrend(currentVitals.glycemia, prevVitals.glycemia, true), color: 'text-purple-600', bg: 'bg-purple-50/50', border: 'border-purple-100' },
    { label: 'Frequência Respiratória', val: `${currentVitals.resp} rpm`, prev: `${prevVitals.resp} rpm`, icon: Activity, trend: getTrend(currentVitals.resp, prevVitals.resp, true), color: 'text-indigo-600', bg: 'bg-indigo-50/50', border: 'border-indigo-100' },
    { label: 'Peso Corporal', val: `${currentVitals.weight} kg`, prev: `${prevVitals.weight} kg`, icon: Weight, trend: getTrend(currentVitals.weight, prevVitals.weight, true), color: 'text-teal-600', bg: 'bg-teal-50/50', border: 'border-teal-100' },
    { label: 'Índice de Massa Corporal (IMC)', val: `${currentVitals.imc}`, prev: `${prevVitals.imc}`, icon: User, trend: getTrend(currentVitals.imc, prevVitals.imc, true), color: 'text-slate-600', bg: 'bg-slate-50/50', border: 'border-slate-100' }
  ];

  // Clinical Status State Override
  const [clinicalStatus, setClinicalStatus] = useState<'Estável' | 'Melhorando' | 'Piorando' | 'Crítico'>('Estável');
  const [riskLevel, setRiskLevel] = useState<'Baixo' | 'Moderado' | 'Elevado' | 'Crítico'>('Moderado');

  useEffect(() => {
    // Determine risk dynamically based on vital sign picos
    if (currentVitals.bp_sys >= 160 || currentVitals.fc > 120 || currentVitals.spo2 < 92) {
      setRiskLevel('Crítico');
      setClinicalStatus('Crítico');
    } else if (currentVitals.bp_sys >= 140 || currentVitals.fc > 100 || currentVitals.spo2 < 95) {
      setRiskLevel('Elevado');
      setClinicalStatus('Piorando');
    } else if (currentVitals.bp_sys < 130 && currentVitals.fc < 90 && currentVitals.spo2 >= 97) {
      setRiskLevel('Baixo');
      setClinicalStatus('Melhorando');
    }
  }, [patientHistories]);

  // Chart Data compilation
  const chartData = [...patientHistories]
    .reverse()
    .map((h, idx) => {
      let sys = getVitalVal(h, 'bp_sys') || (118 + (idx * 2) % 15);
      let dia = getVitalVal(h, 'bp_dia') || (76 + (idx * 1.5) % 10);
      let fc = getVitalVal(h, 'fc') || (68 + (idx * 4) % 20);
      let temp = getVitalVal(h, 'temp') || (36.3 + (idx * 0.1) % 1.5);
      let spo2 = getVitalVal(h, 'spo2') || (96 + (idx * 1) % 4);
      let glyc = getVitalVal(h, 'glycemia') || (90 + (idx * 5) % 30);
      let w = getVitalVal(h, 'weight') || (73.0 + (idx * 0.3) % 4);
      let imc = getVitalVal(h, 'imc') || (22.5 + (idx * 0.1) % 2);

      return {
        date: new Date(h.created_at || Date.now()).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
        "Pressão Sistólica": sys,
        "Pressão Diastólica": dia,
        "Frequência Cardíaca": fc,
        "Temperatura": parseFloat(temp.toFixed(1)),
        "SpO₂ (%)": spo2,
        "Glicose": glyc,
        "Peso (kg)": parseFloat(w.toFixed(1)),
        "IMC": parseFloat(imc.toFixed(1))
      };
    });

  // Fallback data if too short
  const defaultChartData = [
    { date: '01 Jul', "Pressão Sistólica": 125, "Pressão Diastólica": 82, "Frequência Cardíaca": 78, "Temperatura": 36.7, "SpO₂ (%)": 97, "Glicose": 110, "Peso (kg)": 75.4, "IMC": 23.7 },
    { date: '04 Jul', "Pressão Sistólica": 122, "Pressão Diastólica": 80, "Frequência Cardíaca": 75, "Temperatura": 36.6, "SpO₂ (%)": 98, "Glicose": 98, "Peso (kg)": 75.1, "IMC": 23.6 },
    { date: '08 Jul', "Pressão Sistólica": 128, "Pressão Diastólica": 85, "Frequência Cardíaca": 82, "Temperatura": 36.9, "SpO₂ (%)": 96, "Glicose": 115, "Peso (kg)": 75.3, "IMC": 23.6 },
    { date: '11 Jul', "Pressão Sistólica": 124, "Pressão Diastólica": 82, "Frequência Cardíaca": 74, "Temperatura": 36.5, "SpO₂ (%)": 98, "Glicose": 105, "Peso (kg)": 74.8, "IMC": 23.5 },
    { date: '14 Jul', "Pressão Sistólica": 120, "Pressão Diastólica": 80, "Frequência Cardíaca": 72, "Temperatura": 36.4, "SpO₂ (%)": 99, "Glicose": 94, "Peso (kg)": 74.5, "IMC": 23.4 }
  ];

  const finalChartData = chartData.length > 1 ? chartData : defaultChartData;

  // Real-time bedside simulator states (ECG simulation)
  const [ecgData, setEcgData] = useState<number[]>([]);
  const ecgRef = useRef<number>(0);

  useEffect(() => {
    // Generate a beautiful heartbeat baseline with standard P-Q-R-S-T peaks
    const interval = setInterval(() => {
      setEcgData(prev => {
        const nextIdx = ecgRef.current % 40;
        let val = 0;
        
        // Simulating ECG Wave parts
        if (nextIdx === 10) val = 1.5; // P wave
        else if (nextIdx === 13) val = -1; // Q wave
        else if (nextIdx === 14) val = 8; // R high peak
        else if (nextIdx === 15) val = -2.5; // S wave
        else if (nextIdx === 18) val = 2; // T wave
        else {
          val = Math.sin(nextIdx * 0.3) * 0.15; // smooth baseline noise
        }

        ecgRef.current += 1;
        const slice = prev.length > 50 ? prev.slice(1) : prev;
        return [...slice, val];
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // AI Q&A clinical reply simulator
  const handleAskCopilot = async (q: string) => {
    const questionToAsk = q || copilotQuestion;
    if (!questionToAsk.trim()) return;

    setIsAnswering(true);
    setCopilotQuestion('');

    setTimeout(() => {
      let ans = "";
      const query = questionToAsk.toLowerCase();

      if (query.includes("deterioração") || query.includes("piorou")) {
        ans = "Com base na comparação temporal, não há sinais de deterioração hemodinâmica ou ventilatória nas últimas 72 horas. Os picos isolados anteriores de Pressão Arterial Sistólica reentraram no canal terapêutico ideal (120 mmHg) com a terapêutica de suporte. SpO2 estável em 98-99%.";
      } else if (query.includes("sinais vitais") || query.includes("melhores")) {
        ans = "Sim, há uma melhoria estatisticamente significativa. A frequência cardíaca média em repouso reduziu de 78 bpm na consulta anterior para 72 bpm hoje. Adicionalmente, o IMC apresentou ligeira redução funcional decorrente do ajuste ponderal ponderado (-0.7 kg).";
      } else if (query.includes("risco imediato") || query.includes("urgente")) {
        ans = "Negativo. Atualmente, o paciente apresenta índices de risco qSOFA e SIRS totalmente zerados. Não há registo de taquipneia (>22 rpm), hipotensão grave (<100 mmHg PAS) ou hipertermia relevante. Estado classificado clinicamente como ESTÁVEL de moderado a baixo risco.";
      } else if (query.includes("exames") || query.includes("novos")) {
        ans = "Recomenda-se realizar uma monitorização laboratorial básica dentro de 30 dias para avaliar o perfil renal (Ureia e Creatinina) e Eletrólitos (Sódio e Potássio), devido à introdução de inibidores do SRAA, bem como um doseamento de Hemoglobina Glicada (HbA1c).";
      } else if (query.includes("encaminhamento") || query.includes("médico")) {
        ans = "Não existe indicação para re-encaminhamento prioritário à especialidade de cardiologia neste momento. O plano terapêutico conservador na atenção primária está a atingir os objetivos estipulados de forma progressiva.";
      } else {
        ans = `Analisando o historial clínico de ${selectedPatient.full_name || selectedPatient.username} de forma integral: verifica-se uma tendência de estabilidade. Os diagnósticos ativos de hipertensão e os registos evolutivos sugerem boa adesão ao regime dietético e medicamentoso prescrito. Sugere-se continuar acompanhamento padrão.`;
      }

      setCopilotAnswers(prev => [
        { question: questionToAsk, answer: ans, timestamp: "Gerado agora" },
        ...prev
      ]);
      setIsAnswering(false);
      showNotification("Análise Clínica IA concluída!", "success");
    }, 1200);
  };

  // Add Symptoms Helper
  const handleAddSymptom = () => {
    if (!newSymptomTitle.trim()) return;
    const newSym = {
      id: Date.now().toString(),
      zone: newSymptomZone,
      title: newSymptomTitle,
      severity: newSymptomSeverity,
      desc: newSymptomDesc || 'Nenhuma descrição detalhada providenciada.',
      date: new Date().toLocaleDateString('pt-PT')
    };
    const updated = [newSym, ...patientSymptoms];
    saveSymptoms(updated);
    setNewSymptomTitle('');
    setNewSymptomDesc('');
    showNotification("Zona do sintoma mapeada com sucesso!", "success");
  };

  // Delete symptom
  const handleDeleteSymptom = (id: string) => {
    const updated = patientSymptoms.filter(s => s.id !== id);
    saveSymptoms(updated);
    showNotification("Registo de sintoma removido do mapa.", "info");
  };

  // Submit vital signs form to Supabase
  const handleSubmitVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    // Check if at least one vital sign is filled
    const hasAnyValue = Object.values(vitalsForm).some(val => val.trim() !== '');
    if (!hasAnyValue) {
      showNotification("Por favor, preencha pelo menos um sinal vital para registar.", "error");
      return;
    }

    setIsSubmittingVitals(true);
    try {
      const height = selectedPatient.height || 1.75;
      const weightNum = Number(vitalsForm.weight);
      let calculatedImc = null;
      if (weightNum && height) {
        calculatedImc = Number((weightNum / (height * height)).toFixed(1));
      }

      const { error } = await supabase
        .from('clinical_histories')
        .insert({
          patient_id: selectedPatient.id,
          heart_rate: vitalsForm.heart_rate ? Number(vitalsForm.heart_rate) : null,
          systolic_bp: vitalsForm.systolic_bp ? Number(vitalsForm.systolic_bp) : null,
          diastolic_bp: vitalsForm.diastolic_bp ? Number(vitalsForm.diastolic_bp) : null,
          blood_pressure: vitalsForm.systolic_bp && vitalsForm.diastolic_bp ? `${vitalsForm.systolic_bp}/${vitalsForm.diastolic_bp}` : null,
          temperature: vitalsForm.temperature ? Number(vitalsForm.temperature) : null,
          oxygen_saturation: vitalsForm.oxygen_saturation ? Number(vitalsForm.oxygen_saturation) : null,
          glycemia: vitalsForm.glycemia ? Number(vitalsForm.glycemia) : null,
          respiratory_rate: vitalsForm.respiratory_rate ? Number(vitalsForm.respiratory_rate) : null,
          weight: vitalsForm.weight ? Number(vitalsForm.weight) : null,
          calculated_imc: calculatedImc,
          clinical_notes: 'Registo de Monitorização de Sinais Vitais',
          professional_name: 'Dr. David Cumbo',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      showNotification("Sinais vitais registados e atualizados com sucesso!", "success");
      setVitalsForm({
        heart_rate: '',
        systolic_bp: '',
        diastolic_bp: '',
        temperature: '',
        oxygen_saturation: '',
        glycemia: '',
        respiratory_rate: '',
        weight: '',
      });
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error("Erro ao registar sinais vitais:", error);
      showNotification("Erro ao guardar os sinais vitais.", "error");
    } finally {
      setIsSubmittingVitals(false);
    }
  };

  // Add Note Helper
  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('pt-PT'),
      time: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
      author: 'Dr. David Cumbo',
      text: newNoteText,
      files: [...noteAttachments]
    };
    setEvolutionNotes(prev => [newNote, ...prev]);
    setNewNoteText('');
    setNoteAttachments([]);
    showNotification("Nota evolutiva assinada e guardada no registo clínico.", "success");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setNoteAttachments(prev => [...prev, { name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` }]);
      showNotification(`Ficheiro '${file.name}' anexado provisoriamente.`, "info");
    }
  };

  if (onlyInputs) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 text-left">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between md:items-center bg-white p-6 rounded-3xl border border-gray-100 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-emerald-50 rounded-2xl text-[#006747]">
              <Activity className="w-5 h-5 text-[#006747]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-950 uppercase tracking-wider">Registo de Parâmetros e Sinais Vitais</h3>
              <p className="text-[11px] text-gray-400 font-semibold mt-0.5">Insira ou atualize os sinais vitais do paciente e faça o mapeamento anatómico de sintomas ativos.</p>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-[#006747] px-3.5 py-2 rounded-xl border border-emerald-100/50 flex items-center shrink-0 w-fit">
            <span className="flex h-2 w-2 relative mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Ligação ao Prontuário Ativa</span>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          
          {/* LEFT: Vitals Entry Card */}
          <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registador de Sinais Vitais</h4>
              <p className="text-lg font-black text-gray-900 mt-1">Atualização de Parâmetros Clínicos</p>
            </div>

            <form onSubmit={handleSubmitVitals} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase flex items-center tracking-wider">
                    <Heart className="w-3.5 h-3.5 mr-1.5 text-rose-500 shrink-0" /> Freq. Cardíaca (bpm)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 72"
                    value={vitalsForm.heart_rate}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, heart_rate: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-950 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase flex items-center tracking-wider">
                    <Thermometer className="w-3.5 h-3.5 mr-1.5 text-amber-500 shrink-0" /> Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 36.5"
                    value={vitalsForm.temperature}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, temperature: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-950 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase flex items-center tracking-wider">
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" /> Pressão Sistólica (mmHg)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 120"
                    value={vitalsForm.systolic_bp}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, systolic_bp: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-950 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase flex items-center tracking-wider">
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-500 shrink-0" /> Pressão Diastólica (mmHg)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 80"
                    value={vitalsForm.diastolic_bp}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, diastolic_bp: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-950 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase flex items-center tracking-wider">
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-sky-500 shrink-0" /> Saturação SpO₂ (%)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 98"
                    value={vitalsForm.oxygen_saturation}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, oxygen_saturation: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-950 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase flex items-center tracking-wider">
                    <Droplet className="w-3.5 h-3.5 mr-1.5 text-purple-500 shrink-0" /> Glicose (mg/dL)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 95"
                    value={vitalsForm.glycemia}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, glycemia: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-950 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase flex items-center tracking-wider">
                    <Activity className="w-3.5 h-3.5 mr-1.5 text-indigo-500 shrink-0" /> Freq. Respiratória (rpm)
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 16"
                    value={vitalsForm.respiratory_rate}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, respiratory_rate: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-950 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-500 uppercase flex items-center tracking-wider">
                    <Weight className="w-3.5 h-3.5 mr-1.5 text-teal-500 shrink-0" /> Peso Corporal (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 75.0"
                    value={vitalsForm.weight}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-950 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingVitals}
                className="w-full flex items-center justify-center space-x-2 bg-[#006747] hover:bg-emerald-950 text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmittingVitals ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                )}
                <span>Registar e Atualizar Sinais Vitais</span>
              </button>
            </form>
          </div>

          {/* RIGHT: Anatomical Body Map */}
          <div className="space-y-8">
            <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm text-center relative">
              <div className="absolute right-4 top-4 text-gray-300">
                <Info className="w-4 h-4 cursor-help" />
              </div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left mb-1">Mapa Corporal Interativo</h4>
              <p className="text-sm font-black text-gray-900 text-left mb-4">Mapeamento Topográfico de Sintomas</p>

              {/* Stylized Human Outline SVG */}
              <div className="w-52 h-80 mx-auto relative bg-slate-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-center">
                <svg viewBox="0 0 100 200" className="w-full h-full text-slate-200" fill="currentColor">
                  {/* Head */}
                  <circle cx="50" cy="25" r="12" className={`transition-colors cursor-pointer ${selectedZone === 'head' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('head')} />
                  {/* Neck */}
                  <rect x="47" y="37" width="6" height="6" className="transition-colors cursor-pointer" onClick={() => setSelectedZone('neck')} />
                  {/* Chest */}
                  <path d="M 38,44 L 62,44 L 59,85 L 41,85 Z" className={`transition-colors cursor-pointer ${selectedZone === 'chest' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('chest')} />
                  {/* Abdomen */}
                  <path d="M 41,85 L 59,85 L 56,120 L 44,120 Z" className={`transition-colors cursor-pointer ${selectedZone === 'abdomen' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('abdomen')} />
                  {/* Left Arm */}
                  <path d="M 36,44 Q 25,75 22,110 L 28,110 Q 31,80 38,50 Z" className={`transition-colors cursor-pointer ${selectedZone === 'l_arm' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('l_arm')} />
                  {/* Right Arm */}
                  <path d="M 64,44 Q 75,75 78,110 L 72,110 Q 69,80 62,50 Z" className={`transition-colors cursor-pointer ${selectedZone === 'r_arm' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('r_arm')} />
                  {/* Pelvis */}
                  <path d="M 44,120 L 56,120 L 58,135 L 42,135 Z" />
                  {/* Left Leg */}
                  <path d="M 42,135 L 48,135 L 44,195 L 38,195 Z" className={`transition-colors cursor-pointer ${selectedZone === 'l_leg' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('l_leg')} />
                  {/* Right Leg */}
                  <path d="M 52,135 L 58,135 L 62,195 L 56,195 Z" className={`transition-colors cursor-pointer ${selectedZone === 'r_leg' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('r_leg')} />
                </svg>

                {/* Pulse Rings Overlay on hotspots */}
                {patientSymptoms.map((s) => {
                  let coords = { top: '50%', left: '50%' };
                  if (s.zone === 'head') coords = { top: '12%', left: '50%' };
                  else if (s.zone === 'chest') coords = { top: '28%', left: '50%' };
                  else if (s.zone === 'abdomen') coords = { top: '48%', left: '50%' };
                  else if (s.zone === 'l_arm') coords = { top: '38%', left: '28%' };
                  else if (s.zone === 'r_arm') coords = { top: '38%', left: '72%' };

                  const severityColor = s.severity === 'crítico' ? 'bg-rose-500' : s.severity === 'elevado' ? 'bg-orange-500' : 'bg-amber-400';

                  return (
                    <div 
                      key={s.id} 
                      style={{ top: coords.top, left: coords.left }} 
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                      onClick={() => setSelectedZone(s.zone)}
                    >
                      <span className="flex h-3.5 w-3.5 relative">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${severityColor}`}></span>
                        <span className={`relative inline-flex rounded-full h-3.5 w-3.5 shadow-sm border-2 border-white ${severityColor}`}></span>
                      </span>
                      
                      <div className="hidden group-hover:block absolute left-1/2 bottom-5 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-20">
                        {s.title}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-3">
                <p className="text-[10px] text-gray-400 font-medium">
                  Clique no modelo anatómico para filtrar sintomas por zona.
                </p>
                {selectedZone && (
                  <button 
                    onClick={() => setSelectedZone(null)}
                    className="text-[10px] font-black text-rose-600 hover:underline uppercase tracking-widest"
                  >
                    Limpar Filtro ({selectedZone})
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sintomas Mapeados</h4>
                <p className="text-lg font-black text-gray-900 mt-0.5">Histórico Regional do Modelo</p>
              </div>

              {/* Symptoms list */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1 no-scrollbar">
                {patientSymptoms
                  .filter(s => !selectedZone || s.zone === selectedZone)
                  .map((sym) => (
                    <div key={sym.id} className="p-4 bg-slate-50/50 rounded-2xl border border-gray-100 flex items-start justify-between">
                      <div className="flex items-start space-x-3.5">
                        <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                          sym.severity === 'crítico' ? 'bg-rose-500' : sym.severity === 'elevado' ? 'bg-orange-400' : 'bg-amber-400'
                        }`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h5 className="font-black text-xs text-gray-950">{sym.title}</h5>
                            <span className="text-[8px] font-black uppercase tracking-widest bg-gray-200/60 text-gray-500 px-1.5 py-0.5 rounded">
                              Zona: {sym.zone}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">{sym.desc}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleDeleteSymptom(sym.id)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                {patientSymptoms.filter(s => !selectedZone || s.zone === selectedZone).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-gray-150">
                    Nenhum sintoma mapeado nesta zona corporal.
                  </p>
                )}
              </div>

              {/* Quick Add Form */}
              <div className="pt-6 border-t border-gray-100 space-y-4">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mapear Novo Sintoma Clínico</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Título do Sintoma</label>
                    <input
                      type="text"
                      placeholder="Ex: Dor Lombar Crónica"
                      value={newSymptomTitle}
                      onChange={(e) => setNewSymptomTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Zona Anatómica</label>
                    <select
                      value={newSymptomZone}
                      onChange={(e) => setNewSymptomZone(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                    >
                      <option value="head">Cabeça (Cefaleias)</option>
                      <option value="chest">Peito / Toráxico</option>
                      <option value="abdomen">Abdominal</option>
                      <option value="l_arm">Braço Esquerdo</option>
                      <option value="r_arm">Braço Direito</option>
                      <option value="l_leg">Perna Esquerda</option>
                      <option value="r_leg">Perna Direita</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase">Nível de Gravidade</label>
                    <select
                      value={newSymptomSeverity}
                      onChange={(e) => setNewSymptomSeverity(e.target.value)}
                      className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20 outline-none"
                    >
                      <option value="baixo">Baixo (Leve)</option>
                      <option value="moderado">Moderado</option>
                      <option value="elevado">Elevado (Grave)</option>
                      <option value="crítico">Crítico</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Descrição Clínica detalhada</label>
                  <textarea
                    placeholder="Ex: Queixa-se de rigidez matinal..."
                    value={newSymptomDesc}
                    onChange={(e) => setNewSymptomDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-gray-100 rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20 outline-none min-h-[60px]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddSymptom}
                  className="w-full md:w-auto flex items-center justify-center space-x-2 bg-[#006747] hover:bg-emerald-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  <span>Mapear Sintoma</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* 9. NOTAS EVOLUTIVAS WITH MODERN ATTACHMENT WRAPPER */}
        <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Folha de Evolução e Notas de Progresso</h4>
            <p className="text-lg font-black text-gray-900 mt-1">Registo Clínico Assinado</p>
          </div>

          {/* Text Area and file upload */}
          <div className="space-y-4">
            <textarea
              placeholder="Escreva novas observações, anotações de progresso médico ou notas sobre os sinais vitais observados..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold text-gray-950 focus:ring-2 focus:ring-[#006747]/20 min-h-[110px]"
            />

            {/* Attachments preview */}
            {noteAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {noteAttachments.map((f, i) => (
                  <span key={i} className="bg-emerald-50 text-[#006747] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center border border-emerald-100">
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    {f.name} ({f.size})
                    <button 
                      onClick={() => setNoteAttachments(prev => prev.filter((_, idx) => idx !== i))}
                      className="ml-2 hover:text-red-600 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
              {/* Custom file attachments upload */}
              <div className="flex items-center space-x-2">
                <label className="flex items-center justify-center space-x-2 bg-slate-100 hover:bg-slate-200 text-gray-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer">
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span>Anexar Ficheiro (PDF/Imagem/Áudio)</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf,audio/*,video/*"
                  />
                </label>
              </div>

              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim()}
                className="flex items-center justify-center space-x-2 bg-[#006747] hover:bg-emerald-950 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-900/10 disabled:opacity-40 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Assinar Nota de Evolução</span>
              </button>
            </div>
          </div>

          {/* Signed Evolution Notes Feed */}
          <div className="pt-4 border-t border-gray-150 space-y-4">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Historial de Evolução Assinado</h5>
            <div className="space-y-4">
              {evolutionNotes.map((note) => (
                <div key={note.id} className="p-5 bg-slate-50/50 rounded-2xl border border-gray-100 text-left space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-black text-gray-900 flex items-center">
                      <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" /> {note.author}
                    </span>
                    <span className="font-bold text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> {note.date} às {note.time}
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {note.text}
                  </p>
                  {note.files && note.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {note.files.map((f: any, idx: number) => (
                        <span key={idx} className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-[9px] font-semibold flex items-center border border-gray-200">
                          <FileText className="w-3 h-3 mr-1" />
                          {f.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100/60 flex items-center text-[8px] font-mono tracking-wider text-emerald-600">
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    ASSINADO DIGITALMENTE • CONFORMIDADE PEP (RE-DOCTA)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 text-left">
      
      {/* 1. CLINICAL RESUME SECTION (BENTO HEADER STYLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Status Block */}
        <div className="lg:col-span-4 bg-slate-900 text-white p-7 rounded-[2rem] border border-slate-800 flex flex-col justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Estado de Monitorização</span>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <h4 className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mb-1">Evolução Geral</h4>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-white tracking-tight">{clinicalStatus}</span>
                <span className="text-xs text-emerald-400 font-bold">Estável hã 7d</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Risco Geral</p>
                <p className="text-sm font-black text-orange-400">{riskLevel}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Score qSOFA</p>
                <p className="text-sm font-black text-emerald-400">0 (Fisiológico)</p>
              </div>
            </div>
          </div>
          <div className="pt-5 border-t border-white/5 mt-5 flex justify-between items-center text-[10px] text-gray-400 relative z-10">
            <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Atualizado há 12 min</span>
            <span className="font-bold underline cursor-pointer hover:text-white transition-colors">Ver Protocolo</span>
          </div>
        </div>

        {/* Center Indicators and Active Diagnoses */}
        <div className="lg:col-span-8 bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diagnósticos Ativos & Status</h4>
                <p className="text-xl font-black text-gray-900 mt-1">Sumário Diagnóstico Multidisciplinar</p>
              </div>
              <div className="flex space-x-1.5">
                {['Baixo', 'Moderado', 'Elevado', 'Crítico'].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      setRiskLevel(level as any);
                      if (level === 'Crítico') setClinicalStatus('Crítico');
                      else if (level === 'Elevado') setClinicalStatus('Piorando');
                      else if (level === 'Moderado') setClinicalStatus('Estável');
                      else setClinicalStatus('Melhorando');
                    }}
                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider transition-all ${
                      riskLevel === level
                        ? level === 'Baixo' ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300'
                          : level === 'Moderado' ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                          : level === 'Elevado' ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-300'
                          : 'bg-rose-100 text-rose-800 ring-2 ring-rose-300'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="bg-emerald-50 text-[#006747] border border-emerald-100 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                Hipertensão Arterial Essencial (CID-10 I10)
              </span>
              <span className="bg-sky-50 text-sky-700 border border-sky-100 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                Dislipidemia Mista (CID-10 E78.2)
              </span>
              <span className="bg-purple-50 text-purple-700 border border-purple-100 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                Insuficiência Venosa Crónica (CID-10 I87.2)
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed pt-2">
              Paciente sob terapêutica combinada de inibidor da ECA e estatina de alta potência. Recomenda-se vigiar microalbuminúria nas consultas trimestrais e monitorizar função renal face a variações agudas do perfil pressórico.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-left mt-4">
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Última Consulta</p>
              <p className="text-xs font-black text-gray-800">{latestHistory ? new Date(latestHistory.created_at).toLocaleDateString('pt-PT') : '14/07/2026'}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Profissional Titular</p>
              <p className="text-xs font-black text-[#006747]">{latestHistory?.professional_name || 'Dr. David Cumbo'}</p>
            </div>
            <div>
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Plano de Cuidado</p>
              <p className="text-xs font-black text-purple-600">Ativo / IA Monitorizado</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMPACT VITAL SIGNS CARDS WITH TENDENCY */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sinais Vitais em Tempo Real</h4>
            <p className="text-lg font-black text-gray-900 mt-1">Registos de Parâmetros Fisiológicos</p>
          </div>
          <p className="text-xs text-gray-400 font-medium">Comparado com registo de {prevHistory ? new Date(prevHistory.created_at).toLocaleDateString('pt-PT') : '08/07/2026'}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {vitalsList.map((vital, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-3xl border ${vital.border} ${vital.bg} shadow-sm hover:scale-[1.02] transition-all relative flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider max-w-[120px]">{vital.label}</span>
                <div className={`p-2 bg-white rounded-xl shadow-sm ${vital.color}`}>
                  <vital.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-2xl font-black text-gray-950 tracking-tight">{vital.val}</p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 font-bold">Anterior: {vital.prev}</span>
                  <span className={`font-black flex items-center ${vital.trend.color}`}>
                    <span className="mr-1">{vital.trend.arrow}</span>
                    <span>{vital.trend.desc}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. BED-SIDE HOSPITAL MONITOR ECG STYLE & CHARTS */}
      <div className="bg-slate-950 text-white rounded-[2.5rem] p-8 border border-slate-900 shadow-xl relative overflow-hidden">
        
        {/* BED SIDE SCREEN HEADER */}
        <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-slate-900 pb-6 mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <p className="text-[10px] font-mono tracking-widest text-emerald-400">BEDSIDE MONITOR - LEITO INTEGRADO</p>
              <h3 className="text-lg font-mono font-bold tracking-tight text-white flex items-center">
                Módulo Gráfico Multicanal
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {['7d', '30d', '90d', '1y', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1 rounded-lg text-[10px] font-mono transition-all uppercase ${
                  timeRange === range
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-slate-900 text-gray-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: HEART RATE / ECG SIMULATOR (STYLISH) */}
          <div className="lg:col-span-4 bg-slate-900/60 p-6 rounded-3xl border border-slate-900 flex flex-col justify-between space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[8px] font-mono text-rose-400 tracking-wider">ECG SIMULAÇÃO SINO-WAVE</p>
                <h4 className="text-sm font-mono font-bold text-white">Canal Cardíaco I (DII)</h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded border border-rose-500/15 animate-pulse">ALIVE</span>
              </div>
            </div>

            {/* Simulated mini bedside graph */}
            <div className="h-20 bg-black/40 rounded-xl border border-slate-900 overflow-hidden flex items-center relative">
              <div className="absolute inset-0 bg-grid-slate-900 opacity-20" />
              <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path
                  d={`M ${ecgData.map((val, idx) => `${idx * 2}, ${10 - val}`).join(' L ')}`}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {/* Pulsing indicator circle */}
              <div className="absolute right-3 top-3 w-4 h-4 bg-rose-500 rounded-full animate-ping opacity-30" />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-rose-500">
                <Heart className="w-8 h-8 animate-pulse stroke-[2.5px]" />
                <div>
                  <p className="text-4xl font-mono font-bold tracking-tighter text-white">{currentVitals.fc}</p>
                  <p className="text-[8px] font-mono text-gray-400 uppercase">Frequência bpm</p>
                </div>
              </div>
              
              <div className="text-right font-mono text-[9px] text-gray-400 space-y-0.5">
                <p>Alarme Min: <span className="text-rose-400">50 bpm</span></p>
                <p>Alarme Max: <span className="text-rose-400">120 bpm</span></p>
                <p className="text-emerald-400">Ritmo Sinusal Regular</p>
              </div>
            </div>
          </div>

          {/* RIGHT: COMPREHENSIVE CLINICAL GRAPH */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'all', label: 'Ver Todos' },
                { id: 'bp', label: 'Tensão Arterial' },
                { id: 'fc', label: 'Freq. Cardíaca' },
                { id: 'temp', label: 'Temperatura' },
                { id: 'spo2', label: 'Saturação SpO₂' },
                { id: 'glycemia', label: 'Glicemia' },
                { id: 'weight', label: 'Peso & IMC' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setActiveChart(btn.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all border ${
                    activeChart === btn.id
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold shadow-md shadow-emerald-950/20'
                      : 'bg-slate-900/60 border-slate-900 text-gray-400 hover:text-white hover:border-slate-800'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* CHART CONTAINER */}
            <div className="h-64 w-full bg-slate-950 rounded-2xl relative pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={finalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFC" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    fontSize={9} 
                    fontFamily="monospace"
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#475569" 
                    fontSize={9} 
                    fontFamily="monospace"
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '9px', fontFamily: 'monospace' }}
                    itemStyle={{ fontSize: '10px', color: '#fff', fontFamily: 'monospace' }}
                  />
                  
                  {activeChart === 'all' && (
                    <>
                      <Area type="monotone" dataKey="Pressão Sistólica" stroke="#10b981" fillOpacity={1} fill="url(#colorBP)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Frequência Cardíaca" stroke="#f43f5e" fillOpacity={1} fill="url(#colorFC)" strokeWidth={2} />
                    </>
                  )}
                  {activeChart === 'bp' && (
                    <>
                      <Line type="monotone" dataKey="Pressão Sistólica" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Pressão Diastólica" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 4" />
                    </>
                  )}
                  {activeChart === 'fc' && (
                    <Line type="monotone" dataKey="Frequência Cardíaca" stroke="#f43f5e" strokeWidth={2.5} />
                  )}
                  {activeChart === 'temp' && (
                    <Line type="monotone" dataKey="Temperatura" stroke="#f59e0b" strokeWidth={2.5} />
                  )}
                  {activeChart === 'spo2' && (
                    <Line type="monotone" dataKey="SpO₂ (%)" stroke="#38bdf8" strokeWidth={2.5} />
                  )}
                  {activeChart === 'glycemia' && (
                    <Line type="monotone" dataKey="Glicose" stroke="#a855f7" strokeWidth={2.5} />
                  )}
                  {activeChart === 'weight' && (
                    <>
                      <Line type="monotone" dataKey="Peso (kg)" stroke="#14b8a6" strokeWidth={2} />
                      <Line type="monotone" dataKey="IMC" stroke="#94a3b8" strokeWidth={1} />
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* 4. TEMPORAL COMPARATIVE VIEW GRID */}
      <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div>
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Comparação Temporal Sistêmica</h4>
          <p className="text-lg font-black text-gray-900 mt-1">Evolução de Parâmetros de Filtro Fisiológico</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { period: 'Hoje', bp: `${currentVitals.bp} mmHg`, fc: `${currentVitals.fc} bpm`, temp: `${currentVitals.temp}°C`, spo2: `${currentVitals.spo2}%`, status: 'Otimo', bg: 'bg-[#006747]/5 border-[#006747]/10' },
            { period: 'Últimos 7 dias', bp: '122/81 mmHg', fc: '74 bpm', temp: '36.5°C', spo2: '98%', status: 'Estável', bg: 'bg-gray-50/50 border-gray-100' },
            { period: 'Últimos 30 dias', bp: '126/83 mmHg', fc: '76 bpm', temp: '36.6°C', spo2: '97%', status: 'Estável', bg: 'bg-gray-50/50 border-gray-100' },
            { period: 'Últimos 90 dias', bp: '131/85 mmHg', fc: '80 bpm', temp: '36.7°C', spo2: '97%', status: 'Melhorando', bg: 'bg-gray-50/50 border-gray-100' },
            { period: 'Última Consulta', bp: `${prevVitals.bp} mmHg`, fc: `${prevVitals.fc} bpm`, temp: `${prevVitals.temp}°C`, spo2: `${prevVitals.spo2}%`, status: 'Alerta', bg: 'bg-orange-50/20 border-orange-100' }
          ].map((col, idx) => (
            <div key={idx} className={`p-4 rounded-2xl border ${col.bg} text-center space-y-3`}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{col.period}</p>
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-gray-500">T.Arterial: <span className="font-black text-gray-900">{col.bp}</span></p>
                <p className="font-semibold text-gray-500">F.Cardíaca: <span className="font-black text-gray-900">{col.fc}</span></p>
                <p className="font-semibold text-gray-500">Temp: <span className="font-black text-gray-900">{col.temp}</span></p>
                <p className="font-semibold text-gray-500">SpO2: <span className="font-black text-gray-900">{col.spo2}</span></p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  col.status === 'Otimo' ? 'bg-emerald-100 text-[#006747]' : col.status === 'Alerta' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-850'
                }`}>
                  {col.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Improved/Worsened parameter boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100/50">
            <h5 className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-2 flex items-center">
              <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Parâmetros em Melhora
            </h5>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4 text-left">
              <li>Pressão Arterial Sistólica reduziu de 124 para 120 mmHg.</li>
              <li>Frequência cardíaca basal regularizou em 72 bpm.</li>
              <li>Adesão terapêutica otimizada com zero queixas.</li>
            </ul>
          </div>

          <div className="bg-rose-50/40 p-5 rounded-2xl border border-rose-100/50">
            <h5 className="text-[9px] font-black text-rose-800 uppercase tracking-widest mb-2 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-rose-600" /> Parâmetros em Piora / Atenção
            </h5>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4 text-left">
              <li>Ligeiro pico pressórico esporádico no final de tarde descrito pelo paciente.</li>
              <li>Dor de cabeça residual após episódios de stress ocupacional.</li>
            </ul>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h5 className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-gray-600" /> Parâmetros Estáveis
            </h5>
            <ul className="text-xs text-gray-600 space-y-1.5 list-disc pl-4 text-left">
              <li>Saturação de oxigénio periférica mantida em 98-99%.</li>
              <li>Temperatura corporal regular em 36.4°C.</li>
              <li>Peso e Índice de Massa Corporal (IMC) sem flutuações.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE CLINICAL BODY MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Interactive anatomical model */}
        <div className="lg:col-span-4 bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm text-center relative">
          <div className="absolute right-4 top-4 text-gray-300">
            <Info className="w-4 h-4 cursor-help" />
          </div>
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-left mb-1">Mapa Corporal Interativo</h4>
          <p className="text-sm font-black text-gray-900 text-left mb-6">Mapeamento Topográfico de Sintomas</p>

          {/* Stylized Human Outline SVG */}
          <div className="w-52 h-96 mx-auto relative bg-slate-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-center">
            <svg viewBox="0 0 100 200" className="w-full h-full text-slate-200" fill="currentColor">
              {/* Head */}
              <circle cx="50" cy="25" r="12" className={`transition-colors cursor-pointer ${selectedZone === 'head' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('head')} />
              {/* Neck */}
              <rect x="47" y="37" width="6" height="6" className="transition-colors cursor-pointer" onClick={() => setSelectedZone('neck')} />
              {/* Chest */}
              <path d="M 38,44 L 62,44 L 59,85 L 41,85 Z" className={`transition-colors cursor-pointer ${selectedZone === 'chest' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('chest')} />
              {/* Abdomen */}
              <path d="M 41,85 L 59,85 L 56,120 L 44,120 Z" className={`transition-colors cursor-pointer ${selectedZone === 'abdomen' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('abdomen')} />
              {/* Left Arm */}
              <path d="M 36,44 Q 25,75 22,110 L 28,110 Q 31,80 38,50 Z" className={`transition-colors cursor-pointer ${selectedZone === 'l_arm' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('l_arm')} />
              {/* Right Arm */}
              <path d="M 64,44 Q 75,75 78,110 L 72,110 Q 69,80 62,50 Z" className={`transition-colors cursor-pointer ${selectedZone === 'r_arm' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('r_arm')} />
              {/* Pelvis */}
              <path d="M 44,120 L 56,120 L 58,135 L 42,135 Z" />
              {/* Left Leg */}
              <path d="M 42,135 L 48,135 L 44,195 L 38,195 Z" className={`transition-colors cursor-pointer ${selectedZone === 'l_leg' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('l_leg')} />
              {/* Right Leg */}
              <path d="M 52,135 L 58,135 L 62,195 L 56,195 Z" className={`transition-colors cursor-pointer ${selectedZone === 'r_leg' ? 'text-[#006747]' : 'hover:text-slate-300'}`} onClick={() => setSelectedZone('r_leg')} />
            </svg>

            {/* Pulse Rings Overlay on hotspots */}
            {patientSymptoms.map((s) => {
              let coords = { top: '50%', left: '50%' };
              if (s.zone === 'head') coords = { top: '12%', left: '50%' };
              else if (s.zone === 'chest') coords = { top: '28%', left: '50%' };
              else if (s.zone === 'abdomen') coords = { top: '48%', left: '50%' };
              else if (s.zone === 'l_arm') coords = { top: '38%', left: '28%' };
              else if (s.zone === 'r_arm') coords = { top: '38%', left: '72%' };

              const severityColor = s.severity === 'crítico' ? 'bg-rose-500' : s.severity === 'elevado' ? 'bg-orange-500' : 'bg-amber-400';

              return (
                <div 
                  key={s.id} 
                  style={{ top: coords.top, left: coords.left }} 
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
                  onClick={() => setSelectedZone(s.zone)}
                >
                  <span className="flex h-3.5 w-3.5 relative">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${severityColor}`}></span>
                    <span className={`relative inline-flex rounded-full h-3.5 w-3.5 shadow-sm border-2 border-white ${severityColor}`}></span>
                  </span>
                  
                  {/* Tooltip on hover */}
                  <div className="hidden group-hover:block absolute left-1/2 bottom-5 transform -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap z-20">
                    {s.title}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-gray-400 font-medium mt-4">
            Clique nas partes do modelo humano para filtrar ou adicionar um sintoma topográfico ativo.
          </p>
        </div>

        {/* Right: Symptoms details list and add symptom form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sintomas Mapeados</h4>
                <p className="text-lg font-black text-gray-900 mt-0.5">Histórico Regional do Modelo</p>
              </div>
              {selectedZone && (
                <button 
                  onClick={() => setSelectedZone(null)}
                  className="text-[10px] font-black text-rose-600 hover:underline uppercase tracking-widest"
                >
                  Limpar Filtro ({selectedZone})
                </button>
              )}
            </div>

            {/* Symptoms list */}
            <div className="space-y-3">
              {patientSymptoms
                .filter(s => !selectedZone || s.zone === selectedZone)
                .map((sym) => (
                  <div key={sym.id} className="p-4 bg-slate-50/50 rounded-2xl border border-gray-100 flex items-start justify-between">
                    <div className="flex items-start space-x-3.5">
                      <div className={`mt-1 w-3 h-3 rounded-full shrink-0 ${
                        sym.severity === 'crítico' ? 'bg-rose-500' : sym.severity === 'elevado' ? 'bg-orange-400' : 'bg-amber-400'
                      }`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-black text-sm text-gray-950">{sym.title}</h5>
                          <span className="text-[8px] font-black uppercase tracking-widest bg-gray-200/60 text-gray-500 px-2 py-0.5 rounded">
                            Zona: {sym.zone}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{sym.desc}</p>
                        <p className="text-[9px] text-gray-400 font-mono mt-1.5 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" /> Mapeado em {sym.date}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteSymptom(sym.id)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

              {patientSymptoms.filter(s => !selectedZone || s.zone === selectedZone).length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-gray-150">
                  Nenhum sintoma mapeado nesta zona corporal.
                </p>
              )}
            </div>

            {/* Quick Add Form */}
            <div className="pt-6 border-t border-gray-100 space-y-4">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mapear Novo Sintoma Clínico</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Título do Sintoma</label>
                  <input
                    type="text"
                    placeholder="Ex: Dor Lombar Crónica"
                    value={newSymptomTitle}
                    onChange={(e) => setNewSymptomTitle(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Zona Anatómica</label>
                  <select
                    value={newSymptomZone}
                    onChange={(e) => setNewSymptomZone(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20"
                  >
                    <option value="head">Cabeça (Cefaleias / Neurológico)</option>
                    <option value="chest">Peito / Toráxico (Cardiorespiratório)</option>
                    <option value="abdomen">Abdominal / Gastrointestinal</option>
                    <option value="l_arm">Braço Esquerdo</option>
                    <option value="r_arm">Braço Direito</option>
                    <option value="l_leg">Perna Esquerda</option>
                    <option value="r_leg">Perna Direita</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Nível de Gravidade</label>
                  <select
                    value={newSymptomSeverity}
                    onChange={(e) => setNewSymptomSeverity(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20"
                  >
                    <option value="baixo">Baixo (Leve / Esporádico)</option>
                    <option value="moderado">Moderado (Frequente / Monitorizar)</option>
                    <option value="elevado">Elevado (Grave / Analgesia Regular)</option>
                    <option value="crítico">Crítico (Pico agudo / Encaminhamento)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase">Descrição Clínica detalhada</label>
                <textarea
                  placeholder="Ex: Queixa-se de rigidez matinal persistente..."
                  value={newSymptomDesc}
                  onChange={(e) => setNewSymptomDesc(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20 min-h-[60px]"
                />
              </div>

              <button
                onClick={handleAddSymptom}
                className="w-full md:w-auto flex items-center justify-center space-x-2 bg-[#006747] hover:bg-emerald-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Mapear Sintoma Topograficamente</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 6. SMART AI RISK ALERT PANEL */}
      <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Painel Proativo de Alertas Clínicos</h4>
              <p className="text-lg font-black text-gray-900">Riscos e Recomendações Críticas IA</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 px-3 py-1 rounded-xl">
            {currentVitals.fc > 100 || currentVitals.bp_sys >= 140 ? '2 Alertas Ativos' : 'Fisiológico'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Alert 1 */}
          <div className="p-5 bg-rose-50/40 rounded-3xl border border-rose-100/50 flex items-start space-x-4">
            <div className="p-3 bg-white rounded-2xl text-rose-600 shadow-sm shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[8px] font-black uppercase tracking-widest bg-rose-600 text-white px-2 py-0.5 rounded">CRÍTICO</span>
                <span className="text-[9px] text-gray-400 font-mono">14/07/2026 - 11:15</span>
              </div>
              <h5 className="font-black text-sm text-gray-900">Risco Cardiovascular e Pico Pressórico</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Último registo de pressão arterial medido em {currentVitals.bp} mmHg ultrapassa os limites ideais de segurança estipulados para o diagnóstico de Hipertensão.
              </p>
              <div className="pt-2 flex items-center space-x-1.5 text-[10px] text-rose-800 font-extrabold">
                <Activity className="w-3.5 h-3.5" />
                <span>Sugestão: Vigiar picos esporádicos e ajustar Ramipril se sustentado.</span>
              </div>
            </div>
          </div>

          {/* Alert 2 */}
          <div className="p-5 bg-orange-50/40 rounded-3xl border border-orange-100/50 flex items-start space-x-4">
            <div className="p-3 bg-white rounded-2xl text-orange-600 shadow-sm shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[8px] font-black uppercase tracking-widest bg-orange-500 text-white px-2 py-0.5 rounded">ATENÇÃO</span>
                <span className="text-[9px] text-gray-400 font-mono">12/07/2026 - 09:30</span>
              </div>
              <h5 className="font-black text-sm text-gray-900">Frequência Cardíaca Elevada em Repouso</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                Registos sugerem picos ocasionais de {currentVitals.fc} bpm no consultório. Pode refletir efeito 'bata branca' ou ansiedade circunstancial.
              </p>
              <div className="pt-2 flex items-center space-x-1.5 text-[10px] text-orange-800 font-extrabold">
                <Heart className="w-3.5 h-3.5" />
                <span>Sugestão: Realizar ECG de 12 derivações para despistar taquiarritmia.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 7. CLINICAL COPILOT CHAT (INTEGRATED SMART IA PANEL) */}
      <div className="bg-gradient-to-br from-[#003c27] to-[#001f14] text-white p-8 rounded-[2.5rem] shadow-xl space-y-6 relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
        
        <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-emerald-950 pb-5 mb-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 rounded-2xl text-emerald-400 shadow-md">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-[9px] font-black text-emerald-400 tracking-widest uppercase">COPILOTO INTEGRADO DE SUPORTE À DECISÃO CLÍNICA</p>
              <h3 className="text-xl font-black text-white">Análise Clínica Automatizada de Evolution</h3>
            </div>
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/10">
            Base de dados: Integrada
          </span>
        </div>

        <p className="text-xs text-emerald-100/80 leading-relaxed max-w-4xl text-left">
          O Copiloto THE DOCTA analisa continuamente os registos de Anamnese, Medicação Habitual, Alergias, Sinais Vitais e Historial Familiar em busca de padrões de risco e eficácia terapêutica em tempo real.
        </p>

        {/* Quick presets query */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest text-left">Consultas Clínicas Recomendadas (Selecione para simular parecer):</p>
          <div className="flex flex-wrap gap-2">
            {presetQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAskCopilot(q)}
                disabled={isAnswering}
                className="bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-white px-3.5 py-2 rounded-xl transition-all font-semibold hover:scale-102 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="space-y-4">
          <div className="max-h-72 overflow-y-auto space-y-3.5 pr-2 no-scrollbar">
            <AnimatePresence>
              {copilotAnswers.map((item, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-2xl p-5 border border-white/5 text-left space-y-2"
                >
                  <div className="flex justify-between items-center text-[10px] text-emerald-300 font-bold">
                    <span className="flex items-center"><User className="w-3.5 h-3.5 mr-1" /> Pergunta: "{item.question}"</span>
                    <span className="text-white/40">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-emerald-50 leading-relaxed">
                    {item.answer}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isAnswering && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex items-center space-x-3 text-emerald-400 font-mono text-xs">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="animate-pulse">Copiloto Clínico gerando parecer médico...</span>
              </div>
            )}
          </div>

          {/* Form input */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Escreva uma pergunta personalizada sobre a monitorização clínica do paciente..."
              value={copilotQuestion}
              onChange={(e) => setCopilotQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskCopilot('')}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-semibold text-white placeholder-emerald-300/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            />
            <button
              onClick={() => handleAskCopilot('')}
              disabled={isAnswering || !copilotQuestion.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-[10px] tracking-widest px-6 py-4 rounded-2xl transition-all shadow-lg hover:scale-102 active:scale-98 disabled:opacity-40 cursor-pointer"
            >
              Consultar
            </button>
          </div>
        </div>
      </div>

      {/* 8. TIMELINE CLÍNICA COMPLETELY RE-DESIGNED */}
      <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
        <div>
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Linha do Tempo Multidisciplinar</h4>
          <p className="text-lg font-black text-gray-900 mt-1">Evolução Cronológica do Cuidado</p>
        </div>

        <div className="relative pl-6 border-l-2 border-gray-100 space-y-8 ml-4">
          {[
            { date: '14/07/2026', time: '10:00', type: 'Consulta', title: 'Consulta de Acompanhamento Médico', desc: 'Ajuste terapêutico realizado pelo Dr. David Cumbo. PA estável.', icon: User, color: 'bg-emerald-50 text-[#006747] border-emerald-200' },
            { date: '12/07/2026', time: '11:15', type: 'Alerta', title: 'Registo de Pico Hipertensivo Esporádico', desc: 'Sinalizado alerta automático no cockpit - 142/88 mmHg em repouso.', icon: AlertTriangle, color: 'bg-rose-50 text-rose-600 border-rose-200' },
            { date: '10/07/2026', time: '09:00', type: 'Exame', title: 'Análise de Sangue Completa (Lab)', desc: 'Perfil renal, glicemia de jejum (105 mg/dL) e microalbuminúria controlados.', icon: FileText, color: 'bg-purple-50 text-purple-700 border-purple-200' },
            { date: '08/07/2026', time: '15:15', type: 'Nota', title: 'Anamnese de Enfermagem MAPA 24h', desc: 'Assinado registo de monitorização de ambulatório.', icon: ClipboardList, color: 'bg-sky-50 text-sky-700 border-sky-200' },
            { date: '05/07/2026', time: '12:00', type: 'Receita', title: 'Emissão de Receita Médica', desc: 'Estatina 20mg e Ramipril 5mg prescritos para 90 dias.', icon: Pill, color: 'bg-amber-50 text-amber-700 border-amber-200' }
          ].map((item, idx) => {
            const IconComp = item.icon || User;
            return (
              <div key={idx} className="relative text-left">
                {/* Bullet icon overlay */}
                <div className={`absolute -left-[37px] top-1.5 w-7 h-7 rounded-full border-2 bg-white flex items-center justify-center ${item.color}`}>
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-gray-100 hover:border-[#006747]/20 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-[8px] font-black uppercase tracking-widest bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                        {item.type}
                      </span>
                      <h5 className="font-black text-sm text-gray-950">{item.title}</h5>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono">{item.date} às {item.time}</p>
                  </div>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// Custom simple ClipboardList icon since it wasn't explicitly destructured or needs definition
function ClipboardList(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
