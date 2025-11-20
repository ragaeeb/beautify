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
- **Platforms**: macOS, Windows, Linux (desktop)
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
├── vite.renderer.config.ts  # Vite build configuration
├── .env.build.example       # Template for build credentials
└── .env.build               # Actual build secrets (DO NOT COMMIT)
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
- **Code Signing**: Use environment variables (`APPLE_SIGNING_IDENTITY`) instead of hardcoding in config

## Context Menu Integration (macOS Services)

### Right-Click Text Formatting
Tauri can integrate with macOS Services for right-click context menu options. This requires:

1. **Add to `tauri.conf.json`** under `bundle.macOS`
2. **Handle Service Requests** in `src-tauri/src/main.rs`
3. **User enablement** in System Preferences → Keyboard → Shortcuts → Services

**Limitations:**
- Requires app to be running
- User must manually enable the service
- Only works on macOS
- Selected text must be in a service-aware application

**Current Approach**: Global hotkey is preferred as it:
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
bun run dev          # Run in dev mode with hot reload (or npm run dev)
bun run lint         # Run ESLint checks
```

### Production Builds

#### Prerequisites

**System Requirements:**
- macOS (for macOS builds)
- Xcode Command Line Tools installed
- Rust with platform targets installed
- Active Apple Developer account ($99/year)

**Installation:**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Verify installation
xcode-select -p

# Install Rust targets for universal binary
rustup target add x86_64-apple-darwin    # Intel
rustup target add aarch64-apple-darwin   # Apple Silicon

# Verify targets
rustup target list | grep apple-darwin
```

#### macOS Distribution Setup

**One-Time Configuration:**

1. **Create Certificate Signing Request (CSR)**
   - Open Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
   - Save to disk, specify 2048-bit RSA key

2. **Generate Developer ID Certificate**
   - Visit [developer.apple.com/account/resources/certificates](https://developer.apple.com/account/resources/certificates)
   - Create "Developer ID Application" certificate
   - Upload CSR, download certificate (.cer file)
   - Install by double-clicking .cer file

3. **Find Your Signing Identity**
   ```bash
   security find-identity -v -p codesigning
   ```
   Note the full certificate name (e.g., "Developer ID Application: Your Name (TEAM_ID)")

4. **Generate App-Specific Password**
   - Visit [appleid.apple.com/account/manage](https://appleid.apple.com/account/manage)
   - Security → App-Specific Passwords → Generate
   - Save the xxxx-xxxx-xxxx-xxxx format password

5. **Configure Build Environment**
   ```bash
   # Copy template
   cp .env.build.example .env.build
   
   # Edit with your credentials
   nano .env.build
   ```
   
   Required variables:
   - `APPLE_SIGNING_IDENTITY`: From step 3
   - `APPLE_ID`: Apple Developer email
   - `APPLE_PASSWORD`: From step 4
   - `APPLE_TEAM_ID`: 10-character team identifier
   - `CI=true`: Enables notarization

6. **Protect Credentials**
   ```bash
   echo ".env.build" >> .gitignore
   ```
   **⚠️ NEVER commit .env.build!**

#### Building

```bash
# Load signing credentials
source .env.build

# Build universal binary (recommended for distribution)
bun run build:macos

# OR build specific architectures:
bun run build:macos-intel    # Intel only (x86_64)
bun run build:macos-arm      # Apple Silicon only (aarch64)
```

**Build Process:**
1. Compiles for x86_64 (Intel) and aarch64 (Apple Silicon)
2. Combines into universal binary
3. Signs app bundle with Developer ID certificate
4. Creates and signs DMG
5. Uploads to Apple for notarization (5-30 minutes)
6. Staples notarization ticket to DMG

**Build Outputs:**
```
src-tauri/target/
├── universal-apple-darwin/release/bundle/
│   ├── macos/Beautify.app
│   └── dmg/Beautify_0.2.1_universal.dmg  # Ship this
├── x86_64-apple-darwin/release/bundle/
│   └── dmg/Beautify_0.2.1_x64.dmg        # Intel only
└── aarch64-apple-darwin/release/bundle/
    └── dmg/Beautify_0.2.1_aarch64.dmg    # Apple Silicon only
```

**What Each Build Represents:**

| Build Target | Architecture | File | Recommended For |
|--------------|--------------|------|-----------------|
| `universal-apple-darwin` | x86_64 + aarch64 | `universal.dmg` | **Primary distribution** - Works on all Macs |
| `x86_64-apple-darwin` | Intel only | `x64.dmg` | Intel Macs (pre-2020) |
| `aarch64-apple-darwin` | ARM64 only | `aarch64.dmg` | M1/M2/M3/M4 Macs (2020+) |

**For Release:**
- Ship the **universal.dmg** for maximum compatibility
- File size is ~2x larger but eliminates compatibility issues
- Single download works for all Mac users

#### Verification

```bash
# Check universal binary contains both architectures
lipo -info src-tauri/target/universal-apple-darwin/release/bundle/macos/Beautify.app/Contents/MacOS/beautify
# Expected: x86_64 arm64

# Verify code signature
codesign -dv --verbose=4 src-tauri/target/universal-apple-darwin/release/bundle/macos/Beautify.app
# Should show: Authority=Developer ID Application: Your Name (TEAM_ID)

# Verify notarization
spctl -a -vv src-tauri/target/universal-apple-darwin/release/bundle/macos/Beautify.app
# Expected: accepted, source=Notarized Developer ID
```

#### Troubleshooting

**"No signing identity found"**
```bash
security find-identity -v -p codesigning
# Certificate must be in login keychain - reinstall .cer if missing
```

**"Notarization failed"**
```bash
xcrun notarytool log <submission-id> --apple-id your@email.com --team-id TEAM_ID
# Common: wrong app-specific password, expired cert, team ID mismatch
```

**"Target not installed"**
```bash
rustup target add x86_64-apple-darwin aarch64-apple-darwin
```

**Build timeout/hanging**
- First notarization: 30+ minutes
- Subsequent builds: 5-10 minutes
- Requires active internet connection

**Environment not configured**
```bash
bun run check-build-env  # Validates all required variables are set
```

### Platform-Specific Notes

#### macOS
- Uses `ActivationPolicy::Accessory` to hide from Dock
- Supports dock badge API
- Requires code signing and notarization for distribution
- Bundle formats: `.app` and `.dmg`
- Universal binaries contain both Intel and ARM code
- Tauri resolves signing in order: `APPLE_SIGNING_IDENTITY` env var → `tauri.conf.json` → auto-detection

#### Windows
- System tray only (no dock)
- Bundle format: `.msi` via WiX
- Code signing recommended but not implemented yet

#### Linux
- System tray implementation varies by desktop environment
- Bundle formats: `.deb`, `.AppImage`
- No code signing required

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
- **Credentials**: Use environment variables, never commit secrets

### Build Security
- **Code Signing**: Uses `APPLE_SIGNING_IDENTITY` environment variable
- **Notarization**: Automated via `CI=true` flag
- **Credentials**: Stored in `.env.build` (gitignored)
- **Resolution Order**: Env var → config file → auto-detection

## Testing Considerations

### Manual Testing Checklist
- [ ] Rules load successfully on launch
- [ ] Hotkey triggers clipboard formatting
- [ ] Dock badge shows rule count
- [ ] Help window opens and closes properly
- [ ] Demo area populates with valid example
- [ ] Tray menu items function correctly
- [ ] Error states show appropriate feedback
- [ ] Universal binary runs on Intel and Apple Silicon

### Edge Cases to Test
- Empty clipboard
- Very large clipboard content (>1MB)
- Network disconnection during rule fetch
- Rapid hotkey presses
- Application quit during processing
- First launch without rules loaded

## Performance Characteristics

### Memory Usage
- **Baseline**: ~50-80MB (Tauri runtime + WebView)
- **Trie Structure**: Scales with rule count and complexity
- **Clipboard**: Temporary allocation during processing

### CPU Usage
- **Idle**: Negligible (event-driven architecture)
- **Processing**: O(n) where n = clipboard text length
- **Startup**: Brief spike during rule fetch and trie construction

### Build Times
- **Development**: Instant with hot reload
- **Production (first)**: 30-60 minutes (includes notarization)
- **Production (subsequent)**: 5-15 minutes
- **Universal binary**: ~2x longer than single architecture

## Debugging Tips

### Enable Debug Logging
Rust logs are visible in development mode (`bun run dev`):
```rust
log::debug!("Your debug message");
```

### Frontend Debugging
- Open DevTools in development mode
- Check console for TypeScript errors
- Monitor network requests in DevTools Network tab

### Build Debugging
```bash
# Check certificate status
security find-identity -v -p codesigning

# Verify targets installed
rustup target list | grep apple-darwin

# Test build environment
bun run check-build-env

# Build without notarization (faster for testing)
# Set in tauri.conf.json: "notarize": false
```

### Common Issues
1. **Hotkey not registering**: Check for conflicts with system shortcuts
2. **Rules not loading**: Verify network connectivity and CSP settings
3. **Clipboard not updating**: Check platform-specific permissions
4. **Tray icon missing**: Verify icon files exist in `icons/` directory
5. **Build fails with signing error**: Check `.env.build` credentials and certificate validity

## Dependencies Management

### Updating Dependencies
```bash
bun update                    # Update Node packages
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
6. **Security**: Never suggest committing credentials or secrets

### Useful Context for Analysis
- This is a **single-purpose utility**: Keep features focused on clipboard formatting
- **User experience priority**: Fast, unobtrusive, reliable
- **Cross-platform**: Test assumptions against all three target platforms
- **No telemetry**: Privacy-focused design; avoid adding analytics
- **Build security**: Always use environment variables for credentials

### Code Generation Guidelines
- Use `await` for all async operations
- Include JSDoc comments for complex functions
- Match indentation (4 spaces) and line length conventions
- Avoid external dependencies unless absolutely necessary
- Provide both TypeScript and Rust code when bridging frontend/backend
- Never hardcode signing identities or credentials in config files

---

**Version**: 0.2.1  
**Last Updated**: 2024  
**Maintainer**: Ragaeeb Haq