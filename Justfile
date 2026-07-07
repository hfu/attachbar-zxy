#!/usr/bin/env just --justfile

# Default target
default:
  @just --list

# Build the demo site for production
build:
  npm run build

# Start development server with LAN access
dev:
  npm run dev -- --host

# Preview the production build with LAN access
preview:
  npm run preview -- --host

# Install dependencies
install:
  npm install

# Run tests
test:
  npm test
