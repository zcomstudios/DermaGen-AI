# DHTML

**Wiki:** https://wiki.facepunch.com/gmod/DHTML
**Status:** 🔴 → 🟢 (chunk 3)
**Inherits:** HTML (built-in panel)

## Visual description
A mini-browser panel that renders HTML/CSS/JS via the Awesomium/Chromium engine. In the editor we render a simplified placeholder: a faux URL bar at the top showing the current `htmlUrl`, then a content area showing either a sample of the inline `htmlContent` or a "DHTML preview" label.

## Key properties (state)
| Prop | Type | Default | Lua method | Notes |
|------|------|---------|-----------|-------|
| `htmlUrl` | string | "" | `OpenURL(s)` | URL to load |
| `htmlContent` | string | "" | `SetHTML(s)` | Raw HTML (mutually exclusive with URL) |
| `htmlAllowLua` | boolean | false | `SetAllowLua(b)` | Allow JS-to-Lua callbacks |
| `htmlScrollbars` | boolean | true | `SetScrollbars(b)` | Show scrollbars (deprecated in-game) |

## Key methods (callbacks)
| Method | Args | When fired |
|--------|------|------------|
| `OnDocumentReady` | self, url | Page finishes loading |
| `OnFinishLoadingDocument` | self, url | Document load complete |
| `OnBeginLoadingDocument` | self, url | Document load begins |
| `ConsoleMessage` | self, msg | Browser console output |

## Render strategy
- Outer div: dark frame (looks like a browser window).
- Top: 18px URL bar (light gray, small monospace, shows `htmlUrl` or "(inline content)").
- Body: white background, displays:
  - If `htmlContent` set: render it as escaped text in a code-like view (NOT actually parsing HTML, for safety).
  - Else: "DHTML preview" placeholder centered.

For the editor, we do NOT render an `<iframe>` since:
1. Cross-origin sandboxing kills most URLs anyway.
2. Embedding arbitrary user HTML opens injection vectors.
3. The user is designing layout — visual fidelity is less important than knowing "this slot will hold a browser".

## Lua emission notes
- If `htmlUrl` set: `varName:OpenURL("...")`.
- Else if `htmlContent` set: `varName:SetHTML([[ ... ]])` using long-bracket Lua string (handles quotes/newlines).
- `varName:SetAllowLua(b)` if `htmlAllowLua` defined.
- Add `DHTML` to `safeToOverridePaint` exclusion list.

## Caveats / decisions
- Default size 320×240 (small browser).
- URL takes precedence over inline HTML if both are set — emit URL only.
- For inline HTML, use `[[ ... ]]` long-bracket so quotes don't need escaping. Watch for the rare `]]` substring case (escape with `]==] ... ]==]` if needed — for now, simple `[[` is fine).
