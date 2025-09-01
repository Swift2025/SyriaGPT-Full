import { create } from 'zustand';

export interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface ChatState {
  chatHistory: Message[];
  isLoading: boolean;
  error: string | null;
  relatedQuestions: string[];
  
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRelatedQuestions: (questions: string[]) => void;
  clearError: () => void;
  clearChat: () => void;
  
  // Async actions
  fetchAnswer: (question: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chatHistory: [],
  isLoading: false,
  error: null,
  relatedQuestions: [],

  addMessage: (message) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    set((state) => ({ 
      chatHistory: [...state.chatHistory, newMessage] 
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  setRelatedQuestions: (questions) => set({ relatedQuestions: questions }),
  
  clearError: () => set({ error: null }),
  
  clearChat: () => set({ 
    chatHistory: [], 
    relatedQuestions: [], 
    error: null 
  }),

  fetchAnswer: async (question: string) => {
    const { addMessage, setLoading, setError, setRelatedQuestions } = get();
    
    // Add user question to history
    addMessage({ type: 'user', text: question });
    
    // Set loading state
    setLoading(true);
    setError(null);
    setRelatedQuestions([]);

    try {
      const response = await fetch('/api/intelligent-qa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch answer');
      }

      const data = await response.json();
      
      // Add bot response to history
      addMessage({ type: 'bot', text: data.answer });
      
      // Set related questions
      setRelatedQuestions(data.related_questions || []);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
      
      // Add error message to history
      addMessage({ type: 'bot', text: errorMessage });
    } finally {
      setLoading(false);
    }
  },
}));
