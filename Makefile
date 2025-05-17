# Makefile for local development and automation
.PHONY: concat build serve clean

# Run concat script to gather code snippets
concat:
	npm run concat

# Build site (runs concat first)
build: concat
	npm run build

# Serve site locally with drafts (runs concat first)
serve: concat
	npm run serve

# Clean generated files
clean:
	rm -rf public concat/*
