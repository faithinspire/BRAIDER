'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuthStore } from '@/store/supabaseAuthStore';
import { supabase } from '@/lib/supabase';
import { Send, Check, CheckCheck } from 'lucide-react';
import { useConversationSubscription } from '@/app/hooks/useConversationSubscription';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface Conversation {
  id: string;
  booking_id: string;
  customer_id: string;
  braider_id: string;
  status: 'active' | 'completed' | 'archived';
  braider_name?: string;
  braider_avatar?: string;
}

export default function CustomerChatPage() {
  const router = useRouter();
  const params = useParams();
  const booking_id = params?.booking_id as string;
  const { user, loading: authLoading } = useSupabaseAuthStore();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isConnected } = useConversationSubscription(
    booking_id,
    (newMsg: any) => {
      setMessages((prev) => [...prev, newMsg as Message]);
      setConnectionStatus('connected');
    },
    () => {},
    () => {}
  );

  useEffect(() => {
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'customer')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !booking_id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!supabase) {
          throw new Error('Supabase not initialized');
        }

        const { data: convData, error: convErr } = await supabase
          .from('conversations')
          .select('*')
          .eq('booking_id', booking_id)
          .eq('customer_id', user.id)
          .single();

        if (convErr) throw convErr;
        setConversation(convData);

        const { data: msgData, error: msgErr } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', convData.id)
          .order('created_at', { ascending: true });

        if (msgErr) throw msgErr;
        setMessages(msgData || []);

        await supabase
          .from('messages')
          .update({ is_read: true })
          .eq('conversation_id', convData.id)
          .neq('sender_id', user.id);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, booking_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation) return;

    try {
      setSending(true);
      setError(null);

      if (!supabase) {
        throw new Error('Supabase not initialized');
      }

      const { error: err } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        content: newMessage,
        is_read: false,
      });

      if (err) throw err;
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return null;
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">This conversation could not be found.</p>
          <button
            onClick={() => router.push('/messages')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="p-4 flex items-center justify-between">
            <button
              onClick={() => router.push('/messages')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <div className="flex-1 text-center">
              <h1 className="font-semibold text-gray-900">
                {conversation.braider_name || 'Braider'}
              </h1>
              <p className="text-xs text-gray-500">
                {connectionStatus === 'connected' ? (
                  <span className="text-green-600">● Connected</span>
                ) : (
                  <span className="text-gray-500">● Connecting...</span>
                )}
              </p>
            </div>
            <div className="w-8"></div>
          </div>
        </div>

        <div className="p-4 space-y-4 min-h-[calc(100vh-200px)]">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender_id === user.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {msg.sender_id === user.id && (
                      msg.is_read ? (
                        <CheckCheck className="w-3 h-3" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-2xl mx-auto">
            {error && (
              <div className="mb-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                {error}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
