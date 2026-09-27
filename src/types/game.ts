/**
 * ============================================================================
 * CONTRATOS DE TIPAGEM TYPESCRIPT — zooGuest
 * ============================================================================
 * Este arquivo define os tipos primitivos e estruturas de dados centrais do jogo.
 * A tipagem estática garante que os 260 animais e as consultas no Firestore
 * respeitem rigorosamente o mesmo formato, prevenindo falhas de execução.
 */

// 1. CLASSIFICAÇÃO TAXONÔMICA: Grupos zoológicos cobertos no jogo
export type AnimalClass = 'Mamífero' | 'Ave' | 'Réptil' | 'Anfíbio' | 'Peixe' | 'Invertebrado';

// 2. BIOMA / HABITAT NATURAL: Ambientes ecológicos predominantes
export type AnimalHabitat = 'Floresta' | 'Savana' | 'Aquático' | 'Deserto' | 'Polar' | 'Montanha';

// 3. DIETA ALIMENTAR: Como a espécie obtém seus nutrientes
export type AnimalDiet = 'Carnívoro' | 'Herbívoro' | 'Onívoro' | 'Insetívoro';

// 4. PORTE CORPÓREO: Escala de tamanho para deduções aproximadas
export type AnimalSize = 'Pequeno' | 'Médio' | 'Grande' | 'Gigante';

// 5. RITMO CIRCADIANO: Período de atividade principal do animal
export type AnimalHabit = 'Diurno' | 'Noturno' | 'Crepuscular';

// 6. LOCOMOÇÃO BIOLÓGICA: Forma motora predominante
export type AnimalLocomotion = 'Anda/Corre' | 'Voa' | 'Nada' | 'Rasteja' | 'Pula';

// 7. DISTRIBUIÇÃO GEOGRÁFICA: Continente de origem ou presença global
export type AnimalContinent = 'América do Sul' | 'África' | 'Ásia' | 'Oceania' | 'Europa' | 'Antártida' | 'Global';

// 8. TEGUMENTO EXTERNO: Tipo de cobertura cutânea ou exoesqueleto
export type AnimalCovering = 'Pelos' | 'Penas' | 'Escamas' | 'Pele Úmida' | 'Carapaça';

/**
 * Entidade completa que representa uma espécie no banco de dados de 260 animais
 */
export interface Animal {
  id: string; // Slug único para indexação (ex: 'onca-pintada')
  nome: string; // Nome comum legível em português (ex: 'Onça-Pintada')
  emoji: string; // Emoji representativo utilizado na lista de seleção
  classe: AnimalClass;
  habitat: AnimalHabitat;
  dieta: AnimalDiet;
  tamanho: AnimalSize;
  habito: AnimalHabit;
  locomocao: AnimalLocomotion;
  continente: AnimalContinent;
  cobertura: AnimalCovering;
  dicaExtra: string; // Fato biológico curioso revelado após o palpite
}

/**
 * Lista de chaves comparáveis entre o palpite do jogador e o animal secreto
 */
export type CompareAttributeKey =
  | 'classe'
  | 'habitat'
  | 'dieta'
  | 'tamanho'
  | 'habito'
  | 'locomocao'
  | 'continente'
  | 'cobertura';

/**
 * Status do resultado da comparação de cada atributo:
 * - 'exact': Correspondência idêntica (Verde #548C2F)
 * - 'close': Quase certo, atributos correlatos (Laranja #F9A620)
 * - 'different': Incompatível / sem relação (Cinza/Mauve #403D58)
 */
export type MatchStatus = 'exact' | 'close' | 'different';

/**
 * Resultado individual de um atributo comparado
 */
export interface AttributeComparison {
  key: CompareAttributeKey; // Atributo testado (ex: 'dieta')
  label: string; // Rótulo em português (ex: 'Dieta')
  secretValue: string; // Valor do animal secreto
  guessValue: string; // Valor do animal que o jogador chutou
  status: MatchStatus; // 'exact' | 'close' | 'different'
  statusLabel: string; // Descrição textual da proximidade (ex: 'Porte próximo')
}

/**
 * Resumo do palpite de uma rodada, consolidando todos os 8 atributos testados
 */
export interface GuessResult {
  tentativaNumero: number; // Número sequencial da tentativa (1, 2, 3...)
  animalPalpite: Animal; // Animal que o jogador escolheu
  comparacoes: AttributeComparison[]; // Resultados dos 8 atributos
  totalExatos: number; // Quantos atributos foram 100% corretos
  totalQuaseCertos: number; // Quantos atributos ficaram em laranja ("quase certo")
  totalAtributos: number; // Sempre 8 (total de dimensões biológicas)
  acertouAnimal: boolean; // Se o animal chutado é o animal secreto
  pontuacaoPotencial: number; // Pontos a receber nesta tentativa
}

/**
 * Documento do Jogador gravado na coleção `jogadores/{userId}` do Firestore
 */
export interface Jogador {
  uid: string; // Identificador único provido pelo Firebase Auth
  nome: string; // Nome de exibição ou apelido do jogador
  email: string; // E-mail de cadastro
  pontuacaoTotal: number; // Soma total de pontos acumulados em todas as vitórias
  partidasJogadas: number; // Número de partidas finalizadas
  vitorias: number; // Quantidade de animais acertados
  melhorTentativa: number; // Menor número de tentativas em que venceu uma rodada
  nivel: number; // Nível calculado com base na pontuação total
  avatar: string; // Letra ou inicial do avatar do jogador
  atualizadoEm?: string; // Timestamp ISO da última jogada sincronizada
}

/**
 * Documento de histórico salvo na coleção `partidas/{partidaId}` para auditoria
 */
export interface Partida {
  id?: string;
  userId: string;
  nomeJogador: string;
  animalNome: string;
  tentativas: number;
  pontosGanhos: number;
  dataHora: string;
}
