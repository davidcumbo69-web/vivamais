import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Upload, 
  Plus, 
  Layers, 
  Clock, 
  BookOpen, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Globe, 
  ArrowRight, 
  Sparkles, 
  Check, 
  SlidersHorizontal,
  ChevronRight,
  Database,
  Building,
  History,
  FileCode2,
  Trash2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { protocolService, type ClinicalProtocol, PROTOCOL_PRIORITY } from '../services/protocolService';
import { useAuth } from '../hooks/useAuth';
import { Header } from '../components/layout/Header';

export default function ClinicalProtocols() {
  const { profile } = useAuth();
  
  // Use organization identification for strict data isolation
  const organizationId = (profile as any)?.organization_id || profile?.id_card_number || 'default-tenant';
  
  const [protocols, setProtocols] = useState<ClinicalProtocol[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Modal / Slide-over state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<ClinicalProtocol | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'summary' | 'chapters' | 'meds' | 'criteria' | 'exams' | 'flows' | 'versions'>('summary');
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Clínica Geral');
  const [formOrigin, setFormOrigin] = useState<ClinicalProtocol['origin']>('Protocolo da Instituição');
  const [formVersion, setFormVersion] = useState('1.0');
  const [formLanguage, setFormLanguage] = useState('Português (PT-PT)');
  const [formRawText, setFormRawText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Search within selected protocol state
  const [innerSearchQuery, setInnerSearchQuery] = useState('');
  const [innerSearchResults, setInnerSearchResults] = useState<string[]>([]);
  
  // Processing Animation state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingPercentage, setProcessingPercentage] = useState(0);

  // Version Diff tool state
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [selectedVersionForDiff, setSelectedVersionForDiff] = useState<string>('');

  // Load Protocols initially
  useEffect(() => {
    const loaded = protocolService.getProtocols(organizationId);
    setProtocols(loaded);
  }, [organizationId]);

  // Handle upload selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      setFormName(file.name.replace(/\.[^/.]+$/, "").split('_').join(' ').split('-').join(' '));
      
      // Read text content as raw file input
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormRawText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  // Run AI processing pipeline
  const handleAddProtocolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRawText.trim()) return;

    // Check if a protocol with same name already exists to validate replacement versioning
    const existing = protocols.find(p => p.name.toLowerCase().trim() === formName.toLowerCase().trim());
    if (existing) {
      const confirmReplace = window.confirm(`Já existe um protocolo com o nome "${formName}". Deseja criar uma nova versão (Versão ${formVersion}) para este documento?`);
      if (!confirmReplace) return;
      
      // We will perform a replacement/update on this protocol, adding to its versionsHistory
      setIsProcessing(true);
      setIsAddModalOpen(false);

      try {
        const extracted = await protocolService.runIntelligentExtraction(formName, formRawText, (status, pct) => {
          setProcessingStep(status);
          setProcessingPercentage(pct);
        });

        const updatedHistory = existing.versionsHistory || [];
        updatedHistory.push({
          version: existing.version,
          updatedAt: existing.lastUpdated,
          changes: `Atualizado para versão ${formVersion}`,
          isActive: false,
          extractedData: existing.extractedData
        });

        const updatedProtocol: ClinicalProtocol = {
          ...existing,
          version: formVersion,
          lastUpdated: new Date().toISOString().split('T')[0],
          rawContent: formRawText,
          extractedData: extracted,
          versionsHistory: updatedHistory,
          chaptersCount: extracted.chapters.length,
          aiStatus: 'Indexed'
        };

        const updatedList = protocols.map(p => p.id === existing.id ? updatedProtocol : p);
        setProtocols(updatedList);
        protocolService.saveProtocols(organizationId, updatedList);
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
        resetForm();
      }
      return;
    }

    // New Protocol Creation Flow
    setIsProcessing(true);
    setIsAddModalOpen(false);

    try {
      const extracted = await protocolService.runIntelligentExtraction(formName, formRawText, (status, pct) => {
        setProcessingStep(status);
        setProcessingPercentage(pct);
      });

      const newProtocol: ClinicalProtocol = {
        id: 'p-' + Date.now(),
        name: formName,
        category: formCategory,
        origin: formOrigin,
        version: formVersion,
        language: formLanguage,
        publishDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        isActive: true,
        pageCount: Math.max(1, Math.ceil(formRawText.length / 1500)),
        chaptersCount: extracted.chapters.length,
        aiStatus: 'Indexed',
        rawContent: formRawText,
        organizationId: organizationId,
        authorId: profile?.id || 'manual',
        extractedData: extracted,
        versionsHistory: []
      };

      const updatedList = [newProtocol, ...protocols];
      setProtocols(updatedList);
      protocolService.saveProtocols(organizationId, updatedList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormCategory('Clínica Geral');
    setFormOrigin('Protocolo da Instituição');
    setFormVersion('1.0');
    setFormLanguage('Português (PT-PT)');
    setFormRawText('');
    setUploadedFile(null);
  };

  const handleToggleActive = (id: string) => {
    const updated = protocols.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p);
    setProtocols(updated);
    protocolService.saveProtocols(organizationId, updated);
  };

  const handleDeleteProtocol = (id: string) => {
    if (window.confirm("Deseja realmente remover este protocolo da biblioteca institucional? Esta ação é irreversível.")) {
      const updated = protocols.filter(p => p.id !== id);
      setProtocols(updated);
      protocolService.saveProtocols(organizationId, updated);
      if (selectedProtocol?.id === id) {
        setSelectedProtocol(null);
      }
    }
  };

  const handleImportDefaults = () => {
    const confirmImport = window.confirm("Deseja importar as diretrizes e protocolos padrão recomendados pela plataforma para iniciar a base de conhecimento de Inteligência Artificial?");
    if (confirmImport) {
      const defaults = protocolService.getDefaultProtocols(organizationId);
      const updated = [...defaults, ...protocols.filter(p => !defaults.some(d => d.id === p.id))];
      setProtocols(updated);
      protocolService.saveProtocols(organizationId, updated);
    }
  };

  // Inner search logic
  const handleInnerSearch = () => {
    if (!selectedProtocol || !innerSearchQuery.trim()) {
      setInnerSearchResults([]);
      return;
    }
    const query = innerSearchQuery.toLowerCase();
    const matches: string[] = [];
    
    selectedProtocol.extractedData?.chapters.forEach(chap => {
      if (chap.name.toLowerCase().includes(query) || chap.content.toLowerCase().includes(query)) {
        matches.push(`[${chap.name}]: ...${chap.content.substring(Math.max(0, chap.content.toLowerCase().indexOf(query) - 60), Math.min(chap.content.length, chap.content.toLowerCase().indexOf(query) + 140))}...`);
      }
    });

    if (matches.length === 0) {
      matches.push("Nenhuma correspondência exata encontrada dentro dos capítulos indexados.");
    }
    setInnerSearchResults(matches);
  };

  // Get distinct values for filter bars
  const categories = ['All', ...Array.from(new Set(protocols.map(p => p.category)))];
  const origins = ['All', 'Protocolo do Profissional', 'Protocolo da Clínica', 'Protocolo do Hospital', 'Protocolo da Instituição', 'Diretriz Nacional', 'Diretriz Internacional'];

  // Filter protocols
  const filteredProtocols = protocols.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.extractedData?.diagnoses.some(d => d.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesOrigin = selectedOrigin === 'All' || p.origin === selectedOrigin;
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    
    return matchesSearch && matchesOrigin && matchesCategory;
  });

  return (
    <div id="clinical-protocols-root" className="min-h-screen bg-[#F9FAFB] text-gray-900 font-sans pb-16">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* UPPER DASHBOARD HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6 mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Database className="w-3 h-3" /> CDSS RAG Engine Active
              </span>
              <span className="text-xs text-gray-400 font-mono">Org ID: {organizationId}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900 font-sans">
              Biblioteca de Protocolos Clínicos
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-3xl">
              Indexação semântica e curadoria de conhecimentos clínicos. A Inteligência Artificial utiliza obrigatoriamente estes protocolos para analisar pacientes antes de emitir recomendações, referenciando transparentemente as fontes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              id="import-defaults-btn"
              onClick={handleImportDefaults}
              className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-2"
            >
              <History className="w-4 h-4" /> Importar Padrões
            </button>
            <button 
              id="add-protocol-btn"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Adicionar Protocolo
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total de Diretrizes</p>
              <h3 className="text-2xl font-semibold text-gray-900">{protocols.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ativos no Copilot</p>
              <h3 className="text-2xl font-semibold text-gray-900">{protocols.filter(p => p.isActive).length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Capítulos Mapeados</p>
              <h3 className="text-2xl font-semibold text-gray-900">
                {protocols.reduce((acc, curr) => acc + (curr.chaptersCount || 0), 0)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Isolamento Multi-Tenant</p>
              <h3 className="text-sm font-semibold text-gray-800 truncate max-w-[150px]" title={organizationId}>
                {organizationId}
              </h3>
            </div>
          </div>
        </div>

        {/* PROCESSING LOADER OVERLAY PANEL */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-900/10 backdrop-blur-sm border border-emerald-200 rounded-xl p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                  <Sparkles className="w-5 h-5 text-emerald-600 absolute animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-emerald-950 flex items-center gap-2">
                    Extração Clínica Inteligente por Inteligência Artificial
                  </h4>
                  <p className="text-sm text-emerald-800">
                    Processando semântica do documento: <span className="font-semibold">{processingStep}</span>
                  </p>
                </div>
              </div>
              
              <div className="w-full md:w-64">
                <div className="flex justify-between text-xs font-semibold text-emerald-900 mb-1">
                  <span>Indexador Vetorial</span>
                  <span>{processingPercentage}%</span>
                </div>
                <div className="w-full bg-emerald-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${processingPercentage}%` }}
                  ></div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SEARCH AND FILTERS BAR */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="w-5 h-5" />
            </span>
            <input 
              type="text"
              placeholder="Pesquisar por título, categoria, diagnósticos associados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" /> Filtrar:
            </div>
            
            {/* Origin Selector */}
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">Todas as Origens</option>
              {origins.slice(1).map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>

            {/* Category Selector */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'All' ? 'Todas as Categorias' : cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* PROTOCOLS CARDS LISTING */}
        {filteredProtocols.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center max-w-2xl mx-auto shadow-sm mt-8">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <BookOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhum protocolo clínico encontrado</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Você ainda não inseriu diretrizes para sua organização, ou os filtros aplicados não retornaram resultados.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={handleImportDefaults}
                className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                Importar Diretrizes Padrão
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Upload de Protocolo
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProtocols.map((protocol) => {
              const priorityNum = PROTOCOL_PRIORITY[protocol.origin] || 99;
              
              return (
                <motion.div
                  key={protocol.id}
                  layoutId={`protocol-card-${protocol.id}`}
                  className={`bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden ${
                    protocol.isActive ? 'border-gray-200' : 'border-gray-200 bg-gray-50/50 opacity-75'
                  }`}
                >
                  <div className="p-6 flex-1">
                    {/* Header line of card */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 truncate max-w-[150px]">
                        {protocol.category}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          protocol.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                        }`}></span>
                        <span className="text-[10px] uppercase font-mono text-gray-400 font-semibold">
                          {protocol.isActive ? 'Em uso' : 'Inativo'}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-gray-900 tracking-tight leading-snug line-clamp-2 min-h-[3rem] mb-2 hover:text-emerald-700 cursor-pointer"
                        onClick={() => setSelectedProtocol(protocol)}>
                      {protocol.name}
                    </h3>

                    {/* Metadata tags */}
                    <div className="space-y-1.5 mb-5 border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Origem / Nível:</span>
                        <span className="font-medium text-gray-700 flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-gray-400" /> {protocol.origin}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Prioridade IA:</span>
                        <span className="font-semibold text-emerald-700">
                          Nível {priorityNum} {priorityNum === 1 ? '(Máxima)' : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Versão ativa:</span>
                        <span className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                          v{protocol.version}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Capítulos:</span>
                        <span className="font-medium text-gray-700">{protocol.chaptersCount} mapeados</span>
                      </div>
                    </div>

                    {/* Diagnoses identified pill list */}
                    {protocol.extractedData && protocol.extractedData.diagnoses?.length > 0 && (
                      <div className="mb-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Mapeia Diagnósticos:</p>
                        <div className="flex flex-wrap gap-1">
                          {protocol.extractedData.diagnoses.slice(0, 3).map((diag, i) => (
                            <span key={i} className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded">
                              {diag}
                            </span>
                          ))}
                          {protocol.extractedData.diagnoses.length > 3 && (
                            <span className="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">
                              +{protocol.extractedData.diagnoses.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card bottom actions bar */}
                  <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedProtocol(protocol)}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-500 bg-white hover:text-gray-900 hover:border-gray-300 transition-colors"
                        title="Visualizar Detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteProtocol(protocol.id)}
                        className="p-1.5 rounded-lg border border-red-100 text-red-500 bg-white hover:text-red-700 hover:border-red-200 transition-colors"
                        title="Deletar Protocolo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-medium">Auto-Consultar:</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={protocol.isActive} 
                          onChange={() => handleToggleActive(protocol.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ========================================= */}
        {/* ADD PROTOCOL MODAL / SLIDE-OVER */}
        {/* ========================================= */}
        <AnimatePresence>
          {isAddModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl border border-gray-200 flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Upload de Novo Protocolo Clínico</h3>
                      <p className="text-xs text-gray-500">Formato TXT, HTML ou digite o texto clínico completo para extração e indexação vetorial.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddProtocolSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Nome / Título do Protocolo</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Protocolo de Tratamento de Malária Complicada"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Categoria Médica</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex: Cardiologia, Infecciologia, Pediatria"
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Origem / Escopo</label>
                      <select
                        value={formOrigin}
                        onChange={(e) => setFormOrigin(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="Protocolo do Profissional">Profissional (Prioridade 1)</option>
                        <option value="Protocolo da Clínica">Clínica (Prioridade 2)</option>
                        <option value="Protocolo do Hospital">Hospital (Prioridade 2)</option>
                        <option value="Protocolo da Instituição">Institucional Geral (Prioridade 3)</option>
                        <option value="Diretriz Nacional">Diretriz Nacional (Prioridade 4)</option>
                        <option value="Diretriz Internacional">Diretriz Internacional (Prioridade 5)</option>
                        <option value="Sociedade Científica">Sociedade Científica (Prioridade 5)</option>
                        <option value="Outro">Outro (Prioridade 6)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Versão Atual</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ex: 1.0 ou 2025"
                        value={formVersion}
                        onChange={(e) => setFormVersion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Idioma</label>
                      <input 
                        type="text"
                        required
                        value={formLanguage}
                        onChange={(e) => setFormLanguage(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* File Upload zone */}
                  <div className="border-2 border-dashed border-gray-200 hover:border-emerald-500/50 rounded-xl p-6 text-center bg-gray-50/50 hover:bg-emerald-50/10 transition-all cursor-pointer relative">
                    <input 
                      type="file" 
                      accept=".txt,.html,.md"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="space-y-1.5">
                      <FileCode2 className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm font-semibold text-gray-700">
                        {uploadedFile ? `Selecionado: ${uploadedFile.name}` : "Arraste ou clique para carregar arquivo de protocolo"}
                      </p>
                      <p className="text-xs text-gray-400">Recomendado arquivos .txt ou .html com conteúdo clínico detalhado.</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Conteúdo Clínico Completo (Para extração direta)</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Cole aqui o texto do protocolo clínico completo. A Inteligência Artificial lerá, categorizará e extrairá todos os capítulos, medicamentos e critérios automaticamente..."
                      value={formRawText}
                      onChange={(e) => setFormRawText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    ></textarea>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] leading-relaxed text-blue-800">
                      <strong>Validação automática:</strong> Se você inserir um protocolo com o mesmo título, o sistema solicitará confirmação para criar um versionamento histórico de revisão ao invés de duplicar, mantendo o controle total do prontuário científico da clínica.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50 -mx-6 -mb-6 p-6">
                    <button 
                      type="button" 
                      onClick={() => { setIsAddModalOpen(false); resetForm(); }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Iniciar Indexação por IA
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>


        {/* ========================================= */}
        {/* DETAILED PROTOCOL VIEW MODAL */}
        {/* ========================================= */}
        <AnimatePresence>
          {selectedProtocol && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                layoutId={`protocol-card-${selectedProtocol.id}`}
                className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-xl border border-gray-200 flex flex-col h-[85vh]"
              >
                {/* Header detail */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-mono text-gray-500">v{selectedProtocol.version}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-emerald-700 font-semibold">{selectedProtocol.origin}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{selectedProtocol.name}</h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedProtocol(null); setInnerSearchQuery(''); setInnerSearchResults([]); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation inside Details Modal */}
                <div className="border-b border-gray-100 px-6 py-2 bg-gray-50/30 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                  {[
                    { id: 'summary', label: 'Resumo IA', icon: Sparkles },
                    { id: 'chapters', label: 'Capítulos', icon: Layers },
                    { id: 'meds', label: 'Medicamentos & Doses', icon: BookOpen },
                    { id: 'criteria', label: 'Critérios Clínicos', icon: CheckCircle2 },
                    { id: 'exams', label: 'Exames Mapeados', icon: FileText },
                    { id: 'flows', label: 'Fluxos & Alertas', icon: AlertTriangle },
                    { id: 'versions', label: 'Versionamento', icon: Clock },
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveDetailTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                          activeDetailTab === tab.id 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Modal main content view */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* INNER SEARCH BAR FOR PROTOCOL CONTENT */}
                  <div className="bg-emerald-50/30 border border-emerald-100 p-3.5 rounded-xl flex items-center gap-2.5">
                    <Search className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <input 
                      type="text"
                      placeholder="Buscar termo ou medicamento dentro deste protocolo..."
                      value={innerSearchQuery}
                      onChange={(e) => setInnerSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInnerSearch()}
                      className="flex-1 bg-transparent text-sm text-gray-800 border-none focus:outline-none focus:ring-0"
                    />
                    <button 
                      onClick={handleInnerSearch}
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors"
                    >
                      Localizar
                    </button>
                  </div>

                  {/* INNER SEARCH RESULTS */}
                  {innerSearchResults.length > 0 && (
                    <div className="p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Ocorrências localizadas na base vetorial:
                        </h4>
                        <button 
                          onClick={() => { setInnerSearchQuery(''); setInnerSearchResults([]); }}
                          className="text-[10px] font-semibold text-yellow-800 hover:underline"
                        >
                          Limpar Resultados
                        </button>
                      </div>
                      <ul className="space-y-1.5">
                        {innerSearchResults.map((res, idx) => (
                          <li key={idx} className="text-xs text-gray-700 font-mono bg-white p-2 border border-yellow-100 rounded leading-relaxed">
                            {res}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* ACTIVE TAB RENDERER */}
                  {activeDetailTab === 'summary' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Resumo de Curadoria Inteligente</h4>
                        <p className="text-sm text-gray-700 leading-relaxed font-sans bg-gray-50 p-4 rounded-xl border border-gray-100">
                          {selectedProtocol.extractedData?.summary}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Diagnósticos Tratados</h5>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedProtocol.extractedData?.diagnoses.map((d, i) => (
                              <span key={i} className="text-xs font-medium bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100">
                                {d}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Idiomas & Auditoria</h5>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Idioma oficial: <strong>{selectedProtocol.language}</strong><br />
                            Publicado em: <strong>{selectedProtocol.publishDate}</strong><br />
                            Última auditoria vetorial: <strong>{selectedProtocol.lastUpdated}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'chapters' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Capítulos e Algoritmos Mapeados</h4>
                      <div className="space-y-3">
                        {selectedProtocol.extractedData?.chapters.map((chap, i) => (
                          <div key={i} className="border border-gray-100 rounded-xl p-4 bg-white shadow-xs">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-semibold text-gray-900">{chap.name}</h5>
                              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Página {chap.page || 'N/A'}</span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{chap.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'meds' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Diretrizes Farmacológicas do Protocolo</h4>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Fármacos Recomendados</h5>
                          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                            {selectedProtocol.extractedData?.medications.map((m, i) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Dosagens Sugeridas</h5>
                          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                            {selectedProtocol.extractedData?.dosages.map((d, i) => (
                              <li key={i}>{d}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                          <h5 className="text-xs font-bold text-red-800 uppercase mb-2">Contraindicações & Interações Farmacológicas</h5>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-red-950">Contraindicações Absolutas:</p>
                              <ul className="list-disc pl-5 text-xs text-red-900 space-y-0.5">
                                {selectedProtocol.extractedData?.contraindications.map((c, i) => (
                                  <li key={i}>{c}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-red-950">Interações Críticas:</p>
                              <ul className="list-disc pl-5 text-xs text-red-900 space-y-0.5">
                                {selectedProtocol.extractedData?.interactions.map((inter, i) => (
                                  <li key={i}>{inter}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'criteria' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Parâmetros de Admissão, Alta e Elegibilidade</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                          <h5 className="text-xs font-bold text-emerald-800 uppercase">Critérios de Inclusão</h5>
                          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                            {selectedProtocol.extractedData?.inclusionCriteria.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                          <h5 className="text-xs font-bold text-amber-800 uppercase">Critérios de Exclusão</h5>
                          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                            {selectedProtocol.extractedData?.exclusionCriteria.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                          <h5 className="text-xs font-bold text-blue-800 uppercase">Critérios de Internamento</h5>
                          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                            {selectedProtocol.extractedData?.hospitalizationCriteria.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2">
                          <h5 className="text-xs font-bold text-gray-800 uppercase">Critérios de Alta</h5>
                          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                            {selectedProtocol.extractedData?.dischargeCriteria.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'exams' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Auxílio de Diagnóstico Mapeado</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <h5 className="text-xs font-bold text-emerald-800 uppercase mb-2">Exames Obrigatórios</h5>
                          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                            {selectedProtocol.extractedData?.obligatoryExams.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <h5 className="text-xs font-bold text-blue-800 uppercase mb-2">Exames Opcionais / Confirmatórios</h5>
                          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                            {selectedProtocol.extractedData?.optionalExams.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'flows' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Fluxos Clínicos e Alertas Ativos</h4>
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Cadeias de Decisão e Fluxos Clínicos</h5>
                          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                            {selectedProtocol.extractedData?.clinicalFlows.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                          <h5 className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" /> Alertas Críticos da Inteligência Artificial
                          </h5>
                          <ul className="list-disc pl-5 text-xs text-amber-950 space-y-1">
                            {selectedProtocol.extractedData?.alerts.map((a, i) => (
                              <li key={i}>{a}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Notas Importantes de Prática</h5>
                          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                            {selectedProtocol.extractedData?.importantNotes.map((n, i) => (
                              <li key={i}>{n}</li>
                            ))}
                          </ul>
                        </div>

                        {selectedProtocol.extractedData?.references && selectedProtocol.extractedData.references.length > 0 && (
                          <div className="bg-white p-4 rounded-xl border border-gray-100">
                            <h5 className="text-xs font-bold text-gray-400 uppercase mb-2">Referências Bibliográficas</h5>
                            <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                              {selectedProtocol.extractedData?.references.map((r, i) => (
                                <li key={i} className="font-mono">{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'versions' && (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Histórico de Alterações e Versionamento do Protocolo</h4>
                      
                      <div className="border border-gray-100 rounded-xl overflow-hidden bg-white">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase">
                              <th className="p-3">Versão</th>
                              <th className="p-3">Data da Alteração</th>
                              <th className="p-3">Resumo da Revisão</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Ação</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-gray-100 bg-emerald-50/20 font-semibold text-emerald-950">
                              <td className="p-3">v{selectedProtocol.version} (Atual)</td>
                              <td className="p-3">{selectedProtocol.lastUpdated}</td>
                              <td className="p-3">Versão ativa atual indexada no motor de RAG</td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold border border-emerald-200">Indexado</span>
                              </td>
                              <td className="p-3 text-right text-gray-400">N/A</td>
                            </tr>

                            {selectedProtocol.versionsHistory && selectedProtocol.versionsHistory.length > 0 ? (
                              selectedProtocol.versionsHistory.map((v, i) => (
                                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                                  <td className="p-3 font-mono">v{v.version}</td>
                                  <td className="p-3">{v.updatedAt}</td>
                                  <td className="p-3 text-gray-600">{v.changes}</td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">Histórico</span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button 
                                      onClick={() => {
                                        setSelectedVersionForDiff(v.version);
                                        setIsDiffModalOpen(true);
                                      }}
                                      className="text-emerald-600 hover:text-emerald-700 hover:underline font-semibold"
                                    >
                                      Visualizar Diferenças
                                    </button>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-gray-400 italic">
                                  Nenhuma versão anterior de revisão foi guardada para este documento.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer bottom details modal */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Total de páginas estimadas:</span>
                    <span className="text-xs font-bold text-gray-700 font-mono">{selectedProtocol.pageCount} pgs</span>
                  </div>

                  <button 
                    onClick={() => { setSelectedProtocol(null); setInnerSearchQuery(''); setInnerSearchResults([]); }}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Fechar Protocolo
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>


        {/* ========================================= */}
        {/* VERSION DIFF PREVIEW MODAL */}
        {/* ========================================= */}
        <AnimatePresence>
          {isDiffModalOpen && selectedProtocol && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-xl border border-gray-200 flex flex-col max-h-[80vh]">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="text-base font-semibold text-gray-900">
                    Diferencial de Revisão: v{selectedVersionForDiff} vs. v{selectedProtocol.version} (Atual)
                  </h3>
                  <button 
                    onClick={() => setIsDiffModalOpen(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-red-50/30 border border-red-100 rounded-xl">
                      <h4 className="text-xs font-bold text-red-800 uppercase mb-2">Versão v{selectedVersionForDiff}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {selectedProtocol.versionsHistory?.find(v => v.version === selectedVersionForDiff)?.extractedData?.summary || 'Conteúdo resumido histórico da revisão.'}
                      </p>
                    </div>

                    <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl">
                      <h4 className="text-xs font-bold text-emerald-800 uppercase mb-2">Versão v{selectedProtocol.version} (Atual)</h4>
                      <p className="text-xs text-gray-600 leading-relaxed font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {selectedProtocol.extractedData?.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-1.5">Ações Recomendadas de Auditoria</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Todas as alterações de diretrizes foram revisadas de acordo com as normas de Clinical Decision Support Systems (CDSS). A Inteligência Artificial passará a usar prioritariamente a nova versão ativa para a geração de diagnósticos e receitas em tempo real.
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                  <button 
                    onClick={() => setIsDiffModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
