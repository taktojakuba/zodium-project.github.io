# Package Management

---

## Why Can't I Just Use `dnf install`?

If you're coming from Fedora, your first instinct might be to run `dnf install something`. On Zodium distros, that won't work for installing new packages — and that's intentional.

Zodium uses an **image-based system** (via `bootc`). The root filesystem is read-only and managed as a whole image, not as individual packages. This is what makes it reliable, reproducible, and easy to update atomically — but it means the traditional "install packages directly onto the system" approach is replaced by better alternatives.

> **/usr is read only.** You don't manually edit files in /usr , its not possible , use /etc for system-wide settings & $HOME for user settings .

`dnf` is still present for querying and inspecting packages, but using it to install software directly into the base system is not supported and will harmlessly fail with a warning.

---

## Available Package Managers

Zodium distros supports six ways to install software. Here's a quick overview:

---

### 🍺 Brew (Homebrew) — **Installed by default**

Homebrew, originally a macOS tool, runs entirely in userspace under `/home/linuxbrew`. It doesn't touch the system and installs a huge range of CLI tools and developer utilities.

Best for: **CLI tools, developer utilities, languages (Node, Python, Ruby, etc.)**

>We recommend installing bbrew (bold brew) if you want a nice TUI way of managing Homebrew.

---

### ❄️ Nix — **Installed by default**

Nix is a powerful package manager with its own package repository (nixpkgs — one of the largest in existence). Packages are isolated and reproducible. You can install packages per-user without affecting anything else on the system.

Best for: **Developer tools, reproducible environments, packages not available elsewhere**

>**NOTE**: compared to nixOS, nix on zodium distros might be limited, but package installation & basic usecase is flawless.

---

### 📦 Flatpak — **Installed by default**

Flatpak is the standard way to install desktop GUI applications on modern Linux. Apps are sandboxed and self-contained. Flathub is the main repository and hosts thousands of apps.

Best for: **Desktop GUI apps — browsers, media players, creative tools, games**

---

### 🧱 rpm-ostree — **Installed by default**

`rpm-ostree` lets you layer RPM packages on top of the base image. These are applied at the system level and persist across reboots. Use this sparingly — it's meant for things that truly need to be part of the base system (low-level tools).

Best for: **System-level packages that can't run in userspace**
Problems: **Longer update times, Less stability, Can break system if used carelessly**

>**NOTE**: rpm-ostree is considered depricated & will be replaced by dnf5+bootc in near future.

>**NOTE**: using rpm-ostree to install or replace kmods & kernel is unsupported.

---

### 📁 AppImages — **User installed**

AppImages are standalone executable files — download, make executable, run. No installation required, no package manager involved. They're self-contained bundles that work on any Linux system.

Best for: **One-off apps, things not packaged elsewhere, portable software**

AppImages don't require any setup — they work out of the box on Zodium.

>We recommend installing `grear lever` for managing appimages, It makes updating & managing appimages effortless.

---

### 📦 Distrobox — **User installed**

Distrobox creates full Linux container environments using Podman or Docker. You can run a complete Ubuntu, Arch, or Fedora environment inside a container, with access to that distro's full package manager (`apt`, `pacman`, `dnf`) — and export apps to your desktop as if they were native.

Best for: **Software only available on specific distros, development environments, running package managers like `zypper`,`apt`,`dnf`,`pacman`**

Install via Brew:

```bash
brew install distrobox
```

>We recommend instaling `distro shelf` for managing distrobox, It provides you with a GUI to manage distrobox.

---

## At a Glance

| Manager | Default? | Best For |
|---|---|---|
| Flatpak | ✔ Yes | GUI desktop apps |
| Brew | ✔ Yes | CLI tools, dev utilities |
| Nix | ✔ Yes | Dev tools, reproducible envs |
| rpm-ostree | ✔ Yes | System-level RPM packages |
| AppImages | ✚ User | Portable standalone apps |
| Distrobox | ✚ User | Full distro containers |

---