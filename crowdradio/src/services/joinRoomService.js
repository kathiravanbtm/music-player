import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import roomService from './roomService.js';

export const joinRoomService = {
  // Find and join a room by numeric ID
  findAndJoinRoom: async (roomCode, userName) => {
    try {
      // Try to find the room using the numeric ID
      const roomsQuery = query(
        collection(db, 'rooms'), 
        where('numericId', '==', roomCode),
        where('isActive', '==', true)
      );
      
      const roomSnapshot = await getDocs(roomsQuery);
      
      if (!roomSnapshot.empty) {
        // Room found in Firebase and is active
        const roomDoc = roomSnapshot.docs[0];
        const roomData = roomDoc.data();
        
        // Update user presence when joining
        await roomService.updateUserPresence(roomDoc.id, userName, true, false);
        
        return {
          success: true,
          roomId: roomDoc.id,
          roomName: roomData.name,
          userName,
          isHost: false,
          isLocalRoom: false,
          numericRoomId: roomCode,
          roomData
        };
      } else {
        // Room not found or not active
        return {
          success: false,
          error: 'No active room found with this code. Please check the room code or ask the host to create a new room.'
        };
      }
    } catch (error) {
      console.error('Database error:', error);
      
      // Return error instead of creating fallback room
      return {
        success: false,
        error: 'Unable to connect to the room. Please check your internet connection and try again.'
      };
    }
  },

  // Join room as host (reconnection)
  joinAsHost: async (roomCode, userName, hostPassword) => {
    try {
      const roomsQuery = query(
        collection(db, 'rooms'), 
        where('numericId', '==', roomCode),
        where('isActive', '==', true)
      );
      
      const roomSnapshot = await getDocs(roomsQuery);
      
      if (!roomSnapshot.empty) {
        const roomDoc = roomSnapshot.docs[0];
        const roomData = roomDoc.data();
        
        // Verify host password
        if (roomData.hostPassword !== hostPassword) {
          return {
            success: false,
            error: 'Invalid host password.'
          };
        }
        
        // Update user presence as host
        await roomService.updateUserPresence(roomDoc.id, userName, true, true);
        
        return {
          success: true,
          roomId: roomDoc.id,
          roomName: roomData.name,
          userName,
          isHost: true,
          isLocalRoom: false,
          numericRoomId: roomCode,
          roomData
        };
      } else {
        return {
          success: false,
          error: 'Room not found or inactive.'
        };
      }
    } catch (error) {
      console.error('Host join error:', error);
      return {
        success: false,
        error: 'Failed to join as host. Please try again.'
      };
    }
  }
};

export default joinRoomService;
