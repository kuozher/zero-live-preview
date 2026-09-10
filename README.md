<p align="center">
  <a href="#english">English</a> • <a href="#繁體中文">繁體中文</a>
</p>

---

<a id="english"></a>

# Zero Preview (Convenient Live Preview for Zed) ⚡

> **Ultra-lightweight, zero-dependency background live preview daemon for Zed Editor.**  
> *(macOS • Windows • Linux)*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#)

---

## 🌟 Why Zero Preview?

If you love [Zed Editor](https://zed.dev/) for its speed, but find the existing preview workflow a bit clunky or frustrating, Zero Preview might be what you're looking for. It does one thing and keeps it simple.

Honestly, this started out of personal frustration on Windows: some files would preview, paths with odd characters broke unexpectedly, and reinstalling didn't help. I also got tired of remembering specific terminal commands every time. I just wanted a single shortcut to trigger preview and get to work.

Common pain points you might have run into:
- ❌ An open terminal panel you can't get rid of in your editor layout.
- ❌ Bloated `node_modules` (50MB+ just to preview a basic HTML file).
- ❌ Deep nested paths or folders with special characters (`#`, `%`, `&`, `+`, spaces, non-ASCII / CJK) breaking the server or URL.
- ❌ Root-relative assets (like `/images/logo.png`) failing to load when previewing subpages.

**Zero Preview** solves this with a native background daemon triggered directly through Zed Tasks: **zero terminal clutter, instant browser opening, and hot reload on save.**

---

## ✨ Features

- 🔕 **Zero Terminal Clutter**: Runs in the background via Zed's hidden task runner (`reveal: "never"`). No terminal panels popping up or staying pinned in your editor.
- 📦 **Zero External Dependencies**: Built entirely on native Node.js core modules (`http`, `fs`, `child_process`). Cold starts in ~50ms.
- 🔄 **Live Reload & Hot CSS**: Uses lightweight Server-Sent Events (SSE). Saving HTML triggers an instant reload; saving CSS hot-swaps styles on the fly without refreshing the page.
- 🛡️ **Extreme Path Resilience**: URL segments are properly encoded so paths with spaces, `#` (prevents truncation as URL hashes), `%`, `&`, `+`, parentheses, or Unicode/CJK characters work reliably.
- 🧠 **Smart Referer Fallback**: Resolves root-relative assets (like `<img src="/images/hero.jpg">`) correctly based on the active preview file.
- 🧭 **Native GUI Integration**: Launch straight from Zed's **Command Palette** (`Ctrl/Cmd + Shift + P`) or with dedicated keyboard shortcuts.
- 🌐 **CORS & Modern Web Ready**: Preconfigured with `Access-Control-Allow-Origin: *` to support `<script type="module">` (ES Modules) and Web Workers.
- 💤 **Auto-Sleep Daemon**: Automatically shuts down after 2 hours of inactivity with no connected browser tabs, freeing up system background resources.

---

## 🚀 Quick Install (Recommended)

Make sure you have [Node.js](https://nodejs.org/) installed (v14 or higher).

### 1. Clone the repository
```bash
git clone https://github.com/kuozher/zero-live-preview.git
cd zero-live-preview
```

### 2. Run the automated installer
```bash
node install.js
```
The installer automatically detects your OS, copies runtime files to your Zed configuration folder, and cleanly merges configurations into `tasks.json` and `keymap.json`.

---

## ⌨️ How to Use

Open any HTML file in Zed and trigger preview:

| Action | Windows / Linux | macOS | Command Palette (`Ctrl/Cmd + Shift + P`) |
| :--- | :--- | :--- | :--- |
| **Open Live Preview** | <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>V</kbd> | <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>V</kbd> | `Live Preview: Open Current File` |
| **Stop Preview Server** | <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | `Live Preview: Stop Server` |


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
*(On Windows, replace `~/.config/zed/` with `C:\\Users\\<Username>\\AppData\\Roaming\\Zed\\`)*

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

## ⚡ Update-as-You-Type (Optional Workaround)

Live update directly while typing without saving isn't straightforward due to current editor constraints. However, if you want a near-instant preview experience without pressing `Ctrl+S` / `Cmd+S` manually, you can enable auto-save in Zed.

Add the following to your Zed `settings.json` (`Ctrl/Cmd + Shift + P` -> `zed: open settings`):

```json
{
  "autosave": {
    "after_delay": {
      "milliseconds": 500
    }
  }
}
```

#### How it works:
1. **0.5s pause after typing**: Zed automatically saves in the background (no manual save needed).
2. **Built-in debouncing**: The server catches the file change, debounces it (120ms) to filter out disk noise, and notifies the browser.
3. **Instant preview**: Triggers CSS hot reload or HTML refresh automatically as you pause typing.

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
- **Disclaimer**: This is an independent project and is not affiliated with or endorsed by Zed Industries.  
- **AI Disclosure**: Conceived and designed by kuozher; implemented using Gemini 3.8 Flash (High) via Antigravity IDE.

---

<br/>

<a id="繁體中文"></a>

# Zero Preview (讓 Zed 擁有方便的即時預覽) ⚡

> **輕量、零依賴的 Zed 即時預覽背景服務。**  
> *(macOS • Windows • Linux)*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](#)

---

## 🌟 Zero Preview 怎麼來的？

如果你喜歡 [Zed 編輯器](https://zed.dev/) 原生效能，但又覺得現有預覽功能沒有那麼順手，也許可以考慮目標單一、操作簡單的 Zero Preview。

畢竟我就是在 Windows 上弄了老半天：有些檔案可以預覽有些不行、不確定到底是路徑還是哪裡有問題，重新安裝也沒能解決；又懶得每次去記終端機指令，才想說不如記一組快捷鍵來呼叫功能就好。

我覺得有以下痛點，也許你也遇過：
- ❌ 終端機面板（Terminal Panel）必須常駐佔用版面。
- ❌ `node_modules` 太笨重，只是為了看個簡單 HTML 就動輒 50MB+。
- ❌ 遇到深層路徑或包含特殊字元（`#`、`%`、`&`、`+`、空格、非 ASCII / 中文）的目錄容易出問題、無法預覽。
- ❌ 預覽子頁面時，無法正確載入根目錄相對路徑的靜態資源（例如 `/images/logo.png`）。

**Zero Preview** 經由在 Zed Tasks 背景執行的原生常駐程序（Daemon）來處理這些問題：**畫面零干擾、瀏覽器秒開，且支援存檔後即時熱重載。**

---

## ✨ 主要特色

- 🔕 **終端機零干擾（Zero Terminal Clutter）**：透過 Zed 的隱藏 Task 機制（`reveal: "never"`）在背景執行，編輯器內不會看到終端機面板。
- 📦 **零外部套件相依性（Zero External Dependencies）**：100% 基於 Node.js 原生核心模組（`http`、`fs`、`child_process`），冷啟動僅需約 50ms。
- 🔄 **即時重新整理與 CSS 熱重載（Live Reload & Hot CSS）**：採用輕量 Server-Sent Events (SSE)。HTML 存檔後即時觸發頁面刷新；修改 CSS 則存檔後直接動態更新樣式，完全不需整頁重新整理。
- 🛡️ **高彈性的路徑相容性（Extreme Path Resilience）**：針對 URL 進行嚴謹的分段編碼，支援包含空格、`#`（避免被誤判為 URL Hash 截斷）、`%`、`&`、`+`、括號以及 Unicode / 中文字元的檔案路徑。
- 🧠 **智慧參考補全（Smart Referer Fallback）**：存取根目錄相對資源（例如 `<img src="/images/hero.jpg">`）時，會依據當前預覽的檔案路徑自動定位正確資源。
- 🧭 **深度整合原生介面（Native GUI Integration）**：可透過 Zed 的**命令面板（Command Palette）**（`Ctrl/Cmd + Shift + P`）或好按的快捷鍵直接叫出。
- 🌐 **現代 Web 與跨來源支援（CORS Ready）**：預設帶有 `Access-Control-Allow-Origin: *`，原生支援 `<script type="module">` (ES Modules) 與 Web Workers。
- 💤 **自動休眠防呆機制（Auto-Sleep Daemon）**：閒置超過 2 小時且沒有任何瀏覽器分頁連線時，會自動退出預覽運作，不浪費系統背景資源。

---

## 🚀 快速安裝（推薦）

請先確認電腦已安裝 [Node.js](https://nodejs.org/)（v14 或更高版本）。

### 1. 複製（Clone）專案庫
```bash
git clone https://github.com/kuozher/zero-live-preview.git
cd zero-live-preview
```

### 2. 執行自動安裝腳本
```bash
node install.js
```
安裝腳本會自動判斷你的作業系統，將執行所需檔案複製到 Zed 的設定目錄，並乾淨地將設定合併進 `tasks.json` 與 `keymap.json`。

---

## ⌨️ 如何使用

在 Zed 中開啟任何 HTML 檔案，並觸發預覽：

| 操作動作 | Windows / Linux | macOS | 命令面板 (`Ctrl/Cmd + Shift + P`) |
| :--- | :--- | :--- | :--- |
| **開啟即時預覽** | <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>V</kbd> | <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>V</kbd> | `Live Preview: Open Current File` |
| **停止預覽伺服器** | <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | <kbd>Cmd</kbd> + <kbd>Option</kbd> + <kbd>Shift</kbd> + <kbd>V</kbd> | `Live Preview: Stop Server` |

---

## 🛠️ 手動安裝（進階 / 可選）

如果你希望手動設定 Zed，不想執行安裝腳本：

### 步驟 1：複製執行所需檔案
將 `cli.js`、`server.js`（Windows 環境還需包含 `run-hidden.vbs`）複製到你的 Zed 目錄：
- **Windows**：%APPDATA%\Zed\live-preview\
- **macOS / Linux**：`~/.config/zed/live-preview/`

### 步驟 2：在 `tasks.json` 加入 Task 設定
開啟 `tasks.json`（`Ctrl/Cmd + Shift + P` -> 輸入 `zed: open tasks`）並加入：

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
*(Windows 使用者請將 `~/.config/zed/` 替換為 `C:\\Users\\<使用者名稱>\\AppData\\Roaming\\Zed\\`)*

### 步驟 3：在 `keymap.json` 加入快捷鍵綁定
開啟 `keymap.json`（`Ctrl/Cmd + Shift + P` -> 輸入 `zed: open keymap`）並加入：

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

## ⚡ 打字就更新（選用）

由於現有機制限制，目前較難直接做到「未存檔即時打字預覽」。如果你習慣邊打字邊即時看到效果，又不想頻繁按 `Ctrl+S` / `Cmd+S`，可以在 Zed 開啟自動存檔：

只需要在 Zed 的 `settings.json`（按 `Ctrl/Cmd + Shift + P` 搜尋 `zed: open settings`）加入以下設定：

```json
{
  "autosave": {
    "after_delay": {
      "milliseconds": 500
    }
  }
}
```

#### 運作效果：
1. **打字停頓 0.5 秒**：Zed 會在背景自動存檔（不需手按 `Ctrl+S` / `Cmd+S`）。
2. **後台防抖保護**：伺服器收到檔案變動通知後，經過 120ms 防抖過濾磁碟雜訊，再推播給瀏覽器。
3. **近即時體驗**：藉由自動存檔無感觸發 CSS 零刷新抽換或 HTML 頁面重整。

---

## 🧹 解除安裝

若要自系統中完整移除 Zero Preview：

```bash
node install.js --uninstall
```

---

## 🔍 除錯與執行記錄（Logs）

如果預覽運作不符合預期，即時執行日誌會記錄在：
- **Windows**：%APPDATA%\Zed\live-preview\debug.log
- **macOS / Linux**：`~/.config/zed/live-preview/debug.log`

---

## 📄 開源授權

本專案採用 [MIT License](LICENSE) 授權。  
- **免責聲明**：本工具為獨立開發，不屬於 Zed Industries，也沒有獲得官方背書，請不要視為官方套件。  
- **AI 揭露**：本專案全程由開發者 kuozher 構思，實做則交由 Gemini 3.8 Flash (High) 藉由 Antigravity IDE 進行。
