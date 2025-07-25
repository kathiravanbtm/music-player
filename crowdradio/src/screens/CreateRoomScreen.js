import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const CreateRoomScreen = ({ navigation }) => {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Generate a random 6-digit room ID
  const generateRoomId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const createRoom = async () => {
    if (!roomName.trim() || !userName.trim()) {
      Alert.alert('Error', 'Please enter both room name and your name');
      return;
    }

    setIsLoading(true);
    try {
      // Generate a numeric room ID
      const numericRoomId = generateRoomId();
      
      // Create a new room in Firestore using the numeric ID
      const roomRef = await addDoc(collection(db, 'rooms'), {
        name: roomName,
        createdBy: userName,
        createdAt: serverTimestamp(),
        isActive: true,
        currentSong: null,
        numericId: numericRoomId, // Add the numeric ID field
        songs: []
      });

      // Navigate to the room screen
      setIsLoading(false);
      navigation.navigate('Room', { 
        roomId: roomRef.id, 
        roomName: roomName,
        userName: userName,
        isHost: true,
        numericRoomId: numericRoomId // Pass the numeric ID to the room
      });
    } catch (error) {
      setIsLoading(false);
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a Room</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Room Name"
        value={roomName}
        onChangeText={setRoomName}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Your Name"
        value={userName}
        onChangeText={setUserName}
      />
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <TouchableOpacity style={styles.primaryButton} onPress={createRoom}>
          <Text style={styles.buttonText}>Create Room</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={styles.secondaryButton} 
        onPress={() => navigation.navigate('Join')}
      >
        <Text style={styles.secondaryButtonText}>Back to Join Room</Text>
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
});

export default CreateRoomScreen;