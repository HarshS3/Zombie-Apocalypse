# 🧪 Sound Effects Testing Guide

## Quick Test Checklist

### 🎮 Admin Panel Tests

1. **Open Admin Panel**: `http://localhost:3000/round2/admin`

2. **Test Score Increment Sound**:
   - Click any zone's "+" button (E/M/H)
   - Select a player from modal
   - Click "Confirm"
   - ✅ Should hear: Short positive "ding" sound

3. **Test Zone Activation Sound**:
   - Click "Zone A", "Zone B", or "Zone C" button in Active Zone Control
   - ✅ Should hear: Power-up "activate" sound
   - ✅ War room should also play this sound

4. **Test Sabotage Sound**:
   - Click "Trigger Human Sabotage" or "Trigger Zombie Sabotage"
   - ✅ Should hear: Alarm/warning sound in admin
   - ✅ War room should show modal + play same sound

5. **Test Reset Sound**:
   - Click "Reset All Scores & Timer"
   - Confirm the alert
   - ✅ Should hear: Whoosh/reset sound

6. **Test Volume Control**:
   - Use slider next to timer (top right)
   - ✅ Sounds should get louder/quieter
   - Click mute button
   - ✅ All sounds should stop

---

### 📺 War Room Tests

1. **Open War Room**: `http://localhost:3000/round2/war`

2. **Test Zone Capture Sound**:
   - In admin: increment scores to capture a zone
   - Wait for zone to change color (human/zombie)
   - ✅ Should hear: Triumphant capture sound in war room

3. **Test Zone Activation Sound**:
   - In admin: change active zone
   - ✅ War room should play activation sound
   - ✅ Active zone indicator should update

4. **Test Timer Sounds**:
   - Start timer in admin
   - Wait for timer to reach **1:00** (60 seconds)
   - ✅ Should hear: Urgent warning sound
   - Wait for timer to reach **0:10** (10 seconds)
   - ✅ Should hear: Tick sound every second (0:10, 0:09, 0:08...)
   - Wait for timer to reach **0:00**
   - ✅ Should hear: Horn/buzzer end sound

5. **Test Sabotage Modal + Sound**:
   - In admin: trigger sabotage
   - ✅ Modal appears with team colors
   - ✅ Sabotage alarm sound plays
   - ✅ Modal auto-dismisses after 5 seconds

6. **Test Reset Sound**:
   - In admin: reset scores
   - ✅ War room plays reset sound
   - ✅ Zones and leaderboards clear

7. **Test Volume Control**:
   - Use slider in war room header
   - ✅ All sounds adjust volume
   - ✅ Mute button stops all sounds

---

## 🔍 Visual Indicators

### Admin Panel Header
```
[🔊 Volume Slider 30%] [⏱️ Timer Display]
```

### War Room Header
```
[Zone Indicators] [🔊 Volume Slider 30%] [⏱️ Cycle Timer]
```

---

## 🎯 Expected Sound Sequence

### Typical Game Flow:
1. **Start**: Admin starts timer → No sound (silent start)
2. **+1 Point**: Admin increments → `scoreIncrement` sound
3. **Zone Capture**: Zone changes color → `zoneCapture` sound in war room
4. **Zone Activation**: Admin changes active → `zoneActivated` in both
5. **60s Warning**: Timer at 1:00 → `timerWarning` in war room
6. **Final Countdown**: 10...9...8 → `timerTick` each second
7. **Time's Up**: Timer at 0:00 → `timerEnd` sound
8. **Sabotage**: Admin triggers → `sabotage` + modal in war room
9. **Reset**: Admin resets → `reset` sound in both

---

## 🐛 Common Issues

### No Sound Playing?
- ✅ Check if mute button is enabled (gray icon)
- ✅ Check volume slider is > 0%
- ✅ Open browser console (F12) for errors
- ✅ Click anywhere on page first (browser autoplay policy)

### Sound Files Missing?
```bash
cd client/public/sounds
node generateSounds.js
```

### Sounds Too Loud/Quiet?
- Adjust volume slider in UI (0-100%)
- Or edit default in `src/utils/sounds.js`: `this.volume = 0.3`

---

## 📊 Sound Timing Reference

| Sound | Duration | Volume | Type |
|-------|----------|--------|------|
| Click | 50ms | 20% | Instant |
| Score Increment | 150ms | 30% | Quick |
| Zone Capture | 300ms | 40% | Medium |
| Zone Activated | 250ms | 50% | Medium |
| Sabotage | 400ms | 60% | Long |
| Timer Warning | 250ms | 40% | Medium |
| Timer Tick | 50ms | 15% | Very Short |
| Timer End | 500ms | 50% | Long |
| Reset | 200ms | 40% | Medium |

---

## ✅ Full Test Protocol

### Setup
1. Open 2 browser windows/tabs:
   - Tab 1: Admin Panel
   - Tab 2: War Room (duplicate or new window)
2. Unmute both tabs
3. Set volume to 50% in both

### Test Sequence
1. **Admin**: Increment Human Zone A Easy
   - ✅ Hear increment sound in admin
2. **Admin**: Increment until zone captured
   - ✅ Hear capture sound in war room
3. **Admin**: Change active zone to B
   - ✅ Hear activation in both admin & war room
4. **Admin**: Start timer
5. **Admin**: Fast-forward time to 1:00 remaining
   - ✅ Hear warning in war room
6. **Admin**: Continue to 0:10
   - ✅ Hear ticks every second in war room
7. **Admin**: Let timer reach 0:00
   - ✅ Hear end horn in war room
8. **Admin**: Trigger sabotage
   - ✅ Hear sabotage in both
   - ✅ See modal in war room
9. **Admin**: Reset all
   - ✅ Hear reset in both
   - ✅ See everything clear

### Volume Tests
10. **Both**: Adjust volume sliders
    - ✅ Sounds get quieter/louder
11. **Both**: Click mute
    - ✅ No sounds play
12. **Both**: Click unmute
    - ✅ Sounds resume

---

**All tests passing?** ✅ Sound system fully operational!

**Issues found?** Check [Sound_Effects_Documentation.md](./Sound_Effects_Documentation.md) for troubleshooting.
