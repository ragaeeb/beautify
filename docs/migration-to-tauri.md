# Beautify Tauri Migration Guide

This guide documents the steps required to run the Beautify application after the migration from Electron to Tauri 2.9.

## 1. Prerequisites (macOS)

1. **Command Line Tools** – Install Apple's command line developer tools if they are not already present:
   ```bash
   xcode-select --install
   ```
2. **Rust toolchain** – Install `rustup`, then install the stable toolchain and add it to your shell:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup default stable
   rustup target add aarch64-apple-darwin x86_64-apple-darwin
   ```
   The additional targets allow you to build both Apple Silicon and Intel binaries from the same machine.
3. **Homebrew packages** – Ensure `cmake`, `ninja`, and `pkg-config` are installed. These are standard Tauri build dependencies.
   ```bash
   brew install cmake ninja pkg-config
   ```
4. **Node.js** – Use Node.js 18 or newer. You can install it via [nvm](https://github.com/nvm-sh/nvm) or Homebrew:
   ```bash
   brew install node
   ```
5. **Tauri global shortcut permissions** – After the first run macOS will prompt for Accessibility permissions so the app can listen for global shortcuts. Approve the request under **System Settings → Privacy & Security → Accessibility**.

## 2. Project setup

1. Clone the repository and move into the project directory.
2. Install JavaScript dependencies:
   ```bash
   npm install
   ```
3. Verify the Rust dependencies are fetched:
   ```bash
   cargo fetch --manifest-path src-tauri/Cargo.toml
   ```

## 3. Development workflow

1. Start the Tauri development environment (spawns Vite + the Tauri shell):
   ```bash
   npm run dev
   ```
   The background window stays hidden, but the global shortcut listener and clipboard integration will be active.
2. Lint the TypeScript sources:
   ```bash
   npm run lint
   ```

## 4. Building production bundles

Create signed bundles (DMG, app bundle, etc.) using Tauri's build pipeline:
```bash
npm run build
```
Artifacts are generated in `src-tauri/target/release/bundle`.

## 5. Feature parity notes

- Global shortcut registration and system clipboard access are now powered by `@tauri-apps/plugin-global-shortcut` and `@tauri-apps/plugin-clipboard-manager` respectively.
- The app keeps the window hidden while mirroring the previous Electron behaviour: fetching formatting rules from Pastebin, updating the dock badge with the rule count, and bouncing the dock icon when text is reformatted.
