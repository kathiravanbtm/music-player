import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Modal } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { collection, onSnapshot, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase';

const UserManagement = ({ roomId, isHost, isHostAuthenticated, currentUser, isLocalRoom = false }) => {
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (isLocalRoom || !roomId) return;

    // Subscribe to room data to get user list
    const unsubscribe = onSnapshot(
      doc(db, 'rooms', roomId),
      (doc) => {
        if (doc.exists()) {
          const roomData = doc.data();
          setUsers(roomData.users || []);
        }
      },
      (error) => {
        console.log('Error fetching users:', error);
      }
    );

    return unsubscribe;
  }, [roomId, isLocalRoom]);

  const kickUser = async (userToKick) => {
    if (!isHost || !isHostAuthenticated || isLocalRoom) return;

    Alert.alert(
      'Kick User',
      `Are you sure you want to kick ${userToKick.name} from the room?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Kick',
          style: 'destructive',
          onPress: async () => {
            try {
              const roomRef = doc(db, 'rooms', roomId);
              await updateDoc(roomRef, {
                users: arrayRemove(userToKick)
              });
              Alert.alert('Success', `${userToKick.name} has been kicked from the room.`);
            } catch (error) {
              console.error('Error kicking user:', error);
              Alert.alert('Error', 'Failed to kick user. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }) => {
    const isCurrentUser = item.name === currentUser;
    const canKick = isHost && isHostAuthenticated && !isCurrentUser && !item.isHost;

    return (
      <View style={styles.userItem}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          {item.isHost && <Text style={styles.hostLabel}>Host</Text>}
          {isCurrentUser && <Text style={styles.youLabel}>You</Text>}
        </View>
        <View style={styles.userActions}>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: item.isOnline ? '#4CAF50' : '#999' }]} />
            <Text style={styles.statusText}>{item.isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          {canKick && (
            <TouchableOpacity
              style={styles.kickButton}
              onPress={() => kickUser(item)}
            >
              <AntDesign name="close" size={16} color="#ff4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.userCountButton}
        onPress={() => setShowUserModal(true)}
      >
        <AntDesign name="team" size={16} color="#fff" />
        <Text style={styles.userCountText}>
          {users.length} {users.length === 1 ? 'User' : 'Users'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Room Users ({users.length})</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowUserModal(false)}
              >
                <AntDesign name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {users.length === 0 ? (
              <Text style={styles.noUsersText}>No users in the room</Text>
            ) : (
              <FlatList
                data={users}
                renderItem={renderUserItem}
                keyExtractor={(item, index) => `${item.name}_${index}`}
                style={styles.userList}
                showsVerticalScrollIndicator={false}
              />
            )}
            
            {isHost && isHostAuthenticated && (
              <Text style={styles.hostHint}>
                Tap the × button to kick users from the room
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  userCountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  userCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    maxHeight: '70%',
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
  userList: {
    maxHeight: 300,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  hostLabel: {
    backgroundColor: '#ff5722',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  youLabel: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  kickButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: '#ffebee',
  },
  noUsersText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 40,
  },
  hostHint: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    padding: 16,
    fontStyle: 'italic',
  },
});

export default UserManagement;
