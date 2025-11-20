# AGENTS.md

## Project Overview

**Beautify** is a cross-platform desktop application built with Tauri 2.9.3 that provides clipboard text formatting using transliteration rules. It runs as a menu bar/system tray application with a global hotkey for instant text transformation.

### Core Purpose
- Monitor clipboard content via global hotkey (`Cmd+Shift+X` / `Ctrl+Shift+X`)
- Apply pattern-based text transformations using a trie data structure
- Provide visual feedback through dock badges and tray notifications
- Operate efficiently in the background with minimal resource usage

## Architecture

### Technology Stack
- **Frontend**: TypeScript + Vite (no framework)
- **Backend**: Rust (Tauri runtime)
- **Platforms**: macOS, Windows, Linux (desktop) + iOS, Android (mobile via Tauri 2.0)
- **Key Libraries**:
  - `trie-rules` (v3.2.0): Pattern matching and text replacement engine
  - `@tauri-apps/plugin-clipboard-manager`: Cross-platform clipboard access
  - `@tauri-apps/plugin-global-shortcut`: System-wide hotkey registration (desktop only)
  - `@tauri-apps/plugin-http`: Network requests for rule fetching

### Project Structure
```
beautify/
├── src/
│   ├── main.ts              # Frontend logic and initialization
│   └── index.html           # Help window UI
├── src-tauri/
│   ├── src/
│   │   └── main.rs          # Rust backend with tray/dock integration
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json      # Application configuration
│   └── build.rs             # Build script
├── package.json             # Node dependencies and scripts
├── tsconfig.json            # TypeScript configuration
└── vite.renderer.config.ts  # Vite build configuration
```

## Key Components

### 1. Rule Loading System (`src/main.ts`)
- **Rules Source**: Fetches JSON from `https://pastebin.com/raw/Bb3SjXtg`
- **Format**: Array of objects with `from` (string/array) and `to` (string) properties
- **Retry Logic**: 3 attempts with exponential backoff (1s → 2s → 4s)
- **Initialization**: Happens on DOMContentLoaded, retries every 30s on failure

### 2. Trie-Based Processing
```typescript
// Rules are compiled into a trie for O(n) text processing
const trie = buildTrie(loadedRules);
const result = searchAndReplace(trie, inputText);
```
- Linear time complexity relative to text length
- Memory-efficient prefix sharing
- No regex compilation overhead

### 3. Global Hotkey Handler
- **Registration**: `CommandOrControl+Shift+X` (cross-platform)
- **Flow**: Read clipboard → Process through trie → Write back → Show feedback
- **Error Handling**: Sets dock badge to "!" on failure

### 4. Visual Feedback System
- **Dock Badge (macOS)**: Shows rule count or error indicator
- **Tray Tooltip**: Current status messages
- **User Attention**: Bounce animation on successful format

### 5. Help Window
- Hidden by default (`visible: false` in config)
- Shows usage instructions and demo area
- Demo populates with random rule example when focused
- Accessible via tray menu "Help" option

## Development Guidelines

### Code Style Conventions

#### TypeScript
- **Module System**: ES Modules (`import`/`export`)
- **Async/Await**: Preferred over `.then()` chains
- **Type Safety**: Leverage TypeScript types, avoid `any` when possible
- **Error Handling**: Try-catch blocks with user-friendly error messages
- **Logging**: `console.log` for info, `console.error` for errors, `console.warn` for warnings

#### Naming Conventions
- **Functions**: camelCase (`updateStatus`, `setDockBadge`)
- **Constants**: UPPER_SNAKE_CASE (`HOST`, `RULES_ID`, `HOTKEY`)
- **Types**: PascalCase (`Rule`)
- **State Variables**: Descriptive camelCase (`loadedRules`, `isInitialized`)

#### Rust
- **Formatting**: Standard Rust style (run `cargo fmt`)
- **Commands**: Snake_case function names with `#[tauri::command]` attribute
- **Error Handling**: Return `Result<T, String>` for commands
- **Logging**: Use `log` crate with appropriate levels (`info!`, `debug!`, `error!`)

### HTML/CSS
- **Inline Styles**: Currently used in `index.html` (no separate CSS files)
- **Design System**: 
  - Gradient background: `#667eea → #764ba2`
  - Glassmorphism effects: `backdrop-filter: blur(10px)`
  - Font: Apple system fonts with fallbacks
  - Border radius: Consistent 8px-16px rounded corners

### File Modification Guidelines

#### When Modifying `src/main.ts`
- Maintain singleton initialization pattern (`isInitialized` flag)
- Preserve retry logic for network requests
- Keep hotkey handler stateless (uses global `loadedRules`)
- Update status messages using `updateStatus()` helper
- Don't block initialization on non-critical errors

#### When Modifying `src-tauri/src/main.rs`
- Preserve macOS-specific conditional compilation blocks (`#[cfg(target_os = "macos")]`)
- Maintain tray icon event handlers
- Keep command functions pure (minimal side effects)
- Update `invoke_handler!` macro when adding new commands
- Respect the `TrayState` shared state pattern

#### When Modifying `tauri.conf.json`
- **Security**: Only add necessary permissions under `capabilities`
- **CSP**: Update Content Security Policy if adding external domains
- **Window Config**: Keep `skipTaskbar: true` and `visible: false` for help window
- **Bundle**: Update version in sync with `package.json` and `Cargo.toml`

## Context Menu Integration (macOS Services)

### Right-Click Text Formatting
Yes! Tauri can integrate with macOS Services to provide right-click context menu options. This requires:

1. **Add to `tauri.conf.json`** under `bundle.macOS`:
```json
"bundle": {
  "macOS": {
    "services": [
      {
        "name": "Beautify Text",
        "executable": "beautify",
        "message": "Formats selected text using transliteration rules",
        "sendTypes": ["NSStringPboardType"],
        "returnTypes": ["NSStringPboardType"]
      }
    ]
  }
}
```

2. **Handle Service Requests** in `src-tauri/src/main.rs`:
```rust
use tauri::Manager;

#[tauri::command]
async fn handle_service_text(text: String) -> Result<String, String> {
    // Process text through your formatting logic
    // This would need to call into your trie logic
    Ok(processed_text)
}

// In setup:
app.listen_global("service-text", |event| {
    if let Some(text) = event.payload() {
        // Handle the service request
    }
});
```

3. **Register the Service**: After installation, users must enable it in:
   - System Preferences → Keyboard → Shortcuts → Services
   - Look for "Beautify Text" and enable it

**Limitations:**
- Requires app to be running
- User must manually enable the service
- Only works on macOS
- Selected text must be in a service-aware application

**Alternative Approach**: Keep the global hotkey as primary method since it:
- Works immediately without configuration
- Works across all applications
- Doesn't require the app to be in a specific state
- Is more predictable for users

## Common Tasks

### Adding a New Backend Command
1. Add function in `src-tauri/src/main.rs`:
```rust
#[tauri::command]
fn my_command(app: AppHandle, param: String) -> Result<String, String> {
    // Implementation
    Ok("success".to_string())
}
```
2. Register in `invoke_handler!`:
```rust
.invoke_handler(tauri::generate_handler![
    set_dock_badge,
    my_command  // Add here
])
```
3. Call from TypeScript:
```typescript
await invoke('my_command', { param: 'value' });
```

### Changing the Rules Source
Update constants in `src/main.ts`:
```typescript
const HOST = 'your-host.com';
const RULES_ID = 'your-endpoint';
```
Update CSP in `tauri.conf.json`:
```json
"csp": "default-src 'self'; connect-src 'self' https://your-host.com; ..."
```

### Modifying the Hotkey
1. Change `HOTKEY` constant in `src/main.ts`
2. Update documentation in `index.html` (shortcut display)
3. Test on all target platforms (macOS, Windows, Linux)

### Adding UI Features to Help Window
- Edit `index.html` for structure
- Use inline `<style>` tag for styling
- Access via `document.getElementById()` in `main.ts`
- Follow existing glassmorphism design patterns

## Build and Release

### Development
```bash
npm run dev          # Run in dev mode with hot reload
npm run lint         # Run ESLint checks
```

### Production Build
```bash
npm run build        # Creates platform-specific bundles
# Outputs to: src-tauri/target/release/bundle/
```

### Platform-Specific Notes

#### macOS
- Uses `ActivationPolicy::Accessory` to hide from Dock
- Supports dock badge API
- Requires code signing for distribution
- Bundle format: `.app` and `.dmg`

#### Windows
- System tray only (no dock)
- Bundle format: `.msi` via WiX

#### Linux
- System tray implementation varies by desktop environment
- Bundle formats: `.deb`, `.AppImage`

## Critical Implementation Details

### State Management
- **Frontend State**: Global variables in `main.ts` (`loadedRules`, `isInitialized`)
- **Backend State**: Rust `State<TrayState>` for tray menu status
- **No Persistence**: Rules and state are in-memory only

### Network Requests
- **CORS**: Not applicable (native app uses Tauri's HTTP client)
- **Timeout**: No explicit timeout (relies on default fetch behavior)
- **Caching**: No caching; rules fetched fresh on each launch

### Error Recovery
- **Initialization Failure**: Retries every 30 seconds
- **Hotkey Errors**: Shows "!" badge, logs to console
- **Network Errors**: Exponential backoff retry with user feedback

### Security Considerations
- **CSP**: Restricts content sources to prevent XSS
- **Permissions**: Minimal capability set (clipboard, shortcuts, HTTP to specific domain)
- **No External Scripts**: All JavaScript bundled, no CDN dependencies

## Testing Considerations

### Manual Testing Checklist
- [ ] Rules load successfully on launch
- [ ] Hotkey triggers clipboard formatting
- [ ] Dock badge shows rule count
- [ ] Help window opens and closes properly
- [ ] Demo area populates with valid example
- [ ] Tray menu items function correctly
- [ ] Error states show appropriate feedback

### Edge Cases to Test
- Empty clipboard
- Very large clipboard content (>1MB)
- Network disconnection during rule fetch
- Rapid hotkey presses
- Application quit during processing

## Performance Characteristics

### Memory Usage
- **Baseline**: ~50-80MB (Tauri runtime + WebView)
- **Trie Structure**: Scales with rule count and complexity
- **Clipboard**: Temporary allocation during processing

### CPU Usage
- **Idle**: Negligible (event-driven architecture)
- **Processing**: O(n) where n = clipboard text length
- **Startup**: Brief spike during rule fetch and trie construction

## Debugging Tips

### Enable Debug Logging
Rust logs are visible in development mode (`npm run dev`):
```rust
log::debug!("Your debug message");
```

### Frontend Debugging
- Open DevTools in development mode
- Check console for TypeScript errors
- Monitor network requests in DevTools Network tab

### Common Issues
1. **Hotkey not registering**: Check for conflicts with system shortcuts
2. **Rules not loading**: Verify network connectivity and CSP settings
3. **Clipboard not updating**: Check platform-specific permissions
4. **Tray icon missing**: Verify icon files exist in `icons/` directory

## Dependencies Management

### Updating Dependencies
```bash
npm update                    # Update Node packages
cargo update                  # Update Rust crates
```

### Key Version Constraints
- Tauri: Keep frontend and backend versions in sync
- trie-rules: Major version changes may affect API
- TypeScript: ~5.9.3 (tilde range for patch updates)

## AI Agent Collaboration Notes

### When Suggesting Changes
1. **Preserve existing patterns**: Match current code style and architecture
2. **Platform considerations**: Wrap platform-specific code in conditional compilation
3. **Type safety**: Provide proper TypeScript types for new functions
4. **Error handling**: Always include try-catch and user feedback
5. **Testing**: Suggest manual test cases for new features

### Useful Context for Analysis
- This is a **single-purpose utility**: Keep features focused on clipboard formatting
- **User experience priority**: Fast, unobtrusive, reliable
- **Cross-platform**: Test assumptions against all three target platforms
- **No telemetry**: Privacy-focused design; avoid adding analytics

### Code Generation Guidelines
- Use `await` for all async operations
- Include JSDoc comments for complex functions
- Match indentation (4 spaces) and line length conventions
- Avoid external dependencies unless absolutely necessary
- Provide both TypeScript and Rust code when bridging frontend/backend

---

**Version**: 0.2.1  
**Last Updated**: 2024  
**Maintainer**: Ragaeeb Haq