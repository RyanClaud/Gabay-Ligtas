#!/bin/bash

echo "Setting up Gabay Ligtas development environment..."
echo

echo "1. Installing dependencies..."
npm install

echo
echo "2. Setting up environment file..."
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo "Created .env.local from example"
    echo "Please edit .env.local and add your Gemini API key"
else
    echo ".env.local already exists"
fi

echo
echo "3. Building the project..."
npm run build

echo
echo "Setup complete!"
echo
echo "Next steps:"
echo "1. Edit .env.local and add your Gemini API key"
echo "2. Run 'npm run dev' to start development server"
echo "3. Run 'npm run build' to build for production"
echo