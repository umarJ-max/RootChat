import { SafeAreaProvider } from 'react-native-safe-area-context';
import ChatInfoScreen from './src/screens/ChatInfoScreen';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ChatsScreen from './src/screens/ChatsScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import NewChatScreen from './src/screens/NewChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { ActivityIndicator, View } from 'react-native';
import NewGroupScreen from './src/screens/NewGroupScreen';
const Stack = createStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}>
      <ActivityIndicator color="#25D366" size="large" />
    </View>
  );

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Chats" component={ChatsScreen} />
          <Stack.Screen name="NewGroup" component={NewGroupScreen}
            options={{ headerShown: true, title: 'New Group', headerStyle: { backgroundColor: '#1e1e1e' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="ChatRoom" component={ChatRoomScreen}
            options={{ headerShown: true }} />
            <Stack.Screen name="ChatInfo" component={ChatInfoScreen}
              options={({ route }) => ({
                headerShown: true,
                title: route.params?.chat?.isGroup ? 'Group Info' : 'Contact Info',
                headerStyle: { backgroundColor: '#1e1e1e' },
                headerTintColor: '#fff'
              })} />
          <Stack.Screen name="NewChat" component={NewChatScreen}
            options={{ headerShown: true, title: 'New Chat', headerStyle: { backgroundColor: '#1e1e1e' }, headerTintColor: '#fff' }} />
          <Stack.Screen name="Settings" component={SettingsScreen}
            options={{ headerShown: true, title: 'Settings', headerStyle: { backgroundColor: '#1e1e1e' }, headerTintColor: '#fff' }} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SocketProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}