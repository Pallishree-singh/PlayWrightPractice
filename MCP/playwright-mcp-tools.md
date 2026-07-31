# Playwright MCP — Available Tools

> Source: [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)  
> Version: v0.0.78

---

## 1. Core Automation *(enabled by default)*

| Tool | Title | Description | Read-only |
|------|-------|-------------|-----------|
| `browser_click` | Click | Perform click on a web page | No |
| `browser_close` | Close browser | Close the page | No |
| `browser_console_messages` | Get console messages | Returns all console messages | Yes |
| `browser_drag` | Drag mouse | Perform drag and drop between two elements | No |
| `browser_drop` | Drop files or data | Drop files or MIME-typed data onto an element | No |
| `browser_evaluate` | Evaluate JavaScript | Evaluate JavaScript expression on page or element | No |
| `browser_file_upload` | Upload files | Upload one or multiple files | No |
| `browser_fill_form` | Fill form | Fill multiple form fields | No |
| `browser_find` | Find in page snapshot | Search the accessibility snapshot for text or regex | Yes |
| `browser_handle_dialog` | Handle a dialog | Accept or dismiss a browser dialog | No |
| `browser_hover` | Hover mouse | Hover over element on page | No |
| `browser_navigate` | Navigate to a URL | Navigate to a URL | No |
| `browser_navigate_back` | Go back | Go back to the previous page in history | No |
| `browser_network_request` | Show network request details | Returns full details of a single network request | Yes |
| `browser_network_requests` | List network requests | Returns a numbered list of network requests | Yes |
| `browser_press_key` | Press a key | Press a key on the keyboard | No |
| `browser_resize` | Resize browser window | Resize the browser window | No |
| `browser_run_code_unsafe` | Run Playwright code (unsafe) | Run arbitrary Playwright code snippet (RCE-equivalent) | No |
| `browser_select_option` | Select option | Select an option in a dropdown | No |
| `browser_snapshot` | Page snapshot | Capture accessibility snapshot of the current page | Yes |
| `browser_take_screenshot` | Take a screenshot | Take a screenshot of the current page | Yes |
| `browser_type` | Type text | Type text into editable element | No |
| `browser_wait_for` | Wait for | Wait for text to appear/disappear or time to pass | No |

---

## 2. Tab Management *(enabled by default)*

| Tool | Title | Description | Read-only |
|------|-------|-------------|-----------|
| `browser_tabs` | Manage tabs | List, create, close, or select a browser tab | No |

---

## 3. Configuration *(opt-in: `--caps=config`)*

| Tool | Title | Description | Read-only |
|------|-------|-------------|-----------|
| `browser_get_config` | Get config | Get the final resolved config after merging CLI options, env vars, and config file | Yes |

---

## 4. Network *(opt-in: `--caps=network`)*

| Tool | Title | Description | Read-only |
|------|-------|-------------|-----------|
| `browser_network_state_set` | Set network state | Set the browser network to online or offline | No |
| `browser_route` | Mock network requests | Set up a route to mock network requests matching a URL pattern | No |
| `browser_route_list` | List network routes | List all active network routes | Yes |
| `browser_unroute` | Remove network routes | Remove network routes matching a pattern (or all) | No |

---

## 5. Storage *(opt-in: `--caps=storage`)*

| Tool | Title | Description | Read-only |
|------|-------|-------------|-----------|
| `browser_cookie_clear` | Clear cookies | Clear all cookies | No |
| `browser_cookie_delete` | Delete cookie | Delete a specific cookie by name | No |
| `browser_cookie_get` | Get cookie | Get a specific cookie by name | Yes |
| `browser_cookie_list` | List cookies | List all cookies (optionally filtered by domain/path) | Yes |
| `browser_cookie_set` | Set cookie | Set a cookie with optional flags | No |
| `browser_localstorage_clear` | Clear localStorage | Clear all localStorage | No |
| `browser_localstorage_delete` | Delete localStorage item | Delete a localStorage item by key | No |
| `browser_localstorage_get` | Get localStorage item | Get a localStorage item by key | Yes |
| `browser_localstorage_list` | List localStorage | List all localStorage key-value pairs | Yes |
| `browser_localstorage_set` | Set localStorage item | Set a localStorage item | No |
| `browser_sessionstorage_clear` | Clear sessionStorage | Clear all sessionStorage | No |
| `browser_sessionstorage_delete` | Delete sessionStorage item | Delete a sessionStorage item | No |
| `browser_sessionstorage_get` | Get sessionStorage item | Get a sessionStorage item by key | Yes |
| `browser_sessionstorage_list` | List sessionStorage | List all sessionStorage key-value pairs | Yes |
| `browser_sessionstorage_set` | Set sessionStorage item | Set a sessionStorage item | No |
| `browser_set_storage_state` | Restore storage state | Restore cookies and localStorage from a file | No |
| `browser_storage_state` | Save storage state | Save cookies and localStorage to a file | Yes |

---

## 6. DevTools *(opt-in: `--caps=devtools`)*

| Tool | Title | Description | Read-only |
|------|-------|-------------|-----------|
| `browser_annotate` | Annotate the current page | Open Playwright Dashboard in annotation mode | Yes |
| `browser_hide_highlight` | Hide element highlight | Remove a highlight overlay from an element | Yes |
| `browser_highlight` | Highlight element | Show a persistent highlight overlay around an element | Yes |
| `browser_resume` | Resume paused script execution | Resume script after pause; supports step-by-step debugging | No |
| `browser_start_tracing` | Start tracing | Start trace recording | Yes |
| `browser_start_video` | Start video | Start video recording | Yes |
| `browser_stop_tracing` | Stop tracing | Stop trace recording | Yes |
| `browser_stop_video` | Stop video | Stop video recording | Yes |
| `browser_video_chapter` | Video chapter | Add a chapter marker to the video recording | Yes |
| `browser_video_hide_actions` | Hide action overlays | Stop annotating actions on the page | Yes |
| `browser_video_show_actions` | Show action overlays | Annotate actions with callout and highlight | Yes |

---

## 7. Coordinate-based / Vision *(opt-in: `--caps=vision`)*

| Tool | Title | Description | Read-only |
|------|-------|-------------|-----------|
| `browser_mouse_click_xy` | Click | Click mouse at given X/Y coordinates | No |
| `browser_mouse_down` | Press mouse down | Press mouse button down | No |
| `browser_mouse_drag_xy` | Drag mouse | Drag left mouse button from one position to another | No |
| `browser_mouse_move_xy` | Move mouse | Move mouse to a given X/Y position | No |
| `browser_mouse_up` | Press mouse up | Release mouse button | No |
| `browser_mouse_wheel` | Scroll mouse wheel | Scroll mouse wheel by deltaX/deltaY | No |

---

## 8. PDF Generation *(opt-in: `--caps=pdf`)*

| Tool | Title | Description | Read-only |
|------|-------|-------------|-----------|
| `browser_pdf_save` | Save as PDF | Save the current page as a PDF file | Yes |

---

## 9. Test Assertions *(opt-in: `--caps=testing`)*

| Tool | Title | Description | Read-only |
|------|-------|-------------|-----------|
| `browser_generate_locator` | Create locator for element | Generate a Playwright locator for use in tests | Yes |
| `browser_verify_element_visible` | Verify element visible | Verify element is visible on the page | No |
| `browser_verify_list_visible` | Verify list visible | Verify a list and its items are visible | No |
| `browser_verify_text_visible` | Verify text visible | Verify text is visible on the page | No |
| `browser_verify_value` | Verify value | Verify element value (supports checkbox true/false) | No |

---

## Enabling Opt-in Capabilities

Add `--caps` to your MCP config args to enable additional tool groups:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--caps=vision,pdf,devtools,network,storage,config,testing"
      ]
    }
  }
}
```

Or enable specific ones only:

```bash
npx @playwright/mcp@latest --caps=vision,pdf
```

---

## Tool Count Summary

| Category | Tools | Enabled by Default |
|----------|-------|--------------------|
| Core Automation | 23 | Yes |
| Tab Management | 1 | Yes |
| Configuration | 1 | No (`--caps=config`) |
| Network | 4 | No (`--caps=network`) |
| Storage | 17 | No (`--caps=storage`) |
| DevTools | 11 | No (`--caps=devtools`) |
| Vision / Coordinate | 6 | No (`--caps=vision`) |
| PDF Generation | 1 | No (`--caps=pdf`) |
| Test Assertions | 5 | No (`--caps=testing`) |
| **Total** | **69** | |
