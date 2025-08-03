import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';

export const roomService = {
  // Generate a random 6-digit room ID
  generateRoomId: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Create a new room in Firestore
  createRoom: async (roomName, userName) => {
    const numericRoomId = roomService.generateRoomId();
    
    const roomRef = await addDoc(collection(db, 'rooms'), {
      name: roomName,
      createdBy: userName,
      createdAt: serverTimestamp(),
      isActive: true,
      currentSong: null,
      numericId: numericRoomId,
      songs: []
    });

    return {
      roomId: roomRef.id,
      numericRoomId,
      roomName,
      userName
    };
  },

  // Share room information
  shareRoom: async (roomCode, roomName) => {
    const shareOptions = {
      message: `Join my CrowdRadio room "${roomName}"! Use room code: ${roomCode}`,
      title: 'Join my CrowdRadio room!',
    };
    
    try {
      const { Share } = require('react-native');
      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing room:', error);
    }
  }
};

export default roomService;
