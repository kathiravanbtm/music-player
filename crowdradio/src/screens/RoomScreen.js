import React, { useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import AddSongForm from '../components/room/AddSongForm';
import SongList from '../components/SongList';
import YouTubePlayer from '../components/YouTubePlayer';

const RoomScreen = ({ route, navigation }) => {
  const params = route.params || {};
  const roomName = params.roomName || 'Music Room';
  const displayRoomCode = params.numericRoomId || params.roomId || '000000';

  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);

  // Share handler
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my CrowdRadio room! Room code: ${displayRoomCode}`,
        title: 'Join CrowdRadio Room',
      });
    } catch (error) {
      // Optionally handle error
    }
  };

  // Set the Share button in the navigation bar
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'CrowdRadio',
      headerRight: () => (
        <TouchableOpacity onPress={handleShare} style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}>
          <AntDesign name="sharealt" size={22} color="#fff" />
          <Text style={{
            color: '#fff',
            fontSize: 15,
            marginLeft: 5,
            textDecorationLine: 'underline',
            fontWeight: 'bold',
          }}>Share</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, displayRoomCode]);

  // Add song handler
  const handleAddSong = (songUrl) => {
    if (!songUrl) return;
    // Avoid duplicates
    if (songs.find(song => song.url === songUrl)) return;
    const newSong = { url: songUrl };
    setSongs(prev => [...prev, newSong]);
    // If nothing is playing, play the first song added
    if (!currentSong) setCurrentSong(newSong);
  };

  // Song select handler
  const handleSongSelect = (song) => setCurrentSong(song);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{roomName}</Text>
        <Text style={styles.roomId}>Room Code: {displayRoomCode}</Text>
      </View>
      <AddSongForm onAddSong={handleAddSong} />
      <SongList songs={songs} onSongSelect={handleSongSelect} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Now Playing</Text>
        <YouTubePlayer videoUrl={currentSong?.url} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#667eea', padding: 20 },
  header: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  roomId: {
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
});

export default RoomScreen;