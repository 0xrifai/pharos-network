import { NextRequest } from 'next/server'
import { createSSEResponse } from '@/scripts/utils/realtime-logger'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const { taskId } = params

  if (!taskId) {
    return new Response('Task ID is required', { status: 400 })
  }

  return createSSEResponse(taskId)
} 