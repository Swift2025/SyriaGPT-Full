'use client';

import React from 'react';
import ChatInterface from '../components/ChatInterface';

interface IntelligentQAClientProps {
  dictionary: Record<string, unknown>;
}

export default function IntelligentQAClient({ dictionary: _dictionary }: IntelligentQAClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        <ChatInterface />
      </div>
    </div>
  );
}
