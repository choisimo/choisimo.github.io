import logging
import sys
from typing import Optional

def setup_logging(log_level_str: str = "INFO", log_file: Optional[str] = None):
    """
    Sets up centralized logging for the application.

    Args:
        log_level_str: The logging level as a string (e.g., "DEBUG", "INFO").
                       Defaults to "INFO".
        log_file: Optional path to a file where logs should be written.
                  If None, logs are only written to the console.
    """
    root_logger = logging.getLogger()

    # Set logging level
    level = getattr(logging, log_level_str.upper(), logging.INFO)
    root_logger.setLevel(level)

    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # Remove existing handlers to avoid duplication
    # This is important if this function could be called multiple times,
    # though ideally it's called once at application startup.
    if root_logger.hasHandlers():
        for handler in root_logger.handlers[:]: # Iterate over a copy
            root_logger.removeHandler(handler)

    # Add StreamHandler (console output to sys.stderr)
    stream_handler = logging.StreamHandler(sys.stderr)
    stream_handler.setFormatter(formatter)
    root_logger.addHandler(stream_handler)
    logging.info(f"Console logging configured at level {log_level_str.upper()}.")


    # Add FileHandler if log_file is provided
    if log_file:
        try:
            file_handler = logging.FileHandler(log_file, mode='a') # Append mode
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)
            logging.info(f"File logging configured at level {log_level_str.upper()} to file '{log_file}'.")
        except Exception as e:
            # Use a basic print here, as logger might not be fully set up if FileHandler fails
            print(f"Error setting up file handler for log file '{log_file}': {e}", file=sys.stderr)
            # Alternatively, log to console handler which should be working
            # logging.error(f"Failed to set up file logging to '{log_file}': {e}")

if __name__ == "__main__":
    print("--- Testing logger_setup ---")

    # Test 1: Default INFO level, no file
    print("\n1. Testing INFO level (console only)...")
    setup_logging(log_level_str="INFO")
    logging.debug("This is a DEBUG message (should not be visible).")
    logging.info("This is an INFO message (should be visible).")
    logging.warning("This is a WARNING message (should be visible).")
    logging.error("This is an ERROR message (should be visible).")

    # Test 2: DEBUG level, with a log file
    test_log_file = "test_app.log"
    print(f"\n2. Testing DEBUG level (console and file: '{test_log_file}')...")
    # Clean up old test log file if it exists
    import os
    if os.path.exists(test_log_file):
        os.remove(test_log_file)
        
    setup_logging(log_level_str="DEBUG", log_file=test_log_file)
    logging.debug("This is a DEBUG message (should be visible in console and file).")
    logging.info("This is an INFO message (should be visible in console and file).")
    
    # Verify file content (basic check)
    if os.path.exists(test_log_file):
        with open(test_log_file, "r") as f:
            content = f.read()
            if "DEBUG message" in content and "INFO message" in content:
                print(f"Content successfully written to '{test_log_file}'.")
            else:
                print(f"Error: Content missing in '{test_log_file}'. Content:\n{content}")
        # os.remove(test_log_file) # Clean up
    else:
        print(f"Error: Log file '{test_log_file}' was not created.")

    # Test 3: ERROR level, appending to existing log file
    print(f"\n3. Testing ERROR level (console and appending to file: '{test_log_file}')...")
    setup_logging(log_level_str="ERROR", log_file=test_log_file) # Should append
    logging.debug("This DEBUG message should NOT appear anywhere.")
    logging.info("This INFO message should NOT appear anywhere.")
    logging.warning("This WARNING message should NOT appear anywhere.")
    logging.error("This is an ERROR message (should be visible in console and appended to file).")

    if os.path.exists(test_log_file):
        with open(test_log_file, "r") as f:
            content = f.read()
            if "ERROR message" in content and "DEBUG message" in content: # Previous DEBUG should still be there
                print(f"Content successfully appended to '{test_log_file}'.")
            else:
                print(f"Error: Content not appended correctly in '{test_log_file}'. Content:\n{content}")
        os.remove(test_log_file) # Clean up test log file
        print(f"Cleaned up '{test_log_file}'.")
    else:
        print(f"Error: Log file '{test_log_file}' does not exist for append test.")

    print("\n--- Logger setup testing finished ---")
