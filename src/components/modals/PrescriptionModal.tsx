import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  X, 
  FileText, 
  Pill, 
  Clock, 
  Activity, 
  Calendar, 
  Hash, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  User,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: { id: string; full_name: string; username: string };
  professional: { id: string; full_name: string; license_number: string };
  onSuccess: (prescriptionId: string) => void;
}

export function PrescriptionModal({ isOpen, onClose, patient, professional, onSuccess }: PrescriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    diagnosis: '',
    startDate: new Date().toISOString().split('T')[0],
    items: [
      { 
        medication: '', 
        form: 'Comprimido', 
        dosage: '1', 
        frequency: '3x', 
        duration: '7',
        specialInstructions: '',
        totalUnits: 0,
        endDate: '' 
      }
    ]
  });

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
    
    // Automatic Calculations
    const freqValue = parseInt(newItems[index].frequency.replace('x', ''));
    const durValue = parseInt(newItems[index].duration);
    const dosageValue = parseFloat(newItems[index].dosage);
    
    const totalDoses = freqValue * durValue;
    newItems[index].totalUnits = totalDoses * dosageValue;
    
    // End Date Calculation
    const start = new Date(formData.startDate);
    start.setDate(start.getDate() + durValue);
    newItems[index].endDate = start.toISOString().split('T')[0];

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  useEffect(() => {
    // Recalculate end dates for all items if start date changes
    const newItems = formData.items.map(item => {
      const start = new Date(formData.startDate);
      start.setDate(start.getDate() + parseInt(item.duration));
      return { ...item, endDate: start.toISOString().split('T')[0] };
    });
    setFormData(prev => ({ ...prev, items: newItems }));
  }, [formData.startDate]);

  const generateSignatureCode = (patientId: string, professionalLicense: string) => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    return `CEDAV-${professionalLicense}-${timestamp}-${random}`.toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate that at least one medication is filled
    if (formData.items.some(item => !item.medication || !item.dosage)) {
      setError('Por favor, preencha o medicamento e dosagem para todos os itens.');
      setLoading(false);
      return;
    }

    try {
      const signatureCode = generateSignatureCode(patient.id, professional.license_number);
      
      const { data, error: submitError } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: patient.id,
          professional_id: professional.id,
          diagnosis: formData.diagnosis,
          start_date: formData.startDate,
          items: formData.items.map(item => ({
            ...item,
            // Map legacy fields for compatibility
            dosage: `${item.dosage} ${item.form}(s)`,
            frequency: `${item.frequency} dia`,
            duration: `${item.duration} dias`,
            notes: item.specialInstructions
          })),
          signature_code: signatureCode
        })
        .select()
        .single();

      if (submitError) throw submitError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess(data.id);
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao emitir receita. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
      >
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
             <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#006747]" />
             </div>
             <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tighter">Emitir Receita Médica</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Documento Digital Certificado</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
               </div>
               <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">Receita Emitida!</h3>
               <p className="text-gray-500 font-medium max-w-xs mx-auto text-sm">A receita foi gerada com sucesso e enviada ao paciente.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center space-x-3 text-red-600">
                   <AlertCircle className="w-5 h-5 flex-shrink-0" />
                   <p className="text-xs font-bold">{error}</p>
                </div>
              )}

              {/* Medical Header Context */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-5 bg-emerald-50/30 rounded-3xl border border-emerald-100/50">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                          <Stethoscope className="w-5 h-5 text-[#006747]" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Responsável</p>
                          <p className="text-sm font-black text-gray-900 leading-tight">{professional.full_name}</p>
                       </div>
                    </div>
                 </div>
                 <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500">
                          <User className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Paciente</p>
                          <p className="text-sm font-black text-gray-900 leading-tight">{patient.full_name}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Diagnosis & Date Field */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-1 block">Data de Início</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#006747]" />
                    <input 
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-[#006747]/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-1 block">Diagnóstico Médico</label>
                  <textarea 
                    required
                    value={formData.diagnosis}
                    onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="Descreva o diagnóstico..."
                    className="w-full bg-gray-50 border-none rounded-2xl py-3 px-6 text-sm font-medium focus:ring-2 focus:ring-[#006747]/20 min-h-[52px] resize-none"
                  />
                </div>
              </div>

              {/* Medications List */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                  <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Medicamentos e Posologia</h3>
                  <button 
                    type="button"
                    onClick={addItem}
                    className="flex items-center space-x-1.5 text-[10px] font-black text-[#006747] uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <span>Adicionar</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm relative group"
                    >
                      {formData.items.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeItem(index)}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-gray-200 text-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-50 z-10"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className="grid gap-6">
                        {/* 1st Row: Med Name & Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Nome do Medicamento</label>
                            <input 
                              required
                              type="text"
                              value={item.medication}
                              onChange={(e) => updateItem(index, 'medication', e.target.value)}
                              placeholder="Ex: Amoxicilina 500mg"
                              className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#006747]/20"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Forma Farmacêutica</label>
                            <div className="relative">
                              <select 
                                value={item.form}
                                onChange={(e) => updateItem(index, 'form', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#006747]/20 appearance-none"
                              >
                                <option>Comprimido</option>
                                <option>Cápsula</option>
                                <option>Xarope</option>
                                <option>Injetável</option>
                                <option>Pomada</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* 2nd Row: Dose, Freq, Dur */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Dose por Toma</label>
                            <div className="relative">
                              <select 
                                value={item.dosage}
                                onChange={(e) => updateItem(index, 'dosage', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#006747]/20 appearance-none"
                              >
                                <option value="0.5">1/2</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Freq. Diária</label>
                            <div className="relative">
                              <select 
                                value={item.frequency}
                                onChange={(e) => updateItem(index, 'frequency', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#006747]/20 appearance-none"
                              >
                                <option value="1x">1x</option>
                                <option value="2x">2x</option>
                                <option value="3x">3x</option>
                                <option value="4x">4x</option>
                                <option value="5x">5x</option>
                                <option value="6x">6x</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                          <div>
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Duração (Dias)</label>
                            <div className="relative">
                              <select 
                                value={item.duration}
                                onChange={(e) => updateItem(index, 'duration', e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#006747]/20 appearance-none"
                              >
                                <option value="3">3</option>
                                <option value="5">5</option>
                                <option value="7">7</option>
                                <option value="10">10</option>
                                <option value="14">14</option>
                                <option value="21">21</option>
                                <option value="30">30</option>
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Automatic Calculations Bar */}
                        <div className="flex items-center gap-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                           <div className="flex-1">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Total de Unidades</p>
                              <p className="text-sm font-black text-[#006747]">{item.totalUnits} {item.form.toLowerCase()}(s)</p>
                           </div>
                           <div className="flex-1 border-l border-emerald-100/50 pl-4">
                              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Término previsto</p>
                              <p className="text-sm font-black text-gray-800">{new Date(item.endDate).toLocaleDateString('pt-PT')}</p>
                           </div>
                        </div>

                        {/* Special Instructions */}
                        <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Instrução Especial (Opcional)</label>
                          <input 
                            type="text"
                            value={item.specialInstructions}
                            onChange={(e) => updateItem(index, 'specialInstructions', e.target.value)}
                            placeholder="Ex: Tomar após as refeições ou antes de dormir"
                            className="w-full bg-gray-50 border-none rounded-2xl py-3 px-4 text-xs font-medium focus:ring-2 focus:ring-[#006747]/20"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                      <Hash className="w-3.5 h-3.5 text-[#006747]" />
                      <span className="text-[9px] font-black text-[#006747] uppercase tracking-widest">Aguardando assinatura digital</span>
                  </div>
                  <span className="text-[9px] font-bold text-[#006747]">{new Date().toLocaleDateString('pt-PT')}</span>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-900 text-white rounded-3xl p-5 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-gray-200 flex items-center justify-center space-x-2 hover:bg-black transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Emitir Receita The Cedav</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
