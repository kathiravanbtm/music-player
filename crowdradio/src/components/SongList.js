import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

const SongList = ({ songs, onVote, onRemove, userId, isHost, currentSongId }) => {
  if (!songs || songs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No songs in the queue yet. Add some music!</Text>
      </View>
    );
  }

  // Check if the user has already voted for a song
  const hasUserVoted = (song) => song.voters?.includes(userId) || false;

  // Handle voting logic
  const handleVote = (songId, voteType) => {
    if (isHost) {
      Alert.alert('Voting Restricted', 'Hosts cannot vote on songs');
      return;
    }
    if (songId === currentSongId) {
      Alert.alert('Voting Restricted', 'Cannot vote on currently playing song');
      return;
    }
    const song = songs.find(s => s.id === songId);
    if (!song) return;
    if (hasUserVoted(song)) {
      Alert.alert('Already Voted', 'You can only vote once per song');
      return;
    }
    onVote(songId, voteType, userId);
  };

  // Render each song item
  const renderSongItem = (item, index) => {
    const isPlaying = item.id === currentSongId;
    const userHasVoted = hasUserVoted(item);
    return (
      <View key={item.id} style={[
        styles.songItem,
        isPlaying && styles.currentlyPlaying
      ]}>
        <View style={styles.songInfo}>
          <Text style={styles.position}>#{index + 1}</Text>
          <View style={styles.songDetails}>
            <Text style={styles.songTitle} numberOfLines={2}>
              {isPlaying && '▶ '}{item.title}
            </Text>
            <Text style={styles.addedBy}>Added by: {item.addedBy}</Text>
            {isPlaying && (
              <Text style={styles.nowPlaying}>Now Playing</Text>
            )}
          </View>
        </View>
        <View style={styles.songActions}>
          {/* Voting buttons for non-host and not currently playing song */}
          {!isPlaying && !isHost && (
            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  userHasVoted && styles.votedButton
                ]}
                onPress={() => handleVote(item.id, 'up')}
                disabled={userHasVoted}
              >
                <AntDesign 
                  name="like2" 
                  size={16} 
                  color={userHasVoted ? '#aaa' : '#3498db'} 
                />
              </TouchableOpacity>
              <Text style={[
                styles.voteCount,
                item.votes < 0 && styles.negativeVotes
              ]}>
                {item.votes || 0}
              </Text>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  userHasVoted && styles.votedButton
                ]}
                onPress={() => handleVote(item.id, 'down')}
                disabled={userHasVoted}
              >
                <AntDesign 
                  name="dislike2" 
                  size={16} 
                  color={userHasVoted ? '#aaa' : '#e74c3c'} 
                />
              </TouchableOpacity>
            </View>
          )}
          {/* Remove button for host, not for currently playing song */}
          {isHost && !isPlaying && onRemove && (
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
  };

  return (
    <View style={styles.container}>
      {songs.map((item, index) => renderSongItem(item, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  currentlyPlaying: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  songInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  position: {
    width: 30,
    color: '#fff',
    opacity: 0.7,
    fontSize: 14,
  },
  songDetails: {
    flex: 1,
    marginRight: 10,
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  addedBy: {
    color: '#fff',
    opacity: 0.7,
    fontSize: 12,
  },
  nowPlaying: {
    color: '#3498db',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voteButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 4,
  },
  voteButton: {
    padding: 8,
    borderRadius: 16,
  },
  votedButton: {
    opacity: 0.5,
  },
  voteCount: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  negativeVotes: {
    color: '#e74c3c',
  },
  removeButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
  },
});

export default SongList;
