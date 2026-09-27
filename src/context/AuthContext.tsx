/**
 * ============================================================================
 * CONTEXTO DE AUTENTICAÇÃO E SINCRONIZAÇÃO EM TEMPO REAL — AuthContext
 * ============================================================================
 * Este arquivo atua como o "Guardião da Sessão" do jogo zooGuest:
 * 1. Ouve os eventos de login/logout do Firebase Authentication (Google e E-mail/Senha).
 * 2. Mantém o perfil do jogador (`jogadores/{userId}`) sincronizado em tempo real com o Firestore.
 * 3. Registra as vitórias, calcula novos níveis e salva o histórico na coleção `partidas`.
 * 4. Fornece o modo "Convidado/Visitante" para permitir testes rápidos sem criar conta imediatamente.
 */

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebaseConfig';
import { Jogador, Partida } from '../types/game';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

/**
 * Interface com os métodos e variáveis disponibilizados para qualquer tela do aplicativo
 */
interface AuthContextType {
  user: User | null; // Usuário autenticado no Firebase Auth
  jogador: Jogador | null; // Dados completos do perfil do Firestore (pontuação, nível, etc.)
  loading: boolean; // Indica se ainda está verificando a sessão ativa
  isGuest: boolean; // Se o jogador optou por jogar como visitante temporário
  entrarComGoogle: () => Promise<void>; // Dispara o fluxo OAuth com popup da Google
  entrarComEmail: (email: string, pass: string) => Promise<void>; // Login tradicional
  cadastrarComEmail: (nome: string, email: string, pass: string) => Promise<void>; // Criação de conta
  sair: () => Promise<void>; // Encerra a sessão
  salvarProgressoVitoria: (pontosGanhos: number, tentativas: number, animalNome: string) => Promise<void>; // Persiste pontos no Firestore
  jogarComoConvidado: () => void; // Ativa modo convidado
  guestPontuacao: number; // Pontuação em memória volátil para convidados
}

// Cria o contexto do React
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provedor do Contexto de Autenticação: encapsula toda a árvore de componentes da aplicação
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estado do usuário retornado pelo Firebase Auth
  const [user, setUser] = useState<User | null>(null);

  // Estado do perfil do jogador retornado pelo Firestore (`jogadores/{uid}`)
  const [jogador, setJogador] = useState<Jogador | null>(null);

  // Flag de carregamento inicial para exibir indicador visual enquanto a sessão é checada
  const [loading, setLoading] = useState<boolean>(true);

  // Modo visitante (não salva no Firestore, apenas em memória)
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [guestPontuacao, setGuestPontuacao] = useState<number>(0);

  // Hook para transições suaves de estado no React 19
  const [, startTransition] = useTransition();

  /**
   * EFEITO 1: Observador da Autenticação do Firebase (`onAuthStateChanged`)
   * Roda quando o app abre e fica escutando se o usuário está logado, deslogou ou trocou de conta.
   */
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      startTransition(() => {
        setUser(currentUser);
        // Se o usuário logou, desativa o modo visitante
        if (currentUser) {
          setIsGuest(false);
        }
      });

      // Se não há usuário autenticado, limpa o jogador e finaliza o loading
      if (!currentUser) {
        startTransition(() => {
          setJogador(null);
          setLoading(false);
        });
        return;
      }

      // Referência ao documento do jogador: colecão "jogadores", documento com ID igual ao UID do Auth
      const userDocRef = doc(db, 'jogadores', currentUser.uid);

      try {
        // Verifica se já existe um documento criado para este jogador no Firestore
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
          // PRIMEIRO LOGIN: Cria a ficha inicial do jogador com 0 pontos e nível 1
          const novoPerfil: Jogador = {
            uid: currentUser.uid,
            nome: currentUser.displayName || currentUser.email?.split('@')[0] || 'Aventureiro',
            email: currentUser.email || '',
            pontuacaoTotal: 0,
            partidasJogadas: 0,
            vitorias: 0,
            melhorTentativa: 99,
            nivel: 1,
            avatar: '',
            atualizadoEm: new Date().toISOString(),
          };
          // Grava a ficha no Firestore
          await setDoc(userDocRef, novoPerfil);
          startTransition(() => {
            setJogador(novoPerfil);
          });
        }
      } catch (err) {
        // Trata erro de permissão ou rede usando o utilitário padronizado
        handleFirestoreError(err, OperationType.GET, `jogadores/${currentUser.uid}`);
      }

      /**
       * LISTENER EM TEMPO REAL (`onSnapshot`):
       * Sempre que a pontuação mudar no banco de dados (ex: vitória salva),
       * o aplicativo atualiza a tela instantaneamente sem precisar recarregar a página!
       */
      const unsubJogador = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Jogador;
            startTransition(() => {
              setJogador(data);
              setLoading(false);
            });
          }
        },
        (error) => {
          console.error('Erro no listener do jogador:', error);
          setLoading(false);
        }
      );

      // Função de limpeza do listener do documento quando o usuário deslogar
      return () => unsubJogador();
    });

    // Função de limpeza do listener do Auth ao desmontar o componente
    return () => unsubAuth();
  }, []);

  /**
   * MÉTODO: Entrar com a Conta Google (Popup)
   * Abre a tela oficial de consentimento da Google e autentica o usuário
   */
  const entrarComGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setLoading(false);
      console.error('Erro ao autenticar com Google:', error);
      throw error;
    }
  };

  /**
   * MÉTODO: Entrar com E-mail e Senha
   * Autentica o usuário existente utilizando o Firebase Auth
   */
  const entrarComEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (error: any) {
      setLoading(false);
      console.error('Erro ao autenticar com email:', error);
      throw error;
    }
  };

  /**
   * MÉTODO: Cadastrar Nova Conta com E-mail e Senha
   * Cria o usuário no Auth, atualiza seu nome de exibição e já cria seu documento inicial no Firestore
   */
  const cadastrarComEmail = async (nome: string, email: string, pass: string) => {
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      
      // Atualiza o nome no perfil de autenticação da conta
      if (nome.trim()) {
        await updateProfile(cred.user, { displayName: nome.trim() });
      }

      // Cria imediatamente o documento na coleção 'jogadores' no Firestore ('testdatabase')
      const userDocRef = doc(db, 'jogadores', cred.user.uid);
      const novoPerfil: Jogador = {
        uid: cred.user.uid,
        nome: nome.trim() || email.split('@')[0],
        email: email.trim(),
        pontuacaoTotal: 0,
        partidasJogadas: 0,
        vitorias: 0,
        melhorTentativa: 99,
        nivel: 1,
        avatar: '',
        atualizadoEm: new Date().toISOString(),
      };
      await setDoc(userDocRef, novoPerfil);
      setJogador(novoPerfil);
    } catch (error: any) {
      setLoading(false);
      console.error('Erro ao cadastrar com email:', error);
      throw error;
    }
  };

  /**
   * MÉTODO: Sair da Conta (Logout)
   * Limpa a sessão no Firebase Auth e reseta os estados locais
   */
  const sair = async () => {
    try {
      await firebaseSignOut(auth);
      setJogador(null);
      setUser(null);
      setIsGuest(false);
      setGuestPontuacao(0);
    } catch (error: any) {
      console.error('Erro ao sair:', error);
    }
  };

  /**
   * MÉTODO: Jogar como Convidado
   * Permite que o jogador explore o jogo sem login obrigatório imediato
   */
  const jogarComoConvidado = () => {
    setIsGuest(true);
    setLoading(false);
  };

  /**
   * MÉTODO CRÍTICO: Salvar Progresso de Vitória no Firestore
   * Executado quando o jogador acerta o animal secreto:
   * 1. Soma os pontos ganhos à `pontuacaoTotal` do jogador
   * 2. Incrementa `vitorias` e `partidasJogadas`
   * 3. Atualiza o recorde de `melhorTentativa`
   * 4. Recalcula o `nivel` do jogador
   * 5. Grava um registro imutável na coleção `partidas` para fins de histórico e ranking
   */
  const salvarProgressoVitoria = async (pontosGanhos: number, tentativas: number, animalNome: string) => {
    // Se estiver jogando como visitante, acumula apenas na memória da sessão atual
    if (isGuest || !user) {
      setGuestPontuacao((prev) => prev + pontosGanhos);
      return;
    }

    try {
      const userDocRef = doc(db, 'jogadores', user.uid);
      const pontuacaoAtual = jogador?.pontuacaoTotal || 0;
      const partidasAtuais = jogador?.partidasJogadas || 0;
      const vitoriasAtuais = jogador?.vitorias || 0;
      const melhorTentativaAtual = jogador?.melhorTentativa || 99;

      // Cálculos da nova pontuação e progressão de nível
      const novaPontuacaoTotal = pontuacaoAtual + pontosGanhos;
      const novasPartidas = partidasAtuais + 1;
      const novasVitorias = vitoriasAtuais + 1;
      const novaMelhorTentativa = Math.min(melhorTentativaAtual, tentativas);
      const novoNivel = Math.floor(novaPontuacaoTotal / 800) + 1;

      // Atualiza os campos necessários no documento do jogador (`jogadores/{user.uid}`)
      await updateDoc(userDocRef, {
        pontuacaoTotal: novaPontuacaoTotal,
        partidasJogadas: novasPartidas,
        vitorias: novasVitorias,
        melhorTentativa: novaMelhorTentativa,
        nivel: novoNivel,
        atualizadoEm: new Date().toISOString(),
      });

      // Adiciona o histórico individual na coleção `partidas`
      const novaPartida: Partida = {
        userId: user.uid,
        nomeJogador: jogador?.nome || user.displayName || 'Aventureiro',
        animalNome,
        tentativas,
        pontosGanhos,
        dataHora: new Date().toISOString(),
      };
      await addDoc(collection(db, 'partidas'), novaPartida);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `jogadores/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        jogador,
        loading,
        isGuest,
        entrarComGoogle,
        entrarComEmail,
        cadastrarComEmail,
        sair,
        salvarProgressoVitoria,
        jogarComoConvidado,
        guestPontuacao,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook customizado `useAuth`
 * Facilita o acesso ao contexto de autenticação em qualquer componente com apenas uma linha
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
