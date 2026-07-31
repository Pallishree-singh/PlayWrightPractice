import { useState } from 'react'
import PipelineBanner from './components/PipelineBanner.jsx'
import SuggestionChips from './components/SuggestionChips.jsx'
import ChatBubble from './components/ChatBubble.jsx'
import { askLangflow } from './lib/langflow.js'

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send(question) {
    const trimmed = question.trim()
    if (!trimmed || loading) return

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed, timestamp: Date.now() },
    ])
    setInput('')
    setLoading(true)

    try {
      const { text, raw } = await askLangflow(trimmed)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text, raw, timestamp: Date.now() },
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: err.message, isError: true, timestamp: Date.now() },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Langflow RAG Explorer</h1>
        <p className="subtitle">E-commerce test case repository — powered by your Langflow pipeline</p>
      </header>

      <PipelineBanner />

      <main className="chat-window">
        {messages.length === 0 && (
          <p className="empty-hint">Ask a question or pick a suggestion below to get started.</p>
        )}
        {messages.map((m, i) => (
          <ChatBubble key={i} {...m} />
        ))}
        {loading && (
          <div className="bubble bubble-assistant bubble-typing">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}
      </main>

      <SuggestionChips onPick={send} disabled={loading} />

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the test case repository..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
