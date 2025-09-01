// src/app/types.ts
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  file: File;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
  attachments?: FileAttachment[];
}