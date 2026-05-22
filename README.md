# no-distraction app

Calendário, tarefas, notas, pomodoro e hidratação em uma única tela —
tudo offline, tudo no seu navegador.

> Nada é enviado para nenhum servidor. Não há contas, nuvem, telemetria
> nem terceiros. Para mudar de máquina, exporte o seu `.json`.

## Em uma frase

App pessoal de produtividade minimalista, 100% client-side, hospedado no
GitHub Pages, com calendário gregoriano, to-do por dia, notas com
autosave em múltiplas abas, pomodoro à prova de tab-sleep e checklist
de hidratação calculado pelo peso.

## Stack

- **Svelte 5** (runes) + **Vite** — bundle minúsculo, sem virtual DOM.
- **TypeScript** estrito.
- **IndexedDB** via **localForage** com namespaces por módulo.
- **PWA** (vite-plugin-pwa + Workbox) — instalável, funciona offline.
- Fontes auto-hospedadas: **Geist** + **Geist Mono** (via `@fontsource`).

## Estrutura

```
src/
├── app/              # shell, tema, atalhos, indicadores agregados
├── core/             # bus, storage, datas, migrações
├── modules/
│   ├── calendar/     # grade gregoriana mensal
│   ├── todo/         # tarefas por dia + filtros (dia/pendentes/feitas)
│   ├── notes/        # textarea com autosave, múltiplas abas por dia
│   ├── pomodoro/     # cronômetro por timestamp + persistência
│   ├── water/        # checklist de hidratação calculado pelo peso
│   └── settings/     # tema, durações do pomodoro, peso, backup
└── ui/               # Button, Panel, Modal, Toggle
```

Cada módulo conversa com os outros **somente** via event bus tipado
(`src/core/bus.ts`). Cada módulo tem seu `NamespacedStorage`. Remover o
diretório `modules/water/` (por exemplo) e refazer o build compila sem
erros — modularidade LEGO.

## Como rodar

```bash
npm install
npm run dev        # localhost:5173
npm test           # vitest
npm run build      # gera dist/
npm run preview    # serve a build localmente
```

## Deploy no GitHub Pages

1. Crie o repo e faça push em `main`.
2. Em **Settings → Pages**, escolha **GitHub Actions** como fonte.
3. O workflow em `.github/workflows/deploy.yml` cuida do resto. A
   variável `BASE_PATH` é injetada automaticamente com o nome do repo
   para que assets carreguem em subpaths.

## Atalhos

| Tecla        | Ação                       |
|--------------|----------------------------|
| `Espaço`     | iniciar/pausar pomodoro    |
| `← →`        | dia anterior/próximo       |
| `T`          | nova tarefa                |
| `N`          | focar notas                |
| `W`          | focar água                 |
| `Shift + D`  | alternar tema              |
| `Ctrl + ,`   | configurações              |
| `?`          | ver atalhos                |
| `Esc`        | fechar janelas             |

## Backup

Em **Configurações → Backup**, exporte um `.json` com tudo. Para
restaurar em outra máquina, importe o mesmo arquivo. O `schemaVersion`
é checado para evitar incompatibilidades silenciosas.

## Privacidade

- **Nada** sai do seu dispositivo. Não há nenhum `fetch` em runtime.
- Fontes são embaladas no bundle via `@fontsource`.
- O service worker apenas armazena os assets locais para uso offline.

## Licença

MIT.
