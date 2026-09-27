Apresentação — zooGuest
Slide 1 — Apresentação
zooGuest — Jogo de Adivinhação de Animais
O zooGuest é um jogo em que o jogador precisa descobrir um animal secreto através de suas características.
O sistema possui cadastro e login, modo visitante, sistema de pontuação, histórico de partidas e ranking dos jogadores.
Slide 2 — Tecnologias utilizadas
O projeto utiliza:
React para construir a interface.
TypeScript para organizar os dados e o código.
Firebase Authentication para login e cadastro.
Firestore para armazenar jogadores e partidas.
Vite para executar e desenvolver o projeto.
Tailwind CSS para a estilização da interface.
Slide 3 — Estrutura do projeto
Os principais arquivos estão separados por responsabilidade.
App.tsx
Controla a estrutura principal da aplicação.
GameBoard.tsx
Contém a lógica principal do jogo.
LoginScreen.tsx
Responsável pelo login, cadastro e modo visitante.
Leaderboard.tsx
Mostra o ranking dos jogadores.
AuthContext.tsx
Controla o usuário e a comunicação com o Firebase.
animals.ts
Contém os animais e as regras de comparação.
game.ts
Define os tipos utilizados pelo sistema.
Slide 4 — Cadastro e Login
O arquivo principal dessa parte é o:
AuthContext.tsx
Ele utiliza o Firebase Authentication para controlar os usuários.
Um dos códigos mais importantes é:
await signInWithEmailAndPassword(auth, email.trim(), pass);
Esse comando envia o e-mail e a senha para o Firebase e realiza a autenticação.
Também existe o cadastro:
const cred = await createUserWithEmailAndPassword(
  auth,
  email.trim(),
  pass
);
Depois que o usuário é criado, o sistema também cria seu perfil no Firestore.
Slide 5 — Banco de dados Firebase
O arquivo:
firebaseConfig.ts
é responsável por inicializar a conexão com o Firebase.
O código:
const app = initializeApp(firebaseConfig);

export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);
cria a conexão com:
Firebase Authentication;
Firestore.
Assim, o sistema consegue salvar e consultar os dados dos jogadores.
Slide 6 — Cadastro dos animais
Os animais ficam armazenados no arquivo:
animals.ts
Cada animal possui várias características.
Por exemplo:
{
  id: 'onca-pintada',
  nome: 'Onça-Pintada',
  classe: 'Mamífero',
  habitat: 'Floresta',
  dieta: 'Carnívoro',
  tamanho: 'Médio',
  habito: 'Noturno',
  locomocao: 'Anda/Corre',
  continente: 'América do Sul',
  cobertura: 'Pelos'
}
Essas informações são utilizadas pelo jogo para comparar o palpite do jogador com o animal secreto.
Slide 7 — Escolha do animal secreto
No GameBoard.tsx, o animal secreto é escolhido através da função:
const [secretAnimal, setSecretAnimal] =
  useState<Animal>(() => getRandomAnimal());
A função getRandomAnimal() escolhe aleatoriamente um animal da lista.
Internamente:
const randomIndex =
  Math.floor(Math.random() * candidates.length);

return candidates[randomIndex];
Assim, a cada rodada o jogador recebe um animal diferente.
Slide 8 — Sistema de comparação
Essa é uma das partes mais importantes do projeto.
Quando o jogador escolhe um animal:
const comparacoes =
  compareAnimals(animalEscolhido, secretAnimal);
O sistema compara as características dos dois animais.
São analisados 8 atributos:
Classe
Habitat
Dieta
Tamanho
Hábito
Locomoção
Continente
Revestimento
Cada característica pode ser:
Correta — exatamente igual.
Quase certa — possui alguma relação.
Diferente — não corresponde.
Slide 9 — Exemplo da lógica de comparação
A função evaluateAttribute() verifica cada característica.
Um exemplo é o tamanho:
if (key === 'tamanho') {
  const d = Math.abs(
    SIZE_SCALE[guessVal] - SIZE_SCALE[secretVal]
  );

  if (d === 1) {
    return {
      status: 'close',
      label: 'Porte próximo'
    };
  }
}
O sistema transforma os tamanhos em valores:
Pequeno = 0
Médio = 1
Grande = 2
Gigante = 3
Assim, se o jogador escolher um animal Grande e o secreto for Médio, o sistema considera o tamanho como "quase certo".
Slide 10 — Verificação da vitória
No GameBoard.tsx, o sistema verifica se o animal escolhido é o secreto:
const acertou =
  animalEscolhido.id === secretAnimal.id;
Se for igual:
if (acertou) {
  setStatusJogo('vitoria');
  setPontosGanhos(pontos);
}
O jogo muda para o estado de vitória e calcula a pontuação.
Slide 11 — Sistema de pontuação
A função calculateScore() determina os pontos de acordo com o número de tentativas.
if (tentativa === 1) return 1000;
if (tentativa === 2) return 850;
if (tentativa === 3) return 700;
Quanto menos tentativas o jogador utilizar, maior será sua pontuação.
A partir da sétima tentativa, a pontuação chega a 150 e depois fica em 100 pontos.
Slide 12 — Salvando o progresso
Depois da vitória, o sistema chama:
await salvarProgressoVitoria(
  pontos,
  novaTentativaNum,
  secretAnimal.nome
);
Essa função atualiza os dados do jogador no Firestore.
Por exemplo:
await updateDoc(userDocRef, {
  pontuacaoTotal: novaPontuacaoTotal,
  partidasJogadas: novasPartidas,
  vitorias: novasVitorias,
  melhorTentativa: novaMelhorTentativa,
  nivel: novoNivel
});
Dessa forma, a pontuação não fica apenas no navegador. Ela é salva na conta do jogador.
Slide 13 — Ranking
O ranking fica no arquivo:
Leaderboard.tsx
O sistema consulta os jogadores no Firestore e ordena pela pontuação:
const consultaRanking = query(
  jogadoresRef,
  orderBy('pontuacaoTotal', 'desc'),
  limit(50)
);
O orderBy organiza os jogadores pela pontuação e o limit(50) limita o resultado aos 50 primeiros registros.
Slide 14 — Atualização em tempo real
Uma característica importante é o uso do:
onSnapshot()
Ele permite que o sistema receba alterações do Firestore em tempo real.
Por isso, quando uma pontuação é atualizada no banco, o ranking pode ser atualizado automaticamente sem precisar recarregar a página.
Slide 15 — Conclusão
O projeto combina diferentes partes para formar um sistema completo.
O React controla a interface, o TypeScript organiza os dados e a lógica, enquanto o Firebase cuida da autenticação e do armazenamento.
A principal lógica do jogo está na comparação dos atributos dos animais, no sistema de tentativas e na pontuação.
O resultado é um jogo interativo com contas de usuários, persistência de dados e ranking online.
Se a banca perguntar "qual código é o mais importante?"
Você pode responder:
"A parte mais importante está no GameBoard e no animals.ts, porque é onde acontece a lógica principal do jogo. O GameBoard controla as tentativas e a vitória, enquanto o animals.ts compara as características dos animais e calcula a pontuação."
Essa resposta é curta e mostra que você realmente entende a estrutura do projeto.
