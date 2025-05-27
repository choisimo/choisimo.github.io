import git
import os
import shutil
import logging # Added
from pathlib import Path
from typing import Dict, List

from importer.config_manager import SourceConfig, ValidationError # For testing block

logger = logging.getLogger(__name__) # Added

class GitHandler:
    """
    Handles Git operations like cloning, fetching, and identifying changed markdown files
    within a specified path in the repository.
    """

    def __init__(self, source_config: SourceConfig, tmp_dir: str):
        """
        Initializes the GitHandler.

        Args:
            source_config: Configuration for the content source.
            tmp_dir: Path to the temporary directory for cloning repositories.
        """
        self.source_config = source_config
        self.tmp_dir = Path(tmp_dir)
        # SourceConfig does not have a 'name' attribute.
        # We derive a directory-friendly name from the repo_url.
        self.repo_name = self._extract_repo_name(self.source_config.repo_url)
        logger.debug(f"GitHandler initialized for repo URL: {source_config.repo_url}, tmp_dir: {tmp_dir}, repo_name: {self.repo_name}")

    def _extract_repo_name(self, repo_url: str) -> str:
        """
        Extracts a suitable directory name from the repository URL.
        Example: git@github.com:user/my-repo.git -> my-repo
        Example: https://github.com/user/another-repo.git -> another-repo
        """
        name = repo_url.split('/')[-1]
        if name.endswith(".git"):
            name = name[:-4]
        return name

    def _get_local_repo_path(self) -> Path:
        """
        Determines the local path for the repository clone.
        It will be <tmp_dir>/<extracted_repo_name_from_url>.
        """
        return self.tmp_dir / self.repo_name

    def _ensure_repo_cloned_and_branch_checked_out(self) -> git.Repo:
        """
        Ensures the repository is cloned locally and the correct branch is checked out.

        Returns:
            A git.Repo object.
        Raises:
            git.GitCommandError: If Git commands fail.
            ValueError: For configuration issues (e.g., branch not found).
            Exception: For other unexpected errors.
        """
        local_repo_path = self._get_local_repo_path()
        repo: git.Repo

        try:
            if not local_repo_path.exists():
                logger.info(f"Cloning repository '{self.source_config.repo_url}' to '{local_repo_path}' (branch: '{self.source_config.branch}')...")
                local_repo_path.mkdir(parents=True, exist_ok=True)
                try:
                    repo = git.Repo.clone_from(self.source_config.repo_url, str(local_repo_path), branch=self.source_config.branch)
                except git.GitCommandError as e:
                    if "Remote branch" in str(e) and ("not found" in str(e) or "does not exist" in str(e)):
                        logger.warning(f"Branch '{self.source_config.branch}' not found directly during clone for '{self.source_config.repo_url}'. Cloning default branch first.")
                        repo = git.Repo.clone_from(self.source_config.repo_url, str(local_repo_path))
                    else:
                        logger.error(f"GitCommandError during initial clone: {e}")
                        raise
                logger.info("Clone successful.")
            else:
                try:
                    repo = git.Repo(str(local_repo_path))
                    logger.info(f"Repository already exists at '{local_repo_path}'.")
                except git.InvalidGitRepositoryError:
                    logger.warning(f"Path '{local_repo_path}' exists but is not a valid Git repository. Cleaning up and re-cloning.")
                    shutil.rmtree(str(local_repo_path))
                    local_repo_path.mkdir(parents=True, exist_ok=True)
                    try:
                        repo = git.Repo.clone_from(self.source_config.repo_url, str(local_repo_path), branch=self.source_config.branch)
                    except git.GitCommandError as e:
                        if "Remote branch" in str(e) and ("not found" in str(e) or "does not exist" in str(e)):
                            logger.warning(f"Branch '{self.source_config.branch}' not found directly during re-clone for '{self.source_config.repo_url}'. Cloning default branch first.")
                            repo = git.Repo.clone_from(self.source_config.repo_url, str(local_repo_path))
                        else:
                            logger.error(f"GitCommandError during re-clone: {e}")
                            raise
                    logger.info("Re-clone successful.")
            
            if repo.is_dirty(untracked_files=True):
                logger.warning(f"Repository at '{local_repo_path}' is dirty. Resetting to HEAD and cleaning untracked files/directories.")
                repo.git.reset('--hard', 'HEAD')
                repo.git.clean('-fdx')

            current_branch_name = repo.active_branch.name
            logger.info(f"Current active branch: '{current_branch_name}'")

            if current_branch_name != self.source_config.branch:
                logger.info(f"Switching to configured branch '{self.source_config.branch}'.")
                origin = repo.remotes.origin
                
                if self.source_config.branch in repo.heads:
                    logger.info(f"Branch '{self.source_config.branch}' found locally. Checking it out.")
                    repo.heads[self.source_config.branch].checkout()
                elif f"{origin.name}/{self.source_config.branch}" in origin.refs:
                    logger.info(f"Branch '{self.source_config.branch}' found on remote '{origin.name}'. Fetching and creating local tracking branch.")
                    origin.fetch(self.source_config.branch, progress=None)
                    remote_ref = origin.refs[f"{origin.name}/{self.source_config.branch}"]
                    local_branch = repo.create_head(self.source_config.branch, remote_ref)
                    local_branch.set_tracking_branch(remote_ref)
                    local_branch.checkout()
                else:
                    logger.info(f"Branch '{self.source_config.branch}' not found locally or in simple remote refs. Fetching all from remote '{origin.name}' and re-checking.")
                    origin.fetch(progress=None) 
                    if f"{origin.name}/{self.source_config.branch}" in origin.refs:
                        logger.info(f"Branch '{self.source_config.branch}' found after full fetch. Creating and tracking.")
                        remote_ref = origin.refs[f"{origin.name}/{self.source_config.branch}"]
                        local_branch = repo.create_head(self.source_config.branch, remote_ref)
                        local_branch.set_tracking_branch(remote_ref)
                        local_branch.checkout()
                    else:
                        err_msg = f"Branch '{self.source_config.branch}' not found locally or on remote '{origin.name}' for repo '{self.source_config.repo_url}' even after full fetch."
                        logger.error(err_msg)
                        raise ValueError(err_msg)
            
            logger.info(f"Successfully on branch '{self.source_config.branch}'.")
            return repo

        except git.GitCommandError as e:
            logger.exception(f"A Git command failed during repository setup for {self.source_config.repo_url}: {e.stderr}")
            raise
        except Exception as e:
            logger.exception(f"An unexpected error occurred during repository setup for {self.source_config.repo_url}: {e}")
            raise

    def get_changed_markdown_files(self) -> Dict[str, List[str]]:
        """
        Identifies added, modified, or deleted markdown files in the configured path
        between the last known local state and the latest remote state.
        Updates the local repository to the latest remote commit after identifying changes.
        """
        repo = self._ensure_repo_cloned_and_branch_checked_out()
        changed_files: Dict[str, List[str]] = {"added": [], "modified": [], "deleted": []}
        origin = repo.remotes.origin

        try:
            logger.info(f"Fetching updates from remote '{origin.name}' for branch '{self.source_config.branch}'...")
            fetch_infos = origin.fetch(self.source_config.branch, progress=None)
            
            if not fetch_infos:
                logger.info(f"Fetch for branch '{self.source_config.branch}' returned no info. May be up-to-date or branch not on remote.")
            else:
                for info in fetch_infos:
                    if info.flags & git.FetchInfo.ERROR:
                        error_note = info.note if info.note else "Unknown fetch error"
                        logger.error(f"Error during fetch for {self.source_config.repo_url}: {error_note}")
                        if "couldn't find remote ref" in error_note.lower() or "no such ref" in error_note.lower():
                            logger.warning(f"Branch '{self.source_config.branch}' confirmed not found on remote '{origin.name}'. No changes to report.")
                            return changed_files 
                        raise git.GitCommandError(f"Fetch failed for branch {self.source_config.branch}", error_note)
            logger.info("Fetch operation completed.")

            local_commit = repo.head.commit
            remote_ref_full_name = f"{origin.name}/{self.source_config.branch}"

            if remote_ref_full_name not in origin.refs:
                logger.warning(f"Remote branch '{remote_ref_full_name}' not found in remote refs after fetch for {self.source_config.repo_url}. Local branch may be ahead or remote branch was deleted.")
                return changed_files
            
            remote_commit = origin.refs[remote_ref_full_name].commit

            if local_commit.hexsha == remote_commit.hexsha:
                logger.info(f"Local commit {local_commit.hexsha} is the same as remote commit {remote_commit.hexsha} on branch '{self.source_config.branch}'. No changes.")
                repo.git.reset('--hard', remote_commit.hexsha)
                if repo.head.is_detached: 
                    logger.info("HEAD is detached after reset, checking out branch.")
                    repo.heads[self.source_config.branch].checkout()
                return changed_files

            logger.info(f"Comparing local commit {local_commit.hexsha} with remote commit {remote_commit.hexsha} on branch '{self.source_config.branch}' for repo {self.source_config.repo_url}")
            
            diff_path_spec = self.source_config.path_in_repo
            
            diff_output = repo.git.diff('--name-status', local_commit.hexsha, remote_commit.hexsha, '--', diff_path_spec)
            logger.debug(f"Diff output for path '{diff_path_spec}':\n{diff_output}")
            
            path_in_repo_as_path = Path(self.source_config.path_in_repo)

            for line in diff_output.splitlines():
                parts = line.split('\t')
                status_char = parts[0][0].upper() 
                
                action_type = None
                current_filepath_from_repo_root_str = None
                old_filepath_from_repo_root_str = None # For renames

                if status_char == 'A': action_type = 'added'; current_filepath_from_repo_root_str = parts[1]
                elif status_char == 'M': action_type = 'modified'; current_filepath_from_repo_root_str = parts[1]
                elif status_char == 'D': action_type = 'deleted'; current_filepath_from_repo_root_str = parts[1]
                elif status_char == 'C': action_type = 'added'; current_filepath_from_repo_root_str = parts[1] # Treat copy as add
                elif status_char == 'R' and len(parts) == 3: # Renamed file
                    old_filepath_from_repo_root_str = parts[1]
                    current_filepath_from_repo_root_str = parts[2] 

                    old_filepath = Path(old_filepath_from_repo_root_str)
                    if old_filepath.suffix.lower() in self.source_config.markdown_extensions:
                        is_old_path_relevant = (self.source_config.path_in_repo == ".") or \
                                               (str(old_filepath).startswith(str(path_in_repo_as_path) + os.sep)) or \
                                               (str(old_filepath) == str(path_in_repo_as_path))
                        if is_old_path_relevant:
                            try:
                                relative_old_path = old_filepath.relative_to(path_in_repo_as_path if self.source_config.path_in_repo != "." else Path(".")).as_posix()
                                changed_files["deleted"].append(relative_old_path)
                                logger.debug(f"Rename: Processed old path '{relative_old_path}' as deleted.")
                            except ValueError:
                                logger.warning(f"Cannot make '{old_filepath}' relative to '{path_in_repo_as_path}' (old path in rename). Skipping deletion part.")
                    action_type = 'added' 
                else:
                    logger.warning(f"Skipping unrecognized diff line: {line}")
                    continue
                
                if not action_type or not current_filepath_from_repo_root_str:
                    continue # Should not happen with the logic above

                filepath = Path(current_filepath_from_repo_root_str)

                if filepath.suffix.lower() not in self.source_config.markdown_extensions:
                    logger.debug(f"Skipping '{filepath}' (action: {action_type}): non-markdown extension.")
                    continue
                
                is_current_path_relevant = (self.source_config.path_in_repo == ".") or \
                                           (str(filepath).startswith(str(path_in_repo_as_path) + os.sep)) or \
                                           (str(filepath) == str(path_in_repo_as_path))
                
                if not is_current_path_relevant:
                    logger.debug(f"Skipping '{filepath}' (action: {action_type}): not relevant to '{path_in_repo_as_path}'.")
                    continue
                    
                try:
                    if self.source_config.path_in_repo == ".":
                        relative_path_str = filepath.as_posix()
                    else:
                        relative_path_str = filepath.relative_to(path_in_repo_as_path).as_posix()
                except ValueError: 
                    logger.warning(f"Cannot make '{filepath}' relative to '{path_in_repo_as_path}'. Skipping.")
                    continue
                
                changed_files[action_type].append(relative_path_str)
                logger.debug(f"Processed file '{relative_path_str}' as {action_type}.")
            
            logger.info(f"Identified changes relative to '{self.source_config.path_in_repo}' for repo {self.source_config.repo_url}: {changed_files}")

            logger.info(f"Resetting local repository HEAD to remote commit {remote_commit.hexsha}...")
            repo.git.reset('--hard', remote_commit.hexsha)
            if repo.head.is_detached:
                logger.info(f"HEAD is detached after reset. Checking out branch '{self.source_config.branch}' to reattach.")
                repo.heads[self.source_config.branch].checkout()
            
            if repo.active_branch.name != self.source_config.branch or repo.active_branch.commit != remote_commit:
                logger.warning(f"Branch state after reset is unexpected. Active: {repo.active_branch.name}@{repo.active_branch.commit.hexsha}. Forcing checkout.")
                repo.heads[self.source_config.branch].set_commit(remote_commit.hexsha)
                repo.heads[self.source_config.branch].checkout(force=True)
                logger.info(f"Re-checked out branch '{self.source_config.branch}' at {remote_commit.hexsha}.")

            logger.info(f"Local repository for {self.source_config.repo_url} updated to remote state.")
            return changed_files

        except git.GitCommandError as e:
            logger.exception(f"Git command failed during diff or fetch operations for {self.source_config.repo_url}: {e.stderr}")
            raise
        except Exception as e: 
            logger.exception(f"An unexpected error occurred while getting changed files for {self.source_config.repo_url}: {e}")
            raise


if __name__ == '__main__':
    # Basic logging setup for standalone testing of this module
    logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    logger.info("Starting GitHandler self-test example...")

    mock_source_config_data = {
        "repo_url": "https://github.com/octocat/Spoon-Knife.git", 
        "branch": "main", 
        "path_in_repo": ".", 
        "hugo_content_dir": "content", 
        "markdown_extensions": [".md", ".markdown", ".txt"], 
        "deleted_files_action": "delete" 
    }
    try:
        source_config_obj = SourceConfig(**mock_source_config_data)
    except ValidationError as ve:
        logger.critical(f"Pydantic validation error for mock config: {ve}", exc_info=True)
        exit(1) 

    test_tmp_dir_name = f"hugo_importer_gittest_{source_config_obj.branch}_{Path(source_config_obj.repo_url).name.replace('.git','')}"
    test_tmp_dir = Path(f"/tmp/{test_tmp_dir_name}")

    logger.info(f"Test setup: Repo URL='{source_config_obj.repo_url}', Branch='{source_config_obj.branch}', Path in Repo='{source_config_obj.path_in_repo}', Temp Dir='{test_tmp_dir}'")

    if test_tmp_dir.exists():
        logger.info(f"Cleaning up old temporary directory: {test_tmp_dir}")
        try:
            shutil.rmtree(test_tmp_dir)
        except OSError as e:
            logger.error(f"Error removing directory {test_tmp_dir}: {e}", exc_info=True)
            
    test_tmp_dir.mkdir(parents=True, exist_ok=True)

    try:
        git_handler = GitHandler(source_config=source_config_obj, tmp_dir=str(test_tmp_dir))

        logger.info("\n--- Initial call to get_changed_markdown_files() ---")
        logger.info("(This will clone the repo. If local and remote are immediately in sync, no *new* changes will be reported.)")
        changes = git_handler.get_changed_markdown_files()
        logger.info(f"Changes reported on first run: {changes}")
        expected_empty_changes = {"added": [], "modified": [], "deleted": []}
        assert changes == expected_empty_changes, \
            f"First run should detect no changes if fresh clone matches remote, but got {changes}"

        logger.info("\n--- Second call to get_changed_markdown_files() (simulating no remote changes) ---")
        changes_second_run = git_handler.get_changed_markdown_files()
        logger.info(f"Changes reported on second run: {changes_second_run}")
        assert changes_second_run == expected_empty_changes, \
            f"Second run should detect no changes if remote is static, but got {changes_second_run}"
        
        logger.info("\n--- Advanced Test: Simulating local being behind remote ---")
        repo_path_for_test = git_handler._get_local_repo_path()
        if repo_path_for_test.exists():
            repo_obj_for_test = git.Repo(str(repo_path_for_test))
            commits_for_test = list(repo_obj_for_test.iter_commits(source_config_obj.branch, max_count=2))
            
            if len(commits_for_test) > 1:
                latest_commit_on_remote_sha = commits_for_test[0].hexsha 
                previous_commit_sha = commits_for_test[1].hexsha      

                logger.info(f"Temporarily resetting local HEAD to an older commit: {previous_commit_sha} for testing purposes (current remote HEAD is {latest_commit_on_remote_sha}).")
                repo_obj_for_test.git.reset('--hard', previous_commit_sha)
                
                logger.info("\n--- Call to get_changed_markdown_files() after local reset ---")
                changes_after_reset = git_handler.get_changed_markdown_files()
                logger.info(f"Changes reported after local reset: {changes_after_reset}")
                
                if not any(changes_after_reset.values()): 
                    logger.warning("Simulated local-behind-remote test resulted in no changes. This is OK if recent commits had no relevant files.")
                else:
                    logger.info("Simulated local-behind-remote test correctly found changes.")
                    if 'README.md' in changes_after_reset.get('modified', []) or \
                       'README.md' in changes_after_reset.get('added', []): 
                       logger.info("README.md was detected among changes, which is a good sign for the diff logic.")
            else:
                logger.warning("\nNot enough commits in the repo history on the branch to simulate local being behind for this test.")
        else:
            logger.warning("\nRepo path does not exist, skipping advanced test simulation.")

        logger.info("\nGitHandler self-test example finished successfully.")

    except git.GitCommandError as e_git:
        logger.critical(f"Git command error during test: {e_git.stderr if hasattr(e_git, 'stderr') else e_git}", exc_info=True)
    except AssertionError as e_assert:
        logger.critical(f"AssertionError during test: {e_assert}", exc_info=True)
    except Exception as e_exc: 
        logger.critical(f"An unexpected error occurred during the GitHandler self-test: {e_exc}", exc_info=True)
    finally:
        logger.debug(f"Test completed. To inspect repo state, check: {test_tmp_dir}")
        # if test_tmp_dir.exists():
        #     try:
        #         shutil.rmtree(test_tmp_dir)
        #         logger.info(f"Cleaned up test directory: {test_tmp_dir}")
        #     except OSError as e_clean:
        #         logger.error(f"Error cleaning up test directory {test_tmp_dir}: {e_clean}", exc_info=True)
        pass
```
