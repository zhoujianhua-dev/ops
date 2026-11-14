#!/bin/bash
set -e
curl -fsSL https://tailscale.com/install.sh | sh
echo INSTALL-DONE
tailscale version | head -1
