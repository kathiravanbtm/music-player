import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const VotingSystem = ({ 
  song, 
  userId, 
  roomId, 
  isHost, 
  isCurrentlyPlaying = false, 
  isLocalRoom = false,
  onLocalVote 
}) => {
  const [isVoting, setIsVoting] = useState(false);

  // Check if user has voted on this song
  const userVote = song.voters?.find(voter => voter.userId === userId);
  const hasUpvoted = userVote?.voteType === 'up';
  const hasDownvoted = userVote?.voteType === 'down';

  // Simple vote calculation: +1 for each upvote, -1 for each downvote
  const calculateVoteScore = (votes) => {
    if (!votes || votes.length === 0) return 0;
    
    const upvotes = votes.filter(v => v.voteType === 'up').length;
    const downvotes = votes.filter(v => v.voteType === 'down').length;
    
    return upvotes - downvotes; // Simple +1/-1 system
  };

  const handleVote = async (voteType) => {
    if (isVoting || isHost) return; // Removed isCurrentlyPlaying restriction
    
    setIsVoting(true);
    
    try {
      const currentVoters = song.voters || [];
      let newVoters;
      let action;

      // Check if user is changing their vote or removing it
      if (userVote) {
        if (userVote.voteType === voteType) {
          // Remove vote
          newVoters = currentVoters.filter(voter => voter.userId !== userId);
          action = 'removed';
        } else {
          // Change vote
          newVoters = currentVoters.map(voter => 
            voter.userId === userId 
              ? { ...voter, voteType, timestamp: Date.now() }
              : voter
          );
          action = 'changed';
        }
      } else {
        // Add new vote
        newVoters = [...currentVoters, {
          userId,
          voteType,
          timestamp: Date.now()
        }];
        action = 'added';
      }

      // Calculate new score
      const newScore = calculateVoteScore(newVoters);

      if (isLocalRoom && onLocalVote) {
        // Handle local voting
        onLocalVote(song.id, newVoters, newScore);
      } else {
        // Update Firebase
        const songRef = doc(db, 'rooms', roomId, 'songs', song.id);
        await updateDoc(songRef, {
          voters: newVoters,
          votes: newScore,
          lastVoteUpdate: Date.now()
        });
      }

      // Optional: Show feedback
      if (action === 'removed') {
        // Subtle feedback for vote removal
      } else {
        // Subtle feedback for vote add/change
      }

    } catch (error) {
      console.error('Voting error:', error);
      Alert.alert('Error', 'Failed to register vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  // Don't show voting if user is host, but allow voting on all songs including currently playing ones
  if (isHost) {
    return (
      <View style={styles.voteContainer}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>{calculateVoteScore(song.voters)}</Text>
          <Text style={styles.scoreLabel}>votes</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.voteContainer}>
      <TouchableOpacity
        style={[
          styles.voteButton,
          styles.upvoteButton,
          hasUpvoted && styles.upvoteActive,
          isVoting && styles.disabled
        ]}
        onPress={() => handleVote('up')}
        disabled={isVoting}
      >
        <AntDesign 
          name="up" 
          size={16} 
          color={hasUpvoted ? '#fff' : '#4CAF50'} 
        />
      </TouchableOpacity>

      <View style={styles.scoreContainer}>
        <Text style={[
          styles.scoreText,
          calculateVoteScore(song.voters) > 0 && styles.positiveScore,
          calculateVoteScore(song.voters) < 0 && styles.negativeScore
        ]}>
          {calculateVoteScore(song.voters)}
        </Text>
        <Text style={styles.scoreLabel}>votes</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.voteButton,
          styles.downvoteButton,
          hasDownvoted && styles.downvoteActive,
          isVoting && styles.disabled
        ]}
        onPress={() => handleVote('down')}
        disabled={isVoting}
      >
        <AntDesign 
          name="down" 
          size={16} 
          color={hasDownvoted ? '#fff' : '#f44336'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  voteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  voteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginVertical: 2,
  },
  upvoteButton: {
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
  },
  upvoteActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  downvoteButton: {
    borderColor: '#f44336',
    backgroundColor: 'transparent',
  },
  downvoteActive: {
    backgroundColor: '#f44336',
    borderColor: '#f44336',
  },
  disabled: {
    opacity: 0.5,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 32,
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  positiveScore: {
    color: '#4CAF50',
  },
  negativeScore: {
    color: '#f44336',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
});

export default VotingSystem;
