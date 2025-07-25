# CrowdRadio 🎵📻

A simple React Native app for hosting a crowd-driven music room.
Guests join with a Room ID, suggest songs, vote for the next track,
and the host’s device plays the most voted song.

---

## 📌 Features

- Create a unique room ID (host)
- Join an existing room (guests)
- Add song links (e.g. YouTube URLs)
- Vote up/down songs in the queue
- Queue automatically reorders by votes
- Host’s app plays the top song
- Real-time updates (Firebase or Socket.IO)

---

## ⚙️ Tech Stack

- **Frontend:** React Native (Expo or bare)
- **Backend:** Firebase Realtime Database _(or)_ Node.js + Socket.IO server
- **Music Playback:** YouTube IFrame Player API or WebView player for host only
- **Auth:** Anonymous or simple username (optional)

---

## 🚀 Getting Started

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/yourusername/music-player.git
cd crowdradio
