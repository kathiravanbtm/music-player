import { doc, collection, addDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { getYouTubeVideoId, fetchVideoTitle } from '../utils/youtubeHelpers.js';

export const songService = {
  // Add a new song to the room
  addSong: async (roomId, songUrl, userName, isLocalRoom = false, existingSongs = []) => {
    const videoId = getYouTubeVideoId(songUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Check for duplicates
    const isDuplicate = existingSongs.some(song => 
      song.videoId === videoId || song.url === songUrl
    );
    
    if (isDuplicate) {
      throw new Error('This song is already in the queue');
    }

    // Try to fetch video title
    let title = await fetchVideoTitle(videoId);
    if (!title) {
      title = `YouTube Video (${videoId})`;
    }

    const newSong = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9), // More unique ID
      url: songUrl,
      videoId,
      title,
      addedBy: userName,
      votes: 0,
      voters: [],
      addedAt: new Date().toISOString()
    };

    if (isLocalRoom) {
      return newSong; // Return the song for local state management
    } else {
      // Add to Firebase
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        songs: arrayUnion(newSong),
        updatedAt: serverTimestamp()
      });
      return newSong;
    }
  },

  // Vote on a song
  voteSong: async (roomId, songId, userName, voteType, currentSongs, isLocalRoom = false) => {
    const updatedSongs = currentSongs.map(song => {
      if (song.id === songId) {
        const hasVoted = song.voters?.includes(userName);
        let newVotes = song.votes || 0;
        let newVoters = song.voters || [];

        if (hasVoted) {
          // User already voted, remove their vote
          newVoters = newVoters.filter(voter => voter !== userName);
          newVotes = Math.max(0, newVotes - 1);
        } else {
          // User hasn't voted, add their vote
          newVoters = [...newVoters, userName];
          newVotes = voteType === 'up' ? newVotes + 1 : Math.max(0, newVotes - 1);
        }

        return {
          ...song,
          votes: newVotes,
          voters: newVoters
        };
      }
      return song;
    });

    if (isLocalRoom) {
      return updatedSongs; // Return updated songs for local state
    } else {
      // Update in Firebase
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        songs: updatedSongs,
        updatedAt: serverTimestamp()
      });
      return updatedSongs;
    }
  },

  // Remove a song from the queue
  removeSong: async (roomId, songId, currentSongs, isLocalRoom = false) => {
    const updatedSongs = currentSongs.filter(song => song.id !== songId);

    if (isLocalRoom) {
      return updatedSongs;
    } else {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        songs: updatedSongs,
        updatedAt: serverTimestamp()
      });
      return updatedSongs;
    }
  },

  // Get the next song to play (highest voted with timestamp tiebreaker)
  getNextSong: (songs) => {
    if (!songs || songs.length === 0) return null;
    
    // Sort by votes (descending) and then by time added (ascending) for priority
    const sortedSongs = [...songs].sort((a, b) => {
      const voteScoreA = a.votes || 0;
      const voteScoreB = b.votes || 0;
      
      if (voteScoreA !== voteScoreB) {
        return voteScoreB - voteScoreA;
      }
      
      // If votes are equal, sort by timestamp (earlier added songs get priority)
      const timestampA = new Date(a.addedAt || 0).getTime();
      const timestampB = new Date(b.addedAt || 0).getTime();
      
      return timestampA - timestampB;
    });

    return sortedSongs[0];
  },

  // Update current playing song
  setCurrentSong: async (roomId, song, isLocalRoom = false) => {
    if (isLocalRoom) {
      return song;
    } else {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        currentSong: song,
        updatedAt: serverTimestamp()
      });
      return song;
    }
  }
};

export default songService;
