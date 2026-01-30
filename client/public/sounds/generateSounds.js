// Simple WAV file generator for placeholder sounds
// Run with: node generateSounds.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateWavFile(filename, frequency, duration, waveType = 'sine') {
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const fileSize = 44 + dataSize;

    const buffer = Buffer.alloc(fileSize);
    
    // WAV Header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(fileSize - 8, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // fmt chunk size
    buffer.writeUInt16LE(1, 20);  // audio format (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    // Generate audio samples
    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let sample = 0;

        // Generate waveform
        switch (waveType) {
            case 'sine':
                sample = Math.sin(2 * Math.PI * frequency * t);
                break;
            case 'square':
                sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
                break;
            case 'sawtooth':
                sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
                break;
            case 'triangle':
                sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
                break;
        }

        // Apply envelope (fade in/out)
        const fadeIn = Math.min(i / (sampleRate * 0.01), 1);
        const fadeOut = Math.min((numSamples - i) / (sampleRate * 0.05), 1);
        const envelope = fadeIn * fadeOut;

        // Apply volume and envelope
        sample = sample * envelope * 0.3;

        // Convert to 16-bit PCM
        const pcmSample = Math.max(-1, Math.min(1, sample));
        const intSample = pcmSample < 0 
            ? Math.floor(pcmSample * 32768)
            : Math.floor(pcmSample * 32767);
        
        buffer.writeInt16LE(intSample, 44 + i * bytesPerSample);
    }

    fs.writeFileSync(path.join(__dirname, filename), buffer);
    console.log(`✅ Generated: ${filename}`);
}

// Generate all sound effects
console.log('🎵 Generating sound effects for Code-Apocalypse...\n');

generateWavFile('click.wav', 800, 0.05, 'sine');
generateWavFile('hover.wav', 600, 0.03, 'sine');
generateWavFile('score.wav', 1200, 0.15, 'sine');
generateWavFile('capture.wav', 440, 0.3, 'triangle');
generateWavFile('activate.wav', 880, 0.25, 'sawtooth');
generateWavFile('sabotage.wav', 220, 0.4, 'square');
generateWavFile('tick.wav', 1000, 0.05, 'sine');
generateWavFile('warning.wav', 660, 0.25, 'sawtooth');
generateWavFile('end.wav', 330, 0.5, 'square');
generateWavFile('reset.wav', 550, 0.2, 'triangle');
generateWavFile('success.wav', 1400, 0.2, 'sine');
generateWavFile('alert.wav', 700, 0.25, 'sawtooth');

console.log('\n✨ All sound effects generated successfully!');
console.log('📁 Files are in: client/public/sounds/');
console.log('🎮 Ready to use in the application!');
