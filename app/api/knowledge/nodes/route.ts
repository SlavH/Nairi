import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all knowledge nodes for the user
    const { data: nodes, error } = await supabase
      .from('knowledge_nodes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error('Error fetching knowledge nodes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge nodes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, node_type, confidence_score, source_type, tags } = body;

    if (!title || !node_type) {
      return NextResponse.json(
        { error: 'Title and node_type are required' },
        { status: 400 }
      );
    }

    // Create new knowledge node
    const { data: node, error } = await supabase
      .from('knowledge_nodes')
      .insert({
        user_id: user.id,
        title,
        content,
        node_type,
        confidence_score: confidence_score || 0.5,
        source_type: source_type || 'stated',
        metadata: { tags: tags || [] },
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge node:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge node' },
      { status: 500 }
    );
  }
}
