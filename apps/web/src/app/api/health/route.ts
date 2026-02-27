import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET() {
  const checks: Record<string, unknown> = {
    web: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const apiResponse = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    checks.api = await apiResponse.json();
  } catch (error) {
    checks.api = { status: 'unreachable', error: String(error) };
  }

  const apiStatus = (checks.api as Record<string, unknown>)?.status;
  const allHealthy = checks.web === 'ok' && apiStatus === 'ok';

  return NextResponse.json(
    { ...checks, status: allHealthy ? 'ok' : 'degraded' },
    { status: allHealthy ? 200 : 503 }
  );
}
