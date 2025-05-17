#!/bin/bash

# Create necessary directories
mkdir -p content/docs
mkdir -p static/uploads

# Create a starter document
echo '---
title: "Welcome to Your New Documentation"
date: 2025-05-16T18:00:00+09:00
draft: false
---

# Welcome to Your New Documentation

Start writing your documentation here. This is a sample document created during CMS setup.

## Features

- Easy content management
- Markdown support
- Automatic version control
- Web-based editor

## Getting Started

1. Log in to the admin panel at `/admin`
2. Create new documents or edit existing ones
3. Your changes will be automatically saved and pushed to GitHub
' > content/docs/welcome.md

echo "CMS setup complete! You can now access the admin panel at /admin"
