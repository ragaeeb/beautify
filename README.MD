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

## 🚀 Quick Start

### Download & Install

_(Installation instructions will be added when releases are available)_

### Usage

1. Copy any text containing transliterated content to your clipboard
2. Press `Cmd+Shift+X` (or `Ctrl+Shift+X` on Windows/Linux)
3. Your clipboard now contains the beautifully formatted text!

## 🔧 Development

### Prerequisites

- Node.js (v24 or higher)
- Rust (latest stable)
- Platform-specific dependencies (see [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd beautify

# Install dependencies
npm install

# Start in development mode
npm run dev
```

### Build & Package

```bash
# Build for production
npm run build

# Artifacts will be in src-tauri/target/release/bundle/
```

### Code Signing

For macOS distribution, configure code signing in `src-tauri/tauri.conf.json`. See [Tauri's code signing guide](https://tauri.app/v1/guides/distribution/sign-macos) for details.

### Project Structure

```
src/
├── main.ts              # Frontend application logic
└── index.html           # Application UI

src-tauri/
├── src/
│   └── main.rs          # Tauri backend (Rust)
├── Cargo.toml           # Rust dependencies
└── tauri.conf.json      # Tauri configuration
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
- **Open Source**: Full source code available for audit

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

### Development Guidelines

1. Follow the existing TypeScript/ESLint configuration
2. Test on multiple platforms when possible
3. Update documentation for new features
4. Maintain the minimal, focused scope of the application

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
