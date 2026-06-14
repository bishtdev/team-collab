// components/ChatPage.jsx
// Real-time team chat component with paginated message history.
//
// Features:
// - Real-time message sending/receiving via Socket.io
// - Paginated message loading (50 messages per page)
// - Typing indicators
// - Message grouping by sender and time proximity
// - Date dividers between messages from different days
//
// Authentication flow:
// 1. Component connects socket with Firebase token on mount
// 2. Server verifies token before allowing WebSocket connection
// 3. User joins their team's chat room
// 4. Messages are sent with senderId derived from authenticated user
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { FiSend, FiMessageCircle } from 'react-icons/fi';

const ChatPage = ({ teamId, currentUser }) => {
  const { socket } = useSocket();
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, hasMore: true, total: 0 });
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Smooth scroll to bottom of chat
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch Messages with Pagination
  // Loads messages from the server with pagination support.
  // - page 1: Initial load (replaces chat)
  // - page > 1: Load older messages (prepends to chat)
  // ---------------------------------------------------------------------------
  const fetchMessages = useCallback(async (page = 1) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const res = await api.get(`/messages/${teamId}?page=${page}&limit=50`);
      const { messages, pagination: pagData } = res.data;

      if (page === 1) {
        // Initial load: replace chat with fetched messages
        setChat(messages);
        // Scroll to bottom after initial load
        setTimeout(() => scrollToBottom(false), 100);
      } else {
        // Load more: prepend older messages to existing chat
        setChat(prev => [...messages, ...prev]);
      }

      setPagination(pagData);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [teamId, scrollToBottom]);

  // ---------------------------------------------------------------------------
  // Socket Connection & Message Loading
  // This effect runs when teamId or currentUser changes.
  // It joins/leaves the team chat room and listens for messages.
  // The socket connection itself is managed by SocketContext.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!teamId || !currentUser || !socket) return;

    // Join the team's chat room
    socket.emit('joinTeamRoom', teamId);

    // Listen for new messages from other users
    const handleReceiveMessage = (newMsg) => {
      setChat((prev) => [...prev, newMsg]);
    };

    // Listen for typing indicators
    const handleUserTyping = ({ userId, userName }) => {
      if (userId !== currentUser?._id) {
        setTypingUsers((prev) => {
          if (prev.find(u => u.userId === userId)) return prev;
          return [...prev, { userId, userName }];
        });
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter(u => u.userId !== userId));
        }, 3000);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('userTyping', handleUserTyping);

    // Load initial messages (first page)
    fetchMessages(1);

    // Cleanup: remove listeners and leave room when unmounting or deps change
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('userTyping', handleUserTyping);
      socket.emit('leaveRoom', teamId);
    };
  }, [teamId, currentUser, currentUser?._id, socket, fetchMessages]);

  // ---------------------------------------------------------------------------
  // Load More Messages (Infinite Scroll)
  // Triggered when user scrolls to the top of the chat.
  // Loads the next page of older messages.
  // ---------------------------------------------------------------------------
  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container || isLoadingMore || !pagination.hasMore) return;

    // Load more when scrolled near the top (within 100px)
    if (container.scrollTop < 100) {
      const nextPage = pagination.page + 1;
      fetchMessages(nextPage);
    }
  }, [isLoadingMore, pagination, fetchMessages]);

  // ---------------------------------------------------------------------------
  // Auto-scroll on New Messages
  // Scrolls to bottom when new messages arrive (but not when loading older ones)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Only auto-scroll if we're viewing the latest messages
    // (not when loading older messages from pagination)
    if (!isLoading && !isLoadingMore) {
      scrollToBottom(!isLoading);
    }
  }, [chat.length, scrollToBottom, isLoading, isLoadingMore]);

  // ---------------------------------------------------------------------------
  // Send Message
  // Emits the message via Socket.io.
  // The senderId is determined server-side from the authenticated socket user,
  // NOT from client input (security measure).
  // ---------------------------------------------------------------------------
  const handleSend = () => {
    if (!message.trim() || !currentUser || !socket) return;

    // Send message - senderId is set by the server from authenticated user
    socket.emit('sendMessage', {
      content: message,
      teamId, // teamId for room routing
    });
    setMessage('');
  };

  // Handle Enter key to send (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    setMessage(e.target.value);

    // Emit typing indicator to other users
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socket) {
      socket.emit('typing', { teamId, userId: currentUser?._id, userName: currentUser?.name });
    }
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  // ---------------------------------------------------------------------------
  // Message Grouping
  // Groups consecutive messages from the same sender within 5 minutes.
  // Also adds date dividers between messages from different days.
  // ---------------------------------------------------------------------------
  const getMessageGroups = () => {
    const groups = [];
    let currentGroup = null;

    chat.forEach((msg, index) => {
      const senderId = msg.senderId?._id || msg.senderId;
      const timestamp = new Date(msg.timestamp);
      const prevMsg = index > 0 ? chat[index - 1] : null;
      const prevTimestamp = prevMsg ? new Date(prevMsg.timestamp) : null;

      // Show date divider if it's a different day
      const showDateDivider = !prevMsg || (
        prevTimestamp &&
        timestamp.toDateString() !== prevTimestamp.toDateString()
      );

      if (showDateDivider) {
        groups.push({ type: 'date-divider', date: timestamp });
      }

      const prevSenderId = prevMsg?.senderId?._id || prevMsg?.senderId;
      const timeDiff = prevTimestamp ? (timestamp - prevTimestamp) / 1000 / 60 : Infinity;

      // Group if same sender and within 5 minutes
      if (currentGroup && prevSenderId === senderId && timeDiff < 5 && !showDateDivider) {
        currentGroup.messages.push(msg);
      } else {
        currentGroup = {
          type: 'message-group',
          senderId,
          senderName: msg.senderId?.name || 'Unknown',
          isOwn: senderId === currentUser?._id,
          messages: [msg],
        };
        groups.push(currentGroup);
      }
    });

    return groups;
  };

  // Date formatting helper
  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Time formatting helper
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show loading state while connecting
  if (!teamId || !currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  const messageGroups = getMessageGroups();

  return (
    <div className="flex flex-col h-[calc(100vh-53px)]">
      {/* Chat header */}
      <div className="px-5 py-3 border-b border-gray-800/60 bg-gray-950/50 backdrop-blur-sm flex items-center gap-3">
        <div className="p-2 bg-gray-800/60 rounded-xl">
          <FiMessageCircle className="text-lg text-gray-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white text-sm">Team Chat</h2>
          <p className="text-xs text-gray-600">{pagination.total || chat.length} messages</p>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 space-y-1 scrollbar-thin"
      >
        {/* Load more button / indicator */}
        {pagination.hasMore && (
          <div className="text-center py-3">
            {isLoadingMore ? (
              <div className="w-6 h-6 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              <button
                onClick={() => fetchMessages(pagination.page + 1)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Load older messages
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-gray-700 border-t-white rounded-full animate-spin" />
          </div>
        ) : chat.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-800/40 flex items-center justify-center mb-4">
              <FiMessageCircle className="text-3xl text-gray-700" />
            </div>
            <h3 className="text-gray-400 font-medium">No messages yet</h3>
            <p className="text-gray-600 text-sm mt-1 max-w-xs">
              Start the conversation! Send a message to your team.
            </p>
          </div>
        ) : (
          <>
            {messageGroups.map((group, i) => {
              if (group.type === 'date-divider') {
                return (
                  <div key={`date-${i}`} className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px bg-gray-800/60" />
                    <span className="text-[11px] text-gray-600 font-medium px-2">
                      {formatDate(group.date)}
                    </span>
                    <div className="flex-1 h-px bg-gray-800/60" />
                  </div>
                );
              }

              return (
                <div
                  key={`group-${i}`}
                  className={`flex gap-2.5 mb-3 ${group.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar (for others) */}
                  {!group.isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 mt-auto">
                      {group.senderName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}

                  <div className={`flex flex-col ${group.isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {/* Sender name — only for others */}
                    {!group.isOwn && (
                      <span className="text-xs font-medium text-gray-500 mb-1 ml-1">
                        {group.senderName}
                      </span>
                    )}

                    {group.messages.map((msg, mi) => (
                      <div
                        key={mi}
                        className={`px-3.5 py-2 text-sm mb-0.5 ${
                          group.isOwn
                            ? 'bg-white text-gray-900 rounded-2xl rounded-br-md'
                            : 'bg-gray-800/60 text-gray-200 rounded-2xl rounded-bl-md border border-gray-800/40'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    ))}

                    {/* Timestamp on last message of group */}
                    <span className={`text-[10px] text-gray-600 mt-0.5 ${group.isOwn ? 'mr-1' : 'ml-1'}`}>
                      {formatTime(group.messages[group.messages.length - 1].timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 pl-2 py-1">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-gray-600">
              {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-5 py-3 border-t border-gray-800/60 bg-gray-950/50 backdrop-blur-sm">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              id="chat-input"
              className="w-full px-4 py-3 bg-gray-800/60 border border-gray-800/60 text-white rounded-xl focus:outline-none focus:border-gray-700 placeholder:text-gray-600 resize-none text-sm leading-relaxed scrollbar-thin"
              placeholder="Type a message..."
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ maxHeight: '120px', minHeight: '44px' }}
            />
          </div>
          <button
            id="chat-send-btn"
            className={`p-3 rounded-xl transition-all flex-shrink-0 ${
              message.trim()
                ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg shadow-white/10'
                : 'bg-gray-800/60 text-gray-600 cursor-not-allowed'
            }`}
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <FiSend className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-700 mt-1.5 ml-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatPage;
