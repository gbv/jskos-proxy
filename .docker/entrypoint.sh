#!/bin/bash

# Build site in background
bash build.sh &

pm2-runtime src/server/server.js
