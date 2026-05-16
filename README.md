# 🎮 Cyber Runner — Neon Escape v2.0

<div align="center">

**Um endless runner cyberpunk feito com HTML5 Canvas, CSS3 e JavaScript puro.**

[![Jogar Agora](https://img.shields.io/badge/🕹️%20JOGAR%20AGORA-00f2ff?style=for-the-badge&labelColor=030305)](https://guiandrade17.github.io/Cyber-runner/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-bc13fe?style=for-the-badge)](LICENSE)

</div>

---

## 📸 Preview

> _Adicione aqui um GIF ou screenshot do jogo em ação._

```
![Preview do Jogo](./assets/preview.gif)
```

---

## 🚀 Sobre o Projeto

**Cyber Runner** é um jogo 2D estilo *endless runner* com estética neon/cyberpunk, construído do zero com tecnologias web puras — sem frameworks, sem engines, sem dependências externas.

O projeto nasceu como um exercício completo de desenvolvimento front-end aplicado a game dev: desde a lógica de física e colisão até os efeitos visuais procedurais gerados diretamente no Canvas.

### O que o jogador faz

- Corre automaticamente por uma cidade cyberpunk infinita
- Desvia de obstáculos variados (drones, lasers, barreiras)
- Usa **double jump** e **dash** para manobras precisas
- Coleta **power-ups** estratégicos
- Acumula **combos** para multiplicar o score
- Sobrevive o máximo possível e quebra o próprio recorde

---

## 🧩 Tecnologias

| Tecnologia | Uso no Projeto |
|---|---|
| **HTML5** | Estrutura, Canvas, semântica |
| **CSS3** | Estilização, animações, overlays, parallax via transform |
| **JavaScript ES6+** | Game loop, física, estados, lógica completa |
| **Canvas API** | Renderização de todos os elementos do jogo |
| **Web Audio API** | Síntese de sons e música procedural em tempo real |
| **LocalStorage** | Persistência de recorde e conquistas |

> Zero dependências externas. Zero frameworks. Vanilla puro.

---

## ✨ Funcionalidades

### 🎯 Gameplay
- Endless runner com velocidade progressiva
- **Double Jump** — dois saltos no ar antes de aterrissar
- **Dash** — impulso horizontal com cooldown
- Sistema de **vidas** (varia por dificuldade)
- Sistema de **combo** com multiplicador de score
- **3 níveis de dificuldade** — Fácil, Normal, Difícil
- Recorde salvo automaticamente

### ⚡ Power-ups
| Power-up | Efeito |
|---|---|
| 🛡️ **Escudo** | Absorve um golpe sem perder vida |
| 🧲 **Magneto** | Atrai itens próximos automaticamente |
| ⏳ **Slow Motion** | Reduz a velocidade de tudo na tela |
| 👻 **Ghost Mode** | Atravessa obstáculos sem colisão |

### 🎨 Efeitos Visuais
- Estética **cyberpunk neon** completa
- **Parallax multicamadas** (estrelas, prédios distantes, prédios próximos, chuva)
- **Sistema de partículas** procedural (impactos, rastro, propulsão)
- **Screen shake** em colisões
- **Efeito glitch** CSS no game over
- **HUD futurista** com score, vidas, velocidade e combo em tempo real
- Animações de scanline e vinheta

### 🏆 Conquistas
- 8 conquistas desbloqueáveis por marco de gameplay
- Notificações animadas (toast) ao desbloquear
- Progresso salvo via **LocalStorage**
- Painel de conquistas na tela inicial

### 🎵 Áudio
- Música **synthwave procedural** gerada em tempo real via Web Audio API
- Efeitos sonoros sintetizados (pulo, dash, colisão, power-up, game over)
- Controle de mute com estado persistido

### 🖥️ UX
- Tela inicial com seletor de dificuldade e skin
- Tela de **pause** com menu
- Tela de **game over** com score, recorde e conquistas da partida
- Badge animado de **novo recorde**
- Seletor de **4 skins** de personagem

---

## 🎮 Controles

| Ação | Teclado | Touch |
|---|---|---|
| Pular | `Espaço` / `↑` | Toque ou swipe ↑ |
| Double Jump | `Espaço` × 2 (no ar) | Toque duplo no ar |
| Dash | `Shift` / `←` | Swipe ← |
| Pausar | `P` / `Esc` | — |

---

## 🧠 Conceitos Técnicos Aplicados

O projeto foi construído como um exercício deliberado de vários conceitos de front-end e desenvolvimento de jogos:

```
Game Dev                    Front-end
─────────────────────       ─────────────────────────
✓ Game loop com rAF         ✓ Programação modular (IIFEs)
✓ Delta time                ✓ Gerenciamento de estado global
✓ Física de plataforma      ✓ Manipulação avançada do DOM
✓ Colisão AABB              ✓ Canvas API (draw, gradients, paths)
✓ Object pooling            ✓ Web Audio API (síntese procedural)
✓ Sistema de partículas     ✓ CSS animations & transforms
✓ Parallax scrolling        ✓ LocalStorage (persistência)
✓ Câmera com screen shake   ✓ Responsividade dinâmica
✓ Máquina de estados        ✓ Event delegation
✓ Spawn procedural          ✓ Touch events (mobile)
```

---

## 🗂️ Estrutura do Projeto

```
cyber-runner/
│
├── index.html          # Estrutura HTML, overlays, HUD
├── style.css           # Estilização, parallax, animações CSS
├── script.js           # Engine completa do jogo
│
└── assets/             # (opcional)
    └── preview.gif
```

### Organização do `script.js`

O JavaScript é dividido em módulos IIFE com responsabilidade única:

```
§1  CONFIG          — Todas as constantes e configurações do jogo
§2  STATE           — Estado global mutável
§3  DOM             — Referências a todos os elementos do HTML
§4  AUDIO           — Web Audio API: SFX + música procedural
§5  PARALLAX        — Scroll das camadas de fundo
§6  PARTICLES       — Pool de partículas neon
§7  PLAYER          — Física, animação e input do jogador
§8  OBSTACLES       — Spawn, tipos e atualização de obstáculos
§9  POWERUPS        — Tipos, efeitos e timer dos power-ups
§10 PHYSICS         — Colisão AABB e cálculo do chão
§11 UI              — HUD, overlays, toasts e telas
§12 ACHIEVEMENTS    — Condições, unlock e persistência
§13 INPUT           — Fila de eventos de teclado e touch
§14 RENDERER        — Pipeline de renderização do Canvas
§15 GAME            — Game loop principal com delta time
```

---

## ⚙️ Como Executar

### Opção 1 — Direto no navegador

Acesse: **[guiandrade17.github.io/Cyber-runner](https://guiandrade17.github.io/Cyber-runner/)**

### Opção 2 — Localmente com Live Server

```bash
# 1. Clone o repositório
git clone https://github.com/guiandrade17/Cyber-runner.git

# 2. Abra a pasta no VS Code
cd Cyber-runner
code .

# 3. Instale a extensão Live Server (se ainda não tiver)
# 4. Clique com botão direito em index.html → "Open with Live Server"
```

> **Nota:** O jogo usa Web Audio API, que requer interação do usuário para iniciar. Clique em **▶ INICIAR** para ativar o áudio automaticamente.

---

## 📌 Roadmap

Funcionalidades planejadas para versões futuras:

- [ ] Sistema de fases com cenários diferentes
- [ ] Boss fights com padrões de ataque
- [ ] Sistema de moedas e loja de skins
- [ ] Ranking online (Firebase / Supabase)
- [ ] Controles touch avançados para mobile
- [ ] Música de fundo dinâmica que evolui com a velocidade
- [ ] Modo multiplayer local
- [ ] Sistema de missões diárias
- [ ] Otimização com WebGL

---

## 👨‍💻 Autor

<div align="center">

**Guilherme Brito Andrade**

🎓 Estudante de Engenharia de Software: CEUB

[![GitHub](https://img.shields.io/badge/GitHub-guiandrade17-181717?style=flat-square&logo=github)](https://github.com/guiandrade17)

</div>

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.

---

<div align="center">

_Feito por Guilherme Brito Andrade_

</div>
