import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  ANIMALS_DATABASE,
  compareAnimals,
  calculateScore,
  getRandomAnimal,
  ATTRIBUTE_METADATA,
} from '../data/animals';
import { Animal, GuessResult } from '../types/game';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Check,
  Minus,
  X,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';

export const GameBoard: React.FC = () => {
  const { user, salvarProgressoVitoria } = useAuth();

  const [secretAnimal, setSecretAnimal] = useState<Animal>(() => getRandomAnimal());
  const [palpites, setPalpites] = useState<GuessResult[]>([]);
  const [busca, setBusca] = useState<string>('');
  const [dropdownAberto, setDropdownAberto] = useState<boolean>(false);
  const [statusJogo, setStatusJogo] = useState<'jogando' | 'vitoria' | 'revelado'>('jogando');
  const [pontosGanhos, setPontosGanhos] = useState<number>(0);

  const iniciarNovaPartida = () => {
    const proximo = getRandomAnimal(secretAnimal.id);
    setSecretAnimal(proximo);
    setPalpites([]);
    setBusca('');
    setDropdownAberto(false);
    setStatusJogo('jogando');
    setPontosGanhos(0);
  };

  const animaisDisponiveis = useMemo(() => {
    const jaPalpitados = new Set(palpites.map((p) => p.animalPalpite.id));
    return ANIMALS_DATABASE.filter(
      (a) =>
        !jaPalpitados.has(a.id) &&
        (a.nome.toLowerCase().includes(busca.toLowerCase()) ||
          a.classe.toLowerCase().includes(busca.toLowerCase()) ||
          a.habitat.toLowerCase().includes(busca.toLowerCase()))
    );
  }, [busca, palpites]);

  const enviarPalpite = async (animalEscolhido: Animal) => {
    if (statusJogo !== 'jogando') return;

    setDropdownAberto(false);
    setBusca('');

    const novaTentativaNum = palpites.length + 1;
    const comparacoes = compareAnimals(animalEscolhido, secretAnimal);
    const exatos = comparacoes.filter((c) => c.status === 'exact').length;
    const quaseCertos = comparacoes.filter((c) => c.status === 'close').length;
    const acertou = animalEscolhido.id === secretAnimal.id;
    const pontos = calculateScore(novaTentativaNum);

    const novoResultado: GuessResult = {
      tentativaNumero: novaTentativaNum,
      animalPalpite: animalEscolhido,
      comparacoes,
      totalExatos: exatos,
      totalQuaseCertos: quaseCertos,
      totalAtributos: comparacoes.length,
      acertouAnimal: acertou,
      pontuacaoPotencial: pontos,
    };

    setPalpites([novoResultado, ...palpites]);

    if (acertou) {
      setStatusJogo('vitoria');
      setPontosGanhos(pontos);

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#F9A620', '#548C2F', '#403D58', '#ffffff'],
      });

      if (user) {
        try {
          await salvarProgressoVitoria(pontos, novaTentativaNum, secretAnimal.nome);
        } catch (err) {
          console.error('Erro ao salvar no Firestore:', err);
        }
      }
    }
  };

  const desistir = () => {
    setStatusJogo('revelado');
  };

  const proximaPontuacao = calculateScore(palpites.length + 1);

  return (
    <div className="space-y-3 max-w-lg mx-auto pb-10">
      {/* Barra de Status da Rodada - Design Retilíneo com Paleta Temática */}
      <div className="flex items-center justify-between p-3.5 bg-[#104911]/90 border border-[#403D58] shadow-sm">
        <div>
          <div className="text-[11px] text-slate-300">
            {statusJogo === 'jogando'
              ? `Tentativa ${palpites.length + 1}`
              : statusJogo === 'vitoria'
              ? 'Concluído'
              : 'Revelado'}
          </div>
          <div className="text-sm font-bold text-white tracking-wide">
            {statusJogo === 'jogando' ? 'Animal Oculto' : secretAnimal.nome}
          </div>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-slate-300">Pontuação em jogo</div>
          <div className="text-sm font-bold text-[#F9A620] tabular-nums">
            {statusJogo === 'vitoria' ? `+${pontosGanhos}` : `+${proximaPontuacao} pts`}
          </div>
        </div>
      </div>

      {/* Legenda de Cores */}
      <div className="flex items-center gap-4 px-1 text-[11px] text-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#548C2F]" />
          <span>Verde: Correto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#F9A620]" />
          <span>Laranja: Quase certo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#403D58]" />
          <span>Cinza: Diferente</span>
        </div>
      </div>

      {/* Caixa de Entrada do Palpite */}
      {statusJogo === 'jogando' ? (
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder={`Digite o animal entre ${ANIMALS_DATABASE.length} espécies...`}
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setDropdownAberto(true);
              }}
              onFocus={() => setDropdownAberto(true)}
              className="w-full h-11 pl-10 pr-24 bg-[#104911]/90 border border-[#403D58] text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#F9A620] transition-colors"
            />
            <button
              type="button"
              onClick={() => setDropdownAberto(!dropdownAberto)}
              className="absolute right-1 top-1 bottom-1 px-3 bg-[#403D58] hover:bg-[#403D58]/80 text-slate-100 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Lista</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>

          {/* Dropdown com a Lista de Animais (Único local com emojis conforme solicitado) */}
          {dropdownAberto && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-[#104911] border border-[#403D58] shadow-2xl z-30 divide-y divide-[#403D58]/60">
              {animaisDisponiveis.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  Nenhum animal restante encontrado
                </div>
              ) : (
                animaisDisponiveis.map((animal) => (
                  <button
                    key={animal.id}
                    type="button"
                    onClick={() => enviarPalpite(animal)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-[#403D58]/70 flex items-center justify-between text-xs transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{animal.emoji}</span>
                      <span className="font-semibold text-slate-100">{animal.nome}</span>
                      <span className="text-slate-300 text-[11px]">
                        {animal.classe} · {animal.habitat} · {animal.tamanho}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#F9A620] font-bold">Palpitar</span>
                  </button>
                ))
              )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between text-xs text-slate-300 px-1">
            <span>{ANIMALS_DATABASE.length} animais disponíveis no catálogo.</span>
            <button
              type="button"
              onClick={desistir}
              className="text-slate-300 hover:text-rose-400 transition-colors cursor-pointer underline underline-offset-2"
            >
              Desistir e revelar
            </button>
          </div>
        </div>
      ) : (
        /* Card de Conclusão da Rodada */
        <div className="p-5 bg-[#104911]/95 border-2 border-[#548C2F] text-center space-y-3">
          <div>
            <div className="text-xs text-slate-300">
              {statusJogo === 'vitoria' ? 'Parabéns, você acertou!' : 'O animal secreto era:'}
            </div>
            <div className="text-2xl font-black text-[#F9A620] mt-1">{secretAnimal.nome}</div>
          </div>

          <p className="text-xs text-slate-200 max-w-sm mx-auto leading-relaxed">
            {secretAnimal.dicaExtra}
          </p>

          {statusJogo === 'vitoria' && (
            <div className="text-sm font-bold text-[#548C2F] bg-[#104911] border border-[#548C2F] py-2 px-3 inline-block">
              +{pontosGanhos} pontos em {palpites.length} {palpites.length === 1 ? 'tentativa' : 'tentativas'}
            </div>
          )}

          <button
            type="button"
            onClick={iniciarNovaPartida}
            className="w-full h-11 bg-[#F9A620] hover:bg-[#F9A620]/90 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Próxima Rodada</span>
          </button>
        </div>
      )}

      {/* Histórico dos Palpites Anteriores */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider px-1">
          Palpites Anteriores ({palpites.length})
        </div>

        {palpites.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-300 border border-[#403D58] bg-[#104911]/60">
            Nenhum palpite enviado ainda. Digite ou selecione um animal acima.
          </div>
        ) : (
          palpites.map((resultado) => (
            <div
              key={resultado.tentativaNumero}
              className={`p-3 bg-[#104911]/95 border space-y-2.5 ${
                resultado.acertouAnimal ? 'border-2 border-[#548C2F]' : 'border-[#403D58]'
              }`}
            >
              {/* Linha do Palpite */}
              <div className="flex items-center justify-between border-b border-[#403D58]/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-100">
                    {resultado.animalPalpite.nome}
                  </span>
                  <span className="text-xs text-slate-400">#{resultado.tentativaNumero}</span>
                </div>

                <div className="text-xs font-medium">
                  {resultado.acertouAnimal ? (
                    <span className="text-[#548C2F] font-bold">Acerto Exato</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[#548C2F] font-semibold">
                        {resultado.totalExatos} exatos
                      </span>
                      {resultado.totalQuaseCertos > 0 && (
                        <span className="text-[#F9A620] font-semibold">
                          · {resultado.totalQuaseCertos} quase certos
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabela dos 8 Atributos - Retilíneo e com a Paleta Solicitada */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                {resultado.comparacoes.map((comp) => {
                  const isExact = comp.status === 'exact';
                  const isClose = comp.status === 'close';

                  return (
                    <div
                      key={comp.key}
                      className={`p-2 border text-left flex flex-col justify-between transition-colors ${
                        isExact
                          ? 'bg-[#548C2F]/25 border-[#548C2F] text-slate-100'
                          : isClose
                          ? 'bg-[#F9A620]/20 border-[#F9A620] text-slate-100'
                          : 'bg-[#403D58]/30 border-[#403D58] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>{ATTRIBUTE_METADATA[comp.key].label}</span>
                        {isExact ? (
                          <Check className="w-3.5 h-3.5 text-[#548C2F]" />
                        ) : isClose ? (
                          <Minus className="w-3.5 h-3.5 text-[#F9A620]" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-[#403D58]" />
                        )}
                      </div>

                      <div className="font-semibold truncate text-[11px]">
                        {comp.guessValue}
                      </div>

                      <div
                        className={`text-[9px] mt-0.5 font-bold uppercase tracking-wider ${
                          isExact
                            ? 'text-[#548C2F]'
                            : isClose
                            ? 'text-[#F9A620]'
                            : 'text-slate-400'
                        }`}
                      >
                        {comp.statusLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
