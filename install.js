#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const isUninstall = process.argv.includes('--uninstall') || process.argv.includes('-u');

function getZedConfigDir() {
  const platform = process.platform;
  if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'Zed');
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), '.config', 'zed');
  } else {
    const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
    return path.join(xdgConfig, 'zed');
  }
}

function stripJsonComments(str) {
  return str.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => (g ? '' : m));
}

function readJsonSafe(filePath, defaultValue = []) {
  if (!fs.existsSync(filePath)) return defaultValue;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const cleaned = stripJsonComments(content).trim();
    if (!cleaned) return defaultValue;
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn(`[!] Warning: Could not parse ${filePath} (${err.message}). A backup will be created.`);
    const backupPath = `${filePath}.bak.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`[+] Backup saved to: ${backupPath}`);
    return defaultValue;
  }
}

function install() {
  const zedDir = getZedConfigDir();
  console.log(`\n========================================`);
  console.log(`  Zero Preview Installer for Zed Editor `);
  console.log(`========================================\n`);
  console.log(`Detected OS: ${process.platform}`);
  console.log(`Zed configuration directory: ${zedDir}`);

  if (!fs.existsSync(zedDir)) {
    fs.mkdirSync(zedDir, { recursive: true });
  }

  const targetDir = path.join(zedDir, 'live-preview');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Copy files
  const filesToCopy = ['cli.js', 'server.js'];
  if (process.platform === 'win32') {
    filesToCopy.push('run-hidden.vbs');
  }

  console.log(`\n[1/3] Copying runtime scripts to ${targetDir}...`);
  for (const file of filesToCopy) {
    const src = path.join(__dirname, file);
    const dest = path.join(targetDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`  ✓ ${file}`);
    } else {
      console.error(`  ✗ Source file missing: ${src}`);
    }
  }

  // 2. Configure tasks.json
  console.log(`\n[2/3] Configuring tasks.json...`);
  const tasksPath = path.join(zedDir, 'tasks.json');
  let tasks = readJsonSafe(tasksPath, []);
  if (!Array.isArray(tasks)) tasks = [];

  const cliPath = path.join(targetDir, 'cli.js');

  const previewTask = {
    label: 'Live Preview: Open Current File',
    command: 'node',
    args: [cliPath, '$ZED_FILE'],
    use_new_terminal: false,
    allow_concurrent_runs: true,
    reveal: 'never',
    hide: 'always',
    save: 'current'
  };

  const stopTask = {
    label: 'Live Preview: Stop Server',
    command: 'node',
    args: [cliPath, '--stop'],
    use_new_terminal: false,
    allow_concurrent_runs: true,
    reveal: 'never',
    hide: 'always'
  };

  // Remove existing tasks with matching label if present
  tasks = tasks.filter(
    (t) => t.label !== 'Live Preview: Open Current File' && t.label !== 'Live Preview: Stop Server'
  );
  tasks.push(previewTask, stopTask);

  fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
  console.log(`  ✓ Tasks updated successfully in ${tasksPath}`);

  // 3. Configure keymap.json
  console.log(`\n[3/3] Configuring keymap.json...`);
  const keymapPath = path.join(zedDir, 'keymap.json');
  let keymap = readJsonSafe(keymapPath, []);
  if (!Array.isArray(keymap)) keymap = [];

  let workspaceContext = keymap.find((item) => item.context === 'Workspace');
  if (!workspaceContext) {
    workspaceContext = { context: 'Workspace', bindings: {} };
    keymap.push(workspaceContext);
  }
  if (!workspaceContext.bindings) workspaceContext.bindings = {};

  // Register cross-platform shortcut bindings
  // Windows / Linux: Ctrl+Alt+V
  // macOS: Cmd+Option+V (Option is mapped to 'alt' in Zed keymaps)
  workspaceContext.bindings['ctrl-alt-v'] = [
    'task::Spawn',
    { task_name: 'Live Preview: Open Current File' }
  ];
  workspaceContext.bindings['ctrl-alt-shift-v'] = [
    'task::Spawn',
    { task_name: 'Live Preview: Stop Server' }
  ];
  workspaceContext.bindings['cmd-alt-v'] = [
    'task::Spawn',
    { task_name: 'Live Preview: Open Current File' }
  ];
  workspaceContext.bindings['cmd-alt-shift-v'] = [
    'task::Spawn',
    { task_name: 'Live Preview: Stop Server' }
  ];

  fs.writeFileSync(keymapPath, JSON.stringify(keymap, null, 2), 'utf-8');
  console.log(`  ✓ Keybindings updated in ${keymapPath}`);

  console.log(`\n========================================`);
  console.log(`  Installation Complete!                `);
  console.log(`========================================\n`);
  console.log(`How to use in Zed:`);
  console.log(`  • Keyboard Shortcut:`);
  console.log(`    - Windows / Linux : Ctrl + Alt + V`);
  console.log(`    - macOS           : Cmd + Option + V`);
  console.log(`  • Command Palette:`);
  console.log(`    - Press Ctrl+Shift+P (or Cmd+Shift+P) and search "Live Preview"`);
  console.log(`  • Stop Server:`);
  console.log(`    - Windows / Linux : Ctrl + Alt + Shift + V`);
  console.log(`    - macOS           : Cmd + Option + Shift + V\n`);
}

function uninstall() {
  const zedDir = getZedConfigDir();
  console.log(`\nUninstalling Zero Preview from: ${zedDir}...`);

  // Remove from tasks.json
  const tasksPath = path.join(zedDir, 'tasks.json');
  if (fs.existsSync(tasksPath)) {
    let tasks = readJsonSafe(tasksPath, []);
    if (Array.isArray(tasks)) {
      tasks = tasks.filter(
        (t) => t.label !== 'Live Preview: Open Current File' && t.label !== 'Live Preview: Stop Server'
      );
      fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf-8');
      console.log(`  ✓ Removed Live Preview tasks from tasks.json`);
    }
  }

  // Remove from keymap.json
  const keymapPath = path.join(zedDir, 'keymap.json');
  if (fs.existsSync(keymapPath)) {
    let keymap = readJsonSafe(keymapPath, []);
    if (Array.isArray(keymap)) {
      for (const item of keymap) {
        if (item.bindings) {
          delete item.bindings['ctrl-alt-v'];
          delete item.bindings['ctrl-alt-shift-v'];
          delete item.bindings['cmd-alt-v'];
          delete item.bindings['cmd-alt-shift-v'];
        }
      }
      fs.writeFileSync(keymapPath, JSON.stringify(keymap, null, 2), 'utf-8');
      console.log(`  ✓ Removed Live Preview bindings from keymap.json`);
    }
  }

  // Remove live-preview directory
  const targetDir = path.join(zedDir, 'live-preview');
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.log(`  ✓ Removed ${targetDir}`);
  }

  console.log(`\nUninstallation complete.\n`);
}

if (isUninstall) {
  uninstall();
} else {
  install();
}
