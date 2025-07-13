import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 Test API called');
  return NextResponse.json({ 
    message: 'API routes are working!',
    timestamp: new Date().toISOString()
  });
} 