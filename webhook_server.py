import flask # Changed from Flask to flask, will import specific items later
from flask import request, Flask
import subprocess
import os
import hmac
import hashlib
import logging
import sys
import json
from pathlib import Path

from importer.config_manager import load_config, AppConfig
from importer.logger_setup import setup_logging
from importer.post_generator import HugoPostGenerator
from importer.git_utils import GitAutoCommit

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
        n8n_token = request.headers.get('X-N8N-Token')  # n8n 웹훅 토큰

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
        
        # --- n8n Token Verification ---
        elif n8n_token:
            logger.debug("Attempting n8n token verification.")
            if not hmac.compare_digest(n8n_token, _webhook_secret):
                logger.warning("n8n token verification failed. Request rejected.")
                return "Token verification failed", 403
            logger.info("n8n token verified successfully.")
            
        else:
            logger.warning("No recognized signature/token header found. Request rejected.")
            return "Missing signature/token", 403


        # 2. 웹훅 데이터 파싱 및 포스트 생성
        try:
            payload = request.json
            if not payload:
                logger.warning("Request payload is empty or not JSON.")
                return "Invalid payload", 400

            logger.info(f"Received webhook payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")

            # n8n form 데이터 처리
            if 'form_data' in payload:
                form_data = payload['form_data']
                logger.info("Processing n8n form data for blog post creation")
                
                # Hugo 포스트 생성
                post_generator = HugoPostGenerator()
                post_path, post_title = post_generator.create_post(form_data)
                
                # Git 자동 커밋 및 푸시
                git_committer = GitAutoCommit()
                
                # Git 설정 (환경변수에서 가져오거나 기본값 사용)
                git_name = os.getenv('GIT_AUTHOR_NAME', 'Hugo Blog Bot')
                git_email = os.getenv('GIT_AUTHOR_EMAIL', 'bot@example.com')
                
                if git_committer.auto_commit_and_push(post_title, post_path, git_name, git_email):
                    logger.info(f"포스트 생성 및 Git 푸시 완료: {post_title}")
                    return {"status": "success", "message": f"Post created and pushed: {post_title}", "path": post_path}, 200
                else:
                    logger.error("Git 커밋/푸시 실패")
                    return {"status": "partial_success", "message": f"Post created but Git push failed: {post_title}", "path": post_path}, 207
            
            # 기존 Git 웹훅 처리 (브랜치 필터링)
            elif 'ref' in payload:
                logger.info("Processing Git webhook")
                
                # Branch Filtering (Optional)
                if _app_config.webhook.allowed_branch:
                    logger.debug(f"Allowed branch configured: '{_app_config.webhook.allowed_branch}'. Checking payload.")
                    
                    # GitHub: payload['ref'] is like 'refs/heads/main'
                    # GitLab: payload['ref'] is like 'refs/heads/main', or payload['object_attributes']['target_branch'] for merge requests
                    
                    # Generic 'ref' check, common for GitHub push events
                    event_ref = payload.get('ref')
                    expected_ref = f'refs/heads/{_app_config.webhook.allowed_branch}'
                    
                    if event_ref != expected_ref:
                        logger.info(f"Webhook event for ref '{event_ref}' does not match allowed branch '{expected_ref}'. No action taken.")
                        return "Event acknowledged (branch mismatch)", 200 # OK, but no action
                    logger.info(f"Webhook event for ref '{event_ref}' matches allowed branch.")
                else:
                    logger.debug("No specific branch filter configured. Proceeding with sync trigger.")

                # Trigger Sync (Run main.py)
                logger.info("Valid Git webhook received. Triggering main importer sync process...")
                
                # Get the path to the config file used by this webhook server itself, to pass to main.py
                current_config_path = os.getenv("HUGO_IMPORTER_CONFIG", "config.yaml")
                run_main_script(config_file_path=current_config_path)
                
                return "Accepted: Sync process triggered.", 202
            
            else:
                logger.warning("Unknown webhook payload format")
                return "Unknown payload format", 400
                
        except Exception as e:
            logger.error(f"Error processing webhook payload: {e}", exc_info=True)
            return "Payload processing error", 500

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
