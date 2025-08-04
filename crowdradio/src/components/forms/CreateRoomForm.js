import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import Input from '../ui/Input';
import Button from '../ui/Button';

const CreateRoomForm = ({ onCreateRoom, isLoading = false }) => {
  const [roomName, setRoomName] = useState('');
  const [userName, setUserName] = useState('');
  const [hostPassword, setHostPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!roomName.trim()) {
      newErrors.roomName = 'Room name is required';
    }
    
    if (!userName.trim()) {
      newErrors.userName = 'Your name is required';
    }
    
    if (!hostPassword.trim()) {
      newErrors.hostPassword = 'Host password is required';
    } else if (hostPassword.trim().length < 4) {
      newErrors.hostPassword = 'Password must be at least 4 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateRoom = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onCreateRoom(roomName.trim(), userName.trim(), hostPassword.trim());
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Error', 'Failed to create room. Please try again.');
    }
  };

  return (
    <View>
      <Input
        label="Room Name"
        placeholder="Enter room name..."
        value={roomName}
        onChangeText={(text) => {
          setRoomName(text);
          if (errors.roomName) {
            setErrors(prev => ({ ...prev, roomName: null }));
          }
        }}
        error={errors.roomName}
        autoCapitalize="words"
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
      
      <Input
        label="Host Password"
        placeholder="Set a password for host access..."
        value={hostPassword}
        onChangeText={(text) => {
          setHostPassword(text);
          if (errors.hostPassword) {
            setErrors(prev => ({ ...prev, hostPassword: null }));
          }
        }}
        error={errors.hostPassword}
        secureTextEntry={true}
      />
      
      <Button
        title="Create Room"
        onPress={handleCreateRoom}
        loading={isLoading}
        disabled={isLoading}
      />
    </View>
  );
};

export default CreateRoomForm;
