#!/usr/bin/env python3

def analyze_scss_braces(file_path):
    """Analyze SCSS file for brace matching issues"""
    with open(file_path, 'r') as f:
        lines = f.readlines()
    
    brace_stack = []
    issues = []
    
    for line_num, line in enumerate(lines, 1):
        stripped_line = line.strip()
        
        # Skip comments and empty lines
        if stripped_line.startswith('//') or stripped_line.startswith('/*') or not stripped_line:
            continue
            
        # Count opening and closing braces in this line
        for char_pos, char in enumerate(line):
            if char == '{':
                brace_stack.append({
                    'line': line_num,
                    'char_pos': char_pos,
                    'context': stripped_line[:50] + ('...' if len(stripped_line) > 50 else '')
                })
            elif char == '}':
                if not brace_stack:
                    issues.append(f"Line {line_num}: Extra closing brace - {stripped_line}")
                else:
                    brace_stack.pop()
    
    # Check for unmatched opening braces
    for brace in brace_stack:
        issues.append(f"Line {brace['line']}: Unmatched opening brace - {brace['context']}")
    
    print(f"Total lines: {len(lines)}")
    print(f"Brace balance: {len(brace_stack)} unmatched opening braces")
    
    if issues:
        print("\nIssues found:")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("No brace matching issues found")
    
    return len(brace_stack), issues

if __name__ == "__main__":
    analyze_scss_braces("/home/nodove/workspace/choisimo.github.io/assets/scss/_card.scss")
