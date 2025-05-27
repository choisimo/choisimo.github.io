import argparse
import logging
from pathlib import Path
import sys # For exiting on critical errors
import git # For git.exc.GitCommandError

from importer.config_manager import load_config, AppConfig
from importer.logger_setup import setup_logging
from importer.git_connector import GitHandler
from importer.hugo_processor import HugoProcessor

# Define a logger for this module after setup_logging is called
# This will be configured by setup_logging
logger: logging.Logger 

def main():
    """
    Main orchestrator for the Hugo Importer.
    Handles command-line arguments, configuration loading, logging setup,
    Git operations, Markdown processing, and Hugo building.
    """
    parser = argparse.ArgumentParser(description="Hugo Importer: Sync content from a Git repo to a Hugo project.")
    parser.add_argument(
        "--config",
        type=str,
        default="config.yaml",
        help="Path to the configuration file (default: config.yaml)"
    )
    args = parser.parse_args()

    global logger # Allow assignment to the global logger variable

    try:
        # Load configuration first, as it dictates logging setup
        app_config = load_config(config_path=args.config)
    except Exception as e:
        # Use a basic print for this critical early error, as logger isn't set up.
        print(f"CRITICAL: Failed to load configuration from '{args.config}': {e}", file=sys.stderr)
        sys.exit(1) # Exit if config fails to load

    # Setup centralized logging
    try:
        setup_logging(app_config.log_level, app_config.log_file)
        logger = logging.getLogger(__name__) # Get logger for this module
        # Or use a specific name: logger = logging.getLogger('main_orchestrator')
    except Exception as e:
        # If logging setup fails, print error and continue with basic console logging for subsequent errors.
        print(f"ERROR: Failed to setup logging: {e}. Further logs may not be properly formatted or routed.", file=sys.stderr)
        # Fallback to basic config if setup_logging failed catastrophically
        logging.basicConfig(level=logging.INFO) 
        logger = logging.getLogger(__name__) # Ensure logger is assigned

    logger.info("=======================================================")
    logger.info("Hugo Importer sync process started.")
    logger.info(f"Using configuration file: {args.config}")
    logger.debug(f"Loaded AppConfig (excluding some defaults for brevity): {app_config.json(indent=2, exclude_defaults=True)}")

    # Log scheduler information if present
    if app_config.scheduler:
        log_msg = "Scheduler info: "
        if app_config.scheduler.intended_schedule:
            log_msg += f"Intended schedule is '{app_config.scheduler.intended_schedule}'. "
        if app_config.scheduler.command_to_run:
            log_msg += f"Suggested command for cron: '{app_config.scheduler.command_to_run}'"
        else: # If only intended_schedule is present or both are None (though default_factory gives an empty object)
            log_msg += "No specific command_to_run provided in config."
        
        # Only log if there's something meaningful to log from scheduler config
        if app_config.scheduler.intended_schedule or app_config.scheduler.command_to_run:
            logger.info(log_msg)


    try:
        # Instantiate GitHandler and HugoProcessor
        logger.debug(f"Initializing GitHandler with source: {app_config.source.repo_url} and tmp_dir: {app_config.tmp_dir}")
        git_handler = GitHandler(app_config.source, app_config.tmp_dir)
        
        logger.debug(f"Initializing HugoProcessor with Hugo project path: {app_config.hugo_project_path}")
        hugo_processor = HugoProcessor(app_config)

        # Get changed markdown files
        logger.info("Checking for changed markdown files in the source repository...")
        changed_files = git_handler.get_changed_markdown_files()
        
        logger.info(f"Found {len(changed_files.get('added', []))} added files, "
                    f"{len(changed_files.get('modified', []))} modified files, "
                    f"{len(changed_files.get('deleted', []))} deleted files.")
        logger.debug(f"Detailed changes: {changed_files}")

        changes_made_to_hugo_content = False

        # Construct the base source path from which files are copied.
        # This is repo_root / path_in_repo / source_hugo_content_dir
        # However, GitHandler.get_changed_markdown_files() returns paths relative to 
        # `source_config.path_in_repo`.
        # And HugoProcessor._calculate_target_path() expects paths relative to `source.path_in_repo`
        # and then uses `app_config.source.hugo_content_dir` to form the target.
        # So, the `full_source_path` should be:
        # `get_changed_markdown_files` returns paths relative to `source_config.path_in_repo`.
        # `_calculate_target_path` expects paths relative to `source_config.path_in_repo` as its `relative_file_path` argument.

        # `local_repo_clone_path` is the root of the cloned repository.
        local_repo_clone_path = Path(git_handler._get_local_repo_path())
        # `content_source_base_in_repo` is the path *within* the clone where the source content is located,
        # effectively combining `local_repo_clone_path` and `git_handler.source_config.path_in_repo`.
        # Example: if clone is at /tmp/myrepo and path_in_repo is "docs", this is /tmp/myrepo/docs.
        content_source_base_in_repo = local_repo_clone_path / git_handler.source_config.path_in_repo


        # Process 'added' files
        added_files = changed_files.get("added", [])
        if added_files:
            logger.info(f"Processing {len(added_files)} added files...")
            for relative_path_str in added_files:
                # `relative_path_str` is like "posts/my-post.md" or "image.png" (relative to `path_in_repo`)
                # `full_source_path` is the absolute path to the source file in the cloned repo.
                full_source_path = content_source_base_in_repo / relative_path_str
                
                # `_calculate_target_path` uses this `relative_path_str` to determine the final path in the Hugo project,
                # by prepending `hugo_project_path` and `source.hugo_content_dir`.
                target_hugo_path = hugo_processor._calculate_target_path(relative_path_str)
                
                logger.debug(f"Processing ADDED file: source='{full_source_path}', target='{target_hugo_path}'")
                hugo_processor.process_added_or_modified_file(full_source_path, target_hugo_path)
                changes_made_to_hugo_content = True
            logger.info("Finished processing added files.")

        # Process 'modified' files
        modified_files = changed_files.get("modified", [])
        if modified_files:
            logger.info(f"Processing {len(modified_files)} modified files...")
            for relative_path_str in modified_files:
                full_source_path = content_source_base_in_repo / relative_path_str
                target_hugo_path = hugo_processor._calculate_target_path(relative_path_str)
                
                logger.debug(f"Processing MODIFIED file: source='{full_source_path}', target='{target_hugo_path}'")
                hugo_processor.process_added_or_modified_file(full_source_path, target_hugo_path)
                changes_made_to_hugo_content = True
            logger.info("Finished processing modified files.")

        # Process 'deleted' files
        deleted_files = changed_files.get("deleted", [])
        if deleted_files:
            logger.info(f"Processing {len(deleted_files)} deleted files...")
            for relative_path_str in deleted_files:
                target_hugo_path = hugo_processor._calculate_target_path(relative_path_str)
                
                logger.debug(f"Processing DELETED file: target='{target_hugo_path}'")
                hugo_processor.process_deleted_file(target_hugo_path)
                
                # Determine if a build is needed based on deletion action
                # If action is "delete", content changed.
                # If action is "mark_draft" AND it was successfully implemented to change frontmatter, content changed.
                # If action is "ignore", content did not change from this deletion.
                if app_config.source.deleted_files_action == "delete":
                    changes_made_to_hugo_content = True
                elif app_config.source.deleted_files_action == "mark_draft":
                    # Assuming mark_draft, if implemented, modifies the file, thus a content change.
                    # Current placeholder for mark_draft does nothing, so this might not be strictly true yet.
                    # For now, let's assume it will modify content if fully implemented.
                    logger.debug("deleted_files_action is 'mark_draft'. Counting as a content change.")
                    changes_made_to_hugo_content = True 
            logger.info("Finished processing deleted files.")

        # Run Hugo Build
        if changes_made_to_hugo_content:
            logger.info("Content changes were detected. Running Hugo build.")
            try:
                hugo_processor.run_hugo_build()
                logger.info("Hugo build process completed.")
            except Exception as e_build: # Catch specific Hugo build errors
                logger.error(f"Hugo build failed: {e_build}", exc_info=True)
                # Depending on policy, might want to exit or just log
        else:
            logger.info("No content changes detected that require a Hugo build.")

        logger.info("Hugo Importer sync process completed successfully.")

    except FileNotFoundError as e: # E.g. Hugo command not found
        logger.error(f"A required file or command was not found: {e}", exc_info=True)
        sys.exit(1) # Exit for critical errors like this
    except git.exc.GitCommandError as e: # Specific Git errors
        logger.error(f"A Git command failed: {e.stderr}", exc_info=True)
        sys.exit(1)
    except Exception as e:
        logger.critical(f"An unhandled error occurred during the sync process: {e}", exc_info=True)
        sys.exit(1) # Exit for any other critical unhandled error
    finally:
        logger.info("=======================================================")


if __name__ == "__main__":
    main()
```
