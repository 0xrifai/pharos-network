#!/bin/bash

echo "Setting up Pharos Network Next.js project..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Install additional dependencies for Tailwind CSS
echo "Installing Tailwind CSS..."
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env-example .env
    echo "Please edit .env file with your configuration"
fi

echo "Setup completed!"
echo "Run 'npm run dev' to start the development server" 