import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ShieldCheck, 
  Search, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  FileText,
  Lock
} from 'lucide-react';
import { motion } from 'motion/react';

export default function PrescriptionSearch() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Garantir que o usuário está logado antes da chamada
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('🔍 Debug: Iniciando busca de receita');
      console.log('👤 Usuário Autenticado:', session?.user?.email || 'Nenhum');
      console.log('🎫 Código enviado:', cleanCode);

      if (!session) {
        setError('Você precisa estar autenticado para consultar uma receita.');
        setLoading(false);
        return;
      }

      // 2. Chamada da RPC
      const { data, error: rpcError } = await supabase.rpc('get_prescription_by_signature_code', {
        signature_code_in: cleanCode
      });

      console.log('📡 Resposta da RPC (Data):', data);
      
      if (rpcError) {
        console.error('❌ Erro da RPC (Detalhes Completos):', JSON.stringify(rpcError, null, 2));
        
        // Tratar erro específico de coluna não encontrada (stale function in DB)
        if (rpcError.code === '42703') {
          setError('Erro técnico no servidor (coluna não encontrada). Por favor, contacte o administrador para atualizar as funções SQL.');
        } else if (rpcError.message.includes('permission')) {
          setError('Você não tem permissão para visualizar esta receita.');
        } else {
          setError(`Erro ao consultar receita: ${rpcError.message}`);
        }
        setLoading(false);
        return;
      }

      // 3. Tratar caso de sucesso mas sem resultado ou com erro de permissão
      if (!data) {
        console.warn('⚠️ Receita não encontrada na base de dados.');
        setError('Receita não encontrada. Verifique o código e tente novamente.');
      } else if ((data as any).error_code === 'UNAUTHORIZED') {
        console.warn('⛔ Erro de autorização retornado pela RPC');
        setError('Você precisa estar autenticado para visualizar esta receita.');
      } else {
        console.log('✅ Receita encontrada com sucesso! ID:', data.id);
        // 4. Redireciona para visualizar os detalhes
        navigate(`/verificar-receita/${data.id}`);
      }
    } catch (err: any) {
      console.error('RPC Error:', err);
      // Tratar erros de rede ou genéricos
      setError(err.message || 'Código inválido ou erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
           <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-6 border border-emerald-50">
              <ShieldCheck className="w-10 h-10 text-[#006747]" />
           </div>
           <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">Acesso The Cedav</h1>
           <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Portal de Acesso a Prescrições Angola</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Lock className="w-24 h-24" />
          </div>

          <form onSubmit={handleSearch} className="space-y-6 relative z-10">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">
                Código da Receita ou ID
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                <input 
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: CEDAV-XXXX-..."
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-black focus:ring-2 focus:ring-[#006747]/20 outline-none transition-all"
                />
              </div>
              <p className="text-[9px] text-gray-400 mt-3 px-4 font-medium italic">
                O código encontra-se no cabeçalho ou rodapé do documento digital emitido pelo profissional.
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 p-4 rounded-2xl flex items-center space-x-3 text-red-600 border border-red-100"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-xs font-bold">{error}</p>
              </motion.div>
            )}

            <button 
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-gray-900 text-white rounded-2xl p-5 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-gray-200 flex items-center justify-center space-x-2 hover:bg-black transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>Aceder à Prescrição</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-6">
           <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gray-300" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Protocolo The Cedav 1.0</span>
           </div>
           <div className="w-1 h-1 bg-gray-200 rounded-full" />
           <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500/30" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Criptografia RSA</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
