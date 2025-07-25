import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const JoinRoomScreen = ({ navigation }) => {
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const joinRoom = async () => {
    if (!roomCode.trim()) {
      Alert.alert('Error', 'Please enter a Room Code');
      return;
    }
    
    if (!userName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Try to find the room using the numeric ID
      const roomsQuery = query(
        collection(db, 'rooms'), 
        where('numericId', '==', roomCode)
      );
      
      let actualRoomId, roomData;
      
      try {
        const roomSnapshot = await getDocs(roomsQuery);
        
        if (!roomSnapshot.empty) {
          // Get the actual room document
          const roomDoc = roomSnapshot.docs[0];
          roomData = roomDoc.data();
          actualRoomId = roomDoc.id;
        } else {
          // Room not found, but we'll create a temporary local room anyway
          console.log('Room not found, creating temporary local room');
          actualRoomId = 'local-' + roomCode;
          roomData = {
            name: 'Room ' + roomCode,
            createdBy: 'Anonymous',
            isActive: true,
          };
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // If database error, create a local room
        actualRoomId = 'local-' + roomCode;
        roomData = {
          name: 'Room ' + roomCode,
          createdBy: 'Anonymous',
          isActive: true,
        };
      }
      
      // Navigate to the room (whether real or local)
      setIsLoading(false);
      navigation.navigate('Room', { 
        roomId: actualRoomId,
        roomName: roomData?.name || ('Room ' + roomCode),
        userName: userName,
        isHost: actualRoomId.startsWith('local-'), // If local room, user is host
        numericRoomId: roomCode,
        isLocalRoom: actualRoomId.startsWith('local-')
      });
    } catch (error) {
      console.error('Error joining room:', error);
      // Even if there's an error, let's still try to navigate to a local room
      setIsLoading(false);
      navigation.navigate('Room', { 
        roomId: 'local-' + roomCode,
        roomName: 'Room ' + roomCode,
        userName: userName,
        isHost: true,
        numericRoomId: roomCode,
        isLocalRoom: true
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join a Room</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit Room Code"
        value={roomCode}
        onChangeText={setRoomCode}
        keyboardType="numeric"
        maxLength={6}
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
