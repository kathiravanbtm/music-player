import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

const LoadingScreen = ({ message = 'Loading...' }) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color="#3498db" />
    <Text style={styles.text}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#667eea',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center', // <-- Add this!
  },
});

export default LoadingScreen;