import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSocket } from '../context/SocketContext';
import { fetchMessages, addMessage, setTypingUser, removeTypingUser, clearChat } from '../features/chat/chatSlice';
import { FiSend, FiMessageCircle } from 'react-icons/fi';

const ChatPage = ({ teamId, currentUser }) => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { messages: chat, isLoading, isLoadingMore, pagination, typingUsers } = useSelector(state => state.chat);
  const [message, setMessage] = useState('');

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  useEffect(() => {
    if (!teamId || !currentUser || !socket) return;

    socket.emit('joinTeamRoom', teamId);

    const handleReceiveMessage = (newMsg) => {
      dispatch(addMessage(newMsg));
    };

    const handleUserTyping = ({ userId, userName }) => {
      if (userId !== currentUser?._id) {
        dispatch(setTypingUser({ userId, userName }));
        setTimeout(() => {
          dispatch(removeTypingUser(userId));
        }, 3000);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('userTyping', handleUserTyping);

    dispatch(fetchMessages({ teamId, page: 1 }));

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('userTyping', handleUserTyping);
      socket.emit('leaveRoom', teamId);
      dispatch(clearChat());
    };
  }, [teamId, currentUser, currentUser?._id, socket, dispatch]);

  const handleScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container || isLoadingMore || !pagination.hasMore) return;

    if (container.scrollTop < 100) {
      const nextPage = pagination.page + 1;
      dispatch(fetchMessages({ teamId, page: nextPage }));
    }
  }, [isLoadingMore, pagination, teamId, dispatch]);

  useEffect(() => {
    if (!isLoading && !isLoadingMore) {
      scrollToBottom(!isLoading);
    }
  }, [chat.length, scrollToBottom, isLoading, isLoadingMore]);

  const handleSend = () => {
    if (!message.trim() || !currentUser || !socket) return;

    socket.emit('sendMessage', {
      content: message,
      teamId,
    });
    setMessage('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socket) {
      socket.emit('typing', { teamId, userId: currentUser?._id, userName: currentUser?.name });
    }
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  const getMessageGroups = () => {
    const groups = [];
    let currentGroup = null;

    chat.forEach((msg, index) => {
      const senderId = msg.senderId?._id || msg.senderId;
      const timestamp = new Date(msg.timestamp);
      const prevMsg = index > 0 ? chat[index - 1] : null;
      const prevTimestamp = prevMsg ? new Date(prevMsg.timestamp) : null;

      const showDateDivider = !prevMsg || (
        prevTimestamp &&
        timestamp.toDateString() !== prevTimestamp.toDateString()
      );

      if (showDateDivider) {
        groups.push({ type: 'date-divider', date: timestamp });
      }

      const prevSenderId = prevMsg?.senderId?._id || prevMsg?.senderId;
      const timeDiff = prevTimestamp ? (timestamp - prevTimestamp) / 1000 / 60 : Infinity;

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

  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

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
      <div className="px-5 py-3 border-b border-gray-800/60 bg-gray-950/50 backdrop-blur-sm flex items-center gap-3">
        <div className="p-2 bg-gray-800/60 rounded-xl">
          <FiMessageCircle className="text-lg text-gray-400" />
        </div>
        <div>
          <h2 className="font-semibold text-white text-sm">Team Chat</h2>
          <p className="text-xs text-gray-600">{pagination.total || chat.length} messages</p>
        </div>
      </div>

      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 space-y-1 scrollbar-thin"
      >
        {pagination.hasMore && (
          <div className="text-center py-3">
            {isLoadingMore ? (
              <div className="w-6 h-6 border-2 border-gray-700 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              <button
                onClick={() => dispatch(fetchMessages({ teamId, page: pagination.page + 1 }))}
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
                  {!group.isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0 mt-auto">
                      {group.senderName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}

                  <div className={`flex flex-col ${group.isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
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

                    <span className={`text-[10px] text-gray-600 mt-0.5 ${group.isOwn ? 'mr-1' : 'ml-1'}`}>
                      {formatTime(group.messages[group.messages.length - 1].timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

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
