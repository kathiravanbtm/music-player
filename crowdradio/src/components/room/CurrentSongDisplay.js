import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CurrentSongDisplay = ({ song, isHost }) => {
  if (!song) {
    return (
      <View style={styles.container}>
        <Text style={styles.noSongText}>No song playing</Text>
        <Text style={styles.subtitle}>
          {isHost ? 'Add songs to start playing!' : 'Waiting for songs...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.nowPlaying}>♪ Now Playing</Text>
      <Text style={styles.songTitle}>{song.title}</Text>
      <Text style={styles.addedBy}>Added by: {song.addedBy}</Text>
      <Text style={styles.votes}>Votes: {song.votes || 0}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2c3e50',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  nowPlaying: {
    color: '#3498db',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  songTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  addedBy: {
    color: '#bdc3c7',
    fontSize: 14,
    marginBottom: 4,
  },
  votes: {
    color: '#f39c12',
    fontSize: 14,
    fontWeight: '600',
  },
  noSongText: {
    color: '#bdc3c7',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#95a5a6',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default CurrentSongDisplay;
