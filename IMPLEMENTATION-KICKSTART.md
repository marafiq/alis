# Implementation Kickstart Guide
## Senior Living Platform - Ready-to-Execute Commands

**Purpose:** Copy-paste commands and prompts to start implementation  
**Use:** Give these to AI agents in fresh context windows

---

## STEP 1: Project Setup Commands

### Create Solution Structure

```bash
# Create solution directory
mkdir SeniorLivingPlatform
cd SeniorLivingPlatform

# Create solution file
dotnet new sln -n SeniorLivingPlatform

# Create source directory structure
mkdir -p src/Platform.Core
mkdir -p src/Platform.Data
mkdir -p src/Platform.Auth
mkdir -p src/Platform.FeatureFlags
mkdir -p src/Platform.Storage
mkdir -p src/Platform.FrequentAssets
mkdir -p src/Platform.Caching
mkdir -p src/Platform.Messaging
mkdir -p src/Platform.BackgroundJobs
mkdir -p src/Platform.Integrations
mkdir -p src/Platform.Observability
mkdir -p src/Platform.Admin
mkdir -p src/Platform.Residents
mkdir -p src/Platform.Families
mkdir -p src/Platform.Web
mkdir -p src/Platform.AppHost

# Create test directory structure
mkdir -p tests/Platform.Core.Tests
mkdir -p tests/Platform.Data.Tests
mkdir -p tests/Platform.Auth.Tests
mkdir -p tests/Platform.FeatureFlags.Tests
mkdir -p tests/Platform.Storage.Tests
mkdir -p tests/Platform.FrequentAssets.Tests
mkdir -p tests/Platform.Caching.Tests
mkdir -p tests/Platform.Messaging.Tests
mkdir -p tests/Platform.BackgroundJobs.Tests
mkdir -p tests/Platform.Integrations.Tests
mkdir -p tests/Platform.Observability.Tests
mkdir -p tests/Platform.Admin.Tests
mkdir -p tests/Platform.Residents.Tests
mkdir -p tests/Platform.Families.Tests
mkdir -p tests/Platform.Web.Tests

# Create projects
dotnet new classlib -n Platform.Core -o src/Platform.Core -f net10.0
dotnet new classlib -n Platform.Data -o src/Platform.Data -f net10.0
dotnet new classlib -n Platform.Auth -o src/Platform.Auth -f net10.0
dotnet new classlib -n Platform.FeatureFlags -o src/Platform.FeatureFlags -f net10.0
dotnet new classlib -n Platform.Storage -o src/Platform.Storage -f net10.0
dotnet new classlib -n Platform.FrequentAssets -o src/Platform.FrequentAssets -f net10.0
dotnet new classlib -n Platform.Caching -o src/Platform.Caching -f net10.0
dotnet new classlib -n Platform.Messaging -o src/Platform.Messaging -f net10.0
dotnet new classlib -n Platform.BackgroundJobs -o src/Platform.BackgroundJobs -f net10.0
dotnet new classlib -n Platform.Integrations -o src/Platform.Integrations -f net10.0
dotnet new classlib -n Platform.Observability -o src/Platform.Observability -f net10.0
dotnet new classlib -n Platform.Admin -o src/Platform.Admin -f net10.0
dotnet new classlib -n Platform.Residents -o src/Platform.Residents -f net10.0
dotnet new classlib -n Platform.Families -o src/Platform.Families -f net10.0
dotnet new web -n Platform.Web -o src/Platform.Web -f net10.0
dotnet new aspire-apphost -n Platform.AppHost -o src/Platform.AppHost

# Create test projects
dotnet new xunit -n Platform.Core.Tests -o tests/Platform.Core.Tests -f net10.0
dotnet new xunit -n Platform.Data.Tests -o tests/Platform.Data.Tests -f net10.0
dotnet new xunit -n Platform.Auth.Tests -o tests/Platform.Auth.Tests -f net10.0
dotnet new xunit -n Platform.FeatureFlags.Tests -o tests/Platform.FeatureFlags.Tests -f net10.0
dotnet new xunit -n Platform.Storage.Tests -o tests/Platform.Storage.Tests -f net10.0
dotnet new xunit -n Platform.FrequentAssets.Tests -o tests/Platform.FrequentAssets.Tests -f net10.0
dotnet new xunit -n Platform.Caching.Tests -o tests/Platform.Caching.Tests -f net10.0
dotnet new xunit -n Platform.Messaging.Tests -o tests/Platform.Messaging.Tests -f net10.0
dotnet new xunit -n Platform.BackgroundJobs.Tests -o tests/Platform.BackgroundJobs.Tests -f net10.0
dotnet new xunit -n Platform.Integrations.Tests -o tests/Platform.Integrations.Tests -f net10.0
dotnet new xunit -n Platform.Observability.Tests -o tests/Platform.Observability.Tests -f net10.0
dotnet new xunit -n Platform.Admin.Tests -o tests/Platform.Admin.Tests -f net10.0
dotnet new xunit -n Platform.Residents.Tests -o tests/Platform.Residents.Tests -f net10.0
dotnet new xunit -n Platform.Families.Tests -o tests/Platform.Families.Tests -f net10.0
dotnet new xunit -n Platform.Web.Tests -o tests/Platform.Web.Tests -f net10.0

# Add projects to solution
dotnet sln add src/Platform.Core/Platform.Core.csproj
dotnet sln add src/Platform.Data/Platform.Data.csproj
dotnet sln add src/Platform.Auth/Platform.Auth.csproj
dotnet sln add src/Platform.FeatureFlags/Platform.FeatureFlags.csproj
dotnet sln add src/Platform.Storage/Platform.Storage.csproj
dotnet sln add src/Platform.FrequentAssets/Platform.FrequentAssets.csproj
dotnet sln add src/Platform.Caching/Platform.Caching.csproj
dotnet sln add src/Platform.Messaging/Platform.Messaging.csproj
dotnet sln add src/Platform.BackgroundJobs/Platform.BackgroundJobs.csproj
dotnet sln add src/Platform.Integrations/Platform.Integrations.csproj
dotnet sln add src/Platform.Observability/Platform.Observability.csproj
dotnet sln add src/Platform.Admin/Platform.Admin.csproj
dotnet sln add src/Platform.Residents/Platform.Residents.csproj
dotnet sln add src/Platform.Families/Platform.Families.csproj
dotnet sln add src/Platform.Web/Platform.Web.csproj
dotnet sln add src/Platform.AppHost/Platform.AppHost.csproj

dotnet sln add tests/Platform.Core.Tests/Platform.Core.Tests.csproj
dotnet sln add tests/Platform.Data.Tests/Platform.Data.Tests.csproj
dotnet sln add tests/Platform.Auth.Tests/Platform.Auth.Tests.csproj
dotnet sln add tests/Platform.FeatureFlags.Tests/Platform.FeatureFlags.Tests.csproj
dotnet sln add tests/Platform.Storage.Tests/Platform.Storage.Tests.csproj
dotnet sln add tests/Platform.FrequentAssets.Tests/Platform.FrequentAssets.Tests.csproj
dotnet sln add tests/Platform.Caching.Tests/Platform.Caching.Tests.csproj
dotnet sln add tests/Platform.Messaging.Tests/Platform.Messaging.Tests.csproj
dotnet sln add tests/Platform.BackgroundJobs.Tests/Platform.BackgroundJobs.Tests.csproj
dotnet sln add tests/Platform.Integrations.Tests/Platform.Integrations.Tests.csproj
dotnet sln add tests/Platform.Observability.Tests/Platform.Observability.Tests.csproj
dotnet sln add tests/Platform.Admin.Tests/Platform.Admin.Tests.csproj
dotnet sln add tests/Platform.Residents.Tests/Platform.Residents.Tests.csproj
dotnet sln add tests/Platform.Families.Tests/Platform.Families.Tests.csproj
dotnet sln add tests/Platform.Web.Tests/Platform.Web.Tests.csproj

# Add test project references
dotnet add tests/Platform.Core.Tests reference src/Platform.Core
dotnet add tests/Platform.Data.Tests reference src/Platform.Data
dotnet add tests/Platform.Auth.Tests reference src/Platform.Auth
dotnet add tests/Platform.FeatureFlags.Tests reference src/Platform.FeatureFlags
dotnet add tests/Platform.Storage.Tests reference src/Platform.Storage
dotnet add tests/Platform.FrequentAssets.Tests reference src/Platform.FrequentAssets
dotnet add tests/Platform.Caching.Tests reference src/Platform.Caching
dotnet add tests/Platform.Messaging.Tests reference src/Platform.Messaging
dotnet add tests/Platform.BackgroundJobs.Tests reference src/Platform.BackgroundJobs
dotnet add tests/Platform.Integrations.Tests reference src/Platform.Integrations
dotnet add tests/Platform.Observability.Tests reference src/Platform.Observability
dotnet add tests/Platform.Admin.Tests reference src/Platform.Admin
dotnet add tests/Platform.Residents.Tests reference src/Platform.Residents
dotnet add tests/Platform.Families.Tests reference src/Platform.Families
dotnet add tests/Platform.Web.Tests reference src/Platform.Web

# Add common NuGet packages to test projects
dotnet add tests/Platform.Core.Tests package FluentAssertions
dotnet add tests/Platform.Core.Tests package NSubstitute
dotnet add tests/Platform.Core.Tests package Microsoft.NET.Test.Sdk

# Verify build
dotnet build

echo "✅ Project structure created successfully!"
```

---

## STEP 2: Add Essential NuGet Packages

```bash
# Platform.Core dependencies
dotnet add src/Platform.Core package Microsoft.Extensions.DependencyInjection.Abstractions
dotnet add src/Platform.Core package Microsoft.Extensions.Options
dotnet add src/Platform.Core package Microsoft.Extensions.Logging.Abstractions
dotnet add src/Platform.Core package Microsoft.AspNetCore.Http.Abstractions

# Platform.Data dependencies
dotnet add src/Platform.Data package Microsoft.EntityFrameworkCore
dotnet add src/Platform.Data package Microsoft.EntityFrameworkCore.SqlServer
dotnet add src/Platform.Data package Microsoft.EntityFrameworkCore.Sqlite
dotnet add src/Platform.Data package Microsoft.EntityFrameworkCore.Design
dotnet add src/Platform.Data package EFCore.BulkExtensions

# Test project dependencies (common packages)
for test_project in tests/*/; do
  dotnet add "$test_project" package FluentAssertions
  dotnet add "$test_project" package NSubstitute
  dotnet add "$test_project" package Testcontainers
  dotnet add "$test_project" package Testcontainers.MsSql
  dotnet add "$test_project" package Microsoft.AspNetCore.Mvc.Testing
done

echo "✅ Essential packages added!"
```

---

## STEP 3: AI Agent Prompt for Module 1 Implementation

Copy this ENTIRE prompt and paste it into a NEW chat with Claude (or another AI):

```
I need you to implement Module 1 (Platform.Core - Context Abstractions) for a Senior Living Platform using .NET 10, following strict TDD practices.

CRITICAL RULES:
1. DO NOT ASSUME SUCCESS - RELY ON PASSED TESTS
2. Write failing tests FIRST (RED)
3. Implement minimum code to pass (GREEN)
4. Refactor while keeping tests green (REFACTOR)
5. Use real dependencies via Testcontainers for integration tests
6. Do NOT mark complete until ALL tests pass (100%)

CONTEXT:
- Project root: SeniorLivingPlatform/
- Module location: src/Platform.Core/
- Test location: tests/Platform.Core.Tests/
- .NET 10, C# latest
- Testing: xUnit, FluentAssertions, NSubstitute
- No external dependencies for this module

MODULE SPECIFICATION:
[Attach or paste MODULE-01-PLATFORM-CORE.md content]

TASK:
Implement the following in TDD order:

1. UC1.1: Resolve Company from Subdomain
   - Write failing unit test for subdomain resolution
   - Implement ICompanyContext interface
   - Implement CompanyContextMiddleware
   - Make test pass
   - Write integration test with TestServer
   - Verify both tests pass

2. UC1.2: Resolve Company from JWT Claims
   - Write failing unit test for claims resolution
   - Extend middleware to handle JWT claims
   - Make test pass
   - Write integration test with mock JWT
   - Verify both tests pass

3. UC1.3: Switch Facility
   - Write failing unit test for facility switching
   - Implement IFacilityContext interface
   - Implement SwitchFacility method
   - Make test pass
   - Write integration test with session storage
   - Verify both tests pass

4. UC1.4: All Facilities Mode
   - Write failing unit test for "All Facilities" mode
   - Extend IFacilityContext for nullable ActiveFacilityId
   - Make test pass
   - Write integration test with multi-facility query
   - Verify both tests pass

5. UC1.5: Storage Path Prefixing
   - Write failing unit test for path construction
   - Implement IStorageContext interface
   - Implement GetBlobPath method
   - Make test pass
   - Write integration test (path sanitization)
   - Verify both tests pass

6. UC1.6: Cache Key Prefixing
   - Write failing unit test for key formatting
   - Implement ICacheContext interface
   - Implement GetCacheKey method
   - Make test pass
   - Write integration test (verify no collisions)
   - Verify both tests pass

7. UC1.7: Message Tenant Tagging
   - Write failing unit test for envelope structure
   - Implement IMessagingContext interface
   - Implement message envelope pattern
   - Make test pass
   - Write integration test (publish/consume)
   - Verify both tests pass

8. UC1.8: Observability Enrichment
   - Write failing unit test for log enrichment
   - Implement IObservabilityContext interface
   - Implement trace/log enrichment
   - Make test pass
   - Write integration test (verify tags present)
   - Verify both tests pass

WORKFLOW FOR EACH USE CASE:
1. Create test file (e.g., CompanyContextTests.cs)
2. Write [Fact] test method that FAILS
3. Run: dotnet test --filter "TestMethodName"
4. Verify test FAILS (RED)
5. Implement minimum code in src/Platform.Core/
6. Run: dotnet test --filter "TestMethodName"
7. Verify test PASSES (GREEN)
8. Refactor code if needed
9. Run: dotnet test --filter "TestMethodName"
10. Verify test still PASSES (REFACTOR)
11. Write integration test
12. Run integration test, verify PASSES
13. Move to next use case

DELIVERABLES:
- All 8 context interfaces (ICompanyContext, IFacilityContext, etc.)
- All middleware implementations
- All unit tests (8 use cases, multiple tests each)
- All integration tests
- README.md with usage examples
- XML comments on all public APIs

COMPLETION CRITERIA:
- [ ] Run: dotnet test --filter "Module=PlatformCore"
- [ ] Verify: All tests passing (100%)
- [ ] Run: dotnet test --filter "Module=PlatformCore&Category=Integration"
- [ ] Verify: All integration tests passing (100%)
- [ ] Check: Code coverage > 80%
- [ ] Verify: No compiler warnings
- [ ] Verify: README.md updated

START WITH UC1.1 and show me:
1. The failing test code
2. The implementation code
3. The test results (showing it passes)

Then continue to UC1.2, UC1.3, etc.

Remember: DO NOT ASSUME SUCCESS. Show me test results at each step.
```

---

## STEP 4: Verification Commands

After AI implements Module 1, run these commands to verify:

```bash
# Build entire solution
dotnet build

# Run all Module 1 tests
dotnet test --filter "Module=PlatformCore"

# Run only unit tests (fast)
dotnet test --filter "Module=PlatformCore&Category=Unit"

# Run only integration tests (with Docker)
dotnet test --filter "Module=PlatformCore&Category=Integration"

# Generate code coverage report
dotnet test --collect:"XPlat Code Coverage"

# Check for compiler warnings
dotnet build --warnaserror

# Verify test count
dotnet test --filter "Module=PlatformCore" --list-tests
```

Expected output:
```
✅ All tests passing (100%)
✅ No compiler warnings
✅ Code coverage > 80%
✅ 8 use cases × ~3 tests each = ~24 tests minimum
```

---

## STEP 5: AI Agent Prompt Template for Subsequent Modules

For Module 2, 3, 4, etc., use this template:

```
I need you to implement Module [NUMBER] ([MODULE_NAME]) for the Senior Living Platform using .NET 10.

CRITICAL RULES:
1. DO NOT ASSUME SUCCESS - RELY ON PASSED TESTS
2. Write failing tests FIRST (RED → GREEN → REFACTOR)
3. Use Testcontainers for real dependencies in integration tests
4. Do NOT mark complete until ALL tests pass (100%)

PROJECT STRUCTURE:
- Root: SeniorLivingPlatform/
- Module: src/Platform.[ModuleName]/
- Tests: tests/Platform.[ModuleName].Tests/

DEPENDENCIES:
[List completed modules this one depends on]

MODULE SPECIFICATION:
[Attach or paste the module spec from AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md or PART2.md]

REQUIRED NUGET PACKAGES:
[List any additional packages needed for this module]

TASK:
Implement all use cases in TDD order:
- UC[X].1: [First use case]
- UC[X].2: [Second use case]
- ... etc

Follow the same TDD workflow:
1. Write failing test
2. Verify it fails (RED)
3. Implement minimum code
4. Verify it passes (GREEN)
5. Refactor if needed
6. Write integration test
7. Verify integration test passes

SHOW ME:
- Test code (failing first, then passing)
- Implementation code
- Test results at each step

DO NOT PROCEED TO NEXT USE CASE UNTIL CURRENT ONE HAS ALL TESTS PASSING.
```

---

## STEP 6: Progress Tracking Commands

Create this file to track progress:

```bash
# Create progress tracker
cat > PROGRESS.md << 'EOF'
# Implementation Progress

## Modules Status

| Module | Status | Tests Passing | Coverage | Completed Date |
|--------|--------|---------------|----------|----------------|
| 1. Platform.Core | ⬜ Not Started | 0/24 | 0% | - |
| 2. Platform.Data | ⬜ Not Started | 0/30 | 0% | - |
| 3. Platform.Auth | ⬜ Not Started | 0/30 | 0% | - |
| 4. Platform.FeatureFlags | ⬜ Not Started | 0/30 | 0% | - |
| 5. Platform.Storage | ⬜ Not Started | 0/30 | 0% | - |
| 6. Platform.FrequentAssets | ⬜ Not Started | 0/30 | 0% | - |
| 7. Platform.Caching | ⬜ Not Started | 0/30 | 0% | - |
| 8. Platform.Messaging | ⬜ Not Started | 0/30 | 0% | - |
| 9. Platform.BackgroundJobs | ⬜ Not Started | 0/30 | 0% | - |
| 10. Platform.Integrations | ⬜ Not Started | 0/30 | 0% | - |
| 11. Platform.Observability | ⬜ Not Started | 0/30 | 0% | - |
| 12. Platform.Admin | ⬜ Not Started | 0/45 | 0% | - |
| 13. Platform.Residents | ⬜ Not Started | 0/75 | 0% | - |
| 14. Platform.Families | ⬜ Not Started | 0/45 | 0% | - |

Legend:
- ⬜ Not Started
- 🟨 In Progress
- 🟩 Complete (all tests passing)

## Current Sprint

**Week:** 1  
**Focus:** Module 1 - Platform.Core  
**Target:** Complete UC1.1-UC1.8  
**Status:** Not Started

## Blockers

None

## Notes

[Add notes here as you progress]
EOF

echo "✅ Progress tracker created!"
```

---

## STEP 7: Docker Compose for Local Development (Optional)

If not using Aspire initially, create docker-compose.yml:

```yaml
version: '3.8'

services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "YourStrong@Passw0rd"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - "10000:10000"
      - "10001:10001"
      - "10002:10002"
    volumes:
      - azurite_data:/data

volumes:
  sqlserver_data:
  redis_data:
  rabbitmq_data:
  azurite_data:
```

Start dependencies:
```bash
docker-compose up -d
```

---

## STEP 8: Quick Validation Script

Create this script to validate each module:

```bash
#!/bin/bash
# validate-module.sh

MODULE_NAME=$1

if [ -z "$MODULE_NAME" ]; then
  echo "Usage: ./validate-module.sh Platform.Core"
  exit 1
fi

echo "🔍 Validating $MODULE_NAME..."

# Build
echo "📦 Building..."
dotnet build src/$MODULE_NAME/$MODULE_NAME.csproj
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# Run tests
echo "🧪 Running tests..."
dotnet test tests/$MODULE_NAME.Tests/$MODULE_NAME.Tests.csproj
if [ $? -ne 0 ]; then
  echo "❌ Tests failed!"
  exit 1
fi

# Check coverage
echo "📊 Checking coverage..."
dotnet test tests/$MODULE_NAME.Tests/$MODULE_NAME.Tests.csproj --collect:"XPlat Code Coverage"

# Check for warnings
echo "⚠️ Checking for warnings..."
dotnet build src/$MODULE_NAME/$MODULE_NAME.csproj --warnaserror
if [ $? -ne 0 ]; then
  echo "⚠️ Warnings found (should be resolved)"
fi

echo "✅ Validation complete for $MODULE_NAME!"
```

Make executable:
```bash
chmod +x validate-module.sh
```

Use:
```bash
./validate-module.sh Platform.Core
```

---

## STEP 9: Next Steps After Module 1

Once Module 1 is complete (all tests passing):

1. **Update PROGRESS.md**
   ```
   | 1. Platform.Core | 🟩 Complete | 24/24 | 85% | 2025-11-23 |
   ```

2. **Create Module 2 prompt** using template from Step 5

3. **Add Module 1 as dependency** in Module 2 project:
   ```bash
   dotnet add src/Platform.Data reference src/Platform.Core
   dotnet add tests/Platform.Data.Tests reference tests/Platform.Core.Tests
   ```

4. **Start Module 2 implementation** with new AI chat

---

## QUICK REFERENCE: Essential Commands

```bash
# Create new module
dotnet new classlib -n Platform.NewModule -o src/Platform.NewModule -f net10.0

# Create new test project
dotnet new xunit -n Platform.NewModule.Tests -o tests/Platform.NewModule.Tests -f net10.0

# Add project to solution
dotnet sln add src/Platform.NewModule/Platform.NewModule.csproj

# Add project reference
dotnet add src/ProjectA reference src/ProjectB

# Add NuGet package
dotnet add package PackageName

# Build all
dotnet build

# Test all
dotnet test

# Test specific module
dotnet test --filter "Module=PlatformCore"

# Test with coverage
dotnet test --collect:"XPlat Code Coverage"

# Restore packages
dotnet restore

# Clean build artifacts
dotnet clean
```

---

## TROUBLESHOOTING

**Issue: Tests fail to discover**
```bash
dotnet test --list-tests
# If empty, check test project has:
# - xUnit package
# - Test SDK package
# - Reference to source project
```

**Issue: Testcontainers timeout**
```bash
# Check Docker is running
docker ps

# Check Docker resources (increase memory if needed)
# Docker Desktop → Settings → Resources → Memory: 4GB minimum
```

**Issue: Build errors after adding packages**
```bash
dotnet restore
dotnet clean
dotnet build
```

---

## SUCCESS CRITERIA CHECKLIST

Before moving to next module:

- [ ] All use case tests written and passing
- [ ] All integration tests passing
- [ ] Code coverage > 80%
- [ ] No compiler warnings
- [ ] README.md updated with usage examples
- [ ] XML comments on all public APIs
- [ ] All files committed to git
- [ ] PROGRESS.md updated

---

**READY TO START!**

1. Run Step 1 commands to create project structure
2. Run Step 2 commands to add packages
3. Copy Step 3 prompt and paste in NEW chat with AI
4. Let AI implement Module 1 using TDD
5. Run Step 4 verification commands
6. Celebrate when all tests pass! 🎉
7. Move to Module 2

Remember: **Don't assume success. Rely on passed tests.**
