# zgpu

GPU selection and PRIME offload launcher. Static Rust binary, no runtime dependencies.

## Overview

zgpu lets you run applications on a specific GPU — Intel, AMD, or NVIDIA — with no runtime dependencies. Built as a fully static musl binary so it works anywhere without library concerns.

## Installation

```bash
rustup target add x86_64-unknown-linux-musl
cargo build --release --target x86_64-unknown-linux-musl
cargo install --path .
```

## Usage

- `zgpu` — print a GPU detection summary
- `zgpu --list-devices` — list all detected GPUs with IDs
- `zgpu --use-device <id> -- <cmd>` — run a command on a specific GPU
- `zgpu --interactive-choose` — pick a GPU interactively
- `zgpu --verbose` — print detailed GPU capability information

## Configuration

GPU mappings and saved device names are stored in `~/.config/zgpu/defined`. Assign friendly names to devices so you can reference them by name instead of ID.