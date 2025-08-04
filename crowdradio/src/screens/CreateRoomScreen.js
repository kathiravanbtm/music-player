import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, SafeAreaView } from 'react-native';
import CreateRoomForm from '../components/forms/CreateRoomForm';
import LoadingScreen from '../components/ui/LoadingScreen';
import roomService from '../services/roomService';

const CreateRoomScreen = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async (roomName, userName, hostPassword) => {
    setIsLoading(true);
    
    try {
      const result = await roomService.createRoom(roomName, userName, hostPassword);
      
      // Navigate to the room screen
      navigation.navigate('Room', { 
        roomId: result.roomId, 
        roomName: result.roomName,
        userName: result.userName,
        isHost: true,
        numericRoomId: result.numericRoomId
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Creating room..." />;
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
            <Text style={styles.title}>Create Room</Text>
            <Text style={styles.subtitle}>
              Start your own music room and invite friends to join!
            </Text>
          </View>
          
          <View style={styles.formContainer}>
            <CreateRoomForm 
              onCreateRoom={handleCreateRoom}
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

export default CreateRoomScreen;
