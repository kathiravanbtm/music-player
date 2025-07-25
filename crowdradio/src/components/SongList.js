import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import VoteButton from './VoteButton.js';

const SongList = ({ songs, roomId, isHost }) => {
  if (!songs || songs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No songs in the queue yet. Add some music!</Text>
      </View>
    );
  }

  const sortedSongs = [...songs].sort((a, b) => b.votes - a.votes);

  const renderSongItem = ({ item, index }) => (
    <View style={styles.songItem}>
      <View style={styles.songInfo}>
        <Text style={styles.position}>#{index + 1}</Text>
        <View style={styles.songDetails}>
          <Text style={styles.songTitle}>{item.title}</Text>
          <Text style={styles.addedBy}>Added by: {item.addedBy}</Text>
        </View>
      </View>
      <View style={styles.songActions}>
        <VoteButton 
          songId={item.id} 
          roomId={roomId} 
          currentVotes={item.votes}
          type="up"
        />
        <Text style={styles.voteCount}>{item.votes}</Text>
        <VoteButton 
          songId={item.id} 
          roomId={roomId} 
          currentVotes={item.votes}
          type="down"
        />
      </View>
    </View>
  );

  return (
    // Using a simple map instead of FlatList to avoid nested scrolling issues
    <View style={styles.list}>
      {sortedSongs.map((item, index) => (
        <View key={item.id}>
          {renderSongItem({ item, index })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
  },
  list: {
    maxHeight: 300,
  },
  songItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 10,
  },
  songInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  position: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginRight: 15,
    minWidth: 30,
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  addedBy: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginHorizontal: 10,
    minWidth: 30,
    textAlign: 'center',
  },
});

export default SongList;
