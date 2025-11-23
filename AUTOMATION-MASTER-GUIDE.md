# AUTOMATION MASTER GUIDE
## Choose Your Implementation Method

**Purpose:** Get implementation running automatically  
**Platform:** All (CLI, Desktop, Hybrid)

---

## 🎯 Choose Your Path

### Option A: Claude CLI (Full Automation) ⚡
**Best for:** Unattended execution, maximum automation  
**Requires:** Claude CLI, API key, Linux/Mac/Windows  
**Setup time:** 15 minutes  
**Execution:** Fully automated, parallel processing  
**Document:** `AUTOMATION-CLAUDE-CLI.md`

**Pros:**
- ✅ Fully automated (no manual intervention)
- ✅ Parallel execution (3+ modules at once)
- ✅ Auto-retry on failures
- ✅ Complete logging
- ✅ Fastest (50% time savings with parallelism)

**Cons:**
- ❌ Requires API key (costs money)
- ❌ More complex setup
- ❌ Harder to debug if something goes wrong

**Start here:**
```bash
# Install Claude CLI
npm install -g @anthropic-ai/claude-cli

# Set API key
export ANTHROPIC_API_KEY="your-key"

# Run setup
bash automation/scripts/setup-automation.sh

# Start parallel execution
./automation/scripts/run-parallel.sh
```

---

### Option B: Claude Desktop (Semi-Automated) 🖥️
**Best for:** Visual feedback, step-by-step control  
**Requires:** Claude Desktop app, Python  
**Setup time:** 30 minutes  
**Execution:** Semi-automated, you paste prompts  
**Document:** `AUTOMATION-CLAUDE-DESKTOP.md`

**Pros:**
- ✅ Visual interface (see what Claude is doing)
- ✅ Free (no API costs)
- ✅ Easy to debug (see errors immediately)
- ✅ Can review before applying
- ✅ Works on Windows easily

**Cons:**
- ❌ More manual work (copy-paste)
- ❌ Slower (no true parallelism)
- ❌ Requires your attention

**Start here:**
```powershell
# Install Python dependencies
pip install watchdog pyyaml rich

# Setup project structure
.\automation\setup-desktop.ps1

# Start file watcher
python automation\file_watcher.py

# Open Claude Desktop and paste first prompt
# (from automation\tasks\prompt-module-01.md)
```

---

### Option C: Hybrid Approach (Recommended) 🎯
**Best for:** Balance of automation and control  
**Requires:** Claude Desktop + automation scripts  
**Setup time:** 20 minutes  
**Execution:** Automated extraction, manual review  

**How it works:**
1. Paste prompts into Claude Desktop (free)
2. Save Claude's responses to files
3. Scripts auto-extract code and run tests
4. If tests fail, auto-generate fix prompts
5. Repeat until passing

**Start here:**
```powershell
# Setup
.\automation\setup-hybrid.ps1

# For each module:
# 1. Generate prompt
.\automation\run-module.ps1 -ModuleId 1 -ModuleName "Platform.Core"

# 2. Paste into Claude Desktop

# 3. Save response and extract
.\automation\extract-claude-output.ps1 -OutputFile results.md

# 4. Auto-builds and tests
#    If fails, auto-generates fix prompt
```

---

## 📊 Comparison Table

| Feature | Claude CLI | Claude Desktop | Hybrid |
|---------|-----------|----------------|--------|
| **Cost** | $$ (API usage) | Free | Free |
| **Setup Time** | 15 min | 30 min | 20 min |
| **Automation** | 100% | 30% | 70% |
| **Speed** | Fastest | Slowest | Medium |
| **Parallelism** | Yes (3+ modules) | No | Limited |
| **Debugging** | Hard | Easy | Easy |
| **Control** | Low | High | Medium |
| **Recommended For** | CI/CD, Production | Learning, Testing | Development |

---

## 🚀 Quick Start (All Methods)

### Prerequisites (All Methods)

```bash
# 1. Install .NET 10 SDK
winget install Microsoft.DotNet.SDK.10
# or: https://dotnet.microsoft.com/download

# 2. Install Docker Desktop
winget install Docker.DockerDesktop
# or: https://www.docker.com/products/docker-desktop

# 3. Install Python 3.12
winget install Python.Python.3.12
# or: https://www.python.org/downloads/

# 4. Install Node.js (for CLI or file watching)
winget install OpenJS.NodeJS
# or: https://nodejs.org/

# Verify installations
dotnet --version  # Should be 10.x
docker --version
python --version  # Should be 3.12.x
node --version
```

### Method A: Claude CLI Full Auto

```bash
# Install Claude CLI
npm install -g @anthropic-ai/claude-cli

# Get API key from: https://console.anthropic.com/
export ANTHROPIC_API_KEY="sk-ant-..."

# Extract architecture package
unzip senior-living-architecture-v2.zip

# Setup automation
cd automation
bash scripts/setup-automation.sh

# Start parallel execution (runs in background)
./scripts/run-parallel.sh &

# Monitor progress (in new terminal)
python scripts/dashboard.py
```

**Expected output:**
```
🚀 Starting parallel module implementation...
📊 Maximum parallel jobs: 3
🚀 Starting Module 1: Platform.Core
⏰ Estimated completion: 16 hours
✅ Module 1 completed successfully!
🚀 Starting Module 2: Platform.Data
🚀 Starting Module 5: Platform.Storage
🚀 Starting Module 7: Platform.Caching
...
```

---

### Method B: Claude Desktop Semi-Auto

```powershell
# Extract architecture package
Expand-Archive senior-living-architecture-v2.zip

# Install Python dependencies
pip install watchdog pyyaml rich

# Setup project
.\automation\setup-desktop.ps1

# Start file watcher (Terminal 1)
python automation\file_watcher.py

# Generate first prompt (Terminal 2)
.\automation\run-module.ps1 -ModuleId 1 -ModuleName "Platform.Core"

# Open Claude Desktop
# 1. Create new project: "Senior Living Platform"
# 2. Add architecture documents to project
# 3. Paste prompt from: automation\tasks\prompt-module-01.md
# 4. Save Claude's response to: automation\results\module-01-output.md

# Extract code (Terminal 2)
.\automation\extract-claude-output.ps1 -OutputFile automation\results\module-01-output.md

# Tests run automatically via file watcher
# If tests fail, fix prompt auto-generated
```

**Expected output:**
```
🚀 Starting file watcher...
📋 New task detected: automation\tasks\prompt-module-01.md
👉 Please paste this prompt into Claude Desktop
📝 Code modified: src\Platform.Core\ICompanyContext.cs
🔨 Building project...
✅ Build successful
🧪 Running tests...
✅ All tests passed!
🎉 Module 1 completed!
📋 Ready to start Module 2: Platform.Data
```

---

### Method C: Hybrid Approach

```powershell
# Setup (one-time)
.\automation\setup-hybrid.ps1

# For EACH module (14 total):

# Step 1: Generate prompt
.\automation\run-module.ps1 -ModuleId 1 -ModuleName "Platform.Core"
# Output: automation\tasks\prompt-module-01.md

# Step 2: Claude Desktop
# - Open Claude Desktop
# - Paste prompt
# - Save full response as: automation\results\module-01-output.md

# Step 3: Auto-extract and test
.\automation\extract-claude-output.ps1 -OutputFile automation\results\module-01-output.md

# If tests pass → Module complete! ✅
# If tests fail → Fix prompt created automatically
#   - automation\tasks\fix-module-01.md
#   - Paste into Claude, repeat Step 2-3

# Step 4: Repeat for next module
.\automation\run-module.ps1 -ModuleId 2 -ModuleName "Platform.Data"
```

---

## 📋 Module Execution Order

Due to dependencies, modules must be implemented in groups:

**Group 1 (Sequential):**
1. Module 1: Platform.Core [Required first]

**Group 2 (Parallel - after Module 1):**
2. Module 2: Platform.Data
3. Module 5: Platform.Storage
4. Module 7: Platform.Caching
5. Module 11: Platform.Observability

**Group 3 (Parallel - after Module 2):**
6. Module 3: Platform.Auth
7. Module 8: Platform.Messaging
8. Module 9: Platform.BackgroundJobs

**Group 4 (Parallel - after Group 3):**
9. Module 4: Platform.FeatureFlags
10. Module 10: Platform.Integrations

**Group 5 (Sequential - after Group 4):**
11. Module 6: Platform.FrequentAssets
12. Module 12: Platform.Admin
13. Module 13: Platform.Residents
14. Module 14: Platform.Families

**With Claude CLI (3 parallel jobs):**
- Total time: ~120 hours of compute
- Wall time: ~60 hours (2.5 days continuous)

**With Claude Desktop (sequential):**
- Total time: ~180 hours
- Your time: ~40 hours (rest is waiting for Claude)

---

## ✅ Verification Commands

After EACH module completes, run these:

```bash
# 1. Build check
dotnet build src/Platform.ModuleName
# Expected: Build succeeded

# 2. Test check
dotnet test tests/Platform.ModuleName.Tests
# Expected: All tests passed

# 3. Coverage check
dotnet test tests/Platform.ModuleName.Tests --collect:"XPlat Code Coverage"
# Expected: > 80% coverage

# 4. Warning check
dotnet build --warnaserror
# Expected: No warnings

# 5. Tenant isolation check (critical!)
dotnet test --filter "TenantIsolation"
# Expected: All passed (Company A can't see Company B data)
```

**If ANY check fails:**
- Module is NOT complete
- Do NOT proceed to next module
- Fix issues first

---

## 🐛 Troubleshooting

### Claude CLI Issues

**Problem:** API key error
```bash
# Solution: Check API key
echo $ANTHROPIC_API_KEY  # Should output your key
# If empty, set it:
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Problem:** Rate limits
```bash
# Solution: Reduce parallel jobs in config
# Edit: automation/configs/claude-config.json
# Change: "parallel_limit": 3 → "parallel_limit": 1
```

**Problem:** Timeout errors
```bash
# Solution: Increase timeout
# Edit: automation/configs/claude-config.json
# Change: "timeout": 300 → "timeout": 600
```

### Claude Desktop Issues

**Problem:** Can't paste large prompts
```powershell
# Solution: Split prompt into chunks
# Or use file upload feature in Claude Desktop
```

**Problem:** Code extraction fails
```powershell
# Solution: Check file path comments
# Ensure Claude outputs: // src/Platform.Core/ClassName.cs
# Not just: ClassName.cs
```

### Build/Test Issues

**Problem:** Build fails
```bash
# Check .NET version
dotnet --version  # Should be 10.x

# Restore packages
dotnet restore

# Clean and rebuild
dotnet clean
dotnet build
```

**Problem:** Tests fail
```bash
# Check Testcontainers/Docker
docker ps  # Should show containers running

# Increase Docker memory
# Docker Desktop → Settings → Resources → Memory: 8GB

# Run tests with verbose output
dotnet test --verbosity detailed
```

---

## 📈 Progress Tracking

### Option 1: Dashboard (CLI)
```bash
python automation/scripts/dashboard.py
```

### Option 2: Dashboard (PowerShell)
```powershell
.\automation\dashboard.ps1
```

### Option 3: Manual Tracking
```bash
# Check completed modules
ls automation/completed/

# Check logs
tail -f automation/logs/*.log

# Check test results
dotnet test --list-tests
```

---

## 🎓 Learning Path

### If you're new to this approach:

**Week 1:** Module 1 with Claude Desktop (learn TDD)
- See RED → GREEN → REFACTOR in action
- Understand how tests define behavior
- Learn the architecture patterns

**Week 2:** Modules 2-3 with Hybrid approach
- Start using automation scripts
- Get comfortable with workflow
- Build confidence

**Week 3+:** Remaining modules with CLI (if you want)
- Full automation
- Parallel execution
- Minimal manual intervention

---

## 💰 Cost Estimates

### Claude CLI (API usage)
- **Per module:** ~$2-10 (depending on size)
- **Total project:** ~$50-100
- **Benefits:** Saves 100+ hours of your time
- **ROI:** Excellent

### Claude Desktop (Free)
- **Per module:** $0
- **Total project:** $0
- **Trade-off:** More of your time required
- **Good for:** Learning, small projects

---

## 🎯 Recommended Approach

**For this project, I recommend:**

1. **Module 1:** Use Claude Desktop (free, learn workflow)
2. **Modules 2-5:** Use Hybrid (balance automation and control)
3. **Modules 6-14:** Use Claude CLI (automate the rest)

**Why:**
- Learn the patterns first (Module 1)
- Validate approach works (Modules 2-5)
- Scale with automation (Modules 6-14)
- Total cost: ~$30-50
- Time saved: 100+ hours

---

## 📞 Next Steps

### Right Now (5 minutes):
Choose your method and run setup:

```bash
# Method A (CLI)
bash automation/scripts/setup-automation.sh

# Method B (Desktop)  
.\automation\setup-desktop.ps1

# Method C (Hybrid)
.\automation\setup-hybrid.ps1
```

### Within 1 Hour:
Have Module 1 running with your chosen method

### This Week:
Complete Module 1 and validate approach works

### Next 4 Weeks:
Complete all foundation modules (1-7)

### Month 2-3:
Complete all business modules (8-14)

---

## 🏆 Success Criteria

You'll know this is working when:
- ✅ Tests go from RED → GREEN automatically
- ✅ Code coverage stays > 80%
- ✅ No manual coding required (just review)
- ✅ Modules complete in hours, not weeks
- ✅ All tests passing before moving to next module

---

**Choose your path and start now!**

See the specific automation document for your chosen method:
- `AUTOMATION-CLAUDE-CLI.md` - Full automation
- `AUTOMATION-CLAUDE-DESKTOP.md` - Semi-automation  
- This file for hybrid approach

---

END OF AUTOMATION MASTER GUIDE
