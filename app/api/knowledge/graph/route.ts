import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Get complete knowledge graph (nodes + edges)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all nodes
    const { data: nodes, error: nodesError } = await supabase
      .from('knowledge_nodes')
      .select('*')
      .eq('user_id', user.id);

    if (nodesError) {
      throw nodesError;
    }

    // Get all edges
    const { data: edges, error: edgesError } = await supabase
      .from('knowledge_edges')
      .select('*')
      .eq('user_id', user.id);

    if (edgesError) {
      throw edgesError;
    }

    // Get contradictions
    const { data: contradictions, error: contradictionsError } = await supabase
      .from('belief_contradictions')
      .select('*')
      .eq('user_id', user.id)
      .eq('resolved', false);

    if (contradictionsError) {
      throw contradictionsError;
    }

    return NextResponse.json({
      nodes: nodes || [],
      edges: edges || [],
      contradictions: contradictions || [],
      stats: {
        totalNodes: nodes?.length || 0,
        totalEdges: edges?.length || 0,
        unresolvedContradictions: contradictions?.length || 0,
        nodesByType: nodes?.reduce((acc: any, node: any) => {
          acc[node.node_type] = (acc[node.node_type] || 0) + 1;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error fetching knowledge graph:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge graph' },
      { status: 500 }
    );
  }
}
