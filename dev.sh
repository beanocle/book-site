#!/bin/sh
# Development environment (Git Bash / POSIX):  . ./dev.sh
# Requires Node 22+ (Astro 7). Machine-specific settings (PATH to Node, extra CA, proxy)
# go in dev.local.sh, which is git-ignored and sourced here if present.
[ -f ./dev.local.sh ] && . ./dev.local.sh
echo "node $(node -v), npm $(npm -v)"
