import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processFile } from '@/lib/utils/fileProcessing';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const messageId = formData.get('messageId') as string;
    const category = formData.get('category') as 'image' | 'document' | 'spreadsheet' | 'other';
    const extractedText = formData.get('extractedText') as string | null;
    const width = formData.get('width') as string | null;
    const height = formData.get('height') as string | null;

    if (!file || !messageId || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: file, messageId, category' },
        { status: 400 }
      );
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${messageId}/${Date.now()}.${fileExt}`;
    const storageBucket = 'chat-attachments';

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(storageBucket)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL for the file (optional, for image previews)
    const { data: urlData } = supabase.storage
      .from(storageBucket)
      .getPublicUrl(fileName);

    // Save file metadata to database
    const { data: attachmentData, error: dbError } = await supabase
      .from('file_attachments')
      .insert({
        message_id: messageId,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_category: category,
        storage_path: fileName,
        storage_bucket: storageBucket,
        extracted_text: extractedText,
        width: width ? parseInt(width) : null,
        height: height ? parseInt(height) : null,
        processing_status: 'completed',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);

      // Clean up uploaded file if database insert fails
      await supabase.storage.from(storageBucket).remove([fileName]);

      return NextResponse.json(
        { error: `Failed to save file metadata: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attachment: {
        ...attachmentData,
        publicUrl: urlData.publicUrl,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
