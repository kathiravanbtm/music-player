import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Share, ScrollView, ActivityIndicator } from 'react-native';
import { doc, getDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { AntDesign } from '@expo/vector-icons';
import SongList from '../components/SongList.js';
import YouTubePlayer from '../components/YouTubePlayer.js';

// Helper function to extract video ID from YouTube URL
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  let videoId = null;
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1];
    const ampersandPosition = videoId.indexOf('&');
    if (ampersandPosition !== -1) {
      videoId = videoId.substring(0, ampersandPosition);
    }
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1];
    const questionMarkPosition = videoId.indexOf('?');
    if (questionMarkPosition !== -1) {
      videoId = videoId.substring(0, questionMarkPosition);
    }
  }
  
  return videoId;
};

// Function to fetch YouTube video title (can be replaced with a proper API call in production)
const fetchVideoTitle = async (videoId) => {
  try {
    // In a real app, you would use YouTube Data API
    // For now, we'll make a basic fetch request to get the title from the oEmbed endpoint
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (response.ok) {
      const data = await response.json();
      return data.title;
    }
    return null;
  } catch (error) {
    console.error('Error fetching video title:', error);
    return null;
  }
};

const RoomScreen = ({ route, navigation }) => {
  const { 
    roomId, 
    roomName = 'Music Room', 
    userName = 'Guest', 
    isHost = false,
    isLocalRoom = false, // Whether this is a local-only room (offline mode)
    numericRoomId = '000000'
  } = route.params || {};
  
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [newSongUrl, setNewSongUrl] = useState('');
  const [roomInfo, setRoomInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [localSongs, setLocalSongs] = useState([]); // For local-only mode

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

    // If in local mode, just set up local state
    if (isLocalRoom) {
      setRoomInfo({
        name: roomName,
        createdBy: userName,
        numericId: numericRoomId,
        isActive: true
      });
      setLoading(false);
      return;
    }

    // Subscribe to room data changes (Firebase mode)
    const fetchRoomData = async () => {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        let roomDoc;
        
        try {
          roomDoc = await getDoc(roomRef);
          
          if (!roomDoc.exists()) {
            console.log('Room not found, switching to local mode');
            setRoomInfo({
              name: roomName,
              createdBy: userName,
              numericId: numericRoomId,
              isActive: true
            });
            setLoading(false);
            return;
          }
        } catch (fbError) {
          console.log('Firebase error, using local mode:', fbError);
          setRoomInfo({
            name: roomName,
            createdBy: userName,
            numericId: numericRoomId,
            isActive: true
          });
          setLoading(false);
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
      
      // Extract the video ID using our helper function
      const videoId = getYouTubeVideoId(newSongUrl);
      
      if (!videoId) {
        Alert.alert('Error', 'Invalid YouTube URL');
        return;
      }
      
      const songTitle = `YouTube Video: ${videoId}`;
      
      // Try to fetch the title, but don't block on it
      let finalTitle = songTitle;
      try {
        const fetchedTitle = await fetchVideoTitle(videoId);
        if (fetchedTitle) {
          finalTitle = fetchedTitle;
        }
      } catch (titleError) {
        console.log('Error fetching title:', titleError);
      }
      
      // Create song object
      const newSong = {
        id: Date.now().toString(), // Local ID
        title: finalTitle,
        url: newSongUrl,
        videoId: videoId,
        addedBy: userName,
        votes: 0,
        addedAt: new Date().toISOString()
      };
      
      // If local mode, use local state
      if (isLocalRoom) {
        setLocalSongs(prev => [...prev, newSong]);
        setSongs(prev => [...prev, newSong]);
      } else {
        // Try to add to Firebase
        try {
          await addDoc(collection(db, 'rooms', roomId, 'songs'), {
            title: finalTitle,
            url: newSongUrl,
            videoId: videoId,
            addedBy: userName,
            votes: 0,
            addedAt: serverTimestamp()
          });
        } catch (fbError) {
          console.error('Firebase error, using local mode:', fbError);
          // Fall back to local state
          setLocalSongs(prev => [...prev, newSong]);
          setSongs(prev => [...prev, newSong]);
        }
      }
      
      setNewSongUrl('');
    } catch (error) {
      console.error("Error adding song:", error);
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
          // Remove from local state first (works in both modes)
          const updatedSongs = songs.filter(song => song.id !== topSong.id);
          setSongs(updatedSongs);
          
          // Also update Firebase if we're not in local mode
          if (!isLocalRoom) {
            try {
              await deleteDoc(doc(db, 'rooms', roomId, 'songs', topSong.id));
            } catch (fbError) {
              console.log('Firebase delete error, continuing with local state:', fbError);
            }
          }
          
          // Play next highest voted song if available
          if (songs.length > 1) {
            const remainingSongs = songs.filter(song => song.id !== topSong.id);
            const nextTopSong = [...remainingSongs].sort((a, b) => b.votes - a.votes)[0];
            playNextSong(nextTopSong);
          } else {
            // No more songs in the queue
            setCurrentSong(null);
            
            // Update Firebase if not in local mode
            if (!isLocalRoom) {
              try {
                await updateDoc(doc(db, 'rooms', roomId), {
                  currentSong: null
                });
              } catch (fbError) {
                console.log('Firebase update error:', fbError);
              }
            }
          }
        } else {
          // The top voted song has changed, play the new top song
          playNextSong(topSong);
        }
      }
    } catch (error) {
      console.error("Error handling song end:", error);
      // Continue playback even if there's an error
      if (songs.length > 0) {
        const topSong = [...songs].sort((a, b) => b.votes - a.votes)[0];
        playNextSong(topSong);
      }
    }
  }, [songs, currentSong, roomId, isHost, isLocalRoom]);
  
  // Play the next song in the queue
  const playNextSong = async (song) => {
    if (!isHost || !song) return;
    
    try {
      // Always update local state
      setCurrentSong(song);
      
      // Update Firebase if not in local mode
      if (!isLocalRoom) {
        try {
          await updateDoc(doc(db, 'rooms', roomId), {
            currentSong: {
              id: song.id,
              title: song.title,
              url: song.url,
              addedBy: song.addedBy
            }
          });
        } catch (fbError) {
          console.log('Firebase update error (continuing with local playback):', fbError);
          // Continue with local playback even if Firebase update fails
        }
      }
    } catch (error) {
      console.error("Error playing next song:", error);
      // Still try to play the song locally even if there's an error
      setCurrentSong(song);
    }
  };
  
  // Skip current song
  const skipCurrentSong = async () => {
    if (!isHost) return;
    
    try {
      // Always update local state first
      let remainingSongs = [...songs];
      
      // Remove current song from queue if it exists
      if (currentSong) {
        remainingSongs = songs.filter(song => song.id !== currentSong.id);
        setSongs(remainingSongs);
        
        // Update Firebase if not in local mode
        if (!isLocalRoom) {
          try {
            await deleteDoc(doc(db, 'rooms', roomId, 'songs', currentSong.id));
          } catch (fbError) {
            console.log('Firebase delete error (continuing with local skip):', fbError);
          }
        }
      }
      
      // Reset current song in local state
      setCurrentSong(null);
      
      // Update Firebase if not in local mode
      if (!isLocalRoom) {
        try {
          await updateDoc(doc(db, 'rooms', roomId), {
            currentSong: null
          });
        } catch (fbError) {
          console.log('Firebase update error:', fbError);
        }
      }
      
      // Auto-play the next song in the queue
      if (remainingSongs.length > 0) {
        const nextTopSong = [...remainingSongs].sort((a, b) => b.votes - a.votes)[0];
        playNextSong(nextTopSong);
      }
    } catch (error) {
      console.error("Error skipping song:", error);
      // Even if there's an error, try to continue with local state
      setCurrentSong(null);
      
      if (songs.length > 0) {
        const remainingSongs = songs.filter(song => 
          currentSong ? song.id !== currentSong.id : true
        );
        
        if (remainingSongs.length > 0) {
          const nextTopSong = [...remainingSongs].sort((a, b) => b.votes - a.votes)[0];
          playNextSong(nextTopSong);
        }
      }
    }
  };

  const shareRoom = async () => {
    try {
      const numericId = route.params.numericRoomId || "N/A";
      const result = await Share.share({
        message: `Join my CrowdRadio room! Enter this code: ${numericId}`,
        title: 'Join CrowdRadio Room'
      });
    } catch (error) {
      // If sharing fails, show the room code in an alert so they can copy manually
      Alert.alert('Share Room', `Your room code is: ${route.params.numericRoomId || "N/A"}\n\nShare this code with friends to let them join your room.`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading room data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContentContainer}>
      <View style={styles.container}>
        <View style={styles.infoSection}>
          <Text style={styles.roomId}>Room Code: {route.params.numericRoomId || "N/A"}</Text>
          <Text style={styles.userInfo}>You are logged in as: {userName}</Text>
          {isHost && <Text style={styles.hostBadge}>Host</Text>}
        </View>

        {/* Audio Player Section */}
        <View style={styles.playerSection}>
          <View style={styles.playerHeader}>
            <Text style={styles.sectionTitle}>Now Playing</Text>
            {isHost && currentSong && (
              <TouchableOpacity style={styles.skipButton} onPress={skipCurrentSong}>
                <AntDesign name="stepforward" size={14} color="#fff" />
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {currentSong ? (
            <>
              <View style={styles.nowPlayingInfo}>
                <Text style={styles.nowPlayingTitle}>{currentSong.title}</Text>
                <Text style={styles.nowPlayingAddedBy}>Added by: {currentSong.addedBy}</Text>
              </View>
              
              <YouTubePlayer 
                videoUrl={currentSong.url}
                isHost={isHost}
                onSongEnd={handleSongEnd}
              />
            </>
          ) : (
            <View style={styles.noSongContainer}>
              <AntDesign name="playcircleo" size={36} color="#fff" style={{marginBottom: 10}} />
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
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 30, // Add extra bottom padding to ensure content is visible
  },
  container: {
    padding: 20,
    backgroundColor: '#667eea',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#667eea',
    padding: 20,
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
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 15,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  nowPlayingInfo: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    marginBottom: 10,
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
    height: 150,
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
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
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