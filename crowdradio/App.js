import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen.js';
import CreateRoomScreen from './src/screens/CreateRoomScreen.js';
import JoinRoomScreen from './src/screens/JoinRoomScreen.js';
import RoomScreen from './src/screens/RoomScreen.js';

const Stack = createStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#667eea' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'CrowdRadio' }} />
          <Stack.Screen name="Join" component={JoinRoomScreen} options={{ title: 'Join Room' }} />
          <Stack.Screen name="Create" component={CreateRoomScreen} options={{ title: 'Create Room' }} />
          <Stack.Screen name="Room" component={RoomScreen} options={{ title: 'CrowdRadio' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}