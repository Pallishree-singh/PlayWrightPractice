# MCP Inspector Guide — Playwright MCP

## Start the Inspector

```powershell
npx @modelcontextprotocol/inspector npx @playwright/mcp@latest
```

## Open the Web UI

After running the command, copy the session token from the terminal output and open:

```
http://localhost:6274/?token=<your_session_token>
```

**Example output from terminal:**
```
Starting MCP inspector...
⚙️ Proxy server listening on localhost:6277
🔑 Session token: cf935d5a9d05bde08811713b57ff0cd540d738598cf4dbb764a8665d48f4a1b1
```

## Inspector Settings

| Field          | Value                   |
|----------------|-------------------------|
| Transport Type | STDIO                   |
| Command        | `npx`                   |
| Arguments      | `@playwright/mcp@latest`|
| Proxy Port     | `6277`                  |
| Web UI Port    | `6274`                  |

## Restart the Inspector (if ports are in use)

Run this one-liner in PowerShell to kill existing processes and restart:

```powershell
(netstat -ano | Select-String ":6274|:6277") -replace '.*\s+(\d+)$','$1' | Sort-Object -Unique | ForEach-Object { taskkill /PID $_ /F }; npx @modelcontextprotocol/inspector npx @playwright/mcp@latest
```

## Common Errors

### ❌ Error Connecting to MCP Inspector Proxy
**Cause:** Proxy server is not running or session token is missing/expired.  
**Fix:**
1. Check the terminal is still running (proxy must stay alive).
2. Use the token from the terminal in the URL: `http://localhost:6274/?token=<token>`

### ❌ MCP Inspector PORT IS IN USE
**Cause:** A previous inspector instance is still occupying port 6274.  
**Fix:** Use the restart command above to kill the old process and relaunch.

## Notes

- Keep the terminal open — closing it stops the proxy and breaks the connection.
- A new session token is generated every time you restart the inspector.
- Always use the latest token from the terminal output in your browser URL.
