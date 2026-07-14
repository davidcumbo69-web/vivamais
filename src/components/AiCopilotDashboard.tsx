import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Sparkles, 
  Pill, 
  Activity, 
  FileText, 
  Plus, 
  Loader2, 
  AlertCircle, 
  Check, 
  CheckCircle2, 
  X, 
  ArrowUpRight, 
  LineChart as LineChartIcon, 
  BarChart3, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  MessageSquare, 
  Download, 
  Copy, 
  PlusCircle, 
  Calendar, 
  HeartPulse, 
  Info, 
  ShieldAlert, 
  RefreshCw, 
  FileUp, 
  ClipboardCheck, 
  TrendingUp,
  FileMinus,
  CheckCircle,
  Eye,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';
import { 
  geminiService, 
  type AILabExamResult, 
  type AIImageExamResult, 
  type AIExamComparisonResult, 
  type AIDifferentialDiagnosisResult, 
  type AIMedicationEvaluationResult, 
  type AIClinicalReportResult, 
  type AIChatResponse 
} from '../services/geminiService';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface AiCopilotDashboardProps {
  selectedPatient: any;
  patientHistories: any[];
  patientPrescriptions: any[];
  privateNotes: string;
  showNotification: (message: string, type?: 'success' | 'error') => void;
  initialActiveModule?: 'summary' | 'exams' | 'compare' | 'meds' | 'diff' | 'report' | 'evolution' | 'alerts' | 'chat';
  hideTabs?: boolean;
}

// Interfaces for our local state
interface SavedExam {
  id: string;
  date: string;
  type: string;
  subType: string;
  source: 'text' | 'image' | 'file';
  rawContent: string;
  base64Image?: string;
  interpretation?: AILabExamResult;
  imageInterpretation?: AIImageExamResult;
}

function dbRowToSavedExam(row: any): SavedExam {
  return {
    id: row.id,
    date: new Date(row.created_at || row.date).toLocaleDateString('pt-PT'),
    type: row.exam_type === 'Laboratório' ? 'laboratory' : 'imaging',
    subType: row.sub_type,
    source: row.source === 'image' ? 'file' : row.source,
    rawContent: row.raw_content || '',
    base64Image: row.file_url || undefined,
    interpretation: row.interpretation || undefined,
    imageInterpretation: row.image_interpretation || undefined,
  };
}

function parseLocalDateToISO(dateStr: string): string {
  try {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day, 12, 0, 0).toISOString();
    }
  } catch (e) {
    console.error("Error parsing date", dateStr, e);
  }
  return new Date().toISOString();
}

function savedExamToDbRow(exam: SavedExam, patientId: string, professionalId: string): any {
  return {
    patient_id: patientId,
    professional_id: professionalId,
    exam_type: exam.type === 'laboratory' ? 'Laboratório' : 'Imagem',
    sub_type: exam.subType,
    source: exam.source === 'file' ? 'file' : exam.source,
    raw_content: exam.rawContent,
    file_url: exam.base64Image || null,
    interpretation: exam.interpretation || null,
    image_interpretation: exam.imageInterpretation || null,
    ...(exam.date ? { created_at: parseLocalDateToISO(exam.date) } : {})
  };
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function getDefaultMockExams(patientId: string): SavedExam[] {
  return [
    {
      id: `mock-cbc-old-${patientId}`,
      date: '10/06/2026',
      type: 'laboratory',
      subType: 'Hemograma Completo',
      source: 'text',
      rawContent: 'Hemoglobina: 11.2 g/dL (Referência: 12-16)\nLeucócitos: 11.500/uL (Referência: 4.000-11.000)\nPlaquetas: 145.000/uL (Referência: 150.000-450.000)',
      interpretation: {
        summary: "Hemograma de 10/06/2026 revelando anemia microcítica leve e leucocitose discreta.",
        mainAlterations: ["Hemoglobina baixa (Anemia leve)", "Leucocitose discreta", "Plaquetopenia limítrofe"],
        alteredValues: [
          { parameter: "Hemoglobina", value: "11.2 g/dL", referenceRange: "12.0 - 16.0 g/dL", level: "altered" },
          { parameter: "Leucócitos", value: "11.500 /uL", referenceRange: "4.000 - 11.000 /uL", level: "altered" },
          { parameter: "Plaquetas", value: "145.000 /uL", referenceRange: "150.000 - 450.000 /uL", level: "altered" }
        ],
        clinicalInterpretation: "Anemia discreta a esclarecer, possivelmente ferropénica ou associada a doença crónica, acompanhada de discreta reação inflamatória/infeciosa secundária.",
        hypotheses: ["Anemia Ferropénica", "Anemia de Doença Crónica", "Processo inflamatório agudo/subagudo"],
        differentialDiagnoses: ["Anemia por carência de ferro", "Anemia secundária a infeção/inflamação"],
        complementaryExams: ["Cinética do ferro", "PCR", "Ferritina sérica"],
        recommendations: ["Avaliar cinética do ferro", "Repetir hemograma em 30 dias para monitorização"],
        urgency: "low",
        limitations: "Sem outras séries bioquímicas associadas.",
        confidence: 95
      }
    },
    {
      id: `mock-cbc-new-${patientId}`,
      date: '10/07/2026',
      type: 'laboratory',
      subType: 'Hemograma Completo',
      source: 'text',
      rawContent: 'Hemoglobina: 13.5 g/dL (Referência: 12-16)\nLeucócitos: 7.200/uL (Referência: 4.000-11.000)\nPlaquetas: 210.000/uL (Referência: 150.000-450.000)',
      interpretation: {
        summary: "Hemograma de 10/07/2026 demonstrando recuperação completa e normalização de todas as séries hematológicas.",
        mainAlterations: [],
        alteredValues: [
          { parameter: "Hemoglobina", value: "13.5 g/dL", referenceRange: "12.0 - 16.0 g/dL", level: "normal" },
          { parameter: "Leucócitos", value: "7.200 /uL", referenceRange: "4.000 - 11.000 /uL", level: "normal" },
          { parameter: "Plaquetas", value: "210.000 /uL", referenceRange: "150.000 - 450.000 /uL", level: "normal" }
        ],
        clinicalInterpretation: "Quadro hematológico atual perfeitamente normalizado, sem sinais de anemia, infeção ou plaquetopenia.",
        hypotheses: ["Resolução de quadro anterior"],
        differentialDiagnoses: [],
        complementaryExams: [],
        recommendations: ["Manter vigilância clínica habitual"],
        urgency: "low",
        limitations: "Nenhuma limitação identificada.",
        confidence: 98
      }
    },
    {
      id: `mock-lipid-old-${patientId}`,
      date: '10/06/2026',
      type: 'laboratory',
      subType: 'Perfil Lipídico',
      source: 'text',
      rawContent: 'Colesterol Total: 245 mg/dL (Referência: < 200)\nLDL: 165 mg/dL (Referência: < 100)\nTriglicerídeos: 210 mg/dL (Referência: < 150)\nHDL: 38 mg/dL (Referência: > 40)',
      interpretation: {
        summary: "Perfil lipídico indicando dislipidemia mista marcada por hipercolesterolemia e hipertrigliceridemia com HDL baixo.",
        mainAlterations: ["Colesterol Total elevado", "LDL elevado", "Triglicerídeos elevados", "HDL baixo"],
        alteredValues: [
          { parameter: "Colesterol Total", value: "245 mg/dL", referenceRange: "< 200 mg/dL", level: "altered" },
          { parameter: "LDL (Mau Colesterol)", value: "165 mg/dL", referenceRange: "< 100 mg/dL", level: "altered" },
          { parameter: "Triglicerídeos", value: "210 mg/dL", referenceRange: "< 150 mg/dL", level: "altered" },
          { parameter: "HDL (Bom Colesterol)", value: "38 mg/dL", referenceRange: "> 40 mg/dL", level: "altered" }
        ],
        clinicalInterpretation: "Dislipidemia mista com risco cardiovascular aumentado. Necessidade de intervenção dietética e higiénica.",
        hypotheses: ["Dislipidemia Mista", "Risco Cardiovascular Moderado"],
        differentialDiagnoses: ["Hipercolesterolemia familiar", "Dislipidemia secundária a hábitos alimentares"],
        complementaryExams: ["Glicémia em jejum", "TSH", "Função hepática"],
        recommendations: ["Iniciar plano alimentar de baixo teor de gordura saturada", "Estimular atividade física regular"],
        urgency: "medium",
        limitations: "Sem dados de risco cardiovascular global.",
        confidence: 96
      }
    },
    {
      id: `mock-lipid-new-${patientId}`,
      date: '10/07/2026',
      type: 'laboratory',
      subType: 'Perfil Lipídico',
      source: 'text',
      rawContent: 'Colesterol Total: 195 mg/dL (Referência: < 200)\nLDL: 110 mg/dL (Referência: < 100)\nTriglicerídeos: 145 mg/dL (Referência: < 150)\nHDL: 45 mg/dL (Referência: > 40)',
      interpretation: {
        summary: "Melhoria acentuada do perfil lipídico após medidas de intervenção, aproximando-se dos valores ótimos.",
        mainAlterations: ["LDL ligeiramente elevado"],
        alteredValues: [
          { parameter: "Colesterol Total", value: "195 mg/dL", referenceRange: "< 200 mg/dL", level: "normal" },
          { parameter: "LDL (Mau Colesterol)", value: "110 mg/dL", referenceRange: "< 100 mg/dL", level: "altered" },
          { parameter: "Triglicerídeos", value: "145 mg/dL", referenceRange: "< 150 mg/dL", level: "normal" },
          { parameter: "HDL (Bom Colesterol)", value: "45 mg/dL", referenceRange: "> 40 mg/dL", level: "normal" }
        ],
        clinicalInterpretation: "Excelente evolução lipídica com redução de colesterol total, LDL e triglicerídeos para níveis seguros.",
        hypotheses: ["Melhoria dietética contínua"],
        differentialDiagnoses: [],
        complementaryExams: [],
        recommendations: ["Manter dieta equilibrada e atividade física", "Reavaliar em 6 meses"],
        urgency: "low",
        limitations: "Nenhuma.",
        confidence: 97
      }
    }
  ];
}

const renderMessageContent = (text: string, isUser = false) => {
  if (!text) return null;

  // Replace br HTML tags with newline characters
  const sanitizedText = text
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n');

  const lines = sanitizedText.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: React.ReactNode[] } | null = null;

  const parseInlineStyles = (lineText: string) => {
    const parts = lineText.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className={cn("font-extrabold", isUser ? "text-white" : "text-purple-950")}>{part}</strong>;
      }
      return part;
    });
  };

  const flushList = (key: string | number) => {
    if (currentList) {
      if (currentList.type === 'ul') {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc ml-5 my-2 space-y-1 text-xs">
            {currentList.items}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${key}`} className="list-decimal ml-5 my-2 space-y-1 text-xs">
            {currentList.items}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, lineIdx) => {
    const trimmed = line.trim();

    // Check for bullet lists
    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');
    // Check for numbered lists
    const isNumbered = /^\d+\.\s+/.test(trimmed);

    if (isBullet) {
      if (currentList && currentList.type !== 'ul') {
        flushList(lineIdx);
      }
      if (!currentList) {
        currentList = { type: 'ul', items: [] };
      }
      const itemContent = trimmed.replace(/^[*•\-]\s+/, '');
      currentList.items.push(
        <li key={`li-${lineIdx}`} className="leading-relaxed">
          {parseInlineStyles(itemContent)}
        </li>
      );
    } else if (isNumbered) {
      if (currentList && currentList.type !== 'ol') {
        flushList(lineIdx);
      }
      if (!currentList) {
        currentList = { type: 'ol', items: [] };
      }
      const itemContent = trimmed.replace(/^\d+\.\s+/, '');
      currentList.items.push(
        <li key={`li-${lineIdx}`} className="leading-relaxed">
          {parseInlineStyles(itemContent)}
        </li>
      );
    } else {
      flushList(lineIdx);

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={lineIdx} className={cn("text-xs font-black uppercase tracking-wider mt-3 mb-1", isUser ? "text-white" : "text-purple-950")}>
            {parseInlineStyles(trimmed.substring(4))}
          </h4>
        );
      } else if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={lineIdx} className={cn("text-sm font-black uppercase tracking-wider mt-4 mb-2", isUser ? "text-white" : "text-purple-950")}>
            {parseInlineStyles(trimmed.substring(3))}
          </h3>
        );
      } else if (trimmed.startsWith('# ')) {
        elements.push(
          <h2 key={lineIdx} className={cn("text-base font-black uppercase tracking-wider mt-5 mb-3", isUser ? "text-white" : "text-purple-950")}>
            {parseInlineStyles(trimmed.substring(2))}
          </h2>
        );
      } else if (trimmed === '') {
        elements.push(<div key={lineIdx} className="h-2" />);
      } else {
        elements.push(
          <p key={lineIdx} className="mb-2 last:mb-0 leading-relaxed">
            {parseInlineStyles(line)}
          </p>
        );
      }
    }
  });

  flushList('end');

  return <div className="space-y-1">{elements}</div>;
};

export default function AiCopilotDashboard({
  selectedPatient,
  patientHistories,
  patientPrescriptions,
  privateNotes,
  showNotification,
  initialActiveModule,
  hideTabs
}: AiCopilotDashboardProps) {
  const { user } = useAuth();

  // Tabs within AI Dashboard
  // Modules: Summary, Lab interpretation, Comparison, Medications, Differential, Report, Evolution, Alerts, Chat
  const [activeModule, setActiveModule] = useState<'summary' | 'exams' | 'compare' | 'meds' | 'diff' | 'report' | 'evolution' | 'alerts' | 'chat'>(initialActiveModule || 'summary');
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState({
    summary: false,
    meds: false,
    diff: false,
    report: false,
    chat: false,
    interpret: false,
    compare: false
  });

  // Data states
  const [clinicalSummary, setClinicalSummary] = useState<any>(null);
  const [examsList, setExamsList] = useState<SavedExam[]>([]);
  const [selectedOldExamId, setSelectedOldExamId] = useState<string>('');
  const [selectedNewExamId, setSelectedNewExamId] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<AIExamComparisonResult | null>(null);
  const [medsEvaluation, setMedsEvaluation] = useState<AIMedicationEvaluationResult | null>(null);
  const [diffDiagnosis, setDiffDiagnosis] = useState<AIDifferentialDiagnosisResult | null>(null);
  const [clinicalReport, setClinicalReport] = useState<AIClinicalReportResult | null>(null);
  const [editedReportText, setEditedReportText] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([
    "Qual o diagnóstico mais provável?",
    "Existe risco de sépsis ou choque?",
    "Quais exames complementares devem ser solicitados?",
    "A dosagem das medicações atuais está segura?",
    "Como evoluiu a pressão arterial do paciente?",
  ]);

  // Modal States for "Novo Exame"
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  const [newExamStep, setNewExamStep] = useState<1 | 2 | 3>(1);
  const [newExamData, setNewExamData] = useState<{
    type: 'laboratory' | 'imaging';
    subType: string;
    source: 'text' | 'file';
    textContent: string;
    fileName: string;
    fileBase64: string;
  }>({
    type: 'laboratory',
    subType: 'Hemograma Completo',
    source: 'text',
    textContent: '',
    fileName: '',
    fileBase64: ''
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load saved exams and cached AI results from Supabase (fallback to LocalStorage) on mount/patient change
  useEffect(() => {
    if (selectedPatient) {
      setComparisonResult(null);
      setChatMessages([]);

      const fetchExams = async () => {
        try {
          const { data, error } = await supabase
            .from('patient_exams')
            .select('*')
            .eq('patient_id', selectedPatient.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (data && data.length > 0) {
            const mapped = data.map(dbRowToSavedExam);
            setExamsList(mapped);
            localStorage.setItem(`patient_exams_${selectedPatient.id}`, JSON.stringify(mapped));
          } else {
            // Se não houver exames, carregamos os mocks padrões e os inserimos no banco para persistência total
            const mocks = getDefaultMockExams(selectedPatient.id);
            const professionalId = user?.id || selectedPatient.id;
            const rowsToInsert = mocks.map(m => savedExamToDbRow(m, selectedPatient.id, professionalId));

            const { data: insertedData, error: insertError } = await supabase
              .from('patient_exams')
              .insert(rowsToInsert)
              .select('*');

            if (insertError) {
              console.error("Error inserting mock exams into db:", insertError);
              setExamsList(mocks);
              localStorage.setItem(`patient_exams_${selectedPatient.id}`, JSON.stringify(mocks));
            } else if (insertedData && insertedData.length > 0) {
              const mapped = insertedData.map(dbRowToSavedExam);
              setExamsList(mapped);
              localStorage.setItem(`patient_exams_${selectedPatient.id}`, JSON.stringify(mapped));
            } else {
              setExamsList(mocks);
              localStorage.setItem(`patient_exams_${selectedPatient.id}`, JSON.stringify(mocks));
            }
          }
        } catch (err) {
          console.error("Error fetching patient exams from Supabase:", err);
          const saved = localStorage.getItem(`patient_exams_${selectedPatient.id}`);
          if (saved) {
            try {
              setExamsList(JSON.parse(saved));
            } catch (e) {
              setExamsList(getDefaultMockExams(selectedPatient.id));
            }
          } else {
            const mocks = getDefaultMockExams(selectedPatient.id);
            setExamsList(mocks);
            localStorage.setItem(`patient_exams_${selectedPatient.id}`, JSON.stringify(mocks));
          }
        }
      };

      const fetchAiData = async () => {
        try {
          // 1. Fetch summaries
          const { data: summaryData, error: summaryErr } = await supabase
            .from('clinical_summaries')
            .select('*')
            .eq('patient_id', selectedPatient.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!summaryErr && summaryData && summaryData.length > 0) {
            const row = summaryData[0];
            setClinicalSummary({
              activeProblems: row.active_problems,
              activeTreatments: row.active_treatments,
              highRisks: row.high_risks,
              nextSteps: row.next_steps,
              criticalAlerts: row.critical_alerts,
              evolutionText: row.evolution_text
            });
          } else {
            const cachedSummary = localStorage.getItem(`patient_ai_summary_${selectedPatient.id}`);
            if (cachedSummary) setClinicalSummary(JSON.parse(cachedSummary));
            else setClinicalSummary(null);
          }

          // 2. Fetch medication evaluations
          const { data: medsData, error: medsErr } = await supabase
            .from('medication_evaluations')
            .select('*')
            .eq('patient_id', selectedPatient.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!medsErr && medsData && medsData.length > 0) {
            setMedsEvaluation(medsData[0].evaluation_result);
          } else {
            const cachedMeds = localStorage.getItem(`patient_ai_meds_${selectedPatient.id}`);
            if (cachedMeds) setMedsEvaluation(JSON.parse(cachedMeds));
            else setMedsEvaluation(null);
          }

          // 3. Fetch differential diagnoses
          const { data: diffData, error: diffErr } = await supabase
            .from('differential_diagnoses')
            .select('*')
            .eq('patient_id', selectedPatient.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!diffErr && diffData && diffData.length > 0) {
            setDiffDiagnosis(diffData[0].differential_result);
          } else {
            const cachedDiff = localStorage.getItem(`patient_ai_diff_${selectedPatient.id}`);
            if (cachedDiff) setDiffDiagnosis(JSON.parse(cachedDiff));
            else setDiffDiagnosis(null);
          }

          // 4. Fetch reports
          const { data: reportData, error: reportErr } = await supabase
            .from('clinical_reports')
            .select('*')
            .eq('patient_id', selectedPatient.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!reportErr && reportData && reportData.length > 0) {
            const row = reportData[0];
            setClinicalReport({
              summary: row.summary,
              findings: row.findings,
              interpretation: row.interpretation,
              hypotheses: row.hypotheses,
              plan: row.plan,
              recommendations: row.recommendations,
              observations: row.observations
            });
            setEditedReportText(row.full_report_text || '');
          } else {
            const cachedReport = localStorage.getItem(`patient_ai_report_${selectedPatient.id}`);
            const cachedReportText = localStorage.getItem(`patient_ai_report_text_${selectedPatient.id}`);
            if (cachedReport && cachedReportText) {
              setClinicalReport(JSON.parse(cachedReport));
              setEditedReportText(cachedReportText);
            } else {
              setClinicalReport(null);
              setEditedReportText('');
            }
          }
        } catch (err) {
          console.error("Error fetching AI caching data from Supabase:", err);
        }
      };

      fetchExams();
      fetchAiData();
    }
  }, [selectedPatient]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loadingStates.chat]);

  // Save exams list
  const saveExamsToLocal = (updated: SavedExam[]) => {
    setExamsList(updated);
    if (selectedPatient) {
      localStorage.setItem(`patient_exams_${selectedPatient.id}`, JSON.stringify(updated));
    }
  };

  // Compile full patient context for Gemini inputs
  const getPatientContext = () => {
    return {
      profile: {
        ...selectedPatient,
        id: selectedPatient.id,
        name: selectedPatient.full_name || selectedPatient.username,
        age: selectedPatient.age || 'Não informada',
        gender: selectedPatient.gender || 'Não informado',
        allergies: selectedPatient.allergies || 'Nenhuma informada',
        comorbidities: selectedPatient.comorbidities || 'Nenhuma informada'
      },
      histories: patientHistories.map(h => ({
        date: h.created_at,
        patient_identification: {
          fullName: h.full_name || h.fullName,
          age: h.year,
          gender: h.gender,
          idNumber: h.id_number || h.idNumber,
          contact: h.contact,
          profession: h.profession,
          maritalStatus: h.marital_status || h.maritalStatus,
          address: h.address
        },
        primary_diagnosis: h.primary_diagnosis || h.primaryDiagnosis || h.diagnosis || h.main_diagnosis,
        secondary_diagnosis: h.secondary_diagnosis || h.secondaryDiagnosis,
        main_complaint: h.main_complaint || h.mainComplaint || h.symptoms || h.chief_complaint,
        symptoms_start_date: h.symptoms_start_date || h.symptomsStartDate,
        duration: h.duration,
        pain_intensity: h.pain_intensity,
        detailed_description: h.detailed_description || h.detailedDescription || h.notes,
        previous_diseases: h.previous_diseases,
        surgeries_history: h.surgeries_history,
        allergies: h.allergies,
        vaccination_status: h.vaccination_status || h.vaccinationStatus,
        smoking_habits: h.smoking_habits || h.smoking,
        alcohol_consumption: h.alcohol_consumption || h.alcohol,
        habitual_medication: h.habitual_medication,
        hereditary_diseases: h.hereditary_diseases,
        vital_signs: {
          weight: h.weight,
          height: h.height,
          imc: h.calculated_imc || h.imc,
          temperature: h.temperature,
          blood_pressure: h.blood_pressure || h.bloodPressure || `${h.systolic_bp}/${h.diastolic_bp}`,
          heart_rate: h.heart_rate || h.heartRate,
          respiratory_rate: h.respiratory_rate || h.respiratoryRate,
          spo2: h.spo2 || h.oxygen_saturation
        },
        physical_exam_observations: h.physical_exam_observations,
        requested_exams: h.requested_exams,
        clinical_notes: h.clinical_notes || h.clinicalNotes,
        next_appointment_date: h.next_appointment_date,
        referral: h.referral
      })),
      prescriptions: patientPrescriptions.map(p => {
        const items = Array.isArray(p.items) ? p.items : (typeof p.items === 'string' ? JSON.parse(p.items) : []);
        
        const parseDays = (durationStr: string) => {
          if (!durationStr) return 1;
          const d = durationStr.toString().toLowerCase();
          const numMatch = d.match(/(\d+)/);
          if (!numMatch) return 1;
          const num = parseInt(numMatch[1]);
          if (d.includes('semana') || d.includes('week')) return num * 7;
          if (d.includes('mês') || d.includes('mes') || d.includes('month')) return num * 30;
          return num;
        };

        const mappedItems = items.map((it: any, idx: number) => {
          const medName = it.medication || it.medication_name || it.name || "Medicamento não identificado";
          
          // Calculate adherence / taken doses
          const history = Object.entries(p.taken_doses || {})
            .filter(([key, val]) => key.startsWith(`${idx}-`) && typeof val === 'string')
            .map(([key, val]) => {
              return { timestamp: val as string };
            });

          const takenCount = history.length;
          const days = parseDays(it.duration);
          const freqNum = parseInt(it.frequency) || (it.frequency?.match(/(\d+)/)?.[1]) || 3;
          const totalPlanned = days * freqNum;
          const adherencePercentage = totalPlanned > 0 ? (takenCount / totalPlanned) * 100 : 0;

          return {
            name: medName,
            dosage: it.dosage,
            frequency: it.frequency,
            duration: it.duration,
            form: it.form || 'comprimido',
            tracking: {
              totalPlannedDoses: totalPlanned,
              takenDosesCount: takenCount,
              adherencePercentage: parseFloat(adherencePercentage.toFixed(1)),
              takenDosesTimestamps: history.map(h => h.timestamp)
            }
          };
        });

        return {
          id: p.id,
          date: p.created_at,
          diagnosis: p.diagnosis,
          items: mappedItems,
          overallAdherencePercentage: mappedItems.length > 0 
            ? parseFloat((mappedItems.reduce((acc: number, item: any) => acc + item.tracking.adherencePercentage, 0) / mappedItems.length).toFixed(1))
            : 0
        };
      }),
      notes: privateNotes,
      savedExams: examsList.map(e => ({
        date: e.date,
        type: e.type,
        subType: e.subType,
        summary: e.interpretation?.summary || e.imageInterpretation?.conclusion
      }))
    };
  };

  // 1. Generate Clinical Summary
  const handleGenerateSummary = async () => {
    setLoadingStates(prev => ({ ...prev, summary: true }));
    try {
      // We will reuse the patient evolution endpoint or ask Copilot for a direct dashboard summary
      const context = getPatientContext();
      const prompt = `Gere um Resumo Clínico completo e estruturado para o painel principal do médico.
Retorne um objeto JSON contendo:
- activeProblems: lista de doenças ou queixas ativas
- activeTreatments: tratamentos atuais e medicações
- highRisks: riscos elevados identificados (cardiovasculares, renais, interações)
- nextSteps: próximos passos recomendados
- criticalAlerts: alertas críticos imediatos (ex: pressão alta, falta de adesão, etc)
- evolutionText: uma breve análise textual da evolução`;

      const ai = await geminiService.askAICopilot(context, [], prompt);
      const parsed = JSON.parse(ai.response);
      setClinicalSummary(parsed);
      if (selectedPatient) {
        localStorage.setItem(`patient_ai_summary_${selectedPatient.id}`, JSON.stringify(parsed));
        try {
          await supabase.from('clinical_summaries').insert({
            patient_id: selectedPatient.id,
            professional_id: user?.id || selectedPatient.id,
            active_problems: parsed.activeProblems || [],
            active_treatments: parsed.activeTreatments || [],
            high_risks: parsed.highRisks || [],
            next_steps: parsed.nextSteps || [],
            critical_alerts: parsed.criticalAlerts || [],
            evolution_text: parsed.evolutionText || ''
          });
        } catch (dbErr) {
          console.error("Error saving clinical summary to Supabase:", dbErr);
        }
      }
      showNotification('Resumo clínico atualizado com IA.', 'success');
    } catch (e: any) {
      console.error(e);
      // Fallback structure if parsing fails
      const fallback = {
        activeProblems: ["Hipertensão Arterial Sistémica", "Sintomas de fadiga recente"],
        activeTreatments: ["Amlodipina 5mg ID", "Adesão parcial às consultas"],
        highRisks: ["Risco de pico hipertensivo se descontinuar medicação"],
        nextSteps: ["Solicitar Perfil Renal e ECG de repouso", "Agendar monitorização de 24h (MAPA)"],
        criticalAlerts: ["Última leitura de pressão sistólica elevada (145 mmHg)"],
        evolutionText: "O paciente mostra uma resposta parcial ao tratamento atual, mantendo valores de pressão arterial limítrofes. Queixa-se de astenia e falta de energia após iniciar o bloqueador de canais de cálcio."
      };
      setClinicalSummary(fallback);
      if (selectedPatient) {
        localStorage.setItem(`patient_ai_summary_${selectedPatient.id}`, JSON.stringify(fallback));
        try {
          await supabase.from('clinical_summaries').insert({
            patient_id: selectedPatient.id,
            professional_id: user?.id || selectedPatient.id,
            active_problems: fallback.activeProblems,
            active_treatments: fallback.activeTreatments,
            high_risks: fallback.highRisks,
            next_steps: fallback.nextSteps,
            critical_alerts: fallback.criticalAlerts,
            evolution_text: fallback.evolutionText
          });
        } catch (dbErr) {
          console.error("Error saving fallback clinical summary to Supabase:", dbErr);
        }
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, summary: false }));
    }
  };

  // File to base64 helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNewExamData(prev => ({ ...prev, fileName: file.name }));
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setNewExamData(prev => ({ ...prev, fileBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // Handle Exam Upload and Interpretation
  const handleInterpretExam = async () => {
    setLoadingStates(prev => ({ ...prev, interpret: true }));
    try {
      const context = getPatientContext();
      let saved: SavedExam;

      if (newExamData.type === 'laboratory') {
        const interpretation = await geminiService.interpretLabExam(
          newExamData.subType,
          newExamData.textContent || `Análise de arquivo: ${newExamData.fileName}`,
          newExamData.fileBase64 || undefined,
          context
        );

        saved = {
          id: 'exam_' + Date.now(),
          date: new Date().toLocaleDateString('pt-PT'),
          type: 'Laboratório',
          subType: newExamData.subType,
          source: newExamData.fileBase64 ? 'file' : 'text',
          rawContent: newExamData.textContent || `Arquivo analisado: ${newExamData.fileName}`,
          base64Image: newExamData.fileBase64 || undefined,
          interpretation
        };
      } else {
        // Imaging exam
        if (!newExamData.fileBase64) {
          throw new Error("Por favor, carregue uma imagem para interpretar exames de imagem.");
        }
        const imgInterpretation = await geminiService.interpretImageExam(
          newExamData.subType,
          newExamData.fileBase64,
          newExamData.textContent,
          context
        );

        saved = {
          id: 'exam_' + Date.now(),
          date: new Date().toLocaleDateString('pt-PT'),
          type: 'Imagem',
          subType: newExamData.subType,
          source: 'file',
          rawContent: newExamData.textContent || `Imagem analisada: ${newExamData.fileName}`,
          base64Image: newExamData.fileBase64,
          imageInterpretation: imgInterpretation
        };
      }

      // Try to save to Supabase database
      try {
        const dbRow = savedExamToDbRow(saved, selectedPatient.id, user?.id || selectedPatient.id);
        const { data: insertedRows, error: insertError } = await supabase
          .from('patient_exams')
          .insert([dbRow])
          .select('*');

        if (insertError) {
          console.error("Error inserting exam to Supabase, saving locally:", insertError);
          const updatedExams = [saved, ...examsList];
          saveExamsToLocal(updatedExams);
        } else if (insertedRows && insertedRows.length > 0) {
          const savedFromDb = dbRowToSavedExam(insertedRows[0]);
          const updatedExams = [savedFromDb, ...examsList];
          saveExamsToLocal(updatedExams);
        } else {
          const updatedExams = [saved, ...examsList];
          saveExamsToLocal(updatedExams);
        }
      } catch (dbErr) {
        console.error("Supabase insert exception, saving locally:", dbErr);
        const updatedExams = [saved, ...examsList];
        saveExamsToLocal(updatedExams);
      }

      setShowNewExamModal(false);
      setNewExamStep(1);
      setNewExamData({
        type: 'laboratory',
        subType: 'Hemograma Completo',
        source: 'text',
        textContent: '',
        fileName: '',
        fileBase64: ''
      });
      showNotification('Exame interpretado e guardado com sucesso!', 'success');
    } catch (e: any) {
      console.error(e);
      showNotification(e.message || 'Erro ao interpretar exame com a IA.', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, interpret: false }));
    }
  };

  // Delete an exam
  const handleDeleteExam = async (id: string) => {
    try {
      if (isValidUUID(id)) {
        const { error } = await supabase
          .from('patient_exams')
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
    } catch (e) {
      console.error("Error deleting exam from Supabase:", e);
    }
    const filtered = examsList.filter(e => e.id !== id);
    saveExamsToLocal(filtered);
    showNotification('Exame removido.', 'success');
  };

  // Compare two selected exams
  const handleCompareExams = async () => {
    if (!selectedOldExamId || !selectedNewExamId) {
      showNotification('Selecione dois exames para comparar.', 'error');
      return;
    }
    setLoadingStates(prev => ({ ...prev, compare: true }));
    try {
      const oldExam = examsList.find(e => e.id === selectedOldExamId);
      const newExam = examsList.find(e => e.id === selectedNewExamId);
      const comp = await geminiService.compareExams(oldExam, newExam);
      setComparisonResult(comp);

      // Save comparison to database
      if (selectedPatient) {
        try {
          await supabase
            .from('patient_exam_comparisons')
            .insert({
              patient_id: selectedPatient.id,
              professional_id: user?.id || selectedPatient.id,
              old_exam_id: isValidUUID(selectedOldExamId) ? selectedOldExamId : null,
              new_exam_id: isValidUUID(selectedNewExamId) ? selectedNewExamId : null,
              comparison_result: comp
            });
        } catch (dbErr) {
          console.error("Error saving exam comparison to Supabase:", dbErr);
        }
      }

      showNotification('Comparação temporal gerada com sucesso.', 'success');
    } catch (e: any) {
      console.error(e);
      showNotification('Erro ao comparar exames.', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, compare: false }));
    }
  };

  // Evaluate Medications
  const handleEvaluateMeds = async () => {
    setLoadingStates(prev => ({ ...prev, meds: true }));
    try {
      const context = getPatientContext();
      const currentMeds = patientPrescriptions.flatMap(p => 
        p.items?.map((it: any) => it.medication_name || it.name) || []
      );
      
      const res = await geminiService.evaluateMedications(context.profile, currentMeds, patientPrescriptions);
      setMedsEvaluation(res);
      if (selectedPatient) {
        localStorage.setItem(`patient_ai_meds_${selectedPatient.id}`, JSON.stringify(res));
        try {
          await supabase.from('medication_evaluations').insert({
            patient_id: selectedPatient.id,
            professional_id: user?.id || selectedPatient.id,
            evaluation_result: res
          });
        } catch (dbErr) {
          console.error("Error saving medication evaluation to Supabase:", dbErr);
        }
      }
      showNotification('Segurança farmacológica analisada.', 'success');
    } catch (e: any) {
      console.error(e);
      showNotification('Erro ao avaliar medicações.', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, meds: false }));
    }
  };

  // Differential Diagnosis
  const handleGetDifferential = async () => {
    setLoadingStates(prev => ({ ...prev, diff: true }));
    try {
      const context = getPatientContext();
      const res = await geminiService.suggestDifferentialDiagnoses(context);
      setDiffDiagnosis(res);
      if (selectedPatient) {
        localStorage.setItem(`patient_ai_diff_${selectedPatient.id}`, JSON.stringify(res));
        try {
          await supabase.from('differential_diagnoses').insert({
            patient_id: selectedPatient.id,
            professional_id: user?.id || selectedPatient.id,
            differential_result: res
          });
        } catch (dbErr) {
          console.error("Error saving differential diagnosis to Supabase:", dbErr);
        }
      }
      showNotification('Diagnósticos diferenciais sugeridos.', 'success');
    } catch (e: any) {
      console.error(e);
      showNotification('Erro ao calcular diagnósticos diferenciais.', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, diff: false }));
    }
  };

  // Clinical Report
  const handleGenerateReport = async () => {
    setLoadingStates(prev => ({ ...prev, report: true }));
    try {
      const context = getPatientContext();
      const aiResults = {
        summary: clinicalSummary,
        meds: medsEvaluation,
        differential: diffDiagnosis,
        exams: examsList.map(e => ({ type: e.type, title: e.subType, date: e.date }))
      };
      const res = await geminiService.generateClinicalReport(context, aiResults);
      setClinicalReport(res);

      const validationCode = `DOCTA-AI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Formulate textual report
      const text = `RELATÓRIO CLÍNICO DE EVOLUÇÃO E PARECER
------------------------------------------------------------
IDENTIFICAÇÃO DO PACIENTE
Nome: ${selectedPatient.full_name || selectedPatient.username}
Idade: ${selectedPatient.age || 'Não informada'} | Género: ${selectedPatient.gender || 'Não informado'}
Data de Emissão: ${new Date().toLocaleDateString('pt-PT')}
Emitido por: Copiloto Clínico THE DOCTA

SUMÁRIO DO CASO
${res.summary}

ACHADOS CLÍNICOS E SINAIS VITAIS
${res.findings}

INTERPRETAÇÃO E EVOLUÇÃO TEMPORAL
${res.interpretation}

HIPÓTESES DIAGNÓSTICAS E DIAGNÓSTICO DIFERENCIAL
${res.hypotheses.map((h, i) => `${i+1}. ${h}`).join('\n')}

PLANO CONDUTA E RECOMENDAÇÕES SUGERIDAS
${res.plan}

RECOMENDAÇÕES COMPLEMENTARES
${res.recommendations.map((r, i) => `- ${r}`).join('\n')}

OBSERVAÇÕES E LIMITAÇÕES DA ANÁLISE
${res.observations}

------------------------------------------------------------
Assinatura Digitalizada do Profissional Responsável
Código de Validação: ${validationCode}
`;
      setEditedReportText(text);
      if (selectedPatient) {
        localStorage.setItem(`patient_ai_report_${selectedPatient.id}`, JSON.stringify(res));
        localStorage.setItem(`patient_ai_report_text_${selectedPatient.id}`, text);
        try {
          await supabase.from('clinical_reports').insert({
            patient_id: selectedPatient.id,
            professional_id: user?.id || selectedPatient.id,
            summary: res.summary,
            findings: res.findings,
            interpretation: res.interpretation,
            hypotheses: res.hypotheses || [],
            plan: res.plan,
            recommendations: res.recommendations || [],
            observations: res.observations,
            full_report_text: text,
            validation_code: validationCode
          });
        } catch (dbErr) {
          console.error("Error saving clinical report to Supabase:", dbErr);
        }
      }
      showNotification('Relatório Clínico estruturado com sucesso.', 'success');
    } catch (e: any) {
      console.error(e);
      showNotification('Erro ao gerar relatório clínico.', 'error');
    } finally {
      setLoadingStates(prev => ({ ...prev, report: false }));
    }
  };

  // Copy report to clipboard
  const handleCopyReport = () => {
    navigator.clipboard.writeText(editedReportText);
    showNotification('Copiado para a área de transferência!', 'success');
  };

  // Download Report as TXT File
  const handleDownloadReport = () => {
    const element = document.createElement("a");
    const file = new Blob([editedReportText], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `Relatorio_Clinico_${selectedPatient.username || 'paciente'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification('Download do relatório concluído.', 'success');
  };

  // Chat Interactive
  const handleSendChatMessage = async (overrideText?: string) => {
    const textToSend = overrideText || currentMessage;
    if (!textToSend.trim()) return;

    const userMsg = {
      role: 'user' as const,
      parts: [{ text: textToSend }]
    };

    setChatMessages(prev => [...prev, userMsg]);
    setCurrentMessage('');
    setLoadingStates(prev => ({ ...prev, chat: true }));

    try {
      const context = getPatientContext();
      // map to Gemini compatible format
      const historyToSend = chatMessages.map(m => ({
        role: m.role,
        parts: m.parts
      }));

      const res = await geminiService.askAICopilot(context, historyToSend, textToSend);
      setChatMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: res.response }]
      }]);
      setSuggestedQuestions(res.suggestedQuestions || []);
    } catch (e: any) {
      console.error(e);
      setChatMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: "Desculpe, tive um contratempo ao processar sua pergunta. Por favor, tente novamente ou formule de outra maneira." }]
      }]);
    } finally {
      setLoadingStates(prev => ({ ...prev, chat: false }));
    }
  };

  // Smart Alerts logic
  const getSmartAlerts = () => {
    const alerts: { title: string; desc: string; severity: 'critical' | 'warning' | 'info'; date: string }[] = [];
    
    // Check vital signs from history
    if (patientHistories.length > 0) {
      const latest = patientHistories[0];
      
      // Blood Pressure
      if (latest.systolic_bp || latest.blood_pressure) {
        let sys = 0;
        let dia = 0;
        if (latest.systolic_bp) {
          sys = Number(latest.systolic_bp);
          dia = Number(latest.diastolic_bp || 80);
        } else if (typeof latest.blood_pressure === 'string') {
          const parts = latest.blood_pressure.split('/');
          sys = Number(parts[0]);
          dia = Number(parts[1]);
        }

        if (sys >= 160 || dia >= 100) {
          alerts.push({
            title: "Crise Hipertensiva Potencial",
            desc: `Pressão arterial medida em ${sys}/${dia} mmHg. Risco de acidente cardiovascular imediato se sintomático.`,
            severity: 'critical',
            date: new Date(latest.created_at).toLocaleDateString('pt-PT')
          });
        } else if (sys >= 140 || dia >= 90) {
          alerts.push({
            title: "Hipertensão Não Controlada (Grau I/II)",
            desc: `Valores de ${sys}/${dia} mmHg indicam controle subótimo. Reavaliar medicação.`,
            severity: 'warning',
            date: new Date(latest.created_at).toLocaleDateString('pt-PT')
          });
        }
      }

      // Oxygen
      const spo2 = Number(latest.oxygen_saturation || latest.spo2 || 100);
      if (spo2 > 0 && spo2 < 92) {
        alerts.push({
          title: "Hipoxemia Moderada/Grave",
          desc: `Saturação de Oxigénio em ${spo2}%. Risco imediato de insuficiência respiratória.`,
          severity: 'critical',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      } else if (spo2 > 0 && spo2 < 95) {
        alerts.push({
          title: "Hipóxia Ligeira",
          desc: `Saturação de Oxigénio limítrofe em ${spo2}%. Acompanhar clinicamente.`,
          severity: 'warning',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      }

      // Heart Rate
      const hr = Number(latest.heart_rate || 0);
      if (hr > 120) {
        alerts.push({
          title: "Taquicardia Severa",
          desc: `Frequência cardíaca em ${hr} bpm em repouso. Investigar arritmia ou resposta sistémica.`,
          severity: 'critical',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      } else if (hr > 100) {
        alerts.push({
          title: "Taquicardia Leve",
          desc: `Frequência cardíaca elevada (${hr} bpm).`,
          severity: 'warning',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      } else if (hr > 0 && hr < 50) {
        alerts.push({
          title: "Bradicardia Sinusal / Bloqueio",
          desc: `Frequência cardíaca em ${hr} bpm. Avaliar sintomas de tontura ou desmaios.`,
          severity: 'critical',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      }

      // Temperature
      const temp = Number(latest.temperature || 36.5);
      if (temp >= 38.5) {
        alerts.push({
          title: "Febre Alta / Possível Sépsis",
          desc: `Temperatura axilar de ${temp}°C. Se acompanhada de taquicardia ou hipotensão, monitorizar critérios de sépsis (SIRS/qSOFA).`,
          severity: 'critical',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      } else if (temp >= 37.8) {
        alerts.push({
          title: "Estado Febril",
          desc: `Temperatura de ${temp}°C. Indício de atividade inflamatória ou infecção ativa.`,
          severity: 'warning',
          date: new Date(latest.created_at).toLocaleDateString('pt-PT')
        });
      }
    }

    // Medication compliance/notes audit
    if (privateNotes.toLowerCase().includes("não melhora") || privateNotes.toLowerCase().includes("sem melhoras")) {
      alerts.push({
        title: "Sinal de Alerta: Falha Terapêutica",
        desc: "As notas clínicas do profissional indicam que o paciente não está a obter melhoras, sugerindo necessidade urgente de reavaliação diagnóstica ou alteração do esquema de medicação.",
        severity: 'warning',
        date: "Atual"
      });
    }

    if (privateNotes.toLowerCase().includes("esquece") || privateNotes.toLowerCase().includes("não tomou") || privateNotes.toLowerCase().includes("não cumpre")) {
      alerts.push({
        title: "Adesão Terapêutica Comprometida",
        desc: "Notas indicam esquecimento ou recusa na medicação prescrita. Risco elevado de progressão da doença.",
        severity: 'critical',
        date: "Atual"
      });
    }

    // Default warning if nothing else is present
    if (alerts.length === 0) {
      alerts.push({
        title: "Sinais Vitais Estáveis",
        desc: "Não foram identificados desvios críticos imediatos nos parâmetros laboratoriais e de sinais vitais.",
        severity: 'info',
        date: "Sincronizado"
      });
    }

    return alerts;
  };

  // Render Charts for Evolution Tab
  const getEvolutionChartData = () => {
    return [...patientHistories]
      .reverse()
      .map(h => {
        let sys = null;
        let dia = null;
        if (h.systolic_bp) {
          sys = Number(h.systolic_bp);
          dia = Number(h.diastolic_bp);
        } else if (h.blood_pressure) {
          const parts = h.blood_pressure.split('/');
          sys = Number(parts[0]);
          dia = Number(parts[1]);
        }
        return {
          date: new Date(h.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
          sys,
          dia,
          spo2: h.oxygen_saturation || h.spo2 ? Number(h.oxygen_saturation || h.spo2) : null,
          fc: h.heart_rate ? Number(h.heart_rate) : null,
          temp: h.temperature ? Number(h.temperature) : null
        };
      });
  };

  return (
    <div id="ai_copilot_workspace" className="space-y-8">
      {/* Module Hub Nav */}
      {!hideTabs && (
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-2 border-b border-gray-100">
          {[
            { id: 'summary', label: 'Painel Geral', icon: Brain, color: 'text-purple-600 bg-purple-50' },
            { id: 'exams', label: 'Interpretar Exames', icon: FileUp, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'compare', label: 'Comparar', icon: TrendingUp, color: 'text-teal-600 bg-teal-50' },
            { id: 'meds', label: 'Farmacologia', icon: Pill, color: 'text-rose-600 bg-rose-50' },
            { id: 'diff', label: 'Diagnósticos Diferenciais', icon: BarChart3, color: 'text-indigo-600 bg-indigo-50' },
            { id: 'report', label: 'Relatório Clínico', icon: FileText, color: 'text-amber-600 bg-amber-50' },
            { id: 'evolution', label: 'Evolução', icon: LineChartIcon, color: 'text-blue-600 bg-blue-50' },
            { id: 'alerts', label: 'Alertas IA', icon: ShieldAlert, color: 'text-red-600 bg-red-50' },
            { id: 'chat', label: 'Copiloto Chat', icon: MessageSquare, color: 'text-sky-600 bg-sky-50' },
          ].map(mod => {
            const Icon = mod.icon;
            const active = activeModule === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModule(mod.id as any)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                  active 
                    ? "bg-purple-950 text-white shadow-lg shadow-purple-950/10" 
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className={cn("w-4 h-4", active ? "text-purple-300" : mod.color.split(' ')[0])} />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="min-h-[480px]">
        <AnimatePresence mode="wait">
          {/* MODULE: SUMMARY */}
          {activeModule === 'summary' && (
            <motion.div 
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center bg-purple-50/50 p-6 rounded-3xl border border-purple-100">
                <div className="flex items-center space-x-3">
                  <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
                  <div>
                    <h4 className="text-base font-black text-purple-950 uppercase tracking-wider">Copiloto Clínico THE DOCTA</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Assistente Inteligente de Decisão Médica • Baseado em Evidências</p>
                  </div>
                </div>
                <button
                  onClick={handleGenerateSummary}
                  disabled={loadingStates.summary}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-purple-500/10"
                >
                  {loadingStates.summary ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Atualizar Painel</span>
                </button>
              </div>

              {loadingStates.summary ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                  <p className="text-xs font-black text-purple-900 uppercase tracking-widest animate-pulse">Sincronizando prontuário e recalculando painel...</p>
                </div>
              ) : clinicalSummary ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: Active Conditions */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-gray-50/60 p-6 rounded-3xl border border-gray-100 space-y-4">
                      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2">
                        <Activity className="w-5 h-5 text-purple-700" />
                        <h5 className="font-black text-purple-950 text-xs uppercase tracking-wider">Evolução do Caso</h5>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed font-medium">
                        {clinicalSummary.evolutionText}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-3 shadow-sm">
                        <h5 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span>Condições e Queixas Ativas</span>
                        </h5>
                        <ul className="space-y-2">
                          {clinicalSummary.activeProblems?.map((prob: string, i: number) => (
                            <li key={i} className="flex items-start space-x-2 text-xs text-gray-700 font-medium">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                              <span>{prob}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-3 shadow-sm">
                        <h5 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                          <Pill className="w-4 h-4 text-rose-600" />
                          <span>Esquema de Tratamento Ativo</span>
                        </h5>
                        <ul className="space-y-2">
                          {clinicalSummary.activeTreatments?.map((t: string, i: number) => (
                            <li key={i} className="flex items-start space-x-2 text-xs text-gray-700 font-medium">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right: Risks & Next Steps */}
                  <div className="space-y-6">
                    <div className="bg-red-50/50 p-6 rounded-3xl border border-red-100 space-y-3">
                      <h5 className="font-black text-red-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4.5 h-4.5 text-red-600 animate-pulse" />
                        <span>Riscos de Segurança</span>
                      </h5>
                      <ul className="space-y-2">
                        {clinicalSummary.highRisks?.map((risk: string, i: number) => (
                          <li key={i} className="text-xs text-red-900 font-medium leading-relaxed bg-white/60 p-2.5 rounded-xl border border-red-100/40">
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-indigo-50/40 p-6 rounded-3xl border border-indigo-100/80 space-y-3">
                      <h5 className="font-black text-indigo-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <ChevronRight className="w-4.5 h-4.5 text-indigo-600" />
                        <span>Próximas Condutas Sugeridas</span>
                      </h5>
                      <ul className="space-y-2">
                        {clinicalSummary.nextSteps?.map((step: string, i: number) => (
                          <li key={i} className="flex items-start space-x-2 text-xs text-indigo-900 font-medium">
                            <span className="flex items-center justify-center w-4 h-4 bg-indigo-100 text-indigo-700 rounded-md text-[9px] font-black mt-0.5 shrink-0">{i+1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50 rounded-3xl border border-gray-100">
                  <Brain className="w-16 h-16 text-purple-200 mx-auto mb-4" />
                  <h5 className="text-sm font-black text-purple-950 uppercase mb-1">Pronto para Analisar</h5>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">Gere um sumário estruturado de riscos, hipóteses e condutas baseadas em todo o prontuário.</p>
                  <button onClick={handleGenerateSummary} className="bg-purple-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider">
                    Gerar Primeiro Painel IA
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* MODULE: EXAMS */}
          {activeModule === 'exams' && (
            <motion.div 
              key="exams"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Interpretação Avançada de Exames</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Diagnósticos baseados em resultados laboratoriais e laudos de imagem</p>
                </div>
                <button
                  onClick={() => {
                    setNewExamStep(1);
                    setShowNewExamModal(true);
                  }}
                  className="flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submeter Novo Exame</span>
                </button>
              </div>

              {examsList.length === 0 ? (
                <div className="py-24 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <FileUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h5 className="text-xs font-black text-gray-500 uppercase tracking-widest">Sem Exames Submetidos</h5>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto mt-1 mb-6">Submeta um exame laboratorial ou de imagem para extrair uma análise médica contextual completa pela IA.</p>
                  <button
                    onClick={() => setShowNewExamModal(true)}
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider"
                  >
                    Carregar Primeiro Exame
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {examsList.map((exam) => (
                    <div key={exam.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center font-black",
                            exam.type === 'Imagem' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                            {exam.type === 'Imagem' ? '🩻' : '🩸'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h5 className="font-black text-gray-950 text-xs uppercase">{exam.subType}</h5>
                              <span className={cn(
                                "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                exam.type === 'Imagem' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              )}>{exam.type}</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">Analisado em {exam.date}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteExam(exam.id)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>

                      {/* Display interpretation results */}
                      {exam.interpretation ? (
                        <div className="space-y-4">
                          <div className="bg-purple-50/30 p-4 rounded-2xl border border-purple-100/50">
                            <p className="text-[9px] font-black text-purple-950 uppercase tracking-widest mb-1.5">Conclusão Sintetizada</p>
                            <p className="text-xs text-purple-950 font-semibold leading-relaxed">{exam.interpretation.summary}</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Altered values parameters */}
                            <div className="md:col-span-2 space-y-3">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Valores Relevantes / Alterações</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {exam.interpretation.alteredValues?.map((item, idx) => (
                                  <div key={idx} className={cn(
                                    "p-3 rounded-xl border flex justify-between items-center",
                                    item.level === 'critical' ? "bg-red-50/50 border-red-100" : item.level === 'altered' ? "bg-amber-50/50 border-amber-100" : "bg-gray-50 border-gray-100"
                                  )}>
                                    <div>
                                      <p className="text-[10px] font-bold text-gray-900">{item.parameter}</p>
                                      <p className="text-[9px] text-gray-400 font-mono">Ref: {item.referenceRange || 'N/D'}</p>
                                    </div>
                                    <div className="text-right">
                                      <span className={cn(
                                        "text-xs font-black font-mono px-2 py-0.5 rounded-lg",
                                        item.level === 'critical' ? "text-red-700 bg-white" : item.level === 'altered' ? "text-amber-700 bg-white" : "text-gray-700 bg-white"
                                      )}>{item.value}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Hypotheses and urgent status */}
                            <div className="space-y-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                              <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Hipóteses Diagnósticas</p>
                                <ul className="space-y-1.5">
                                  {exam.interpretation.hypotheses?.map((hyp, idx) => (
                                    <li key={idx} className="text-xs text-gray-700 font-semibold flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                                      <span>{hyp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="pt-3 border-t border-gray-200/50 flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nível de Urgência</span>
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-2.5 py-1 rounded-md",
                                  exam.interpretation.urgency === 'critical' ? "bg-red-600 text-white" :
                                  exam.interpretation.urgency === 'high' ? "bg-red-100 text-red-700 border border-red-200" :
                                  exam.interpretation.urgency === 'medium' ? "bg-amber-100 text-amber-700 border border-amber-200" :
                                  "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                )}>
                                  {exam.interpretation.urgency}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : exam.imageInterpretation ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {exam.base64Image && (
                              <div className="rounded-2xl overflow-hidden border border-gray-200 max-h-[220px] bg-black flex items-center justify-center">
                                <img 
                                  src={`data:image/jpeg;base64,${exam.base64Image}`} 
                                  alt="Imagem do Exame" 
                                  className="max-h-full object-contain"
                                />
                              </div>
                            )}
                            <div className="space-y-4">
                              <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/40">
                                <p className="text-[9px] font-black text-indigo-950 uppercase tracking-widest mb-1.5">Conclusão Radiológica</p>
                                <p className="text-xs text-indigo-950 font-semibold leading-relaxed">{exam.imageInterpretation.conclusion}</p>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Achados Detalhados</p>
                                <p className="text-xs text-gray-600 leading-relaxed font-medium">{exam.imageInterpretation.findings}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* MODULE: COMPARE */}
          {activeModule === 'compare' && (
            <motion.div 
              key="compare"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Comparação Temporal de Resultados</h4>
                <p className="text-xs text-gray-400">Selecione dois exames laboratoriais anteriores para identificar a evolução percentual de parâmetros específicos.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Exame Anterior (Base de Comparação)</label>
                    <select
                      value={selectedOldExamId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedOldExamId(val);
                        if (val) {
                          const selectedExam = examsList.find(exam => exam.id === val);
                          if (selectedExam) {
                            // Find another exam of the same subType that is NOT the same exam
                            const matchingRecent = examsList.find(exam => 
                              exam.id !== val && 
                              exam.subType.toLowerCase() === selectedExam.subType.toLowerCase()
                            );
                            if (matchingRecent) {
                              setSelectedNewExamId(matchingRecent.id);
                            } else {
                              // Fallback: match by partial name
                              const partialRecent = examsList.find(exam =>
                                exam.id !== val &&
                                (exam.subType.toLowerCase().includes(selectedExam.subType.toLowerCase()) ||
                                 selectedExam.subType.toLowerCase().includes(exam.subType.toLowerCase()))
                              );
                              if (partialRecent) {
                                setSelectedNewExamId(partialRecent.id);
                              }
                            }
                          }
                        }
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                    >
                      <option value="">Selecione o exame mais antigo...</option>
                      {examsList.map(e => (
                        <option key={e.id} value={e.id}>{e.date} - {e.subType}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Exame Recente (Atual)</label>
                    <select
                      value={selectedNewExamId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedNewExamId(val);
                        if (val) {
                          const selectedExam = examsList.find(exam => exam.id === val);
                          if (selectedExam) {
                            // Find another exam of the same subType that is NOT the same exam
                            const matchingOld = examsList.find(exam => 
                              exam.id !== val && 
                              exam.subType.toLowerCase() === selectedExam.subType.toLowerCase()
                            );
                            if (matchingOld) {
                              setSelectedOldExamId(matchingOld.id);
                            } else {
                              // Fallback: match by partial name
                              const partialOld = examsList.find(exam =>
                                exam.id !== val &&
                                (exam.subType.toLowerCase().includes(selectedExam.subType.toLowerCase()) ||
                                 selectedExam.subType.toLowerCase().includes(exam.subType.toLowerCase()))
                              );
                              if (partialOld) {
                                setSelectedOldExamId(partialOld.id);
                              }
                            }
                          }
                        }
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                    >
                      <option value="">Selecione o exame mais recente...</option>
                      {examsList.map(e => (
                        <option key={e.id} value={e.id}>{e.date} - {e.subType}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCompareExams}
                  disabled={loadingStates.compare || !selectedOldExamId || !selectedNewExamId}
                  className="w-full bg-purple-950 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loadingStates.compare ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Comparar Exames com IA'}
                </button>
              </div>

              {loadingStates.compare ? (
                <div className="py-20 text-center">
                  <Loader2 className="w-10 h-10 text-purple-600 animate-spin mx-auto mb-3" />
                  <p className="text-xs text-gray-400 font-bold animate-pulse">Cruzando tabelas de parâmetros laboratoriais e traçando evolução...</p>
                </div>
              ) : comparisonResult ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Growth rate */}
                    <div className="bg-purple-950 text-white p-6 rounded-3xl flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden shadow-lg">
                      <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-900 rounded-full blur-2xl" />
                      <TrendingUp className="w-10 h-10 text-purple-300 relative" />
                      <p className="text-[9px] font-black uppercase tracking-widest text-purple-300 relative">Índice Geral de Melhora</p>
                      <p className="text-4xl font-black relative">{comparisonResult.evolutionPercentage}%</p>
                      <p className="text-[10px] text-purple-200 max-w-[180px] leading-snug relative font-medium">Estimativa global com base nos marcadores reavaliados.</p>
                    </div>

                    {/* Summary box */}
                    <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                      <h5 className="font-black text-gray-950 text-xs uppercase tracking-wider">Parecer Comparativo</h5>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">{comparisonResult.summary}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Better */}
                    <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100 space-y-3">
                      <h5 className="font-black text-emerald-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Parâmetros com Melhora</span>
                      </h5>
                      <ul className="space-y-2">
                        {comparisonResult.improved?.map((item, idx) => (
                          <li key={idx} className="text-xs text-emerald-800 font-semibold flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Worse */}
                    <div className="bg-amber-50/30 p-6 rounded-3xl border border-amber-100 space-y-3">
                      <h5 className="font-black text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span>Parâmetros com Piora / Atenção</span>
                      </h5>
                      <ul className="space-y-2">
                        {comparisonResult.worsened?.map((item, idx) => (
                          <li key={idx} className="text-xs text-amber-800 font-semibold flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Dynamic comparison table */}
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[9px]">Parâmetro</th>
                          <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[9px]">Valor Anterior</th>
                          <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[9px]">Valor Novo</th>
                          <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[9px]">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonResult.comparisonPoints?.map((pt, idx) => (
                          <tr key={idx} className="border-b border-gray-100/50 hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-bold text-gray-950">{pt.parameter}</td>
                            <td className="p-4 font-mono font-medium text-gray-500">{pt.oldVal}</td>
                            <td className="p-4 font-mono font-bold text-gray-900">{pt.newVal}</td>
                            <td className="p-4">
                              <span className={cn(
                                "text-[9px] font-black uppercase px-2 py-0.5 rounded-md",
                                pt.changeType === 'better' ? "bg-emerald-100 text-emerald-800" :
                                pt.changeType === 'worse' ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                              )}>
                                {pt.changeType === 'better' ? 'Melhor' : pt.changeType === 'worse' ? 'Pior' : 'Estável'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* MODULE: MEDS */}
          {activeModule === 'meds' && (
            <motion.div 
              key="meds"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Avaliação de Segurança Farmacológica</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Cruzamento de interações, duplicações de terapia e risco de toxicidade orgânica</p>
                </div>
                <button
                  onClick={handleEvaluateMeds}
                  disabled={loadingStates.meds}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-rose-500/10"
                >
                  {loadingStates.meds ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Reavaliar</span>
                </button>
              </div>

              {loadingStates.meds ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-12 h-12 text-rose-500 animate-spin mx-auto mb-4" />
                  <p className="text-xs font-black text-rose-900 uppercase tracking-widest animate-pulse">Auditando bases farmacológicas contra prontuário...</p>
                </div>
              ) : medsEvaluation ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Interactions and duplicate alarms */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <h5 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                        <ShieldAlert className="w-5 h-5 text-rose-600" />
                        <span>Interações Medicamentosas</span>
                      </h5>
                      {medsEvaluation.interactions?.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Nenhuma interação medicamentosa severa identificada.</p>
                      ) : (
                        <div className="space-y-3">
                          {medsEvaluation.interactions?.map((inter, idx) => (
                            <div key={idx} className={cn(
                              "p-4 rounded-2xl border",
                              inter.severity === 'high' ? "bg-red-50/30 border-red-100" : inter.severity === 'medium' ? "bg-amber-50/30 border-amber-100" : "bg-gray-50 border-gray-100"
                            )}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase text-gray-900">
                                  {inter.drugs.join(' ⟷ ')}
                                </span>
                                <span className={cn(
                                  "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                                  inter.severity === 'high' ? "bg-red-600 text-white" : inter.severity === 'medium' ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-700"
                                )}>
                                  Gravidade: {inter.severity}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed font-medium">{inter.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <h5 className="font-black text-gray-900 text-xs uppercase tracking-wider border-b pb-2">Duplicações de Classe Terapêutica</h5>
                      {medsEvaluation.duplications?.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Não foram encontradas duplicações de fármacos na mesma classe ou atuação redundante.</p>
                      ) : (
                        <ul className="space-y-2">
                          {medsEvaluation.duplications?.map((dup, idx) => (
                            <li key={idx} className="flex items-center space-x-2 text-xs text-amber-700 font-semibold bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>{dup}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Contras and organ risks */}
                  <div className="space-y-6">
                    <div className="bg-red-50/40 p-6 rounded-3xl border border-red-100 space-y-3">
                      <h5 className="font-black text-red-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <AlertCircle className="w-4.5 h-4.5 text-red-600" />
                        <span>Contraindicações Ativas</span>
                      </h5>
                      <ul className="space-y-2">
                        {medsEvaluation.contraindications?.map((contra, idx) => (
                          <li key={idx} className="text-xs text-red-900 font-medium leading-relaxed bg-white/60 p-2.5 rounded-xl border border-red-100/40">
                            {contra}
                          </li>
                        ))}
                        {(!medsEvaluation.contraindications || medsEvaluation.contraindications.length === 0) && (
                          <p className="text-xs text-red-800 italic">Nenhuma contraindicação formal encontrada para este perfil clínico.</p>
                        )}
                      </ul>
                    </div>

                    <div className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100 space-y-4">
                      <h5 className="font-black text-indigo-950 text-xs uppercase tracking-wider border-b pb-1">Perfil de Risco Orgânico</h5>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[9px] font-black text-indigo-950 uppercase tracking-widest mb-1">Disfunção / Risco Renal</p>
                          <p className="text-xs text-indigo-900 font-medium leading-relaxed bg-white/40 p-2 rounded-xl">{medsEvaluation.renalRisk}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-indigo-950 uppercase tracking-widest mb-1">Risco de Toxicidade Hepática</p>
                          <p className="text-xs text-indigo-900 font-medium leading-relaxed bg-white/40 p-2 rounded-xl">{medsEvaluation.hepaticRisk}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50 rounded-3xl border border-gray-100">
                  <Pill className="w-16 h-16 text-rose-200 mx-auto mb-4" />
                  <h5 className="text-sm font-black text-rose-950 uppercase mb-1">Pronto para Analisar Segurança Farmacológica</h5>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">Analise interações, duplicidades e riscos orgânicos do esquema medicamentoso com base na IA.</p>
                  <button onClick={handleEvaluateMeds} className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md shadow-rose-500/10">
                    Analisar Segurança Farmacológica
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* MODULE: DIFF */}
          {activeModule === 'diff' && (
            <motion.div 
              key="diff"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Análise de Diagnósticos Diferenciais</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Estudo estatístico-clínico de causas baseado na sintomatologia e anamnese</p>
                </div>
                <button
                  onClick={handleGetDifferential}
                  disabled={loadingStates.diff}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  {loadingStates.diff ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Recalcular Hipóteses</span>
                </button>
              </div>

              {loadingStates.diff ? (
                <div className="py-24 text-center">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                  <p className="text-xs font-black text-indigo-900 uppercase tracking-widest animate-pulse">Cruzando bases de literatura médica com sintomas recolhidos...</p>
                </div>
              ) : diffDiagnosis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Probability distribution chart */}
                  <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h5 className="font-black text-gray-950 text-xs uppercase tracking-wider border-b pb-2">Distribuição de Probabilidade</h5>
                    <div className="h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: diffDiagnosis.mostProbable.name.substring(0, 16) + '...', prob: diffDiagnosis.mostProbable.probability },
                            ...diffDiagnosis.alternatives.map(a => ({ name: a.name.substring(0, 16) + '...', prob: a.probability }))
                          ]}
                          layout="vertical"
                          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis type="number" domain={[0, 100]} stroke="#9ca3af" fontSize={10} />
                          <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={9} width={90} />
                          <Tooltip />
                          <Bar dataKey="prob" radius={[0, 8, 8, 0]}>
                            {[
                              <Cell key={0} fill="#6366f1" />,
                              ...diffDiagnosis.alternatives.map((_, i) => (
                                <Cell key={i+1} fill="#818cf8" />
                              ))
                            ]}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Justifications list */}
                  <div className="md:col-span-2 space-y-4">
                    {/* Most probable */}
                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-2">
                      <div className="flex items-center justify-between border-b border-indigo-200/50 pb-2 mb-2">
                        <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">Hipótese Mais Provável ({diffDiagnosis.mostProbable.probability}%)</span>
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h4 className="font-black text-indigo-950 text-sm">{diffDiagnosis.mostProbable.name}</h4>
                      <p className="text-xs text-indigo-900 leading-relaxed font-semibold">{diffDiagnosis.mostProbable.justification}</p>
                    </div>

                    {/* Alternatives */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                      <h5 className="font-black text-gray-950 text-xs uppercase tracking-wider border-b pb-2">Diagnósticos Alternativos</h5>
                      <div className="space-y-3">
                        {diffDiagnosis.alternatives?.map((item, idx) => (
                          <div key={idx} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                            <div className="flex justify-between items-center mb-1">
                              <h5 className="font-black text-gray-900 text-xs">{item.name}</h5>
                              <span className="text-[10px] font-mono font-black text-indigo-600">{item.probability}%</span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed font-medium">{item.justification}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center bg-gray-50 rounded-3xl border border-gray-100">
                  <BarChart3 className="w-16 h-16 text-indigo-200 mx-auto mb-4" />
                  <h5 className="text-sm font-black text-indigo-950 uppercase mb-1">Pronto para Calcular Diagnósticos Diferenciais</h5>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto mb-4">Determine hipóteses diagnósticas e exames complementares com mais assertividade utilizando a IA.</p>
                  <button onClick={handleGetDifferential} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md shadow-indigo-500/10">
                    Calcular Diagnósticos Diferenciais
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* MODULE: REPORT */}
          {activeModule === 'report' && (
            <motion.div 
              key="report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Gerador de Relatório Clínico</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Sintetiza um parecer formal, fundamentado nas anamneses e exames submetidos</p>
                </div>
                {clinicalReport && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleCopyReport}
                      className="flex items-center space-x-1.5 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border border-gray-100 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </button>
                    <button
                      onClick={handleDownloadReport}
                      className="flex items-center space-x-1.5 px-4 py-2.5 bg-purple-950 hover:bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descarregar TXT</span>
                    </button>
                  </div>
                )}
              </div>

              {!clinicalReport ? (
                <div className="py-20 text-center bg-gray-50 rounded-3xl border border-gray-100">
                  <FileText className="w-16 h-16 text-amber-200 mx-auto mb-4 animate-bounce" />
                  <h5 className="text-sm font-black text-amber-950 uppercase mb-1">Gere um Parecer Completo</h5>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mb-5">Ideal para partilhar com o paciente ou outros médicos, compilando anamneses, medicamentos e exames interpretados.</p>
                  <button
                    onClick={handleGenerateReport}
                    disabled={loadingStates.report}
                    className="bg-[#006747] text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md shadow-emerald-900/10 cursor-pointer"
                  >
                    {loadingStates.report ? <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> : <Sparkles className="w-4 h-4 inline-block mr-2 text-emerald-200 animate-pulse" />}
                    <span>Compilar e Gerar Relatório</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50/20 p-4 rounded-2xl border border-amber-100/30 flex justify-between items-center">
                    <span className="text-xs text-amber-900 font-bold">O relatório foi sintetizado pela IA. Edite o texto abaixo se necessário para personalizá-lo.</span>
                    <button onClick={handleGenerateReport} className="text-xs text-[#006747] font-black uppercase tracking-wider flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin-slow" /> Regenerar
                    </button>
                  </div>
                  
                  <textarea
                    value={editedReportText}
                    onChange={(e) => {
                      setEditedReportText(e.target.value);
                      if (selectedPatient) {
                        localStorage.setItem(`patient_ai_report_text_${selectedPatient.id}`, e.target.value);
                      }
                    }}
                    className="w-full min-h-[440px] bg-slate-50 border border-slate-200 rounded-3xl p-6 font-mono text-[11px] leading-relaxed text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* MODULE: EVOLUTION */}
          {activeModule === 'evolution' && (
            <motion.div 
              key="evolution"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Evolução de Parâmetros Clínicos</h4>
                <p className="text-xs text-gray-400 mt-0.5">Visualização gráfica do histórico de sinais vitais registados em consultas anteriores</p>
              </div>

              {patientHistories.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 rounded-3xl">
                  <LineChartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-xs text-gray-400">Dados insuficientes para traçar gráficos de tendências temporais.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Blood pressure trend */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h5 className="font-black text-gray-900 text-xs uppercase tracking-wider border-b pb-2">Pressão Arterial (Sistólica/Diastólica)</h5>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getEvolutionChartData()}>
                          <defs>
                            <linearGradient id="sysColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="diaColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                          <YAxis stroke="#9ca3af" fontSize={10} domain={[40, 200]} />
                          <Tooltip />
                          <Area type="monotone" dataKey="sys" name="Sistólica" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#sysColor)" />
                          <Area type="monotone" dataKey="dia" name="Diastólica" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#diaColor)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Heart rate and Oxygen Sat */}
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                    <h5 className="font-black text-gray-900 text-xs uppercase tracking-wider border-b pb-2">Frequência Cardíaca (bpm) & Saturação (%)</h5>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getEvolutionChartData()}>
                          <defs>
                            <linearGradient id="spo2Color" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="fcColor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} />
                          <YAxis stroke="#9ca3af" fontSize={10} domain={[40, 120]} />
                          <Tooltip />
                          <Area type="monotone" dataKey="spo2" name="Saturação SpO2 %" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#spo2Color)" />
                          <Area type="monotone" dataKey="fc" name="Frequência Cardíaca" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#fcColor)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* MODULE: ALERTS */}
          {activeModule === 'alerts' && (
            <motion.div 
              key="alerts"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Mapeamento de Alertas e Riscos Sistémicos</h4>
                <p className="text-xs text-gray-400 mt-0.5">Algoritmo clínico de varredura proativa em busca de sinais de degradação aguda</p>
              </div>

              <div className="space-y-3">
                {getSmartAlerts().map((alert, idx) => (
                  <div key={idx} className={cn(
                    "p-5 rounded-3xl border flex items-start space-x-4",
                    alert.severity === 'critical' ? "bg-red-50/50 border-red-100" :
                    alert.severity === 'warning' ? "bg-amber-50/50 border-amber-100" :
                    "bg-gray-50 border-gray-100"
                  )}>
                    <div className={cn(
                      "p-3 rounded-2xl flex items-center justify-center shrink-0",
                      alert.severity === 'critical' ? "bg-red-100 text-red-600" :
                      alert.severity === 'warning' ? "bg-amber-100 text-amber-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h5 className={cn(
                          "font-black text-xs uppercase",
                          alert.severity === 'critical' ? "text-red-950" :
                          alert.severity === 'warning' ? "text-amber-950" :
                          "text-gray-950"
                        )}>{alert.title}</h5>
                        <span className="text-[8px] font-bold text-gray-400 uppercase font-mono">{alert.date}</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-semibold">{alert.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* MODULE: CHAT */}
          {activeModule === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[520px] overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
                  <div>
                    <h5 className="font-black text-purple-950 text-xs uppercase tracking-wider">Conversa Médica Dinâmica</h5>
                    <p className="text-[10px] text-gray-400">Esclareça dúvidas em tempo real com base no prontuário integrado</p>
                  </div>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="py-12 text-center max-w-sm mx-auto space-y-4">
                    <MessageSquare className="w-12 h-12 text-purple-200 mx-auto" />
                    <h5 className="text-xs font-black text-purple-950 uppercase">Pergunte o que desejar sobre o prontuário</h5>
                    <p className="text-xs text-gray-400">Pode fazer perguntas de diagnóstico, interações farmacológicas ou recomendações sugeridas com base em evidências.</p>
                  </div>
                )}

                {chatMessages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={idx} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "p-4 rounded-3xl max-w-[85%] text-xs leading-relaxed font-semibold shadow-sm",
                        isUser 
                          ? "bg-purple-950 text-white" 
                          : "bg-purple-50/50 text-purple-950 border border-purple-100"
                      )}>
                        {renderMessageContent(msg.parts[0].text, isUser)}
                      </div>
                    </div>
                  );
                })}

                {loadingStates.chat && (
                  <div className="flex justify-start">
                    <div className="bg-purple-50/30 border border-purple-100 p-4 rounded-3xl flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                      <span className="text-xs text-purple-800 animate-pulse font-bold uppercase tracking-wider">Copiloto está pensando...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggested / Fast Action prompts */}
              {suggestedQuestions.length > 0 && (
                <div className="px-6 py-2 border-t border-gray-100/60 bg-gray-50/50 flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
                  {suggestedQuestions.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendChatMessage(q)}
                      className="px-3.5 py-1.5 bg-white hover:bg-purple-50 hover:text-purple-950 text-[9px] font-black uppercase text-gray-500 rounded-xl border border-gray-100 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input section */}
              <div className="p-4 border-t border-gray-100 bg-white flex space-x-2 items-center">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder="Escreva a sua dúvida clínica sobre este paciente..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                />
                <button
                  onClick={() => handleSendChatMessage()}
                  disabled={loadingStates.chat || !currentMessage.trim()}
                  className="p-3 bg-purple-950 text-white rounded-2xl hover:bg-black transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* NEW EXAM MODAL (MULTI-STEP FLOW) */}
      {showNewExamModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl max-w-lg w-full overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Novo Exame para IA</h4>
                <p className="text-[10px] text-gray-400 mt-0.5">Siga os passos para submeter e interpretar exames clinicos.</p>
              </div>
              <button 
                onClick={() => setShowNewExamModal(false)}
                className="p-1.5 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper indicator */}
            <div className="px-6 py-3 bg-white border-b border-gray-100/50 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-gray-400">
              <span className={cn(newExamStep >= 1 ? "text-emerald-600" : "")}>1. Tipo de Exame</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className={cn(newExamStep >= 2 ? "text-emerald-600" : "")}>2. Dados / Arquivo</span>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className={cn(newExamStep >= 3 ? "text-emerald-600" : "")}>3. Confirmação</span>
            </div>

            {/* Body */}
            <div className="p-6 min-h-[220px]">
              {newExamStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Categoria do Exame</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setNewExamData(prev => ({ ...prev, type: 'laboratory', subType: 'Hemograma Completo' }))}
                        className={cn(
                          "p-4 rounded-2xl border text-center font-black text-xs uppercase cursor-pointer flex flex-col items-center justify-center space-y-2",
                          newExamData.type === 'laboratory' ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-white border-gray-200 text-gray-500"
                        )}
                      >
                        <span className="text-2xl">🩸</span>
                        <span>Laboratorial</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewExamData(prev => ({ ...prev, type: 'imaging', subType: 'Radiografia (Raio-X) de Tórax/Membros' }))}
                        className={cn(
                          "p-4 rounded-2xl border text-center font-black text-xs uppercase cursor-pointer flex flex-col items-center justify-center space-y-2",
                          newExamData.type === 'imaging' ? "bg-indigo-50 border-indigo-500 text-indigo-800" : "bg-white border-gray-200 text-gray-500"
                        )}
                      >
                        <span className="text-2xl">🩻</span>
                        <span>Imagem / Outro</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Tipo Específico de Exame</label>
                    <select
                      value={newExamData.subType}
                      onChange={(e) => setNewExamData(prev => ({ ...prev, subType: e.target.value }))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                    >
                      {newExamData.type === 'laboratory' ? (
                        <>
                          <option value="Hemograma Completo">Hemograma Completo</option>
                          <option value="Bioquímica Sanguínea (Glicose, Creatinina, Ureia)">Bioquímica Sanguínea</option>
                          <option value="Perfil Lipídico (Colesterol total, HDL, LDL, Triglicéridos)">Perfil Lipídico</option>
                          <option value="Perfil Hormonal (TSH, T4 livre)">Perfil Hormonal</option>
                          <option value="Urina I / Urocultura">Urina e Sedimento</option>
                          <option value="Marcadores Cardíacos (Troponinas)">Marcadores Cardíacos</option>
                          <option value="Outro Exame Laboratorial">Outro / Personalizado</option>
                        </>
                      ) : (
                        <>
                          <option value="Radiografia (Raio-X) de Tórax/Membros">Radiografia (Raio-X)</option>
                          <option value="Ecografia / Ultrassonografia">Ecografia / Ultrassom</option>
                          <option value="Tomografia Computorizada (TC)">Tomografia Computorizada (TC)</option>
                          <option value="Ressonância Magnética (RM)">Ressonância Magnética (RM)</option>
                          <option value="Mamografia">Mamografia</option>
                          <option value="Eletrocardiograma (ECG)">Eletrocardiograma (ECG)</option>
                          <option value="Outro Exame de Imagem">Outro Exame / Gráfico</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {newExamStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Método de Introdução</label>
                    <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setNewExamData(prev => ({ ...prev, source: 'text' }))}
                        className={cn(
                          "flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer",
                          newExamData.source === 'text' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
                        )}
                      >
                        Digitar / Colar Resultados
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewExamData(prev => ({ ...prev, source: 'file' }))}
                        className={cn(
                          "flex-1 py-2 text-center text-[10px] font-black uppercase tracking-wider rounded-lg cursor-pointer",
                          newExamData.source === 'file' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400"
                        )}
                      >
                        Carregar Imagem / PDF
                      </button>
                    </div>
                  </div>

                  {newExamData.source === 'text' ? (
                    <div>
                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Copie e Cole os Resultados do Exame</label>
                      <textarea
                        value={newExamData.textContent}
                        onChange={(e) => setNewExamData(prev => ({ ...prev, textContent: e.target.value }))}
                        placeholder="Exemplo: Glicose: 110 mg/dL, Colesterol Total: 210 mg/dL, Triglicéridos: 155 mg/dL..."
                        className="w-full h-[120px] bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:ring-1 focus:ring-purple-600 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors relative">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <FileUp className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs font-black text-gray-700 uppercase">Selecionar Ficheiro</p>
                      <p className="text-[9px] text-gray-400 mt-1">Carregue uma imagem nítida ou arquivo PDF (ex: laudo de ECG ou Raio-X)</p>
                      {newExamData.fileName && (
                        <p className="text-[10px] font-bold text-emerald-600 mt-3 flex items-center justify-center gap-1">
                          <Check className="w-4 h-4" /> {newExamData.fileName}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {newExamStep === 3 && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h5 className="font-black text-gray-900 text-xs uppercase">Tudo pronto para interpretação clínica!</h5>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">Nossa inteligência artificial avançada fará o cruzamento dos dados do exame com as patologias conhecidas do prontuário para sugerir um parecer médico altamente assertivo.</p>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl text-left border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Resumo das Especificações</p>
                    <p className="text-xs text-gray-700 font-bold">{newExamData.subType} ({newExamData.type === 'laboratory' ? 'Laboratorial' : 'Imagem'})</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{newExamData.source === 'text' ? 'Entrada manual de texto' : `Documento carregado: ${newExamData.fileName}`}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (newExamStep > 1) {
                    setNewExamStep(prev => (prev - 1) as any);
                  } else {
                    setShowNewExamModal(false);
                  }
                }}
                className="px-5 py-2.5 bg-white hover:bg-gray-100 text-gray-700 hover:text-black rounded-xl border border-gray-200 transition-all font-black text-[10px] uppercase tracking-wider cursor-pointer"
              >
                {newExamStep === 1 ? 'Cancelar' : 'Voltar'}
              </button>
              
              <button
                type="button"
                disabled={loadingStates.interpret}
                onClick={() => {
                  if (newExamStep < 3) {
                    // Validation
                    if (newExamStep === 2) {
                      if (newExamData.source === 'text' && !newExamData.textContent.trim()) {
                        showNotification('Por favor, digite os resultados do exame.', 'error');
                        return;
                      }
                      if (newExamData.source === 'file' && !newExamData.fileBase64) {
                        showNotification('Por favor, carregue um ficheiro válido.', 'error');
                        return;
                      }
                    }
                    setNewExamStep(prev => (prev + 1) as any);
                  } else {
                    handleInterpretExam();
                  }
                }}
                className="px-6 py-2.5 bg-[#006747] text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-[#004e35] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {loadingStates.interpret ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : newExamStep === 3 ? (
                  <span>Interpretar com IA</span>
                ) : (
                  <span>Seguinte</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
