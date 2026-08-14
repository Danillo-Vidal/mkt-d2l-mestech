# XPE Community Tech — Landing Page

Landing page do evento **XPE Community Tech** (31/08 a 29/09/2026), o primeiro evento da Comunidade
de Pós-Graduação da XP Educação. Reúne a programação completa: avisos, aulas da semana em carrossel,
agenda detalhada por semana, FAQ e comunidade no Discord.

---

## Destino de publicação: GitHub Pages com link externo no LMS

A página é uma **SPA estática** (React renderizado no navegador, sem servidor). O build gera
HTML/CSS/JS puro na pasta `docs/`, que é exatamente o que o GitHub Pages serve. É referenciada como
**link externo** dentro do LMS (Brightspace/D2L).

Não há SSR, Node.js nem função serverless em produção — apenas arquivos estáticos.

---

## Para quem só precisa atualizar o conteúdo

Se você é da operação acadêmica e só quer trocar uma data, um link ou o nome de um instrutor, são
**dois arquivos** — e só eles:

| Arquivo | O que fica lá |
|---|---|
| 📍 `src/data/event.ts` | **Textos, datas e links de cada aula**: sessões, trilhas, avisos, FAQ, rodapé |
| 📍 `src/data/links.ts` | **URLs globais**: comunidade (Discord) e redes sociais |
| 📍 `src/data/images.ts` | **Imagens**: banner do topo e futuras fotos |

Você edita texto, data, link e imagem — sem tocar em HTML, CSS ou layout.

### Trocar os links de uma aula

Cada aula tem os seus próprios links, no objeto da sessão em `src/data/event.ts`:

```ts
{
  id: "s1-1",
  title: "O que realmente é fluência em IA…",
  zoomUrl: "",           // botão "Entrar na Aula (Zoom)"
  registrationUrl: "",   // botão "Quero me Inscrever"
  materialsUrl: "",      // botão "Acessar Materiais"
  replayUrl: "",         // botão "Replay"
}
```

**A convenção dos campos de URL é o que controla os botões:**

| Valor do campo | O que aparece no card |
|---|---|
| campo **ausente** | o botão **não aparece** |
| `""` (string vazia) | o botão aparece **desabilitado** — conteúdo ainda não liberado |
| URL preenchida | o botão aparece **ativo** |

É assim que a Semana 4 tem uma aula sem "Quero me Inscrever": o campo simplesmente não existe
naquela sessão, e no lugar há um `note` explicando que a inscrição é pelo próprio Zoom.

> O `zoomUrl` tem uma regra a mais: mesmo preenchido, o botão só ativa **30 minutos antes** da aula
> e desativa quando ela termina. Ver *Regras de negócio*.

As URLs que valem para a página inteira (Discord, redes sociais) ficam em `src/data/links.ts`.

### Adicionar mais uma aula numa semana

A seção **Aulas da Semana** é um carrossel. Cada sessão do array `sessions` da semana vira um slide
automaticamente — então para acrescentar uma aula, basta adicionar um item ao array em
`src/data/event.ts`:

```ts
{
  id: "semana-2",
  label: "Semana 2",
  label: "Semana 2",
  theme: "Tendências e Mercado para 2026",
  layout: "stack",
  sessions: [
    { id: "s2-1", /* … */ },
    { id: "s2-2", /* … */ },
    { id: "s2-3", /* nova aula: já aparece como slide e na Agenda */ },
  ],
}
```

Não é preciso mexer em componente nenhum: a aula entra no carrossel, ganha um pontinho de navegação
e passa a aparecer também na Agenda do Evento.

**Ritmo da passagem automática:** as aulas passam sozinhas de tempo em tempo. O intervalo é a
constante `AUTOPLAY_MS`, no topo de `src/components/event/WeeklyClasses.tsx`:

```ts
const AUTOPLAY_MS = 6000;   // 6 segundos. Use 3000 para testar rápido, 10000 para leitura calma.
```

A passagem para sozinha enquanto o mouse está sobre o carrossel ou o foco do teclado está dentro
dele, para dar tempo de ler e de clicar nos botões do card.

Campos da semana: `label` é o texto do botão da semana ("Semana 2"); `theme` aparece
acima dos cards; `layout` define o arranjo na Agenda (`"stack"` = uma coluna, `"grid"` = duas
colunas, usado nas trilhas da Semana 3).

### Trocar ou adicionar uma imagem

As imagens ficam em `src/assets/` e são registradas em `src/data/images.ts`.

**Para trocar** o banner: substitua o arquivo em `src/assets/` mantendo o mesmo nome. Se as
dimensões mudaram, atualize `width`/`height` no registro.

**Para adicionar** uma imagem nova:

```ts
// src/data/images.ts
import bannerCarreira from "@/assets/banner-carreira.png";   // 1. importe

export const images = {
  banner: { ... },
  bannerCarreira: {                                          // 2. registre
    src: bannerCarreira,
    alt: "Descrição para leitores de tela",
    width: 1400,
    height: 467,
  },
} satisfies Record<string, ImageAsset>;
```

Depois use onde quiser, sem escrever HTML de imagem:

```tsx
<Banner image={images.bannerCarreira} />
```

#### Versões por tamanho de tela

Cada imagem aceita até três arquivos. O navegador baixa **só um** e ignora os outros:

| Campo | Faixa de tela | Uso |
|---|---|---|
| `mobile` | até 639px | celular |
| `tablet` | 640px a 1023px | tablet |
| `src` | 1024px ou mais | desktop — e padrão de queda |

Só `src` é obrigatório. Sem `mobile`/`tablet`, o celular baixa a imagem grande — funciona, mas
desperdiça banda.

**Como o navegador escolhe:** ele não olha só a largura da janela, mas os **pixels físicos**
necessários — largura exibida × densidade da tela. Um celular de 375px com tela 2× precisa de
~690px reais. Se a variante `mobile` for menor que isso, ele descarta e baixa a de desktop.

> ⚠️ **Por isso a variante mobile precisa ter pelo menos ~800px de largura.** Um arquivo de 412px
> nunca é escolhido em celular moderno (praticamente todos são 2× ou 3×) — ele só entra em telas 1×.
> Exportar o banner mobile com ~1000px de largura cobre bem telas 2× sem chegar perto do peso da
> versão de desktop.

**Convenções:**

- **Nome do arquivo** em minúsculas, com hífens, sem espaços nem acentos (`banner-carreira.png`).
  Espaços no nome quebram a URL em alguns navegadores.
- **Sempre importe** o arquivo. Nunca escreva o caminho como texto (`src="/banner.png"`) — o import
  é o que faz o Vite aplicar o subcaminho `/landing-pages/` e adicionar hash de cache. Caminho
  escrito à mão funciona no `npm run dev` e dá **404 em produção**.
- **`width`/`height`** são as dimensões reais de cada arquivo. Fazem o navegador reservar o espaço
  antes da imagem carregar, evitando que o texto "salte". A imagem segue responsiva — quem controla
  o tamanho exibido é o CSS.
- **`alt`** descreve a imagem para leitores de tela. Se for puramente decorativa, use `alt: ""`.
- **`priority`** (no `<Banner priority />`) só para imagens visíveis sem rolar a página. Em imagens
  mais abaixo, desperdiça banda.
- **Todas as variantes precisam ter a mesma proporção e composição**, mudando só o tamanho. A troca
  é por resolução (`srcset`), não por recorte. Se o celular precisar de um recorte diferente — por
  exemplo quadrado, com o texto maior — aí é caso de `<picture>` com media queries, e o comentário
  no topo de `Banner.tsx` explica o que muda.

**Regras importantes ao editar:**

- **Datas em formato ISO** (`2026-09-08T19:00:00-03:00`), sempre com o fuso `-03:00`. A liberação do
  botão de acesso e o rótulo "Aula encerrada" são calculados a partir dessa data e de
  `durationMinutes`. Não existe campo de status para digitar à mão.
- **Não existe hora de término.** O fim é `dateTime + durationMinutes`. Para mudar quando a aula
  acaba, mude a duração.
- **Zoom ainda não definido:** deixe `zoomUrl: ""` (string vazia). Isso mantém o botão desabilitado
  mesmo dentro da janela de liberação — evita link quebrado na cara do aluno.
- **Sessão que cobre vários dias:** use `dateLabel` para sobrescrever a data exibida
  (ex. `dateLabel: "15/09 a 19/09"`). Sem isso, o card mostra apenas o dia de início.
- **Trilhas sem parágrafo descritivo:** use `topic` em vez de `description`. O card renderiza
  "Tema: …" — é o formato das trilhas da Semana 3.
- **Rótulo diferente no botão do Zoom:** use `zoomLabel` (ex. `"Acesse a aula no Zoom"`). Sem ele,
  o padrão é "Entrar na Aula (Zoom)".
- Depois de editar, é necessário rodar o build e publicar (ver *Publicação* abaixo). A alteração
  **não** vai ao ar sozinha.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 (SPA — renderização no cliente) |
| Roteamento | TanStack Router |
| Build | Vite 8 → saída estática em `docs/` |
| Linguagem | TypeScript (modo `strict`) |
| Estilo | Tailwind CSS 4 |
| Componentes | shadcn/ui (estilo *new-york*) sobre Radix UI |
| Ícones | lucide-react |
| Hospedagem | GitHub Pages (arquivos estáticos) |

---

## Estrutura de arquivos

```
index.html              Entry HTML — meta tags, title, OG (SEO fica aqui)
src/
  main.tsx              Monta o React no #root
  router.tsx            Instancia o TanStack Router
  routes/
    __root.tsx          Layout raiz + telas de 404 e erro
    index.tsx           A landing page — só compõe as seções, na ordem
  assets/               Imagens (banner, fotos) — importadas, nunca por caminho fixo
  data/
    event.ts            ★ Textos, datas, sessões, links por aula, FAQ
    links.ts            ★ URLs globais (Discord, redes sociais)
    images.ts           ★ Registro das imagens (variantes, alt, dimensões)
    helpers.ts          Status derivado de data, semana inicial, formatação
    mappers.ts          status → aparência do badge
  components/
    event/
      WeeklyClasses.tsx Abas de semana + carrossel de aulas
      Agenda.tsx        Listagem completa por semana
      SessionCard.tsx   Card de aula (usado nas duas seções)
      Banner.tsx        Imagem responsiva (srcset por tamanho de tela)
      Faq.tsx           Accordion do FAQ
      ui.tsx            Primitivos: Badge, Section, SectionTitle, ActionLink
    ui/                 shadcn/ui (biblioteca base — inclui o carousel/embla)
  styles.css            Design system (variáveis de cor em oklch)
docs/                   ← Build de produção. Gerado, mas commitado (GitHub Pages serve daqui)
```

Os arquivos marcados com ★ são os únicos que a operação acadêmica precisa editar.

---

## Rodando localmente

```bash
npm install
npm run dev
```

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento com hot reload (porta 5173) |
| `npm run build` | Build de produção → gera `docs/` |
| `npm run preview` | Serve localmente o conteúdo de `docs/` (simula o GitHub Pages) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier em todo o projeto |

> ⚠️ **Dois lockfiles no repositório.** Existem `bun.lock` *e* `package-lock.json`. A mesma
> dependência pode resolver em versões diferentes dependendo de quem instalou. Escolher um
> gerenciador e apagar o lockfile do outro é uma pendência aberta — ver *Pendências conhecidas*.

---

## Estrutura da página

Ordem atual, na sequência em que aparecem em `src/routes/index.tsx`:

0. **Banner** — masthead da marca (XPE Community /Tech)
1. **Hero** — "Bem-vindo ao XPE Community Tech!", três parágrafos de apresentação e um CTA único,
   *Acessar Agenda*, que rola com animação até a seção 5
2. **Comunidade** — Discord oficial, com 5 benefícios de participação
3. **Avisos Importantes sobre o evento** — 4 avisos numerados num único card: acesso ao Zoom,
   publicação de links, materiais em até 24h, certificado em até 5 dias úteis
4. **Aulas da Semana** — botões de semana + **carrossel** das aulas da semana escolhida, que passam
   automaticamente por tempo. Abre já na semana em andamento (ou na próxima a acontecer)
5. **Agenda do Evento** — programação completa, semana a semana, com tema e os botões por aula
   (inscrição, Zoom, calendário, materiais, replay):
   - Semana 1 (31/08 e 01/09) — IA aplicada ao trabalho do profissional de tecnologia
   - Semana 2 (08/09) — Tendências e Mercado para 2026
   - Semana 3 (15/09 e 22/09) — Trilhas Especializadas por Pós-Graduação (grid de 2 colunas:
     Arquitetura de Software, Engenharia de Dados, Segurança da Informação, Data Science & ML)
   - Semana 4 (29/09) — Carreira e futuro do profissional de tecnologia
6. **FAQ do Evento** — accordion com 4 perguntas
7. **Rodapé** — nome da marca e três links: Instagram, site da XP Educação e LinkedIn

> A seção **Comunidade** subiu para a posição 2 (no protótipo ela não existia). A ordem do protótipo
> era hero → avisos → aulas → agenda → FAQ.

As seções 4 e 5 leem o **mesmo** array `weeks` de `src/data/event.ts`: o carrossel mostra a semana
selecionada em cards compactos, a Agenda mostra tudo em cards completos. Uma aula cadastrada aparece
automaticamente nas duas.

---

## Regras de negócio

Estas regras são **especificação do protótipo**, não detalhe de implementação. Alterá-las muda o
comportamento acordado com a área acadêmica.

### As duas margens de horário

Duas constantes independentes em `src/data/helpers.ts` governam tudo que muda com o relógio:

| Constante | Valor | O que faz |
|---|---|---|
| `LIVE_WINDOW_MINUTES` | 30 | antecedência com que o acesso **abre** |
| `OVERTIME_TOLERANCE_MINUTES` | 30 | tolerância após o término previsto antes de a aula contar como **encerrada** |

São separadas de propósito: a primeira responde "já pode entrar", a segunda "a transmissão acabou".
Mudar uma não deve mexer na outra.

> ⚠️ O valor de `LIVE_WINDOW_MINUTES` está **anunciado ao aluno no FAQ** ("Como acessar o evento ao
> vivo?"). Mudar a constante sem atualizar o texto deixa a página prometendo uma coisa e fazendo
> outra.

### Liberação do botão de aula

O acesso **abre 30 minutos antes** do início e **não fecha mais** — o link segue clicável
indefinidamente. É intencional: a sala e a gravação podem continuar úteis depois, e um link que
morre no minuto do encerramento deixa quem chegou atrasado sem nada.

Além do horário, o botão só ativa se a sessão tiver `zoomUrl` preenchido. Sessão sem link continua
desabilitada mesmo no horário — de propósito, para não expor link quebrado.

### Estados do card de sessão

O badge é **fixo em "Confirmado"** (`src/data/mappers.ts`). "Em breve" era lido por parte dos alunos
como "ainda não confirmamos esta aula", o que enfraquecia a programação. Quando a aula acontece já
está na data e hora exibidas no card.

O relógio governa apenas os botões. Numa aula das 19h às 20h30:

| Momento | Badge | Botão de acesso | Quero me Inscrever |
|---|---|---|---|
| Até 18h29 | `Confirmado` | apagado e **bloqueado** | verde, clicável |
| 18h30 às 20h30 | `Confirmado` | verde — "Entrar na Aula (Zoom)" | verde, clicável |
| 20h30 às 20h59 (prorrogação) | `Confirmado` | verde — "Entrar na Aula (Zoom)" | verde, clicável |
| A partir de 21h00 | `Confirmado` | apagado, **mas clicável** — "Aula encerrada" | apagado, **mas clicável** |

A distinção entre as duas últimas colunas da tabela está em duas variantes de botão que parecem
iguais e se comportam diferente (`src/components/event/ui.tsx`):

- **`disabled`** — aparência apagada **e** bloqueada. É um `<span aria-disabled>`, sem destino.
  Usada quando não há link cadastrado.
- **`quiet`** — a mesma aparência, porém um `<a>` clicável. Usada depois do encerramento: a ação
  perde o destaque visual sem bloquear quem ainda precisa dela.

O rótulo "Aula encerrada" (`ENDED_ZOOM_LABEL` em `event.ts`) sobrescreve até um `zoomLabel` próprio
da sessão — a informação de encerramento vale mais que o rótulo customizado.

### Botão "Adicionar ao Calendário"

Abre o Google Calendar com o evento já preenchido, usando **link de template** — sem OAuth, sem API
key, sem backend. Quem decide salvar é o aluno.

A feature segue a separação em três camadas:

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| Dados | `src/data/event.ts` | título, data, duração, instrutor, link do Zoom |
| Lógica | `src/lib/calendar.ts` | `formatDateForGoogle` e `gerarLinkGoogleCalendar` |
| Adaptador | `src/data/helpers.ts` | `getSessionCalendarUrl` — converte `Session` em evento |
| Apresentação | `SessionCard.tsx` | o botão |

**`src/lib/calendar.ts` é agnóstico**: fala de `CalendarEvent` genérico e não importa nada do
projeto. Serve igual para webinars, lives e eventos institucionais — dá para copiar o arquivo para
outro projeto sem ajuste. É por isso que o adaptador `Session → CalendarEvent` mora em `helpers.ts`
e não lá: a dependência corre numa só direção (`data → lib`, nunca o contrário).

**Adicionar uma aula não exige tocar em nenhum dos dois.** O botão sai pronto a partir de
`dateTime`, `durationMinutes`, `title`, `instructor` e `zoomUrl`.

Comportamento:

- O horário de término vem de `durationMinutes` — não existe campo de fim para cadastrar.
- A descrição do compromisso repete o **link do Zoom**, para o aluno encontrá-lo na agenda no dia da
  aula em vez de voltar à página.
- Aula já encerrada tem o botão desabilitado: não há o que agendar.
- Data mal cadastrada desabilita **só aquele** botão, com o id da sessão nomeado no console — a
  página não quebra.

> 📌 Hoje o botão aparece nos cards da **Agenda do Evento**. Os cards do carrossel são resumos com
> duas ações, e um terceiro botão os deixaria apertados. Para mostrar lá também, mova o bloco do
> `ActionLink` de calendário para fora do `{compact ? null : (…)}` em `SessionCard.tsx`.

### Materiais e replay por aula

Cada card tem botões próprios de "Acessar Materiais" e "Replay", controlados pela convenção de URL
descrita acima. Enquanto a URL estiver vazia, o botão aparece **efetivamente desabilitado**
(`aria-disabled`), não apenas com opacidade reduzida — caso contrário o leitor de tela continua
anunciando o elemento como clicável.

### Semana inicial do carrossel

A seção já vem aberta na primeira semana que ainda tem alguma sessão por acontecer
(`getCurrentWeekIndex` em `src/data/helpers.ts`). Depois do evento inteiro, cai na última semana.
Assim o aluno não precisa procurar onde a programação está.

### Passagem automática das aulas

As aulas passam sozinhas a cada `AUTOPLAY_MS` (`src/components/event/WeeklyClasses.tsx`). Três
comportamentos importam:

- **Para ao interagir** — com o mouse sobre o carrossel ou o foco do teclado dentro dele, a passagem
  suspende. Sem isso, o card escaparia no meio da leitura ou no caminho do clique.
- **Não roda para quem pediu menos animação** — se o sistema tem `prefers-reduced-motion: reduce`,
  não há passagem automática. Movimento involuntário afeta quem tem sensibilidade vestibular.
- **Cada card ocupa mais de metade da largura** (`SLIDE_WIDTH`). É isso que garante que duas aulas
  não caibam juntas e exista para onde avançar. Se o valor for afrouxado para caber tudo de uma vez,
  a passagem automática deixa de ter efeito — não é defeito, é não haver para onde ir.

---

## Identidade visual

As cores são definidas em `src/styles.css` como variáveis CSS em **oklch** (`:root` para o tema
claro, `.dark` para o escuro). Para trocar uma cor, altere a variável — nunca escreva cor literal
em classe de componente.

A paleta vem do protótipo (Figma → SVG). O hex de origem está anotado em cada linha do `styles.css`.

| Variável | Uso | Hex do protótipo |
|---|---|---|
| `--primary` | Fundo de botão, ícones, aba selecionada | `#05B50F` |
| `--accent` | Fundo dos badges e botões secundários | `#E8F5E9` |
| `--accent-foreground` | Verde para **texto** (badge, rótulo de semana) | escurecido — ver abaixo |
| `--foreground` | Texto principal | `#212121` |
| `--muted-foreground` | Texto secundário / descrições | `#6B7280` |
| `--text-tertiary` | Texto terciário (instrutor, observações) | escurecido — ver abaixo |
| `--surface-alt` | Fundo de seção alternada | `#FAFAFA` |
| `--tab-idle` | Aba de semana não selecionada | `#E2E8F0` |
| `--border` | Bordas de card | `#E0E0E0` |

**Dois valores do protótipo foram escurecidos** porque reprovavam em WCAG AA como cor de texto. A
matiz e a saturação da marca foram preservadas — só a luminância caiu:

| Valor do protótipo | Contraste original | Ajustado para |
|---|---|---|
| `#05B50F` como texto sobre `#E8F5E9` | 2,45:1 ❌ | `--accent-foreground` → 4,52:1 ✅ |
| `#9F9F9F` como texto sobre branco | 2,65:1 ❌ | `--text-tertiary` → 4,71:1 ✅ |

> ⚠️ **O verde vibrante não serve como cor de texto.** `--primary` (`#05B50F`) tem 2,75:1 sobre
> branco. Use-o só como **fundo**, com texto escuro por cima. Para verde em texto existe
> `--accent-foreground`, já escurecido.

### Texto branco nos botões verdes — desvio conhecido

`--primary-foreground` é **branco** (`oklch(1 0 0)`), como no protótipo do Figma. Sobre o verde
`#05B50F` isso dá **2,76:1** e **reprova em WCAG AA** (mínimo 4,5:1).

É decisão de projeto, tomada com o número à vista. O token é o ponto único: mudar aquela linha do
`styles.css` afeta todos os botões, o botão da semana selecionada e os componentes shadcn de uma vez.

As três combinações possíveis, para quem revisitar:

| Opção | Verde | Texto | AA |
|---|---|---|---|
| **Em uso** | `#05B50F` vibrante | branco | ❌ 2,76:1 |
| Texto escuro | `#05B50F` vibrante | `#212121` | ✅ 5,84:1 |
| Verde fechado | `#008A00` | branco | ✅ 4,53:1 |

Reduzir a saturação não resolve: em qualquer chroma, o verde precisa cair para a mesma faixa de
luminosidade para o branco passar — o que descaracteriza a marca.

Curiosamente, a variante `quiet` (aparência apagada, usada em aula encerrada) é a única dos botões
que passa com folga: 4,54:1.

### Contraste medido (WCAG AA — mínimo 4,5:1 para texto)

Medido no DOM renderizado do build de produção, resolvendo as cores finais em sRGB:

| Combinação | Contraste | |
|---|---|---|
| `h1` / branco | 16,10:1 | ✅ |
| Título de seção / `surface-alt` | 15,43:1 | ✅ |
| Aba de semana não selecionada / `tab-idle` | 5,84:1 | ✅ |
| Rótulo "Semana N" (`accent-foreground`) | 4,86:1 | ✅ |
| Parágrafo do hero / branco | 4,83:1 | ✅ |
| Descrição de aula / branco | 4,83:1 | ✅ |
| Botão `quiet` e `disabled` (`text-tertiary` / `surface-alt`) | 4,54:1 | ✅ |
| Badge de categoria (`accent-foreground` / `accent`) | 4,51:1 | ✅ |
| Número do aviso (`accent-foreground` / `accent`) | 4,51:1 | ✅ |
| **Botão verde (branco / `#05B50F`)** | **2,76:1** | ❌ |
| **Aba de semana selecionada (branco / `#05B50F`)** | **2,76:1** | ❌ |

As margens são estreitas nas que passam — **clarear `--accent-foreground` acima de `0.51` ou
`--text-tertiary` acima de `0.557` volta a quebrar a conformidade.** Os limites estão anotados como
comentário no próprio `styles.css`.

As duas reprovações vêm da mesma escolha: texto branco sobre o verde da marca. Ver *Texto branco nos
botões verdes* acima.

---

## Acessibilidade

Página institucional de universidade — sujeita a auditoria. Requisitos que devem ser mantidos:

- HTML semântico (`<header>`, `<main>`, `<section>`), com `<h1>` único
- Accordion do FAQ com `<button>` e `aria-expanded` alternando de fato
- Foco visível (`:focus-visible`, contorno de 2px)
- SVG decorativo com `aria-hidden="true"`
- Contraste mínimo de 4,5:1 em texto
- Estados desabilitados desabilitados de verdade, não só visualmente — a variante `quiet` existe
  justamente para o caso oposto: aparência apagada com o link **funcionando**
- Rolagem animada e passagem do carrossel respeitam `prefers-reduced-motion`

### Rolagem animada até a Agenda

O botão "Acessar Agenda" rola com animação, implementada em `src/lib/scroll.ts`.

**Por que em JavaScript e não `scroll-behavior: smooth` no CSS:** a versão em CSS torna animada toda
rolagem da página, inclusive as que o TanStack Router dispara na restauração de scroll
(`scrollRestoration` está ligado em `src/router.tsx`). As duas competem, uma corta a outra, e a
página anda um trecho curto e para.

Na implementação atual o clique chama `preventDefault()` e **não altera o hash** — assim o router não
entra em cena. A posição é escrita quadro a quadro, com duração proporcional à distância.

> ⚠️ O `styles.css` mantém `scroll-behavior: auto` de propósito. Trocar para `smooth` reintroduz o
> conflito descrito acima.

Três constantes no topo de `scroll.ts` controlam o ritmo: `MIN_DURATION_MS`, `MAX_DURATION_MS` e
`MS_PER_1000PX`. A animação cancela se a pessoa rolar, arrastar ou teclar durante o percurso, e é
substituída por salto direto sob `prefers-reduced-motion`.

> 📌 **Desvio conhecido — WCAG 2.2.2 "Pause, Stop, Hide" (nível A).** As aulas passam
> automaticamente e **não há botão de pausa**, por decisão de projeto (o controle foi removido a
> pedido, para não poluir a interface). O critério pede um mecanismo explícito de parada para
> conteúdo que se move sozinho por mais de 5 segundos.
>
> Mitigações em vigor: a passagem para ao passar o mouse ou focar com o teclado, não roda sob
> `prefers-reduced-motion`, e os pontinhos permitem escolher a aula diretamente. Se a página passar
> por auditoria formal de acessibilidade, este é o ponto a reabrir — devolver o botão de pausa é uma
> alteração pequena e localizada em `WeeklyClasses.tsx`.

## Responsividade

Mobile-first. O layout base é escrito para ~320px e cresce por `min-width`. Como a página pode
acabar dentro de um container de largura imprevisível, prefira `clamp()` em tipografia e
`repeat(auto-fit, minmax(…, 1fr))` em grids — assim o layout responde à largura real disponível, e
não à viewport.

---

## Publicação

**Hospedagem:** GitHub Pages, servindo a pasta `/docs` da branch `main`  
**Destino no LMS:** Link externo em widget ou página do curso  

O deploy é manual e tem **dois passos** — o build não roda no servidor:

```bash
npm run build
```

```bash
git add docs && git commit -m "build: atualiza site estático" && git push
```

O `docs/` é build gerado, mas **é commitado de propósito** — é dele que o GitHub Pages serve. Não
adicione `docs` ao `.gitignore`.

### Configuração no GitHub (uma vez só)

Em **Settings → Pages**: Source = `Deploy from a branch`, Branch = `main`, Folder = `/docs`.

### Detalhes que fazem isso funcionar

O site não é servido na raiz do domínio, e sim em `https://xp-educacao.github.io/landing-pages/`.
Esse subcaminho precisa ser respeitado em **dois lugares** — errar um deles derruba a página:

- **`BASE` em `vite.config.ts`** (`/landing-pages/`) — prefixa os assets. Sem isso o navegador
  busca `/assets/…` na raiz do domínio e recebe 404.
- **`basepath` em `src/router.tsx`** — lê `import.meta.env.BASE_URL` (o mesmo `BASE`). Sem isso o
  TanStack Router tenta casar o caminho `/landing-pages/` com as rotas, não encontra nenhuma e
  renderiza a tela de 404 da própria app — com os assets carregando normalmente, o que faz parecer
  problema de conteúdo e não de rota.

> ⚠️ **Se o repositório for renomeado, atualize `BASE`.** É o único lugar a mudar; o router
> acompanha automaticamente.

Também no build:

- **`docs/404.html`** — cópia do `index.html`, gerada pelo plugin `spaFallback`. O GitHub Pages
  devolve esse arquivo quando a URL não casa com nada, então um refresh em qualquer subcaminho
  continua carregando a SPA em vez do 404 do GitHub.
- **`public/.nojekyll`** — impede o Jekyll do GitHub de ignorar arquivos e pastas que começam com `_`.

### Testando o subcaminho localmente

`npm run dev` e `npm run preview` respeitam o `BASE`, então as URLs locais reproduzem produção:

```
http://localhost:5173/landing-pages/    (dev — acessar a raiz redireciona pra cá)
http://localhost:4173/landing-pages/    (preview — o build real)
```

---

## Pendências conhecidas

### Conteúdo a confirmar com a área acadêmica

Pontos onde o protótipo estava incompleto ou ambíguo e a decisão precisa ser confirmada:

- [ ] **Duas aulas no mesmo horário na Semana 2** — o protótipo marca as duas sessões de 08/09 às
      19h. Se forem em dias ou horários diferentes, corrigir `dateTime` em `event.ts`.
- [ ] **Instrutores das trilhas (Semana 3)** — o protótipo traz um nome de exemplo. As quatro
      trilhas estão sem `instructor`, então a linha "Ministrado por" não aparece nesses cards.
- [ ] **Descrições da Semana 4** — o protótipo trazia "loren loren" (texto de preenchimento). Foram
      escritas descrições provisórias; revisar o texto final.
- [ ] **Nomes completos dos instrutores** — o PDF sobrepõe camadas de texto, então há chance de
      grafia incompleta. Conferir "Leandro César Lopes Evangelista", "Marcelo César", "Silas Liu"
      e "André Souza".

### Links ainda não definidos

| Campo | Situação |
|---|---|
| `zoomUrl` | ✅ preenchido nas 10 aulas |
| `registrationUrl` | ✅ preenchido nas 10 aulas |
| `materialsUrl` | ⬜ vazio nas 10 — botão desabilitado |
| `replayUrl` | ⬜ vazio nas 10 — botão desabilitado |
| Redes sociais (`links.ts`) | ✅ Instagram, site da XP e LinkedIn |
| Discord (`links.ts`) | ✅ configurado |

> Hoje `zoomUrl` e `registrationUrl` apontam para a **mesma** URL de registro do Zoom em cada aula.
> Funciona, mas as duas têm disponibilidades diferentes: a inscrição fica clicável sempre, o acesso
> só a partir de 30 min antes. Se houver um link de *join* da reunião distinto do de *register*, o
> ideal é separar os dois.

### Textos a alinhar

Três informações de prazo aparecem em mais de um lugar e hoje não batem:

| Informação | Avisos (seção 3) | FAQ (seção 6) |
|---|---|---|
| Materiais e replays | "em até **24h** após cada aula" | "em até **78 horas** após cada sessão" |
| Certificado | "em até **5 dias úteis**" | "Em breve mais informações" |

Vale escolher uma versão de cada e replicar. Ambos os textos estão em `src/data/event.ts`, em
`notices` e `faq`.

### Imagens

- [ ] **Banner desktop pesa 586 KB** — é PNG numa imagem fotográfica com gradiente, o formato mais
      pesado possível para esse conteúdo. Convertido para WebP q80, deve cair para 60–100 KB sem
      diferença visível.
- [ ] **Variante mobile tem só 412px de largura** — pequena demais para ser escolhida em celular
      moderno (telas 2×/3× pedem ~690–1030px reais). Reexportar com ~1000px de largura, mantendo a
      proporção 3:1. Ver *Versões por tamanho de tela*.

### Infraestrutura

- [ ] **Dois lockfiles** (`bun.lock` + `package-lock.json`) — escolher um gerenciador e apagar o outro
- [ ] Link externo cadastrado no LMS apontando para `https://xp-educacao.github.io/landing-pages/`
- [ ] Automatizar o build via GitHub Actions (hoje é manual)

---

## Compatibilidade

Testado nos navegadores padrão da instituição (Chrome e Edge).

---

XP Educação · Pós Tech · XPE Community Tech 2026
