import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Stethoscope, 
  Calendar, 
  Clock, 
  Activity, 
  FileText, 
  HeartPulse, 
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Scale,
  Ruler,
  Thermometer,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';
import { cn } from '../lib/utils';

interface Step {
  id: number;
  title: string;
}

const STEPS: Step[] = [
  { id: 1, title: 'Identificação' },
  { id: 2, title: 'Queixa Principal' },
  { id: 3, title: 'Antecedentes Pessoais' },
  { id: 4, title: 'Antecedentes Familiares' },
  { id: 5, title: 'Exame Físico' },
  { id: 6, title: 'Diagnóstico & Plano' }
];

export default function CreateClinicalHistory() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Step 1: Identification
    fullName: '',
    year: '' as string, // Changed to string for "23 anos"
    gender: 'Masculino',
    idNumber: '',
    contact: '',
    profession: '',
    maritalStatus: '',
    address: '',

    // Step 2: Main Complaint
    mainComplaint: '',
    symptomsStartDate: '',
    durationQuantity: '' as string | number,
    durationUnit: 'Dias',
    painIntensity: 5,
    detailedDescription: '',

    // Step 3: Personal History
    previousDiseases: '',
    surgeriesHistory: '',
    allergies: '',
    vaccinationStatus: 'Sim',
    smokingHabits: 'Não fumador',
    alcoholConsumption: 'Não',
    habitualMedication: '',

    // Step 4: Family History
    hereditaryDiseases: '',

    // Step 5: Physical Exam
    weight: '' as string | number,
    height: '' as string | number,
    imc: 0,
    temperature: '' as string | number,
    bloodPressure: '',
    heartRate: '' as string | number,
    respiratoryRate: '' as string | number,
    spo2: '' as string | number,
    physicalExamObservations: '',

    // Step 6: Diagnosis & Plan
    primaryDiagnosis: '',
    secondaryDiagnosis: '',
    requestedExams: '',
    clinicalNotes: '',
    nextAppointmentDate: '',
    referral: 'Sem referenciação'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchPatient() {
      if (!patientId) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', patientId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setPatientProfile(data);
          
          // Calculate Age String
          let ageDisplay = '';
          if (data.birth_date) {
            const birthYear = new Date(data.birth_date).getFullYear();
            const currentYear = new Date().getFullYear();
            const age = currentYear - birthYear;
            ageDisplay = `${age} anos`;
          }

          setFormData(prev => ({
            ...prev,
            fullName: data.full_name || '',
            contact: data.phone || '',
            gender: data.gender || 'Masculino',
            address: data.address || data.province || '', // Prefers specific address, falls back to province
            idNumber: data.id_card_number || '', 
            year: ageDisplay,
            maritalStatus: data.marital_status || ''
          }));
        }
      } catch (err) {
        console.error('Error fetching patient:', err);
      } finally {
        setInitialLoading(false);
      }
    }
    fetchPatient();
  }, [patientId]);

  // IMC Calculation
  useEffect(() => {
    const weightVal = parseFloat(formData.weight.toString());
    const heightVal = parseFloat(formData.height.toString());
    if (weightVal && heightVal && heightVal > 0) {
      const heightInMeters = heightVal / 100;
      const calculatedImc = weightVal / (heightInMeters * heightInMeters);
      setFormData(prev => ({ ...prev, imc: parseFloat(calculatedImc.toFixed(2)) }));
    }
  }, [formData.weight, formData.height]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    const required = 'Este campo é obrigatório';

    if (step === 1) {
      if (!formData.fullName) newErrors.fullName = required;
      if (!formData.year) newErrors.year = required;
      if (!formData.contact) newErrors.contact = required;
    } else if (step === 2) {
      if (!formData.mainComplaint) newErrors.mainComplaint = required;
      if (!formData.symptomsStartDate) newErrors.symptomsStartDate = required;
      if (!formData.detailedDescription) newErrors.detailedDescription = required;
    } else if (step === 5) {
      if (!formData.weight) newErrors.weight = required;
      if (!formData.height) newErrors.height = required;
      if (!formData.temperature) newErrors.temperature = required;
      if (!formData.bloodPressure) newErrors.bloodPressure = required;
      if (!formData.heartRate) newErrors.heartRate = required;
      if (!formData.respiratoryRate) newErrors.respiratoryRate = required;
      if (!formData.spo2) newErrors.spo2 = required;
    } else if (step === 6) {
      if (!formData.primaryDiagnosis) newErrors.primaryDiagnosis = required;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (generatePrescription: boolean = false) => {
    if (!validateStep(6)) return;
    
    setLoading(true);
    try {
      const { data: profProfile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();

      const historyData = {
        patient_id: patientId,
        professional_id: user?.id,
        professional_name: profProfile?.full_name || 'Profissional de Saúde',
        
        // Step 1
        full_name: formData.fullName,
        year: formData.year,
        gender: formData.gender,
        id_number: formData.idNumber,
        contact: formData.contact,
        profession: formData.profession,
        marital_status: formData.maritalStatus,
        address: formData.address,

        // Step 2
        main_complaint: formData.mainComplaint,
        symptoms_start_date: formData.symptomsStartDate,
        duration: `${formData.durationQuantity} ${formData.durationUnit}`,
        pain_intensity: formData.painIntensity,
        detailed_description: formData.detailedDescription,

        // Step 3
        previous_diseases: formData.previousDiseases,
        surgeries_history: formData.surgeriesHistory,
        allergies: formData.allergies,
        vaccination_status: formData.vaccinationStatus,
        smoking_habits: formData.smokingHabits,
        alcohol_consumption: formData.alcoholConsumption,
        habitual_medication: formData.habitualMedication,

        // Step 4
        hereditary_diseases: formData.hereditaryDiseases,

        // Step 5
        weight: typeof formData.weight === 'string' ? parseFloat(formData.weight) : formData.weight,
        height: typeof formData.height === 'string' ? parseFloat(formData.height) : formData.height,
        calculated_imc: formData.imc,
        temperature: typeof formData.temperature === 'string' ? parseFloat(formData.temperature) : formData.temperature,
        blood_pressure: formData.bloodPressure,
        heart_rate: typeof formData.heartRate === 'string' ? parseInt(formData.heartRate) : formData.heartRate,
        respiratory_rate: typeof formData.respiratoryRate === 'string' ? parseInt(formData.respiratoryRate) : formData.respiratoryRate,
        spo2: typeof formData.spo2 === 'string' ? parseInt(formData.spo2) : formData.spo2,
        physical_exam_observations: formData.physicalExamObservations,

        // Step 6
        primary_diagnosis: formData.primaryDiagnosis,
        secondary_diagnosis: formData.secondaryDiagnosis,
        requested_exams: formData.requestedExams,
        clinical_notes: formData.clinicalNotes,
        next_appointment_date: formData.nextAppointmentDate || null,
        referral: formData.referral,
        
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('clinical_histories')
        .insert([historyData]);

      if (error) throw error;

      if (generatePrescription) {
        // Redirecionar para receita com dados pré-preenchidos
        navigate(`/prescrever/${patientId}`, { 
          state: { 
            prefillDiagnosis: formData.primaryDiagnosis 
          } 
        });
      } else {
        navigate(`/profile/${patientId}`);
      }
    } catch (err) {
      console.error('Error saving clinical history:', err);
      alert('Erro ao guardar história clínica.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-10 h-10 border-4 border-[#006747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isStepValid = () => {
     // Check if current step has all required fields filled
     if (currentStep === 1) return !!(formData.fullName && formData.year && formData.contact);
     if (currentStep === 2) return !!(formData.mainComplaint && formData.symptomsStartDate && formData.detailedDescription);
     if (currentStep === 5) return !!(formData.weight && formData.height && formData.temperature && formData.bloodPressure && formData.heartRate && formData.respiratoryRate && formData.spo2);
     if (currentStep === 6) return !!(formData.primaryDiagnosis);
     return true;
  };

  return (
    <div className="pb-20 min-h-screen bg-[#f8fafc]">
      <Header />
      
      <div className="max-w-4xl mx-auto pt-6 px-4">
        {/* Progress Header */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2.5 bg-gray-50 text-gray-400 rounded-2xl shadow-sm hover:text-[#006747] transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-gray-900 leading-none">História Clínica</h1>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Nova Entrada • {patientProfile?.full_name}</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-2">
              {STEPS.map((step) => (
                <div 
                  key={step.id}
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all",
                    currentStep === step.id 
                      ? "bg-[#006747] text-white shadow-lg shadow-emerald-100 scale-110" 
                      : currentStep > step.id 
                        ? "bg-emerald-50 text-[#006747]" 
                        : "bg-gray-50 text-gray-300"
                  )}
                >
                  {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              Passo {currentStep}: {STEPS[currentStep-1].title}
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              {Math.round((currentStep / STEPS.length) * 100)}% concluído
            </span>
          </div>
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-[#006747]"
               initial={{ width: 0 }}
               animate={{ width: `${(currentStep / STEPS.length) * 100}%` }}
             />
          </div>
        </div>

        {/* Form Area */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* STEP 1: IDENTIFICATION */}
                {currentStep === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nome Completo *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                          type="text" 
                          value={formData.fullName}
                          readOnly
                          className={cn("w-full bg-gray-100 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-gray-500 cursor-not-allowed")} 
                          placeholder="Nome do Paciente"
                        />
                      </div>
                      {errors.fullName && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase px-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Ano *</label>
                      <input 
                        type="text" 
                        value={formData.year}
                        readOnly
                        className={cn("w-full bg-gray-100 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-gray-500 cursor-not-allowed")}
                        placeholder="Ex: 23 anos"
                      />
                      {errors.year && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase px-1">{errors.year}</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Sexo</label>
                      <select 
                        value={formData.gender}
                        disabled
                        className="w-full bg-gray-100 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-gray-500 cursor-not-allowed appearance-none"
                      >
                        <option>Masculino</option>
                        <option>Feminino</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nº ID (BI / Passaporte)</label>
                      <input 
                        type="text" 
                        value={formData.idNumber}
                        readOnly
                        className="w-full bg-gray-100 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-gray-500 cursor-not-allowed"
                        placeholder="Número de documento"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Contacto *</label>
                      <input 
                        type="text" 
                        value={formData.contact}
                        onChange={(e) => setFormData({...formData, contact: e.target.value})}
                        className={cn("w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 transition-all", errors.contact ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")}
                        placeholder="Telefone"
                      />
                      {errors.contact && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase px-1">{errors.contact}</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Profissão</label>
                      <input 
                        type="text" 
                        value={formData.profession}
                        onChange={(e) => setFormData({...formData, profession: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all"
                        placeholder="Profissão"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Estado Civil</label>
                      <select 
                        value={formData.maritalStatus}
                        disabled
                        className="w-full bg-gray-100 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-gray-500 cursor-not-allowed appearance-none"
                      >
                        <option value="">Selecionar...</option>
                        <option>Solteiro(a)</option>
                        <option>Casado(a)</option>
                        <option>Divorciado(a)</option>
                        <option>Viúvo(a)</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Morada</label>
                       <input 
                        type="text" 
                        value={formData.address}
                        readOnly
                        className="w-full bg-gray-100 border-none rounded-2xl py-3.5 px-4 text-sm font-bold text-gray-500 cursor-not-allowed"
                        placeholder="Endereço"
                      />
                    </div>
                  </div>
                )}

                {/* STEP 2: MAIN COMPLAINT */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Queixa Principal / Motivo da Consulta *</label>
                      <input 
                        type="text" 
                        value={formData.mainComplaint}
                        onChange={(e) => setFormData({...formData, mainComplaint: e.target.value})}
                        className={cn("w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 transition-all", errors.mainComplaint ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")} 
                        placeholder="Ex: Dor abdominal intensa"
                      />
                      {errors.mainComplaint && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase px-1">{errors.mainComplaint}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Início dos Sintomas *</label>
                        <input 
                          type="date" 
                          value={formData.symptomsStartDate}
                          onChange={(e) => setFormData({...formData, symptomsStartDate: e.target.value})}
                          className={cn("w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 transition-all", errors.symptomsStartDate ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")}
                        />
                        {errors.symptomsStartDate && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase px-1">{errors.symptomsStartDate}</p>}
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Duração</label>
                        <div className="flex space-x-2">
                          <input 
                            type="number"
                            value={formData.durationQuantity}
                            onChange={(e) => setFormData({...formData, durationQuantity: e.target.value})}
                            placeholder="Qtd"
                            className="w-20 bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all text-center"
                          />
                          <select 
                            value={formData.durationUnit}
                            onChange={(e) => setFormData({...formData, durationUnit: e.target.value})}
                            className="flex-1 bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all appearance-none"
                          >
                            <option>Horas</option>
                            <option>Dias</option>
                            <option>Semanas</option>
                            <option>Meses</option>
                            <option>Anos</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Intensidade da Dor - {formData.painIntensity}/10</label>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-sm transition-all",
                          formData.painIntensity === 0 ? "bg-gray-400" : formData.painIntensity <= 3 ? "bg-emerald-500" : formData.painIntensity <= 7 ? "bg-amber-500" : "bg-red-500"
                        )}>
                          {formData.painIntensity === 0 ? 'SEM DOR' : formData.painIntensity <= 3 ? 'Ligeira' : formData.painIntensity <= 7 ? 'Moderada' : 'Intensa'}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={formData.painIntensity}
                        onChange={(e) => setFormData({...formData, painIntensity: parseInt(e.target.value)})}
                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#006747]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Descrição Detalhada *</label>
                      <textarea 
                        rows={5}
                        value={formData.detailedDescription}
                        onChange={(e) => setFormData({...formData, detailedDescription: e.target.value})}
                        className={cn("w-full bg-gray-50 border-none rounded-3xl p-6 text-sm font-medium focus:ring-2 transition-all resize-none", errors.detailedDescription ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")}
                        placeholder="Descreva factores agravantes, atenuantes e sintomas associados..."
                      />
                      {errors.detailedDescription && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase px-1">{errors.detailedDescription}</p>}
                    </div>
                  </div>
                )}

                {/* STEP 3: PERSONAL HISTORY */}
                {currentStep === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Doenças Anteriores</label>
                      <input 
                        type="text" 
                        value={formData.previousDiseases}
                        onChange={(e) => setFormData({...formData, previousDiseases: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all"
                        placeholder="Ex: Varicela, Malária..."
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Cirurgias e Internamentos</label>
                      <input 
                        type="text" 
                        value={formData.surgeriesHistory}
                        onChange={(e) => setFormData({...formData, surgeriesHistory: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all"
                        placeholder="Histórico cirúrgico"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Alergias</label>
                      <input 
                        type="text" 
                        value={formData.allergies}
                        onChange={(e) => setFormData({...formData, allergies: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all"
                        placeholder="Medicamentos ou alimentos"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Vacinas em Dia</label>
                      <select 
                        value={formData.vaccinationStatus}
                        onChange={(e) => setFormData({...formData, vaccinationStatus: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all appearance-none"
                      >
                        <option>Sim</option>
                        <option>Não</option>
                        <option>Parcialmente</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Hábitos Tabágicos</label>
                      <select 
                        value={formData.smokingHabits}
                        onChange={(e) => setFormData({...formData, smokingHabits: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all appearance-none"
                      >
                        <option>Não fumador</option>
                        <option>Ex-fumador</option>
                        <option>Fumador</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Consumo de Álcool</label>
                      <select 
                        value={formData.alcoholConsumption}
                        onChange={(e) => setFormData({...formData, alcoholConsumption: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all appearance-none"
                      >
                        <option>Não</option>
                        <option>Ocasional</option>
                        <option>Regular</option>
                        <option>Excessivo</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Medicação Habitual</label>
                       <textarea 
                        rows={3}
                        value={formData.habitualMedication}
                        onChange={(e) => setFormData({...formData, habitualMedication: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all resize-none"
                        placeholder="Lista de medicamentos que toma regularmente..."
                      />
                    </div>
                  </div>
                )}

                {/* STEP 4: FAMILY HISTORY */}
                {currentStep === 4 && (
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Doenças Hereditárias ou Familiares Relevantes</label>
                    <textarea 
                      rows={8}
                      value={formData.hereditaryDiseases}
                      onChange={(e) => setFormData({...formData, hereditaryDiseases: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-3xl p-8 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all resize-none"
                      placeholder="Ex: Diabetes, Hipertensão, Cancro na família..."
                    />
                  </div>
                )}

                {/* STEP 5: PHYSICAL EXAM */}
                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50">
                        <label className="text-[10px] font-black text-[#006747] uppercase tracking-widest mb-2 block">Peso (kg) *</label>
                        <div className="relative">
                          <Scale className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#006747]" />
                          <input 
                            type="number" 
                            step="0.1"
                            value={formData.weight}
                            onChange={(e) => setFormData({...formData, weight: e.target.value})}
                            className={cn("w-full bg-white border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-[#006747] focus:ring-2 transition-all", errors.weight ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")} 
                          />
                        </div>
                      </div>

                      <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50">
                        <label className="text-[10px] font-black text-[#006747] uppercase tracking-widest mb-2 block">Altura (cm) *</label>
                        <div className="relative">
                          <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#006747]" />
                          <input 
                            type="number" 
                            value={formData.height}
                            onChange={(e) => setFormData({...formData, height: e.target.value})}
                            className={cn("w-full bg-white border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold text-[#006747] focus:ring-2 transition-all", errors.height ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")} 
                          />
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">IMC Calculado</label>
                        <span className={cn(
                          "text-2xl font-black transition-colors",
                          formData.imc === 0 ? "text-gray-200" : (formData.imc < 18.5 || formData.imc > 25) ? "text-amber-500" : "text-[#006747]"
                        )}>
                          {formData.imc || '--.-'}
                        </span>
                        {formData.imc > 0 && (
                          <span className="text-[8px] font-black uppercase text-gray-400 mt-1">
                            {formData.imc < 18.5 ? 'Abaixo do peso' : formData.imc < 25 ? 'Peso Normal' : formData.imc < 30 ? 'Sobrepeso' : 'Obesidade'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Temp (°C) *</label>
                        <div className="relative">
                          <Thermometer className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input 
                            type="number" 
                            step="0.1"
                            value={formData.temperature}
                            onChange={(e) => setFormData({...formData, temperature: e.target.value})}
                            className={cn("w-full bg-gray-50 border-none rounded-xl py-3 pl-10 pr-3 text-xs font-bold focus:ring-2 transition-all", errors.temperature ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")} 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">TA (mmHg) *</label>
                        <input 
                          type="text" 
                          placeholder="120/80"
                          value={formData.bloodPressure}
                          onChange={(e) => setFormData({...formData, bloodPressure: e.target.value})}
                          className={cn("w-full bg-gray-50 border-none rounded-xl py-3 px-3 text-xs font-bold focus:ring-2 transition-all text-center", errors.bloodPressure ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")} 
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">FC (bpm) *</label>
                        <input 
                          type="number" 
                          value={formData.heartRate}
                          onChange={(e) => setFormData({...formData, heartRate: e.target.value})}
                          className={cn("w-full bg-gray-50 border-none rounded-xl py-3 px-3 text-xs font-bold focus:ring-2 transition-all text-center", errors.heartRate ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")} 
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">FR (rpm) *</label>
                        <input 
                          type="number" 
                          value={formData.respiratoryRate}
                          onChange={(e) => setFormData({...formData, respiratoryRate: e.target.value})}
                          className={cn("w-full bg-gray-50 border-none rounded-xl py-3 px-3 text-xs font-bold focus:ring-2 transition-all text-center", errors.respiratoryRate ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")} 
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">SpO2 (%) *</label>
                        <div className="relative">
                          <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input 
                            type="number" 
                            value={formData.spo2}
                            onChange={(e) => setFormData({...formData, spo2: e.target.value})}
                            className={cn("w-full bg-gray-50 border-none rounded-xl py-3 pl-10 pr-3 text-xs font-bold focus:ring-2 transition-all", errors.spo2 ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")} 
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Observações do Exame Físico</label>
                       <textarea 
                        rows={4}
                        value={formData.physicalExamObservations}
                        onChange={(e) => setFormData({...formData, physicalExamObservations: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all resize-none"
                        placeholder="Anote detalhes visíveis, auscultação, etc..."
                      />
                    </div>
                  </div>
                )}

                {/* STEP 6: DIAGNOSIS & PLAN */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Diagnóstico Principal *</label>
                      <input 
                        type="text" 
                        value={formData.primaryDiagnosis}
                        onChange={(e) => setFormData({...formData, primaryDiagnosis: e.target.value})}
                        className={cn("w-full bg-emerald-50 border-none rounded-2xl py-4 px-6 text-sm font-black text-[#006747] focus:ring-2 transition-all", errors.primaryDiagnosis ? "ring-2 ring-red-100" : "focus:ring-[#006747]/20")} 
                        placeholder="Diagnóstico clínico conclusivo"
                      />
                      {errors.primaryDiagnosis && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase px-1">{errors.primaryDiagnosis}</p>}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Diagnósticos Secundários</label>
                      <input 
                        type="text" 
                        value={formData.secondaryDiagnosis}
                        onChange={(e) => setFormData({...formData, secondaryDiagnosis: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-6 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all" 
                        placeholder="Comorbilidades ou outros diagnósticos"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Exames Solicitados</label>
                        <textarea 
                          rows={3}
                          value={formData.requestedExams}
                          onChange={(e) => setFormData({...formData, requestedExams: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Próxima Consulta</label>
                        <input 
                          type="date" 
                          value={formData.nextAppointmentDate}
                          onChange={(e) => setFormData({...formData, nextAppointmentDate: e.target.value})}
                          className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Referenciação</label>
                          <select 
                            value={formData.referral}
                            onChange={(e) => setFormData({...formData, referral: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 appearance-none"
                          >
                            <option>Sem referenciação</option>
                            <option>Consulta de Especialidade</option>
                            <option>Urgência</option>
                            <option>Internamento</option>
                          </select>
                       </div>
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Notas Clínicas e Plano de Seguimento</label>
                       <textarea 
                        rows={4}
                        value={formData.clinicalNotes}
                        onChange={(e) => setFormData({...formData, clinicalNotes: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-3xl p-6 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 transition-all resize-none"
                        placeholder="Orientações, hábitos a mudar, próximos passos..."
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-gray-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className={cn(
                "w-full md:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                currentStep === 1 ? "opacity-0 pointer-events-none" : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            {currentStep < STEPS.length ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid() || loading}
                className={cn(
                  "w-full md:w-auto flex items-center justify-center space-x-2 px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg",
                  isStepValid() 
                    ? "bg-[#006747] text-white hover:bg-emerald-800 shadow-emerald-100" 
                    : "bg-gray-100 text-gray-300 cursor-not-allowed"
                )}
              >
                <span>Seguinte</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="w-full md:w-auto flex items-center justify-center space-x-2 px-8 py-4 bg-white text-gray-600 border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? 'A guardar...' : 'Só Guardar'}</span>
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="w-full md:w-auto flex items-center justify-center space-x-2 px-10 py-4 bg-[#006747] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>{loading ? 'A processar...' : 'Concluir e Gerar Receita'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security / Info Badge */}
        <div className="mt-8 flex flex-col items-center justify-center opacity-40">
           <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900">Protocolo de Saúde VIVA+</span>
           </div>
           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center px-10">
              Todos os dados clínicos são encriptados e processados sob rigoroso sigilo médico profissional em conformidade com as normas de saúde digital vigentes.
           </p>
        </div>
      </div>
    </div>
  );
}
