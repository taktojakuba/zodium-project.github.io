# Package Management — Part 3: Keeping Everything Updated

---

## How Updates Work on Zodium

Zodium uses `zync` as a unified update tool. It handles updates for the base system image, layered RPM packages, Flatpaks, Brew, and Nix — so you don't need to remember separate commands for each package manager.

---

## Manual Updates

### Update Everything at Once

```bash
zync --all
```

This runs updates across all package managers in one go: system image, Flatpaks, Brew packages, Nix packages, and any layered RPMs.

### Update a Specific Manager Only

You can also target individual package managers:

```bash
zync              # updates the base system image + layered RPMs
zync --flatpak    # Flatpak apps only
zync --brew       # Homebrew packages only
```

> **Do I need to reboot after `zync`?** Only if the base system image or an rpm-ostree layer was updated. Flatpak, Brew, and Nix updates apply immediately without a reboot.

---

## Automatic Updates

### Enable Auto-Updates

```bash
zync --auto-updates
```

This opens an interactive TUI (terminal UI) where you can configure automatic update behavior — what gets updated, when, and how.

### How Auto-Updates Work

- **No forced reboots.** Zync never reboots your system automatically.
- **Updates stage in the background.** When a system update is ready, it's downloaded and prepared while you work.
- **Applied on your next reboot.** When you choose to reboot (or restart normally), the staged update is applied. If you don't reboot, nothing changes.
- **All other updates** (Flatpak, Brew, Nix) apply silently in the background without needing a reboot at all.

> This means you're always in control. Your system will never restart on you mid-work.

---

## Update Summary

| What | Manual Command | Auto-updated? |
|---|---|---|
| Base system image | `zync` | ✔ Yes (staged, applied on reboot) |
| rpm-ostree layers | `zync` | ✔ Yes (staged, applied on reboot) |
| Flatpak apps | `zync --flatpak` | ✔ Yes (no reboot needed) |
| Brew packages | `zync --brew` | ✔ Yes (no reboot needed) |
| Nix packages | `zync --nix` | ✔ Yes (no reboot needed) |
| Everything | `zync --all` | ✔ Yes |

---