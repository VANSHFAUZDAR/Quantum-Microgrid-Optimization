/**
 * Procedural Audio Synthesizer for Quantum Microgrid 3D - MUTED (Global Audio Removal)
 * All sound effects, ambient noise, and background beats have been completely removed.
 * The simulation and animation sequence run in 100% silence.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = false;
        this.ambientGain = null;
        this.ambientOsc = null;
        this.initialized = false;
    }

    init() {
        this.enabled = false;
    }

    toggle() {
        this.enabled = false;
        return false;
    }

    resume() {}
    startAmbientHum() {}
    playHover() {}
    playQuantumClick() {}
    playTransition(toDay) {}
    playDivertAlert() {}

    playEnergyFlowTrack(onComplete) {
        // Completely silent: zero audio played
    }

    stopEnergyFlowTrack() {}
}

window.soundEngine = new SoundEngine();
