import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return NextResponse.json({ 
        error: 'يرجى إدخال سؤال صحيح.' 
      }, { status: 400 });
    }

    const userQuestion = question.trim();

    // TODO: Replace this with actual backend integration
    // For now, we'll simulate the response structure
    // In production, this should call your Python backend at /intelligent-qa
    
    // Simulate API call to backend
    try {
      const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/intelligent-qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userQuestion }),
      });

      if (!backendResponse.ok) {
        throw new Error(`Backend responded with status: ${backendResponse.status}`);
      }

      const data = await backendResponse.json();
      
      return NextResponse.json({
        answer: data.answer,
        related_questions: data.related_questions || [],
        timestamp: new Date().toISOString(),
      });

    } catch (backendError) {
      console.error('Backend API error:', backendError);
      
      // Fallback response for development/testing
      const fallbackAnswer = `أعتذر، لا يمكنني الوصول إلى قاعدة المعرفة حالياً. السؤال الذي طرحته هو: "${userQuestion}". يرجى المحاولة مرة أخرى لاحقاً.`;
      
      const fallbackRelatedQuestions = [
        "ما هي عاصمة سوريا؟",
        "ما هي أهم المعالم التاريخية في سوريا؟",
        "ما هي الأطباق التقليدية السورية؟"
      ];

      return NextResponse.json({
        answer: fallbackAnswer,
        related_questions: fallbackRelatedQuestions,
        timestamp: new Date().toISOString(),
        note: "This is a fallback response. Backend integration required."
      });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in intelligent-qa API:', errorMessage);
    
    return NextResponse.json({
      error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'SyriaGPT Intelligent Q&A API',
    status: 'active',
    endpoint: '/intelligent-qa',
    method: 'POST',
    timestamp: new Date().toISOString(),
  });
}
