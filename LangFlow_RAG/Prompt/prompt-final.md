# Langflow RAG Demo UI — Final Prompt (Langflow as Backend)

I want you to create a **lightweight React chat UI that demonstrates my Langflow Naive RAG pipeline** for an e-commerce QA test case repository.

My Langflow instance is already running locally at `http://localhost:7860`, and the flow does all the RAG work internally (File → Parser → Split Text → Mistral Embeddings → ChromaDB → Retrieval → Prompt Template → Groq `llama-3.3-70b-versatile` → Chat Output). The UI must NOT re-implement any RAG logic — it only sends the user's question to Langflow and displays the answer.

The Langflow REST API is already verified and working with the following contract:

- **Endpoint:** `POST http://localhost:7860/api/v1/run/363457f8-c1d3-4c0e-879d-c63ce21e5db1?stream=false`
- **Headers:** `Content-Type: application/json` and `x-api-key: <LANGFLOW_API_KEY>`
- **Request body:**

  ```json
  {
    "output_type": "chat",
    "input_type": "chat",
    "input_value": "<user question>",
    "session_id": "<session id>"
  }
  ```

- **Answer location in response:** `outputs[0].outputs[0].results.message.text`

The application should do the following:

1. Provide a clean chat-style interface where I can ask questions about my e-commerce test case repository.
2. Show these three sample questions as clickable suggestion chips above the input box (clicking one sends it immediately):
   - "Show me critical priority checkout test cases that are automated"
   - "show me scenario 47 from cart"
   - "what test cases cover refunds via UPI?"
3. On submit, call the Langflow REST API exactly as per the contract above. Read all values from a `.env` file — never hardcode them:
   - `VITE_LANGFLOW_BASE_URL=http://localhost:7860`
   - `VITE_LANGFLOW_FLOW_ID=363457f8-c1d3-4c0e-879d-c63ce21e5db1`
   - `VITE_LANGFLOW_API_KEY=<my key>`
4. Generate a `session_id` once per browser session (e.g., `ui-session-<timestamp>`) and reuse it for all messages in that session, so Langflow keeps the conversation in one chat history thread.
5. Parse the response defensively and extract the answer from `outputs[0].outputs[0].results.message.text`. If the structure is missing or different, fall back to showing the raw JSON in a collapsible "Raw response" block so the demo never shows a blank bubble.
6. Display the conversation as chat bubbles (user question / AI answer) with timestamps and a typing/loading indicator while Langflow is processing. Render the AI answer as Markdown, since the flow returns formatted lists of test cases (TID, Priority, Description).
7. Show a static "pipeline banner" at the top of the UI: File → Parser → Chunking → Mistral Embeddings → ChromaDB (top 10) → Prompt → Groq → Answer — so the demo audience can see what happens behind the scenes inside Langflow.
8. Handle errors gracefully:
   - Connection refused / network error → "Langflow backend is not reachable. Please make sure Langflow is running on port 7860."
   - `401/403` → "Invalid or missing Langflow API key — check your .env file."
   - `4xx/5xx` with a detail message → show that message in the chat.
9. Configure the Vite dev server proxy so browser requests to `/api` are forwarded to `http://localhost:7860`, avoiding CORS issues — and attach the `x-api-key` header on the proxy/server side rather than exposing it in browser network calls where possible.
10. Keep the stack minimal: Vite + React (plus a small Markdown renderer like `react-markdown`). No database, no embedding libraries, no LLM SDKs. The only external runtime dependency is the running Langflow instance.

The goal of this application is to demonstrate my actual Langflow flow working end-to-end through a real UI — Langflow acts as the complete RAG backend, and this app is just a thin presentation layer over its verified REST API.
