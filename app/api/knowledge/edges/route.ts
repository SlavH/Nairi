import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all knowledge edges for the user
    const { data: edges, error } = await supabase
      .from('knowledge_edges')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ edges });
  } catch (error) {
    console.error('Error fetching knowledge edges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge edges' },
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
    const { source_node_id, target_node_id, edge_type, strength } = body;

    if (!source_node_id || !target_node_id || !edge_type) {
      return NextResponse.json(
        { error: 'source_node_id, target_node_id, and edge_type are required' },
        { status: 400 }
      );
    }

    if (source_node_id === target_node_id) {
      return NextResponse.json(
        { error: 'Cannot create edge to the same node' },
        { status: 400 }
      );
    }

    // Create new knowledge edge
    const { data: edge, error } = await supabase
      .from('knowledge_edges')
      .insert({
        user_id: user.id,
        source_node_id,
        target_node_id,
        edge_type,
        strength: strength || 0.5,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ edge }, { status: 201 });
  } catch (error) {
    console.error('Error creating knowledge edge:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge edge' },
      { status: 500 }
    );
  }
}
