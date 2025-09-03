import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { Conversation } from "@/types";

export default function CustomerMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | undefined>();
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { connected } = useSocket();

  // Mock conversations for demonstration
  const mockConversations: Conversation[] = [
    {
      id: "conv1",
      order_id: "ORD-2024-001",
      other_user: {
        id: "producer1",
        name: "Mehmet Özkan",
      },
      last_message: {
        id: "msg1",
        order_id: "ORD-2024-001",
        sender_id: "producer1",
        receiver_id: "user1",
        content: "Merhaba! Siparişinizi aldım. Yaklaşık 2 gün içinde tamamlayabilirim.",
        is_read: false,
        created_at: "2024-01-15T16:30:00Z",
      },
      unread_count: 1,
    },
    {
      id: "conv2",
      order_id: "ORD-2024-002",
      other_user: {
        id: "producer2",
        name: "Ayşe Demir",
      },
      last_message: {
        id: "msg2",
        order_id: "ORD-2024-002",
        sender_id: "user1",
        receiver_id: "producer2",
        content: "Teşekkür ederim, mükemmel olmuş!",
        is_read: true,
        created_at: "2024-01-13T18:00:00Z",
      },
      unread_count: 0,
    },
  ];

  useEffect(() => {
    // Load conversations from API
    const loadConversations = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        setConversations(mockConversations);
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadConversations();
    }
  }, [user]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    
    // Mark as read
    setConversations(prev => 
      prev.map(conv => 
        conv.id === conversation.id 
          ? { ...conv, unread_count: 0 }
          : conv
      )
    );
  };

  if (loading) {
    return (
      <div className="space-y-8" data-testid="messages-loading">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-card-foreground mb-2">Mesajlar</h2>
          <p className="text-muted-foreground">Üreticilerle iletişim kurun ve siparişlerinizi görüşün.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Konuşmalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="customer-messages">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Mesajlar</h2>
        <p className="text-muted-foreground">
          Üreticilerle iletişim kurun ve siparişlerinizi görüşün.
          {connected && (
            <span className="ml-2 text-green-600 text-sm">● Bağlı</span>
          )}
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Henüz mesaj bulunmuyor</h3>
          <p className="text-muted-foreground">
            Sipariş oluşturduğunuzda üreticilerle mesajlaşmaya başlayabilirsiniz.
          </p>
        </div>
      ) : (
        <ChatInterface
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={handleSelectConversation}
          className="h-96"
        />
      )}
    </div>
  );
}
