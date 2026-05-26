import React, { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { SERVER_URL } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function ChatsScreen({ navigation }) {
  const { user, token } = useAuth();
  const { onlineUsers } = useSocket();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [pressedId, setPressedId] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchChats();
    const unsubscribe = navigation.addListener('focus', fetchChats);
    const interval = setInterval(fetchChats, 30000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const fetchChats = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChats(res.data);
    } catch (e) {}
    setLoading(false);
  };

  const getChatName = (chat) => {
    if (chat.isGroup) return chat.name;
    const other = chat.members.find(m => m._id !== user._id);
    return other?.name || 'Unknown';
  };

  const isOnline = (chat) => {
    if (chat.isGroup) return false;
    const other = chat.members.find(m => m._id !== user._id);
    return onlineUsers.includes(other?._id);
  };

  const handleLongPress = (chat) => {
    setSelectedChat(chat);
    setMenuVisible(true);
    setPressedId(null);
  };

  const handleClearChat = () => {
    setMenuVisible(false);
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${SERVER_URL}/api/chats/${selectedChat._id}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              fetchChats();
            } catch (e) {
              Alert.alert('Error', 'Could not clear chat');
            }
          }
        }
      ]
    );
  };

  const handleDeleteChat = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${SERVER_URL}/api/chats/${selectedChat._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              fetchChats();
            } catch (e) {
              Alert.alert('Error', 'Could not delete chat');
            }
          }
        }
      ]
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#25D366" size="large" />
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RootChat</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.chatItem,
              pressedId === item._id && styles.chatItemPressed
            ]}
            onPress={() => navigation.navigate('ChatRoom', {
              chat: item,
              chatName: getChatName(item)
            })}
            onPressIn={() => setPressedId(item._id)}
            onPressOut={() => setPressedId(null)}
            onLongPress={() => handleLongPress(item)}
            delayLongPress={300}>
            <View style={[
              styles.avatar,
              pressedId === item._id && styles.avatarPressed
            ]}>
              <Text style={styles.avatarText}>{getChatName(item)[0]?.toUpperCase()}</Text>
              {isOnline(item) && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.chatInfo}>
              <Text style={styles.chatName}>{getChatName(item)}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage?.text || 'No messages yet'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💬</Text>
            <Text style={styles.emptyTitle}>No chats yet</Text>
            <Text style={styles.emptySubtitle}>Start a conversation with your friends</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
        onPress={() => navigation.navigate('NewChat')}>
        <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>
              {selectedChat ? getChatName(selectedChat) : ''}
            </Text>

            <TouchableOpacity style={styles.menuItem} onPress={handleClearChat}>
              <Text style={styles.menuItemText}>🗑️  Clear Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteChat}>
              <Text style={styles.menuItemDanger}>❌  Delete Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuCancel}
              onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 48, backgroundColor: '#1e1e1e' },
  headerTitle: { color: '#25D366', fontSize: 24, fontWeight: 'bold' },
  settingsIcon: { fontSize: 22 },
  chatItem: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', alignItems: 'center', backgroundColor: '#111' },
  chatItemPressed: { backgroundColor: '#1e2e1e' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarPressed: { backgroundColor: '#1a9e50' },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  onlineDot: { position: 'absolute', bottom: 1, right: 1, width: 13, height: 13, borderRadius: 7, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#111' },
  chatInfo: { flex: 1 },
  chatName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  lastMessage: { color: '#888', fontSize: 13, marginTop: 3 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyEmoji: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptySubtitle: { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  fab: { position: 'absolute', right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: { backgroundColor: '#1e1e1e', borderRadius: 16, width: '80%', overflow: 'hidden' },
  menuTitle: { color: '#aaa', fontSize: 14, fontWeight: '600', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  menuItem: { padding: 18, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  menuItemText: { color: '#fff', fontSize: 16 },
  menuItemDanger: { color: '#ff4444', fontSize: 16 },
  menuCancel: { padding: 18, alignItems: 'center' },
  menuCancelText: { color: '#888', fontSize: 16 },
});