import flask # Changed from Flask to flask, will import specific items later
from flask import request, Flask
import subprocess
import os
import hmac
import hashlib
import logging
import sys
from pathlib import Path

from importer.config_manager import load_config, AppConfig
from importer.logger_setup import setup_logging

# Global logger, will be configured in main_webhook
logger: logging.Logger 

# Store app_config globally for access in route handler if needed, or pass through other means
# For simplicity in a single-file server, global can be okay, but for complex apps, consider app context or blueprints.
_app_config: AppConfig 
_webhook_secret: str

def run_main_script(config_file_path: str):
    """Helper function to run the main.py script."""
    global logger
    try:
        main_script_path = Path(__file__).resolve().parent / 'main.py'
        # Ensure config_file_path is absolute or correctly relative for the subprocess
        config_arg = str(Path(config_file_path).resolve())

        logger.info(f"Attempting to run main importer script: {sys.executable} {main_script_path} --config {config_arg}")
        
        # Using Popen for non-blocking execution.
        # Capture stdout/stderr to a log file or pipe to main logger if desired. For now, let them run independently.
        process = subprocess.Popen(
            [sys.executable, str(main_script_path), '--config', config_arg],
            stdout=subprocess.PIPE, # Capture for logging
            stderr=subprocess.PIPE,
            text=True
        )
        logger.info(f"Main importer script started with PID: {process.pid}.")
        # Optionally, you could log stdout/stderr from the process here if you wait for it,
        # but for a non-blocking call, this part is tricky without threads or async.
        # For now, we assume main.py handles its own logging.
        
    except Exception as e:
        logger.error(f"Failed to start main.py subprocess: {e}", exc_info=True)


def main_webhook():
    """
    Main function to set up and run the webhook Flask server.
    """
    global logger, _app_config, _webhook_secret

    # Temporary basic config for initial loading errors
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    temp_logger = logging.getLogger(__name__ + "_bootstrap") # Use a temp logger for bootstrap

    try:
        # Determine config file path (e.g., from args or default)
        # For webhook_server, we assume it uses the same config.yaml as main.py
        # If webhook_server takes its own --config, that needs to be added to its own argparser
        config_file = os.getenv("HUGO_IMPORTER_CONFIG", "config.yaml")
        temp_logger.info(f"Loading configuration from: {config_file}")
        _app_config = load_config(config_path=config_file)
    except Exception as e:
        temp_logger.critical(f"CRITICAL: Failed to load configuration for webhook server: {e}", exc_info=True)
        sys.exit(1)

    # Setup centralized logging using loaded config
    try:
        setup_logging(_app_config.log_level, _app_config.log_file)
        logger = logging.getLogger(__name__) # Official logger for the webhook server
        logger.info("Logging successfully configured for webhook server.")
    except Exception as e:
        temp_logger.error(f"ERROR: Failed to setup logging for webhook server: {e}. Using bootstrap logger.", exc_info=True)
        logger = temp_logger # Fallback to temp logger

    if not _app_config.webhook or not _app_config.webhook.enabled:
        logger.info("Webhook server is disabled in the configuration. Exiting.")
        return

    if not _app_config.webhook.secret_env_var:
        logger.error("Webhook secret environment variable name ('secret_env_var') is not configured. Cannot start server.")
        sys.exit(1)
        
    _webhook_secret = os.getenv(_app_config.webhook.secret_env_var)
    if not _webhook_secret:
        logger.error(f"Webhook secret not found in environment variable '{_app_config.webhook.secret_env_var}'. Cannot start server.")
        sys.exit(1)
    logger.info(f"Webhook secret loaded successfully from env var '{_app_config.webhook.secret_env_var}'.")


    flask_app = Flask(__name__)

    @flask_app.route(_app_config.webhook.endpoint_path, methods=['POST'])
    def handle_webhook():
        global logger, _app_config, _webhook_secret # Access global vars

        logger.info(f"Received POST request on endpoint: {_app_config.webhook.endpoint_path}")

        # 1. Signature Verification (GitHub Example using X-Hub-Signature-256)
        #    GitLab uses X-Gitlab-Token (direct string comparison)
        #    Other services might use different headers/methods.
        
        # --- GitHub Signature Verification ---
        github_signature = request.headers.get('X-Hub-Signature-256')
        gitlab_token = request.headers.get('X-Gitlab-Token')

        if github_signature:
            logger.debug("Attempting GitHub signature verification.")
            try:
                # Calculate HMAC-SHA256 digest of the raw request body
                calculated_hmac = hmac.new(
                    _webhook_secret.encode('utf-8'),
                    request.data, # request.data is bytes
                    hashlib.sha256
                ).hexdigest()
                
                expected_signature = f"sha256={calculated_hmac}"
                
                if not hmac.compare_digest(expected_signature, github_signature):
                    logger.warning(f"GitHub signature verification failed. Expected: '{expected_signature}', Got: '{github_signature}'. Request rejected.")
                    return "Signature verification failed", 403
                logger.info("GitHub signature verified successfully.")
            except Exception as e:
                logger.error(f"Error during GitHub signature verification: {e}", exc_info=True)
                return "Signature verification error", 500
        
        # --- GitLab Token Verification (Example - direct comparison) ---
        elif gitlab_token:
            logger.debug("Attempting GitLab token verification.")
            if not hmac.compare_digest(gitlab_token, _webhook_secret): # Secure comparison
                logger.warning("GitLab token verification failed. Request rejected.")
                return "Token verification failed", 403
            logger.info("GitLab token verified successfully.")
            
        else:
            logger.warning("No recognized signature/token header (X-Hub-Signature-256 or X-Gitlab-Token) found. Request rejected.")
            return "Missing signature/token", 403


        # 2. Branch Filtering (Optional)
        if _app_config.webhook.allowed_branch:
            logger.debug(f"Allowed branch configured: '{_app_config.webhook.allowed_branch}'. Checking payload.")
            try:
                payload = request.json
                if not payload: # Should not happen if request.data was present for HMAC
                    logger.warning("Request payload is empty or not JSON after signature verification.")
                    return "Invalid payload", 400

                # GitHub: payload['ref'] is like 'refs/heads/main'
                # GitLab: payload['ref'] is like 'refs/heads/main', or payload['object_attributes']['target_branch'] for merge requests
                # This needs to be adapted based on the expected payload structure from the specific webhook provider.
                
                # Generic 'ref' check, common for GitHub push events
                event_ref = payload.get('ref')
                expected_ref = f'refs/heads/{_app_config.webhook.allowed_branch}'
                
                if event_ref != expected_ref:
                    logger.info(f"Webhook event for ref '{event_ref}' does not match allowed branch '{expected_ref}'. No action taken.")
                    return "Event acknowledged (branch mismatch)", 200 # OK, but no action
                logger.info(f"Webhook event for ref '{event_ref}' matches allowed branch.")
            except Exception as e:
                logger.error(f"Error parsing JSON payload or checking branch: {e}", exc_info=True)
                return "Payload parsing error", 400
        else:
            logger.debug("No specific branch filter configured. Proceeding with sync trigger.")


        # 3. Trigger Sync (Run main.py)
        logger.info("Valid webhook received and processed. Triggering main importer sync process...")
        
        # Get the path to the config file used by this webhook server itself, to pass to main.py
        # This assumes main.py uses the same config file.
        current_config_path = os.getenv("HUGO_IMPORTER_CONFIG", "config.yaml")
        run_main_script(config_file_path=current_config_path)
        
        return "Accepted: Sync process triggered.", 202

    logger.info(f"Starting webhook server on http://{_app_config.webhook.host}:{_app_config.webhook.port}{_app_config.webhook.endpoint_path}")
    try:
        flask_app.run(host=_app_config.webhook.host, port=_app_config.webhook.port)
    except Exception as e:
        logger.critical(f"Failed to start Flask server: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    # Example of how to set the secret for testing:
    # export HUGO_IMPORTER_WEBHOOK_SECRET="yourtestsecret123"
    # export HUGO_IMPORTER_CONFIG="config.yaml" 
    # Then run: python webhook_server.py
    
    # If config.yaml has webhook.enabled=true and secret_env_var configured,
    # and the corresponding env var is set, the server will start.
    main_webhook()
```
