# Package Management

---

## Flatpak

Flatpak is the easiest way to install desktop apps on Zodium. The main repository is **Flathub**, which is pre-configured.

### Bazaar — Browse & Install Apps Graphically

Zodium ships **Bazaar**, a graphical app browser for Flatpaks. Open it from your app launcher to browse, search, and install apps without touching the terminal.

> If you just want to install apps like a normal person, Bazaar is the place to start.

### Install a Flatpak from the Terminal

```bash
flatpak install flathub com.application.Name
```

For example, to install VLC:

```bash
flatpak install flathub org.videolan.VLC
```

### Run a Flatpak App

```bash
flatpak run com.application.Name
```

Installed Flatpak apps also appear in your app launcher automatically.

### Remove a Flatpak

```bash
flatpak uninstall com.application.Name
flatpak uninstall --unused --delete-data -y
```

### Search for Apps

```bash
flatpak search keyword
```

📖 Browse all available apps: [flathub.org](https://flathub.org)

---

## Brew (Homebrew)

Homebrew is great for CLI tools and developer utilities. It lives entirely in your home directory and doesn't need root.

### Install a Package

```bash
brew install package-name
```

For example:

```bash
brew install git
brew install ffmpeg
brew install node
```

### Search for a Package

```bash
brew search keyword
```

Or browse online: [formulae.brew](https://formulae.brew.sh)

### Remove a Package

```bash
brew uninstall package-name
```

### List Installed Packages

```bash
brew list
```

📖 Full Homebrew docs: [docs.brew](https://docs.brew.sh)

---

## Nix

Nix has one of the largest package repositories on the planet (nixpkgs). Packages install per-user and are completely isolated — installing or removing something in Nix cannot break anything else on your system.

### Search for a Package

Before installing, search to find the exact package name:

```bash
nix search nixpkgs package-name
```

Or browse online: [nixos.org](https://search.nixos.org/packages)

### Install a Package (Temporary / Try It Out)

```bash
nix-shell -p package-name
```

This drops you into a shell with the package available. When you exit, it's gone. Great for trying things without committing.

### Install a Package Permanently (nix-env)

```bash
nix-env -iA nixpkgs.package-name
```

For example:

```bash
nix-env -iA nixpkgs.htop
nix-env -iA nixpkgs.ripgrep
```

### Remove a Package

```bash
nix-env -e package-name
```

### List Installed Packages

```bash
nix-env -q
```

📖 Nix guides & full documentation: [nixos.org/learn](https://nixos.org/learn)
📖 Search packages: [nixos.org/packages](https://search.nixos.org/packages)

---

## rpm-ostree

Use `rpm-ostree` when you need to layer a package directly onto the base system — for things that genuinely can't run in userspace (low-level system tools). Prefer Flatpak, Brew, or Nix for everything else.

> **Heads up:** rpm-ostree changes require a reboot to take effect. The system is not modified live.

> **NOTICE**: if you really want to apply updates live without reboot use , `rpm-ostree --apply-live --allow-replacement` , use it with caution as it can break stuff.

### Layer a Package

```bash
rpm-ostree install package-name
```

Then reboot:

```bash
systemctl reboot
```

### Remove a Layered Package

```bash
rpm-ostree uninstall package-name
```

Reboot to apply.

### Check What's Layered

```bash
rpm-ostree status
```

📖 rpm-ostree docs: [coreos.github.io](https://coreos.github.io/rpm-ostree)

---

## AppImages

AppImages are single executable files — no installation, no package manager. Download, make executable, run.

### How to Use an AppImage

1. Download the `.AppImage` file from the app's website
2. Make it executable:

```bash
chmod +x YourApp.AppImage
```

3. Run it:

```bash
./YourApp.AppImage
```

That's it. To "uninstall", just delete the file.

### Adding to Your App Launcher (Optional)

If you want the AppImage to show up in your app launcher like a normal app, you can use a tool like `gear lever` (available on Flathub) which handles AppImage integration automatically.

```bash
flatpak install flathub it.mijorus.gearlever
```

---

## Distrobox

Distrobox creates containers running other Linux distros, giving you access to their package managers. Apps inside containers can be exported to your desktop as if they were native.

### Install Distrobox First

```bash
brew install distrobox
```

### Create a Container

```bash
distrobox create --name mybox --image ubuntu:24.04
```

You can use any distro image — Ubuntu, Arch, Fedora, Debian, etc.

### Enter the Container

```bash
distrobox enter mybox
```

Once inside, you have full access to that distro's package manager:

```bash
sudo apt install something   # inside Ubuntu container
```

### Export an App to Your Desktop

After installing an app inside the container, export it so it appears in your launcher:

```bash
distrobox-export --app app-name
```

### List Your Containers

```bash
distrobox list
```

### Remove a Container

```bash
distrobox rm mybox
```

📖 Distrobox full documentation: [distrobox.it](https://distrobox.it)

---