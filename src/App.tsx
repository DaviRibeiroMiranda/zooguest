/**
 * ============================================================================
 * COMPONENTE RAIZ DA APLICAÇÃO — zooGuest (App.tsx)
 * ============================================================================
 * Orquestra a navegação e a hierarquia principal da interface:
 * 1. Inicializa o `AuthProvider` para fornecer o contexto de autenticação a todos os filhos.
 * 2. Verifica se há usuário autenticado ou visitante ativo; se não, exibe a `LoginScreen`.
 * 3. Renderiza a fotografia botânica de floresta como plano de fundo imersivo durante o jogo.
 * 4. Controla as abas principais: Tabuleiro de Dedução (`GameBoard`) e Ranking Global (`Leaderboard`).
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { GameBoard } from './components/GameBoard';
import { Leaderboard } from './components/Leaderboard';
import { Gamepad2, Trophy, LogOut } from 'lucide-react';
import forestBg from './assets/images/forest_background_1790488438781.jpg';

function MainApp() {
  // Consome a sessão do jogador vinda do AuthContext
  const { user, jogador, loading, isGuest, sair, guestPontuacao } = useAuth();

  // Estado que alterna entre a aba do jogo e a aba do ranking
  const [activeTab, setActiveTab] = useState<'jogo' | 'ranking'>('jogo');

  // Exibe um spinner elegante enquanto o Firebase Auth verifica os cookies/tokens da sessão
  if (loading) {
    return (
      <div className="min-h-screen bg-[#104911] flex items-center justify-center text-slate-300 text-sm">
        <span className="w-5 h-5 border-2 border-[#403D58] border-t-[#F9A620] animate-spin mr-3" />
        Carregando...
      </div>
    );
  }

  // GUARDA DE AUTENTICAÇÃO: A tela de login é a primeira opção caso o usuário não esteja logado e não seja visitante
  // Observação: NÃO possui imagem de fundo, conforme solicitado pelo usuário
  if (!user && !isGuest) {
    return <LoginScreen />;
  }

  // Pontuação a ser exibida no topo (do Firestore se logado, ou volátil se visitante)
  const pontuacaoAtual = user && jogador ? jogador.pontuacaoTotal : guestPontuacao;

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col relative bg-slate-950"
      style={{
        // Fotografia da floresta aplicada no fundo durante a jogabilidade
        backgroundImage: `url(${forestBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Camada de escurecimento com a paleta florestal (#104911 / #403D58) para contraste impecável e legibilidade */}
      <div className="absolute inset-0 bg-[#104911]/85 bg-gradient-to-b from-[#104911]/95 via-[#104911]/85 to-slate-950/95 pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Barra Superior - Linhas retas, minimalismo e paleta temática */}
        <header className="sticky top-0 z-20 bg-[#104911]/95 backdrop-blur-md border-b border-[#403D58]">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wide text-[#F9A620]">
                zooGuest
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Pontuação e Nome do Jogador */}
              <div className="text-right">
                <div className="text-xs font-bold text-[#F9A620] tabular-nums">
                  {pontuacaoAtual.toLocaleString()} pts
                </div>
                <div className="text-[11px] text-slate-300 truncate max-w-[120px]">
                  {user && jogador ? jogador.nome : 'Visitante'}
                </div>
              </div>

              {/* Botão de Logout ou retorno ao Login */}
              <button
                type="button"
                onClick={sair}
                title={user ? 'Sair da conta' : 'Voltar ao Login'}
                className="w-9 h-9 border border-[#403D58] bg-[#403D58]/40 hover:bg-[#403D58] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Navegação por Abas — Retangular sem bordas arredondadas exageradas */}
        <div className="max-w-lg mx-auto w-full px-4 pt-3">
          <div className="grid grid-cols-2 bg-[#403D58]/60 border border-[#403D58] p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('jogo')}
              className={`h-9 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'jogo'
                  ? 'bg-[#F9A620] text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-[#403D58]/80'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Jogo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ranking')}
              className={`h-9 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                activeTab === 'ranking'
                  ? 'bg-[#F9A620] text-slate-950'
                  : 'text-slate-300 hover:text-white hover:bg-[#403D58]/80'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Ranking</span>
            </button>
          </div>
        </div>

        {/* Conteúdo Principal Alternado por Aba */}
        <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">
          {activeTab === 'jogo' ? <GameBoard /> : <Leaderboard />}
        </main>
      </div>
    </div>
  );
}

/**
 * Ponto de entrada padrão exportado que encapsula a aplicação no Provedor de Autenticação
 */
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
