# zync

Unified update manager — system, Flatpak, containers, firmware. One command.

## Overview

zync is a single-command update manager for Fedora Atomic and similar image-based systems. It coordinates system image updates, Flatpak, Homebrew, containers, and firmware — so you never have to remember which tool handles what.

## Installation

```bash
cargo build --release
sudo install -Dm755 target/release/zync /usr/bin/zync
```

## Flags

- `--all` — update everything in one pass
- `--flatpak` — update Flatpak packages only
- `--rpm-ostree` — update the base system image only
- `--podman` — update container images only
- `--dry-run` — preview pending changes without applying them

## Features

Rollback support, automatic updates via systemd timer, reboot detection, and cleanup modes. Works across Flatpak, rpm-ostree, Homebrew, and Podman in a single pass. Logs written to `~/.local/state/zync.log`.

> **Tip:** Run `zync --dry-run --all` first to preview what would change before committing.