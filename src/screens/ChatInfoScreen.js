import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, TextInput, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_URL } from '../utils/config';
import { useAuth } from '../context/AuthContext';

export default function ChatInfoScreen({ route, navigation }) {
  const { chat: initialChat, chatName } = route.params;
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [chat, setChat] = useState(initialChat);
  const [editingGroup, setEditingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState(initialChat.name || '');
  const [newDescription, setNewDescription] = useState(initialChat.description || '');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchChatDetails();
  }, []);

  const fetchChatDetails = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const found = res.data.find(c => c._id.toString() === initialChat._id.toString());
      if (found) {
        setChat(found);
        setNewGroupName(found.name || '');
        setNewDescription(found.description || '');
      }
    } catch (e) {
      console.log('Error:', e);
    }
    setFetching(false);
  };

  const ownerId = (chat.admin?._id || chat.admin)?.toString();
  const isOwner = chat.isGroup && ownerId === user._id.toString();
  const isAdmin = chat.isGroup && (
    isOwner ||
    chat.admins?.some(a => (a._id || a)?.toString() === user._id.toString())
  );

  const otherMember = chat.isGroup
    ? null
    : chat.members?.find(m => m._id !== user._id);

  const handleSaveGroup = async () => {
    if (!newGroupName.trim()) return Alert.alert('Error', 'Group name cannot be empty');
    if (newDescription.length > 150)
      return Alert.alert('Error', 'Description max 150 characters');
    setLoading(true);
    try {
      await axios.put(`${SERVER_URL}/api/chats/${chat._id}/group`,
        { name: newGroupName, description: newDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchChatDetails();
      Alert.alert('Success', 'Group updated');
      setEditingGroup(false);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not update group');
    }
    setLoading(false);
  };

  const handleRemoveMember = (memberId, memberName) => {
    Alert.alert('Remove Member', `Remove ${memberName} from the group?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await axios.put(`${SERVER_URL}/api/chats/${chat._id}/remove-member`,
              { memberId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchChatDetails();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not remove member');
          }
        }
      }
    ]);
  };

  const handleMakeAdmin = (memberId, memberName) => {
    Alert.alert('Make Admin', `Make ${memberName} a group admin?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await axios.put(`${SERVER_URL}/api/chats/${chat._id}/make-admin`,
              { memberId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchChatDetails();
            Alert.alert('Done', `${memberName} is now an admin`);
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not make admin');
          }
        }
      }
    ]);
  };

  const handleRemoveAdmin = (memberId, memberName) => {
    Alert.alert('Remove Admin', `Remove ${memberName} as admin?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', style: 'destructive',
        onPress: async () => {
          try {
            await axios.put(`${SERVER_URL}/api/chats/${chat._id}/remove-admin`,
              { memberId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchChatDetails();
            Alert.alert('Done', `${memberName} is no longer admin`);
          } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Could not remove admin');
          }
        }
      }
    ]);
  };

  const handleLeaveGroup = () => {
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive',
        onPress: async () => {
          try {
            await axios.put(`${SERVER_URL}/api/chats/${chat._id}/leave`,
              {},
              { headers: { Authorization: `Bearer ${token}` } }
            );
            navigation.navigate('Chats');
          } catch (e) {
            Alert.alert('Error', 'Could not leave group');
          }
        }
      }
    ]);
  };

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Clear all messages?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/api/chats/${chat._id}/messages`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', 'Could not clear chat');
          }
        }
      }
    ]);
  };

  const handleDeleteChat = () => {
    Alert.alert('Delete Chat', 'Delete this chat permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await axios.delete(`${SERVER_URL}/api/chats/${chat._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            navigation.navigate('Chats');
          } catch (e) {
            Alert.alert('Error', 'Could not delete chat');
          }
        }
      }
    ]);
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      'This will permanently delete the group and all messages for everyone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${SERVER_URL}/api/chats/${chat._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              navigation.navigate('Chats');
            } catch (e) {
              Alert.alert('Error', 'Could not delete group');
            }
          }
        }
      ]
    );
  };

  if (fetching) return (
    <View style={styles.center}>
      <ActivityIndicator color="#25D366" size="large" />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{chatName[0]?.toUpperCase()}</Text>
        </View>

        {chat.isGroup && editingGroup ? (
          <View style={styles.editSection}>
            <TextInput
              style={styles.editInput}
              value={newGroupName}
              onChangeText={setNewGroupName}
              placeholder="Group name"
              placeholderTextColor="#555"
            />
            <TextInput
              style={[styles.editInput, styles.editDescInput]}
              value={newDescription}
              onChangeText={(t) => {
                if (t.length <= 150) setNewDescription(t);
              }}
              placeholder="Group description (max 150 chars)"
              placeholderTextColor="#555"
              multiline
              numberOfLines={3}
            />
            <Text style={styles.charCount}>{newDescription.length}/150</Text>
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGroup} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>Save</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingGroup(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{chat.isGroup ? chat.name : chatName}</Text>
              {chat.isGroup && isAdmin && (
                <TouchableOpacity onPress={() => setEditingGroup(true)}>
                  <Ionicons name="pencil" size={16} color="#25D366" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              )}
            </View>
            {chat.isGroup && (
              <Text style={styles.sub}>
                {chat.description ? chat.description : 'No description added'}
              </Text>
            )}
            {!chat.isGroup && (
              <Text style={styles.sub}>{otherMember?.phone || ''}</Text>
            )}
          </>
        )}

        {chat.isGroup && (
          <View style={styles.adminBadgeRow}>
            <Text style={styles.memberCount}>{chat.members?.length || 0} members</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#fff" />
                <Text style={styles.adminBadgeText}>{isOwner ? 'Owner' : 'Admin'}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {chat.isGroup && chat.members && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MEMBERS</Text>
          {chat.members.map(member => {
            if (!member || !member._id) return null;
            const memberIsAdmin = chat.admins?.some(
              a => (a._id || a)?.toString() === member._id.toString()
            ) || (chat.admin?._id || chat.admin)?.toString() === member._id.toString();
            const memberIsOwner = (chat.admin?._id || chat.admin)?.toString() === member._id.toString();

            return (
              <View key={member._id} style={styles.memberItem}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.name?.[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member._id === user._id ? `${member.name} (You)` : member.name}
                  </Text>
                  {memberIsOwner ? (
                    <Text style={styles.memberOwnerTag}>Owner</Text>
                  ) : memberIsAdmin ? (
                    <Text style={styles.memberAdminTag}>Admin</Text>
                  ) : null}
                </View>
                {isAdmin && member._id !== user._id && (
                  <View style={styles.memberActions}>
                    {isOwner && !memberIsOwner && (
                      memberIsAdmin ? (
                        <TouchableOpacity
                          style={styles.memberActionBtn}
                          onPress={() => handleRemoveAdmin(member._id, member.name)}>
                          <Ionicons name="shield-outline" size={18} color="#ff4444" />
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.memberActionBtn}
                          onPress={() => handleMakeAdmin(member._id, member.name)}>
                          <Ionicons name="shield-checkmark-outline" size={18} color="#25D366" />
                        </TouchableOpacity>
                      )
                    )}
                    <TouchableOpacity
                      style={styles.memberActionBtn}
                      onPress={() => handleRemoveMember(member._id, member.name)}>
                      <Ionicons name="person-remove-outline" size={18} color="#ff4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.section}>
        <TouchableOpacity style={styles.actionItem} onPress={handleClearChat}>
          <Ionicons name="trash-outline" size={20} color="#fff" style={styles.actionIcon} />
          <Text style={styles.actionText}>Clear Chat</Text>
        </TouchableOpacity>

        {chat.isGroup ? (
          <>
            <TouchableOpacity style={styles.actionItem} onPress={handleLeaveGroup}>
              <Ionicons name="exit-outline" size={20} color="#ff4444" style={styles.actionIcon} />
              <Text style={styles.actionDanger}>Leave Group</Text>
            </TouchableOpacity>
            {isOwner && (
              <TouchableOpacity style={styles.actionItem} onPress={handleDeleteGroup}>
                <Ionicons name="close-circle-outline" size={20} color="#ff4444" style={styles.actionIcon} />
                <Text style={styles.actionDanger}>Delete Group</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity style={styles.actionItem} onPress={handleDeleteChat}>
            <Ionicons name="close-circle-outline" size={20} color="#ff4444" style={styles.actionIcon} />
            <Text style={styles.actionDanger}>Delete Chat</Text>
          </TouchableOpacity>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  profileSection: { alignItems: 'center', padding: 32, backgroundColor: '#1e1e1e', marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  sub: { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 24, marginTop: 4 },
  adminBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  memberCount: { color: '#888', fontSize: 13 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#25D366', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, gap: 4 },
  adminBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  editSection: { width: '100%', gap: 10, marginTop: 8 },
  editInput: { backgroundColor: '#2a2a2a', color: '#fff', borderRadius: 10, padding: 12, fontSize: 15, borderWidth: 1, borderColor: '#25D366' },
  editDescInput: { minHeight: 80, textAlignVertical: 'top' },
  charCount: { color: '#888', fontSize: 12, textAlign: 'right' },
  editButtons: { flexDirection: 'row', gap: 10 },
  saveBtn: { flex: 1, backgroundColor: '#25D366', borderRadius: 10, padding: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 10, padding: 12, alignItems: 'center' },
  cancelBtnText: { color: '#aaa' },
  section: { backgroundColor: '#1e1e1e', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  sectionTitle: { color: '#25D366', fontSize: 12, fontWeight: '700', padding: 14, paddingBottom: 8 },
  memberItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  memberAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#128C7E', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberAvatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  memberInfo: { flex: 1 },
  memberName: { color: '#fff', fontSize: 15 },
  memberAdminTag: { color: '#25D366', fontSize: 12, marginTop: 2 },
  memberOwnerTag: { color: '#FFD700', fontSize: 12, marginTop: 2 },
  memberActions: { flexDirection: 'row', gap: 8 },
  memberActionBtn: { padding: 6 },
  actionItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  actionIcon: { marginRight: 14 },
  actionText: { color: '#fff', fontSize: 16 },
  actionDanger: { color: '#ff4444', fontSize: 16 },
});