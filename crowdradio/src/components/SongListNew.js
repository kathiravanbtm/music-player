import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import VotingSystem from './room/VotingSystem';

const SongList = ({ 
  songs, 
  onVote, 
  onRemove, 
  userId, 
  isHost, 
  currentSongId, 
  roomId, 
  isLocalRoom = false 
}) => {
  if (!songs || songs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AntDesign name="playcircleo" size={48} color="#ccc" />
        <Text style={styles.emptyText}>No songs in the queue yet</Text>
        <Text style={styles.emptySubtext}>Add some music to get started!</Text>
      </View>
    );
  }

  // Sort songs by vote score (using improved algorithm)
  const sortedSongs = [...songs].sort((a, b) => {
    // Currently playing song should stay at top if it exists
    if (a.id === currentSongId) return -1;
    if (b.id === currentSongId) return 1;
    
    // Sort by votes (higher first)
    return (b.votes || 0) - (a.votes || 0);
  });

  const renderSongItem = ({ item, index }) => {
    const isPlaying = item.id === currentSongId;
    
    return (
      <View style={[
        styles.songItem,
        isPlaying && styles.currentlyPlaying
      ]}>
        <View style={styles.songInfo}>
          <View style={styles.positionContainer}>
            <Text style={styles.position}>#{index + 1}</Text>
            {isPlaying && (
              <View style={styles.playingIndicator}>
                <AntDesign name="sound" size={12} color="#4CAF50" />
              </View>
            )}
          </View>
          <View style={styles.songDetails}>
            <Text style={styles.songTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.addedBy}>Added by: {item.addedBy}</Text>
            {isPlaying && (
              <Text style={styles.nowPlaying}>Now Playing</Text>
            )}
          </View>
        </View>
        
        <VotingSystem
          song={item}
          userId={userId}
          roomId={roomId}
          isHost={isHost}
          isCurrentlyPlaying={isPlaying}
          isLocalRoom={isLocalRoom}
          onLocalVote={onVote}
        />
      </View>
    );
  };

  return (
    <FlatList
      data={sortedSongs}
      renderItem={renderSongItem}
      keyExtractor={(item) => item.id}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={sortedSongs.length === 0 ? styles.emptyContainer : styles.contentContainer}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentlyPlaying: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  songInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    minWidth: 40,
  },
  position: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  playingIndicator: {
    marginLeft: 4,
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    lineHeight: 20,
  },
  addedBy: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 2,
  },
  nowPlaying: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SongList;
