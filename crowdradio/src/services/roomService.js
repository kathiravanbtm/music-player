import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

export const roomService = {
  // Generate a random 6-digit room ID
  generateRoomId: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Create a new room in Firestore
  createRoom: async (roomName, userName, hostPassword) => {
    const numericRoomId = roomService.generateRoomId();
    
    const roomRef = await addDoc(collection(db, 'rooms'), {
      name: roomName,
      createdBy: userName,
      createdAt: serverTimestamp(),
      isActive: true,
      currentSong: null,
      numericId: numericRoomId,
      hostPassword: hostPassword,
      users: [{
        name: userName,
        isHost: true,
        isOnline: true,
        joinedAt: Date.now(),
        lastSeen: Date.now()
      }],
      userCount: 1,
      songs: []
    });

    return {
      roomId: roomRef.id,
      numericRoomId,
      roomName,
      userName
    };
  },

  // Update user presence in room
  updateUserPresence: async (roomId, userName, isOnline = true, isHost = false) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error('Room not found');
      }

      const roomData = roomDoc.data();
      const users = roomData.users || [];
      
      const existingUserIndex = users.findIndex(user => user.name === userName);
      
      if (existingUserIndex !== -1) {
        // Update existing user
        users[existingUserIndex] = {
          ...users[existingUserIndex],
          isOnline,
          isHost: isHost || users[existingUserIndex].isHost, // Preserve host status
          lastSeen: Date.now()
        };
      } else if (isOnline) {
        // Add new user
        users.push({
          name: userName,
          isHost,
          isOnline: true,
          joinedAt: Date.now(),
          lastSeen: Date.now()
        });
      }

      await updateDoc(roomRef, {
        users,
        userCount: users.filter(u => u.isOnline).length
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating user presence:', error);
      return { success: false, error: error.message };
    }
  },

  // Clean up offline users periodically
  cleanupOfflineUsers: async (roomId) => {
    try {
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) return;

      const roomData = roomDoc.data();
      const users = roomData.users || [];
      const now = Date.now();
      const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

      const activeUsers = users.map(user => {
        const isRecentlyActive = (now - user.lastSeen) < OFFLINE_THRESHOLD;
        return {
          ...user,
          isOnline: isRecentlyActive
        };
      });

      await updateDoc(roomRef, {
        users: activeUsers,
        userCount: activeUsers.filter(u => u.isOnline).length
      });

      return { success: true };
    } catch (error) {
      console.error('Error cleaning up offline users:', error);
      return { success: false };
    }
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
