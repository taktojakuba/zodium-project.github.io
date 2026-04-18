# zrun

TUI shell-script launcher with fuzzy search, tagging, and run history. Written in Rust.

## Overview

zrun is a fast TUI-based script launcher. Browse, search, tag, and execute shell scripts from a single interface. No external dependencies — one static binary.

## Installation

```bash
cargo install --path .
```

Prebuilt binaries are also available on the releases page.

## Commands

- `zrun` — open the interactive TUI picker
- `zrun run <name>` — run a script directly by name
- `zrun list` — list all scripts with tags
- `zrun show <name>` — preview script contents with highlighting
- `zrun edit <name>` — open a script in your configured editor
- `zrun history` — view the full run history log

## Features

Built-in fuzzy search, script tagging via inline comments, run history tracking, syntax highlighting in preview mode, and a multi-directory priority system for organising script collections.

## Configuration

Config at `~/.config/zrun/config.toml`. Not auto-created — only add it when you need to customise script directories, history limits, or editor preferences.