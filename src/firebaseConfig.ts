/**
 * ============================================================================
 * CONFIGURAÇÃO CENTRAL DO GOOGLE FIREBASE — zooGuest
 * ============================================================================
 * Este arquivo é o ponto de partida de toda a infraestrutura em nuvem do aplicativo.
 * Aqui conectamos o frontend aos serviços de autenticação (Auth) e banco de dados NoSQL (Firestore).
 */

// Importa a função que inicializa o aplicativo Firebase com as credenciais do projeto
import { initializeApp } from 'firebase/app';

// Importa os módulos de autenticação: o gerenciador principal e o provedor de login com Google
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Importa o Firestore e funções para verificar a conectividade do cliente com o servidor
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Carrega as credenciais seguras do projeto (chaves de API, project ID, database ID) geradas pelo setup
import configData from '../firebase-applet-config.json';

// Exporta o objeto de configurações para uso em outros módulos ou scripts
export const firebaseConfig = configData;

// 1. INICIALIZAÇÃO DA APLICAÇÃO FIREBASE
// Cria a instância primária que mantém a sessão e a comunicação com a Google Cloud Platform
const app = initializeApp(firebaseConfig);

// 2. CONEXÃO COM O BANCO DE DADOS FIRESTORE ('testdatabase')
// Ponto crítico: passamos explicitamente 'firebaseConfig.firestoreDatabaseId' ("testdatabase")
// para garantir que as operações de leitura e gravação aconteçam no banco de dados nomeado solicitado
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// 3. INSTÂNCIA DE AUTENTICAÇÃO
// Gerencia o estado de login, tokens JWT de segurança e sessão dos jogadores
export const auth = getAuth(app);

// 4. PROVEDOR DE LOGIN COM GOOGLE
// Utilizado para abrir a janela popup e autenticar o usuário com sua Conta Google com um clique
export const googleProvider = new GoogleAuthProvider();

/**
 * 5. TESTE DE CONECTIVIDADE NA INICIALIZAÇÃO
 * Faz uma requisição leve ao servidor do Firestore para checar se a internet está ativa
 * e se o banco 'testdatabase' está acessível antes das jogadas começarem.
 */
async function testConnection() {
  try {
    // Tenta ler um documento de teste direto do servidor (ignorando cache offline)
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Conexão com Firestore confirmada com sucesso no database:', firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    // Caso o cliente esteja sem conexão ou offline, emite um alerta amigável no console
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Verifique a configuração do Firebase. Cliente offline.');
    }
  }
}

// Executa a validação de conexão assim que o arquivo é importado pela primeira vez
testConnection();

// Exporta a instância geral da aplicação para eventuais extensões
export { app };
