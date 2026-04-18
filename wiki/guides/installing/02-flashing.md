# Flashing a USB Drive

You can use **Fedora Media Writer** to flash your ISO file to a USB drive.

## Steps

### 1. Download Fedora Media Writer

Get it from the official Fedora site at [FedoraQt](https://github.com/FedoraQt/MediaWriter) — it's available for Windows, macOS, and Linux.

>for linux users its also avaliable at AUR & Flathub

### 2. Open Fedora Media Writer

Launch the app after installing it.

### 3. Select "Custom Image"

On the main screen, choose **Select .iso file** instead of any of the prebuilt Fedora options.

### 4. Select your ISO

Browse to and select the zodium `.iso` file you downloaded.

### 5. Select your USB drive

Choose your USB drive from the device dropdown. Double-check it's the correct drive — this will erase everything on it.

### 6. Click "Write"

Hit **Write** and wait for the process to complete. It may take a few minutes depending on the ISO size.

---

> **Note:** Other tools like `dd`, Popsicle, Balena Etcher, and Rufus may work but have not been tested.

> **Note:** Although users have reported success with Ventoy, support may be hit or miss for bootc images.