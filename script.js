/* ============================================================
   CYBER RUNNER v2.0 — JAVASCRIPT COMPLETO
   Compatível com HTML e CSS fornecidos
   ============================================================ */
console.log('JS CARREGOU');

'use strict';

/* ============================================================
   SEÇÃO 1 — CONFIGURAÇÕES
   ============================================================ */
const CONFIG = {
  // Canvas / Display
  BASE_WIDTH:  900,
  BASE_HEIGHT: 450,
  TARGET_FPS:  60,
  FRAME_TIME:  1000 / 60,

  // Chão
  GROUND_Y_RATIO: 0.78,   // proporção da altura do canvas

  // Jogador
  PLAYER: {
    WIDTH:        32,
    HEIGHT:       48,
    X:            110,
    JUMP_FORCE:   -13.5,
    GRAVITY:      0.55,
    MAX_FALL:     18,
    DASH_SPEED:   14,
    DASH_DURATION: 14,    // frames
    DASH_COOLDOWN: 45,
    TRAIL_LENGTH: 8,
  },

  // Obstáculos
  OBSTACLE: {
    BASE_SPEED:    4.5,
    MIN_GAP:       280,
    MAX_GAP:       520,
    TYPES: ['low','high','double','laser'],
  },

  // Power-ups
  POWERUP: {
    SPAWN_INTERVAL: 600,  // frames
    DURATION:       300,  // frames
    TYPES: ['shield','magnet','slow','ghost'],
  },

  // Score
  SCORE: {
    PER_FRAME:  1,
    COMBO_MULT: 0.5,
    POWERUP:    50,
  },

  // Velocidade
  SPEED: {
    INCREMENT: 0.0008,
    MAX:       3.0,
  },

  // Dificuldade
  DIFFICULTY: {
    easy:   { speedMult: 0.75, gapMult: 1.25, lives: 5 },
    normal: { speedMult: 1.0,  gapMult: 1.0,  lives: 3 },
    hard:   { speedMult: 1.35, gapMult: 0.78, lives: 2 },
  },

  // Parallax
  PARALLAX_SPEEDS: [0.0, 0.0, 0.15, 0.35, 0.65],

  // Partículas
  PARTICLE: {
    MAX:         180,
    TRAIL_MAX:   60,
  },

  // Cores das Skins
  SKINS: {
    cyan:  '#00f2ff',
    pink:  '#ff0055',
    gold:  '#ffd700',
    green: '#00ff88',
  },
};

/* ============================================================
   SEÇÃO 2 — ESTADO GLOBAL
   ============================================================ */
const STATE = {
  // Jogo
  running:     false,
  paused:      false,
  gameOver:    false,
  started:     false,
  rafId:       null,
  lastTime:    0,
  accumulator: 0,

  // Progresso
  score:       0,
  distance:    0,
  lives:       3,
  combo:       0,
  multiplier:  1,
  speedMult:   1,
  frameCount:  0,

  // Configuração atual
  difficulty:  'normal',
  skin:        'cyan',
  skinColor:   '#00f2ff',

  // Flags
  muted:       false,
  newRecord:   false,

  // Moedas
  coins:      0,   // coletadas nesta run
  totalCoins: 0,   // total acumulado salvo

  // Record
  bestScore:   0,

  // Power-up ativo
  activePowerup: null,
  powerupTimer:  0,

  // Scroll parallax
  scrollX: 0,

  // Achievements desbloqueados nesta run
  sessionAchievements: [],
};

/* ============================================================
   SEÇÃO 3 — REFERÊNCIAS DOM
   ============================================================ */
const DOM = {};

function initDOM() {
  // Canvas
  DOM.canvas    = document.getElementById('gameCanvas');
  DOM.ctx       = DOM.canvas.getContext('2d');

  // HUD
  DOM.scoreVal  = document.getElementById('score-value');
  DOM.recordVal = document.getElementById('record-value');
  DOM.livesIcons= document.getElementById('lives-icons');
  DOM.speedVal  = document.getElementById('speed-value');
  DOM.comboDisp = document.getElementById('combo-display');
  DOM.comboVal  = document.getElementById('combo-value');
  DOM.puDisp    = document.getElementById('powerup-display');
  DOM.puBar     = document.getElementById('powerup-bar');
  DOM.puIcon    = document.getElementById('powerup-icon');

  // Telas
  DOM.startScreen   = document.getElementById('start-screen');
  DOM.pauseScreen   = document.getElementById('pause-screen');
  DOM.gameOverScreen= document.getElementById('game-over-screen');

  // Botões principais
  DOM.startBtn   = document.getElementById('start-btn');
  DOM.resumeBtn  = document.getElementById('resume-btn');
  DOM.restartBtn = document.getElementById('restart-btn');
  DOM.quitBtn    = document.getElementById('quit-btn');
  DOM.menuBtn    = document.getElementById('menu-btn');
  DOM.muteBtn    = document.getElementById('mute-btn');
  DOM.pauseBtn   = document.getElementById('pause-btn');

  // Seletores de dificuldade e skin
  DOM.diffBtns   = document.querySelectorAll('.diff-btn');
  DOM.skinBtns   = document.querySelectorAll('.skin-btn');

  // Game Over
  DOM.finalScore = document.getElementById('final-score-value');
  DOM.finalRecord= document.getElementById('final-record-value');
  DOM.finalDist  = document.getElementById('final-dist-value');
  DOM.newRecBadge= document.getElementById('new-record-badge');
  DOM.goAchPanel = document.getElementById('gameover-achievements');
  DOM.goAchList  = document.getElementById('gameover-ach-list');

  // Menu record
  DOM.menuBestScore = document.getElementById('menu-best-score');

  // Toasts
  DOM.achToast   = document.getElementById('achievement-toast');
  DOM.achIcon    = document.getElementById('ach-icon');
  DOM.achTitle   = document.getElementById('ach-title');
  DOM.achName    = document.getElementById('ach-name');
  DOM.puToast    = document.getElementById('powerup-toast');

  // Layers parallax
  DOM.layerStars = document.getElementById('layer-stars');
  DOM.layerBg    = document.getElementById('layer-bg');
  DOM.layerFar   = document.getElementById('layer-far');
  DOM.layerMid   = document.getElementById('layer-mid');
  DOM.layerNear  = document.getElementById('layer-near');
  DOM.layerRain  = document.getElementById('layer-rain');

  // Achievements panel menu
  DOM.achList    = document.getElementById('achievements-list');

  // HUD de moedas
  DOM.coinVal = document.getElementById('hud-coin-value');
}

/* ============================================================
   SEÇÃO 4 — ÁUDIO
   ============================================================ */
const AUDIO = (() => {
  let ctx = null;
  let masterGain = null;

  function getCtx() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.35;
        masterGain.connect(ctx.destination);
      } catch (e) { /* sem suporte */ }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freq, type, duration, vol = 1, startFreq = null) {
    if (STATE.muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const osc  = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(masterGain);

      osc.type = type;
      if (startFreq) {
        osc.frequency.setValueAtTime(startFreq, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq, c.currentTime + duration);
      } else {
        osc.frequency.setValueAtTime(freq, c.currentTime);
      }

      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration + 0.01);
    } catch (e) { /* silencia erros de audio */ }
  }

  function playNoise(duration, vol = 0.3) {
    if (STATE.muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const bufSize = c.sampleRate * duration;
      const buf     = c.createBuffer(1, bufSize, c.sampleRate);
      const data    = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;

      const src  = c.createBufferSource();
      const gain = c.createGain();
      const filt = c.createBiquadFilter();

      src.buffer = buf;
      filt.type  = 'bandpass';
      filt.frequency.value = 800;
      filt.Q.value = 2;

      src.connect(filt);
      filt.connect(gain);
      gain.connect(masterGain);

      gain.gain.setValueAtTime(vol, c.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

      src.start(c.currentTime);
    } catch (e) { /* silencia */ }
  }

  return {
    jump()       { playTone(420, 'square', 0.12, 0.6, 220); },
    doubleJump() { playTone(600, 'square', 0.1,  0.5, 350); },
    dash()       { playTone(800, 'sawtooth', 0.08, 0.4, 1200); },
    land()       { playNoise(0.08, 0.25); },
    hit()        {
      playTone(180, 'sawtooth', 0.2, 0.7);
      playNoise(0.15, 0.4);
    },
    die()  {
      playTone(440, 'sawtooth', 0.1, 0.8);
      setTimeout(() => playTone(330, 'sawtooth', 0.1, 0.7), 100);
      setTimeout(() => playTone(220, 'sawtooth', 0.3, 0.6), 200);
    },
    powerup()    { playTone(880, 'sine', 0.15, 0.5, 440); },
    score1k()    { playTone(660, 'square', 0.12, 0.4); },
    checkpoint() {
      playTone(523, 'square', 0.08, 0.3);
      setTimeout(() => playTone(659, 'square', 0.08, 0.3), 80);
      setTimeout(() => playTone(784, 'square', 0.12, 0.4), 160);
    },
    unlock()     {
      playTone(523, 'sine', 0.08, 0.4);
      setTimeout(() => playTone(784, 'sine', 0.12, 0.4), 90);
    },
    coin()       {
      playTone(1400, 'sine', 0.06, 0.35, 900);
      setTimeout(() => playTone(1800, 'sine', 0.05, 0.06), 55);
    },
    setMuted(v)  {
      if (masterGain) masterGain.gain.value = v ? 0 : 0.35;
      MUSIC.setVolume(v ? 0 : 1);
    },
  };
})();


/* ============================================================
   SEÇÃO 4B — MÚSICA DE TEMA (Synthwave procedural)
   Gerada via Web Audio API. Não usa arquivos externos.
   Só começa após interação do usuário (clique em Iniciar).
   ============================================================ */
const MUSIC = (() => {
  let ac         = null;   // AudioContext (criado na 1ª interação)
  let masterGain = null;
  let isPlaying  = false;
  let ticker     = null;   // setInterval do scheduler
  let nextTime   = 0;      // próximo beat agendado (em segundos)
  let beatIdx    = 0;      // posição no padrão rítmico

  // Progressão: Cm → Bbm → Abm → Bbm
  const CHORDS = [
    [130.81, 155.56, 196.00],
    [116.54, 138.59, 174.61],
    [103.83, 123.47, 155.56],
    [116.54, 138.59, 174.61],
  ];
  const BASS   = [65.41, 58.27, 51.91, 58.27];
  const ARP    = [1, 1.25, 1.5, 2, 1.5, 1.25];  // intervalos do arpejo
  const BEATS  = 16;  // semicolcheias por compasso

  // --- Utilitários de síntese ---

  function noiseBuffer(dur) {
    const len  = Math.ceil(ac.sampleRate * dur);
    const buf  = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function osc(type, freq, vol, dur, t) {
    try {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(masterGain);
      o.start(t); o.stop(t + dur + 0.01);
    } catch (_) {}
  }

  function kick(t) {
    try {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.frequency.setValueAtTime(160, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(0.8, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g); g.connect(masterGain);
      o.start(t); o.stop(t + 0.23);
    } catch (_) {}
  }

  function hihat(t, open) {
    try {
      const src  = ac.createBufferSource();
      const filt = ac.createBiquadFilter();
      const g    = ac.createGain();
      src.buffer = noiseBuffer(open ? 0.20 : 0.05);
      filt.type = 'highpass'; filt.frequency.value = 7000;
      const dur  = open ? 0.18 : 0.04;
      g.gain.setValueAtTime(open ? 0.22 : 0.13, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(filt); filt.connect(g); g.connect(masterGain);
      src.start(t);
    } catch (_) {}
  }

  function snare(t) {
    try {
      const src  = ac.createBufferSource();
      const filt = ac.createBiquadFilter();
      const g    = ac.createGain();
      src.buffer = noiseBuffer(0.10);
      filt.type = 'bandpass'; filt.frequency.value = 1500; filt.Q.value = 0.8;
      g.gain.setValueAtTime(0.45, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.10);
      src.connect(filt); filt.connect(g); g.connect(masterGain);
      src.start(t);
    } catch (_) {}
  }

  function bass(freq, t, dur) {
    try {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq * 0.5, t);
      g.gain.setValueAtTime(0.32, t);
      g.gain.setValueAtTime(0.30, t + dur - 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(masterGain);
      o.start(t); o.stop(t + dur + 0.01);
    } catch (_) {}
  }

  function pad(freqs, t, dur) {
    freqs.forEach(freq => {
      try {
        const o    = ac.createOscillator();
        const filt = ac.createBiquadFilter();
        const g    = ac.createGain();
        o.type = 'sawtooth';
        filt.type = 'lowpass'; filt.frequency.value = 850; filt.Q.value = 1.0;
        g.gain.setValueAtTime(0.0, t);
        g.gain.linearRampToValueAtTime(0.055, t + 0.05);
        g.gain.setValueAtTime(0.050, t + dur - 0.08);
        g.gain.linearRampToValueAtTime(0.0, t + dur);
        o.frequency.setValueAtTime(freq, t);
        o.connect(filt); filt.connect(g); g.connect(masterGain);
        o.start(t); o.stop(t + dur + 0.01);
      } catch (_) {}
    });
  }

  function arp(freq, t, dur) {
    osc('square', freq, 0.10, dur * 0.82, t);
  }

  // --- Scheduler (look-ahead de 120ms) ---
  function schedule() {
    if (!ac || !isPlaying) return;
    const LOOKAHEAD = 0.12;
    // BPM sobe levemente com a velocidade do jogo (sensação de tensão)
    const bpm     = 128 + (STATE.speedMult || 0) * 6;
    const beatDur = (60 / bpm) / 4;  // semicolcheia

    while (nextTime < ac.currentTime + LOOKAHEAD) {
      const b  = beatIdx % BEATS;
      const ci = Math.floor(beatIdx / BEATS) % CHORDS.length;

      // Bateria
      if (b === 0 || b === 8)  kick(nextTime);
      if (b === 4 || b === 12) snare(nextTime);
      if (b % 2 === 0)         hihat(nextTime, false);
      if (b === 14)            hihat(nextTime, true);

      // Baixo (a cada 4 semicolcheias)
      if (b % 4 === 0) bass(BASS[ci], nextTime, beatDur * 3.6);

      // Pad (um compasso inteiro, no beat 0)
      if (b === 0) pad(CHORDS[ci], nextTime, beatDur * BEATS);

      // Arpejo
      arp(CHORDS[ci][0] * ARP[b % ARP.length] * 2, nextTime, beatDur * 0.80);

      nextTime += beatDur;
      beatIdx++;
    }
  }

  // --- API pública ---
  function start() {
    if (isPlaying) return;
    try {
      if (!ac) {
        ac         = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ac.createGain();
        masterGain.gain.value = 0.22;
        masterGain.connect(ac.destination);
      }
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      isPlaying = true;
      beatIdx   = 0;
      nextTime  = ac.currentTime + 0.08;
      ticker    = setInterval(schedule, 40);
    } catch (_) {}
  }

  function stop() {
    isPlaying = false;
    if (ticker) { clearInterval(ticker); ticker = null; }
  }

  function pause() { stop(); }

  function resume() {
    if (isPlaying) return;
    isPlaying = true;
    if (ac) {
      if (ac.state === 'suspended') ac.resume().catch(() => {});
      nextTime = ac.currentTime + 0.08;
    }
    ticker = setInterval(schedule, 40);
  }

  function setVolume(factor) {
    if (masterGain) masterGain.gain.value = factor * 0.22;
  }

  return { start, stop, pause, resume, setVolume };
})();

/* ============================================================
   SEÇÃO 5 — PARALLAX
   ============================================================ */
const PARALLAX = (() => {
  const layers = [];
  const speeds = CONFIG.PARALLAX_SPEEDS;

  function init() {
    layers[0] = DOM.layerStars;
    layers[1] = DOM.layerBg;
    layers[2] = DOM.layerFar;
    layers[3] = DOM.layerMid;
    layers[4] = DOM.layerNear;
  }

  function update(delta) {
    if (!STATE.running || STATE.paused) return;
    STATE.scrollX += delta * 3;

    layers.forEach((el, i) => {
      if (!el) return;
      const tx = -(STATE.scrollX * speeds[i]) % 900;
      el.style.transform = `translateX(${tx}px)`;
    });

    // Chuva animada separada
    if (DOM.layerRain) {
      const rx = -(STATE.scrollX * 0.9) % 120;
      DOM.layerRain.style.backgroundPositionX = `${rx}px, ${rx * 0.6}px`;
    }
  }

  function reset() {
    STATE.scrollX = 0;
    layers.forEach(el => { if (el) el.style.transform = 'translateX(0)'; });
  }

  return { init, update, reset };
})();

/* ============================================================
   SEÇÃO 6 — PARTÍCULAS
   ============================================================ */
const PARTICLES = (() => {
  let pool = [];

  function spawn(x, y, opts = {}) {
    if (pool.length >= CONFIG.PARTICLE.MAX) {
      // Remove a partícula mais antiga
      pool.shift();
    }
    pool.push({
      x, y,
      vx:    opts.vx    ?? (Math.random() - 0.5) * 4,
      vy:    opts.vy    ?? (Math.random() - 0.5) * 4 - 2,
      life:  opts.life  ?? 40,
      maxLife: opts.life ?? 40,
      size:  opts.size  ?? Math.random() * 4 + 2,
      color: opts.color ?? STATE.skinColor,
      glow:  opts.glow  ?? true,
      shape: opts.shape ?? 'circle',  // 'circle' | 'square' | 'spark'
      gravity: opts.gravity ?? 0.12,
      alpha: opts.alpha ?? 1,
    });
  }

  function spawnBurst(x, y, count, color, size = 4) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 5 + 1.5;
      spawn(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color,
        size: Math.random() * size + 1,
        life: 35 + Math.floor(Math.random() * 25),
        glow: true,
      });
    }
  }

  function spawnTrail(x, y, color) {
    if (pool.length >= CONFIG.PARTICLE.MAX) return;
    spawn(x, y, {
      vx:    (Math.random() - 0.5) * 1.5,
      vy:    Math.random() * -1,
      life:  14,
      size:  Math.random() * 5 + 3,
      color,
      glow:  true,
      gravity: 0.05,
      alpha: 0.7,
    });
  }

  function spawnGround(x, y, color) {
    for (let i = 0; i < 5; i++) {
      spawn(x + (Math.random() - 0.5) * 20, y, {
        vx:    (Math.random() - 0.5) * 5,
        vy:    -(Math.random() * 4 + 1),
        life:  25 + Math.floor(Math.random() * 15),
        size:  Math.random() * 3 + 1,
        color,
        shape: 'square',
        glow:  false,
      });
    }
  }

  function update() {
    for (let i = pool.length - 1; i >= 0; i--) {
      const p = pool[i];
      p.x    += p.vx;
      p.y    += p.vy;
      p.vy   += p.gravity;
      p.life --;
      if (p.life <= 0) { pool.splice(i, 1); }
    }
  }

  function draw(ctx) {
    pool.forEach(p => {
      const t = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = t * p.alpha;
      if (p.glow) {
        ctx.shadowBlur  = 10;
        ctx.shadowColor = p.color;
      }
      ctx.fillStyle = p.color;

      if (p.shape === 'square') {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.size);
        ctx.lineTo(p.x + p.size * 0.3, p.y);
        ctx.lineTo(p.x, p.y + p.size);
        ctx.lineTo(p.x - p.size * 0.3, p.y);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * t + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  function clear() { pool = []; }

  return { spawn, spawnBurst, spawnTrail, spawnGround, update, draw, clear };
})();

/* ============================================================
   SEÇÃO 7 — JOGADOR
   ============================================================ */
const PLAYER = (() => {
  const cfg = CONFIG.PLAYER;
  let state;

  function reset() {
    state = {
      x:         cfg.X,
      y:         0,         // calculado em resize
      vy:        0,
      onGround:  false,
      jumpsLeft: 2,
      jumping:   false,
      dashing:   false,
      dashTimer: 0,
      dashCooldown: 0,
      dashDir:   1,
      trailTimer: 0,
      squash:    1.0,   // efeito de squash ao pousar
      lean:      0,     // inclinação
      blinking:  false,
      blinkTimer: 0,
      invincible: false,
      invincibleTimer: 0,
      ghostMode: false,
    };
    snapToGround();
  }

  function snapToGround() {
    const ground = PHYSICS.getGroundY();
    state.y = ground - cfg.HEIGHT;
    state.onGround = true;
  }

  function jump() {
    if (state.jumpsLeft <= 0) return;
    if (!state.onGround && state.jumpsLeft === 2) {
      // Já está em queda sem ter pulado — não permite double jump do chão
    }
    if (state.jumpsLeft === 2) {
      AUDIO.jump();
    } else {
      AUDIO.doubleJump();
      PARTICLES.spawnBurst(state.x + cfg.WIDTH / 2, state.y + cfg.HEIGHT / 2, 8, STATE.skinColor, 3);
    }
    state.vy = cfg.JUMP_FORCE;
    state.jumpsLeft--;
    state.onGround = false;
    state.jumping  = true;
    state.squash   = 0.7;
  }

  function dash() {
    if (state.dashing || state.dashCooldown > 0) return;
    AUDIO.dash();
    state.dashing    = true;
    state.dashTimer  = cfg.DASH_DURATION;
    state.dashDir    = -1;
    state.dashCooldown = cfg.DASH_COOLDOWN;
    PARTICLES.spawnBurst(state.x + cfg.WIDTH / 2, state.y + cfg.HEIGHT / 2, 12, STATE.skinColor, 5);
  }

  function update(dt) {
    const ground = PHYSICS.getGroundY();

    // Invencibilidade
    if (state.invincible) {
      state.invincibleTimer--;
      if (state.invincibleTimer <= 0) {
        state.invincible = false;
        state.blinking   = false;
      } else {
        state.blinkTimer = (state.blinkTimer + 1) % 6;
      }
    }

    // Dash
    if (state.dashing) {
      state.x += cfg.DASH_SPEED * state.dashDir * dt;
      state.dashTimer--;
      if (state.dashTimer <= 0) {
        state.dashing = false;
        state.x = Math.max(50, Math.min(200, state.x));
      }
      PARTICLES.spawnTrail(
        state.x + cfg.WIDTH / 2,
        state.y + cfg.HEIGHT / 2,
        STATE.skinColor
      );
    }
    if (state.dashCooldown > 0) state.dashCooldown--;

    // Gravidade
    if (!state.onGround) {
      state.vy += cfg.GRAVITY * dt;
      if (state.vy > cfg.MAX_FALL) state.vy = cfg.MAX_FALL;
    }
    state.y += state.vy * dt;

    // Colisão com chão
    if (state.y + cfg.HEIGHT >= ground) {
      if (!state.onGround) {
        AUDIO.land();
        PARTICLES.spawnGround(state.x + cfg.WIDTH / 2, ground, STATE.skinColor);
        state.squash = 1.3;
      }
      state.y      = ground - cfg.HEIGHT;
      state.vy     = 0;
      state.onGround = true;
      state.jumpsLeft = 2;
      state.jumping   = false;
    }

    // Trail normal
    state.trailTimer++;
    if (state.trailTimer % 3 === 0 && STATE.running) {
      PARTICLES.spawnTrail(state.x + cfg.WIDTH / 2, state.y + cfg.HEIGHT * 0.7, STATE.skinColor);
    }

    // Squash recovery
    state.squash += (1.0 - state.squash) * 0.2;
    state.lean    = state.dashing ? -18 : (state.vy < -3 ? -8 : state.vy > 3 ? 5 : 0);
  }

  function draw(ctx) {
    if (state.blinking && state.blinkTimer < 3) return;

    const cx = state.x + cfg.WIDTH / 2;
    const cy = state.y + cfg.HEIGHT / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((state.lean * Math.PI) / 180);
    ctx.scale(1 / state.squash, state.squash);
    ctx.translate(-cfg.WIDTH / 2, -cfg.HEIGHT / 2);

    const c = STATE.skinColor;

    // Brilho exterior
    ctx.shadowBlur  = STATE.activePowerup === 'shield' ? 25 : 14;
    ctx.shadowColor = STATE.activePowerup === 'shield' ? '#ffffff' : c;

    // Corpo principal
    ctx.fillStyle = c;
    roundRect(ctx, 2, 4, cfg.WIDTH - 4, cfg.HEIGHT - 4, 6);
    ctx.fill();

    // Detalhe central
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, 8, 12, cfg.WIDTH - 16, cfg.HEIGHT - 22, 4);
    ctx.fill();

    // Janela / visor
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(ctx, 10, 14, cfg.WIDTH - 20, cfg.HEIGHT * 0.35, 3);
    ctx.fill();

    // Linhas neon
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth   = 1;
    ctx.shadowBlur  = 6;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    ctx.moveTo(5, cfg.HEIGHT - 12);
    ctx.lineTo(cfg.WIDTH - 5, cfg.HEIGHT - 12);
    ctx.stroke();

    // Escudo power-up
    if (STATE.activePowerup === 'shield') {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 2.5;
      ctx.shadowBlur  = 20;
      ctx.shadowColor = '#ffffff';
      ctx.globalAlpha = 0.55 + Math.sin(STATE.frameCount * 0.2) * 0.2;
      ctx.beginPath();
      ctx.ellipse(cfg.WIDTH / 2, cfg.HEIGHT / 2, cfg.WIDTH * 0.7, cfg.HEIGHT * 0.65, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function getHitbox() {
    return {
      x: state.x + 4,
      y: state.y + 4,
      w: cfg.WIDTH  - 8,
      h: cfg.HEIGHT - 6,
    };
  }

  function setInvincible(frames = 90) {
    state.invincible      = true;
    state.invincibleTimer = frames;
    state.blinking        = true;
    state.blinkTimer      = 0;
  }

  function getState() { return state; }

  return { reset, jump, dash, update, draw, getHitbox, setInvincible, getState };
})();

/* ============================================================
   SEÇÃO 8 — OBSTÁCULOS
   ============================================================ */
const OBSTACLES = (() => {
  let list = [];
  let nextX = 0;
  let scoreAtLastMiss = -999;

  function reset() {
    list = [];
    nextX = CONFIG.BASE_WIDTH + 700;
  }

  function getSpeed() {
    const diff = CONFIG.DIFFICULTY[STATE.difficulty];
    return (CONFIG.OBSTACLE.BASE_SPEED + STATE.speedMult * 1.5) * diff.speedMult;
  }

  function getGap() {
    const diff = CONFIG.DIFFICULTY[STATE.difficulty];
    const base = CONFIG.OBSTACLE.MIN_GAP + Math.random() * (CONFIG.OBSTACLE.MAX_GAP - CONFIG.OBSTACLE.MIN_GAP);
    return base * diff.gapMult;
  }

  function spawnOne(x) {
    const ground  = PHYSICS.getGroundY();
    const typeRoll = Math.random();
    let type;

    if (STATE.score < 500)       type = 'low';
    else if (STATE.score < 1500) type = typeRoll < 0.6 ? 'low' : 'high';
    else if (STATE.score < 3000) type = typeRoll < 0.4 ? 'low' : typeRoll < 0.75 ? 'high' : 'double';
    else {
      const types = CONFIG.OBSTACLE.TYPES;
      type = types[Math.floor(Math.random() * types.length)];
    }

    const obs = { x, type, hit: false };

    switch (type) {
      case 'low':
        obs.w = 28; obs.h = 44;
        obs.y = ground - obs.h;
        obs.color = '#ff0055';
        break;
      case 'high':
        obs.w = 22; obs.h = 58;
        obs.y = ground - obs.h;
        obs.color = '#bc13fe';
        break;
      case 'double':
        obs.w = 24; obs.h = 36;
        obs.y = ground - obs.h;
        obs.color = '#ffd700';
        obs.second = { w: 22, h: 28, y: ground - 80 - 28, color: '#ffd700' };
        break;
      case 'laser':
        obs.w = 8; obs.h = 120;
        obs.y = ground - obs.h;
        obs.color = '#00f2ff';
        obs.laser  = true;
        obs.pulse  = 0;
        break;
    }
    list.push(obs);
  }

  function update(dt) {
    const speed = getSpeed();

    // Spawn
    nextX -= speed * dt;
    while (nextX <= CONFIG.BASE_WIDTH + 100) {
      spawnOne(nextX + CONFIG.BASE_WIDTH);
      nextX += getGap();
    }

    // Mover
    for (let i = list.length - 1; i >= 0; i--) {
      const o = list[i];
      o.x -= speed * dt;
      if (o.laser) o.pulse += 0.1;

      // Combo — passou sem colidir
      if (!o.hit && o.x + o.w < PLAYER.getState().x && STATE.score - scoreAtLastMiss > 5) {
        scoreAtLastMiss = STATE.score;
        incrementCombo();
      }

      // Remove fora da tela
      if (o.x + (o.w || 60) < -60) list.splice(i, 1);
    }
  }

  function draw(ctx) {
    list.forEach(o => {
      if (o.laser) {
        ctx.save();
        const alpha = 0.65 + Math.sin(o.pulse) * 0.25;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur  = 20;
        ctx.shadowColor = o.color;
        ctx.fillStyle   = o.color;
        ctx.fillRect(o.x, o.y, o.w, o.h);

        // Linhas de energia
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < o.h; i += 12) {
          ctx.beginPath();
          ctx.moveTo(o.x, o.y + i);
          ctx.lineTo(o.x + o.w, o.y + i);
          ctx.stroke();
        }
        ctx.restore();
      } else {
        ctx.save();
        ctx.shadowBlur  = 14;
        ctx.shadowColor = o.color;
        ctx.fillStyle   = o.color;
        // Forma com chanfro
        ctx.beginPath();
        ctx.moveTo(o.x + 4, o.y);
        ctx.lineTo(o.x + o.w, o.y + 4);
        ctx.lineTo(o.x + o.w, o.y + o.h);
        ctx.lineTo(o.x, o.y + o.h);
        ctx.lineTo(o.x, o.y + 4);
        ctx.closePath();
        ctx.fill();

        // Brilho superior
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(o.x + 2, o.y + 2, o.w - 4, 4);

        // Linhas de detalhe
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(o.x + 6, o.y + 10);
        ctx.lineTo(o.x + o.w - 4, o.y + 10);
        ctx.stroke();

        if (o.second) {
          ctx.shadowColor = o.second.color;
          ctx.fillStyle   = o.second.color;
          ctx.fillRect(o.x, o.second.y, o.second.w, o.second.h);
          // Conector
          ctx.fillStyle = 'rgba(255,215,0,0.3)';
          ctx.fillRect(o.x + o.w / 2 - 2, o.second.y + o.second.h, 4, o.y - (o.second.y + o.second.h));
        }
        ctx.restore();
      }
    });
  }

  function getList()  { return list; }

  function incrementCombo() {
    STATE.combo++;
    STATE.multiplier = 1 + Math.floor(STATE.combo / 5) * CONFIG.SCORE.COMBO_MULT;
    STATE.multiplier = Math.min(STATE.multiplier, 4);
    if (STATE.combo > 1) {
      DOM.comboDisp.classList.remove('hidden');
      DOM.comboVal.textContent = `x${STATE.combo}`;
    }
  }

  function resetCombo() {
    STATE.combo = 0;
    STATE.multiplier = 1;
    DOM.comboDisp.classList.add('hidden');
  }

  return { reset, update, draw, getList, resetCombo };
})();

/* ============================================================
   SEÇÃO 9 — POWER-UPS
   ============================================================ */
const POWERUPS = (() => {
  let list = [];
  let spawnTimer = 0;

  const ICONS = { shield:'🛡', magnet:'🧲', slow:'⏱', ghost:'👻' };
  const COLORS = { shield:'#ffffff', magnet:'#ffd700', slow:'#00f2ff', ghost:'#bc13fe' };
  const LABELS = { shield:'ESCUDO ATIVO', magnet:'MAGNETO ATIVO', slow:'CÂMERA LENTA', ghost:'MODO FANTASMA' };

  function reset() {
    list = [];
    spawnTimer = 0;
    clearActive();
  }

  function clearActive() {
    STATE.activePowerup = null;
    STATE.powerupTimer  = 0;
    DOM.puDisp.classList.add('hidden');
  }

  function activate(type) {
    STATE.activePowerup = type;
    STATE.powerupTimer  = CONFIG.POWERUP.DURATION;
    DOM.puDisp.classList.remove('hidden');
    DOM.puIcon.textContent = ICONS[type] || '⚡';
    AUDIO.powerup();
    addScore(CONFIG.SCORE.POWERUP);
    showPowerupToast(LABELS[type] || type.toUpperCase());
  }

  function update(dt) {
    // Spawn
    spawnTimer += dt;
    if (spawnTimer >= CONFIG.POWERUP.SPAWN_INTERVAL) {
      spawnTimer = 0;
      const ground = PHYSICS.getGroundY();
      const types  = CONFIG.POWERUP.TYPES;
      const type   = types[Math.floor(Math.random() * types.length)];
      const yPos   = Math.random() < 0.5 ? ground - 90 : ground - 50;
      list.push({
        x:     CONFIG.BASE_WIDTH + 60,
        y:     yPos,
        w:     30, h: 30,
        type,
        pulse: 0,
      });
    }

    // Mover
    const speed = (CONFIG.OBSTACLE.BASE_SPEED + STATE.speedMult * 1.5) *
      CONFIG.DIFFICULTY[STATE.difficulty].speedMult;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x    -= speed * dt;
      p.pulse += 0.08;
      if (p.x < -60) list.splice(i, 1);
    }

    // Power-up ativo
    if (STATE.activePowerup) {
      STATE.powerupTimer -= dt;
      const pct = Math.max(0, STATE.powerupTimer / CONFIG.POWERUP.DURATION);
      DOM.puBar.style.width = `${pct * 100}%`;
      if (STATE.powerupTimer <= 0) clearActive();
    }
  }

  function draw(ctx) {
    list.forEach(p => {
      const color = COLORS[p.type] || '#fff';
      const pulse = Math.sin(p.pulse) * 4;

      ctx.save();
      ctx.shadowBlur  = 18 + pulse;
      ctx.shadowColor = color;

      // Fundo
      ctx.globalAlpha = 0.85;
      ctx.fillStyle   = 'rgba(0,0,0,0.6)';
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      const s = p.w / 2;
      ctx.beginPath();
      ctx.moveTo(p.x + s, p.y);
      ctx.lineTo(p.x + p.w, p.y + s);
      ctx.lineTo(p.x + s, p.y + p.h);
      ctx.lineTo(p.x, p.y + s);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ícone
      ctx.globalAlpha = 1;
      ctx.font        = '16px serif';
      ctx.textAlign   = 'center';
      ctx.textBaseline= 'middle';
      ctx.shadowBlur  = 0;
      ctx.fillText(ICONS[p.type] || '⚡', p.x + s, p.y + s);

      ctx.restore();
    });
  }

  function getList()  { return list; }

  return { reset, update, draw, getList, activate, clearActive };
})();

/* ============================================================
   SEÇÃO 9B — MOEDAS
   Spawn procedural em 3 padrões.
   O imã (magnet) atrai moedas dentro de 150px do jogador.
   ============================================================ */
const COINS = (() => {
  let pool = [];

  const R         = 10;    // raio da moeda
  const VALUE     = 25;    // pontos por moeda
  const MAX       = 8;     // máximo simultâneo na tela
  const MAGNET_R  = 150;   // raio de atração do imã
  const MAGNET_V  = 11;    // velocidade de atração

  // --- Spawn ---

  function _coin(x, y) {
    pool.push({ x, y, r: R, pulse: Math.random() * Math.PI * 2 });
  }

  function spawnSingle(baseX) {
    const gy = PHYSICS.getGroundY();
    const ys = [gy - 30, gy - 85, gy - 145];
    _coin(baseX, ys[Math.floor(Math.random() * ys.length)]);
  }

  function spawnLine(baseX) {
    const y = PHYSICS.getGroundY() - 55;
    for (let i = 0; i < 5; i++) _coin(baseX + i * 36, y);
  }

  function spawnArc(baseX) {
    const gy = PHYSICS.getGroundY();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 5) * i;
      _coin(baseX + i * 30, gy - 48 - Math.sin(angle) * 85);
    }
  }

  // --- Update ---
  function update(dt) {
    if (!STATE.running || STATE.paused) return;

    // Tentativa de spawn
    const active = pool.length;
    if (active < MAX && Math.random() < 0.004) {
      const bx = CONFIG.BASE_WIDTH + 80;
      const roll = Math.random();
      if      (roll < 0.55) spawnSingle(bx);
      else if (roll < 0.78) spawnLine(bx);
      else                  spawnArc(bx);
    }

    const speed = (CONFIG.OBSTACLE.BASE_SPEED + STATE.speedMult * 1.5)
                * CONFIG.DIFFICULTY[STATE.difficulty].speedMult;

    const magnetOn = STATE.activePowerup === 'magnet';
    const ps       = PLAYER.getState();
    const px       = ps.x + CONFIG.PLAYER.WIDTH  / 2;
    const py       = ps.y + CONFIG.PLAYER.HEIGHT / 2;

    for (let i = pool.length - 1; i >= 0; i--) {
      const c = pool[i];
      c.x    -= speed * dt;
      c.pulse += 0.09;

      // Imã: empurra a moeda em direção ao jogador
      if (magnetOn) {
        const dx   = px - c.x;
        const dy   = py - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < MAGNET_R) {
          const f = (1 - dist / MAGNET_R);   // 0…1, maior perto
          c.x += (dx / dist) * MAGNET_V * f * dt;
          c.y += (dy / dist) * MAGNET_V * f * dt;
        }
      }

      // Remove ao sair da tela
      if (c.x + c.r < 0) { pool.splice(i, 1); }
    }
  }

  // --- Coleta (chamada após checkCollisions) ---
  function checkCollect() {
    if (!STATE.running || STATE.paused) return;
    const ps   = PLAYER.getState();
    const phb  = PLAYER.getHitbox();
    const cx   = phb.x + phb.w / 2;
    const cy   = phb.y + phb.h / 2;
    const cr   = phb.w / 2;

    for (let i = pool.length - 1; i >= 0; i--) {
      const c    = pool[i];
      const dx   = cx - c.x;
      const dy   = cy - c.y;
      if (Math.sqrt(dx * dx + dy * dy) < cr + c.r) {
        pool.splice(i, 1);
        _collect(c);
      }
    }
  }

  function _collect(c) {
    STATE.coins++;
    STATE.totalCoins++;
    addScore(VALUE);

    // Salvar total acumulado
    try { localStorage.setItem('cr_coins', String(STATE.totalCoins)); } catch (_) {}

    // HUD com animação pop
    if (DOM.coinVal) {
      DOM.coinVal.textContent = STATE.coins;
      DOM.coinVal.classList.remove('coin-pop');
      void DOM.coinVal.offsetWidth;
      DOM.coinVal.classList.add('coin-pop');
      setTimeout(() => { if(DOM.coinVal) DOM.coinVal.classList.remove('coin-pop'); }, 150);
    }

    // Partículas douradas
    PARTICLES.spawnBurst(c.x, c.y, 7, '#ffd700', 3);

    // Som
    AUDIO.coin();

    // Conquistas
    ACHIEVEMENTS.check('coin', null);
  }

  // --- Desenho ---
  function draw(ctx) {
    pool.forEach(c => {
      const g    = Math.sin(c.pulse) * 4;
      const sc   = 1 + Math.sin(c.pulse * 1.4) * 0.06;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(sc, sc);

      ctx.shadowBlur  = 8 + g;
      ctx.shadowColor = '#ffd700';

      // Disco
      const grad = ctx.createRadialGradient(-2, -3, 1, 0, 0, c.r);
      grad.addColorStop(0,   '#fffaaa');
      grad.addColorStop(0.5, '#ffd700');
      grad.addColorStop(1,   '#b8860b');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fill();

      // Símbolo
      ctx.shadowBlur = 0;
      ctx.fillStyle  = 'rgba(0,0,0,0.5)';
      ctx.font       = `bold ${c.r}px monospace`;
      ctx.textAlign  = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 1);

      ctx.restore();
    });
  }

  function reset() { pool = []; }

  return { update, draw, checkCollect, reset };
})();

/* ============================================================
   SEÇÃO 10 — FÍSICA / COLISÕES
   ============================================================ */
const PHYSICS = (() => {
  let groundY = 0;

  function recalcGround() {
    groundY = Math.round(CONFIG.BASE_HEIGHT * CONFIG.GROUND_Y_RATIO);
  }

  function getGroundY() { return groundY; }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
  }

  function checkCollisions() {

  // Proteção inicial
  if (STATE.frameCount < 60) return;

  if (!STATE.running || STATE.paused || STATE.gameOver) return;

    const pHit = PLAYER.getHitbox();

    // Obstáculos
    const obs = OBSTACLES.getList();
    for (let i = 0; i < obs.length; i++) {
      const o = obs[i];
      if (o.hit) continue;

      const hit1 = rectsOverlap(pHit, { x: o.x, y: o.y, w: o.w, h: o.h });
      const hit2 = o.second && rectsOverlap(pHit, { x: o.x, y: o.second.y, w: o.second.w, h: o.second.h });

      if (hit1 || hit2) {
        // Ghost — atravessa
        if (STATE.activePowerup === 'ghost') { o.hit = true; continue; }
        // Escudo — absorve
        if (STATE.activePowerup === 'shield') {
          o.hit = true;
          POWERUPS.clearActive();
          PARTICLES.spawnBurst(pHit.x + pHit.w / 2, pHit.y + pHit.h / 2, 16, '#ffffff', 5);
          triggerShake();
          continue;
        }
        // Invencibilidade
        if (PLAYER.getState().invincible) continue;

        o.hit = true;
        handleHit();
      }
    }

    // Power-ups
    const pups = POWERUPS.getList();
    for (let i = pups.length - 1; i >= 0; i--) {
      const p = pups[i];
      if (rectsOverlap(pHit, { x: p.x, y: p.y, w: p.w, h: p.h })) {
        POWERUPS.activate(p.type);
        pups.splice(i, 1);
        PARTICLES.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, 10, '#ffffff', 4);
      }
    }
  }

  function handleHit() {
    STATE.lives--;
    OBSTACLES.resetCombo();
    AUDIO.hit();
    triggerShake();
    triggerGlitch();
    PLAYER.setInvincible(90);
    PARTICLES.spawnBurst(
      PLAYER.getState().x + CONFIG.PLAYER.WIDTH / 2,
      PLAYER.getState().y + CONFIG.PLAYER.HEIGHT / 2,
      20, '#ff0055', 5
    );

    if (STATE.lives <= 0) {
      AUDIO.die();
      setTimeout(() => triggerGameOver(), 200);
    } else {
      UI.updateLives();
    }
  }

  function triggerShake() {
    const el = document.getElementById('game-container');
    el.classList.remove('shaking');
    void el.offsetWidth;
    el.classList.add('shaking');
    setTimeout(() => el.classList.remove('shaking'), 400);
  }

  function triggerGlitch() {
    const el = document.getElementById('game-container');
    el.classList.remove('glitch-effect');
    void el.offsetWidth;
    el.classList.add('glitch-effect');
    setTimeout(() => el.classList.remove('glitch-effect'), 350);
  }

  return { recalcGround, getGroundY, checkCollisions };
})();

/* ============================================================
   SEÇÃO 11 — UI / HUD / TELAS
   ============================================================ */
const UI = (() => {
  let achToastTimeout = null;
  let puToastTimeout  = null;

  function showScreen(id) {
    ['start-screen','pause-screen','game-over-screen'].forEach(s => {
      const el = document.getElementById(s);
      if (el) el.classList.add('hidden');
    });
    if (id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('hidden');
    }
  }

  function updateScore() {
    const formatted = String(Math.floor(STATE.score)).padStart(6, '0');
    DOM.scoreVal.textContent = formatted;
  }

  function updateRecord() {
    const formatted = String(STATE.bestScore).padStart(6, '0');
    DOM.recordVal.textContent  = formatted;
    DOM.menuBestScore.textContent = formatted;
  }

  function updateLives() {
    DOM.livesIcons.innerHTML = '';
    const maxLives = CONFIG.DIFFICULTY[STATE.difficulty].lives;
    for (let i = 0; i < maxLives; i++) {
      const span = document.createElement('span');
      span.className = 'life-icon' + (i >= STATE.lives ? ' empty' : '');
      DOM.livesIcons.appendChild(span);
    }
  }

  function updateSpeed() {
    DOM.speedVal.textContent = `${(1 + STATE.speedMult).toFixed(1)}x`;
  }

  function updateHUD() {
    updateScore();
    updateSpeed();
    if (DOM.coinVal) DOM.coinVal.textContent = STATE.coins;
  }

  function showGameOver() {
    DOM.finalScore.textContent = Math.floor(STATE.score);
    DOM.finalRecord.textContent = STATE.bestScore;
    DOM.finalDist.textContent  = `${Math.floor(STATE.distance)}m`;
    const _coinEl = document.getElementById('final-coins-value');
    if (_coinEl) _coinEl.textContent = STATE.coins;

    if (STATE.newRecord) {
      DOM.newRecBadge.classList.remove('hidden');
    } else {
      DOM.newRecBadge.classList.add('hidden');
    }

    // Conquistas da run
    if (STATE.sessionAchievements.length > 0) {
      DOM.goAchPanel.classList.remove('hidden');
      DOM.goAchList.innerHTML = '';
      STATE.sessionAchievements.forEach(id => {
        const ach = ACHIEVEMENTS.getById(id);
        if (!ach) return;
        const el = document.createElement('div');
        el.className = 'ach-badge unlocked';
        el.innerHTML = `<span class="ach-emoji">${ach.icon}</span>${ach.name}`;
        DOM.goAchList.appendChild(el);
      });
    } else {
      DOM.goAchPanel.classList.add('hidden');
    }

    showScreen('game-over-screen');
  }

  function showAchievementToast(ach) {
    DOM.achIcon.textContent  = ach.icon;
    DOM.achName.textContent  = ach.name;
    DOM.achToast.classList.remove('hidden', 'hide');
    DOM.achToast.classList.add('show');
    AUDIO.unlock();

    if (achToastTimeout) clearTimeout(achToastTimeout);
    achToastTimeout = setTimeout(() => {
      DOM.achToast.classList.remove('show');
      DOM.achToast.classList.add('hide');
      setTimeout(() => DOM.achToast.classList.add('hidden'), 400);
    }, 2800);
  }

  function showPowerupToast(text) {
    DOM.puToast.textContent = text;
    DOM.puToast.classList.remove('hidden', 'hide');
    DOM.puToast.classList.add('show');

    if (puToastTimeout) clearTimeout(puToastTimeout);
    puToastTimeout = setTimeout(() => {
      DOM.puToast.classList.remove('show');
      DOM.puToast.classList.add('hide');
      setTimeout(() => DOM.puToast.classList.add('hidden'), 350);
    }, 1800);
  }

  function renderAchievementMenu() {
    if (!DOM.achList) return;
    DOM.achList.innerHTML = '';
    ACHIEVEMENTS.getAll().forEach(ach => {
      const el = document.createElement('div');
      el.className = 'ach-badge' + (ach.unlocked ? ' unlocked' : '');
      el.innerHTML = `<span class="ach-emoji">${ach.icon}</span>${ach.name}`;
      el.title = ach.desc;
      DOM.achList.appendChild(el);
    });
  }

  function setPauseBtn(visible) {
    if (visible) DOM.pauseBtn.classList.remove('hidden');
    else         DOM.pauseBtn.classList.add('hidden');
  }

  return {
    showScreen, updateScore, updateRecord, updateLives, updateSpeed,
    updateHUD, showGameOver, showAchievementToast, showPowerupToast,
    renderAchievementMenu, setPauseBtn,
  };
})();

/* ============================================================
   SEÇÃO 12 — CONQUISTAS (ACHIEVEMENTS)
   ============================================================ */
const ACHIEVEMENTS = (() => {
  const list = [
    { id:'first_jump',   name:'Primeiro Salto',      icon:'🦘', desc:'Pule pela primeira vez',       unlocked:false, check:() => true },
    { id:'score_1k',     name:'1.000 Pontos',         icon:'🌟', desc:'Alcance 1.000 pontos',          unlocked:false, check:() => STATE.score >= 1000 },
    { id:'score_5k',     name:'5.000 Pontos',         icon:'💫', desc:'Alcance 5.000 pontos',          unlocked:false, check:() => STATE.score >= 5000 },
    { id:'score_10k',    name:'10.000 Pontos',        icon:'🏆', desc:'Alcance 10.000 pontos',         unlocked:false, check:() => STATE.score >= 10000 },
    { id:'combo_10',     name:'Combo x10',            icon:'🔥', desc:'Alcance um combo de 10',        unlocked:false, check:() => STATE.combo >= 10 },
    { id:'combo_25',     name:'Combo x25',            icon:'⚡', desc:'Alcance um combo de 25',        unlocked:false, check:() => STATE.combo >= 25 },
    { id:'powerup_all',  name:'Colecionador',         icon:'🎁', desc:'Colete todos os tipos de power-up', unlocked:false, _collected:new Set(), check:() => false }, // lógica especial
    { id:'speed_2x',     name:'Velocidade 2x',        icon:'🚀', desc:'Atinja velocidade 2x',          unlocked:false, check:() => STATE.speedMult >= 1.0 },
    { id:'speed_3x',     name:'Velocidade 3x',        icon:'🌪', desc:'Atinja velocidade 3x',          unlocked:false, check:() => STATE.speedMult >= 2.0 },
    { id:'no_hit_500',   name:'Invicto',              icon:'🛡', desc:'Alcance 500 pontos sem ser atingido', unlocked:false, _maxScore:0, check:() => false }, // lógica especial
    { id:'distance_500', name:'Maratonista',          icon:'🏃', desc:'Percorra 500m',                 unlocked:false, check:() => STATE.distance >= 500 },
    { id:'coin_10',      name:'Coletor',              icon:'🪙', desc:'Colete 10 moedas numa run',        unlocked:false, check:() => STATE.coins >= 10 },
    { id:'coin_50',      name:'Rico de Neon',         icon:'💰', desc:'Colete 50 moedas numa run',        unlocked:false, check:() => STATE.coins >= 50 },
    { id:'coin_100',     name:'Milionário Cyber',     icon:'🏦', desc:'Acumule 100 moedas no total',      unlocked:false, check:() => STATE.totalCoins >= 100 },
  ];

  let hitSinceStart = false;

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem('cr_achievements') || '[]');
      saved.forEach(id => {
        const ach = list.find(a => a.id === id);
        if (ach) ach.unlocked = true;
      });
    } catch (e) { /* ignora */ }
  }

  function save() {
    try {
      const unlocked = list.filter(a => a.unlocked).map(a => a.id);
      localStorage.setItem('cr_achievements', JSON.stringify(unlocked));
    } catch (e) { /* ignora */ }
  }

  function check(event, data) {
    list.forEach(ach => {
      if (ach.unlocked) return;

      // Lógica especial
      if (ach.id === 'powerup_all') {
        if (event === 'powerup_collected') {
          ach._collected = ach._collected || new Set();
          ach._collected.add(data);
          if (ach._collected.size >= CONFIG.POWERUP.TYPES.length) unlock(ach);
        }
        return;
      }
      if (ach.id === 'no_hit_500') {
        if (event === 'hit') { hitSinceStart = true; }
        if (!hitSinceStart && STATE.score >= 500) unlock(ach);
        return;
      }
      if (ach.id === 'first_jump' && event === 'jump') { unlock(ach); return; }

      // Checks gerais
      if (ach.check()) unlock(ach);
    });
  }

  function unlock(ach) {
    ach.unlocked = true;
    STATE.sessionAchievements.push(ach.id);
    save();
    UI.showAchievementToast(ach);
  }

  function resetSession() {
    hitSinceStart = false;
    STATE.sessionAchievements = [];
    // Reseta collectors de conquistas especiais sem apagar o desbloqueio
    list.forEach(a => {
      if (a._collected) a._collected = new Set();
    });
  }

  function getAll()      { return list; }
  function getById(id)   { return list.find(a => a.id === id); }

  return { load, save, check, resetSession, getAll, getById };
})();

/* ============================================================
   SEÇÃO 13 — INPUT / CONTROLES
   ============================================================ */
const INPUT = (() => {
  const keys = new Set();
  let jumpQueued  = false;
  let dashQueued  = false;
  let touchStartX = 0;
  let touchStartY = 0;

  function onKeyDown(e) {
    if (keys.has(e.code)) return; // Evita repeat
    keys.add(e.code);

    const isJump = e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW';
    const isDash = e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ArrowLeft' || e.code === 'KeyA';
    const isPause= e.code === 'KeyP' || e.code === 'Escape';

    if (isPause) {
      e.preventDefault();
      GAME.togglePause();
      return;
    }

    if (!STATE.running || STATE.gameOver) return;
    if (STATE.paused) return;

    if (isJump) {
      e.preventDefault();
      jumpQueued = true;
      ACHIEVEMENTS.check('jump');
    }
    if (isDash) {
      e.preventDefault();
      dashQueued = true;
    }
  }

  function onKeyUp(e) { keys.delete(e.code); }

  function onTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }

  function onTouchEnd(e) {
    if (!STATE.running || STATE.paused || STATE.gameOver) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) > Math.abs(dy) && dx < -40) {
      dashQueued = true;
    } else {
      jumpQueued = true;
      ACHIEVEMENTS.check('jump');
    }
    e.preventDefault();
  }

  function processQueued() {
    if (jumpQueued) { PLAYER.jump(); jumpQueued = false; }
    if (dashQueued) { PLAYER.dash(); dashQueued = false; }
  }

  function init() {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup',   onKeyUp);

    const canvas = DOM.canvas;
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });
  }

  function destroy() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup',   onKeyUp);
  }

  return { init, destroy, processQueued };
})();

/* ============================================================
   SEÇÃO 14 — DESENHO DO CENÁRIO / CHÃO
   ============================================================ */
const RENDERER = (() => {
  function drawGround(ctx) {
    const groundY = PHYSICS.getGroundY();
    const W = CONFIG.BASE_WIDTH;

    // Piso principal
    const grad = ctx.createLinearGradient(0, groundY, 0, CONFIG.BASE_HEIGHT);
    grad.addColorStop(0,   'rgba(0,242,255,0.15)');
    grad.addColorStop(0.1, 'rgba(0,0,10,0.9)');
    grad.addColorStop(1,   '#000008');
    ctx.fillStyle = grad;
    ctx.fillRect(0, groundY, W, CONFIG.BASE_HEIGHT - groundY);

    // Linha neon do chão
    ctx.save();
    ctx.shadowBlur  = 14;
    ctx.shadowColor = '#00f2ff';
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    // Segunda linha
    ctx.shadowBlur  = 6;
    ctx.shadowColor = 'rgba(188,19,254,0.5)';
    ctx.strokeStyle = 'rgba(188,19,254,0.5)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, groundY + 6);
    ctx.lineTo(W, groundY + 6);
    ctx.stroke();
    ctx.restore();

    // Grade de perspectiva no chão
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#00f2ff';
    ctx.lineWidth   = 1;

    // Linhas verticais (perspectiva)
    const horizon = groundY;
    const vanishX = W / 2;
    const lines = 14;
    for (let i = 0; i <= lines; i++) {
      const x = (i / lines) * W;
      ctx.beginPath();
      ctx.moveTo(vanishX + (x - vanishX) * 0.01, horizon);
      ctx.lineTo(x, CONFIG.BASE_HEIGHT);
      ctx.stroke();
    }

    // Linhas horizontais
    for (let y = groundY + 10; y < CONFIG.BASE_HEIGHT; y += 20) {
      const t = (y - groundY) / (CONFIG.BASE_HEIGHT - groundY);
      ctx.globalAlpha = 0.08 + t * 0.12;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    // Scroll offset para a grade
    if (STATE.running) {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#bc13fe';
      ctx.lineWidth   = 1;
      const off = (STATE.scrollX * 0.8) % 60;
      for (let x = -off; x < W; x += 60) {
        ctx.beginPath();
        ctx.moveTo(vanishX + (x - vanishX) * 0.01, groundY);
        ctx.lineTo(x, CONFIG.BASE_HEIGHT);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawDistanceMarker(ctx) {
    if (!STATE.running) return;
    const dist = Math.floor(STATE.distance);
    ctx.save();
    ctx.font         = '11px "Share Tech Mono", monospace';
    ctx.fillStyle    = 'rgba(0,242,255,0.35)';
    ctx.textAlign    = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${dist}m`, CONFIG.BASE_WIDTH - 10, PHYSICS.getGroundY() - 4);
    ctx.restore();
  }

  return { drawGround, drawDistanceMarker };
})();

/* ============================================================
   SEÇÃO 15 — GERENCIAMENTO DE SCORE / VELOCIDADE
   ============================================================ */
function addScore(amount) {
  const prev = Math.floor(STATE.score);
  STATE.score += amount * STATE.multiplier;
  const curr = Math.floor(STATE.score);

  // Checkpoint de 1000
  if (Math.floor(prev / 1000) !== Math.floor(curr / 1000)) {
    AUDIO.score1k();
    PARTICLES.spawnBurst(
      CONFIG.BASE_WIDTH / 2, CONFIG.BASE_HEIGHT / 2,
      20, STATE.skinColor, 6
    );
  }
}

function updateSpeed(dt) {
  STATE.speedMult = Math.min(
    STATE.speedMult + CONFIG.SPEED.INCREMENT * dt,
    CONFIG.SPEED.MAX
  );
  // Câmera lenta com power-up
  if (STATE.activePowerup === 'slow') {
    STATE.speedMult = Math.max(0, STATE.speedMult - 0.003 * dt);
  }
}

/* ============================================================
   SEÇÃO 16 — GAME LOOP PRINCIPAL
   ============================================================ */
const GAME = (() => {
  let lastTimestamp = 0;
  let frameCount    = 0;

  // --- Iniciar jogo ---
  function start() {

    console.log('GAME START');

    if (STATE.running) return; // Proteção contra múltiplos starts

    // Resetar estado
    STATE.running    = true;
    STATE.paused     = false;
    STATE.gameOver   = false;
    STATE.score      = 0;
    STATE.distance   = 0;
    STATE.combo      = 0;
    STATE.multiplier = 1;
    STATE.speedMult  = 0;
    STATE.frameCount = 0;
    STATE.activePowerup = null;
    STATE.powerupTimer  = 0;
    STATE.newRecord     = false;
    STATE.coins         = 0;

    const diff = CONFIG.DIFFICULTY[STATE.difficulty];
    STATE.lives = diff.lives;

    ACHIEVEMENTS.resetSession();
    PARTICLES.clear();
    OBSTACLES.reset();
    POWERUPS.reset();
    COINS.reset();
    PARALLAX.reset();
    PLAYER.reset();
    PHYSICS.recalcGround();

    UI.showScreen(null);
    UI.updateLives();
    UI.updateRecord();
    UI.updateHUD();
    UI.setPauseBtn(true);

    DOM.comboDisp.classList.add('hidden');
    DOM.puDisp.classList.add('hidden');

    // Iniciar música
    MUSIC.start();

    // Iniciar loop
    lastTimestamp = 0;
    if (STATE.rafId) {
      cancelAnimationFrame(STATE.rafId);
      STATE.rafId = null;
    }
    STATE.rafId = requestAnimationFrame(loop);
  }

  // --- Pausa ---
  function togglePause() {
    if (!STATE.running || STATE.gameOver) return;
    STATE.paused = !STATE.paused;

    if (STATE.paused) {
      DOM.pauseBtn.textContent = '▶';
      UI.showScreen('pause-screen');
      MUSIC.pause();
      cancelAnimationFrame(STATE.rafId);
      STATE.rafId = null;
    } else {
      DOM.pauseBtn.textContent = '⏸';
      UI.showScreen(null);
      MUSIC.resume();
      lastTimestamp = 0;
      STATE.rafId = requestAnimationFrame(loop);
    }
  }

  // --- Game Over ---
  function triggerGameOver() {
    STATE.running  = false;
    STATE.gameOver = true;
    MUSIC.stop();

    // Salvar record
    const score = Math.floor(STATE.score);
    if (score > STATE.bestScore) {
      STATE.bestScore = score;
      STATE.newRecord = true;
      try { localStorage.setItem('cr_best', String(score)); } catch (e) {}
    }

    ACHIEVEMENTS.check('game_over');
    UI.updateRecord();
    UI.setPauseBtn(false);

    cancelAnimationFrame(STATE.rafId);
    STATE.rafId = null;

    setTimeout(() => UI.showGameOver(), 600);
  }

  // --- Loop ---
  function loop(timestamp) {
    if (!STATE.running || STATE.paused) return;

    if (!lastTimestamp) lastTimestamp = timestamp;
    const rawDelta = Math.min((timestamp - lastTimestamp) / 1000 * 60, 4); // max 4 frames de catch-up
    lastTimestamp = timestamp;

    frameCount++;
    STATE.frameCount = frameCount;

    // Delta suavizado
    const dt = rawDelta;

    // Processar input
    INPUT.processQueued();

    // Update
    updateSpeed(dt);
    PLAYER.update(dt);
    OBSTACLES.update(dt);
    POWERUPS.update(dt);
    COINS.update(dt);
    PARALLAX.update(dt);
    PARTICLES.update();
    PHYSICS.checkCollisions();
    COINS.checkCollect();

    // Score e distância
    if (STATE.running) {
      addScore(CONFIG.SCORE.PER_FRAME * dt);
      STATE.distance += 0.05 * (1 + STATE.speedMult) * dt;
      UI.updateHUD();
      ACHIEVEMENTS.check('frame');
    }

    // Render
    render();

    if (STATE.running) {
      STATE.rafId = requestAnimationFrame(loop);
    }
  }

  // --- Render ---
  function render() {
    const ctx = DOM.ctx;
    const W   = CONFIG.BASE_WIDTH;
    const H   = CONFIG.BASE_HEIGHT;

    // Limpar
    ctx.clearRect(0, 0, W, H);

    // Chão
    RENDERER.drawGround(ctx);

    // Obstáculos
    OBSTACLES.draw(ctx);

    // Power-ups
    POWERUPS.draw(ctx);

    // Moedas
    COINS.draw(ctx);

    // Partículas (atrás do player)
    PARTICLES.draw(ctx);

    // Player
    PLAYER.draw(ctx);

    // Marcador de distância
    RENDERER.drawDistanceMarker(ctx);
  }

  return { start, togglePause, triggerGameOver };
})();

// Expor triggerGameOver globalmente para uso em PHYSICS
function triggerGameOver() { GAME.triggerGameOver(); }

/* ============================================================
   SEÇÃO 17 — CANVAS RESIZE
   ============================================================ */
function resizeCanvas() {
  const container = document.getElementById('game-container');
  if (!container || !DOM.canvas) return;

  const rect = container.getBoundingClientRect();
  const scaleX = rect.width  / CONFIG.BASE_WIDTH;
  const scaleY = rect.height / CONFIG.BASE_HEIGHT;

  DOM.canvas.width  = CONFIG.BASE_WIDTH;
  DOM.canvas.height = CONFIG.BASE_HEIGHT;
  DOM.canvas.style.width  = rect.width  + 'px';
  DOM.canvas.style.height = rect.height + 'px';

  PHYSICS.recalcGround();
}

/* ============================================================
   SEÇÃO 18 — EVENTOS DOS BOTÕES
   ============================================================ */
function bindEvents() {
  // Iniciar
  DOM.startBtn.addEventListener('click', () => {
    console.log('CLICOU START');
    GAME.start();
  });

  // Reiniciar
  DOM.restartBtn.addEventListener('click', () => {
    UI.showScreen(null);
    GAME.start();
  });

  // Menu (da tela de game over)
  DOM.menuBtn.addEventListener('click', () => {
    STATE.running  = false;
    STATE.gameOver = false;
    STATE.paused   = false;
    if (STATE.rafId) {
      cancelAnimationFrame(STATE.rafId);
      STATE.rafId = null;
    }
    UI.setPauseBtn(false);
    UI.showScreen('start-screen');
    UI.renderAchievementMenu();
    UI.updateRecord();
  });

  // Continuar pause
  DOM.resumeBtn.addEventListener('click', () => {
    if (STATE.paused) GAME.togglePause();
  });

  // Quit (pause → menu)
  DOM.quitBtn.addEventListener('click', () => {
    STATE.running  = false;
    STATE.paused   = false;
    STATE.gameOver = false;
    if (STATE.rafId) {
      cancelAnimationFrame(STATE.rafId);
      STATE.rafId = null;
    }
    DOM.pauseBtn.textContent = '⏸';
    UI.setPauseBtn(false);
    UI.showScreen('start-screen');
    UI.renderAchievementMenu();
  });

  // Pause
  DOM.pauseBtn.addEventListener('click', () => {
    GAME.togglePause();
  });

  // Mudo
  DOM.muteBtn.addEventListener('click', () => {
    STATE.muted = !STATE.muted;
    DOM.muteBtn.textContent = STATE.muted ? '🔇' : '🔊';
    AUDIO.setMuted(STATE.muted);
  });

  // Dificuldade
  DOM.diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.difficulty = btn.dataset.diff;
    });
  });

  // Skins
  DOM.skinBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.skinBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.skin      = btn.dataset.skin;
      STATE.skinColor = CONFIG.SKINS[STATE.skin] || '#00f2ff';
      document.documentElement.style.setProperty('--player-color', STATE.skinColor);
    });
  });

  // Resize
  window.addEventListener('resize', () => {
    resizeCanvas();
    PHYSICS.recalcGround();
  });
}

/* ============================================================
   SEÇÃO 19 — UTILITÁRIOS
   ============================================================ */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function showPowerupToast(text) { UI.showPowerupToast(text); }

/* ============================================================
   SEÇÃO 20 — INICIALIZAÇÃO
   ============================================================ */
function init() {
  // Inicializar DOM
  initDOM();

  // Inicializar parallax
  PARALLAX.init();

  // Resize inicial
  resizeCanvas();
  PHYSICS.recalcGround();

  // Carregar dados salvos
  try {
    const saved = parseInt(localStorage.getItem('cr_best') || '0', 10);
    STATE.bestScore = isNaN(saved) ? 0 : saved;
  } catch (e) { STATE.bestScore = 0; }

  ACHIEVEMENTS.load();

  // Carregar total de moedas acumuladas
  try {
    const sc = parseInt(localStorage.getItem('cr_coins') || '0', 10);
    STATE.totalCoins = isNaN(sc) ? 0 : sc;
  } catch (_) { STATE.totalCoins = 0; }

  // Definir record na UI
  UI.updateRecord();

  // Render inicial do menu
  UI.renderAchievementMenu();

  // Eventos
  bindEvents();
  INPUT.init();

  // Mostrar tela inicial
  UI.showScreen('start-screen');

  // Estado padrão dos botões da skin
  STATE.skinColor = CONFIG.SKINS[STATE.skin];
  document.documentElement.style.setProperty('--player-color', STATE.skinColor);

  console.log('%cCYBER RUNNER v2.0 — Initialized ✓', 'color:#00f2ff;font-weight:bold;font-size:13px;');
}

// Aguardar DOM pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}