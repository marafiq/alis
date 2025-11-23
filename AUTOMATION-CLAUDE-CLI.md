# Automated Implementation Scripts
## Using Claude CLI for Parallel Execution

**Purpose:** Automate module implementation using Claude CLI  
**Platform:** Cross-platform (Linux/Mac/Windows)

---

## Prerequisites

### Install Claude CLI

```bash
# For macOS/Linux
npm install -g @anthropic-ai/claude-cli

# For Windows (PowerShell as Administrator)
npm install -g @anthropic-ai/claude-cli

# Or using pip
pip install claude-cli
```

### Set API Key

```bash
# Linux/Mac
export ANTHROPIC_API_KEY="your-api-key-here"

# Windows PowerShell
$env:ANTHROPIC_API_KEY="your-api-key-here"

# Or add to ~/.bashrc, ~/.zshrc, or PowerShell profile for persistence
```

---

## Project Structure

```
automation/
├── scripts/
│   ├── implement-module.sh           # Single module implementation
│   ├── implement-module.ps1          # Windows version
│   ├── run-parallel.sh               # Parallel orchestration
│   ├── run-parallel.ps1              # Windows version
│   └── verify-module.sh              # Test verification
├── prompts/
│   ├── module-01-core.txt
│   ├── module-02-data.txt
│   ├── module-03-auth.txt
│   └── ... (all 14 modules)
├── configs/
│   ├── claude-config.json
│   └── dependencies.json             # Module dependency graph
└── logs/
    └── (generated during execution)
```

---

## Setup Script

Run this first to create automation structure:

```bash
#!/bin/bash
# setup-automation.sh

echo "🚀 Setting up automated implementation environment..."

# Create directory structure
mkdir -p automation/{scripts,prompts,configs,logs,results}
mkdir -p SeniorLivingPlatform/{src,tests}

# Download this architecture package
# (Assuming you've already extracted senior-living-architecture-v2.zip)

# Create Claude CLI config
cat > automation/configs/claude-config.json << 'EOF'
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 8000,
  "temperature": 0.3,
  "timeout": 300,
  "retry_attempts": 3,
  "parallel_limit": 3
}
EOF

# Create dependency graph
cat > automation/configs/dependencies.json << 'EOF'
{
  "modules": [
    {
      "id": 1,
      "name": "Platform.Core",
      "dependencies": [],
      "duration_hours": 16,
      "parallel_group": 1
    },
    {
      "id": 2,
      "name": "Platform.Data",
      "dependencies": [1],
      "duration_hours": 16,
      "parallel_group": 2
    },
    {
      "id": 3,
      "name": "Platform.Auth",
      "dependencies": [1, 2],
      "duration_hours": 8,
      "parallel_group": 3
    },
    {
      "id": 4,
      "name": "Platform.FeatureFlags",
      "dependencies": [1, 2, 7],
      "duration_hours": 8,
      "parallel_group": 5
    },
    {
      "id": 5,
      "name": "Platform.Storage",
      "dependencies": [1],
      "duration_hours": 4,
      "parallel_group": 2
    },
    {
      "id": 6,
      "name": "Platform.FrequentAssets",
      "dependencies": [1, 5, 9],
      "duration_hours": 4,
      "parallel_group": 6
    },
    {
      "id": 7,
      "name": "Platform.Caching",
      "dependencies": [1],
      "duration_hours": 8,
      "parallel_group": 2
    },
    {
      "id": 8,
      "name": "Platform.Messaging",
      "dependencies": [1, 2],
      "duration_hours": 8,
      "parallel_group": 3
    },
    {
      "id": 9,
      "name": "Platform.BackgroundJobs",
      "dependencies": [1, 2],
      "duration_hours": 8,
      "parallel_group": 3
    },
    {
      "id": 10,
      "name": "Platform.Integrations",
      "dependencies": [1, 11],
      "duration_hours": 8,
      "parallel_group": 5
    },
    {
      "id": 11,
      "name": "Platform.Observability",
      "dependencies": [1],
      "duration_hours": 8,
      "parallel_group": 2
    },
    {
      "id": 12,
      "name": "Platform.Admin",
      "dependencies": [1, 2, 3, 4],
      "duration_hours": 32,
      "parallel_group": 6
    },
    {
      "id": 13,
      "name": "Platform.Residents",
      "dependencies": [1, 2, 3, 5, 8, 9],
      "duration_hours": 48,
      "parallel_group": 7
    },
    {
      "id": 14,
      "name": "Platform.Families",
      "dependencies": [1, 2, 3, 8, 10, 13],
      "duration_hours": 32,
      "parallel_group": 8
    }
  ]
}
EOF

echo "✅ Automation structure created!"
```

---

## Core Implementation Script (Bash)

```bash
#!/bin/bash
# automation/scripts/implement-module.sh

MODULE_ID=$1
MODULE_NAME=$2
PROMPT_FILE=$3

if [ -z "$MODULE_ID" ] || [ -z "$MODULE_NAME" ] || [ -z "$PROMPT_FILE" ]; then
  echo "Usage: ./implement-module.sh <module_id> <module_name> <prompt_file>"
  exit 1
fi

LOG_DIR="automation/logs"
RESULT_DIR="automation/results"
MODULE_DIR="src/$MODULE_NAME"
TEST_DIR="tests/${MODULE_NAME}.Tests"

mkdir -p "$LOG_DIR" "$RESULT_DIR"

echo "🤖 Starting implementation of Module $MODULE_ID: $MODULE_NAME"
echo "⏰ Start time: $(date)"

# Create log file
LOG_FILE="$LOG_DIR/module-${MODULE_ID}-$(date +%Y%m%d-%H%M%S).log"

# Run Claude CLI with prompt
echo "📝 Sending prompt to Claude..." | tee -a "$LOG_FILE"

claude --config automation/configs/claude-config.json \
  --prompt-file "$PROMPT_FILE" \
  --output "$RESULT_DIR/module-${MODULE_ID}-output.md" \
  2>&1 | tee -a "$LOG_FILE"

CLAUDE_EXIT_CODE=${PIPESTATUS[0]}

if [ $CLAUDE_EXIT_CODE -ne 0 ]; then
  echo "❌ Claude failed with exit code $CLAUDE_EXIT_CODE" | tee -a "$LOG_FILE"
  exit $CLAUDE_EXIT_CODE
fi

echo "✅ Claude completed implementation" | tee -a "$LOG_FILE"

# Parse output and create files
echo "📦 Extracting code from Claude output..." | tee -a "$LOG_FILE"

python3 automation/scripts/extract-code.py \
  "$RESULT_DIR/module-${MODULE_ID}-output.md" \
  "$MODULE_DIR" \
  "$TEST_DIR" \
  2>&1 | tee -a "$LOG_FILE"

# Build project
echo "🔨 Building module..." | tee -a "$LOG_FILE"
dotnet build "$MODULE_DIR/${MODULE_NAME}.csproj" 2>&1 | tee -a "$LOG_FILE"

BUILD_EXIT_CODE=${PIPESTATUS[0]}

if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo "❌ Build failed!" | tee -a "$LOG_FILE"
  exit $BUILD_EXIT_CODE
fi

# Run tests
echo "🧪 Running tests..." | tee -a "$LOG_FILE"
dotnet test "$TEST_DIR/${MODULE_NAME}.Tests.csproj" \
  --logger "console;verbosity=detailed" \
  2>&1 | tee -a "$LOG_FILE"

TEST_EXIT_CODE=${PIPESTATUS[0]}

if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo "❌ Tests failed!" | tee -a "$LOG_FILE"
  
  # Send test failures back to Claude for fixing
  echo "🔄 Sending test failures to Claude for auto-fix..." | tee -a "$LOG_FILE"
  
  cat > "$RESULT_DIR/fix-prompt-${MODULE_ID}.txt" << EOF
The tests for Module $MODULE_ID ($MODULE_NAME) are failing. Here are the test results:

$(cat "$LOG_FILE" | grep -A 50 "Failed!")

Please analyze the failures and provide corrected implementation.
Remember: DO NOT ASSUME SUCCESS. Fix the code to make tests pass.

Original implementation was:
$(cat "$RESULT_DIR/module-${MODULE_ID}-output.md")
EOF
  
  # Retry with Claude
  claude --config automation/configs/claude-config.json \
    --prompt-file "$RESULT_DIR/fix-prompt-${MODULE_ID}.txt" \
    --output "$RESULT_DIR/module-${MODULE_ID}-fixed.md" \
    2>&1 | tee -a "$LOG_FILE"
  
  # Re-extract and re-test
  python3 automation/scripts/extract-code.py \
    "$RESULT_DIR/module-${MODULE_ID}-fixed.md" \
    "$MODULE_DIR" \
    "$TEST_DIR" \
    2>&1 | tee -a "$LOG_FILE"
  
  dotnet build "$MODULE_DIR/${MODULE_NAME}.csproj" 2>&1 | tee -a "$LOG_FILE"
  dotnet test "$TEST_DIR/${MODULE_NAME}.Tests.csproj" 2>&1 | tee -a "$LOG_FILE"
  
  TEST_EXIT_CODE=${PIPESTATUS[0]}
fi

# Final verification
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ Module $MODULE_ID ($MODULE_NAME) completed successfully!" | tee -a "$LOG_FILE"
  echo "⏰ End time: $(date)" | tee -a "$LOG_FILE"
  
  # Mark as complete
  echo "$MODULE_ID:$MODULE_NAME:$(date +%s):SUCCESS" >> automation/results/completed.txt
  
  exit 0
else
  echo "❌ Module $MODULE_ID ($MODULE_NAME) failed after retry!" | tee -a "$LOG_FILE"
  echo "⏰ End time: $(date)" | tee -a "$LOG_FILE"
  
  # Mark as failed
  echo "$MODULE_ID:$MODULE_NAME:$(date +%s):FAILED" >> automation/results/failed.txt
  
  exit 1
fi
```

---

## Parallel Orchestration Script (Bash)

```bash
#!/bin/bash
# automation/scripts/run-parallel.sh

echo "🚀 Starting parallel module implementation..."

# Load configuration
DEPS_FILE="automation/configs/dependencies.json"
MAX_PARALLEL=$(jq -r '.parallel_limit' automation/configs/claude-config.json)

echo "📊 Maximum parallel jobs: $MAX_PARALLEL"

# Track running processes
declare -A RUNNING_JOBS
declare -A COMPLETED_MODULES

# Function to check if dependencies are met
dependencies_met() {
  local MODULE_ID=$1
  local DEPS=$(jq -r ".modules[] | select(.id==$MODULE_ID) | .dependencies[]" "$DEPS_FILE")
  
  for DEP in $DEPS; do
    if [ -z "${COMPLETED_MODULES[$DEP]}" ]; then
      return 1  # Dependency not met
    fi
  done
  
  return 0  # All dependencies met
}

# Function to start module implementation
start_module() {
  local MODULE_ID=$1
  local MODULE_NAME=$2
  local PROMPT_FILE="automation/prompts/module-$(printf '%02d' $MODULE_ID)-${MODULE_NAME,,}.txt"
  
  echo "🚀 Starting Module $MODULE_ID: $MODULE_NAME"
  
  ./automation/scripts/implement-module.sh "$MODULE_ID" "$MODULE_NAME" "$PROMPT_FILE" &
  
  RUNNING_JOBS[$!]=$MODULE_ID
}

# Main loop
while true; do
  # Check completed jobs
  for PID in "${!RUNNING_JOBS[@]}"; do
    if ! kill -0 $PID 2>/dev/null; then
      MODULE_ID=${RUNNING_JOBS[$PID]}
      wait $PID
      EXIT_CODE=$?
      
      if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Module $MODULE_ID completed successfully"
        COMPLETED_MODULES[$MODULE_ID]=1
      else
        echo "❌ Module $MODULE_ID failed"
      fi
      
      unset RUNNING_JOBS[$PID]
    fi
  done
  
  # Count running jobs
  RUNNING_COUNT=${#RUNNING_JOBS[@]}
  
  # Start new jobs if under limit
  if [ $RUNNING_COUNT -lt $MAX_PARALLEL ]; then
    # Find modules ready to run
    TOTAL_MODULES=$(jq -r '.modules | length' "$DEPS_FILE")
    
    for i in $(seq 1 $TOTAL_MODULES); do
      # Skip if already completed or running
      if [ ! -z "${COMPLETED_MODULES[$i]}" ]; then
        continue
      fi
      
      # Check if currently running
      IS_RUNNING=0
      for PID in "${!RUNNING_JOBS[@]}"; do
        if [ "${RUNNING_JOBS[$PID]}" -eq $i ]; then
          IS_RUNNING=1
          break
        fi
      done
      
      if [ $IS_RUNNING -eq 1 ]; then
        continue
      fi
      
      # Check dependencies
      if dependencies_met $i; then
        MODULE_NAME=$(jq -r ".modules[] | select(.id==$i) | .name" "$DEPS_FILE")
        start_module $i "$MODULE_NAME"
        
        # Increment running count and check limit
        RUNNING_COUNT=$((RUNNING_COUNT + 1))
        if [ $RUNNING_COUNT -ge $MAX_PARALLEL ]; then
          break
        fi
      fi
    done
  fi
  
  # Check if all done
  if [ ${#RUNNING_JOBS[@]} -eq 0 ] && [ ${#COMPLETED_MODULES[@]} -eq $TOTAL_MODULES ]; then
    echo "🎉 All modules completed!"
    break
  fi
  
  # Sleep before next iteration
  sleep 5
done

# Summary
echo ""
echo "📊 Implementation Summary:"
echo "Completed: ${#COMPLETED_MODULES[@]} / $TOTAL_MODULES"

if [ -f automation/results/failed.txt ]; then
  echo "Failed modules:"
  cat automation/results/failed.txt
fi
```

---

## Windows PowerShell Version

```powershell
# automation/scripts/run-parallel.ps1

Write-Host "🚀 Starting parallel module implementation..." -ForegroundColor Green

$ConfigFile = "automation/configs/dependencies.json"
$Config = Get-Content $ConfigFile | ConvertFrom-Json
$MaxParallel = ($Config | Get-Content automation/configs/claude-config.json | ConvertFrom-Json).parallel_limit

Write-Host "📊 Maximum parallel jobs: $MaxParallel" -ForegroundColor Cyan

$RunningJobs = @{}
$CompletedModules = @{}

function Test-DependenciesMet {
    param([int]$ModuleId)
    
    $Module = $Config.modules | Where-Object { $_.id -eq $ModuleId }
    
    foreach ($Dep in $Module.dependencies) {
        if (-not $CompletedModules.ContainsKey($Dep)) {
            return $false
        }
    }
    
    return $true
}

function Start-ModuleImplementation {
    param(
        [int]$ModuleId,
        [string]$ModuleName
    )
    
    $PromptFile = "automation/prompts/module-{0:D2}-{1}.txt" -f $ModuleId, $ModuleName.ToLower()
    
    Write-Host "🚀 Starting Module $ModuleId : $ModuleName" -ForegroundColor Green
    
    $Job = Start-Job -ScriptBlock {
        param($Id, $Name, $Prompt)
        & ./automation/scripts/implement-module.ps1 $Id $Name $Prompt
    } -ArgumentList $ModuleId, $ModuleName, $PromptFile
    
    $RunningJobs[$Job.Id] = $ModuleId
}

# Main loop
while ($true) {
    # Check completed jobs
    $CompletedJobs = Get-Job | Where-Object { $_.State -eq 'Completed' -or $_.State -eq 'Failed' }
    
    foreach ($Job in $CompletedJobs) {
        if ($RunningJobs.ContainsKey($Job.Id)) {
            $ModuleId = $RunningJobs[$Job.Id]
            
            if ($Job.State -eq 'Completed') {
                Write-Host "✅ Module $ModuleId completed" -ForegroundColor Green
                $CompletedModules[$ModuleId] = $true
            } else {
                Write-Host "❌ Module $ModuleId failed" -ForegroundColor Red
            }
            
            Remove-Job -Id $Job.Id
            $RunningJobs.Remove($Job.Id)
        }
    }
    
    # Count running jobs
    $RunningCount = (Get-Job -State Running).Count
    
    # Start new jobs if under limit
    if ($RunningCount -lt $MaxParallel) {
        foreach ($Module in $Config.modules) {
            # Skip completed
            if ($CompletedModules.ContainsKey($Module.id)) {
                continue
            }
            
            # Skip running
            if ($RunningJobs.ContainsValue($Module.id)) {
                continue
            }
            
            # Check dependencies
            if (Test-DependenciesMet -ModuleId $Module.id) {
                Start-ModuleImplementation -ModuleId $Module.id -ModuleName $Module.name
                
                $RunningCount++
                if ($RunningCount -ge $MaxParallel) {
                    break
                }
            }
        }
    }
    
    # Check if all done
    if ((Get-Job -State Running).Count -eq 0 -and $CompletedModules.Count -eq $Config.modules.Count) {
        Write-Host "🎉 All modules completed!" -ForegroundColor Green
        break
    }
    
    Start-Sleep -Seconds 5
}

# Summary
Write-Host "`n📊 Implementation Summary:" -ForegroundColor Cyan
Write-Host "Completed: $($CompletedModules.Count) / $($Config.modules.Count)"
```

---

## Code Extraction Script (Python)

```python
#!/usr/bin/env python3
# automation/scripts/extract-code.py

import sys
import re
import os
from pathlib import Path

def extract_code_blocks(markdown_file):
    """Extract code blocks from Claude's markdown output."""
    with open(markdown_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Pattern: ```language\ncode\n```
    pattern = r'```(\w+)\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)
    
    code_blocks = []
    for language, code in matches:
        # Try to extract filename from comments
        filename_match = re.search(r'//\s*(.+\.cs)', code) or \
                        re.search(r'#\s*(.+\.cs)', code)
        
        if filename_match:
            filename = filename_match.group(1)
        else:
            # Generate filename based on class name
            class_match = re.search(r'class\s+(\w+)', code)
            if class_match:
                filename = f"{class_match.group(1)}.cs"
            else:
                filename = f"Generated_{len(code_blocks)}.cs"
        
        code_blocks.append({
            'language': language,
            'filename': filename,
            'code': code
        })
    
    return code_blocks

def write_code_files(code_blocks, src_dir, test_dir):
    """Write extracted code to appropriate directories."""
    os.makedirs(src_dir, exist_ok=True)
    os.makedirs(test_dir, exist_ok=True)
    
    for block in code_blocks:
        if 'test' in block['filename'].lower():
            target_dir = test_dir
        else:
            target_dir = src_dir
        
        filepath = os.path.join(target_dir, block['filename'])
        
        print(f"Writing {filepath}")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(block['code'])

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: extract-code.py <markdown_file> <src_dir> <test_dir>")
        sys.exit(1)
    
    markdown_file = sys.argv[1]
    src_dir = sys.argv[2]
    test_dir = sys.argv[3]
    
    code_blocks = extract_code_blocks(markdown_file)
    print(f"Extracted {len(code_blocks)} code blocks")
    
    write_code_files(code_blocks, src_dir, test_dir)
    print("✅ Code extraction complete")
```

---

## Dashboard Monitor (Real-time)

```python
#!/usr/bin/env python3
# automation/scripts/dashboard.py

import time
import os
from rich.console import Console
from rich.table import Table
from rich.live import Live
import json

console = Console()

def load_status():
    """Load current implementation status."""
    deps_file = "automation/configs/dependencies.json"
    with open(deps_file) as f:
        config = json.load(f)
    
    completed = set()
    if os.path.exists("automation/results/completed.txt"):
        with open("automation/results/completed.txt") as f:
            for line in f:
                module_id = int(line.split(':')[0])
                completed.add(module_id)
    
    failed = set()
    if os.path.exists("automation/results/failed.txt"):
        with open("automation/results/failed.txt") as f:
            for line in f:
                module_id = int(line.split(':')[0])
                failed.add(module_id)
    
    return config['modules'], completed, failed

def create_table():
    """Create status table."""
    modules, completed, failed = load_status()
    
    table = Table(title="Module Implementation Status")
    table.add_column("ID", style="cyan")
    table.add_column("Name", style="white")
    table.add_column("Status", style="bold")
    table.add_column("Dependencies", style="yellow")
    table.add_column("Duration", style="magenta")
    
    for module in modules:
        mid = module['id']
        
        if mid in completed:
            status = "✅ Complete"
            style = "green"
        elif mid in failed:
            status = "❌ Failed"
            style = "red"
        else:
            # Check if ready to start
            deps_met = all(d in completed for d in module['dependencies'])
            if deps_met:
                status = "🟡 Ready"
                style = "yellow"
            else:
                status = "⬜ Waiting"
                style = "dim"
        
        deps_str = ", ".join(map(str, module['dependencies'])) if module['dependencies'] else "None"
        
        table.add_row(
            str(mid),
            module['name'],
            status,
            deps_str,
            f"{module['duration_hours']}h",
            style=style
        )
    
    return table

def main():
    """Run live dashboard."""
    with Live(create_table(), refresh_per_second=0.5) as live:
        while True:
            time.sleep(2)
            live.update(create_table())

if __name__ == '__main__':
    main()
```

Install dashboard dependencies:
```bash
pip install rich
```

Run dashboard:
```bash
python3 automation/scripts/dashboard.py
```

---

## Complete Automation Workflow

### Step 1: Initial Setup

```bash
# Clone/create project
bash setup-automation.sh

# Set API key
export ANTHROPIC_API_KEY="your-key"

# Or for persistent setup
echo 'export ANTHROPIC_API_KEY="your-key"' >> ~/.bashrc
```

### Step 2: Start Parallel Implementation

```bash
# Start in background with dashboard
./automation/scripts/run-parallel.sh &

# Monitor progress
python3 automation/scripts/dashboard.py
```

### Step 3: Monitor Logs

```bash
# Watch all logs
tail -f automation/logs/*.log

# Watch specific module
tail -f automation/logs/module-01-*.log
```

### Step 4: Results

All results saved to:
- `automation/results/` - Claude outputs
- `automation/logs/` - Execution logs
- `src/` - Generated source code
- `tests/` - Generated tests

---

## Execution Timeline

With 3 parallel jobs:

**Parallel Group 1 (0-16h):**
- Module 1: Platform.Core [16h]

**Parallel Group 2 (16-32h):**
- Module 2: Platform.Data [16h]
- Module 5: Platform.Storage [4h] ✅ Finishes early
- Module 7: Platform.Caching [8h] ✅ Finishes early
- Module 11: Platform.Observability [8h] ✅ Finishes early

**Parallel Group 3 (32-40h):**
- Module 3: Platform.Auth [8h]
- Module 8: Platform.Messaging [8h]
- Module 9: Platform.BackgroundJobs [8h]

... and so on

**Total time: ~120 hours of AI execution (vs 240 hours sequentially)**

---

