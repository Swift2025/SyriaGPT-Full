import React from 'react';
import { useChatStore } from '../store/chatStore';
import ChatHistory from './ChatHistory';
import MessageInput from './MessageInput';
import RelatedQuestions from './RelatedQuestions';

export default function ChatInterface() {
  const { fetchAnswer, relatedQuestions, isLoading } = useChatStore();

  const handleSendMessage = (message: string) => {
    fetchAnswer(message);
  };

  const handleQuestionClick = (question: string) => {
    fetchAnswer(question);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 text-center">
        <h1 className="text-xl font-bold">SyriaGPT - الذكاء الاصطناعي لسوريا</h1>
        <p className="text-blue-100 text-sm mt-1">اسألني أي شيء عن سوريا</p>
      </div>

      {/* Chat History */}
      <ChatHistory />

      {/* Related Questions */}
      <RelatedQuestions 
        questions={relatedQuestions} 
        onQuestionClick={handleQuestionClick} 
      />

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage} 
        isLoading={isLoading}
        placeholder="اكتب سؤالك هنا..."
      />
    </div>
  );
}
