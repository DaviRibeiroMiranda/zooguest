import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Jogador } from '../types/game';
import { useAuth } from '../context/AuthContext';
import { Search, RefreshCw, Trash2 } from 'lucide-react';

export const Leaderboard: React.FC = () => {
  const { user, jogador } = useAuth();
  const [ranking, setRanking] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [busca, setBusca] = useState<string>('');
  const [confirmandoReset, setConfirmandoReset] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    const jogadoresRef = collection(db, 'jogadores');
    const consultaRanking = query(jogadoresRef, orderBy('pontuacaoTotal', 'desc'), limit(50));

    const desinscrever = onSnapshot(
      consultaRanking,
      (snapshot) => {
        const lista: Jogador[] = [];
        snapshot.forEach((docSnap) => {
          lista.push(docSnap.data() as Jogador);
        });
        setRanking(lista);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao ler ranking:', error);
        setLoading(false);
      }
    );

    return () => desinscrever();
  }, []);

  const resetarProgresso = async () => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'jogadores', user.uid));
      setConfirmandoReset(false);
    } catch (err) {
      console.error('Erro ao resetar:', err);
    }
  };

  const listaFiltrada = ranking.filter((j) =>
    j.nome.toLowerCase().includes(busca.toLowerCase()) ||
    j.email?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-3 max-w-lg mx-auto pb-10">
      {/* Busca */}
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

      {/* Lista de Classificação em Formato Retilíneo e com a Paleta */}
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

      {/* Ação de Reset com Confirmação */}
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
