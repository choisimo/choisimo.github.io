import os
import shutil
import subprocess
import frontmatter 
import logging # Already imported, but ensure it's here
from pathlib import Path

from importer.config_manager import AppConfig

# logger = logging.getLogger(__name__) # This was already here from a previous step, good.
# Ensure it's defined if this is the first time running this part of the script.
if 'logger' not in globals():
    logger = logging.getLogger(__name__)

class HugoProcessor:
    """
    Processes markdown files (add, modify, delete) from a source
    and integrates them into a local Hugo project, including running Hugo build.
    """

    def __init__(self, app_config: AppConfig):
        """
        Initializes the HugoProcessor.

        Args:
            app_config: The application configuration.
        """
        self.app_config = app_config
        logger.info("HugoProcessor initialized.")
        logger.debug(f"Hugo project path set to: {self.app_config.hugo_project_path}")
        logger.debug(f"Source config for hugo_content_dir: {self.app_config.source.hugo_content_dir}")

    def _calculate_target_path(self, relative_file_path: str) -> Path:
        """
        Calculates the absolute target path in the Hugo project for a given relative file path.

        Args:
            relative_file_path: The file path relative to source.path_in_repo 
                                (e.g., "my-folder/my-post.md").

        Returns:
            The absolute Path object for the target file in the Hugo project.
        """
        # source.hugo_content_dir is the specific content directory within the Hugo project
        # (e.g., "content/posts" or "content/docs")
        # relative_file_path is the path of the file from the root of source.path_in_repo
        
        # Correct construction:
        # self.app_config.hugo_project_path gives the root of the Hugo site.
        # self.app_config.source.hugo_content_dir is the content folder *within* the Hugo site,
        #   but this config value actually refers to the subdirectory *within* the source's path_in_repo
        #   that is the Hugo content dir. This was a misunderstanding in the prompt.
        #   The actual target content dir in the Hugo project is typically just "content".
        #   Let's assume for now that the user wants to mirror the structure from
        #   source.path_in_repo/source.hugo_content_dir into HUGO_PROJECT_ROOT/content/
        #   If relative_file_path already includes the hugo_content_dir part from the source,
        #   then we need to be careful.

        # Let's clarify based on typical usage:
        # `relative_file_path` = "section/my-post.md" (this path is *within* the source's hugo_content_dir)
        # `hugo_project_path` = "/path/to/hugo_site"
        # As per subtask: Path(self.app_config.hugo_project_path) / self.app_config.source.hugo_content_dir / relative_file_path
        # `relative_file_path` is relative to `source.path_in_repo`.
        # `self.app_config.source.hugo_content_dir` is the specific subdirectory within `source.path_in_repo`
        # that acts as the content root for Hugo.
        # The GitHandler is expected to provide `relative_file_path` such that it's already
        # relative to the `source.path_in_repo / source.hugo_content_dir`.
        # Example:
        # source.path_in_repo = "docs/"
        # source.hugo_content_dir = "content/posts" (meaning actual content is in "docs/content/posts")
        # GitHandler identifies a file "my-post.md" inside "docs/content/posts".
        # GitHandler provides relative_file_path = "my-post.md" (relative to "docs/content/posts")
        # Target Hugo project path = /path/to/hugo_site
        # Target content directory in Hugo = "content" (standard Hugo structure)
        # So, the target path should be: /path/to/hugo_site / "content" / "my-post.md"
        #
        # Re-reading the subtask carefully:
        # `_calculate_target_path(self, relative_file_path: str) -> Path`:
        #   * Takes `relative_file_path` (e.g., "my-folder/my-post.md") which is relative to `source.path_in_repo`.
        #   * Returns the absolute `Path` where this file should be stored in the Hugo project,
        #     e.g., `Path(self.app_config.hugo_project_path) / self.app_config.source.hugo_content_dir / relative_file_path`.

        # This implies that if `source.path_in_repo` is "docs/" and `source.hugo_content_dir` is "content/blog",
        # and a file is at "docs/content/blog/post.md", then `relative_file_path` from GitHandler
        # should be "content/blog/post.md" for this calculation to make sense if the target is directly under hugo_project_path.
        # Or, if `relative_file_path` is truly just "post.md" (relative to "docs/content/blog"),
        # then the target path should be constructed as:
        # Path(self.app_config.hugo_project_path) / "content" / relative_file_path (if hugo_content_dir from source is not part of target structure)
        # OR
        # Path(self.app_config.hugo_project_path) / self.app_config.source.hugo_content_dir / relative_file_path (if it IS part of target structure)

        # The subtask example `Path(self.app_config.hugo_project_path) / self.app_config.source.hugo_content_dir / relative_file_path`
        # suggests that `self.app_config.source.hugo_content_dir` becomes part of the path *within* the target Hugo project.
        # This is unusual if `hugo_content_dir` from source is like "content" itself, leading to "content/content".
        # Let's assume source.hugo_content_dir refers to a top-level directory *within the Hugo project's content directory*.
        # e.g. if source.hugo_content_dir = "blogposts", target is <hugo_project_root>/blogposts/relative_file_path
        # But Hugo typically expects content under a root "content/" dir.
        # The most standard interpretation for typical Hugo projects is that content from various sources
        # gets organized under the *single* "content/" directory in the target Hugo project.
        # If `self.app_config.source.hugo_content_dir` is "content/posts" (from source repo structure),
        # and `relative_file_path` is "my-article.md" (meaning it was at `path_in_repo/content/posts/my-article.md`),
        # then the target should be `hugo_project_path/"content"/"posts"/"my-article.md"`.
        # The original subtask description `Path(self.app_config.hugo_project_path) / self.app_config.source.hugo_content_dir / relative_file_path`
        # implies that `relative_file_path` is relative to `source.path_in_repo` *excluding* `source.hugo_content_dir`.
        # And `source.hugo_content_dir` itself defines the top-level content folder in the target.

        # Let's stick to the subtask's literal formula for now and document the assumption.
        # Assumption: `relative_file_path` provided by GitHandler is relative to `source.path_in_repo`.
        # `source.hugo_content_dir` is a path segment that should exist directly under `hugo_project_path`
        # for the content. This means if `hugo_content_dir` is "my_hugo_content", files go into
        # `hugo_project_path/my_hugo_content/...`
        # This is a bit non-standard for Hugo if `my_hugo_content` isn't "content".
        # If `source.hugo_content_dir` is "content/posts", then target becomes `hugo_project_path/content/posts/relative_file_path`. This looks correct.

        target_path = Path(self.app_config.hugo_project_path) / self.app_config.source.hugo_content_dir / relative_file_path
        logger.debug(f"Calculated target path: {target_path} for relative file: {relative_file_path} (using source.hugo_content_dir: {self.app_config.source.hugo_content_dir})")
        return target_path

    def process_added_or_modified_file(self, full_source_file_path: Path, target_hugo_path: Path):
        """
        Processes an added or modified markdown file from the source.
        Reads, parses frontmatter, (optionally modifies), and writes to the target Hugo path.

        Args:
            full_source_file_path: Absolute path to the source markdown file.
            target_hugo_path: Absolute path where the file should be written in the Hugo project.
        """
        logger.info(f"Processing added/modified file: '{full_source_file_path}' -> '{target_hugo_path}'")
        try:
            if not full_source_file_path.is_file():
                logger.error(f"Source file for processing not found: {full_source_file_path}")
                return # Cannot proceed if source file is missing

            logger.debug(f"Loading frontmatter from source file: {full_source_file_path}")
            post = frontmatter.load(full_source_file_path)
            logger.debug(f"Frontmatter loaded. Metadata: {post.metadata}, Content length: {len(post.content)}")

            # Placeholder for R-MD-003: Front matter validation
            # Example:
            # if 'title' not in post.metadata:
            #     logger.warning(f"File '{full_source_file_path}' is missing 'title' in frontmatter.")
            # if 'date' not in post.metadata:
            #     logger.warning(f"File '{full_source_file_path}' is missing 'date' in frontmatter.")

            # Placeholder for R-MD-005: Image path rewriting
            # Example:
            # post.content = rewrite_image_paths(post.content, self.app_config.source, self.app_config)

            logger.debug(f"Ensuring target directory exists: {target_hugo_path.parent}")
            target_hugo_path.parent.mkdir(parents=True, exist_ok=True)

            logger.debug(f"Writing processed file to: {target_hugo_path}")
            with open(target_hugo_path, 'wb') as f: 
                frontmatter.dump(post, f)
            logger.info(f"Successfully wrote file to '{target_hugo_path}'")

        except Exception as e:
            logger.exception(f"Error processing file '{full_source_file_path}': {e}")
            raise # Re-raise to indicate processing failure for this file

    def process_deleted_file(self, target_hugo_path: Path):
        """
        Processes a file that was deleted from the source.
        Applies action based on `deleted_files_action` configuration.

        Args:
            target_hugo_path: Absolute path of the file in the Hugo project that corresponds
                              to the deleted source file.
        """
        action = self.app_config.source.deleted_files_action
        logger.info(f"Processing deleted file: '{target_hugo_path}' with action: '{action}'")

        if not target_hugo_path.exists():
            logger.warning(f"Target file '{target_hugo_path}' for deletion processing does not exist. No action taken.")
            return

        try:
            if action == "delete":
                target_hugo_path.unlink()
                logger.info(f"Deleted file: '{target_hugo_path}' as per 'delete' action.")
            elif action == "mark_draft":
                logger.warning(f"'mark_draft' action for deleted file '{target_hugo_path}' is not fully implemented. File will NOT be deleted or modified at this time.")
                # Example future implementation:
                # try:
                #     logger.debug(f"Attempting to mark '{target_hugo_path}' as draft.")
                #     post = frontmatter.load(target_hugo_path)
                #     post['draft'] = True
                #     with open(target_hugo_path, 'wb') as f:
                #         frontmatter.dump(post, f)
                #     logger.info(f"Marked file as draft: '{target_hugo_path}'")
                # except Exception as e_draft:
                #     logger.exception(f"Could not mark file as draft '{target_hugo_path}': {e_draft}. File left unchanged.")
                pass 
            elif action == "ignore":
                logger.info(f"Deletion of '{target_hugo_path}' ignored as per 'ignore' action configuration.")
            else:
                logger.warning(f"Unknown action '{action}' specified for deleted file '{target_hugo_path}'. Defaulting to 'ignore'.")
        
        except Exception as e:
            logger.exception(f"Error processing deleted file '{target_hugo_path}' with action '{action}': {e}")
            raise # Re-raise to indicate processing failure

    def run_hugo_build(self):
        """
        Runs the Hugo build command in the configured Hugo project directory.

        Raises:
            RuntimeError: If the Hugo build command returns a non-zero exit code.
        """
        hugo_project_dir = Path(self.app_config.hugo_project_path)
        if not hugo_project_dir.is_dir():
            logger.error(f"Hugo project path '{hugo_project_dir}' does not exist or is not a directory.")
            raise FileNotFoundError(f"Hugo project path not found: {hugo_project_dir}")

        logger.info(f"Starting Hugo build in directory: '{hugo_project_dir}'")
        
        hugo_command = ['hugo'] 
        logger.debug(f"Executing Hugo command: {' '.join(hugo_command)} in {hugo_project_dir}")

        try:
            process = subprocess.run(
                hugo_command,
                cwd=str(hugo_project_dir), 
                capture_output=True,
                text=True,
                check=False 
            )

            # Log stdout and stderr regardless of return code, as Hugo can output info to both
            if process.stdout:
                logger.info(f"Hugo build stdout:\n{process.stdout.strip()}")
            if process.stderr:
                # Hugo often uses stderr for informational messages, warnings, or errors.
                # Log as warning if process succeeded, error if failed.
                if process.returncode == 0:
                    logger.info(f"Hugo build stderr (info/warnings):\n{process.stderr.strip()}")
                else:
                    logger.error(f"Hugo build stderr (errors):\n{process.stderr.strip()}")


            if process.returncode != 0:
                error_message = f"Hugo build failed with return code {process.returncode} in directory {hugo_project_dir}."
                logger.error(error_message) # Already logged stderr above
                raise RuntimeError(error_message)
            
            logger.info(f"Hugo build completed successfully in '{hugo_project_dir}'.")

        except FileNotFoundError: 
            logger.error("Hugo command not found. Ensure Hugo is installed and in PATH.", exc_info=True)
            raise
        except Exception as e:
            logger.exception(f"An unexpected error occurred during Hugo build in '{hugo_project_dir}': {e}")
            raise


if __name__ == '__main__':
    # Basic logging setup for standalone testing of this module
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger.info("Starting HugoProcessor self-test example...")

    class MockSourceConfig:
        def __init__(self, path_in_repo=".", hugo_content_dir="content/posts", deleted_files_action="delete"):
            self.path_in_repo = path_in_repo
            self.hugo_content_dir = hugo_content_dir 
            self.deleted_files_action = deleted_files_action

    class MockAppConfig:
        def __init__(self, hugo_project_path, tmp_dir="/tmp/hugo_processor_selftest"):
            self.hugo_project_path = hugo_project_path
            self.tmp_dir = tmp_dir
            self.source = MockSourceConfig()

    test_hugo_dir = Path("/tmp/test_hugo_site_processor_selftest")
    # test_hugo_content_dir corresponds to <hugo_project_path>/<source.hugo_content_dir>
    test_hugo_content_target_dir = test_hugo_dir / "content" / "posts" 
    test_source_files_dir = Path("/tmp/test_source_files_processor_selftest")

    logger.info(f"Test Hugo Dir: {test_hugo_dir}")
    logger.info(f"Test Hugo Content Target Dir (for files): {test_hugo_content_target_dir}")
    logger.info(f"Test Source Files Dir: {test_source_files_dir}")


    if test_hugo_dir.exists():
        shutil.rmtree(test_hugo_dir)
    if test_source_files_dir.exists():
        shutil.rmtree(test_source_files_dir)
    
    test_hugo_content_target_dir.mkdir(parents=True, exist_ok=True)
    test_source_files_dir.mkdir(parents=True, exist_ok=True)

    dummy_hugo_executable_path = test_hugo_dir / "hugo"
    with open(dummy_hugo_executable_path, "w") as f:
        f.write("#!/bin/bash\n")
        f.write("echo 'Dummy Hugo build running... Path: $(pwd)'\n")
        f.write("echo 'Build complete.' >&1\n")
        f.write("exit 0\n")
    os.chmod(dummy_hugo_executable_path, 0o755)
    
    original_path = os.environ["PATH"]
    os.environ["PATH"] = str(test_hugo_dir) + os.pathsep + original_path
    logger.info(f"Temporarily prepended {test_hugo_dir} to PATH.")


    source_file_content = """---
title: Test Post from Processor Selftest
date: 2023-01-02
tags: ["selftest", "processor"]
---
This is a selftest post.
"""
    dummy_source_md = test_source_files_dir / "my-selftest-post.md"
    with open(dummy_source_md, "w") as f:
        f.write(source_file_content)
    logger.info(f"Created dummy source file: {dummy_source_md}")

    # Initialize AppConfig and HugoProcessor
    # Note: mock_app_config.source.hugo_content_dir is "content/posts"
    # test_hugo_content_target_dir is <hugo_project_path>/content/posts
    mock_app_config = MockAppConfig(hugo_project_path=str(test_hugo_dir))
    processor = HugoProcessor(app_config=mock_app_config)

    # Test _calculate_target_path
    # `relative_file_path` is relative to `source.path_in_repo` (which is "." in mock).
    # `source.hugo_content_dir` is "content/posts"
    # So, target is <hugo_project_path>/content/posts/my-selftest-post.md
    relative_path_from_git_handler = "my-selftest-post.md" 
    target_path = processor._calculate_target_path(relative_path_from_git_handler)
    expected_target_path = test_hugo_content_target_dir / "my-selftest-post.md"
    
    logger.info(f"Testing _calculate_target_path: Relative='{relative_path_from_git_handler}', Calculated='{target_path}', Expected='{expected_target_path}'")
    assert target_path == expected_target_path, f"Path calculation mismatch: Got {target_path}, Expected {expected_target_path}"

    # Test process_added_or_modified_file
    logger.info(f"Testing process_added_or_modified_file for {dummy_source_md} -> {target_path}")
    processor.process_added_or_modified_file(dummy_source_md, target_path)
    assert target_path.exists(), f"Target file {target_path} was not created."
    loaded_post = frontmatter.load(target_path)
    assert loaded_post['title'] == "Test Post from Processor Selftest"
    logger.info(f"File '{target_path}' processed and verified.")

    # Test process_deleted_file (action: delete)
    logger.info(f"Testing process_deleted_file (action: delete) for {target_path}")
    processor.app_config.source.deleted_files_action = "delete"
    processor.process_deleted_file(target_path)
    assert not target_path.exists(), f"Target file {target_path} was not deleted."
    logger.info(f"File '{target_path}' deleted successfully.")

    # Re-create for next test
    target_path.parent.mkdir(parents=True, exist_ok=True) 
    shutil.copy(dummy_source_md, target_path)
    assert target_path.exists(), "Test file should be re-created."

    # Test process_deleted_file (action: ignore)
    logger.info(f"Testing process_deleted_file (action: ignore) for {target_path}")
    processor.app_config.source.deleted_files_action = "ignore"
    processor.process_deleted_file(target_path)
    assert target_path.exists(), "File should still exist after 'ignore' action."
    logger.info(f"File '{target_path}' deletion ignored successfully.")
    
    # Test process_deleted_file (action: mark_draft - placeholder)
    logger.info(f"Testing process_deleted_file (action: mark_draft - placeholder) for {target_path}")
    processor.app_config.source.deleted_files_action = "mark_draft"
    processor.process_deleted_file(target_path)
    assert target_path.exists(), "File should still exist after 'mark_draft' (placeholder) action."
    logger.info(f"File '{target_path}' deletion with 'mark_draft' (placeholder) handled.")

    # Test run_hugo_build
    try:
        logger.info("Testing Hugo build (using dummy Hugo)...")
        processor.run_hugo_build()
        logger.info("Dummy Hugo build executed successfully.")
    except RuntimeError as e:
        logger.error(f"Hugo build test failed: {e}", exc_info=True)
    except FileNotFoundError:
        logger.error("Hugo command not found during test. Ensure dummy Hugo is in PATH.", exc_info=True)
    
    os.environ["PATH"] = original_path
    logger.info(f"Restored original PATH. Removed {test_hugo_dir} from PATH.")

    logger.info("HugoProcessor self-test example finished.")
    # Consider cleaning up test_hugo_dir and test_source_files_dir manually after inspection
    # shutil.rmtree(test_hugo_dir)
    # shutil.rmtree(test_source_files_dir)
    # logger.info("Cleaned up test directories.")
```
