# Beautify

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri](https://img.shields.io/badge/Tauri-2.9.3-blue.svg)](https://tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://typescriptlang.org/)
[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/6231da10-8efe-47dc-b253-6cf8a3e7e6e9.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/6231da10-8efe-47dc-b253-6cf8a3e7e6e9)

**Beautify** is a lightweight macOS menu bar application that automatically formats text in your clipboard using predefined transliteration rules. Perfect for academic writing, research, or any work involving transliterated text from Arabic or other languages.

## 🌟 Features

- **Instant Formatting**: Press `Cmd+Shift+X` to automatically format clipboard text
- **Smart Transliteration**: Uses efficient trie-based pattern matching for accurate replacements
- **Visual Feedback**: Dock badge shows rule count and provides bounce animation on successful formatting
- **Background Operation**: Runs silently in the background with minimal system impact
- **Dynamic Rules**: Fetches the latest formatting rules from a remote source
- **Error Handling**: Clear visual indicators when rules can't be loaded

## 📦 Download & Install

### For macOS Users

Choose the appropriate build for your Mac:

| Build File | Mac Type | Recommended For |
|------------|----------|-----------------|
| `Beautify_0.2.1_universal.dmg` | **Universal Binary** | **✅ Most users** - Works on both Intel and Apple Silicon Macs |
| `Beautify_0.2.1_x64.dmg` | Intel-only | Intel Macs (pre-2020) |
| `Beautify_0.2.1_aarch64.dmg` | Apple Silicon-only | M1/M2/M3/M4 Macs (2020+) |

**Not sure which Mac you have?**
- Click the Apple menu () → "About This Mac"
- Look for "Chip" or "Processor":
  - **Apple M1/M2/M3/M4** → Use Universal or aarch64
  - **Intel Core i5/i7/i9** → Use Universal or x64
  - **When in doubt** → Use Universal (works everywhere but slightly larger file)

### Installation Steps

1. Download the `.dmg` file for your Mac
2. Open the downloaded `.dmg` file
3. Drag **Beautify.app** to your Applications folder
4. Launch Beautify from Applications or Spotlight
5. Grant necessary permissions when prompted (clipboard access)

### Security Notes

Beautify is signed and notarized by Apple. If you see a security warning:
1. Right-click (or Control-click) on Beautify.app
2. Select "Open" from the menu
3. Click "Open" in the dialog that appears

## 🚀 Usage

1. Copy any text containing transliterated content to your clipboard
2. Press `Cmd+Shift+X` (or `Ctrl+Shift+X` on Windows/Linux)
3. Your clipboard now contains the beautifully formatted text!

## 🔧 Development

### Prerequisites

- Node.js (v24 or higher) or Bun (recommended)
- Rust (latest stable)
- Platform-specific dependencies (see [Tauri Prerequisites](https://tauri.app/v2/guides/getting-started/prerequisites))

### Setup

```bash
# Clone the repository
git clone https://github.com/ragaeeb/beautify.git
cd beautify

# Install dependencies
bun install  # or npm install

# Start in development mode
bun run dev  # or npm run dev
```

### Building for Distribution (macOS)

#### Initial Setup

1. **Install Prerequisites**
   ```bash
   # Install Xcode Command Line Tools
   xcode-select --install
   
   # Verify installation
   xcode-select -p
   ```

2. **Install Rust Targets for Universal Binary**
   ```bash
   # Add Intel target
   rustup target add x86_64-apple-darwin
   
   # Add Apple Silicon target
   rustup target add aarch64-apple-darwin
   
   # Verify both are installed
   rustup target list | grep apple-darwin
   ```

3. **Obtain Apple Developer Certificates**
   - Enroll in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
   - Create Certificate Signing Request (CSR) in Keychain Access:
     - Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
     - Save to disk, specify key pair info (2048 bits, RSA)
   - Generate certificate at [developer.apple.com/account/resources/certificates](https://developer.apple.com/account/resources/certificates)
     - Select "Developer ID Application" (for distribution outside Mac App Store)
     - Upload CSR, download certificate (.cer file)
   - Install certificate by double-clicking the .cer file

4. **Find Your Code Signing Identity**
   ```bash
   security find-identity -v -p codesigning
   ```
   Look for an identity like: `"Developer ID Application: Your Name (TEAM_ID)"`

5. **Generate App-Specific Password**
   - Visit [appleid.apple.com/account/manage](https://appleid.apple.com/account/manage)
   - Security → App-Specific Passwords → Generate Password
   - Label it (e.g., "Beautify Notarization")
   - Save the generated password (format: xxxx-xxxx-xxxx-xxxx)

6. **Create Build Environment File**
   ```bash
   # Copy the example file
   cp .env.build.example .env.build
   
   # Edit with your actual values
   nano .env.build
   ```
   
   Fill in:
   - `APPLE_SIGNING_IDENTITY`: Your "Developer ID Application" identity (from step 4)
   - `APPLE_ID`: Your Apple Developer account email
   - `APPLE_PASSWORD`: The app-specific password (from step 5)
   - `APPLE_TEAM_ID`: Your 10-character team ID
   - `CI=true`: Enables notarization

7. **Add .env.build to .gitignore**
   ```bash
   echo ".env.build" >> .gitignore
   ```
   **⚠️ NEVER commit .env.build to version control!**

#### Building

```bash
# Load environment variables
source .env.build

# Build universal binary (recommended - works on all Macs)
bun run build:macos

# OR build specific architectures:
bun run build:macos-intel  # Intel only
bun run build:macos-arm    # Apple Silicon only
```

Build artifacts will be in:
```text
src-tauri/target/universal-apple-darwin/release/bundle/
├── macos/Beautify.app          # Signed & notarized app bundle
└── dmg/Beautify_0.2.1_universal.dmg  # Distribution DMG
```

#### Troubleshooting Builds

**"No signing identity found"**
```bash
# Re-list certificates
security find-identity -v -p codesigning
# Certificate must be in login keychain - reinstall .cer file if missing
```

**"Notarization failed"**
```bash
# Check notarization log (get submission ID from build output)
xcrun notarytool log <submission-id> --apple-id your@email.com --team-id YOUR_TEAM_ID
# Common issues: wrong app-specific password, expired certificate, team ID mismatch
```

**"Target not installed"**
```bash
rustup target add x86_64-apple-darwin aarch64-apple-darwin
```

**First build is very slow**
- First-time notarization can take 30+ minutes
- Subsequent builds are faster (5-10 minutes)
- Requires active internet connection

#### Understanding Build Outputs

| Target | Command | Output | Size | Use Case |
|--------|---------|--------|------|----------|
| Universal | `build:macos` | `universal.dmg` | ~2x | **Distribution** - Single binary for all Macs |
| Intel (x64) | `build:macos-intel` | `x64.dmg` | Smaller | Intel Macs only |
| Apple Silicon | `build:macos-arm` | `aarch64.dmg` | Smaller | M1/M2/M3/M4 only |

**For most users**: Ship the universal build. It's larger but provides the best compatibility.

### Project Structure

```text
src/
├── main.ts              # Frontend application logic
└── index.html           # Application UI

src-tauri/
├── src/
│   └── main.rs          # Tauri backend (Rust)
├── Cargo.toml           # Rust dependencies
└── tauri.conf.json      # Tauri configuration

.env.build.example       # Template for build configuration
.env.build               # Your actual secrets (DO NOT COMMIT)
```

## ⚙️ How It Works

Beautify leverages the powerful [`trie-rules`](https://www.npmjs.com/package/trie-rules) library for efficient pattern matching and replacement:

1. **Rule Loading**: On startup, the app fetches transliteration rules from a remote JSON source
2. **Trie Construction**: Rules are compiled into an optimized trie data structure for fast searching
3. **Global Hotkey**: Registers `Cmd+Shift+X` system-wide shortcut
4. **Text Processing**: When triggered, reads clipboard → processes through trie → writes back formatted text
5. **User Feedback**: Visual cues through dock badge and bounce animations

### Performance Benefits

- **Linear Time Complexity**: O(n) processing time relative to text length
- **Memory Efficient**: Trie structure shares common prefixes
- **No Regex Overhead**: Avoids expensive regex compilation and backtracking
- **Instant Response**: Sub-millisecond processing for typical clipboard content

## 🎯 Use Cases

- **Academic Writing**: Format transliterated names and terms in research papers
- **Religious Studies**: Properly display Arabic names and terminology
- **Historical Research**: Accurate representation of historical figures and places
- **Language Learning**: Quick formatting of study materials
- **Publishing**: Prepare manuscripts with correct diacritical marks

## 🛠 Technical Details

### Built With

- **Tauri 2.9.3**: Lightweight, secure desktop framework
- **Rust**: High-performance backend
- **TypeScript**: Type-safe frontend development
- **Vite**: Fast build tooling and dev server
- **trie-rules**: Efficient pattern matching engine

### System Requirements

- macOS 10.15+ (primary target)
- Windows 10+ (supported)
- Linux (Ubuntu 18.04+)

### Global Shortcuts

| Shortcut                       | Action                |
| ------------------------------ | --------------------- |
| `Cmd+Shift+X` (macOS)          | Format clipboard text |
| `Ctrl+Shift+X` (Windows/Linux) | Format clipboard text |

## 🔒 Privacy & Security

- **No Data Collection**: All processing happens locally on your machine
- **No Network Storage**: Rules are fetched but not cached permanently
- **Clipboard Only**: Only accesses clipboard content when hotkey is pressed
- **Signed & Notarized**: macOS builds are code-signed and notarized by Apple
- **Open Source**: Full source code available for audit

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Guidelines

1. Follow the existing TypeScript/ESLint configuration
2. Test on multiple platforms when possible
3. Update documentation for new features
4. Maintain the minimal, focused scope of the application
5. See [AGENTS.md](AGENTS.md) for detailed development context

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [`trie-rules`](https://github.com/ragaeeb/trie-rules) - The powerful pattern matching engine that makes this app possible
- [Tauri](https://tauri.app/) - Modern, lightweight desktop framework
- The academic and linguistic communities for inspiration and use cases

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Include your OS version and steps to reproduce

---

**Version**: 0.2.1  
**Author**: Ragaeeb Haq  
**License**: MIT