const SESSION_KEY = 'langflow-rag-session-id'

export function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY)
  if (!id) {
    id = `ui-session-${Date.now()}`
    sessionStorage.setItem(SESSION_KEY, id)
  }
  return id
}

// Digs through Langflow's response envelope for the answer text.
// Returns { text, raw } — text is null when the shape didn't match,
// so the caller can fall back to showing the raw JSON.
function extractAnswer(data) {
  try {
    const text = data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text
    if (typeof text === 'string' && text.length > 0) {
      return { text, raw: data }
    }
  } catch {
    // fall through to raw fallback below
  }
  return { text: null, raw: data }
}

export async function askLangflow(question) {
  const sessionId = getSessionId()

  let response
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        output_type: 'chat',
        input_type: 'chat',
        input_value: question,
        session_id: sessionId,
      }),
    })
  } catch {
    throw new Error(
      'Langflow backend is not reachable. Please make sure Langflow is running on port 7860.',
    )
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error('Invalid or missing Langflow API key — check your .env file.')
  }

  if (!response.ok) {
    let detail = `Langflow request failed (${response.status})`
    try {
      const body = await response.json()
      detail = body?.detail || body?.message || detail
    } catch {
      // response body wasn't JSON — keep the generic detail message
    }
    throw new Error(detail)
  }

  const data = await response.json()
  return extractAnswer(data)
}
