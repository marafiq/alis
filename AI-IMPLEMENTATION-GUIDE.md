# AI Implementation Guide - Modular Approach
## Senior Living Platform .NET 10 Migration

**Version:** 2.0  
**Purpose:** Context-window optimized guide for AI agents  
**Author:** Senior Principal Software Architect

---

## Critical Rules for AI Implementation

### RULE 1: DO NOT ASSUME SUCCESS - RELY ON PASSED TESTS

**This is non-negotiable.** Every feature must:
1. Have failing tests written FIRST (RED)
2. Implement minimum code to pass tests (GREEN)
3. Refactor while keeping tests green (REFACTOR)
4. Run integration tests with real dependencies (Docker via Testcontainers)
5. Verify 100% of tests pass before marking complete

**If tests fail:**
- Implementation is wrong (not the test)
- Debug and fix implementation
- Do NOT modify tests to make them pass
- Do NOT skip failing tests

**If integration tests fail:**
- Infrastructure setup is wrong
- Docker containers not running
- Connection strings incorrect
- Fix infrastructure, then re-run tests

### RULE 2: .NET 10 & EF Core 10 Skills Are Mandatory

Every AI agent must understand and apply these .NET 10 skills:

**Core .NET 10:**
- **Async/Await:** Never block with `.Result` or `.Wait()` - async all the way
- **Dependency Injection:** Use constructor injection, understand service lifetimes
- **Options Pattern:** Use `IOptions<T>` for configuration, never hardcode
- **Minimal APIs:** For simple HTTP endpoints (alternative to controllers)
- **Native AOT:** Avoid reflection where possible (source generators preferred)

**EF Core 10:**
- **Global Query Filters:** Automatic tenant filtering on ALL queries
- **Interceptors:** SaveChanges interceptor for audit fields
- **Migrations:** Code-first, idempotent, separate per DbContext
- **Bulk Operations:** Use `EF.BulkExtensions` for > 100 records
- **No N+1 Queries:** Use `.Include()` or `.Select()` projection
- **Compiled Queries:** Cache frequently-used queries for performance

**Aspire Orchestration:**
- **Service Discovery:** Reference dependencies by name (e.g., `builder.AddRedis("redis")`)
- **Container Management:** Docker containers managed declaratively
- **Health Checks:** Automatic health monitoring for all services
- **Telemetry:** Built-in OpenTelemetry integration

**Testing:**
- **xUnit:** Test framework (Facts, Theories, Async)
- **FluentAssertions:** Readable assertions (`Should().Be()`, `Should().NotBeNull()`)
- **NSubstitute:** Mocking framework for interfaces
- **Testcontainers:** Real dependencies in tests (SQL Server, Redis, RabbitMQ)
- **WebApplicationFactory:** Integration tests for HTTP endpoints

### RULE 3: Architecture Patterns Required

**Multi-Tenancy Patterns:**
- **Global Query Filters:** Automatic CompanyId + FacilityId filtering
- **Tenant Isolation Tests:** MUST verify Company A can't see Company B data
- **Context Propagation:** AsyncLocal for thread-safe context across async
- **Fail-Fast:** Throw exception if tenant context missing (don't return wrong data)

**Repository Pattern:**
- **Generic Repository:** Base repository with common CRUD operations
- **Specific Repositories:** Inherit from base, add domain-specific queries
- **No Leaking EF:** Repositories return domain entities, not IQueryable

**Unit of Work Pattern:**
- **Cross-Context Transactions:** Coordinate Admin DB + Tenant DB changes
- **Rollback on Failure:** If any context fails, rollback all
- **Outbox Pattern:** For reliable message publishing

**Resilience Patterns (Polly):**
- **Retry:** 3 attempts with exponential backoff
- **Circuit Breaker:** Open after 5 consecutive failures, half-open after 30s
- **Timeout:** All external calls timeout after 10s
- **Bulkhead:** Limit concurrent calls to protect resources

**Caching Patterns:**
- **Cache-Aside:** GetOrSet pattern (check cache, fetch if miss, store)
- **Two-Level Cache:** L1 in-memory + L2 Redis
- **Tenant-Prefixed Keys:** Automatic prefixing to prevent cross-tenant pollution
- **Invalidation:** By key, by prefix, by tag

**Messaging Patterns:**
- **Publish-Subscribe:** RabbitMQ for async events
- **Request-Reply:** SignalR for real-time bidirectional
- **Outbox Pattern:** Store events in DB, publish asynchronously
- **Message Envelope:** Include tenant context in every message

---

## Module Implementation Sequence

Each module depends on previous modules. Implement in this order:

### Phase 1: Foundation (Weeks 1-7)

**Module 1: Platform.Core** (Week 1-2)
- **Dependencies:** None
- **Deliverables:** Context abstractions (Company, Facility, Database, Storage, Cache, Messaging, Observability)
- **Tests:** 8 use cases
- **Skills Required:** None (pure C#)
- **Spec:** `MODULE-01-PLATFORM-CORE.md`

**Module 2: Platform.Data** (Week 3-4)
- **Dependencies:** Module 1 (contexts)
- **Deliverables:** DbContexts with global filters, migrations, Unit of Work
- **Tests:** 10 use cases
- **Skills Required:** None
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md, Module 2)

**Module 3: Platform.Auth** (Week 5)
- **Dependencies:** Modules 1, 2
- **Deliverables:** Cookie + JWT auth, RBAC, Azure Entra ID SSO
- **Tests:** 10 use cases
- **Skills Required:** None
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md, Module 3)

**Module 4: Platform.FeatureFlags** (Week 6)
- **Dependencies:** Modules 1, 2, 7 (Caching)
- **Deliverables:** DB-backed flags, admin UI, A/B testing
- **Tests:** 10 use cases
- **Skills Required:** `/mnt/skills/public/frontend-design/SKILL.md` (for UI)
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md, Module 4)

**Module 5: Platform.Storage** (Week 7a)
- **Dependencies:** Module 1
- **Deliverables:** IStorageProvider, Blob + Local implementations
- **Tests:** 10 use cases
- **Skills Required:** None
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md, Module 5)

**Module 6: Platform.FrequentAssets** (Week 7b)
- **Dependencies:** Modules 1, 5, 9 (Background Jobs)
- **Deliverables:** Cloudinary integration, hot cache
- **Tests:** 10 use cases
- **Skills Required:** None
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md, Module 6)

### Phase 2: Infrastructure (Weeks 8-12)

**Module 7: Platform.Caching** (Week 8)
- **Dependencies:** Module 1
- **Deliverables:** FusionCache + Redis, L1+L2, backplane
- **Tests:** 10 use cases
- **Skills Required:** None
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md, Module 7)

**Module 8: Platform.Messaging** (Week 9)
- **Dependencies:** Modules 1, 2
- **Deliverables:** RabbitMQ publisher/consumer, SignalR hubs, Outbox
- **Tests:** 10 use cases
- **Skills Required:** None
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md, Module 8)

**Module 9: Platform.BackgroundJobs** (Week 10)
- **Dependencies:** Modules 1, 2
- **Deliverables:** Hangfire, Azure Functions, tenant context restoration
- **Tests:** 10 use cases
- **Skills Required:** None
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md, Module 9)

**Module 10: Platform.Integrations** (Week 11)
- **Dependencies:** Modules 1, 11 (Observability)
- **Deliverables:** Refit clients, Polly resilience, OAuth2
- **Tests:** 10 use cases
- **Skills Required:** None
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md, Module 10)

**Module 11: Platform.Observability** (Week 12)
- **Dependencies:** Module 1
- **Deliverables:** OpenTelemetry traces/logs/metrics, dashboards
- **Tests:** 10 use cases
- **Skills Required:** `/mnt/skills/public/xlsx/SKILL.md` (for dashboard specs)
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md, Module 11)

### Phase 3: Business Logic (Weeks 13-30)

**Module 12: Platform.Admin** (Week 13-16)
- **Dependencies:** Modules 1, 2, 3, 4
- **Deliverables:** Company/Facility/User CRUD, audit logs, health dashboard
- **Tests:** 15 use cases
- **Skills Required:** `/mnt/skills/public/frontend-design/SKILL.md`
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md, Module 12)

**Module 13: Platform.Residents** (Week 17-22)
- **Dependencies:** Modules 1, 2, 3, 5, 8, 9
- **Deliverables:** Admission, care plans, medications, billing
- **Tests:** 25 use cases
- **Skills Required:** `/mnt/skills/public/frontend-design/SKILL.md`
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md, Module 13)

**Module 14: Platform.Families** (Week 23-26)
- **Dependencies:** Modules 1, 2, 3, 8, 10, 13
- **Deliverables:** Family portal, messaging, photo gallery
- **Tests:** 15 use cases
- **Skills Required:** `/mnt/skills/public/frontend-design/SKILL.md`
- **Spec:** (Reference original: AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md, Module 14)

---

## Context Window Optimization Strategy

Each module specification is designed to fit within AI context window (~8000 tokens).

**For Small Modules (Modules 1-6):**
- Single spec document contains everything
- Features, constraints, all use cases
- AI can load entire spec in one context

**For Medium Modules (Modules 7-11):**
- Spec document + separate test file
- Core features in main spec
- Detailed test cases in separate doc
- AI loads both documents in single context

**For Large Modules (Modules 12-14):**
- Split into sub-modules by feature area
- Example: Residents.Admission, Residents.Medications, Residents.Billing
- Each sub-module has own spec
- AI implements sub-modules sequentially

**Loading Strategy for AI Agent:**
```
1. Read main architecture document (this file)
2. Read specific module spec (e.g., MODULE-01-PLATFORM-CORE.md)
3. Read referenced skills (/mnt/skills/public/**/SKILL.md)
4. Review dependencies (ensure prerequisite modules complete)
5. Begin TDD implementation
```

---

## Testing Requirements (Detailed)

### Test Categories

**Unit Tests (60% of coverage):**
- Pure business logic
- No external dependencies (use mocks)
- Fast execution (< 100ms each)
- Example: Validate resident admission rules

**Integration Tests (30% of coverage):**
- Real infrastructure via Docker
- Testcontainers for SQL Server, Redis, RabbitMQ
- Medium execution (< 5s each)
- Example: Verify tenant isolation in database

**E2E Tests (10% of coverage):**
- Full user workflows
- Playwright for browser automation
- Slow execution (< 30s each)
- Example: Login → Admit resident → View care plan

### Test Execution Workflow

**Step 1: Write Failing Unit Test**
```csharp
[Fact]
public async Task AdmitResident_ValidData_Success()
{
    // Arrange
    var service = CreateService();
    var command = new AdmitResidentCommand
    {
        Name = "John Doe",
        DateOfBirth = new DateTime(1940, 1, 1),
        AdmissionDate = DateTime.Today
    };
    
    // Act
    var result = await service.AdmitResidentAsync(command);
    
    // Assert
    result.Should().NotBeNull();
    result.Id.Should().NotBeEmpty();
    result.Status.Should().Be(ResidentStatus.Active);
}
```

**Step 2: Run Test → Verify FAILS (RED)**
```bash
dotnet test --filter "AdmitResident_ValidData_Success"
# Expected: Test fails (method not implemented)
```

**Step 3: Implement Minimum Code**
```csharp
public async Task<Resident> AdmitResidentAsync(AdmitResidentCommand command)
{
    var resident = new Resident
    {
        Id = Guid.NewGuid(),
        Name = command.Name,
        DateOfBirth = command.DateOfBirth,
        AdmissionDate = command.AdmissionDate,
        Status = ResidentStatus.Active,
        CompanyId = _companyContext.CompanyId,
        FacilityId = _facilityContext.ActiveFacilityId!.Value
    };
    
    _db.Residents.Add(resident);
    await _db.SaveChangesAsync();
    
    return resident;
}
```

**Step 4: Run Test → Verify PASSES (GREEN)**
```bash
dotnet test --filter "AdmitResident_ValidData_Success"
# Expected: Test passes
```

**Step 5: Write Integration Test**
```csharp
[Fact]
public async Task AdmitResident_TenantIsolation_CorrectCompany()
{
    // Arrange: Using Testcontainers for SQL Server
    await using var container = new MsSqlBuilder().Build();
    await container.StartAsync();
    
    var db = CreateDbContext(container.GetConnectionString());
    await db.Database.MigrateAsync();
    
    var companyA = Guid.NewGuid();
    var facilityA = Guid.NewGuid();
    
    var service = CreateService(db, companyA, facilityA);
    
    // Act
    var resident = await service.AdmitResidentAsync(new AdmitResidentCommand
    {
        Name = "Jane Doe",
        DateOfBirth = new DateTime(1950, 5, 15),
        AdmissionDate = DateTime.Today
    });
    
    // Assert: Resident saved with correct tenant IDs
    var saved = await db.Residents.FindAsync(resident.Id);
    saved.Should().NotBeNull();
    saved!.CompanyId.Should().Be(companyA);
    saved!.FacilityId.Should().Be(facilityA);
}
```

**Step 6: Run Integration Test → Verify PASSES**
```bash
dotnet test --filter "AdmitResident_TenantIsolation_CorrectCompany"
# Expected: Test passes (SQL Server container started, migration applied, data saved correctly)
```

### Test Isolation Verification

**Critical Test:** Every module with database access MUST have this test:

```csharp
[Fact]
public async Task QueryResidents_TenantIsolation_CompanyACantSeeCompanyB()
{
    // Arrange
    await using var container = new MsSqlBuilder().Build();
    await container.StartAsync();
    
    var db = CreateDbContext(container.GetConnectionString());
    await db.Database.MigrateAsync();
    
    var companyA = Guid.NewGuid();
    var companyB = Guid.NewGuid();
    
    // Seed residents for both companies
    db.Residents.AddRange(
        new Resident { Id = Guid.NewGuid(), CompanyId = companyA, Name = "Alice" },
        new Resident { Id = Guid.NewGuid(), CompanyId = companyB, Name = "Bob" }
    );
    await db.SaveChangesAsync();
    
    // Act: Query as Company A
    var serviceA = CreateService(db, companyA);
    var residentsA = await serviceA.GetAllResidentsAsync();
    
    // Assert: Only Company A's resident returned
    residentsA.Should().HaveCount(1);
    residentsA.Single().Name.Should().Be("Alice");
    
    // Act: Query as Company B
    var serviceB = CreateService(db, companyB);
    var residentsB = await serviceB.GetAllResidentsAsync();
    
    // Assert: Only Company B's resident returned
    residentsB.Should().HaveCount(1);
    residentsB.Single().Name.Should().Be("Bob");
}
```

**This test MUST pass for every module.** If it fails, tenant isolation is broken.

---

## Performance Benchmarks

Each module has performance requirements. Tests MUST verify these:

**Module 1 (Contexts):**
- Context resolution: < 1ms

**Module 2 (Data):**
- Simple query: < 50ms
- Complex query with joins: < 100ms
- Bulk insert (1000 records): < 1s

**Module 7 (Caching):**
- L1 cache hit: < 1ms
- L2 cache hit: < 10ms
- Cache miss (DB query): < 100ms

**Module 8 (Messaging):**
- Message publish: < 10ms
- Message consume: < 50ms

**Module 11 (Observability):**
- Trace overhead: < 5ms per request
- Log overhead: < 1ms per log entry

**Performance Test Example:**
```csharp
[Fact]
public async Task GetResident_Performance_Under50ms()
{
    // Arrange
    var resident = await SeedTestResident();
    var stopwatch = Stopwatch.StartNew();
    
    // Act
    var result = await _service.GetResidentByIdAsync(resident.Id);
    stopwatch.Stop();
    
    // Assert
    result.Should().NotBeNull();
    stopwatch.ElapsedMilliseconds.Should().BeLessThan(50);
}
```

---

## Documentation Requirements

Every module MUST deliver:

**1. README.md**
- Overview of module purpose
- Dependencies (which modules required)
- Usage examples (code snippets)
- Configuration options
- Common pitfalls and solutions

**2. API Documentation**
- XML comments on all public interfaces and classes
- Parameter descriptions
- Return value descriptions
- Exception documentation
- Example usage in XML comments

**Example:**
```csharp
/// <summary>
/// Retrieves a resident by their unique identifier.
/// </summary>
/// <param name="id">The unique identifier of the resident.</param>
/// <returns>
/// The resident entity if found; otherwise, null.
/// </returns>
/// <exception cref="InvalidOperationException">
/// Thrown when the current user doesn't have access to the resident's facility.
/// </exception>
/// <example>
/// <code>
/// var resident = await _service.GetResidentByIdAsync(residentId);
/// if (resident != null)
/// {
///     Console.WriteLine($"Found: {resident.Name}");
/// }
/// </code>
/// </example>
public async Task<Resident?> GetResidentByIdAsync(Guid id)
{
    // Implementation
}
```

**3. Runbook (for production operations)**
- How to deploy module
- Configuration settings
- Monitoring and alerts
- Common errors and solutions
- Rollback procedure

---

## AI Agent Workflow Summary

**For Each Module:**

1. **Load Context**
   - Read architecture overview
   - Read module specification
   - Read prerequisite module READMEs
   - Read referenced skills

2. **Write Tests (RED)**
   - Write unit tests for all use cases
   - Run tests → Verify all fail
   - DO NOT PROCEED until tests fail

3. **Implement (GREEN)**
   - Write minimum code to pass tests
   - Run tests → Verify all pass
   - DO NOT PROCEED until tests pass

4. **Refactor (REFACTOR)**
   - Improve code quality
   - Extract methods, improve names
   - Run tests → Verify still pass

5. **Integration Tests**
   - Write integration tests with Testcontainers
   - Run tests → Verify pass with real dependencies
   - Verify tenant isolation
   - Verify performance benchmarks

6. **Document**
   - Update README.md
   - Add XML comments
   - Create runbook
   - Document design decisions

7. **Handoff**
   - Mark module complete in tracking
   - Notify next AI agent (if dependencies)
   - Provide summary of implementation

---

## Tracking Progress

Use the following checklist for each module:

```
Module: [Name]
Status: [Not Started | In Progress | Testing | Complete]

Tasks:
[ ] Module spec reviewed
[ ] Required skills reviewed
[ ] Dependencies verified (previous modules complete)
[ ] Unit tests written (all use cases)
[ ] Unit tests passing (100%)
[ ] Implementation complete
[ ] Integration tests written
[ ] Integration tests passing (100%)
[ ] Performance benchmarks met
[ ] Tenant isolation verified
[ ] Code coverage > 80%
[ ] README.md updated
[ ] XML comments added
[ ] Runbook created (if needed)
[ ] Module marked complete

Blockers: [None | List blockers]
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Forgetting Tenant Context in Background Jobs
**Problem:** Background job runs without tenant context, returns all companies' data  
**Solution:** Always restore context from job metadata  
```csharp
public async Task Execute(IJobExecutionContext context)
{
    var companyId = context.JobDetail.JobDataMap.GetGuid("CompanyId");
    _companyContext.SetContext(companyId);
    
    // Now queries automatically filtered by companyId
    var residents = await _service.GetAllResidentsAsync();
}
```

### Pitfall 2: Blocking Async Code
**Problem:** Using `.Result` or `.Wait()` causes deadlocks  
**Solution:** Async all the way down  
```csharp
// BAD
var resident = _service.GetResidentAsync(id).Result; // DEADLOCK!

// GOOD
var resident = await _service.GetResidentAsync(id);
```

### Pitfall 3: N+1 Query Problem
**Problem:** Loading 100 residents + 100 separate queries for rooms  
**Solution:** Use `.Include()` for eager loading  
```csharp
// BAD (N+1 queries)
var residents = await _db.Residents.ToListAsync();
foreach (var r in residents)
{
    var room = await _db.Rooms.FindAsync(r.RoomId); // N queries!
}

// GOOD (1 query)
var residents = await _db.Residents
    .Include(r => r.Room)
    .ToListAsync();
```

### Pitfall 4: Not Using Testcontainers
**Problem:** Mocking everything, integration bugs slip through  
**Solution:** Use Testcontainers for real dependencies  
```csharp
// Integration test with real SQL Server
await using var container = new MsSqlBuilder().Build();
await container.StartAsync();

var db = new DbContextOptionsBuilder<AppDbContext>()
    .UseSqlServer(container.GetConnectionString())
    .Options;
```

### Pitfall 5: Logging PII
**Problem:** HIPAA violation, fines  
**Solution:** Never log PII (SSN, DOB, medical info)  
```csharp
// BAD
_logger.LogInformation("Resident {Name}, SSN {SSN} admitted", name, ssn);

// GOOD
_logger.LogInformation("Resident {Id} admitted", residentId);
```

---

## Resources

**Official Documentation:**
- .NET 10: https://learn.microsoft.com/en-us/dotnet/
- EF Core 10: https://learn.microsoft.com/en-us/ef/core/
- Aspire: https://learn.microsoft.com/en-us/dotnet/aspire/
- OpenTelemetry: https://opentelemetry.io/docs/languages/net/

**Libraries:**
- FusionCache: https://github.com/ZiggyCreatures/FusionCache
- Hangfire: https://www.hangfire.io/
- Polly: https://github.com/App-vNext/Polly
- Refit: https://github.com/reactiveui/refit
- Testcontainers: https://dotnet.testcontainers.org/

**Patterns:**
- Modular Monolith: https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer
- Outbox Pattern: https://microservices.io/patterns/data/transactional-outbox.html

---

## Success Criteria (Overall Platform)

Before marking migration complete, ALL of these must be true:

**Technical:**
- ✓ All 14 modules implemented
- ✓ All 140+ use cases tested
- ✓ Code coverage > 80%
- ✓ Zero critical vulnerabilities
- ✓ Zero data leak incidents
- ✓ Performance SLAs met

**Business:**
- ✓ All features migrated (parity with old system)
- ✓ Zero downtime cutover
- ✓ User satisfaction > 4.5/5

**Developer Experience:**
- ✓ New feature development 2x faster
- ✓ Onboarding time for new devs down 40%
- ✓ Developer satisfaction > 4.5/5

---

END OF AI IMPLEMENTATION GUIDE
