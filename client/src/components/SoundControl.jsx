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
                className={`p-2 border-2 border-black shadow-[2px_2px_0_#000] active:translate-y-1 active:shadow-none transition ${
                    muted 
                        ? 'bg-[#7d7d7d] text-[#333] hover:bg-[#8b8b8b]' 
                        : 'bg-[#f0c330] text-black hover:bg-[#ffe066]'
                }`}
                title={muted ? 'Unmute' : 'Mute'}
            >
                {muted ? <VolumeX className="w-5 h-5" strokeWidth={2.5} /> : <Volume2 className="w-5 h-5" strokeWidth={2.5} />}
            </button>
            
            <div className="flex items-center gap-2">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    disabled={muted}
                    className="w-24 h-4 bg-[#373737] border-2 border-black appearance-none cursor-pointer accent-[#f0c330] disabled:opacity-50"
                    style={{
                        WebkitAppearance: 'none',
                    }}
                    title="Volume"
                />
                <span className="text-xs text-gray-400 w-8">{volume}%</span>
            </div>
        </div>
    );
};

export default SoundControl;
