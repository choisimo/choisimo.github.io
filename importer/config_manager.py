import yaml
import os
import logging
from typing import List, Literal, Optional
from pydantic import BaseModel, ValidationError, HttpUrl, Field

logger = logging.getLogger(__name__)

class NotificationsConfig(BaseModel):
    # Placeholder for now, actual notification settings will be added later
    enabled: bool = False
    # Example: email_to: Optional[str] = None
    # Example: slack_webhook_url: Optional[HttpUrl] = None
    pass

class SourceConfig(BaseModel):
    repo_url: str # git@github.com:user/repo.git or https://github.com/user/repo.git
    branch: str = "main"
    path_in_repo: str = "." # Path to the Hugo content directory within the repository
    hugo_content_dir: str = "content" # Subdirectory within path_in_repo that is the Hugo content dir
    markdown_extensions: List[str] = [".md", ".markdown"]
    deleted_files_action: Literal["delete", "mark_draft", "ignore"] = "delete"

class AppConfig(BaseModel):
    hugo_project_path: str # Absolute path to the local Hugo project
    tmp_dir: str = "/tmp/hugo_importer"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    log_file: Optional[str] = None # Path to log file, if None, logs to stdout
    notifications: NotificationsConfig = NotificationsConfig()
    source: SourceConfig 
    scheduler: Optional["SchedulerConfig"] = Field(default_factory=lambda: SchedulerConfig())
    webhook: Optional["WebhookConfig"] = Field(default_factory=lambda: WebhookConfig()) # Added

class SchedulerConfig(BaseModel):
    """Configuration for how the importer is intended to be scheduled."""
    intended_schedule: Optional[str] = "hourly" 
    command_to_run: Optional[str] = None      

class WebhookConfig(BaseModel):
    """Configuration for the webhook trigger."""
    enabled: bool = False
    host: str = "0.0.0.0"
    port: int = 5000
    endpoint_path: str = "/webhook/sync"
    secret_env_var: Optional[str] = None  # Name of environment variable for webhook secret
    allowed_branch: Optional[str] = None  # e.g., "main", to only trigger for this branch

# Update forward references for all models
AppConfig.update_forward_refs()

def load_config(config_path: str = "config.yaml") -> AppConfig:
    """
    Loads the configuration from a YAML file, validates it using Pydantic models,
    and returns the AppConfig object.
    """
    try:
        logger.debug(f"Attempting to load configuration from '{config_path}'.")
        with open(config_path, 'r') as f:
            config_data = yaml.safe_load(f)
        logger.info(f"Successfully loaded configuration file '{config_path}'.")
    except FileNotFoundError:
        logger.error(f"Configuration file '{config_path}' not found.")
        raise
    except yaml.YAMLError as e:
        logger.error(f"Error parsing YAML file '{config_path}': {e}", exc_info=True)
        raise

    try:
        app_config = AppConfig(**config_data)
        logger.debug("Configuration data successfully parsed into AppConfig model.")
        
        # Placeholder for loading secrets from environment variables
        # Example:
        # if app_config.notifications.enabled and hasattr(app_config.notifications, 'some_secret_field'):
        #     env_var_name = "SOME_APP_SECRET"
        #     secret_from_env = os.getenv(env_var_name)
        #     if secret_from_env:
        #         app_config.notifications.some_secret_field = secret_from_env
        #         logger.info(f"Loaded notification secret for 'some_secret_field' from environment variable '{env_var_name}'.")
        #     elif not app_config.notifications.some_secret_field: # If not set in YAML and not in ENV
        #         logger.warning(f"Notification secret 'some_secret_field' not found in config or environment variable '{env_var_name}'.")
        
        return app_config
    except ValidationError as e:
        logger.error(f"Configuration validation error: {e}", exc_info=True)
        raise

if __name__ == "__main__":
    # Basic logging setup for standalone testing of this module
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    logger.info("Starting config_manager.py self-test...")
    
    dummy_config_filename = "dummy_config_test.yaml"
    dummy_config_content = {
        "hugo_project_path": "/path/to/your/hugo/blog",
        "tmp_dir": "/tmp/hugo_importer_test",
        "log_level": "DEBUG", 
        "log_file": "importer_test.log", 
        "notifications": {
            "enabled": False
        },
        "source": {
            "repo_url": "git@github.com:user/test-repo.git",
            "branch": "develop",
            "path_in_repo": "docs",
            "hugo_content_dir": "content/posts",
            "markdown_extensions": [".md", ".mdown"],
            "deleted_files_action": "mark_draft"
        },
        "scheduler": { 
            "intended_schedule": "daily at 3 AM",
            "command_to_run": "python3 /app/main.py --config /app/config.yaml"
        },
        "webhook": { # Added for testing
            "enabled": True,
            "host": "127.0.0.1",
            "port": 5001,
            "endpoint_path": "/test-webhook",
            "secret_env_var": "TEST_WEBHOOK_SECRET",
            "allowed_branch": "staging"
        }
    }
    with open(dummy_config_filename, 'w') as f:
        yaml.dump(dummy_config_content, f)
    logger.info(f"Created dummy configuration file: '{dummy_config_filename}'")

    try:
        logger.info(f"Attempting to load '{dummy_config_filename}'...")
        config = load_config(config_path=dummy_config_filename)
        logger.info("Config loaded successfully!")
        logger.info(f"Loaded config content:\n{config.json(indent=2)}")
        
        # Example of how a secret might be handled (conceptual)
        # os.environ["EXAMPLE_API_KEY"] = "testkey123"
        # if config.notifications: # Assuming a field 'api_key' was added to NotificationsConfig
        #    config.notifications.api_key = os.getenv("EXAMPLE_API_KEY", config.notifications.api_key)
        #    if config.notifications.api_key == "testkey123":
        #        logger.info("Successfully simulated loading an API key from environment.")

    except Exception as e:
        # The load_config function already logs errors, so this catch is more for general failure
        logger.critical(f"Failed to load or validate dummy config during self-test: {e}", exc_info=True)
    finally:
        if os.path.exists(dummy_config_filename):
            os.remove(dummy_config_filename)
            logger.info(f"Cleaned up dummy configuration file: '{dummy_config_filename}'.")
        
        # Note: The actual log file 'importer_test.log' (if created by a real logger_setup)
        # is not cleaned up here to allow inspection after test.
        # In a real test suite, log files might be handled differently.
    logger.info("config_manager.py self-test finished.")
