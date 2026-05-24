import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-errors';
import { getHomepageData } from '@/lib/homepage-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getHomepageData();
    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}
