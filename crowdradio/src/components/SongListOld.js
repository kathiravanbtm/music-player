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
                  userHasVoted && styles.votedButton
                ]}
                onPress={() => handleVote(item.id, 'down')}
              >
                <AntDesign 
                  name="dislike2" 
                  size={16} 
                  color={userHasVoted ? '#e74c3c' : '#aaa'} 
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
