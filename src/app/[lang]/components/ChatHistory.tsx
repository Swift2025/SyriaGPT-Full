import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import MessageBubble from './MessageBubble';
import LoadingIndicator from './LoadingIndicator';

export default function ChatHistory() {
  const { chatHistory, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  if (chatHistory.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">🇸🇾</div>
          <h3 className="text-xl font-semibold mb-2">مرحباً بك في SyriaGPT</h3>
          <p className="text-gray-400">اسألني أي شيء عن سوريا وسأجيبك بكل ما أعرف</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {chatHistory.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      
      {isLoading && <LoadingIndicator />}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
