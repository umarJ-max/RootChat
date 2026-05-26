import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Modal,
  Clipboard, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axios from 'axios';
import { SERVER_URL } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Ionicons } from '@expo/vector-icons';

export default function ChatRoomScreen({ route, navigation }) {
  const { chat, chatName } = route.params;
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const flatListRef = useRef();
  const insets = useSafeAreaInsets();

  const isMe = (msg) => {
    if (!msg.sender) return false;
    return msg.sender._id === user._id || msg.sender === user._id;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderTicks = (status) => {
    if (status === 'read') return <Ionicons name="checkmark-done" size={15} color="#53bdeb" />;
    if (status === 'delivered') return <Ionicons name="checkmark-done" size={15} color="#aaa" />;
    return <Ionicons name="checkmark" size={15} color="#aaa" />;
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/api/chats/${chat._id}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
    } catch (e) {}
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          style={styles.headerTitle}
          onPress={() => navigation.navigate('ChatInfo', { chat, chatName })}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{chatName[0]?.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{chatName}</Text>
            <Text style={styles.headerSub}>{chat.isGroup ? 'Group' : 'tap for info'}</Text>
          </View>
        </TouchableOpacity>
      ),
      headerStyle: { backgroundColor: '#1f2c34' },
      headerTintColor: '#fff',
    });

    fetchMessages();

    const focusUnsubscribe = navigation.addListener('focus', fetchMessages);

    if (socket) {
      socket.emit('joinChat', chat._id);

      socket.on('newMessage', (msg) => {
        setMessages(prev => {
          const filtered = prev.filter(m => !m.temp);
          return [...filtered, msg];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      });

      socket.on('messageStatus', ({ messageId, status }) => {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...m, status } : m));
      });

      socket.on('messagesRead', () => {
        setMessages(prev => prev.map(m =>
          m.sender?._id === user._id || m.sender === user._id
            ? { ...m, status: 'read' }
            : m
        ));
      });

      socket.on('chatError', () => {
        setUnavailable(true);
      });

      socket.on('messageDeleted', (messageId) => {
        setMessages(prev => prev.filter(m => m._id !== messageId));
      });

      socket.emit('markRead', { chatId: chat._id, userId: user._id });
    }

    return () => {
      focusUnsubscribe();
      if (socket) {
        socket.off('newMessage');
        socket.off('messageStatus');
        socket.off('messagesRead');
        socket.off('chatError');
        socket.off('messageDeleted');
      }
    };
  }, [socket]);

  const sendMessage = () => {
    if (!text.trim() || !socket || unavailable) return;

    const tempMsg = {
      _id: Date.now().toString(),
      text: text.trim(),
      sender: { _id: user._id, name: user.name },
      status: 'sent',
      createdAt: new Date().toISOString(),
      temp: true
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    socket.emit('sendMessage', {
      chatId: chat._id,
      senderId: user._id,
      text: text.trim()
    });
    setText('');
  };

  const handleLongPress = (msg) => {
    if (msg.temp) return;
    setSelectedMsg(msg);
    setMenuVisible(true);
  };

  const handleCopy = () => {
    Clipboard.setString(selectedMsg.text);
    setMenuVisible(false);
  };

  const handleDelete = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Message',
      'Delete this message for you?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${SERVER_URL}/api/chats/message/${selectedMsg._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setMessages(prev => prev.filter(m => m._id !== selectedMsg._id));
            } catch (e) {
              Alert.alert('Error', 'Could not delete message');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={90}>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const mine = isMe(item);
            const prevMsg = messages[index - 1];
            const showSender = chat.isGroup && !mine &&
              (!prevMsg || prevMsg.sender?._id !== item.sender?._id);

            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onLongPress={() => handleLongPress(item)}
                delayLongPress={300}>
                <View style={[styles.bubbleWrapper, mine ? styles.myWrapper : styles.theirWrapper]}>
                  {showSender && (
                    <Text style={styles.senderName}>{item.sender?.name || 'Deleted User'}</Text>
                  )}
                  <View style={[
                    styles.bubble,
                    mine ? styles.myBubble : styles.theirBubble,
                    selectedMsg?._id === item._id && styles.bubbleSelected
                  ]}>
                    <Text style={styles.messageText}>{item.text}</Text>
                    <View style={styles.bubbleFooter}>
                      <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
                      {mine && !item.temp && (
                        <View style={styles.tickWrapper}>{renderTicks(item.status)}</View>
                      )}
                      {item.temp && (
                        <Ionicons name="time-outline" size={13} color="#8696a0" />
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyBadge}>
                <Text style={styles.emptyBadgeText}>🔒 Messages are private</Text>
              </View>
            </View>
          }
        />

        {unavailable && (
          <View style={styles.unavailableBanner}>
            <Text style={styles.unavailableText}>
              This person is no longer on the app
            </Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={[styles.input, unavailable && styles.inputDisabled]}
            placeholder={unavailable ? 'Chat unavailable' : 'Message'}
            placeholderTextColor="#666"
            value={text}
            onChangeText={setText}
            multiline
            editable={!unavailable}
          />
          <TouchableOpacity
            style={[styles.sendBtn, text.trim() && !unavailable ? styles.sendBtnActive : null]}
            onPress={sendMessage}
            disabled={!text.trim() || unavailable}>
            <Ionicons name="send" size={20} color={text.trim() && !unavailable ? '#fff' : '#666'} />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

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
            {selectedMsg && (
              <Text style={styles.menuPreview} numberOfLines={2}>
                {selectedMsg.text}
              </Text>
            )}

            <TouchableOpacity style={styles.menuItem} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={20} color="#fff" style={styles.menuIcon} />
              <Text style={styles.menuItemText}>Copy</Text>
            </TouchableOpacity>

            {selectedMsg && isMe(selectedMsg) && (
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={20} color="#ff4444" style={styles.menuIcon} />
                <Text style={styles.menuItemDanger}>Delete</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b141a' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center' },
  headerAvatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  headerSub: { color: '#aaa', fontSize: 12 },
  messagesList: { padding: 10, paddingBottom: 6 },
  bubbleWrapper: { marginVertical: 2, maxWidth: '78%' },
  myWrapper: { alignSelf: 'flex-end' },
  theirWrapper: { alignSelf: 'flex-start' },
  senderName: { color: '#25D366', fontSize: 12, fontWeight: '600', marginLeft: 4, marginBottom: 2 },
  bubble: { borderRadius: 10, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  myBubble: { backgroundColor: '#005c4b', borderBottomRightRadius: 2 },
  theirBubble: { backgroundColor: '#1e2b33', borderBottomLeftRadius: 2 },
  bubbleSelected: { opacity: 0.7 },
  messageText: { color: '#e9edef', fontSize: 15, lineHeight: 21 },
  bubbleFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 3, gap: 3 },
  timeText: { color: '#8696a0', fontSize: 11 },
  tickWrapper: { marginLeft: 2 },
  unavailableBanner: { backgroundColor: '#1f2c34', padding: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#2a3942' },
  unavailableText: { color: '#8696a0', fontSize: 13 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, paddingHorizontal: 10, paddingBottom: 16, backgroundColor: '#1f2c34', gap: 8 },
  input: { flex: 1, backgroundColor: '#2a3942', color: '#e9edef', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 120, minHeight: 44 },
  inputDisabled: { opacity: 0.5 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a3942', justifyContent: 'center', alignItems: 'center' },
  sendBtnActive: { backgroundColor: '#00a884' },
  emptyContainer: { alignItems: 'center', marginTop: 30 },
  emptyBadge: { backgroundColor: '#182229', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, opacity: 0.8 },
  emptyBadgeText: { color: '#8696a0', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  menuContainer: { backgroundColor: '#1e2b33', borderRadius: 16, width: '75%', overflow: 'hidden' },
  menuPreview: { color: '#8696a0', fontSize: 13, padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a3942', fontStyle: 'italic' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#2a3942' },
  menuIcon: { marginRight: 12 },
  menuItemText: { color: '#fff', fontSize: 16 },
  menuItemDanger: { color: '#ff4444', fontSize: 16 },
  menuCancel: { padding: 18, alignItems: 'center' },
  menuCancelText: { color: '#8696a0', fontSize: 16 },
});