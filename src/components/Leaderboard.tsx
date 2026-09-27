/**
 * ============================================================================
 * RANKING EM TEMPO REAL COM FIRESTORE — Leaderboard
 * ============================================================================
 * Este componente consulta e exibe a tabela de líderes dos jogadores ao vivo:
 * 1. Usa `onSnapshot` conectado à coleção `jogadores` no banco de dados `testdatabase`.
 * 2. Ordena os jogadores por `pontuacaoTotal` em ordem decrescente (`orderBy('pontuacaoTotal', 'desc')`).
 * 3. Limita o ranking aos 50 melhores com `limit(50)`.
 * 4. Destaca a linha do jogador atualmente conectado com a tag "(Você)" e borda dourada.
 * 5. Permite excluir a própria ficha do banco (`deleteDoc`) com confirmação de segurança.
 */

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Jogador } from '../types/game';
import { useAuth } from '../context/AuthContext';
import { Search, RefreshCw, Trash2 } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  // Obtém o usuário logado e os dados da ficha do AuthContext
  const { user, jogador } = useAuth();

  // Estados locais
  const [ranking, setRanking] = useState<Jogador[]>([]); // Lista de jogadores carregados do Firestore
  const [loading, setLoading] = useState<boolean>(true); // Indicador de carregamento inicial
  const [busca, setBusca] = useState<string>(''); // Filtro de busca por nome ou e-mail
  const [confirmandoReset, setConfirmandoReset] = useState<boolean>(false); // Modal de confirmação para zerar ficha

  /**
   * EFEITO: Cria o listener em tempo real no Firestore (`onSnapshot`)
   * Qualquer alteração de pontuação em qualquer dispositivo atualiza o ranking instantaneamente!
   */
  useEffect(() => {
    setLoading(true);

    // 1. Aponta para a coleção 'jogadores' dentro do banco 'testdatabase'
    const jogadoresRef = collection(db, 'jogadores');

    // 2. Monta a query: ordena pela maior pontuação total e restringe aos top 50
    const consultaRanking = query(jogadoresRef, orderBy('pontuacaoTotal', 'desc'), limit(50));

    // 3. Inicia o listener de snapshot em tempo real
    const desinscrever = onSnapshot(
      consultaRanking,
      (snapshot) => {
        const lista: Jogador[] = [];
        // Itera sobre os documentos retornados
        snapshot.forEach((docSnap) => {
          lista.push(docSnap.data() as Jogador);
        });
        setRanking(lista);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao ler ranking do Firestore:', error);
        setLoading(false);
      }
    );

    // Função de limpeza: cancela a escuta quando o jogador sai da aba de ranking
    return () => desinscrever();
  }, []);

  /**
   * OPERAÇÃO CRUD (DELETE): Exclui a ficha do jogador atual do Firestore
   */
  const resetarProgresso = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'jogadores', user.uid));
      setConfirmandoReset(false);
    } catch (err) {
      console.error('Erro ao resetar documento no Firestore:', err);
    }
  };

  // Filtra os jogadores pelo nome ou e-mail conforme o usuário digita na busca
  const listaFiltrada = ranking.filter((j) =>
    j.nome.toLowerCase().includes(busca.toLowerCase()) ||
    j.email?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-3 max-w-lg mx-auto pb-10">
      {/* Barra de Busca de Jogadores */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar jogador no ranking..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-[#104911]/90 border border-[#403D58] text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#F9A620] transition-colors"
        />
      </div>

      {/* Lista de Classificação — Linhas retas com paleta botânica */}
      <div className="bg-[#104911]/90 border border-[#403D58] divide-y divide-[#403D58]/60 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-300 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#F9A620]" />
            <span>Carregando ranking em tempo real...</span>
          </div>
        ) : listaFiltrada.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-300">
            Nenhum jogador registrado ainda. Jogue uma rodada para pontuar no ranking!
          </div>
        ) : (
          listaFiltrada.map((item, index) => {
            const isUser = user?.uid === item.uid;
            const posicao = index + 1;

            return (
              <div
                key={item.uid}
                className={`p-3.5 flex items-center justify-between transition-colors ${
                  isUser ? 'bg-[#403D58]/60 border-l-4 border-l-[#F9A620]' : 'hover:bg-[#403D58]/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Posição no Ranking com destaque aos 3 primeiros colocados */}
                  <span
                    className={`w-7 text-center text-xs font-bold tabular-nums ${
                      posicao === 1
                        ? 'text-[#F9A620] font-black'
                        : posicao === 2
                        ? 'text-slate-200'
                        : posicao === 3
                        ? 'text-amber-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {posicao}º
                  </span>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-100">{item.nome}</span>
                      {isUser && (
                        <span className="text-[10px] text-[#F9A620] font-bold uppercase tracking-wider">(Você)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300">
                      {item.vitorias || 0} {item.vitorias === 1 ? 'vitória' : 'vitórias'}
                      {item.melhorTentativa && item.melhorTentativa < 99 && (
                        <span> · Recorde: {item.melhorTentativa}ª tent.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pontuação Total formatada */}
                <div className="text-right">
                  <div className="text-sm font-bold text-[#F9A620] tabular-nums">
                    {(item.pontuacaoTotal || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400">pontos</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Ação de Exclusão de Ficha / Reset com Confirmação Prévia */}
      {user && jogador && (
        <div className="pt-2 text-center">
          {confirmandoReset ? (
            <div className="p-3 bg-[#104911] border border-rose-800 space-y-2">
              <p className="text-xs text-rose-300">
                Tem certeza que deseja zerar sua pontuação e sair do ranking?
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmandoReset(false)}
                  className="px-3 py-1.5 bg-[#403D58] text-slate-200 text-xs font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={resetarProgresso}
                  className="px-3 py-1.5 bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmandoReset(true)}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Zerar minha pontuação</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
