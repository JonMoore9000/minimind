import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, age, favorites } = await req.json();
    const params = await context.params;
    const profileId = params.id;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Update child profile (RLS ensures user can only update their own profiles)
    const { data: profile, error } = await supabase
      .from('child_profiles')
      .update({
        name: name.trim(),
        age: age || null,
        favorites: favorites || {},
      })
      .eq('id', profileId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating child profile:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params;
    const profileId = params.id;

    // Delete child profile (RLS ensures user can only delete their own profiles)
    const { error } = await supabase
      .from('child_profiles')
      .delete()
      .eq('id', profileId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting child profile:', error)
      return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
