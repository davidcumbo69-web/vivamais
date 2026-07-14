import React, { useState } from 'react';
import { 
  FileText, Plus, Trash2, Calendar, Search, Sparkles, Brain, CheckCircle, 
  Clock, Download, Upload, AlertCircle, ArrowUpRight, TrendingDown, RefreshCw
} from 'lucide-react';

interface ExamsTabProps {
  selectedPatient: any;
  showNotification: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function ExamsTab({ selectedPatient, showNotification }: ExamsTabProps) {
  const [exams, setExams] = useState<any[]>([
    { id: '1', name: 'Hemograma Completo', type: 'Hematologia', date: '10/07/2026', status: 'Concluído', lab: 'LabClin Unilabs', file: 'hemograma_1007.pdf', results: [
      { param: 'Hemoglobina', val: '14.2', unit: 'g/dL', range: '12.0 - 16.0', status: 'Normal' },
      { param: 'Leucócitos', val: '6,400', unit: '/µL', range: '4,000 - 11,000', status: 'Normal' },
      { param: 'Plaquetas', val: '245,000', unit: '/µL', range: '150,000 - 450,000', status: 'Normal' }
    ] },
    { id: '2', name: 'Perfil Lipídico & Renal', type: 'Bioquímica', date: '10/07/2026', status: 'Concluído', lab: 'LabClin Unilabs', file: 'lipidico_1007.pdf', results: [
      { param: 'Colesterol Total', val: '215', unit: 'mg/dL', range: '< 200', status: 'Elevado' },
      { param: 'Colesterol LDL', val: '135', unit: 'mg/dL', range: '< 100', status: 'Elevado' },
      { param: 'Colesterol HDL', val: '48', unit: 'mg/dL', range: '> 40', status: 'Normal' },
      { param: 'Creatinina Sérica', val: '0.92', unit: 'mg/dL', range: '0.60 - 1.20', status: 'Normal' },
      { param: 'Ureia', val: '38', unit: 'mg/dL', range: '15 - 45', status: 'Normal' }
    ] },
    { id: '3', name: 'Ecocardiograma Transtorácico', type: 'Imagem / Cardiologia', date: '05/07/2026', status: 'Concluído', lab: 'CardioCare Clinic', file: 'eco_0507.pdf', results: [
      { param: 'Fração de Ejeção (FEVE)', val: '62', unit: '%', range: '55 - 70', status: 'Normal' },
      { param: 'Diâmetro Diastólico VE', val: '4.8', unit: 'cm', range: '3.7 - 5.3', status: 'Normal' }
    ] },
    { id: '4', name: 'Radiografia de Tórax (PA/Perfil)', type: 'Imagem', date: '18/06/2026', status: 'Concluído', lab: 'ImagiCentro', file: 'rx_torax.pdf', summary: 'Campos pleuropulmonares limpos. Silhueta cardíaca dentro dos limites normais da idade.' }
  ]);

  const [requestedExams, setRequestedExams] = useState<any[]>([
    { id: '101', name: 'MAPA de 24 horas', type: 'Cardiologia', dateRequested: '14/07/2026', priority: 'Urgente', status: 'Agendado' },
    { id: '102', name: 'Doseamento de Hemoglobina Glicada (HbA1c)', type: 'Bioquímica', dateRequested: '14/07/2026', priority: 'Rotina', status: 'Pendente' }
  ]);

  // Requesting Exams States
  const [newExamName, setNewExamName] = useState('');
  const [newExamType, setNewExamType] = useState('Bioquímica');
  const [newExamPriority, setNewExamPriority] = useState('Rotina');

  // Interpretation State
  const [interpreting, setInterpreting] = useState(false);
  const [interpretation, setInterpretation] = useState<string | null>(null);

  const handleRequestExam = () => {
    if (!newExamName.trim()) return;
    const req = {
      id: Date.now().toString(),
      name: newExamName,
      type: newExamType,
      dateRequested: new Date().toLocaleDateString('pt-PT'),
      priority: newExamPriority,
      status: 'Pendente'
    };
    setRequestedExams(prev => [req, ...prev]);
    setNewExamName('');
    showNotification(`Requisição para '${newExamName}' registada com sucesso!`, "success");
  };

  const handleRemoveRequested = (id: string) => {
    setRequestedExams(prev => prev.filter(r => r.id !== id));
    showNotification("Requisição cancelada.", "info");
  };

  const handleInterpretLab = () => {
    setInterpreting(true);
    setInterpretation(null);
    setTimeout(() => {
      setInterpretation(
        `PARECER DE INTERPRETAÇÃO DE EXAMES LABORATORIAIS (IA CO-PILOTO):\n\n` +
        `1. HEMATOLOGIA (10/07/2026): Série vermelha e plaquetária totalmente preservadas. Sem sinais clínicos de anemia, leucocitose ou plaquetopénia.\n\n` +
        `2. PERFIL LIPÍDICO: Detetada dislipidemia hipercolesterolémica moderada com Colesterol Total de 215 mg/dL (Desejável < 200) e LDL de 135 mg/dL (Desejável < 100). Recomenda-se reforço das medidas dietéticas de restrição de gorduras saturadas e manutenção de Sinvastatina/Atorvastatina se indicado pelo perfil de risco global do paciente.\n\n` +
        `3. PERFIL RENAL: Função glomerular preservada. Creatinina (0.92 mg/dL) e Ureia (38 mg/dL) excelentes, traduzindo segurança para a manutenção de IECA/ARA-II.\n\n` +
        `4. ECOCARDIOGRAMA: Fração de ejeção ventricular preservada (62%), indicando excelente função sistólica global do ventrículo esquerdo.`
      );
      setInterpreting(false);
      showNotification("Interpretação IA laboratorial concluída!", "success");
    }, 1500);
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      
      {/* Overview Block */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Exames e Diagnóstico Complementar</h4>
          <p className="text-xs text-gray-400 mt-1">Registo de análises clínicas, relatórios de imagem e requisições</p>
        </div>

        <button
          onClick={handleInterpretLab}
          disabled={interpreting}
          className="flex items-center justify-center space-x-2 bg-purple-950 hover:bg-purple-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all cursor-pointer"
        >
          <Brain className="w-4 h-4 animate-pulse" />
          <span>{interpreting ? 'A interpretar análises...' : 'Interpretar Exames com IA'}</span>
        </button>
      </div>

      {/* AI Interpretation Box */}
      {interpretation && (
        <div className="bg-purple-50/50 border border-purple-100 p-6 rounded-3xl space-y-3">
          <div className="flex items-center space-x-2 text-purple-950">
            <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
            <h5 className="text-[10px] font-black uppercase tracking-wider">Parecer do Intérprete IA de Laboratório</h5>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
            {interpretation}
          </p>
          <div className="pt-2 text-[9px] text-gray-400 font-medium">
            *Nota: Este parecer é gerado por algoritmo de inteligência clínica avançada para suporte médico. Deve ser sempre validado pelo profissional responsável.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Completed Exams List */}
        <div className="lg:col-span-8 space-y-4">
          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exames Concluídos / Resultados Recentes</h5>
          
          <div className="space-y-4">
            {exams.map((ex) => (
              <div key={ex.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-sm leading-tight">{ex.name}</h4>
                      <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">{ex.type} • {ex.lab}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] font-mono text-gray-400">{ex.date}</span>
                    <span className="bg-emerald-100 text-[#006747] text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                      {ex.status}
                    </span>
                  </div>
                </div>

                {/* Lab parameters values if available */}
                {ex.results && ex.results.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {ex.results.map((res: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50/50 rounded-xl border border-gray-100/50 flex flex-col justify-between">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-wider truncate">{res.param}</p>
                        <div className="flex items-baseline space-x-1.5 mt-1">
                          <span className="text-base font-black text-gray-950">{res.val}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{res.unit}</span>
                        </div>
                        <div className="flex justify-between items-center text-[8px] font-bold mt-1.5 pt-1.5 border-t border-gray-150/40">
                          <span className="text-gray-400">Ref: {res.range}</span>
                          <span className={res.status === 'Elevado' ? 'text-rose-600' : 'text-emerald-600'}>{res.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary text if image report */}
                {ex.summary && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 text-xs text-gray-600 italic">
                    "{ex.summary}"
                  </div>
                )}

                {/* Download PDF handle */}
                <div className="flex justify-end pt-1">
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); showNotification(`Descarregando ${ex.file}...`, "info"); }}
                    className="flex items-center space-x-1 text-[10px] font-black text-blue-600 hover:underline uppercase tracking-wider"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descarregar Relatório Oficial PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Request New Exams Form & Pending Requests */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Form to Request Exams */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requisitar Novo Exame</h5>
            
            <div className="space-y-1">
              <label className="text-[8px] font-black text-gray-400 uppercase">Nome do Exame</label>
              <input
                type="text"
                placeholder="Ex: Doseamento de Creatinina Sérica"
                value={newExamName}
                onChange={(e) => setNewExamName(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase">Grupo / Especialidade</label>
                <select
                  value={newExamType}
                  onChange={(e) => setNewExamType(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20"
                >
                  <option value="Bioquímica">Bioquímica</option>
                  <option value="Hematologia">Hematologia</option>
                  <option value="Imagem">Imagem / RX / TAC</option>
                  <option value="Cardiologia">Cardiologia / ECG</option>
                  <option value="Endocrinologia">Endocrinologia</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-gray-400 uppercase">Prioridade</label>
                <select
                  value={newExamPriority}
                  onChange={(e) => setNewExamPriority(e.target.value)}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#006747]/20"
                >
                  <option value="Rotina">Rotina (Padrão)</option>
                  <option value="Urgente">Urgente</option>
                  <option value="Prioritário">Prioritário</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRequestExam}
              className="w-full flex items-center justify-center space-x-2 bg-[#006747] hover:bg-emerald-900 text-white py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-900/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Emitir Requisição</span>
            </button>
          </div>

          {/* List of Pending / Scheduled requests */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Requisições Ativas / Pendentes</h5>
            
            <div className="space-y-3">
              {requestedExams.map((req) => (
                <div key={req.id} className="p-3 bg-slate-50 rounded-xl border border-gray-100 flex items-start justify-between">
                  <div>
                    <h6 className="font-bold text-xs text-gray-900 leading-tight">{req.name}</h6>
                    <p className="text-[8px] text-gray-400 font-semibold uppercase tracking-wider mt-1">{req.type} • Requisitado em {req.dateRequested}</p>
                    <div className="flex space-x-1.5 mt-2">
                      <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${
                        req.priority === 'Urgente' ? 'bg-rose-100 text-rose-700' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {req.priority}
                      </span>
                      <span className="text-[7px] font-black uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                        {req.status}
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRemoveRequested(req.id)}
                    className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {requestedExams.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nenhuma requisição de exame pendente.</p>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
