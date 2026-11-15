class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public unlock() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) this.unlock();
    if (!this.ctx || this.ctx.state !== 'running') return this.ctx;
    return this.ctx;
  }

  public playDrop() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.11);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playLand(hasSlice: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Punchy suspension thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.13);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);

    // Metallic slice snip if overhang was trimmed
    if (hasSlice) {
      const sliceOsc = ctx.createOscillator();
      const sliceGain = ctx.createGain();
      sliceOsc.type = 'sawtooth';
      sliceOsc.frequency.setValueAtTime(640, now + 0.01);
      sliceOsc.frequency.exponentialRampToValueAtTime(180, now + 0.14);

      sliceGain.gain.setValueAtTime(0.09, now + 0.01);
      sliceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      sliceOsc.connect(sliceGain);
      sliceGain.connect(ctx.destination);
      sliceOsc.start(now + 0.01);
      sliceOsc.stop(now + 0.15);
    }
  }

  public playPerfect(combo: number, expanded: boolean) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Ascending pentatonic scale steps based on combo count
    const scaleSemitones = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const step = scaleSemitones[Math.min(combo - 1, scaleSemitones.length - 1)];
    const baseFreq = 440 * Math.pow(2, step / 12);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.015, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);

    // Harmonic sparkle overtone
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(baseFreq * 1.5, now + 0.03);
    shimmerGain.gain.setValueAtTime(0.09, now + 0.03);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmer.start(now + 0.03);
    shimmer.stop(now + 0.28);

    if (expanded) {
      const boost = ctx.createOscillator();
      const boostGain = ctx.createGain();
      boost.type = 'sine';
      boost.frequency.setValueAtTime(baseFreq * 2, now + 0.08);
      boost.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.28);
      boostGain.gain.setValueAtTime(0.1, now + 0.08);
      boostGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      boost.connect(boostGain);
      boostGain.connect(ctx.destination);
      boost.start(now + 0.08);
      boost.stop(now + 0.3);
    }
  }

  public playGameOver() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [330, 262, 196];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.11;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.88, start + 0.18);

      gain.gain.setValueAtTime(0.11, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  }
}

export const soundEngine = new SoundEngine();
