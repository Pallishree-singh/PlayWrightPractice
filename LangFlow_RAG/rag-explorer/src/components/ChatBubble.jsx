import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBubble({ role, text, raw, isError, timestamp }) {
  const showRawFallback = role === 'assistant' && !isError && !text && raw

  return (
    <div className={`bubble bubble-${role}${isError ? ' bubble-error' : ''}`}>
      <div className="bubble-content">
        {isError ? (
          <p>{text}</p>
        ) : (
          text && <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        )}
        {showRawFallback && (
          <details className="raw-response">
            <summary>Raw response</summary>
            <pre>{JSON.stringify(raw, null, 2)}</pre>
          </details>
        )}
      </div>
      <div className="bubble-time">{formatTime(timestamp)}</div>
    </div>
  )
}
