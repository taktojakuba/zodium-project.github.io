# Booting from a USB Drive

Once you have flashed your ISO to a USB drive, follow these steps to boot from it.

## Steps

### 1. Disable Secure Boot

Most systems have Secure Boot enabled by default, which will block `Out of tree` kernel modules from loading 
> eg. nvidia , xpadneo , xone , openrazer , displaylink , openZFS

> **NOTE**: you can enable secure boot again after `MOK enrollment` as it will load module as signed after that

To disable it:

- Shut down your machine
- Power it back on and immediately press the BIOS/UEFI key — this is usually `F2`, `F10`, `F12`, `DEL`, or `ESC` depending on your motherboard (it's shown briefly on screen during POST)
- Navigate to the **Security** or **Boot** tab
- Find **Secure Boot** and set it to **Disabled**
- Save and exit — usually `F10`

### 2. Plug in your USB drive

Insert your flashed USB drive into an available USB port before booting.

### 3. Enter the Boot Menu

Power on your machine and press the boot menu key — typically `F11`, `F12`, or `ESC`. This is different from the BIOS key and brings up a one-time boot device selector without changing your permanent boot order.

> **Note:** The exact key varies by manufacturer — common ones are listed below:
>
> | Manufacturer | BIOS Key | Boot Menu Key |
> |---|---|---|
> | Dell | F2 | F12 |
> | HP | F10 / ESC | F9 / ESC |
> | Lenovo | F2 / DEL | F12 |
> | ASUS | DEL / F2 | F8 / ESC |
> | MSI | DEL | F11 |
> | Gigabyte | DEL | F12 |
> | Acer | F2 / DEL | F12 |

### 4. Select your USB drive

In the boot menu, find your USB drive — it may appear as the drive brand name, or as something like `USB HDD` or `UEFI: [drive name]`. Select it and press `Enter`.

### 5. Boot into the ISO

The zodium ISO will begin loading. This may take a moment on first boot.

---

> **Note:** If your machine boots straight to your existing OS and ignores the USB, double-check that Secure Boot is disabled and that the drive was correctly flashed.

> **Note:** If you see two entries for your USB (one with `UEFI:` prefix and one without), always prefer the `UEFI:` one.