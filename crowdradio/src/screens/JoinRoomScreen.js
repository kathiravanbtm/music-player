import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, SafeAreaView } from 'react-native';
import JoinRoomForm from '../components/forms/JoinRoomForm';
import LoadingScreen from '../components/ui/LoadingScreen';
import joinRoomService from '../services/joinRoomService';

const JoinRoomScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinRoom = async (roomCode, userName) => {
    setIsLoading(true);
    
    try {
      const result = await joinRoomService.findAndJoinRoom(roomCode, userName);
      
      if (result.success) {
        // Navigate to the room screen only if successful
        navigation.navigate('Room', {
          roomId: result.roomId,
          roomName: result.roomName,
          userName: result.userName,
          isHost: result.isHost,
          isLocalRoom: result.isLocalRoom,
          numericRoomId: result.numericRoomId
        });
      }
      
      // Return the result so the form can handle errors
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Finding room..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Join Room</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit room code to join an existing music room!
            </Text>
          </View>
          
          <View style={styles.formContainer}>
            <JoinRoomForm 
              onJoinRoom={handleJoinRoom}
              isLoading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 20,
  },
});

export default JoinRoomScreen;
