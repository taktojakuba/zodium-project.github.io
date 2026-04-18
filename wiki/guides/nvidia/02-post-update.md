# NVIDIA Setup — Part 2: GPU Selection & Updates

---

## Your Driver Is Loaded — Now What?

If `nvidia-smi` worked in Part 1, you're in good shape. This section covers:

- Running apps on your NVIDIA GPU
- Keeping drivers updated
- Secure boot support

---

## GPU Selection with `zgpu`

Zodium images ship a tool called `zgpu` for GPU selection and PRIME offload. PRIME offload is how Linux handles systems with more than one GPU (e.g., a laptop with an integrated Intel/AMD GPU and a discrete NVIDIA card).

> **Why does this matter?** By default, your system may render on the integrated GPU to save power. `zgpu` lets you explicitly tell it to use the NVIDIA card for a specific app.

### Check That zgpu Detects Your Card

```bash
zgpu --list-devices
```

You should see your NVIDIA GPU listed alongside any integrated GPU, like this:

![zgpu --list-devices output](../screenshots/zgpu-list-devices.png)

---

## Running Apps on the NVIDIA GPU

### If You Have 2 GPUs (integrated + discrete)

Use the `--use-device` flag to target the NVIDIA card:

```bash
zgpu --use-device nvidia -- your-app
```

Replace `your-app` with whatever you want to launch, for example:

```bash
zgpu --use-device nvidia -- blender
zgpu --use-device nvidia -- steam
```

### If You Only Have 1 DGPU (discrete)

You can skip the flag entirely:

```bash
zgpu your-app
```

> **Coming from other distros?** You may be used to `prime-run`. That tool is **not available** on fedora — `zgpu` is the replacement. Use it instead.

> **Does zgpu work with steam like prime-run?** It may or may not because on fedora there is no prime-run package , you are supposed to use `zgpu` or env-vars instead.
---

## Keeping Drivers Updated

On Zodium, NVIDIA drivers are **tied to the image** — there's no `apt install` or `dnf update` for the driver alone. To update:

```bash
zync --rpm-ostree

or to update entire system use 

zync --all
```

This pulls the latest image (with the newest drivers & kernel baked in). Then reboot to apply:

```bash
systemctl reboot
```

> **How often should I update?** Whenever you want to , usually its recommended to either enable auto-updates or update weekly
> **How do I enable auto-updates?** Use command `zync --auto-updates` to enable & setup auto updates , they will only apply on reboot & wont interrupt you.

---

## Quick Troubleshooting Reference

| Problem | What to check |
|---|---|
| `zfetch & zgpu` shows no GPU | PCIe slot, BIOS settings, power connectors |
| `lsmod` shows no nvidia modules | Not booted into `zcore-nvidia` — run `bootc status` |
| `nvidia-smi` fails | Driver didn't load — re-check image and reboot |
| `zgpu --list-devices` shows nothing | Run `nvidia-smi` first to confirm driver is active |
| App still running on integrated GPU | Use `zgpu --use-device nvidia -- app` explicitly |

---

That's it — your NVIDIA setup on Zodium distros is complete.