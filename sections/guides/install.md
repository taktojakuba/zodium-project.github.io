## Overview

This guide walks you through installing zynori on a bare machine using a bootable ISO.

## What you'll need

- A USB drive (8GB or larger)
- ISO downloaded from the wiki (or get-started)
- A machine with UEFI firmware

## Hardware requirements
- 8GB RAM (or above) is recommended , but 4GB RAM can work
- Any decent intel/amd cpu from last 10-12 years should work
- SSD's are recommended for a much better experience

``
Note: for nvidia devices ,old GTX1000 series card wont work with nvidia drivers
``

``
Note: for those gpu's its recommended to use intel/amd iso as kernel provides basic functionality.
``

## Step 1 — Flash the ISO

Use any flashing tool. `dd` works fine:

```bash
sudo dd if=zcore-bootc.iso of=/dev/sdX bs=4M status=progress
```

Replace `/dev/sdX` with your actual USB device.

Use fedora's `mediawriter` if you want a gui flashing tool

``
NOTE: ventoy support may be hit or miss
``
## Step 2 — Boot from USB

Reboot, enter your firmware and set the USB as the first boot device. zcore uses the Anaconda installer — follow the prompts/setps of installer.

## Step 3 — First boot

Once installed, zynori starts with SDDM login manager , enter you password here and complete first run wizard/steps.

if you want to rebase to another flavour without reinstalling
```bash
sudo bootc switch ghcr.io/zodium-project/"image name"
```

> **Tip:** Run `zync --all` after first boot to make sure everything is up to date.