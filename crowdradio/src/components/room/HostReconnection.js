import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import joinRoomService from '../../services/joinRoomService';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';

const HostReconnection = ({ onReconnectSuccess, currentUser }) => {
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [hostPassword, setHostPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleReconnect = async () => {
    if (!roomCode.trim() || !hostPassword.trim()) {
      Alert.alert('Error', 'Please enter both room code and password.');
      return;
    }

    setIsConnecting(true);

    try {
      // First verify the host credentials
      const roomsCollection = collection(db, 'rooms');
      const roomQuery = await getDocs(query(roomsCollection, where('numericId', '==', roomCode.trim())));
      
      let roomDoc = null;
      if (!roomQuery.empty) {
        roomDoc = roomQuery.docs[0];
      } else {
        // Try to find by room name
        const nameQuery = await getDocs(query(roomsCollection, where('name', '==', roomCode.trim())));
        if (!nameQuery.empty) {
          roomDoc = nameQuery.docs[0];
        }
      }

      if (!roomDoc) {
        Alert.alert('Error', 'Room not found. Please check the room code/name.');
        return;
      }

      const roomData = roomDoc.data();
      if (roomData.hostPassword !== hostPassword.trim()) {
        Alert.alert('Error', 'Incorrect host password.');
        return;
      }

      // Instead of joining as a new user, reconnect with original host identity
      const reconnectionData = {
        roomId: roomDoc.id,
        roomName: roomData.name,
        userName: roomData.createdBy, // Use original host name
        numericRoomId: roomData.numericId,
        isHost: true,
        isHostReconnection: true,
        hostPassword: hostPassword.trim()
      };
      
      setShowReconnectModal(false);
      setRoomCode('');
      setHostPassword('');
      onReconnectSuccess(reconnectionData);
      
      Alert.alert('Success', 'Successfully reconnected as host!');
    } catch (error) {
      console.error('Host reconnection error:', error);
      Alert.alert('Error', 'Failed to reconnect. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.reconnectButton}
        onPress={() => setShowReconnectModal(true)}
      >
        <AntDesign name="login" size={16} color="#4CAF50" />
        <Text style={styles.reconnectButtonText}>Reconnect as Host</Text>
      </TouchableOpacity>

      <Modal
        visible={showReconnectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReconnectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reconnect as Host</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowReconnectModal(false)}
              >
                <AntDesign name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Enter your room details to reconnect as host and regain control of your room
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Room Code or Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code or room name"
                value={roomCode}
                onChangeText={setRoomCode}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Host Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your host password"
                value={hostPassword}
                onChangeText={setHostPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowReconnectModal(false);
                  setRoomCode('');
                  setHostPassword('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.connectButton, isConnecting && styles.disabledButton]}
                onPress={handleReconnect}
                disabled={isConnecting}
              >
                <Text style={styles.connectButtonText}>
                  {isConnecting ? 'Connecting...' : 'Reconnect'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.infoBox}>
              <AntDesign name="infocirlce" size={16} color="#2196F3" />
              <Text style={styles.infoText}>
                This will rejoin your room with full host privileges, allowing you to control playback and manage users.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  reconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  reconnectButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    padding: 20,
    paddingTop: 0,
  },
  inputContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
  },
  connectButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    margin: 20,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#1976d2',
    lineHeight: 16,
  },
});

export default HostReconnection;
