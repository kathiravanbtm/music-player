import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

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
  }
};

export default joinRoomService;
