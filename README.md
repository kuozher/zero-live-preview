# Zero Preview (for Zed Editor) ⚡

> **Ultra-lightweight, zero-dependency, zero-terminal-clutter live preview daemon for Zed Editor.**  
> *(macOS • Windows • Linux)*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#)

---

## 🌟 Why Zero Preview?

If you love [Zed Editor](https://zed.dev/) for its blazingly fast Rust performance, you might miss VS Code's classic *Live Server* extension. 

Standard command-line static servers often:
- ❌ Constantly pop up or clutter your editor's bottom terminal panel.
- ❌ Require heavy `node_modules` (50MB+ for a simple HTML preview).
- ❌ Choke on deep nested paths or folder names with special characters (`#`, `%`, `&`, `+`, spaces, non-ASCII).
- ❌ Fail to load root-relative resources (`/images/logo.png`) when previewing deep sub-pages.

**Zero Preview** solves this with a headless native daemon running quietly behind Zed Tasks. **Zero visual disturbance, instant browser launch, and real-time hot reload.**

---

## ✨ Features

- 🔕 **Zero Terminal Clutter**: Runs silently via Zed's hidden task runner (`reveal: "never"`). No terminal panels flashing or lingering in your editor.
- 📦 **Zero External Dependencies**: Built 100% on native Node.js core modules (`http`, `fs`, `child_process`). Cold start in ~50ms.
- 🔄 **Live Reload & Hot CSS**: Powered by lightweight Server-Sent Events (SSE). HTML edits trigger instant page reloads; CSS edits inject live changes without refreshing.
- 🛡️ **Extreme Path Resilience**: Robust segment-level URL encoding guarantees full compatibility with file paths containing spaces, `#` (prevents URL hash truncation), `%`, `&`, `+`, parentheses, and Unicode/Chinese characters.
- 🧠 **Smart Referer Fallback**: Automatically locates root-relative assets (e.g. `<img src="/images/hero.jpg">`) relative to the active preview file.
- 🧭 **Native GUI Integration**: Launch from Zed's **Command Palette** (`Ctrl/Cmd + Shift + P`) or with ergonomic keyboard shortcuts.
- 🌐 **CORS & Modern Web Ready**: Pre-configured with `Access-Control-Allow-Origin: *` for `<script type="module">` (ES Modules) and Web Workers.
- 💤 **Auto-Sleep Daemon**: Gracefully shuts down after 2 hours of inactivity when no browser tab is connected, keeping your machine clean.

---

## 🚀 Quick Install (Recommended)

Make sure you have [Node.js](https://nodejs.org/) installed (v14 or higher).

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/zero-live-preview.git
cd zero-live-preview
```

### 2. Run the automated installer
```bash
node install.js
```
The script will automatically detect your OS, copy runtime files to your Zed configuration directory, and cleanly merge settings into `tasks.json` and `keymap.json`.

---

## ⌨️ How to Use

Open any HTML file in Zed and trigger preview:

| Action | Windows / Linux | macOS | Command Palette (`Ctrl/Cmd + Shift + P`) |
| :--- | :--- | :--- | :--- |
| **Open Live Preview** | <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>V</kbd> | <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>V</kbd> | `Live Preview: Open Current File` |
| **Stop Preview Server** | <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | `Live Preview: Stop Server` |

*Note: On physical Mac keyboards, the <kbd>Option</kbd> key (⌥) is used.*

---

## 🛠️ Manual Installation (Optional)

If you prefer to configure Zed manually without running the install script:

### Step 1: Copy runtime files
Copy `cli.js`, `server.js` (and `run-hidden.vbs` on Windows) to your Zed directory:
- **Windows**: `%APPDATA%\Zed\live-preview\`
- **macOS / Linux**: `~/.config/zed/live-preview/`

### Step 2: Add Task to `tasks.json`
Open `tasks.json` (`Ctrl/Cmd + Shift + P` -> `zed: open tasks`) and append:

```json
[
  {
    "label": "Live Preview: Open Current File",
    "command": "node",
    "args": [
      "~/.config/zed/live-preview/cli.js",
      "$ZED_FILE"
    ],
    "use_new_terminal": false,
    "allow_concurrent_runs": true,
    "reveal": "never",
    "hide": "always",
    "save": "current"
  },
  {
    "label": "Live Preview: Stop Server",
    "command": "node",
    "args": [
      "~/.config/zed/live-preview/cli.js",
      "--stop"
    ],
    "use_new_terminal": false,
    "allow_concurrent_runs": true,
    "reveal": "never",
    "hide": "always"
  }
]
```
*(On Windows, replace `~/.config/zed/` with `C:\\Users\\<User>\\AppData\\Roaming\\Zed\\`)*

### Step 3: Add Keybindings to `keymap.json`
Open `keymap.json` (`Ctrl/Cmd + Shift + P` -> `zed: open keymap`) and append:

```json
[
  {
    "context": "Workspace",
    "bindings": {
      "ctrl-alt-v": ["task::Spawn", { "task_name": "Live Preview: Open Current File" }],
      "ctrl-alt-shift-v": ["task::Spawn", { "task_name": "Live Preview: Stop Server" }],
      "cmd-alt-v": ["task::Spawn", { "task_name": "Live Preview: Open Current File" }],
      "cmd-alt-shift-v": ["task::Spawn", { "task_name": "Live Preview: Stop Server" }]
    }
  }
]
```

---

## 🧹 Uninstallation

To completely remove Zero Preview from your system:

```bash
node install.js --uninstall
```

---

## 🔍 Debugging & Logs

If preview behaves unexpectedly, a real-time execution log is kept at:
- **Windows**: `%APPDATA%\Zed\live-preview\debug.log`
- **macOS / Linux**: `~/.config/zed/live-preview/debug.log`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
*Disclaimer: This is an independent community tool and is not affiliated with or endorsed by Zed Industries.*
