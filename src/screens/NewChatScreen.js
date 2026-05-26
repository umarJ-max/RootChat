import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Alert, ActivityIndicator
} from 'react-native';
import * as Contacts from 'expo-contacts';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_URL } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function NewChatScreen({ navigation }) {
  const { token } = useAuth();
  const { onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [contactsPermission, setContactsPermission] = useState(null);

  useEffect(() => {
    loadContactsAndMatch();
    const unsubscribe = navigation.addListener('focus', loadContactsAndMatch);
    return unsubscribe;
  }, []);

  const loadContactsAndMatch = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      setContactsPermission(status);

      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.PhoneNumbers],
        });

        const phoneNumbers = [];
        data.forEach(contact => {
          if (contact.phoneNumbers) {
            contact.phoneNumbers.forEach(p => {
              if (p.number) phoneNumbers.push(p.number);
            });
          }
        });

        if (phoneNumbers.length > 0) {
          const res = await axios.post(`${SERVER_URL}/api/users/match-contacts`,
            { phoneNumbers },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUsers(res.data);
        } else {
          setUsers([]);
        }
      } else {
        // Permission denied — fall back to showing all users
        const res = await axios.get(`${SERVER_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      }
    } catch (e) {
      // On any error fall back to all users
      try {
        const res = await axios.get(`${SERVER_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(res.data);
      } catch (err) {}
    }
    setLoading(false);
  };

  const startDirectChat = async (userId, userName) => {
    try {
      const res = await axios.post(`${SERVER_URL}/api/chats/create`,
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigation.replace('ChatRoom', { chat: res.data, chatName: userName });
    } catch (e) {
      Alert.alert('Error', 'Could not start chat');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator color="#25D366" size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={18} color="#555" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name or phone number"
          placeholderTextColor="#555"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {contactsPermission === 'denied' && (
        <View style={styles.permissionBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#8696a0" />
          <Text style={styles.permissionText}>
            Contacts permission denied — showing all users
          </Text>
        </View>
      )}

      <FlatList
        data={filteredUsers}
        keyExtractor={item => item._id}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.newGroupItem}
            onPress={() => navigation.navigate('NewGroup', { users })}>
            <View style={styles.newGroupAvatar}>
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <Text style={styles.newGroupText}>Create Group</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => {
          const online = onlineUsers.includes(item._id);
          return (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => startDirectChat(item._id, item.name)}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
                </View>
                {online && <View style={styles.onlineDot} />}
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#333" />
            <Text style={styles.emptyTitle}>No contacts found</Text>
            <Text style={styles.emptySub}>
              Ask your friends to join and save their number in your contacts
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e1e1e', margin: 12, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', padding: 12, fontSize: 15 },
  permissionBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a2a1a', marginHorizontal: 12, borderRadius: 8, padding: 10, gap: 8, marginBottom: 4 },
  permissionText: { color: '#8696a0', fontSize: 12, flex: 1 },
  newGroupItem: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  newGroupAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  newGroupText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  userItem: { flexDirection: 'row', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', alignItems: 'center' },
  avatarWrapper: { position: 'relative', marginRight: 14 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#128C7E', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 13, height: 13, borderRadius: 7, backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#111' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 16, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubText: { color: '#888', fontSize: 14, textAlign: 'center' },
  emptyText: { color: '#888', fontSize: 16 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySub: { color: '#888', fontSize: 14, textAlign: 'center' },
});