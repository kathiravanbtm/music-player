import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import Input from '../ui/Input';
import Button from '../ui/Button';

const JoinRoomForm = ({ onJoinRoom, isLoading = false }) => {
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!roomCode.trim()) {
      newErrors.roomCode = 'Room code is required';
    } else if (!/^\d{6}$/.test(roomCode.trim())) {
      newErrors.roomCode = 'Room code must be 6 digits';
    }
    
    if (!userName.trim()) {
      newErrors.userName = 'Your name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleJoinRoom = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const result = await onJoinRoom(roomCode.trim(), userName.trim());
      
      // onJoinRoom should now return a result object
      if (!result.success) {
        Alert.alert('Room Not Found', result.error);
      }
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Error', 'Failed to join room. Please try again.');
    }
  };

  return (
    <View>
      <Input
        label="Room Code"
        placeholder="Enter 6-digit room code..."
        value={roomCode}
        onChangeText={(text) => {
          // Only allow numbers and limit to 6 digits
          const numericText = text.replace(/[^0-9]/g, '').substring(0, 6);
          setRoomCode(numericText);
          if (errors.roomCode) {
            setErrors(prev => ({ ...prev, roomCode: null }));
          }
        }}
        error={errors.roomCode}
        keyboardType="numeric"
        maxLength={6}
      />
      
      <Input
        label="Your Name"
        placeholder="Enter your name..."
        value={userName}
        onChangeText={(text) => {
          setUserName(text);
          if (errors.userName) {
            setErrors(prev => ({ ...prev, userName: null }));
          }
        }}
        error={errors.userName}
        autoCapitalize="words"
      />
      
      <Button
        title="Join Room"
        onPress={handleJoinRoom}
        loading={isLoading}
        disabled={isLoading}
      />
    </View>
  );
};

export default JoinRoomForm;
