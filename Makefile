# Makefile for SPA Blog development and deployment
.PHONY: build-data serve clean dev deploy-local test

# Build static JSON data from markdown posts
build-data:
	@echo "Building static JSON data from markdown posts..."
	python build.py
	@echo "Build completed successfully"

# Serve site locally
serve: build-data
	@echo "Starting local development server at http://localhost:8000"
	python -m http.server 8000

# Development server with auto-rebuild
dev: build-data
	@echo "Starting development server with file watching..."
	@echo "Server available at http://localhost:8000"
	@while true; do \
		python -m http.server 8000 & \
		SERVER_PID=$$!; \
		inotifywait -r -e modify,create,delete posts/ scripts/ styles/ index.html 2>/dev/null; \
		kill $$SERVER_PID 2>/dev/null; \
		echo "Files changed, rebuilding..."; \
		python build.py; \
		sleep 1; \
	done

# Test the build locally
test: build-data
	@echo "Testing static JSON data..."
	@if [ -f data/posts.json ]; then \
		echo "✅ posts.json exists"; \
		POST_COUNT=$$(python -c "import json; data=json.load(open('data/posts.json')); print(len(data))"); \
		echo "✅ Found $$POST_COUNT posts"; \
	else \
		echo "❌ posts.json missing"; \
		exit 1; \
	fi
	@if [ -f data/metadata.json ]; then \
		echo "✅ metadata.json exists"; \
	else \
		echo "❌ metadata.json missing"; \
		exit 1; \
	fi

# Clean generated files
clean:
	rm -rf data/*.json
	@echo "Cleaned generated JSON files"

# Deploy to GitHub Pages (local test)
deploy-local: build-data test
	@echo "Local deployment test completed successfully"
	@echo "Ready for GitHub Pages deployment"
