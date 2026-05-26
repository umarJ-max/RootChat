import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { SERVER_URL } from '../utils/config';

export default function SettingsScreen() {
  const { user, token, logout, updateUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSaveName = async () => {
    if (!newName.trim()) return Alert.alert('Error', 'Name cannot be empty');
    setLoading(true);
    try {
      await axios.put(`${SERVER_URL}/api/users/update`,
        { name: newName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await updateUser({ name: newName.trim() });
      Alert.alert('Success', 'Name updated successfully');
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Could not update name');
    }
    setLoading(false);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>

      <View style={styles.profileSection}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name[0]?.toUpperCase()}</Text>
          </View>
        </View>

        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              placeholder="Enter new name"
              placeholderTextColor="#555"
            />
            <TouchableOpacity onPress={handleSaveName} disabled={loading} style={styles.saveBtn}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="checkmark" size={22} color="#fff" />
              }
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setEditing(false); setNewName(user?.name); }}
              style={styles.cancelBtn}>
              <Ionicons name="close" size={22} color="#aaa" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nameRow} onPress={() => setEditing(true)}>
            <Text style={styles.name}>{user?.name}</Text>
            <Ionicons name="pencil" size={16} color="#25D366" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}

        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.infoItem}>
          <Ionicons name="person-outline" size={20} color="#25D366" style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{user?.name}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="call-outline" size={20} color="#25D366" style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.phone}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutItem} onPress={() => {
          Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout }
          ]);
        }}>
          <Ionicons name="log-out-outline" size={20} color="#ff4444" style={styles.infoIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  profileSection: { alignItems: 'center', padding: 32, backgroundColor: '#1e1e1e', marginBottom: 16 },
  avatarWrapper: { marginBottom: 14 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  phone: { color: '#888', fontSize: 14, marginTop: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  nameInput: { backgroundColor: '#2a2a2a', color: '#fff', borderRadius: 10, padding: 10, fontSize: 16, minWidth: 180, borderWidth: 1, borderColor: '#25D366' },
  saveBtn: { backgroundColor: '#25D366', borderRadius: 8, padding: 10 },
  cancelBtn: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 10 },
  section: { backgroundColor: '#1e1e1e', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  infoIcon: { marginRight: 14 },
  infoLabel: { color: '#888', fontSize: 12, marginBottom: 2 },
  infoValue: { color: '#fff', fontSize: 15 },
  logoutItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  logoutText: { color: '#ff4444', fontSize: 16 },
});