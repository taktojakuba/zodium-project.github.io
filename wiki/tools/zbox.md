# zbox

Rootless container manager and distrobox replacement, built for zodium. Written in Rust.

## Overview

zbox is zodium's native container manager — a lightweight, opinionated replacement for distrobox. Manage rootless containers with a clean interface that feels native to the rest of the zodium toolchain.

> **Note:** zbox is currently in active development. This page will be updated as the tool matures.

## Philosophy

distrobox is powerful but carries significant shell-script complexity. zbox reimplements the core workflow — enter a container, export apps, manage images — as a single static Rust binary with no runtime dependencies.

## Planned features

- Create and enter rootless containers from any OCI image
- Export desktop entries and binaries to the host
- Named container profiles with persistent storage
- First-class integration with zync for container image updates
- Static binary — no shell, no Python, no runtime deps

## Status

Follow development on [GitHub](https://github.com/zodium-project). Contributions and feedback welcome.