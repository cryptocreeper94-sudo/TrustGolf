import { Platform } from "react-native";

type SoundName = "swing" | "impact" | "crowd" | "chestOpen" | "chestReveal" | "levelUp" | "achievementUnlock" | "menuTap" | "obMiss" | "countdown";

class BomberSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  private getCtx(): AudioContext | null {
    if (Platform.OS !== "web") return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch { return null; }
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  setEnabled(val: boolean) { this.enabled = val; }

  play(name: SoundName) {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      switch (name) {
        case "swing": this.playSwing(ctx); break;
        case "impact": this.playImpact(ctx); break;
        case "crowd": this.playCrowd(ctx); break;
        case "chestOpen": this.playChestOpen(ctx); break;
        case "chestReveal": this.playChestReveal(ctx); break;
        case "levelUp": this.playLevelUp(ctx); break;
        case "achievementUnlock": this.playAchievement(ctx); break;
        case "menuTap": this.playMenuTap(ctx); break;
        case "obMiss": this.playOBMiss(ctx); break;
        case "countdown": this.playCountdown(ctx); break;
      }
    } catch {}
  }

  private playSwing(ctx: AudioContext) {
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * Math.min(1, t * 20);
    }
    noise.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 800;
    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    noise.connect(hp).connect(gain).connect(ctx.destination);
    noise.start(now);
  }

  private playImpact(ctx: AudioContext) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.2);

    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
    noise.buffer = buf;
    const g2 = ctx.createGain(); g2.gain.value = 0.2;
    noise.connect(g2).connect(ctx.destination);
    noise.start(now);
  }

  private playCrowd(ctx: AudioContext) {
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    const dur = 1.5;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / ctx.sampleRate;
      const env = Math.sin(Math.PI * t / dur) * (1 + 0.3 * Math.sin(t * 8));
      data[i] = (Math.random() * 2 - 1) * env * 0.08;
    }
    noise.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1200; bp.Q.value = 0.5;
    noise.connect(bp).connect(ctx.destination);
    noise.start(now);
  }

  private playChestOpen(ctx: AudioContext) {
    const now = ctx.currentTime;
    [200, 300, 400, 500, 600].forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const gain = ctx.createGain();
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.25);
    });
  }

  private playChestReveal(ctx: AudioContext) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.3);
  }

  private playLevelUp(ctx: AudioContext) {
    const now = ctx.currentTime;
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const gain = ctx.createGain();
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.35);
    });
  }

  private playAchievement(ctx: AudioContext) {
    const now = ctx.currentTime;
    const notes = [784, 988, 1175, 1568];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      const gain = ctx.createGain();
      const t = now + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.4);
    });
  }

  private playMenuTap(ctx: AudioContext) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 880;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.08);
  }

  private playOBMiss(ctx: AudioContext) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.4);
  }

  private playCountdown(ctx: AudioContext) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 660;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.12);
  }
}

export const bomberSounds = new BomberSoundEngine();
