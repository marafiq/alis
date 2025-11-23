# Claude Desktop Automation (Windows/Mac)
## File-Based Automation with Projects Feature

**Purpose:** Automate implementation using Claude Desktop's Projects feature  
**Platform:** Windows, macOS (Claude Desktop app)

---

## How This Works

Claude Desktop has a **Projects** feature that allows you to:
1. Create a project with files as context
2. Chat within that project with all files available
3. Use MCP (Model Context Protocol) for file operations

We'll use this with file watchers to create an automated workflow.

---

## Architecture

```
┌─────────────────────┐
│  Claude Desktop     │
│  (Projects)         │
│                     │
│  ┌──────────────┐   │
│  │ Module Specs │   │     ┌──────────────┐
│  │ as Context   │◄──┼─────┤ File Watcher │
│  └──────────────┘   │     └──────────────┘
│         │           │              │
│         ▼           │              ▼
│  ┌──────────────┐   │     ┌──────────────┐
│  │ AI Generates │   │     │ Auto-detect  │
│  │ Code + Tests │   │     │ New Tasks    │
│  └──────────────┘   │     └──────────────┘
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  File System        │
│  src/               │
│  tests/             │
│  results/           │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│  Auto Build & Test  │
│  (dotnet watch)     │
└─────────────────────┘
```

---

## Setup Instructions

### Step 1: Install Prerequisites

```powershell
# Install Node.js (for file watcher)
winget install OpenJS.NodeJS

# Install .NET 10 SDK
winget install Microsoft.DotNet.SDK.10

# Install Python (for automation scripts)
winget install Python.Python.3.12

# Install watchdog for file monitoring
pip install watchdog pyyaml rich
```

### Step 2: Create Project Structure

```powershell
# Create automation directory
New-Item -ItemType Directory -Path "automation" -Force
New-Item -ItemType Directory -Path "automation\tasks" -Force
New-Item -ItemType Directory -Path "automation\completed" -Force
New-Item -ItemType Directory -Path "automation\logs" -Force
New-Item -ItemType Directory -Path "automation\prompts" -Force

# Create task template
@"
---
module_id: 1
module_name: Platform.Core
status: pending
created: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
dependencies: []
---

# Task: Implement Module 1 - Platform.Core

## Context
[Module specification will be loaded from architecture docs]

## Instructions
1. Read module specification
2. Implement using TDD (RED → GREEN → REFACTOR)
3. Create all 8 context interfaces
4. Write all use case tests
5. Ensure all tests pass

## Output Location
- Source: src/Platform.Core/
- Tests: tests/Platform.Core.Tests/

## Completion Criteria
- [ ] All tests passing (100%)
- [ ] Code coverage > 80%
- [ ] No compiler warnings
- [ ] Documentation updated
"@ | Out-File -FilePath "automation\tasks\module-01-core.md" -Encoding UTF8
```

### Step 3: Create Claude Desktop Project

1. **Open Claude Desktop**

2. **Create New Project:**
   - Click "+" to create new project
   - Name: "Senior Living Platform - Module Implementation"

3. **Add Architecture Documents to Project:**
   - Click "Add files" in project
   - Add all files from `senior-living-architecture-v2.zip`:
     - `README.md`
     - `AI-IMPLEMENTATION-GUIDE.md`
     - `MODULE-01-PLATFORM-CORE.md`
     - All specification documents

4. **Enable MCP File Access:**
   - Settings → Developer → Enable MCP servers
   - Add file system access to project directory

---

## File Watcher Automation (Python)

```python
#!/usr/bin/env python3
# automation/file_watcher.py

import time
import os
import sys
import yaml
import subprocess
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from rich.console import Console

console = Console()

class TaskHandler(FileSystemEventHandler):
    def __init__(self, tasks_dir, completed_dir, src_dir, test_dir):
        self.tasks_dir = Path(tasks_dir)
        self.completed_dir = Path(completed_dir)
        self.src_dir = Path(src_dir)
        self.test_dir = Path(test_dir)
        
    def on_created(self, event):
        if event.is_directory:
            return
        
        # Check if it's a task file
        if event.src_path.endswith('.md') and 'module-' in event.src_path:
            console.print(f"[green]📋 New task detected:[/green] {event.src_path}")
            self.process_task(event.src_path)
    
    def on_modified(self, event):
        if event.is_directory:
            return
        
        # Check if it's a code file that was generated
        if event.src_path.endswith('.cs'):
            console.print(f"[yellow]📝 Code modified:[/yellow] {event.src_path}")
            self.trigger_build_and_test()
    
    def process_task(self, task_file):
        """Process a task file."""
        with open(task_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Parse frontmatter
        parts = content.split('---')
        if len(parts) >= 3:
            metadata = yaml.safe_load(parts[1])
            
            module_id = metadata.get('module_id')
            module_name = metadata.get('module_name')
            status = metadata.get('status', 'pending')
            
            if status == 'pending':
                console.print(f"[cyan]🚀 Starting module {module_id}: {module_name}[/cyan]")
                
                # Create prompt for Claude
                prompt_file = self.create_prompt(metadata, parts[2])
                
                # Open in Claude Desktop (manual for now, but can be automated with AppleScript/COM)
                console.print(f"[yellow]👉 Please paste this prompt into Claude Desktop project:[/yellow]")
                console.print(f"[bold]File: {prompt_file}[/bold]")
                
                # Update status
                metadata['status'] = 'in_progress'
                self.update_task_status(task_file, metadata)
    
    def create_prompt(self, metadata, task_content):
        """Create detailed prompt for Claude."""
        module_id = metadata['module_id']
        module_name = metadata['module_name']
        
        prompt_file = self.tasks_dir / f"prompt-module-{module_id:02d}.md"
        
        with open(prompt_file, 'w', encoding='utf-8') as f:
            f.write(f"""# Implementation Request: Module {module_id} - {module_name}

## Critical Rules
1. DO NOT ASSUME SUCCESS - RELY ON PASSED TESTS
2. Write failing tests FIRST (RED)
3. Implement minimum code to pass (GREEN)
4. Refactor while keeping tests green (REFACTOR)

## Task
{task_content}

## Output Format
Please provide all code in this format:

```csharp
// src/{module_name}/ClassName.cs
[code here]
```

```csharp
// tests/{module_name}.Tests/ClassNameTests.cs
[test code here]
```

After each use case implementation, provide:
1. The test code that was written
2. The implementation code
3. Confirmation that tests pass

## Important
Save all code blocks I can extract and build automatically.
Use comments to indicate file paths.
""")
        
        return prompt_file
    
    def trigger_build_and_test(self):
        """Trigger automatic build and test."""
        console.print("[cyan]🔨 Building project...[/cyan]")
        
        result = subprocess.run(
            ['dotnet', 'build'],
            capture_output=True,
            text=True,
            cwd=self.src_dir.parent
        )
        
        if result.returncode == 0:
            console.print("[green]✅ Build successful[/green]")
            
            # Run tests
            console.print("[cyan]🧪 Running tests...[/cyan]")
            test_result = subprocess.run(
                ['dotnet', 'test', '--verbosity', 'normal'],
                capture_output=True,
                text=True,
                cwd=self.test_dir.parent
            )
            
            if test_result.returncode == 0:
                console.print("[green]✅ All tests passed![/green]")
                # Mark task as completed
                self.mark_complete()
            else:
                console.print("[red]❌ Tests failed[/red]")
                console.print(test_result.stdout)
        else:
            console.print("[red]❌ Build failed[/red]")
            console.print(result.stdout)
    
    def update_task_status(self, task_file, metadata):
        """Update task file with new status."""
        # Re-read file to preserve content
        with open(task_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        parts = content.split('---')
        
        # Update metadata
        new_metadata = yaml.dump(metadata, default_flow_style=False)
        
        # Write back
        with open(task_file, 'w', encoding='utf-8') as f:
            f.write('---\n')
            f.write(new_metadata)
            f.write('---\n')
            f.write(parts[2] if len(parts) > 2 else '')
    
    def mark_complete(self):
        """Mark current task as complete."""
        # Find the in-progress task
        for task_file in self.tasks_dir.glob('module-*.md'):
            with open(task_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            parts = content.split('---')
            if len(parts) >= 2:
                metadata = yaml.safe_load(parts[1])
                
                if metadata.get('status') == 'in_progress':
                    # Move to completed
                    import shutil
                    dest = self.completed_dir / task_file.name
                    shutil.move(str(task_file), str(dest))
                    
                    console.print(f"[green]🎉 Module {metadata['module_id']} completed![/green]")
                    
                    # Check for next task
                    self.trigger_next_task(metadata['module_id'])
                    break
    
    def trigger_next_task(self, completed_module_id):
        """Trigger next task if dependencies are met."""
        # Load dependency graph
        import json
        deps_file = Path('automation/configs/dependencies.json')
        
        if deps_file.exists():
            with open(deps_file) as f:
                config = json.load(f)
            
            # Find modules that depend on completed one
            for module in config['modules']:
                if completed_module_id + 1 == module['id']:
                    # Check if all dependencies completed
                    deps = module['dependencies']
                    
                    all_completed = True
                    for dep in deps:
                        dep_file = self.completed_dir / f"module-{dep:02d}-*.md"
                        if not list(self.completed_dir.glob(f"module-{dep:02d}-*.md")):
                            all_completed = False
                            break
                    
                    if all_completed:
                        console.print(f"[cyan]📋 Ready to start Module {module['id']}: {module['name']}[/cyan]")
                        # Create task file would go here

def main():
    tasks_dir = "automation/tasks"
    completed_dir = "automation/completed"
    src_dir = "src"
    test_dir = "tests"
    
    # Create directories
    Path(tasks_dir).mkdir(parents=True, exist_ok=True)
    Path(completed_dir).mkdir(parents=True, exist_ok=True)
    
    console.print("[bold green]🚀 Starting file watcher...[/bold green]")
    console.print(f"Monitoring: {tasks_dir}")
    
    event_handler = TaskHandler(tasks_dir, completed_dir, src_dir, test_dir)
    observer = Observer()
    observer.schedule(event_handler, tasks_dir, recursive=False)
    observer.schedule(event_handler, src_dir, recursive=True)
    observer.schedule(event_handler, test_dir, recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    
    observer.join()

if __name__ == '__main__':
    main()
```

---

## Workflow Steps

### 1. Start File Watcher

```powershell
# In one terminal
python automation\file_watcher.py
```

### 2. Start Auto-Build Watcher

```powershell
# In another terminal
cd src\Platform.Core
dotnet watch build

# In third terminal
cd tests\Platform.Core.Tests
dotnet watch test
```

### 3. Work in Claude Desktop

1. **Open Claude Desktop project**
2. **Paste prompt** from `automation/tasks/prompt-module-01.md`
3. **Claude generates code** with file path comments
4. **You copy-paste** code blocks into appropriate files
5. **File watcher detects changes** and triggers build/test
6. **If tests fail**, paste errors back to Claude for fixes
7. **Repeat until all tests pass**
8. **File watcher marks module complete** and triggers next

---

## Semi-Automated Workflow (Using Claude Desktop + Scripts)

```powershell
# automation/run-module.ps1

param(
    [int]$ModuleId,
    [string]$ModuleName
)

Write-Host "🚀 Starting Module $ModuleId : $ModuleName" -ForegroundColor Green

# Create workspace
$ModuleDir = "src\$ModuleName"
$TestDir = "tests\$ModuleName.Tests"

New-Item -ItemType Directory -Path $ModuleDir -Force | Out-Null
New-Item -ItemType Directory -Path $TestDir -Force | Out-Null

# Generate prompt
$PromptFile = "automation\tasks\prompt-module-$($ModuleId.ToString('00')).md"

# Load module spec
$SpecFile = "MODULE-$($ModuleId.ToString('00'))-$($ModuleName.Replace('.', '-').ToUpper()).md"

if (Test-Path $SpecFile) {
    $Spec = Get-Content $SpecFile -Raw
} else {
    # Extract from main specs
    $Spec = "See architecture documents for Module $ModuleId specification"
}

# Create prompt
@"
# Implement Module $ModuleId - $ModuleName

## CRITICAL RULES
1. DO NOT ASSUME SUCCESS - RELY ON PASSED TESTS
2. Write failing tests FIRST (RED)
3. Implement minimum code to pass (GREEN)
4. All code must have file path comments

## Specification
$Spec

## Output Format
Provide code with file paths:

``````csharp
// $ModuleDir/FileName.cs
code here
``````

## Start with UC$ModuleId.1
Show me failing test, then implementation, then passing test.
"@ | Out-File $PromptFile -Encoding UTF8

Write-Host "✅ Prompt created: $PromptFile" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Open Claude Desktop" -ForegroundColor Yellow
Write-Host "2. Paste content from: $PromptFile" -ForegroundColor Yellow
Write-Host "3. Copy generated code to files" -ForegroundColor Yellow
Write-Host "4. Run: dotnet test $TestDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or use code extractor:" -ForegroundColor Cyan
Write-Host ".\automation\extract-claude-output.ps1 -OutputFile results.md" -ForegroundColor Yellow
```

---

## Code Extractor (PowerShell)

```powershell
# automation/extract-claude-output.ps1

param(
    [string]$OutputFile
)

if (-not (Test-Path $OutputFile)) {
    Write-Error "Output file not found: $OutputFile"
    exit 1
}

$Content = Get-Content $OutputFile -Raw

# Extract code blocks with file paths
$Pattern = '```csharp\s*\n//\s*(.+\.cs)\s*\n(.*?)```'
$Matches = [regex]::Matches($Content, $Pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)

foreach ($Match in $Matches) {
    $FilePath = $Match.Groups[1].Value.Trim()
    $Code = $Match.Groups[2].Value.Trim()
    
    # Create directory if needed
    $Dir = Split-Path $FilePath -Parent
    if ($Dir -and -not (Test-Path $Dir)) {
        New-Item -ItemType Directory -Path $Dir -Force | Out-Null
    }
    
    # Write file
    Write-Host "Writing: $FilePath" -ForegroundColor Green
    $Code | Out-File $FilePath -Encoding UTF8
}

Write-Host ""
Write-Host "✅ Code extraction complete" -ForegroundColor Green
Write-Host "Building..." -ForegroundColor Cyan

dotnet build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
    Write-Host "Running tests..." -ForegroundColor Cyan
    
    dotnet test
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All tests passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ Tests failed" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
}
```

---

## Complete Workflow Example

```powershell
# 1. Start file watcher (Terminal 1)
python automation\file_watcher.py

# 2. Generate first module prompt (Terminal 2)
.\automation\run-module.ps1 -ModuleId 1 -ModuleName "Platform.Core"

# 3. Open Claude Desktop
#    - Paste prompt from automation\tasks\prompt-module-01.md
#    - Let Claude generate code

# 4. Save Claude's response to file
#    - Copy entire response to automation\results\module-01-output.md

# 5. Extract code (Terminal 2)
.\automation\extract-claude-output.ps1 -OutputFile automation\results\module-01-output.md

# 6. If tests fail, create fix prompt
if ($LASTEXITCODE -ne 0) {
    $Errors = dotnet test 2>&1 | Out-String
    
    @"
The tests failed. Here are the errors:

$Errors

Please fix the implementation. Remember: DO NOT ASSUME SUCCESS.

Original code was in: automation\results\module-01-output.md
"@ | Out-File automation\tasks\fix-module-01.md
    
    Write-Host "Paste fix prompt to Claude from: automation\tasks\fix-module-01.md"
}
```

---

## Dashboard (PowerShell)

```powershell
# automation/dashboard.ps1

while ($true) {
    Clear-Host
    
    Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   Senior Living Platform - Implementation      ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    
    # Count modules
    $Completed = (Get-ChildItem automation\completed -Filter "module-*.md" -ErrorAction SilentlyContinue).Count
    $InProgress = (Get-ChildItem automation\tasks -Filter "module-*.md" | Where-Object {
        (Get-Content $_.FullName -Raw) -match 'status:\s*in_progress'
    }).Count
    $Pending = (Get-ChildItem automation\tasks -Filter "module-*.md" | Where-Object {
        (Get-Content $_.FullName -Raw) -match 'status:\s*pending'
    }).Count
    
    Write-Host "📊 Status:" -ForegroundColor Green
    Write-Host "   ✅ Completed: $Completed / 14" -ForegroundColor Green
    Write-Host "   🟡 In Progress: $InProgress" -ForegroundColor Yellow
    Write-Host "   ⬜ Pending: $Pending" -ForegroundColor Gray
    Write-Host ""
    
    # Show recent logs
    $RecentLogs = Get-ChildItem automation\logs -Filter "*.log" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 5
    
    if ($RecentLogs) {
        Write-Host "📋 Recent Activity:" -ForegroundColor Cyan
        foreach ($Log in $RecentLogs) {
            $LastLine = Get-Content $Log.FullName -Tail 1
            Write-Host "   $($Log.BaseName): $LastLine" -ForegroundColor White
        }
    }
    
    Write-Host ""
    Write-Host "Press Ctrl+C to exit" -ForegroundColor DarkGray
    
    Start-Sleep -Seconds 5
}
```

Run dashboard:
```powershell
.\automation\dashboard.ps1
```

---

## Advantages of This Approach

✅ **Uses Claude Desktop** (no CLI needed)  
✅ **File-based** (easy to track)  
✅ **Semi-automated** (Claude generates, scripts extract)  
✅ **Real-time feedback** (watch build/test)  
✅ **Works on Windows** (PowerShell native)  
✅ **Parallel possible** (open multiple Claude chats)  
✅ **Progress tracking** (file system based)

---

## Timeline

- **Setup:** 30 minutes
- **Module 1:** 2-4 hours (with Claude Desktop)
- **Per module:** 1-8 hours (depending on size)
- **Total:** 80-150 hours (vs 240 hours manual)

---

**Ready to start? Run setup and begin with Module 1!**
