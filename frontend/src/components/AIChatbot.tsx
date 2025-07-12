'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AIChatbotProps {
  // No props needed - using environment variables
}

const AIChatbot: React.FC<AIChatbotProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your CHILLSWIPE AI assistant. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Vertex AI API call
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Sorry, I cannot respond at the moment.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, an error occurred. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="ai-chatbot-container">
      {/* Chatbot Button */}
      <button
        className={`ai-chatbot-button ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Chatbot"
      >
        <MessageCircle size={24} />
        <span className="ai-chatbot-button-text">AI Assistant</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="ai-chatbot-window">
          {/* Header */}
          <div className="ai-chatbot-header">
            <div className="ai-chatbot-header-content">
              <Bot size={20} className="ai-chatbot-icon" />
              <span className="ai-chatbot-title">CHILLSWIPE AI</span>
            </div>
            <button
              className="ai-chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="ai-chatbot-messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-message ${message.isUser ? 'user-message' : 'ai-message'}`}
              >
                <div className="ai-message-content">
                  <div className="ai-message-text">{message.text}</div>
                  <div className="ai-message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                <div className="ai-message-avatar">
                  {message.isUser ? <User size={16} /> : <Bot size={16} />}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-message ai-message">
                <div className="ai-message-content">
                  <div className="ai-message-text">
                    <div className="ai-typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
                <div className="ai-message-avatar">
                  <Bot size={16} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-chatbot-input-container">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="ai-chatbot-input"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="ai-chatbot-send"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChatbot; 