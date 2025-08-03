import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase.js';

export const useRoomData = (roomId, isLocalRoom = false) => {
  const [roomInfo, setRoomInfo] = useState(null);
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isLocalRoom) {
      // For local rooms, just set up basic info
      setRoomInfo({
        name: 'Local Room',
        createdBy: 'Local User',
        isActive: true
      });
      setLoading(false);
      return;
    }

    if (!roomId) {
      setError('No room ID provided');
      setLoading(false);
      return;
    }

    // Subscribe to room data changes
    const roomRef = doc(db, 'rooms', roomId);
    
    const unsubscribe = onSnapshot(
      roomRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setRoomInfo(data);
          setSongs(data.songs || []);
          setCurrentSong(data.currentSong || null);
          setError(null);
        } else {
          setError('Room not found');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching room data:', err);
        setError('Failed to load room data');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId, isLocalRoom]);

  return {
    roomInfo,
    songs,
    currentSong,
    loading,
    error,
    setSongs, // For local room management
    setCurrentSong // For local room management
  };
};

export default useRoomData;
