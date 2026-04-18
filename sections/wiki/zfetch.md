# zfetch

Fast, good-looking system info fetch written in Rust. Themes, inline images, TUI config editor.

## Overview

zfetch displays system information with clean visuals, supports multiple themes, auto-resizes to your terminal width, and ships a TUI for configuration — no manual TOML editing required unless you want it.

## Installation

```bash
git clone https://github.com/zodium-project/zfetch
cargo install --path .
```

Or grab a precompiled binary from the GitHub releases page — no Rust toolchain required.

## Flags

- `--os <name>` — override the displayed distro logo
- `--image` — render inline images using your terminal's protocol
- `--config` — open the interactive TUI config editor
- `--refresh` — invalidate and rebuild all cached values
- `--update` — migrate config to the latest schema version

## Configuration

Config lives at `~/.config/zfetch/config.toml` and is auto-generated on first run. Launch the built-in TUI with `zfetch --config` for a visual editor — no manual TOML editing needed.