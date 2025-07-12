import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

export async function POST(request: NextRequest) {
  try {
    console.log('=== CHAT API DEBUG START ===');
    
    // Debug environment variables
    console.log('GCP_PROJECT_ID:', process.env.GCP_PROJECT_ID);
    console.log('GCP_LOCATION:', process.env.GCP_LOCATION);
    console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'EXISTS' : 'MISSING');
    
    const body = await request.json();
    const { message } = body;
    
    console.log('Received message:', message);
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const project = process.env.GCP_PROJECT_ID;
    const location = process.env.GCP_LOCATION;

    if (!project || !location) {
      console.log('ERROR: Missing required environment variables');
      return NextResponse.json({ 
        error: 'GCP_PROJECT_ID and GCP_LOCATION environment variables must be set.',
        debug: {
          hasProjectId: !!process.env.GCP_PROJECT_ID,
          hasLocation: !!process.env.GCP_LOCATION,
          hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
        }
      }, { status: 500 });
    }

    console.log('Initializing VertexAI...');
    const vertexAI = new VertexAI({ 
      project: project, 
      location: location 
    });

    console.log('Getting generative model...');
    const generativeModel = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash', // Use Gemini Pro for general text generation
    });

    console.log('Generating content...');
    
    const systemPrompt = `You are a helpful chatbot assistant inside a fan token prediction market app called FanSwipe.

You specialize in:
- Sports content, especially football and basketball: player stats, match summaries, transfers, predictions, and general sports updates.
- App-related support, such as helping users with submitting predictions, connecting wallets, approving token usage, and swiping through active questions.

Rules:
- Respond using plain text only.
- Never use markdown formatting (*, _, #, //, tables, or code blocks).
- Be clear, concise, and beginner-friendly. Explain technical terms if needed.
- Avoid long paragraphs. Use short, scannable sentences.
- Use simple bullet points if needed (- or •), but no nested lists.

Tone:
- Friendly, energetic, and professional.
- Encourage users to explore sports topics and make predictions.
- If the topic is unrelated (e.g., politics, coding), politely say it's outside your scope.

Terminology: Always use the word "prediction" instead of "bet" when referring to market interactions. For example, say "submit a prediction" instead of "place a bet".

Recency Disclaimer: If up-to-date information is unavailable (e.g., live scores, breaking news), still provide the closest known information based on training data. Inform the user that it may not be current, but do your best to help based on recent context.

Always provide the most recent information you have access to, even if it's not completely current. If you know information up to a certain date, share that information and mention it's based on your available data. Never say "I don't know" for recent events - instead, provide the latest information you have and note it may not be completely up-to-date.`;

    const resp = await generativeModel.generateContent({
      contents: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: message }] }
      ],
    });

    const responseText = resp.response.candidates[0].content.parts[0].text;
    
    console.log('AI Response:', responseText);
    console.log('=== CHAT API DEBUG END ===');

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error('=== CHAT API ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('=== END ERROR ===');
    
    // Be more specific with error handling
    if (error instanceof Error && error.message.includes('404 Not Found')) {
      return NextResponse.json({
        error: 'Model not found or inaccessible. Please check your model name and permissions.',
        details: error.message,
        debug: {
          hasProjectId: !!process.env.GCP_PROJECT_ID,
          hasLocation: !!process.env.GCP_LOCATION,
          hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
        }
      }, { status: 404 });
    } else {
      return NextResponse.json({ 
        error: 'Failed to get AI response',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          hasProjectId: !!process.env.GCP_PROJECT_ID,
          hasLocation: !!process.env.GCP_LOCATION,
          hasCredentials: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
        }
      }, { status: 500 });
    }
  }
} 