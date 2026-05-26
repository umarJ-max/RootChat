import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { SERVER_URL } from '../utils/config';
import { useAuth } from '../context/AuthContext';

export default function NewGroupScreen({ route, navigation }) {
  const { users } = route.params;
  const { token, user } = useAuth();
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const toggleSelect = (userId) => {
    setSelected(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim()) return Alert.alert('Error', 'Enter a group name');
    if (selected.length < 1) return Alert.alert('Error', 'Select at least 1 member');
    setLoading(true);
    try {
      const res = await axios.post(`${SERVER_URL}/api/chats/group`,
        { name: groupName, description, members: selected },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigation.replace('ChatRoom', { chat: res.data, chatName: groupName });
    } catch (e) {
      Alert.alert('Error', 'Could not create group');
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.groupNameWrapper}>
        <View style={styles.groupIconCircle}>
          <Ionicons name="people" size={26} color="#fff" />
        </View>
        <View style={styles.inputsWrapper}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Group name"
            placeholderTextColor="#555"
            value={groupName}
            onChangeText={setGroupName}
            fontSize={16}
          />
          <TextInput
            style={styles.groupDescInput}
            placeholder="Group description (optional)"
            placeholderTextColor="#555"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <Text style={styles.sectionLabel}>
        ADD MEMBERS {selected.length > 0 ? `(${selected.length} selected)` : ''}
      </Text>

      <FlatList
        data={users}
        keyExtractor={item => item._id}
        style={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item._id);
          return (
            <TouchableOpacity
              style={styles.userItem}
              onPress={() => toggleSelect(item._id)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userPhone}>{item.phone}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={[
          styles.createBtn,
          (!groupName.trim() || selected.length < 1) && styles.createBtnDisabled
        ]}
        onPress={createGroup}
        disabled={loading || !groupName.trim() || selected.length < 1}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <>
              <Ionicons name="people" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.createText}>Create Group</Text>
            </>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  groupNameWrapper: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1e1e1e', margin: 12, borderRadius: 12, padding: 14, gap: 12 },
  groupIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  inputsWrapper: { flex: 1, gap: 10 },
  groupNameInput: { color: '#fff', fontSize: 16, paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  groupDescInput: { color: '#fff', fontSize: 14, paddingVertical: 8, paddingHorizontal: 4, minHeight: 70, textAlignVertical: 'top', borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  sectionLabel: { color: '#25D366', fontSize: 12, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 10 },
  list: { flex: 1 },
  userItem: { flexDirection: 'row', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#128C7E', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 16, fontWeight: '500' },
  userPhone: { color: '#888', fontSize: 13, marginTop: 2 },
  checkbox: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#555', justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: '#25D366', borderColor: '#25D366' },
  createBtn: { flexDirection: 'row', margin: 16, backgroundColor: '#25D366', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  createBtnDisabled: { backgroundColor: '#1a4a2a', elevation: 0 },
  createText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});