# NVIDIA Setup — Part 1: Prerequisites & Driver Install

---

## Before You Start

This guide covers setting up NVIDIA drivers on **Zodium Project** (`zcore`) images. If you've never done this before, read this section carefully — skipping it is the most common reason things break.

---

## Supported Hardware

NVIDIA support requires **Turing architecture or newer**. That means:

- ✔ GTX 16 series (1650, 1660, etc.)
- ✔ RTX 20 series (2060, 2070, 2080, etc.)
- ✔ RTX 30 series
- ✔ RTX 40 series & above
- ✗ GTX 10 series and older — **not supported**

> **Not sure what GPU you have?** On Windows you can check Device Manager. On Linux, run `lspci | grep -i nvidia` before switching images.

---

## Step 1 — Check That Your GPU Is Detected

Run:

```bash
zgpu
```

You should see your GPU listed in the output, like this:

![zgpu output showing detected GPU](../screenshots/zgpu-output.png)

If nothing appears:
- check if nvidia drivers are installed
- Reseat the GPU in its PCIe slot
- Check BIOS/UEFI to make sure the slot is enabled
- Make sure the power connectors are fully plugged in (for discrete cards)

---

## Step 2 — Switch to the NVIDIA Image

If you installed a standard `-bootc` image (no GPU support), you need to switch to the `-nvidia` variant first. Run:

```bash
sudo bootc switch ghcr.io/zodium-project/zcore-nvidia:latest
```

This stages the new image in the background — it won't affect your running system yet. Wait for it to finish, then **reboot**:

```bash
reboot
```

> **Why reboot?** The NVIDIA image includes pre-baked drivers. The switch only takes effect after a restart.

---

## Step 3 — Verify the Driver Loaded

After rebooting into `zcore-nvidia`, check that the kernel module is active:

```bash
lsmod | grep nvidia
```

A successful result looks like this:

![lsmod showing nvidia modules](../screenshots/lsmod-nvidia.png)

You should see `nvidia`, `nvidia_modeset`, and `nvidia_uvm` all listed. If you see nothing, the driver did not load — go back to Step 2 and confirm you actually rebooted into the correct image. You can check with `bootc status`.

---

## Step 4 — Check the Driver Version

```bash
nvidia-smi
```

If the driver loaded correctly, you'll see something like this:

![nvidia-smi output](../screenshots/nvidia-smi-output.png)

If `nvidia-smi` fails or returns an error, the driver didn't load correctly. Revisit Step 2.

> **Note on Wayland:** NVIDIA on Wayland requires the `nvidia-drm.modeset=1` kernel parameter. In `zcore-nvidia` images, **this is already set for you** — no manual configuration needed.

---

Continue to **Part 2** to configure GPU selection and keep your drivers updated.