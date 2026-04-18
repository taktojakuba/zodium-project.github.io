## Driver install

The `zcore-nvidia` image ships proprietary NVIDIA drivers pre-baked. There is nothing to install manually — they are part of the image.

## Verify the driver is loaded

After rebooting into `-nvidia`, check that the kernel module is active:

```bash
lsmod | grep nvidia
```

You should see `nvidia`, `nvidia_modeset`, and `nvidia_uvm` listed.

## Check driver version

```bash
nvidia-smi
```

This prints the driver version and basic GPU info. If this command fails, the driver did not load correctly — go back to step 1 and confirm you are booted into `zcore-nvidia`.

## Wayland note

NVIDIA on Wayland requires `nvidia-drm.modeset=1`. This kernel parameter is already set by default in `-nvidia` images — you do not need to configure it manually.