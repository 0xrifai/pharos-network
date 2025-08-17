#!/bin/bash

# Set SSL verification to disabled for external API calls
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Run the CFD trading automation
echo "Starting CFD Trading with SSL verification disabled..."
npm run dev 