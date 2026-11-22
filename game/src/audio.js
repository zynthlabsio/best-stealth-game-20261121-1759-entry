// Emberveil — all sound is synthesized with WebAudio: soft cloth steps, a crystal
// chime, a warden's alert sting, low win/lose phrases. No audio files, ever.

export class SoundBank {
  constructor() {
    this.context = null;
    this.muted = false;
  }

  ensure() {
    if (this.context) { if (this.context.state === 'suspended') this.context.resume(); return true; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      this.context = new AC();
      return true;
    } catch { return false; }
  }

  tone(freq, seconds, type, gain, slideTo = 0, delay = 0) {
    if (this.muted || !this.ensure()) return;
    const ctx = this.context;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(amp).connect(ctx.destination);
    osc.start(t0); osc.stop(t0 + seconds + 0.02);
  }

  thud(gain, seconds = 0.07) {
    if (this.muted || !this.ensure()) return;
    const ctx = this.context;
    const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 420;
    const amp = ctx.createGain(); amp.gain.value = gain;
    src.connect(filter).connect(amp).connect(ctx.destination);
    src.start();
  }

  step(sneaking) { this.thud(sneaking ? 0.05 : 0.13); }
  pickup() { this.tone(880, 0.16, 'sine', 0.16); this.tone(1318, 0.24, 'sine', 0.12, 0, 0.07); }
  spotted() { this.tone(196, 0.28, 'sawtooth', 0.16, 392); this.tone(392, 0.3, 'square', 0.07, 587, 0.05); }
  suspicious() { this.tone(520, 0.1, 'triangle', 0.08, 660); }
  caught() { this.tone(330, 0.5, 'sawtooth', 0.15, 82); }
  doorOpen() { this.tone(523, 0.18, 'triangle', 0.12); this.tone(784, 0.26, 'triangle', 0.12, 0, 0.1); }
  win() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.12, 0, i * 0.11)); }
  click() { this.tone(700, 0.05, 'square', 0.05); }
  toggleMute() { this.muted = !this.muted; return this.muted; }
}
