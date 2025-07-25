# CrowdRadio 🎵📻

A simple React Native app for hosting a crowd-driven music room. Guests join with a Room ID, suggest songs, vote for the next track, and the host’s device plays the most voted song.

---

## 📌 Features

- Create a unique room ID (host)
- Join an existing room (guests)
- Add song links (YouTube URLs)
- Vote up/down songs in the queue
- Queue automatically reorders by votes
- Host’s app plays the top song
- Real-time updates (Firebase)
- Anonymous or simple username

---

## ⚙️ Tech Stack

- **Frontend:** React Native (Expo)
- **Backend:** Firebase Firestore
- **Music Playback:** YouTube IFrame Player API (WebView for host only)
- **Auth:** Anonymous or simple username

---

## 🚀 Getting Started

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/yourusername/music-player.git
cd crowdradio
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Set up Firebase

- Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/)
- Enable Firestore and copy your config to `src/config/firebase.js`
- Set Firestore rules for development:
  ```
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
  ```

### 4️⃣ Start the App

```bash
expo start
```
- Scan the QR code with Expo Go app on your phone, or run on web.

---

## 🛠️ Planned Implementations

- Snap the "Add Song" input to the top or bottom of the queue
- Add pause/play controls for host
- improve the iframe of it
- Implement voting system and improve song queue UI
- Add password for host to rejoin as host
- Show available rooms to join
- Improve overall UI/UX

---

## 🤝 Contributing

Feel free to open issues or submit pull requests for new features or bug fixes!

---

## 📄 License

MIT
