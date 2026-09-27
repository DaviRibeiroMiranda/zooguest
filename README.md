🦁 zooGuest

Um jogo web de adivinhação de animais, desenvolvido com React, TypeScript e Firebase.

O objetivo do jogo é descobrir qual é o animal secreto utilizando suas características. A cada tentativa, o sistema compara o animal escolhido com o animal secreto e informa quais características estão corretas, próximas ou diferentes.

O projeto também possui sistema de cadastro e login, pontuação, histórico de partidas, níveis e ranking de jogadores.

---

🚀 Tecnologias utilizadas

- React — construção da interface
- TypeScript — tipagem e organização do código
- Firebase Authentication — cadastro e login
- Cloud Firestore — armazenamento dos dados
- Vite — ambiente de desenvolvimento
- Tailwind CSS — estilização da interface

---

📁 Estrutura principal

src/
├── components/
│   ├── GameBoard.tsx
│   ├── LoginScreen.tsx
│   └── Leaderboard.tsx
│
├── contexts/
│   └── AuthContext.tsx
│
├── data/
│   └── animals.ts
│
├── services/
│   └── firebaseConfig.ts
│
├── types/
│   └── game.ts
│
└── App.tsx

Principais arquivos

Arquivo| Função
"App.tsx"| Controla a estrutura principal da aplicação
"GameBoard.tsx"| Contém a lógica principal do jogo
"LoginScreen.tsx"| Login, cadastro e modo visitante
"Leaderboard.tsx"| Exibe o ranking dos jogadores
"AuthContext.tsx"| Controla autenticação e usuário
"animals.ts"| Contém os animais e suas características
"game.ts"| Define os tipos utilizados no sistema
"firebaseConfig.ts"| Configura a conexão com o Firebase

---

🎮 Como o jogo funciona

O jogo começa escolhendo aleatoriamente um animal secreto.

O jogador então escolhe animais para tentar descobrir qual é o animal secreto.

As características são comparadas:

- Classe
- Habitat
- Dieta
- Tamanho
- Hábito
- Locomoção
- Continente
- Cobertura

Cada característica pode apresentar um resultado diferente:

🟢 Correta — a característica é igual.

🟡 Próxima — a característica possui alguma relação com a resposta.

🔴 Diferente — a característica não corresponde.

---

🔐 Sistema de autenticação

O arquivo principal dessa parte é:

AuthContext.tsx

O projeto utiliza o Firebase Authentication para realizar cadastro e login.

Login

await signInWithEmailAndPassword(
  auth,
  email.trim(),
  pass
);

Esse código envia o e-mail e a senha para o Firebase e realiza a autenticação do usuário.

Cadastro

const cred = await createUserWithEmailAndPassword(
  auth,
  email.trim(),
  pass
);

Esse comando cria uma nova conta utilizando e-mail e senha.

Após o cadastro, o sistema também cria o perfil do usuário no Firestore.

---

🔥 Firebase

A configuração do Firebase fica em:

firebaseConfig.ts

A aplicação inicializa o Firebase e cria as conexões com Authentication e Firestore:

const app = initializeApp(firebaseConfig);

export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId
);

export const auth = getAuth(app);

Com isso, o projeto consegue:

- Autenticar usuários
- Cadastrar usuários
- Armazenar pontuações
- Salvar partidas
- Consultar o ranking

---

🐾 Animais

Os animais são armazenados em:

animals.ts

Cada animal possui diferentes características.

Exemplo:

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

Essas informações são utilizadas durante as comparações do jogo.

---

🎲 Animal secreto

No "GameBoard.tsx", o animal secreto é escolhido aleatoriamente:

const [secretAnimal, setSecretAnimal] =
  useState<Animal>(() => getRandomAnimal());

A função "getRandomAnimal()" escolhe um animal aleatório da lista.

const randomIndex =
  Math.floor(Math.random() * candidates.length);

return candidates[randomIndex];

Dessa forma, cada partida pode possuir um animal secreto diferente.

---

🔎 Sistema de comparação

Uma das principais partes do projeto é a comparação entre o animal escolhido e o animal secreto.

const comparacoes =
  compareAnimals(
    animalEscolhido,
    secretAnimal
  );

O sistema compara as características dos dois animais e determina o resultado de cada uma delas.

Por exemplo, o tamanho possui uma lógica específica:

if (key === 'tamanho') {
  const d = Math.abs(
    SIZE_SCALE[guessVal] -
    SIZE_SCALE[secretVal]
  );

  if (d === 1) {
    return {
      status: 'close',
      label: 'Porte próximo'
    };
  }
}

Os tamanhos são transformados em valores para permitir a comparação:

Pequeno = 0
Médio = 1
Grande = 2
Gigante = 3

Assim, um animal Grande comparado com um Médio pode ser considerado de porte próximo.

---

🏆 Sistema de vitória

O sistema verifica se o animal escolhido é o animal secreto:

const acertou =
  animalEscolhido.id === secretAnimal.id;

Se os IDs forem iguais, o jogador acertou:

if (acertou) {
  setStatusJogo('vitoria');
  setPontosGanhos(pontos);
}

O jogo então altera seu estado para vitória e registra a pontuação.

---

⭐ Sistema de pontuação

A quantidade de pontos depende do número de tentativas.

Exemplo:

if (tentativa === 1) return 1000;
if (tentativa === 2) return 850;
if (tentativa === 3) return 700;

Quanto menos tentativas forem necessárias para descobrir o animal, maior será a pontuação.

Isso incentiva o jogador a encontrar a resposta utilizando o menor número possível de tentativas.

---

💾 Salvamento do progresso

Depois de uma vitória, o progresso do jogador é salvo no Firestore:

await salvarProgressoVitoria(
  pontos,
  novaTentativaNum,
  secretAnimal.nome
);

Os dados do usuário podem ser atualizados através de:

await updateDoc(userDocRef, {
  pontuacaoTotal: novaPontuacaoTotal,
  partidasJogadas: novasPartidas,
  vitorias: novasVitorias,
  melhorTentativa: novaMelhorTentativa,
  nivel: novoNivel
});

Assim, os dados permanecem salvos mesmo depois que o jogador fecha o site.

---

🥇 Ranking

O ranking está localizado em:

Leaderboard.tsx

O sistema consulta os jogadores no Firestore e organiza os resultados pela pontuação:

const consultaRanking = query(
  jogadoresRef,
  orderBy(
    'pontuacaoTotal',
    'desc'
  ),
  limit(50)
);

O "orderBy" organiza os jogadores pela pontuação.

O "limit(50)" limita o resultado aos 50 jogadores selecionados.

---

⚡ Atualização em tempo real

O projeto também utiliza:

onSnapshot()

Essa função permite acompanhar alterações no Firestore em tempo real.

Dessa forma, quando os dados do ranking são alterados, a aplicação pode atualizar as informações sem precisar recarregar manualmente a página.

---

📊 Fluxo do sistema

Usuário
   │
   ▼
Login / Cadastro
   │
   ▼
Firebase Authentication
   │
   ▼
Tela do jogo
   │
   ▼
Animal secreto
   │
   ▼
Tentativa do jogador
   │
   ▼
Comparação das características
   │
   ├── Diferente
   ├── Próxima
   └── Correta
          │
          ▼
       Vitória
          │
          ▼
      Pontuação
          │
          ▼
       Firestore
          │
          ▼
        Ranking

---

🛠️ Instalação

Clone o projeto:

git clone <URL_DO_REPOSITORIO>

Entre na pasta:

cd zooguest

Instale as dependências:

npm install

Execute o projeto:

npm run dev

Depois, abra o endereço mostrado pelo Vite no navegador.

---

🎯 Objetivo do projeto

O zooGuest foi desenvolvido com o objetivo de aplicar conhecimentos de:

- Desenvolvimento Web
- React
- TypeScript
- Banco de dados NoSQL
- Autenticação
- Componentização
- Manipulação de estados
- Lógica de programação
- Desenvolvimento de jogos

---

👨‍💻 Projeto

zooGuest

Projeto acadêmico desenvolvido para praticar conceitos de desenvolvimento web moderno utilizando React, TypeScript e Firebase.
