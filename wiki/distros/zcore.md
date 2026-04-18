# zcore

Minimal, image-based Linux distribution built on fedora-bootc. No desktop by default — extend it into anything.

## Overview

zcore is a minimal, image-based distribution built on **fedora-bootc**. It ships a clean, practical foundation — no desktop environment — along with essential drivers, multimedia codecs, and sensible system defaults. Designed for bootc-style deployments, homelabs, workstations, and custom desktop spins.

## Philosophy

Minimal without being unusable. zcore skips the package bloat and unnecessary desktop stacks in favour of a **predictable, maintainable base**. Curated hardware support and codecs out of the box mean you can start building immediately — without hunting down drivers first.

> **Note:** zcore is not a full desktop. Look at the flavours — zynori or zykron — if you want a ready-to-use desktop environment.

## Variants

**zcore-bootc** — Standard base for Intel and AMD GPU systems. No proprietary drivers.

**zcore-nvidia** — Includes proprietary NVIDIA drivers. Requires Turing architecture or newer.

## Switching to zcore

```bash
sudo bootc switch ghcr.io/zodium-project/zcore-bootc:latest
```

Run the command, wait for the image to stage, then reboot. The next boot is your new system.

## Download

- zcore-bootc (intel/amd) — https://archive.org/download/zcore-bootc/zcore-bootc.iso
- zcore-nvidia (nvidia) — https://archive.org/download/zcore-nvidia/zcore-nvidia.iso

## What's included

- OCI image-based — fully reproducible and layerable
- No desktop environment — start clean, add what you need
- Non-free multimedia codecs included out of the box
- Out-of-tree kernel modules and hardware support
- Podman and Docker included and configured
- Modern CLI tooling, udev rules, and firmware packages
- Performance-oriented kernel and system tweaks applied by default
- Easily extended via `FROM` in your own Containerfile