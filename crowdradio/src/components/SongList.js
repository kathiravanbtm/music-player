import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Button from './ui/Button';

const SongList = ({ songs, onVote, onRemove, currentUser, isHost }) => {
  if (!songs || songs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No songs in the queue yet. Add some music!</Text>
      </View>
    );
  }

  // Sort songs by votes (descending) then by time added (ascending)
  const sortedSongs = [...songs].sort((a, b) => {
    if (b.votes !== a.votes) {
      return b.votes - a.votes;
    }
    return new Date(a.addedAt) - new Date(b.addedAt);
  });

  const hasUserVoted = (song) => {
    return song.voters?.includes(currentUser) || false;
  };

  const renderSongItem = (item, index) => (
    <View key={item.id} style={styles.songItem}>
      <View style={styles.songInfo}>
        <Text style={styles.position}>#{index + 1}</Text>
        <View style={styles.songDetails}>
          <Text style={styles.songTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.addedBy}>Added by: {item.addedBy}</Text>
        </View>
      </View>
      
      <View style={styles.songActions}>
        {/* Vote buttons */}
        <TouchableOpacity
          style={[
            styles.voteButton,
            hasUserVoted(item) && styles.votedButton
          ]}
          onPress={() => onVote(item.id, 'up')}
        >
          <AntDesign 
            name="up" 
            size={16} 
            color={hasUserVoted(item) ? '#fff' : '#3498db'} 
          />
        </TouchableOpacity>
        
        <Text style={styles.voteCount}>{item.votes || 0}</Text>
        
        <TouchableOpacity
          style={[
            styles.voteButton,
            hasUserVoted(item) && styles.votedButton
          ]}
          onPress={() => onVote(item.id, 'down')}
        >
          <AntDesign 
            name="down" 
            size={16} 
            color={hasUserVoted(item) ? '#fff' : '#e74c3c'} 
          />
        </TouchableOpacity>

        {/* Remove button for host */}
        {isHost && onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(item.id)}
          >
            <AntDesign name="delete" size={16} color="#e74c3c" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.queueTitle}>Song Queue ({sortedSongs.length})</Text>
      <View style={styles.list}>
        {sortedSongs.map((item, index) => renderSongItem(item, index))}
      </View>
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
