import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

const RoomHeader = ({ roomCode, roomName, userName, isHost, onShare }) => {
  return (
    <View style={styles.container}>
      <View style={styles.infoSection}>
        <Text style={styles.roomName}>{roomName}</Text>
        <Text style={styles.roomCode}>Room Code: {roomCode}</Text>
        <Text style={styles.userInfo}>You: {userName}</Text>
        {isHost && <Text style={styles.hostBadge}>HOST</Text>}
      </View>
      
      <TouchableOpacity style={styles.shareButton} onPress={onShare}>
        <AntDesign name="sharealt" size={20} color="#fff" />
        <Text style={styles.shareText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoSection: {
    flex: 1,
  },
  roomName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  roomCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498db',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  hostBadge: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: 'bold',
    backgroundColor: '#ffeaa7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3498db',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default RoomHeader;
