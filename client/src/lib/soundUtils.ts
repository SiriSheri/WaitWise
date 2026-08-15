/**
 * High-fidelity Audio Synthesizer for Queue Bell Chimes
 * Uses browser Web Audio API — works offline and requires no external audio assets!
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled = true;
  private voiceEnabled = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  public isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  /**
   * Harmonious 3-tone chime for "Ticket Called / Your Turn"
   */
  public playCallChime() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + index * 0.12);

      gain.gain.setValueAtTime(0, startTime + index * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, startTime + index * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + index * 0.12);
      osc.stop(startTime + index * 0.12 + 0.65);
    });
  }

  /**
   * Gentle two-tone reminder for "1 person ahead / Turn approaching"
   */
  public playApproachingAlert() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [440, 554.37]; // A4, C#5
    const startTime = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + index * 0.18);

      gain.gain.setValueAtTime(0, startTime + index * 0.18);
      gain.gain.linearRampToValueAtTime(0.18, startTime + index * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.18 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + index * 0.18);
      osc.stop(startTime + index * 0.18 + 0.45);
    });
  }

  /**
   * Browser Text-to-Speech Announcement
   */
  public speakAnnouncement(ticketNumber: string, counterName?: string) {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop previous
      const text = counterName
        ? `Now serving token ${ticketNumber.split('-').join(' ')} at ${counterName}.`
        : `Now serving token ${ticketNumber.split('-').join(' ')}.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Ignore speech synthesis issues gracefully
    }
  }
}

export const soundManager = new SoundManager();
