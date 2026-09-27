# zooGuest — Adivinhação de Animais & Ranking em Tempo Real

Olá! Seja muito bem-vindo ao **zooGuest**.

Este projeto nasceu como uma ponte prática e divertida entre o universo da biologia e a engenharia de software moderno. Nos primeiros passos do aprendizado de desenvolvimento móvel, quase todo estudante se depara com a famosa "síndrome da memória de peixinho dourado": você cria um aplicativo incrível, cadastra dados com carinho, mas assim que fecha o app ou reinicia o celular, tudo desaparece no ar.

O **zooGuest** resolve isso conectando um jogo de dedução animal a um banco de dados real na nuvem do **Google Firebase** (especificamente no banco de dados NoSQL **`testdatabase`** do Firestore), permitindo que qualquer pessoa se autentique com sua conta Google ou e-mail e veja sua pontuação disputando o ranking global ao vivo.

---

## 🎨 Identidade Visual & Paleta de Cores

O aplicativo utiliza uma paleta de cores botânica elegante e natural, projetada para combinar alta legibilidade, serenidade e imersão:

- **`#403D58` (Slate Mauve / Grafite Sutil)**: Utilizado em bordas finas, linhas divisórias, cabeçalhos secundários e elementos neutros.
- **`#F9A620` (Âmbar Solar / Dourado)**: Cor de destaque principal, aplicada nos botões de ação (CTA), na pontuação em jogo e nas características **"quase certas"**.
- **`#548C2F` (Verde Musgo / Folha Viva)**: Aplicado nas características **"exatas/corretas"** e nos destaques de vitória.
- **`#104911` (Verde Pinheiro Profundo)**: O tom de fundo das cartas e da camada de escurecimento sobre a fotografia da floresta, garantindo contraste nítido e conforto visual.

> **Filosofia de Design**: O visual prioriza linhas retas, precisas e funcionais, evitando bordas arredondadas exageradas ou efeitos visuais desnecessários. A fotografia de floresta é exibida como fundo imersivo durante o jogo, mantendo a tela de login limpa e focada.

---

## 🎯 Como o Jogo Funciona

1. **Catálogo Amplo com 260 Espécies**: O sistema conta com mais de **260 animais catalogados** de todas as ordens biológicas: mamíferos terrestres e marinhos, aves de rapina e canoras, répteis, anfíbios, peixes fluviais e marinhos, e invertebrados fascinantes.
2. **O Palpite**: Você escolhe um animal para testar.
3. **Comparação Biológica em 8 Atributos**:
   - **Classe**: Mamífero, Ave, Réptil, Anfíbio, Peixe ou Invertebrado.
   - **Habitat**: Floresta, Savana, Aquático, Deserto, Polar ou Montanha.
   - **Dieta**: Carnívoro, Herbívoro, Onívoro ou Insetívoro.
   - **Porte**: Pequeno, Médio, Grande ou Gigante.
   - **Hábito**: Diurno, Noturno ou Crepuscular.
   - **Locomoção**: Anda/Corre, Voa, Nada, Rasteja ou Pula.
   - **Continente**: América do Sul, África, Ásia, Oceania, Europa, Antártida ou Global.
   - **Revestimento**: Pelos, Penas, Escamas, Pele Úmida ou Carapaça.
4. **Sistema de Cores Semafórico**:
   - **Verde (`#548C2F`) — Correto**: O animal secreto possui exatamente esse mesmo atributo.
   - **Laranja (`#F9A620`) — Quase Certo**: O atributo está muito próximo (por exemplo: você chutou porte *Médio* e o animal secreto é *Grande*, ou chutou *Carnívoro* e ele é *Insetívoro*).
   - **Cinza (`#403D58`) — Diferente**: A característica não tem relação com o animal secreto.
5. **Pontuação Inversamente Proporcional**: Quanto menos palpites você gastar para acertar, mais pontos acumula para o seu perfil no Firestore (1000 pontos na 1ª tentativa, 850 na 2ª, 700 na 3ª, até 100 pontos).

---

## 🔍 Explicando as Linhas de Código Mais Importantes

Aqui está uma conversa sincera sobre como o coração do aplicativo foi construído, linha por linha:

### 1. Conectando com o banco `testdatabase` no Firestore (`src/firebaseConfig.ts`)

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Inicializa a aplicação Firebase com as credenciais do projeto
const app = initializeApp(firebaseConfig);

// AQUI ESTÁ O SEGREDO: Indicamos explicitamente o ID do banco 'testdatabase'
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || 'testdatabase');
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

> **Por que essa linha é tão importante?**  
> Por padrão, o Firebase procura um banco chamado `(default)`. Se o seu projeto tiver criado um banco nomeado como `testdatabase`, chamar `getFirestore(app)` sem o segundo parâmetro faria o app tentar gravar no lugar errado e falhar silenciosamente. Passar `testdatabase` garante que as fichas dos jogadores vão exatamente para onde devem ir.

---

### 2. Autenticação e Controle de Sessão (`src/context/AuthContext.tsx`)

```typescript
// Escutando se o usuário está logado ou não
useEffect(() => {
  const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);

    if (currentUser) {
      const userDocRef = doc(db, 'jogadores', currentUser.uid);
      const snap = await getDoc(userDocRef);

      // Se for a primeira vez que esse jogador entra, criamos a ficha dele
      if (!snap.exists()) {
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          nome: currentUser.displayName || currentUser.email?.split('@')[0],
          pontuacaoTotal: 0,
          vitorias: 0,
          melhorTentativa: 99,
        });
      }
    }
  });

  return () => unsubAuth();
}, []);
```

> **Por que essa linha é tão importante?**  
> `onAuthStateChanged` funciona como um porteiro atencioso. Ele não deixa você na mão se der um "F5" ou fechar o app: ele se lembra de quem você é. Ao mesmo tempo, usamos `currentUser.uid` como chave do documento no Firestore. Isso impede que jogadores sobrescrevam as pontuações uns dos outros.

---

### 3. A Lógica do "Quase Certo" em Laranja (`src/data/animals.ts`)

```typescript
function evaluateAttribute(key: CompareAttributeKey, guessVal: string, secretVal: string) {
  // Se for idêntico, recebe verde na hora
  if (guessVal === secretVal) {
    return { status: 'exact', label: 'Correto' };
  }

  // Se o tamanho for adjacente (ex: Médio vs Grande), fica Laranja!
  if (key === 'tamanho') {
    const distancia = Math.abs(SIZE_SCALE[guessVal] - SIZE_SCALE[secretVal]);
    if (distancia === 1) {
      return { status: 'close', label: 'Porte próximo' };
    }
  }

  // Se houver sobreposição na dieta (ex: Carnívoro e Insetívoro)
  if (key === 'dieta') {
    const correlata =
      (guessVal === 'Carnívoro' && secretVal === 'Insetívoro') ||
      (guessVal === 'Onívoro' && (secretVal === 'Carnívoro' || secretVal === 'Herbívoro'));
    if (correlata) {
      return { status: 'close', label: 'Dieta correlata' };
    }
  }

  return { status: 'different', label: 'Diferente' };
}
```

> **Por que essa linha é tão importante?**  
> Sem a pista em laranja, um jogo de dedução se torna pura sorte e frustração. Quando o sistema avisa que você "passou raspando" no porte ou na dieta, seu cérebro de investigador se ativa e o próximo palpite se torna muito mais calculado e satisfatório.

---

### 4. Salvando a Pontuação com Atualização Parcial (`src/context/AuthContext.tsx`)

```typescript
await updateDoc(userDocRef, {
  pontuacaoTotal: pontuacaoAtual + pontosGanhos,
  partidasJogadas: partidasAtuais + 1,
  vitorias: vitoriasAtuais + 1,
  melhorTentativa: Math.min(melhorTentativaAtual, tentativas),
  atualizadoEm: new Date().toISOString(),
});
```

> **Por que essa linha é tão importante?**  
> A função `updateDoc` atua como uma borracha mágica: ela apaga apenas o campo que mudou e escreve o novo valor por cima, preservando todo o resto do perfil. Isso economiza dados, processamento e garante a integridade da ficha do usuário no banco.

---

### 5. O Ranking Reativo com `onSnapshot` (`src/components/Leaderboard.tsx`)

```typescript
const consultaRanking = query(jogadoresRef, orderBy('pontuacaoTotal', 'desc'), limit(50));

const desinscrever = onSnapshot(consultaRanking, (snapshot) => {
  const listaAtualizada: Jogador[] = [];
  snapshot.forEach((docSnap) => {
    listaAtualizada.push(docSnap.data() as Jogador);
  });
  setRanking(listaAtualizada);
});

// Importante: limpamos a escuta ao fechar o componente para não gastar bateria!
return () => desinscrever();
```

> **Por que essa linha é tão importante?**  
> O `onSnapshot` é o que os programadores chamam de "Espelho Mágico". Ele cria uma ligação contínua entre o servidor do Google e a tela do seu celular. No exato milissegundo em que outro aluno acertar um animal e somar pontos em outro dispositivo, o ranking se reorganiza sozinho na sua tela, sem você precisar recarregar nada.

---

## 🚀 Como Executar com Expo Go no Android

Se você quiser rodar esse mesmo projeto no seu celular com o aplicativo **Expo Go**, faça o seguinte:

1. **Instale o Expo Go**: Baixe gratuitamente na Google Play Store do seu smartphone Android.
2. **Crie o projeto no computador**:
   ```bash
   npx create-expo-app@latest zoo-enigma --template
   ```
   *(Escolha a opção Navigation com TypeScript).*
3. **Instale os pacotes necessários**:
   ```bash
   npx expo install firebase @react-native-async-storage/async-storage
   ```
4. **Configure o `.env` na raiz**:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY="AIzaSyDzncv13_9DRw9S3sEBTXl2lVbIvFbN_GI"
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="academic-ether-plcf1.firebaseapp.com"
   EXPO_PUBLIC_FIREBASE_PROJECT_ID="academic-ether-plcf1"
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="academic-ether-plcf1.firebasestorage.app"
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="239152846442"
   EXPO_PUBLIC_FIREBASE_APP_ID="1:239152846442:web:a14f4b223eeaa3a2db1c13"
   EXPO_PUBLIC_FIREBASE_DATABASE_ID="testdatabase"
   ```
5. **Inicie o servidor**:
   ```bash
   npx expo start
   ```
6. **Escaneie o QR Code**: Abra o aplicativo Expo Go no seu Android, aponte para o QR Code no terminal e aproveite o jogo na palma da sua mão!
