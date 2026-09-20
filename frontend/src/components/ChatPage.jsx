import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { MessagesSquare, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { useSocket } from '../context/SocketContext';
import { fetchMessages, addMessage, setTypingUser, removeTypingUser, clearChat } from '../features/chat/chatSlice';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Kbd } from '@/components/product/Kbd';
import { EmptyState } from '@/components/product/EmptyState';
import { UserAvatar } from '@/components/product/UserAvatar';
import { cn } from '@/lib/utils';

const ChatPage = ({ teamId, currentUser }) => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const { messages: chat, isLoading, isLoadingMore, pagination, typingUsers } = useSelector(state => state.chat);
  const [message, setMessage] = useState('');
  const [connected, setConnected] = useState(Boolean(socket?.connected));

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return undefined;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    setConnected(socket.connected);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

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

    if (!socket.connected) {
      toast.error("Message didn't send", {
        description: 'You appear to be offline. Check your connection and try again.',
      });
      return;
    }

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
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Skeleton className="h-10 w-16" />
        <p className="text-small text-muted-foreground">Connecting to chat...</p>
      </div>
    );
  }

  const messageGroups = getMessageGroups();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-surface px-5 py-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-accent text-muted-foreground">
          <MessagesSquare className="size-4" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="text-h3 font-semibold text-foreground">Team chat</h2>
          <p className="flex items-center gap-1.5 text-micro text-muted-foreground">
            <span
              className={cn(
                'size-1.5 rounded-full',
                connected ? 'bg-success' : 'bg-warning'
              )}
            />
            {connected ? 'Live' : 'Reconnecting…'}
          </p>
        </div>
        <span className="ml-auto text-micro text-faint tabular-nums">
          {pagination.total || chat.length} messages
        </span>
      </div>

      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto p-5"
      >
        {pagination.hasMore && (
          <div className="py-3 text-center">
            {isLoadingMore ? (
              <Skeleton className="mx-auto h-4 w-32" />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dispatch(fetchMessages({ teamId, page: pagination.page + 1 }))}
              >
                Load older messages
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4 p-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="w-full max-w-md space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : chat.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessagesSquare}
              title="No messages yet"
              description="Start the conversation! Send a message to your team."
              className="w-full max-w-sm"
            />
          </div>
        ) : (
          <>
            {messageGroups.map((group, i) => {
              if (group.type === 'date-divider') {
                return (
                  <div key={`date-${i}`} className="flex items-center gap-3 py-3">
                    <Separator className="flex-1" />
                    <span className="text-micro font-medium text-faint">
                      {formatDate(group.date)}
                    </span>
                    <Separator className="flex-1" />
                  </div>
                );
              }

              return (
                <div
                  key={`group-${i}`}
                  className={`mb-3 flex gap-2.5 ${group.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  {!group.isOwn && (
                    <UserAvatar name={group.senderName} size="md" className="mt-auto shrink-0" />
                  )}

                  <div className={`flex max-w-[75%] flex-col ${group.isOwn ? 'items-end' : 'items-start'}`}>
                    {!group.isOwn && (
                      <span className="mb-1 ml-1 text-small font-medium text-muted-foreground">
                        {group.senderName}
                      </span>
                    )}

                    {group.messages.map((msg, mi) => (
                      <div
                        key={mi}
                        className={`mb-0.5 px-3.5 py-2 text-small ${
                          group.isOwn
                            ? 'rounded-lg rounded-tr-sm bg-primary text-primary-foreground'
                            : 'rounded-lg rounded-tl-sm border border-border bg-surface text-foreground shadow-card'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                    ))}

                    <span className={`mt-0.5 text-micro text-faint tabular-nums ${group.isOwn ? 'mr-1' : 'ml-1'}`}>
                      {formatTime(group.messages[group.messages.length - 1].timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 py-1 pl-2">
            <div className="flex gap-1">
              <span className="size-1.5 animate-pulse rounded-full bg-faint" style={{ animationDelay: '0ms' }} />
              <span className="size-1.5 animate-pulse rounded-full bg-faint" style={{ animationDelay: '150ms' }} />
              <span className="size-1.5 animate-pulse rounded-full bg-faint" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-micro text-faint">
              {typingUsers.map(u => u.userName).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-surface px-5 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            id="chat-input"
            className="min-h-11 flex-1 resize-none"
            placeholder="Type a message..."
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{ maxHeight: '120px', minHeight: '44px' }}
          />
          <Button
            id="chat-send-btn"
            type="button"
            size="icon"
            aria-label="Send message"
            className="shrink-0"
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <SendHorizontal className="size-4" strokeWidth={1.75} />
          </Button>
        </div>
        <div className="mt-1.5 ml-1 flex items-center gap-1.5 text-micro text-faint">
          <span>Press</span>
          <Kbd>Enter</Kbd>
          <span>to send,</span>
          <Kbd>Shift+Enter</Kbd>
          <span>for new line</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
