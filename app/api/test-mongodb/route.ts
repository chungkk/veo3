import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Story from '@/lib/models/Story';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    await connectDB();
    console.log('MongoDB connected successfully');
    
    // Try to count documents
    const count = await Story.countDocuments();
    console.log(`Found ${count} stories in database`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'MongoDB connected',
      storiesCount: count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to connect to MongoDB',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
