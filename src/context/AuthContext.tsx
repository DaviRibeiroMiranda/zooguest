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

interface AuthContextType {
  user: User | null;
  jogador: Jogador | null;
  loading: boolean;
  isGuest: boolean;
  entrarComGoogle: () => Promise<void>;
  entrarComEmail: (email: string, pass: string) => Promise<void>;
  cadastrarComEmail: (nome: string, email: string, pass: string) => Promise<void>;
  sair: () => Promise<void>;
  salvarProgressoVitoria: (pontosGanhos: number, tentativas: number, animalNome: string) => Promise<void>;
  jogarComoConvidado: () => void;
  guestPontuacao: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [jogador, setJogador] = useState<Jogador | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(false);
  const [guestPontuacao, setGuestPontuacao] = useState<number>(0);
  const [, startTransition] = useTransition();

  // Escuta o "Guarda Imperial" (Firebase Auth)
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      startTransition(() => {
        setUser(currentUser);
        if (currentUser) {
          setIsGuest(false);
        }
      });

      if (!currentUser) {
        startTransition(() => {
          setJogador(null);
          setLoading(false);
        });
        return;
      }

      // Escuta reativa do perfil do jogador no Firestore (O Espelho Mágico)
      const userDocRef = doc(db, 'jogadores', currentUser.uid);

      try {
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
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
          await setDoc(userDocRef, novoPerfil);
          startTransition(() => {
            setJogador(novoPerfil);
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `jogadores/${currentUser.uid}`);
      }

      // Conecta o listener em tempo real
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

      return () => unsubJogador();
    });

    return () => unsubAuth();
  }, []);

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

  const cadastrarComEmail = async (nome: string, email: string, pass: string) => {
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (nome.trim()) {
        await updateProfile(cred.user, { displayName: nome.trim() });
      }
      // Cria o registro inicial no Firestore
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

  const jogarComoConvidado = () => {
    setIsGuest(true);
    setLoading(false);
  };

  // O Mestre de Armas (Update) + Invocação de Ficha de Partida
  const salvarProgressoVitoria = async (pontosGanhos: number, tentativas: number, animalNome: string) => {
    if (isGuest || !user) {
      // Modo convidado acumula em memória local
      setGuestPontuacao((prev) => prev + pontosGanhos);
      return;
    }

    try {
      const userDocRef = doc(db, 'jogadores', user.uid);
      const pontuacaoAtual = jogador?.pontuacaoTotal || 0;
      const partidasAtuais = jogador?.partidasJogadas || 0;
      const vitoriasAtuais = jogador?.vitorias || 0;
      const melhorTentativaAtual = jogador?.melhorTentativa || 99;

      const novaPontuacaoTotal = pontuacaoAtual + pontosGanhos;
      const novasPartidas = partidasAtuais + 1;
      const novasVitorias = vitoriasAtuais + 1;
      const novaMelhorTentativa = Math.min(melhorTentativaAtual, tentativas);
      const novoNivel = Math.floor(novaPontuacaoTotal / 800) + 1;

      // Atualiza o perfil no Firestore
      await updateDoc(userDocRef, {
        pontuacaoTotal: novaPontuacaoTotal,
        partidasJogadas: novasPartidas,
        vitorias: novasVitorias,
        melhorTentativa: novaMelhorTentativa,
        nivel: novoNivel,
        atualizadoEm: new Date().toISOString(),
      });

      // Salva histórico na gaveta /partidas
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
