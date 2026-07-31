const STAGES = [
  'File',
  'Parser',
  'Chunking',
  'Mistral Embeddings',
  'ChromaDB (top 10)',
  'Prompt',
  'Groq',
  'Answer',
]

export default function PipelineBanner() {
  return (
    <div className="pipeline-banner">
      {STAGES.map((stage, i) => (
        <span key={stage} className="pipeline-stage">
          {stage}
          {i < STAGES.length - 1 && <span className="pipeline-arrow">→</span>}
        </span>
      ))}
    </div>
  )
}
