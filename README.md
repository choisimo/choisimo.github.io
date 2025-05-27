# Hugo Importer

## Overview

Hugo Importer is a Python-based system designed to automatically synchronize content from a remote Git repository into a local Hugo project. It can fetch new, modified, or deleted Markdown files from a specified path in a source repository and integrate them into your Hugo site's content structure. The system supports manual execution, scheduled synchronization (e.g., via cron), and can be triggered by webhooks from Git hosting providers like GitHub or GitLab.

This tool is ideal for scenarios where content is managed in a separate repository (e.g., a documentation repository, a shared content library) and needs to be regularly pulled into one or more Hugo websites.

## Features

*   **Git Integration**: Clones or pulls from a remote Git repository, supporting specific branches.
*   **Markdown Processing**:
    *   Copies new and modified Markdown files.
    *   Handles deleted files by deleting them from the Hugo project, marking them as draft (future enhancement), or ignoring them, based on configuration.
    *   Uses `python-frontmatter` to load and save Markdown files, preserving front matter.
*   **Hugo Build Trigger**: Automatically runs the `hugo` build command after content synchronization if changes were made.
*   **Flexible Configuration**: Uses a YAML file (`config.yaml`) for all settings.
*   **Multiple Trigger Mechanisms**:
    *   **Manual**: Run `main.py` directly.
    *   **Scheduled**: Can be set up with cron or other schedulers.
    *   **Webhook**: Includes a Flask-based server to listen for webhook notifications (e.g., from GitHub on push events).
*   **Security**: Supports webhook secret verification (HMAC-SHA256 for GitHub, token for GitLab) and relies on standard SSH key management for Git access.
*   **Centralized Logging**: Configurable logging to console and/or a file.

## System Requirements

*   **Python**: Python 3.7+
*   **Hugo**: An installed and working Hugo executable (must be in the system's PATH if `hugo_project_path` is used for building).
*   **Git**: Git command-line interface installed and accessible.
*   **SSH**: For accessing Git repositories via SSH, ensure SSH keys are correctly set up and the SSH agent is configured if needed. The system itself does not handle SSH key management directly but relies on the underlying Git/SSH setup.

## Installation

1.  **Clone the Repository (or download the source code):**
    ```bash
    git clone <your-repo-url-for-hugo-importer>
    cd hugo-importer
    ```

2.  **Create and Activate a Virtual Environment (Recommended):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
    This will install `GitPython`, `PyYAML`, `pydantic`, `python-frontmatter`, and `Flask`.

## Configuration (`config.yaml`)

The main configuration is done through the `config.yaml` file located in the project root. Below is a detailed explanation of each section:

```yaml
# Absolute path to your local Hugo project directory.
# This is where the importer will place the content files and run the Hugo build.
# Example: "/var/www/my-hugo-site"
hugo_project_path: "/path/to/your/hugo/blog"

# Temporary directory for cloning the source repository and other operations.
# Defaults to /tmp/hugo_importer if not specified in AppConfig model (currently it is).
# Example: "/tmp/hugo_importer_myblog"
tmp_dir: "/tmp/hugo_importer_project"

# Logging configuration
log_level: "INFO"  # Options: DEBUG, INFO, WARNING, ERROR, CRITICAL
# log_file: "importer.log" # Optional: Path to a log file. If commented out or null, logs to standard output.

# Notification settings (currently a placeholder for future enhancements)
notifications:
  enabled: false
  # email_to: "user@example.com"
  # slack_webhook_url: "https://hooks.slack.com/services/YOUR/SLACK/HOOK"

# Configuration for the content source
source:
  # URL of the Git repository containing the Hugo content.
  # Can be SSH (git@github.com:user/repo.git) or HTTPS (https://github.com/user/repo.git).
  # For SSH, ensure your machine's SSH keys are set up for the Git user.
  repo_url: "git@github.com:user/external-hugo-content.git"

  # Branch to clone/pull from the repository.
  branch: "main"

  # Path within the source repository where the relevant content is located.
  # Use "." if the content is at the root of the repository.
  # Example: "docs/content-source" or "."
  path_in_repo: "documentation"

  # Subdirectory within 'path_in_repo' that is the actual Hugo content directory structure
  # that should be mapped to your Hugo project's content directory.
  # The files from `path_in_repo / relative_file_path_from_git_handler` will be placed under
  # `hugo_project_path / <value of source.hugo_content_dir from config> / relative_file_path_from_git_handler`.
  # Example: If source content is at `repo_root/docs/blog_posts/my-article.md`,
  # and `path_in_repo` is "docs", and `GitHandler` reports "blog_posts/my-article.md" as the relative path,
  # then to place this file into `hugo_project_path/content/my_blog/my-article.md`,
  # you would set `source.hugo_content_dir` to "content/my_blog".
  # The `relative_file_path_from_git_handler` in this case should be "blog_posts/my-article.md" if `path_in_repo` points to "docs".
  # More simply, if your source content is in `path_in_repo/actual_hugo_content_folder/file.md` and you want it in
  # `hugo_project_path/target_hugo_content_folder/file.md`, set `source.hugo_content_dir` to `target_hugo_content_folder`.
  hugo_content_dir: "content" # This is a common setup if path_in_repo points to a directory containing a "content" folder.

  # List of markdown file extensions to process.
  markdown_extensions:
    - ".md"
    - ".markdown"
    - ".mdown"

  # Action for files in Hugo project but not in source repo (within the managed scope).
  # "delete": Permanently delete the file.
  # "mark_draft": (Future) Change frontmatter to "draft: true". Currently logs and ignores deletion.
  # "ignore": Take no action.
  deleted_files_action: "delete"

# Scheduler information (for documentation and user convenience when setting up cron)
# This section does NOT automate scheduling.
scheduler:
  # Describes the intended frequency (e.g., "hourly", "daily at 2am"). Purely informational.
  intended_schedule: "hourly"
  # Example command you might use in a cron job.
  command_to_run: "python3 /path/to/your/hugo-importer/main.py --config /path/to/your/hugo-importer/config.yaml"

# Webhook Trigger Configuration
webhook:
  enabled: false # Set to true to enable the webhook server.
  host: "0.0.0.0" # Listen on all interfaces (use with firewall) or "127.0.0.1" for local only.
  port: 5000      # Port for the webhook server.
  endpoint_path: "/webhook/sync" # URL path for the webhook. Make this hard to guess if not otherwise secured.
  
  # Name of the ENVIRONMENT VARIABLE that holds the webhook secret.
  # Example: "HUGO_IMPORTER_WEBHOOK_SECRET". You MUST set this environment variable.
  # The value of this env var is used to verify incoming webhook signatures.
  secret_env_var: "HUGO_IMPORTER_WEBHOOK_SECRET" 
  
  # Optional: Only trigger sync if the push event is for this specific branch (e.g., "main").
  # If null or empty, any branch push (passing signature validation) will trigger.
  allowed_branch: "main" 
```

**Key Configuration Points:**

*   **Paths**: Ensure `hugo_project_path` and `tmp_dir` are correct and writable for your environment.
*   **`source.path_in_repo` vs `source.hugo_content_dir`**:
    *   `path_in_repo`: Specifies the directory *within the source Git repository* from which to start looking for content. `GitHandler` returns file paths relative to this.
    *   `hugo_content_dir`: Specifies the directory structure *within your target Hugo project* where the content (identified by `GitHandler` relative to `path_in_repo`) should be placed. For example, if `GitHandler` reports a file `posts/my-article.md` (meaning it was found at `source.path_in_repo/posts/my-article.md`), and `source.hugo_content_dir` is set to `content/blog`, the file will be placed at `hugo_project_path/content/blog/posts/my-article.md`.
*   **Secrets**: For webhook security, the actual secret string is **not** stored in `config.yaml`. Instead, `webhook.secret_env_var` specifies the *name* of an environment variable that holds the secret. You must set this environment variable in the environment where `webhook_server.py` runs.

## Usage

There are three main ways to use the Hugo Importer:

### 1. Manual Sync

Run the `main.py` script directly from the command line.

```bash
# Ensure your virtual environment is activated
source venv/bin/activate 

# Run with default config.yaml (if in the same directory)
python3 main.py

# Run with a specific config file
python3 main.py --config /path/to/your/custom_config.yaml 
```
Logs will be printed to the console and/or the log file specified in `config.yaml`.

### 2. Scheduled Sync (Cron Example)

You can schedule the `main.py` script to run periodically using cron or a similar task scheduler.

**Example Cron Job:**

This example runs the importer every hour. Adjust the schedule and paths as needed.

```cron
0 * * * * /path/to/your/hugo-importer/venv/bin/python3 /path/to/your/hugo-importer/main.py --config /path/to/your/hugo-importer/config.yaml >> /path/to/your/hugo-importer/importer_cron.log 2>&1
```

**Explanation:**

*   `0 * * * *`: Cron schedule (runs at the start of every hour).
*   `/path/to/your/hugo-importer/venv/bin/python3`: Absolute path to the Python interpreter within your virtual environment. **Using the venv Python is crucial.**
*   `/path/to/your/hugo-importer/main.py`: Absolute path to the main script.
*   `--config /path/to/your/hugo-importer/config.yaml`: Specifies the configuration file.
*   `>> /path/to/your/hugo-importer/importer_cron.log 2>&1`: Appends standard output and standard error to a log file. This is useful for cron jobs. The application's own logging (configured in `config.yaml` via `log_file`) will also function as defined.

Refer to the `scheduler.command_to_run` field in your `config.yaml` for a suggested command template.

### 3. Webhook Sync

The importer can be triggered by HTTP POST requests, typically from Git hosting services like GitHub or GitLab when a push event occurs.

**Setup:**

1.  **Enable in `config.yaml`**:
    *   Set `webhook.enabled: true`.
    *   Configure `webhook.host`, `webhook.port`, and `webhook.endpoint_path`.
    *   Specify `webhook.secret_env_var` (e.g., `HUGO_IMPORTER_WEBHOOK_SECRET`).
    *   Optionally, set `webhook.allowed_branch`.

2.  **Set Environment Variable**:
    In the environment where `webhook_server.py` will run, set the environment variable named in `webhook.secret_env_var` to your chosen secret string.
    ```bash
    export HUGO_IMPORTER_WEBHOOK_SECRET="your_very_strong_and_random_secret"
    # Also recommended: set the config path if not using default
    # export HUGO_IMPORTER_CONFIG="/path/to/your/hugo-importer/config.yaml"
    ```

3.  **Run `webhook_server.py`**:
    This script starts a Flask server to listen for webhook requests. It's recommended to run this using a process manager like `systemd` or `supervisor` for production use.
    ```bash
    # Ensure virtual environment is activated
    source venv/bin/activate

    python3 webhook_server.py
    ```
    The server will log its startup and incoming requests according to the logging configuration.

4.  **Configure Webhook in Git Provider (GitHub Example)**:
    *   Go to your source repository on GitHub -> Settings -> Webhooks -> Add webhook.
    *   **Payload URL**: `http://your_server_ip_or_domain:port/your_endpoint_path` (e.g., `http://example.com:5000/webhook/sync`).
    *   **Content type**: `application/json`.
    *   **Secret**: Enter the same secret string you set for the `HUGO_IMPORTER_WEBHOOK_SECRET` environment variable.
    *   **Which events?**: Select "Just the push event" or customize as needed.
    *   Ensure "Enable SSL verification" is checked if your server uses HTTPS (recommended for production).
    *   Click "Add webhook".

    For GitLab, the process is similar (Settings -> Webhooks), but you'll use a "Secret token" field which corresponds to the `X-Gitlab-Token` header, verified by the server.

## Security Notes

*   **SSH Keys**: When using SSH URLs for `source.repo_url`, ensure the machine running the importer has appropriate SSH keys configured to access the repository. The application itself does not handle SSH keys.
*   **Webhook Secret**:
    *   Always use a strong, unique secret for your webhook.
    *   Store it securely as an environment variable, not in `config.yaml`.
    *   The `webhook_server.py` uses HMAC-SHA256 for GitHub signature verification and direct token comparison for GitLab (as indicated by header presence), which are standard secure practices.
*   **Network Exposure**: If using the webhook server, be mindful of network exposure.
    *   Use a firewall to restrict access to the webhook port if possible.
    *   Consider running the webhook server behind a reverse proxy (like Nginx or Apache) to handle SSL/TLS termination and provide an additional layer of security.
    *   The default `webhook.host: "0.0.0.0"` makes the server listen on all network interfaces. Change to `"127.0.0.1"` if the webhook source is on the same machine or proxied locally.
*   **Permissions**: Run the importer with the minimum necessary permissions, especially concerning file system access to the Hugo project and temporary directories.

## Basic Troubleshooting

1.  **Check Logs**: This is the first step. Logs are output to the console and/or the `log_file` specified in `config.yaml`. The `log_level` (e.g., `DEBUG`, `INFO`) determines the verbosity.
2.  **Configuration Errors**:
    *   "Configuration file ... not found.": Ensure `config.yaml` (or the file specified by `--config`) exists and is accessible.
    *   "Configuration validation error: ...": Pydantic will report errors if `config.yaml` has incorrect data types or missing required fields. Check the error message against the structure outlined in this README.
3.  **Git Errors**:
    *   "Git command failed...": Often indicates issues with repository access (SSH keys, permissions, incorrect URL), network connectivity, or the specified branch not existing. The error message from Git (usually in `e.stderr` if caught) will provide more details.
    *   Ensure `git` is installed and in the system's PATH.
4.  **Hugo Build Errors**:
    *   "Hugo command not found...": Ensure Hugo is installed and its executable is in the system's PATH where `main.py` runs.
    *   Hugo build failures (non-zero exit code) will be logged. Check Hugo's output in the logs for specific template errors, content issues, etc.
5.  **Webhook Issues**:
    *   **Signature/Token Mismatch**: Check that the secret in your Git provider's webhook settings exactly matches the value of the environment variable specified by `webhook.secret_env_var`.
    *   **Branch Filtering**: If `webhook.allowed_branch` is set, ensure push events are for that specific branch.
    *   **Connectivity**: Verify the webhook server is running and accessible from the internet (or your Git provider's network). Check firewalls and proxy settings.
    *   Review logs from `webhook_server.py` for detailed error messages.
6.  **File Path Issues**:
    *   Incorrect `hugo_project_path`, `tmp_dir`, `source.path_in_repo`, or `source.hugo_content_dir` can lead to files not being found or placed correctly. Double-check these paths in `config.yaml` and understand how they interact as explained in the "Configuration" section.

---

This README provides a starting point. Feel free to expand it with more specific details about your project or advanced usage scenarios.
```
