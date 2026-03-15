import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use service role client to bypass RLS
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );

    if (!serviceSupabase) {
      console.error('Supabase not configured');
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    console.log('Fetching braiders from braider_profiles table...');

    // Fetch all braiders from braider_profiles table
    const { data, error } = await serviceSupabase
      .from('braider_profiles')
      .select('*')
      .order('rating_avg', { ascending: false });

    console.log('Braiders fetch result:', { dataCount: data?.length, error });

    if (error) {
      console.error('Error fetching braiders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map data to include all fields
    const braiders = (data || []).map((b: any) => ({
      id: b.id || b.user_id,
      user_id: b.user_id,
      full_name: b.full_name || '',
      email: b.email || '',
      avatar_url: b.avatar_url || null,
      bio: b.bio || '',
      experience_years: b.experience_years || 0,
      rating_avg: b.rating_avg || 5.0,
      rating_count: b.rating_count || 0,
      verification_status: b.verification_status || 'unverified',
      travel_radius_miles: b.travel_radius_miles || 10,
      is_mobile: b.is_mobile || false,
      salon_address: b.salon_address || '',
      specialties: b.specialties || [],
      latitude: b.latitude || null,
      longitude: b.longitude || null,
      services: [],
      portfolio: [],
      total_earnings: b.total_earnings || 0,
      available_balance: b.available_balance || 0,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));

    console.log(`Returning ${braiders.length} braiders`);
    return NextResponse.json(braiders);
  } catch (error) {
    console.error('Braiders API error:', error);
    return NextResponse.json({ error: 'Failed to fetch braiders' }, { status: 500 });
  }
}
