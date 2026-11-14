#!/bin/bash
tailscale set --hostname=yizhancampus
sleep 2
tailscale status | head -2
tailscale funnel --bg 8000
echo FUNNEL-DONE
tailscale funnel status
