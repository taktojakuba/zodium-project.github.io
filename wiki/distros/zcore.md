# zcore

Minimal, Immutable Linux distribution, No desktop by default, used as base for **zynori** & **zykron**.

## Overview

zcore is a minimal, image-based distribution built on **fedora-bootc**. It ships a clean, practical foundation — no desktop environment — along with essential drivers, multimedia codecs, and sensible system defaults. Designed for bootc-style deployments, homelabs, workstations, and custom desktop spins.

## Philosophy

Minimal without being unusable. zcore skips the package bloat and unnecessary desktop stacks in favour of a **predictable, maintainable base**. Curated hardware support and codecs out of the box mean you can start building immediately — without hunting down drivers first.

> **Note:** zcore is not a full desktop. Look at the flavours — zynori or zykron — if you want a ready-to-use desktop environment.

> **Note**: zcore ships with zsh shell configured out of box with the following preconfigured :
 - Starship
 - eza, fd-find, btop, ripgrep, trash-cli, zoxide & bat **preinstalled**
 - custom shell aliases
 - hints & tips shown when  using commands (limited)
 - zsh-autosuggestions & zsh-syntax-highlighting

 To configure them & enable/disable them look at config in **/etc/zshrc** & write your overrdes in **/etc/zsh-zodium-overrides**

## Variants

**zcore-bootc** — Standard base for Intel and AMD GPU systems.
**zcore-nvidia** — Includes proprietary NVIDIA drivers. Requires Turing architecture or newer.

## Switching to zcore

```bash
sudo bootc switch ghcr.io/zodium-project/zcore-bootc:latest
```

Run the command, wait for the image to stage, then reboot. The next boot is your new system.

## Download

- zcore-bootc (intel/amd) — [zcore-booc.iso](https://archive.org/download/zcore-bootc/zcore-bootc.iso)
- zcore-nvidia ( nvidia) — [zcore-nvidia.iso](https://archive.org/download/zcore-nvidia/zcore-nvidia.iso)

## What's included

### zcore-bootc :
- Non-free multimedia codecs
- FFmpeg with all plugins & codecs support
- Non-free Intel & AMD drivers
- Non-free gstreamer plugins
- Pipewire with aptx support & more
- Non-free mesa drivers & extensions
- Docker , Podman & Waydroid
- Udev rules for better hardware support
- Out-of-tree kmods

### zcore-nvidia :
- All of the above
- Nvidia container toolkit
- Proprietary nvidia drivers
- Nvidia specific services & tweaks