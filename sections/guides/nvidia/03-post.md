## Post-install

Driver is loaded. A few final things to check before using your system.

## zgpu

zcore ships `zgpu` for GPU selection and PRIME offload. Verify it detects your card:

```bash
zgpu --list-devices
```

You can then run any app on the NVIDIA GPU explicitly:

```bash
zgpu --use-device nvidia -- your-app
```
or 
if you only have 1 Dgpu you can just use
```
zgpu you-app 
```

``
Note: on fedora prime-run is not avaliable , you are supposed to use zgpu on zodium project images .
``

## Updates

NVIDIA drivers are tied to the image. Keep them updated with:

```bash
zync --rpm-ostree
```

Then reboot to apply. That's it — your NVIDIA setup is complete.