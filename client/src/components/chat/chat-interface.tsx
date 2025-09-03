import { useState, useRef, useEffect } from "react";
import { Send, User } from "lucide-react";
import { useSocketEvent } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

interface Conversation {
  id: string;
  other_user: {
    id: string;
    name: string;
  };
  order_id: string;
  last_message?: Message;
  unread_count: number;
}

interface ChatInterfaceProps {
  conversations: Conversation[];
  selectedConversation?: Conversation;
  onSelectConversation: (conversation: Conversation) => void;
  className?: string;
}

export function ChatInterface({
  conversations,
  selectedConversation,
  onSelectConversation,
  className,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useSocketEvent("new_message", (message: Message) => {
    if (selectedConversation && 
        (message.sender_id === selectedConversation.other_user.id || 
         message.receiver_id === selectedConversation.other_user.id)) {
      setMessages(prev => [...prev, message]);
    }
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const messageData = {
      order_id: selectedConversation.order_id,
      receiver_id: selectedConversation.other_user.id,
      content: newMessage.trim(),
    };

    setLoading(true);
    try {
      // Emit via Socket.IO
      const socket = (window as any).socketService?.getSocket();
      if (socket) {
        socket.emit("send_message", messageData);
      }

      // Add to local state optimistically
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        receiver_id: selectedConversation.other_user.id,
        content: newMessage.trim(),
        created_at: new Date().toISOString(),
        sender_name: user.name,
      };

      setMessages(prev => [...prev, tempMessage]);
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastMessage = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} dakika önce`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)} saat önce`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)} gün önce`;
    } else {
      return date.toLocaleDateString("tr-TR");
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${className}`}>
      {/* Conversations List */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-card-foreground">Konuşmalar</h3>
        </div>
        <ScrollArea className="h-80">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              Henüz konuşma yok
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 border-b border-border hover:bg-accent cursor-pointer transition-colors ${
                  selectedConversation?.id === conversation.id ? "bg-accent" : ""
                }`}
                data-testid={`chat-item-${conversation.id}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-card-foreground">
                      {conversation.other_user.name}
                    </p>
                    {conversation.last_message && (
                      <>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.last_message.content}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatLastMessage(conversation.last_message.created_at)}
                        </p>
                      </>
                    )}
                  </div>
                  {conversation.unread_count > 0 && (
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-2 bg-card rounded-lg border border-border flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">
                    {selectedConversation.other_user.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sipariş #{selectedConversation.order_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4" data-testid="chat-messages">
                {messages.map((message) => {
                  const isSent = message.sender_id === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`chat-bubble p-3 rounded-lg max-w-[70%] ${
                        isSent
                          ? "chat-bubble sent ml-auto bg-primary text-primary-foreground"
                          : "chat-bubble received bg-muted text-muted-foreground"
                      }`}
                      data-testid={`message-${message.id}`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        isSent ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {formatTime(message.created_at)}
                      </p>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Mesajınızı yazın..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={loading}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={loading || !newMessage.trim()}
                  size="icon"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Mesajlaşmaya başlamak için bir konuşma seçin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
