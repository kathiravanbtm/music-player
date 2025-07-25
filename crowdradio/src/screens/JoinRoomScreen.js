import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const JoinRoomScreen = ({ navigation }) => {
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const joinRoom = async () => {
    if (!roomId.trim()) {
      Alert.alert('Error', 'Please enter a Room ID');
      return;
    }
    
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if room exists
      const roomRef = doc(db, 'rooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        Alert.alert('Error', 'Room not found. Please check the Room ID and try again.');
        setIsLoading(false);
        return;
      }
      
      // Room exists, navigate to it
      setIsLoading(false);
      navigation.navigate('Room', { 
        roomId, 
        roomName: roomDoc.data().name,
        userName: userName,
        isHost: false 
      });
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Failed to join room. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Room</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Room ID"
        value={roomId}
        onChangeText={setRoomId}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={userName}
        onChangeText={setUserName}
      />
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#fff" style={styles.loader} />
      ) : (
        <TouchableOpacity style={styles.primaryButton} onPress={joinRoom}>
          <Text style={styles.buttonText}>Join Room</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => navigation.navigate('Create')}
      >
        <Text style={styles.secondaryButtonText}>Create Room Instead</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#667eea',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  loader: {
    marginVertical: 15,
  },
});

export default JoinRoomScreen;
