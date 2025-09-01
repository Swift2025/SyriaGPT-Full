// src/app/[lang]/components/ChatPageClient.tsx
'use client';

import React, { useState } from 'react';
import MainContent from './MainContent';
import { Message, FileAttachment } from '../types';

interface ChatPageClientProps {
  toggleSidebar?: () => void;
  dictionary: any; // القاموس الذي تم تمريره
}

export default function ChatPageClient({ toggleSidebar, dictionary }: ChatPageClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  
  const handleSendMessage = async () => {
    // ... كل منطق إرسال الرسائل الخاص بك يبقى هنا كما هو تماماً ...
    const content = inputMessage.trim();
    const files = attachedFiles;

    if ((!content && files.length === 0) || isLoading) return;

    setIsLoading(true);
    setInputMessage('');
    setAttachedFiles([]);

    const userMessage: Message = { 
      id: Date.now().toString(), 
      content, 
      sender: 'user', 
      timestamp: new Date(),
      attachments: files,
    };

    const typingMessage: Message = { 
      id: 'typing', 
      content: '', 
      sender: 'bot', 
      timestamp: new Date(), 
      isTyping: true 
    };

    setMessages(prev => [...prev, userMessage, typingMessage]);

    try {
      let responseText = '';
      
      if (files.length > 0) {
        const formData = new FormData();
        formData.append('message', content);
        files.forEach(f => formData.append('file', f.file, f.name));
        const response = await fetch('/api/files', { method: 'POST', body: formData });
        const data = await response.json();
        responseText = data.success ? data.analysis : `عذراً، ${data.error || 'حدث خطأ في تحليل الملف'}`;
      } else {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: content, conversationHistory: messages.slice(-10) }),
        });
        const data = await response.json();
        responseText = data.message || 'عذراً، حدث خطأ في معالجة الرد.';
      }

      setMessages(prev => {
        const messagesWithoutTyping = prev.filter(msg => msg.id !== 'typing');
        const botResponse: Message = { id: (Date.now() + 1).toString(), content: responseText, sender: 'bot', timestamp: new Date() };
        return [...messagesWithoutTyping, botResponse];
      });

    } catch (error) {
      console.error('💥 خطأ في الشبكة:', error);
      const errorMessage: Message = { id: (Date.now() + 1).toString(), content: 'عذراً، حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.', sender: 'bot', timestamp: new Date() };
      setMessages(prev => [...prev.filter(msg => msg.id !== 'typing'), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainContent
      dictionary={dictionary} // مرر القاموس إلى المحتوى الرئيسي
      messages={messages}
      inputMessage={inputMessage}
      setInputMessage={setInputMessage}
      attachedFiles={attachedFiles}
      setAttachedFiles={setAttachedFiles}
      handleSendMessage={handleSendMessage}
      isLoading={isLoading}
      toggleSidebar={toggleSidebar || (() => {})}
    />
  );
}