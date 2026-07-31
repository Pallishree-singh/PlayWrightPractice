const SUGGESTIONS = [
  'Show me critical priority checkout test cases that are automated',
  'show me scenario 47 from cart',
  'what test cases cover refunds via UPI?',
]

export default function SuggestionChips({ onPick, disabled }) {
  return (
    <div className="chips">
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          className="chip"
          disabled={disabled}
          onClick={() => onPick(s)}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
