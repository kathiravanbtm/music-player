import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Share, ScrollView } from 'react-native';
import { doc, getDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import SongList from '../components/SongList.js';
import YouTubePlayer from '../components/YouTubePlayer.js';

const RoomScreen = ({ route, navigation }) => {
  const { roomId, roomName = 'Music Room', userName = 'Guest', isHost = false } = route.params || {};
  
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [newSongUrl, setNewSongUrl] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set the room name in the header
    navigation.setOptions({
      title: roomName || 'CrowdRadio Room',
      headerRight: () => (
        <TouchableOpacity style={styles.shareButton} onPress={shareRoom}>
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
      ),
    });

    // Subscribe to room data changes
    const fetchRoomData = async () => {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        const roomDoc = await getDoc(roomRef);
        
        if (!roomDoc.exists()) {
          Alert.alert('Error', 'Room not found');
          navigation.navigate('Join');
          return;
        }
        
        const roomData = roomDoc.data();
        setRoomInfo(roomData);
        
        // If there's a current song playing in the room
        if (roomData.currentSong) {
          setCurrentSong(roomData.currentSong);
        }
        
        // Subscribe to songs collection
        const unsubscribe = onSnapshot(
          collection(db, 'rooms', roomId, 'songs'),
          (snapshot) => {
            const songsList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setSongs(songsList);
            
            // If we're the host and there's no current song playing, play the top voted song
            if (isHost && !roomData.currentSong && songsList.length > 0) {
              const topSong = [...songsList].sort((a, b) => b.votes - a.votes)[0];
              playNextSong(topSong);
            }
            
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching songs: ", error);
            setLoading(false);
          }
        );
        
        // Cleanup subscription on unmount
        return unsubscribe;
      } catch (error) {
        console.error("Error: ", error);
        setLoading(false);
      }
    };
    
    fetchRoomData();
  }, [roomId, navigation, roomName]);

  const addSong = async () => {
    if (!newSongUrl.trim()) {
      Alert.alert('Error', 'Please enter a YouTube URL');
      return;
    }
    
    try {
      // Simple YouTube URL validation
      if (!newSongUrl.includes('youtube.com/') && !newSongUrl.includes('youtu.be/')) {
        Alert.alert('Error', 'Please enter a valid YouTube URL');
        return;
      }
      
      // For now, we'll just extract the video ID and use it as the title
      // In a real app, you'd fetch the actual video title from YouTube API
      const videoId = newSongUrl.includes('v=') 
        ? newSongUrl.split('v=')[1].split('&')[0]
        : newSongUrl.split('/').pop().split('?')[0];
      
      const songTitle = `YouTube Video: ${videoId}`;
      
      await addDoc(collection(db, 'rooms', roomId, 'songs'), {
        title: songTitle,
        url: newSongUrl,
        addedBy: userName,
        votes: 0,
        addedAt: serverTimestamp()
      });
      
      setNewSongUrl('');
    } catch (error) {
      console.error("Error adding song: ", error);
      Alert.alert('Error', 'Failed to add song. Please try again.');
    }
  };

  // Handle when a song finishes playing
  const handleSongEnd = useCallback(async () => {
    if (!isHost) return; // Only the host can control playback
    
    try {
      // Get the current top voted song
      if (songs.length > 0) {
        const topSong = [...songs].sort((a, b) => b.votes - a.votes)[0];
        
        // If the current song is the top song, remove it and play the next one
        if (currentSong && currentSong.id === topSong.id) {
          await deleteDoc(doc(db, 'rooms', roomId, 'songs', topSong.id));
          
          // Play next highest voted song if available
          if (songs.length > 1) {
            const remainingSongs = songs.filter(song => song.id !== topSong.id);
            const nextTopSong = [...remainingSongs].sort((a, b) => b.votes - a.votes)[0];
            playNextSong(nextTopSong);
          } else {
            // No more songs in the queue
            await updateDoc(doc(db, 'rooms', roomId), {
              currentSong: null
            });
            setCurrentSong(null);
          }
        } else {
          // The top voted song has changed, play the new top song
          playNextSong(topSong);
        }
      }
    } catch (error) {
      console.error("Error handling song end:", error);
    }
  }, [songs, currentSong, roomId, isHost]);
  
  // Play the next song in the queue
  const playNextSong = async (song) => {
    if (!isHost || !song) return;
    
    try {
      // Update the room's current song
      await updateDoc(doc(db, 'rooms', roomId), {
        currentSong: {
          id: song.id,
          title: song.title,
          url: song.url,
          addedBy: song.addedBy
        }
      });
      
      setCurrentSong(song);
    } catch (error) {
      console.error("Error playing next song:", error);
      Alert.alert('Error', 'Failed to play the next song');
    }
  };
  
  // Skip current song
  const skipCurrentSong = async () => {
    if (!isHost) return;
    
    try {
      // Remove current song from queue if it exists
      if (currentSong) {
        await deleteDoc(doc(db, 'rooms', roomId, 'songs', currentSong.id));
      }
      
      // Reset current song
      await updateDoc(doc(db, 'rooms', roomId), {
        currentSong: null
      });
      
      setCurrentSong(null);
      
      // Auto-play the next song in the queue
      if (songs.length > 0) {
        const remainingSongs = songs.filter(song => 
          currentSong ? song.id !== currentSong.id : true
        );
        
        if (remainingSongs.length > 0) {
          const nextTopSong = [...remainingSongs].sort((a, b) => b.votes - a.votes)[0];
          playNextSong(nextTopSong);
        }
      }
    } catch (error) {
      console.error("Error skipping song:", error);
      Alert.alert('Error', 'Failed to skip the current song');
    }
  };

  const shareRoom = async () => {
    try {
      const result = await Share.share({
        message: `Join my CrowdRadio room! Room ID: ${roomId}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Something went wrong sharing the room');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading room data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.infoSection}>
          <Text style={styles.roomId}>Room ID: {roomId}</Text>
          <Text style={styles.userInfo}>You are logged in as: {userName}</Text>
          {isHost && <Text style={styles.hostBadge}>Host</Text>}
        </View>

        {/* YouTube Player Section */}
        <View style={styles.playerSection}>
          <Text style={styles.sectionTitle}>
            Now Playing
            {isHost && (
              <TouchableOpacity style={styles.skipButton} onPress={skipCurrentSong}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
          </Text>
          
          {currentSong ? (
            <>
              <YouTubePlayer 
                videoUrl={currentSong.url}
                isHost={isHost}
                onSongEnd={handleSongEnd}
              />
              <View style={styles.nowPlayingInfo}>
                <Text style={styles.nowPlayingTitle}>{currentSong.title}</Text>
                <Text style={styles.nowPlayingAddedBy}>Added by: {currentSong.addedBy}</Text>
              </View>
            </>
          ) : (
            <View style={styles.noSongContainer}>
              <Text style={styles.noSongText}>
                {songs.length > 0 
                  ? 'Ready to play! Vote on songs in the queue below.'
                  : 'No songs in the queue. Add some music to get started!'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.songSection}>
          <Text style={styles.sectionTitle}>Song Queue</Text>
          <SongList songs={songs} roomId={roomId} isHost={isHost} />
        </View>
        
        <View style={styles.addSongSection}>
          <Text style={styles.sectionTitle}>Add a Song</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste YouTube URL"
            value={newSongUrl}
            onChangeText={setNewSongUrl}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={addSong}>
            <Text style={styles.buttonText}>Add to Queue</Text>
          </TouchableOpacity>
        </View>

        {isHost && (
          <View style={styles.hostSection}>
            <Text style={styles.sectionTitle}>Host Controls</Text>
            <Text style={styles.infoText}>
              As the host, you control the music playback. In a full version, controls
              to skip songs and adjust volume would appear here.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#667eea',
  },
  infoSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  roomId: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  userInfo: {
    color: '#fff',
    fontSize: 14,
  },
  hostBadge: {
    color: '#fff',
    backgroundColor: '#ff5722',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 15,
    marginTop: 5,
    fontWeight: 'bold',
  },
  playerSection: {
    marginBottom: 20,
  },
  nowPlayingInfo: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    marginTop: 8,
  },
  nowPlayingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nowPlayingAddedBy: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 5,
  },
  noSongContainer: {
    height: 220,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noSongText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  skipButton: {
    backgroundColor: '#FF5722',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 10,
  },
  skipButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  songSection: {
    marginBottom: 20,
  },
  addSongSection: {
    marginBottom: 20,
  },
  hostSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
  },
  shareButton: {
    marginRight: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default RoomScreen;