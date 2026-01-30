# Code-Apocalypse Sound Effects

## Quick Setup

### Option 1: Generate Simple Sounds (Recommended)
1. Open `client/public/sounds/generator.html` in your browser
2. Open browser console (F12)
3. Sounds will auto-generate and download
4. All `.wav` files should now be in your Downloads folder
5. Move all `.wav` files to `client/public/sounds/` folder

### Option 2: Use Free Sound Libraries
Download free sound effects from:
- **Freesound.org**: https://freesound.org/
- **ZapSplat**: https://www.zapsplat.com/
- **Mixkit**: https://mixkit.co/free-sound-effects/

### Sound Files Needed
Place these in `client/public/sounds/`:
- `click.wav` - Button click (short beep)
- `hover.wav` - Hover effect (subtle tone)
- `score.wav` - Score increment (positive ding)
- `capture.wav` - Zone captured (triumphant tone)
- `activate.wav` - Zone activated (power-up sound)
- `sabotage.wav` - Sabotage triggered (alarm/warning)
- `tick.wav` - Timer tick (clock sound)
- `warning.wav` - Timer warning at 60s (urgent tone)
- `end.wav` - Timer finished (horn/buzzer)
- `reset.wav` - Reset button (whoosh/clear sound)
- `success.wav` - Success action (achievement)
- `alert.wav` - Alert/notification (attention sound)

## Sound Events

### Admin Panel
- ✅ **Score Increment**: When confirming player selection
- ✅ **Zone Activation**: When changing active zone
- ✅ **Reset**: When resetting all scores
- ✅ **Sabotage**: When triggering sabotage

### War Room
- ✅ **Zone Capture**: When a zone changes from neutral to dominated
- ✅ **Zone Activated**: When active zone changes
- ✅ **Timer Warning**: At 60 seconds remaining
- ✅ **Timer Tick**: Last 10 seconds countdown
- ✅ **Timer End**: When time expires
- ✅ **Sabotage**: When sabotage modal appears
- ✅ **Reset**: When scores are reset

## Volume Control
Default volume is set to 30% (0.3). You can adjust in `src/utils/sounds.js`:
```javascript
this.volume = 0.3; // Change this value (0.0 to 1.0)
```

## Fallback Behavior
If sound files don't exist, the system will:
1. Try to generate simple beep tones using Web Audio API
2. Fail silently (no errors in console)
3. Continue functioning normally

## Testing
Open browser console to see sound play logs:
```
Sound play failed: [error message]
```

## Mute Option
To add a mute button (future enhancement):
```javascript
soundManager.toggleMute(); // Returns true if muted, false if unmuted
soundManager.setVolume(0.5); // Set to 50%
```
