import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Button from '../components/ui/Button';
import HostReconnection from '../components/room/HostReconnection';

const HomeScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const handleCreateRoom = () => {
    navigation.navigate('Create');
  };

  const handleJoinRoom = () => {
    navigation.navigate('Join');
  };

  const handleHostReconnection = (reconnectionData) => {
    navigation.navigate('Room', {
      roomId: reconnectionData.roomId,
      roomName: reconnectionData.roomName,
      userName: reconnectionData.userName,
      isHost: true,
      isLocalRoom: false,
      numericRoomId: reconnectionData.numericRoomId
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <AntDesign name="sound" size={50} color="#fff" />
          </View>
          <Text style={styles.title}>CrowdRadio</Text>
          <Text style={styles.subtitle}>
            Create or join a music room and enjoy collaborative listening
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <AntDesign name="plus" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>Create rooms and host music sessions</Text>
          </View>
          <View style={styles.feature}>
            <AntDesign name="team" size={24} color="#2196F3" />
            <Text style={styles.featureText}>Join friends and discover new music</Text>
          </View>
          <View style={styles.feature}>
            <AntDesign name="heart" size={24} color="#FF4081" />
            <Text style={styles.featureText}>Vote for your favorite songs</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Create Room"
            onPress={handleCreateRoom}
            variant="primary"
            style={styles.createButton}
          />
          
          <Button
            title="Join Room"
            onPress={handleJoinRoom}
            variant="secondary"
            style={styles.joinButton}
          />
        </View>

        {/* Host Reconnection Option */}
        <View style={styles.reconnectionSection}>
          <Text style={styles.reconnectionTitle}>Already a Host?</Text>
          <HostReconnection 
            onReconnectSuccess={handleHostReconnection}
            currentUser={userName || 'Host'}
          />
        </View>

        {/* Footer */}
        <View style={[styles.footer]}>
          <Text style={styles.footerText}>
            Start listening together with friends 
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#667eea',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40, // Increased to avoid nav bar collision
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    marginVertical: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  featureText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 15,
    flex: 1,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
  },
  joinButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#fff',
    paddingVertical: 14,
  },
  reconnectionSection: {
    marginVertical: 20,
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  reconnectionTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  footer: {
    textAlign: 'center',
    paddingBottom: 25, // Increased for nav bar safety
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: "center"
  },
});

export default HomeScreen;
