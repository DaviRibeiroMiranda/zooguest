import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, Play, AlertCircle } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { entrarComGoogle, entrarComEmail, cadastrarComEmail, jogarComoConvidado } = useAuth();
  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!email || !senha) {
      setErro('Preencha seu e-mail e sua senha.');
      return;
    }

    if (modo === 'registro' && !nome.trim()) {
      setErro('Informe seu nome para o ranking.');
      return;
    }

    try {
      setCarregando(true);
      if (modo === 'login') {
        await entrarComEmail(email, senha);
      } else {
        await cadastrarComEmail(nome, email, senha);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setErro('E-mail ou senha incorretos.');
      } else if (msg.includes('email-already-in-use')) {
        setErro('Este e-mail já está cadastrado. Alterne para Entrar.');
      } else if (msg.includes('weak-password')) {
        setErro('A senha deve possuir pelo menos 6 caracteres.');
      } else {
        setErro(err.message || 'Não foi possível autenticar.');
      }
    } finally {
      setCarregando(false);
    }
  };

  const handleGoogle = async () => {
    setErro(null);
    try {
      setCarregando(true);
      await entrarComGoogle();
    } catch (err: any) {
      setErro(err.message || 'Falha ao autenticar com a Conta Google.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center px-4 py-8">
      <div className="w-full max-w-sm mx-auto">
        {/* Marca & Título */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-[#F9A620]">
            zooGuest
          </h1>
          <p className="text-sm text-slate-300 mt-2">
            Adivinhe o animal pelas características e dispute o ranking global
          </p>
        </div>

        {erro && (
          <div className="mb-5 p-3 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {/* Botão de Login com Google - Sharp com Paleta */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={carregando}
          className="w-full h-11 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 transition-colors disabled:opacity-60 cursor-pointer shadow-sm border border-slate-300"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuar com Google</span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#403D58]" />
          </div>
          <span className="relative px-3 bg-slate-950 text-xs text-slate-400 uppercase tracking-wider">
            ou com e-mail
          </span>
        </div>

        {/* Formulário E-mail / Senha */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === 'registro' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nome de Jogador
              </label>
              <input
                type="text"
                placeholder="Seu nome ou apelido"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full h-11 px-3 bg-slate-900 border border-[#403D58] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F9A620] transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
              autoComplete="email"
              className="w-full h-11 px-3 bg-slate-900 border border-[#403D58] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F9A620] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              placeholder="Mínimo de 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              className="w-full h-11 px-3 bg-slate-900 border border-[#403D58] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#F9A620] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full h-11 bg-[#F9A620] hover:bg-[#F9A620]/90 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {carregando ? (
              <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : modo === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> Entrar
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> Criar Conta
              </>
            )}
          </button>
        </form>

        {/* Rodapé: Alternador de Modo & Convidado */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => {
              setModo(modo === 'login' ? 'registro' : 'login');
              setErro(null);
            }}
            className="text-slate-300 hover:text-[#F9A620] underline underline-offset-4 cursor-pointer transition-colors"
          >
            {modo === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Fazer login'}
          </button>

          <button
            type="button"
            onClick={jogarComoConvidado}
            className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-[#F9A620]" />
            <span>Modo Visitante</span>
          </button>
        </div>
      </div>
    </div>
  );
};
