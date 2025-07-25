import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { AntDesign } from '@expo/vector-icons';

const VoteButton = ({ songId, roomId, currentVotes, type }) => {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async () => {
    if (isVoting) return; // Prevent multiple rapid clicks
    
    setIsVoting(true);
    
    try {
      const songRef = doc(db, 'rooms', roomId, 'songs', songId);
      
      // Increment or decrement the vote count
      const voteChange = type === 'up' ? 1 : -1;
      
      // Prevent negative votes (optional feature)
      if (type === 'down' && currentVotes <= 0) {
        setIsVoting(false);
        return;
      }
      
      await updateDoc(songRef, {
        votes: increment(voteChange)
      });
      
    } catch (error) {
      console.error('Error voting:', error);
      Alert.alert('Error', 'Failed to register vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        type === 'up' ? styles.upVoteButton : styles.downVoteButton,
        isVoting && styles.disabledButton
      ]} 
      onPress={handleVote}
      disabled={isVoting}
    >
      <AntDesign 
        name={type === 'up' ? 'caretup' : 'caretdown'} 
        size={16} 
        color="#fff" 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  upVoteButton: {
    backgroundColor: '#4CAF50',
  },
  downVoteButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    opacity: 0.5,
  }
});

export default VoteButton;