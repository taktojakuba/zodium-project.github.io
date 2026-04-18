## Supported hardware

NVIDIA support requires **Turing architecture or newer** (RTX 20 series and up). Older cards are not supported by the proprietary driver stack included in `-nvidia` images.

## Check your GPU

```bash
zfetch --refresh
```

You should see your GPU listed. If nothing shows, double-check your PCIe slot or BIOS settings.

## Switch to the nvidia image

If you installed a `-bootc`, switch to the nvidia variant first:

```bash
sudo bootc switch ghcr.io/zodium-project/zcore-nvidia:latest
```

Reboot after staging completes before moving to the next step.