export type AnimalClass = 'Mamífero' | 'Ave' | 'Réptil' | 'Anfíbio' | 'Peixe' | 'Invertebrado';
export type AnimalHabitat = 'Floresta' | 'Savana' | 'Aquático' | 'Deserto' | 'Polar' | 'Montanha';
export type AnimalDiet = 'Carnívoro' | 'Herbívoro' | 'Onívoro' | 'Insetívoro';
export type AnimalSize = 'Pequeno' | 'Médio' | 'Grande' | 'Gigante';
export type AnimalHabit = 'Diurno' | 'Noturno' | 'Crepuscular';
export type AnimalLocomotion = 'Anda/Corre' | 'Voa' | 'Nada' | 'Rasteja' | 'Pula';
export type AnimalContinent = 'América do Sul' | 'África' | 'Ásia' | 'Oceania' | 'Europa' | 'Antártida' | 'Global';
export type AnimalCovering = 'Pelos' | 'Penas' | 'Escamas' | 'Pele Úmida' | 'Carapaça';

export interface Animal {
  id: string;
  nome: string;
  emoji: string;
  classe: AnimalClass;
  habitat: AnimalHabitat;
  dieta: AnimalDiet;
  tamanho: AnimalSize;
  habito: AnimalHabit;
  locomocao: AnimalLocomotion;
  continente: AnimalContinent;
  cobertura: AnimalCovering;
  dicaExtra: string;
}

export type CompareAttributeKey =
  | 'classe'
  | 'habitat'
  | 'dieta'
  | 'tamanho'
  | 'habito'
  | 'locomocao'
  | 'continente'
  | 'cobertura';

export type MatchStatus = 'exact' | 'close' | 'different';

export interface AttributeComparison {
  key: CompareAttributeKey;
  label: string;
  secretValue: string;
  guessValue: string;
  status: MatchStatus;
  statusLabel: string;
}

export interface GuessResult {
  tentativaNumero: number;
  animalPalpite: Animal;
  comparacoes: AttributeComparison[];
  totalExatos: number;
  totalQuaseCertos: number;
  totalAtributos: number;
  acertouAnimal: boolean;
  pontuacaoPotencial: number;
}

export interface Jogador {
  uid: string;
  nome: string;
  email: string;
  pontuacaoTotal: number;
  partidasJogadas: number;
  vitorias: number;
  melhorTentativa: number;
  nivel: number;
  avatar: string;
  atualizadoEm?: string;
}

export interface Partida {
  id?: string;
  userId: string;
  nomeJogador: string;
  animalNome: string;
  tentativas: number;
  pontosGanhos: number;
  dataHora: string;
}
