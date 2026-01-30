import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import soundManager from '../utils/sounds';

const SoundControl = ({ className = '' }) => {
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(30);

    const handleMuteToggle = () => {
        const newMuted = soundManager.toggleMute();
        setMuted(newMuted);
        soundManager.play('click');
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseInt(e.target.value);
        setVolume(newVolume);
        soundManager.setVolume(newVolume / 100);
        
        // Play a test sound when adjusting volume
        if (!muted) {
            soundManager.play('click');
        }
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <button
                onClick={handleMuteToggle}
                className={`p-2 rounded-lg transition ${
                    muted 
                        ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' 
                        : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                }`}
                title={muted ? 'Unmute' : 'Mute'}
            >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-2">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    disabled={muted}
                    className="w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
                    title="Volume"
                />
                <span className="text-xs text-gray-400 w-8">{volume}%</span>
            </div>
        </div>
    );
};

export default SoundControl;
