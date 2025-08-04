import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Share, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { doc, getDoc, collection, onSnapshot, addDoc, updateDoc, deleteDoc, arrayUnion, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { AntDesign } from '@expo/vector-icons';
import SongList from '../components/SongList.js';
import YouTubePlayer from '../components/YouTubePlayer.js';
import UserManagement from '../components/room/UserManagement.js';
import roomService from '../services/roomService.js';
import { useFocusEffect } from '@react-navigation/native';

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

// Helper function to sort songs by votes with timestamp tiebreaker
const sortSongsByPriority = (songs) => {
  return [...songs].sort((a, b) => {
    const voteScoreA = a.votes || 0;
    const voteScoreB = b.votes || 0;
    
    // Sort by votes first (higher first)
    if (voteScoreA !== voteScoreB) {
      return voteScoreB - voteScoreA;
    }
    
    // If votes are equal, sort by timestamp (earlier added songs get priority)
    const timestampA = new Date(a.addedAt || 0).getTime();
    const timestampB = new Date(b.addedAt || 0).getTime();
    
    return timestampA - timestampB;
  });
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
  const [addingSong, setAddingSong] = useState(false); // For preventing duplicate song additions
  
  const [isHostAuthenticated, setIsHostAuthenticated] = useState(isHost);
  
  // User presence management
  const [userPresenceInterval, setUserPresenceInterval] = useState(null);

  useEffect(() => {
    // Set the room name in the header
    navigation.setOptions({
      title: roomName || 'CrowdRadio Room',
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <UserManagement 
            roomId={roomId}
            isHost={isHost}
            isHostAuthenticated={isHostAuthenticated}
            currentUser={userName}
            isLocalRoom={isLocalRoom}
          />
          <TouchableOpacity style={styles.shareButton} onPress={shareRoom}>
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      ),
    });

    // Update user presence when joining
    if (!isLocalRoom && roomId) {
      roomService.updateUserPresence(roomId, userName, true, isHost);
      
      // Set up periodic presence updates
      const interval = setInterval(() => {
        roomService.updateUserPresence(roomId, userName, true, isHostAuthenticated && isHost);
      }, 30000); // Update every 30 seconds
      
      setUserPresenceInterval(interval);
    }

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
              const topSong = sortSongsByPriority(songsList)[0];
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
    
    // Cleanup function
    return () => {
      if (userPresenceInterval) {
        clearInterval(userPresenceInterval);
      }
      // Mark user as offline when leaving
      if (!isLocalRoom && roomId) {
        roomService.updateUserPresence(roomId, userName, false, isHost);
      }
    };
  }, [roomId, navigation, roomName, isLocalRoom, userName, isHost, isHostAuthenticated]);

  const addSong = async (songUrl = newSongUrl) => {
    if (!songUrl.trim()) {
      Alert.alert('Error', 'Please enter a YouTube URL');
      return;
    }
    
    // Prevent multiple submissions
    if (addingSong) {
      return;
    }
    
    setAddingSong(true);
    
    try {
      // Simple YouTube URL validation
      if (!songUrl.includes('youtube.com/') && !songUrl.includes('youtu.be/')) {
        Alert.alert('Error', 'Please enter a valid YouTube URL');
        return;
      }
      
      // Extract the video ID using our helper function
      const videoId = getYouTubeVideoId(songUrl);
      
      if (!videoId) {
        Alert.alert('Error', 'Invalid YouTube URL');
        return;
      }

      // Check for duplicates
      const isDuplicate = songs.some(song => 
        song.videoId === videoId || song.url === songUrl
      );
      
      if (isDuplicate) {
        Alert.alert('Duplicate Song', 'This song is already in the queue');
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
      
      // Create song object with new voting structure
      const newSong = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        title: finalTitle,
        url: songUrl,
        videoId: videoId,
        addedBy: userName,
        votes: 0,
        voters: [], // Array of objects: { userId, voteType, timestamp }
        addedAt: new Date().toISOString(),
        lastVoteUpdate: Date.now()
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
            url: songUrl,
            videoId: videoId,
            addedBy: userName,
            votes: 0,
            voters: [], // New voting structure
            addedAt: serverTimestamp(),
            lastVoteUpdate: Date.now()
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
    } finally {
      setAddingSong(false);
    }
  };

  // Handle when a song finishes playing
  const handleSongEnd = useCallback(async () => {
    if (!isHostAuthenticated || !isHost) return; // Only authenticated host can control playback
    
    try {
      // Get the current top voted song with priority ordering
      if (songs.length > 0) {
        const topSong = sortSongsByPriority(songs)[0];
        
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
          
          // Play next highest voted song if available with priority ordering
          if (songs.length > 1) {
            const remainingSongs = songs.filter(song => song.id !== topSong.id);
            const nextTopSong = sortSongsByPriority(remainingSongs)[0];
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
          // The top voted song has changed, play the new top song with priority ordering
          playNextSong(topSong);
        }
      }
    } catch (error) {
      console.error("Error handling song end:", error);
      // Continue playback even if there's an error
      if (songs.length > 0) {
        const topSong = sortSongsByPriority(songs)[0];
        playNextSong(topSong);
      }
    }
  }, [songs, currentSong, roomId, isHostAuthenticated, isHost, isLocalRoom]);
  
  // Play the next song in the queue
  const playNextSong = async (song) => {
    if (!isHostAuthenticated || !isHost || !song) return;
    
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
    if (!isHostAuthenticated || !isHost) return;
    
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
      
      // Auto-play the next song in the queue with priority ordering
      if (remainingSongs.length > 0) {
        const nextTopSong = sortSongsByPriority(remainingSongs)[0];
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
          const nextTopSong = sortSongsByPriority(remainingSongs)[0];
          playNextSong(nextTopSong);
        }
      }
    }
  };

  // Confirm before leaving the room
  useFocusEffect(
    React.useCallback(() => {
      const onBeforeRemove = (e) => {
        e.preventDefault();
        Alert.alert(
          'Leave Room?',
          'Do you want to leave the room?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
          ]
        );
      };
      navigation.addListener('beforeRemove', onBeforeRemove);
      return () => navigation.removeListener('beforeRemove', onBeforeRemove);
    }, [navigation])
  );

  // Improved voting logic with new algorithm
  const handleVote = async (songId, newVoters, newScore) => {
    if (isHostAuthenticated && isHost) return; // Host cannot vote
    
    // Update local state immediately for responsive UI
    const updatedSongs = songs.map(song =>
      song.id === songId
        ? { ...song, voters: newVoters, votes: newScore, lastVoteUpdate: Date.now() }
        : song
    );
    setSongs(updatedSongs);
    
    // Note: Firebase update is handled by VotingSystem component
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#667eea' }}>
        <SongList 
          songs={songs} 
          roomId={roomId} 
          isHost={isHostAuthenticated && isHost} 
          userId={userName}
          currentSongId={currentSong?.id}
          onVote={handleVote}
          isLocalRoom={isLocalRoom}
          // Pass all the additional content as header components
          ListHeaderComponent={() => (
            <View style={{ padding: 20 }}>
              {/* Room Details */}
              <View style={styles.infoSection}>
                <Text style={styles.roomId}>Room Code: {numericRoomId}</Text>
                <Text style={styles.userInfo}>You are logged in as: {userName}</Text>
                {isHostAuthenticated && isHost && <Text style={styles.hostBadge}>Host</Text>}
              </View>
              
              {/* YouTube Music Player (host only) */}
              {isHostAuthenticated && isHost && (
                <View style={styles.playerSection}>
                  <Text style={styles.sectionTitle}>Now Playing</Text>
                  {currentSong ? (
                    <YouTubePlayer
                      videoUrl={currentSong.url}
                      isHost={isHost}
                      onSongEnd={handleSongEnd}
                    />
                  ) : (
                    <View style={styles.noSongContainer}>
                      <AntDesign name="playcircleo" size={36} color="#fff" style={{ marginBottom: 10 }} />
                      <Text style={styles.noSongText}>No songs in the queue. Add some music to get started!</Text>
                    </View>
                  )}
                </View>
              )}
              
              {/* Song Input Box */}
              <View style={styles.addSongContainer}>
                <TextInput
                  style={[styles.input, addingSong && styles.disabledInput]}
                  placeholder="Paste YouTube URL"
                  placeholderTextColor="#999"
                  value={newSongUrl}
                  onChangeText={setNewSongUrl}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  editable={!addingSong}
                  onSubmitEditing={() => {
                    if (newSongUrl.trim() && !addingSong) addSong();
                  }}
                />
                <TouchableOpacity
                  style={[styles.primaryButton, (!newSongUrl.trim() || addingSong) && styles.disabledButton]}
                  onPress={() => {
                    if (newSongUrl.trim() && !addingSong) addSong();
                  }}
                  disabled={!newSongUrl.trim() || addingSong}
                >
                  {addingSong ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Song Queue Header */}
              <Text style={styles.sectionTitle}>Song Queue</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  hostControls: {
    marginTop: 10,
  },
  hostLoginOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  hostButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  hostButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
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
  keyboardContainer: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  addSongBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#667eea',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addSongContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
});

export default RoomScreen;