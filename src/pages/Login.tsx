import React, { useState } from 'react';
import { supabase, isConfigured } from '../lib/supabase';
import { ShieldCheck, ArrowRight, User as UserIcon, Lock, Mail, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setMessage('Erro: Configuração do Supabase em falta. Verifique as "Secrets".');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        setMessage('Conta criada! Verifique o seu email para confirmar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#dae0e6] px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-[#006747] mb-2 tracking-tighter">VIVA+</h1>
          <p className="text-gray-500 font-medium tracking-wide">A Rede de Saúde do SNS</p>
        </div>

        {!isConfigured && (
          <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
               <p className="font-bold mb-1">Configuração Necessária</p>
               <p>Deve configurar <b>VITE_SUPABASE_URL</b> e <b>VITE_SUPABASE_ANON_KEY</b> nas Secrets do AI Studio para que o sistema de login funcione.</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Nome Completo"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isRegistering}
                />
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="Endereço de Email"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="password"
                placeholder="Palavra-passe"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#006747] text-white py-3 rounded-lg font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'A processar...' : isRegistering ? 'Criar Conta' : 'Entrar na Conta'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="flex items-center space-x-4 py-2">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400 font-bold uppercase">Ou</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <button className="w-full bg-black text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center space-x-2 hover:bg-gray-900 transition-colors">
            <ShieldCheck className="w-5 h-5 text-yellow-400" />
            <span>Chave Móvel Digital</span>
          </button>

          {message && (
            <p className="text-center text-xs text-[#006747] mt-4 font-medium leading-relaxed bg-emerald-50 p-2 rounded">
              {message}
            </p>
          )}
        </div>

        <div className="mt-6 text-center border border-gray-200 bg-white p-6 rounded-xl">
          <p className="text-sm text-gray-600">
            {isRegistering ? 'Já tem uma conta?' : 'Ainda não tem conta?'} 
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setMessage('');
              }}
              className="text-[#006747] font-bold ml-1 hover:underline underline-offset-4"
            >
              {isRegistering ? 'Inicie sessão' : 'Registe-se'}
            </button>
          </p>
        </div>
      </div>

      <div className="mt-auto py-8 flex flex-col items-center space-y-4">
          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/SNS_Logotipo.svg" alt="SNS Logo" className="h-8 opacity-60 grayscale brightness-0" />
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Ministério da Saúde • Portugal</p>
      </div>
    </div>
  );
}
