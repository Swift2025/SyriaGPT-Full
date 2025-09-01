import React from 'react';

interface RelatedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export default function RelatedQuestions({ questions, onQuestionClick }: RelatedQuestionsProps) {
  if (questions.length === 0) return null;

  return (
    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
      <p className="text-sm text-gray-600 mb-3 text-center">أسئلة ذات صلة:</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onQuestionClick(question)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}
