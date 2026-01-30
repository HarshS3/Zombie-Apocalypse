// Sound Effects Manager for Code-Apocalypse
class SoundManager {
    constructor() {
        this.sounds = {};
        this.volume = 0.3; // Default volume (0.0 to 1.0)
        this.muted = false;
        this.initialized = false;
    }

    // Initialize all sound effects
    init() {
        if (this.initialized) return;

        // Using free sound effect URLs from public CDNs or generating simple tones
        this.sounds = {
            // UI Sounds
            click: this.createSound('/sounds/click.mp3', 0.2),
            hover: this.createSound('/sounds/hover.mp3', 0.1),
            
            // Game Sounds
            scoreIncrement: this.createSound('/sounds/score.mp3', 0.3),
            zoneCapture: this.createSound('/sounds/capture.mp3', 0.4),
            zoneActivated: this.createSound('/sounds/activate.mp3', 0.5),
            sabotage: this.createSound('/sounds/sabotage.mp3', 0.6),
            
            // Timer Sounds
            timerTick: this.createSound('/sounds/tick.mp3', 0.15),
            timerWarning: this.createSound('/sounds/warning.mp3', 0.4),
            timerEnd: this.createSound('/sounds/end.mp3', 0.5),
            
            // Notification Sounds
            reset: this.createSound('/sounds/reset.mp3', 0.4),
            success: this.createSound('/sounds/success.mp3', 0.3),
            alert: this.createSound('/sounds/alert.mp3', 0.4),
        };

        this.initialized = true;
    }

    createSound(src, volume = 0.3) {
        const audio = new Audio();
        audio.volume = volume * this.volume;
        
        // Fallback to data URI beep if file doesn't exist
        audio.addEventListener('error', () => {
            audio.src = this.generateBeep(volume > 0.3 ? 800 : 400, 0.1);
        });
        
        audio.src = src;
        audio.preload = 'auto';
        return audio;
    }

    // Generate a simple beep sound as fallback
    generateBeep(frequency = 440, duration = 0.1) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        // Create a data URI (this is a simplified version, actual implementation would be more complex)
        return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    }

    play(soundName) {
        if (!this.initialized) this.init();
        if (this.muted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // Clone the audio to allow overlapping plays
            const clone = sound.cloneNode();
            clone.volume = sound.volume * (this.muted ? 0 : 1);
            clone.play().catch(err => console.log('Sound play failed:', err));
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            if (sound.baseVolume === undefined) {
                sound.baseVolume = sound.volume;
            }
            sound.volume = sound.baseVolume * this.volume;
        });
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    setMuted(muted) {
        this.muted = muted;
    }
}

// Create singleton instance
const soundManager = new SoundManager();

// Auto-initialize on first user interaction
let autoInitialized = false;
const autoInit = () => {
    if (!autoInitialized) {
        soundManager.init();
        autoInitialized = true;
        document.removeEventListener('click', autoInit);
        document.removeEventListener('keydown', autoInit);
    }
};

if (typeof document !== 'undefined') {
    document.addEventListener('click', autoInit);
    document.addEventListener('keydown', autoInit);
}

export default soundManager;
