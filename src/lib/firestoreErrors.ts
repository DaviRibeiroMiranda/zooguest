/**
 * ============================================================================
 * TRATAMENTO DE ERROS DO FIRESTORE & DIAGNÓSTICO DE REGRAS DE SEGURANÇA
 * ============================================================================
 * Em bancos NoSQL na nuvem (Firestore), os erros de 'Permission Denied' ocorrem
 * quando a requisição não satisfaz as regras de segurança declaradas em `firestore.rules`.
 * Este utilitário captura o contexto completo (usuário autenticado, caminho da coleção,
 * tipo de operação) para facilitar a depuração e auditoria de erros.
 */

import { auth } from '../firebaseConfig';

/**
 * Enumeração padronizada dos tipos de operação possíveis no Firestore:
 * - CREATE: Criação de novo documento
 * - UPDATE: Modificação de dados existentes
 * - DELETE: Exclusão de registro
 * - LIST: Consulta a coleções/filtros (query)
 * - GET: Leitura pontual de um documento por ID
 * - WRITE: Operação mista de escrita
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Interface que modela o relatório estruturado de erro do banco de dados
 */
export interface FirestoreErrorInfo {
  error: string; // Mensagem descritiva da falha
  operationType: OperationType; // Qual ação estava sendo executada
  path: string | null; // Caminho do documento no Firestore (ex: "jogadores/uid123")
  authInfo: {
    userId?: string | null; // ID único do usuário autenticado no Firebase Auth
    email?: string | null; // E-mail do usuário
    emailVerified?: boolean | null; // Se o e-mail foi verificado
    isAnonymous?: boolean | null; // Se é sessão anônima
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null; // ex: 'google.com' ou 'password'
      email?: string | null;
    }[];
  };
}

/**
 * Função centralizadora de tratamento de exceções do Firestore.
 * Monta o objeto de diagnóstico com as informações da sessão do Auth atual
 * e lança o erro serializado em JSON com nível 'never' para o TypeScript.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    // Extrai a mensagem de erro original
    error: error instanceof Error ? error.message : String(error),
    // Captura metadados da autenticação para verificar se o usuário tinha permissão
    authInfo: {
      userId: auth?.currentUser?.uid ?? null,
      email: auth?.currentUser?.email ?? null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
      tenantId: auth?.currentUser?.tenantId ?? null,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };

  // Registra o erro de forma estruturada no console do navegador
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // Lança o erro com a carga informativa completa
  throw new Error(JSON.stringify(errInfo));
}
