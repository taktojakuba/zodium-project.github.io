# Package Management — Part 4: FAQ

---

### 1. Why doesn't `dnf install` work?

Zodium distros use an image-based root filesystem that is read-only by design. `dnf install` would try to write directly to the system, which isn't allowed. This is what keeps the system stable and reproducible.

Use **Flatpak** for GUI apps, **Brew** or **Nix** for CLI tools, and `rpm-ostree install` only for things that truly need to be part of the base system. See Part 1 for the full breakdown.

---

### 2. Which package manager should I use for a regular app?

Start here:

- **It's a desktop app (browser, media player, game, creative tool)?** → Flatpak / Bazaar
- **It's a CLI tool or developer utility?** → Brew
- **It's not on Brew or Flatpak?** → Nix
- **It only exists on Ubuntu/Arch/Debian?** → Distrobox
- **It's available as a standalone download?** → AppImage

When in doubt, try Flatpak first, then Brew....

---

### 3. Do I need to reboot after installing something?

It depends on how you installed it:

- **Flatpak, Brew, Nix, AppImage** — No reboot needed. Available immediately.
- **rpm-ostree** — Reboot required. Changes are staged and applied on next boot.
- **Distrobox** — No reboot needed. The container starts right away.

---

### 4. Will installing packages break my system?

Flatpak, Brew, Nix, AppImages, and Distrobox are all isolated — they cannot affect the base system. You can install and remove freely without risk.

`rpm-ostree` layers packages onto the base image. It's harder to break things than with traditional `dnf`, but it's still a good idea to be selective about what you layer. If something goes wrong, `rpm-ostree reset` and a reboot will undo it.

---

### 5. How do I install something that needs `apt` or `pacman`?

Use **Distrobox**. Create a container with the distro that has the package you need:

```bash
brew install distrobox
distrobox create --name mybox --image ubuntu:24.04
distrobox enter mybox
sudo apt install whatever-you-need
```

You can then export the app to your desktop with `distrobox-export --app app-name`.

---

### 6. How do I update everything?

```bash
zync --all
```

That's it. It handles the system image, Flatpaks, Brew, Nix, and rpm-ostree layers in one command. See Part 3 for details.

---

### 7. Will `zync --auto-updates` restart my computer without asking?

No. Auto-updates on Zodium distros **never force a reboot**. System updates are staged in the background and only applied when you choose to reboot. Flatpak, Brew, and Nix updates apply silently without any reboot at all.

---

### 8. What is Bazaar and do I need it?

Bazaar is a graphical app store for Flatpaks, pre-installed on Zodium distros. If you prefer clicking over typing, use Bazaar to browse and install desktop apps without touching the terminal. It's the friendliest way to get apps installed.

You don't need it — the `flatpak install` command does the same thing — but it's there if you want it.

---

### 9. Can I use Nix flakes or home-manager on Zodium?

Yes. Nix is fully functional on Zodium and supports flakes and home-manager. These are advanced Nix features for declarative, reproducible setups. If you're already familiar with them, they work as expected.

If you're new to Nix and just want to install packages, stick with `nix-env -iA` for now and explore flakes later.

📖 Getting started with Nix: [nixos.org](https://nixos.org/learn)

---

### 10. How do I find out if a package is available before installing?

Each manager has a search command and an online browser:

| Manager | Terminal Search | Online |
|---|---|---|
| Flatpak | `flatpak search keyword` | [flathub.org](https://flathub.org) |
| Brew | `brew search keyword` | [formulae.brew.sh](https://formulae.brew.sh) |
| Nix | `nix search nixpkgs keyword` | [search.nixos.org/packages](https://search.nixos.org/packages) |
| rpm-ostree | `rpm-ostree search keyword` | — |

If a package isn't on any of them, it's likely available as an AppImage from the developer's website, or installable inside a Distrobox container.