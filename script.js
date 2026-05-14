"use strict";

/* ============================================================
   CYBER RUNNER v2.0 — PATCH DE INICIALIZAÇÃO
   ============================================================ */

/* TESTE DE CARREGAMENTO */
console.log("SCRIPT INICIADO COM SUCESSO");

/* ============================================================
   ÁUDIO — CORRIGIDO
   ============================================================ */

const Audio_ = (() => {

    /* ===== PATCH PRINCIPAL ===== */
    const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

    let AC = null;

    try {
        if (AudioContextClass) {
            AC = new AudioContextClass();
        }
    } catch (e) {
        console.warn("Web Audio API não suportada:", e);
    }

    let master = null;

    if (AC) {
        master = AC.createGain();
        master.gain.value = 0.75;
        master.connect(AC.destination);
    }

    let muted = false;
    let musicOn = false;
    let musicTid = null;

    function tone(type, freq, vol, dur, freqEnd) {

        /* ===== PATCH ===== */
        if (muted || !AC || !master) return;

        try {

            const o = AC.createOscillator();
            const g = AC.createGain();

            o.connect(g);
            g.connect(master);

            const t = AC.currentTime;

            o.type = type;

            o.frequency.setValueAtTime(
                Math.max(1, freq),
                t
            );

            if (freqEnd !== undefined) {
                o.frequency.exponentialRampToValueAtTime(
                    Math.max(1, freqEnd),
                    t + dur
                );
            }

            g.gain.setValueAtTime(vol, t);

            g.gain.exponentialRampToValueAtTime(
                0.001,
                t + dur
            );

            o.start(t);
            o.stop(t + dur);

        } catch (err) {
            console.warn("Erro no áudio:", err);
        }
    }

    const SFX = {
        jump() {
            tone('triangle', 160, .10, .13, 650);
        },

        doubleJump() {
            tone('sine', 400, .09, .10, 900);
            tone('triangle', 280, .06, .12, 700);
        },

        dash() {
            tone('sawtooth', 280, .07, .14, 580);
        },

        land() {
            tone('sine', 80, .06, .07, 50);
        },

        collision() {
            tone('sawtooth', 200, .18, .35, 45);
            tone('square', 120, .10, .28, 55);
        },

        gameover() {
            tone('square', 280, .14, .55, 50);
            tone('sawtooth', 180, .09, .40, 40);
        },

        powerup() {
            [0, 60, 120].forEach((d, i) => {
                setTimeout(() => {
                    tone(
                        'sine',
                        420 + i * 210,
                        .11,
                        .13,
                        820 + i * 210
                    );
                }, d);
            });
        },

        shield() {
            tone('sine', 320, .09, .22, 620);
            tone('triangle', 480, .05, .20, 900);
        },

        comboUp() {
            tone('sine', 620, .07, .06, 1100);
        },

        click() {
            tone('sine', 880, .07, .04, 880);
        },
    };

    const MELODY = [110, 110, 130, 110, 146, 110, 130, 123];
    const BASS   = [55, 55, 65, 55, 73, 55, 65, 61];

    let step = 0;

    function musicTick() {

        /* ===== PATCH ===== */
        if (
            !musicOn ||
            muted ||
            !AC ||
            !master ||
            STATE.phase !== 'PLAYING'
        ) return;

        const t = AC.currentTime;

        const s = step % MELODY.length;

        const spd = Math.min(
            STATE.gameSpeed / 5.5,
            2.4
        );

        try {

            const om = AC.createOscillator();
            const gm = AC.createGain();

            om.type = 'sawtooth';

            om.frequency.setValueAtTime(
                MELODY[s],
                t
            );

            gm.gain.setValueAtTime(0.022, t);

            gm.gain.exponentialRampToValueAtTime(
                0.001,
                t + 0.18
            );

            om.connect(gm);
            gm.connect(master);

            om.start(t);
            om.stop(t + 0.18);

            const ob = AC.createOscillator();
            const gb = AC.createGain();

            ob.type = 'sine';

            ob.frequency.setValueAtTime(
                BASS[s],
                t
            );

            gb.gain.setValueAtTime(0.038, t);

            gb.gain.exponentialRampToValueAtTime(
                0.001,
                t + 0.19
            );

            ob.connect(gb);
            gb.connect(master);

            ob.start(t);
            ob.stop(t + 0.19);

        } catch (err) {
            console.warn("Erro música:", err);
        }

        step++;

        musicTid = setTimeout(
            musicTick,
            Math.round(195 / spd)
        );
    }

    function startMusic() {

        if (!AC || !master) return;

        if (musicOn || muted) return;

        musicOn = true;

        if (AC.state === 'suspended') {
            AC.resume();
        }

        musicTick();
    }

    function stopMusic() {
        musicOn = false;

        if (musicTid) {
            clearTimeout(musicTid);
            musicTid = null;
        }
    }

    function toggleMute() {

        muted = !muted;

        if (master) {
            master.gain.value = muted ? 0 : 0.75;
        }

        if (muted) {
            stopMusic();
        } else if (STATE.phase === 'PLAYING') {
            startMusic();
        }

        return muted;
    }

    function resume() {

        if (!AC) return;

        if (AC.state === 'suspended') {
            AC.resume();
        }
    }

    return {
        SFX,
        startMusic,
        stopMusic,
        toggleMute,
        resume,
        isMuted: () => muted
    };

})();

/* ============================================================
   PATCH FINAL DE SEGURANÇA
   ============================================================ */

window.addEventListener("error", (e) => {
    console.error("ERRO GLOBAL:", e.error);
});

window.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado");
});

/* ============================================================
   VERIFICAÇÃO DE ELEMENTOS
   ============================================================ */

window.addEventListener("load", () => {

    const requiredIds = [
        "gameCanvas",
        "start-btn",
        "pause-btn",
        "mute-btn",
        "score-value"
    ];

    requiredIds.forEach(id => {

        const el = document.getElementById(id);

        if (!el) {
            console.error("Elemento não encontrado:", id);
        } else {
            console.log("OK:", id);
        }

    });

});