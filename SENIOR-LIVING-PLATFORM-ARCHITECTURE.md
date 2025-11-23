# Senior Living Platform - Comprehensive Architecture Specification
## .NET 10 Modular Monolith Migration - AI Implementation Ready

**Version:** 2.0  
**Date:** November 22, 2025  
**Document Owner:** Senior Principal Software Architect  
**Purpose:** Complete architectural specification for AI-driven TDD implementation

---

## Document Organization

This architecture document is structured to enable AI agents to implement modules independently within context window constraints. Each module is self-contained with all necessary context, skills, features, constraints, and test cases.

**Key Principle:** Each module specification is designed to fit within a single AI context window (~8000 tokens) while maintaining completeness.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architectural Principles](#architectural-principles)
3. [AI Implementation Framework](#ai-implementation-framework)
4. [.NET 10 Skills & Best Practices](#net-10-skills--best-practices)
5. [Module Specifications](#module-specifications)
   - Module 1: Platform.Core - Context Abstractions
   - Module 2: Platform.Data - Data Access Layer
   - Module 3: Platform.Auth - Authentication & Authorization
   - Module 4: Platform.FeatureFlags - Feature Flag Management
   - Module 5: Platform.Storage - File Storage Abstraction
   - Module 6: Platform.FrequentAssets - Cloudinary Hot Cache
   - Module 7: Platform.Caching - FusionCache + Redis
   - Module 8: Platform.Messaging - RabbitMQ + SignalR
   - Module 9: Platform.BackgroundJobs - Hangfire + Azure Functions
   - Module 10: Platform.Integrations - HTTP Clients (Refit + Polly)
   - Module 11: Platform.Observability - OpenTelemetry
   - Module 12: Platform.Admin - Admin Module
   - Module 13: Platform.Residents - Residents Module
   - Module 14: Platform.Families - Family Portal Module
6. [Testing Strategy](#testing-strategy)
7. [Local Development Environment](#local-development-environment)
8. [Implementation Phasing](#implementation-phasing)

---

## Executive Summary

### Business Context

This platform serves senior living facilities providing care for residents. The system manages:
- **Resident care** (medications, activities, care plans, billing)
- **Family engagement** (portal, messaging, photo sharing, updates)
- **Facility operations** (staff scheduling, compliance, reporting)
- **Multi-company tenancy** (SaaS platform serving multiple senior living organizations)

### Current State (What We Have Today)

**Technology Stack:**
- .NET Framework 4.8 MVC application
- Entity Framework 6 with SQL Server
- Multi-tenant architecture with subdomain-based tenant resolution
- 4 separate databases (Admin, Tenant, Families, Cosmos DB)
- Azure-hosted infrastructure

**Database Architecture:**
```
Admin DB:
  - Companies (tenant organizations)
  - CompanyDatabaseMappings (which DB for which company)
  - Facilities (physical locations)
  - Users, Roles, Claims, Entitlements
  - Feature Flags, Audit Logs
  - Outbox Messages, Job Tracking

Tenant DB(s):
  - Residents (CompanyId + FacilityId filtered)
  - Care Logs, Medications, Billing
  - Scheduling, Activities, Assessments
  - Documents, Notes

Families DB:
  - Family Members
  - Resident-Family Mappings (cross-company)
  - Portal Access, Messages
  - Photo Galleries, Activity Feed

Cosmos DB:
  - Event Sourcing (Domain Events)
  - Activity Timelines
  - Analytics Aggregations
```

**Multi-Tenancy Pattern:**
```
company1.platform.com → Resolves to Company A → Maps to Database X
company2.platform.com → Resolves to Company B → Maps to Database Y
```

Every query is automatically filtered by:
- `CompanyId` (always required)
- `FacilityId` (usually required, nullable for "All Facilities" reports)

**Current Infrastructure:**
- **Storage:** Azure Blob (primary), Cloudinary (CDN for frequently accessed images), Local filesystem (dev/logging)
- **Caching:** Redis (L2 distributed), In-Memory (L1), FusionCache (orchestration)
- **Messaging:** RabbitMQ (async events), Azure Service Bus (Azure Functions), SignalR (real-time)
- **Background Jobs:** Hangfire (scheduled/recurring), Azure Functions (long-running exports, integrations)
- **Authentication:** Cookie-based (web UI), Azure Entra ID (SSO), JWT (API), Managed Identity (service-to-service)
- **Observability:** OpenTelemetry, Azure Monitor, Application Insights
- **Integrations:** 50+ external APIs via Refit + Polly (medical records, billing, state reporting, etc.)

**Pain Points Driving Migration:**
1. Tight coupling - difficult to test, difficult to change
2. No proper abstractions for multi-tenancy (context scattered everywhere)
3. EF6 limitations (poor async support, LINQ translation gaps, migrations complexity)
4. Monolithic structure - no module boundaries
5. Mixed concerns across layers
6. Difficult local development (requires Azure resources, can't run fully local)
7. Slow test execution (integration tests require real databases)
8. Manual deployment processes
9. Limited observability for debugging production issues

---

### Target State (Where We're Going)

**Technology Stack:**
- **.NET 10** (latest features: improved performance, native AOT readiness, enhanced minimal APIs)
- **Entity Framework Core 10** (with SQLite for local dev, SQL Server for production)
- **Aspire** for local orchestration (Docker containers managed declaratively)
- **Docker** for all dependencies (SQL Server, Redis, RabbitMQ, Azurite, Cosmos emulator)
- **Modular Monolith** architecture (modules can become microservices if needed)

**Architectural Goals:**
1. **Brilliant Abstractions** - Design through interfaces, implementation becomes inevitable
2. **Multi-Tenancy Safety** - Impossible to accidentally leak data across tenants
3. **Local-First Development** - Full stack runs on developer laptop with zero cloud dependencies
4. **TDD Mandatory** - Every feature starts with failing tests, no code without tests
5. **Observable by Default** - Traces, logs, metrics from day one
6. **Performance First** - P95 latency < 500ms for all operations
7. **Developer Experience** - Pit of success, fast feedback loops, excellent discoverability

**Module Structure:**
```
Platform.Core/                  # Context abstractions (Company, Facility, Database, Storage, Cache, etc.)
Platform.Data/                  # Data access (DbContexts, repositories, Unit of Work, migrations)
Platform.Auth/                  # Authentication & Authorization (Cookie, JWT, SSO, RBAC)
Platform.FeatureFlags/          # Feature flag management (DB-backed, cached, A/B testing)
Platform.Storage/               # File storage abstraction (Blob, Local, tenant-safe paths)
Platform.FrequentAssets/        # Cloudinary integration (hot cache for images)
Platform.Caching/               # FusionCache + Redis (L1+L2, backplane, tenant-safe keys)
Platform.Messaging/             # RabbitMQ + SignalR + Service Bus (async events, real-time)
Platform.BackgroundJobs/        # Hangfire + Azure Functions (scheduled, long-running jobs)
Platform.Integrations/          # HTTP clients (Refit + Polly, resilience patterns)
Platform.Observability/         # OpenTelemetry (traces, logs, metrics, dashboards)
Platform.Admin/                 # Admin module (companies, facilities, users, audit logs)
Platform.Residents/             # Residents module (care, medications, billing, scheduling)
Platform.Families/              # Family portal module (messaging, photos, updates)
Platform.Web/                   # ASP.NET Core MVC (controllers, views, middleware, API endpoints)
```

**Migration Strategy:**
- **Strangler Pattern:** Build new platform alongside existing
- **Shared Databases Initially:** Same Admin, Tenant, Families, Cosmos DBs (minimize migration risk)
- **Gradual Feature Migration:** Prove framework with POCs, then migrate business logic feature-by-feature
- **Phased Approach:** 30 weeks total (12 weeks framework + infrastructure, 18 weeks business logic migration)

---

## Architectural Principles

### 1. Design Through Abstractions, Not Implementations

**Philosophy:** Brilliant abstractions make the right implementation inevitable.

**Example:**
```csharp
// BAD: Exposing implementation details
public class TenantContext
{
    public Guid CompanyId { get; set; }
    public Guid FacilityId { get; set; }
    public string CompanyName { get; set; }
    public string DatabaseConnectionString { get; set; }
    public string BlobStorageContainer { get; set; }
    // ... 50 more properties (God Object)
}

// GOOD: Focused, composable abstractions
public interface ICompanyContext
{
    Guid CompanyId { get; }
    string CompanyName { get; }
    string Tier { get; }
}

public interface IFacilityContext
{
    Guid? ActiveFacilityId { get; }
    IReadOnlyList<Facility> AccessibleFacilities { get; }
    void SwitchFacility(Guid facilityId);
}

public interface IDatabaseContext
{
    string GetConnectionString(DbType dbType);
    bool HasReadReplica { get; }
}
```

### 2. Constraints → Invariants → Patterns → Checklists

**Philosophy:** Systematic design approach ensures correctness.

**Example for Tenant Isolation:**
```
CONSTRAINT: Users from Company A must never see data from Company B
    ↓
INVARIANT: Every query MUST include CompanyId filter
    ↓
PATTERN: Global query filters in EF Core automatically apply CompanyId
    ↓
CHECKLIST:
  □ Entity has CompanyId property
  □ Global query filter configured in DbContext
  □ Integration test verifies isolation
  □ No IgnoreQueryFilters() without explicit justification
```

### 3. TDD is Mandatory (Non-Negotiable)

**Philosophy:** Tests define behavior, implementation follows.

**Workflow:**
1. **RED:** Write failing test that defines expected behavior
2. **GREEN:** Write minimum code to make test pass
3. **REFACTOR:** Improve design while keeping tests green
4. **VERIFY:** Run integration tests with real dependencies
5. **DOCUMENT:** Update README with usage examples

**Critical Rule:** **DO NOT ASSUME SUCCESS. TESTS MUST PASS.**
- AI agents must run tests and verify they pass
- If tests fail, implementation is wrong (not tests)
- No shipping code without all tests green
- Integration tests with real dependencies (Testcontainers) catch infrastructure issues

### 4. Local-First Development

**Philosophy:** Developer should be able to run entire stack on laptop with zero cloud dependencies.

**Aspire Orchestration:**
```csharp
// AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);

// Infrastructure
var sql = builder.AddSqlServer("sql")
    .WithDataVolume()
    .AddDatabase("AdminDb")
    .AddDatabase("TenantDb");

var redis = builder.AddRedis("redis")
    .WithDataVolume();

var rabbit = builder.AddRabbitMQ("rabbitmq")
    .WithManagementPlugin();

var cosmos = builder.AddAzureCosmosDB("cosmos")
    .RunAsEmulator();

var blob = builder.AddAzureStorage("storage")
    .RunAsEmulator();

// Application
builder.AddProject<Platform_Web>("web")
    .WithReference(sql)
    .WithReference(redis)
    .WithReference(rabbit)
    .WithReference(cosmos)
    .WithReference(blob);

builder.Build().Run();
```

**Benefits:**
- `dotnet run` starts entire stack
- Real dependencies (not mocks) via Docker
- Fast feedback (<30 seconds from code change to running)
- Deterministic behavior (same environment everywhere)

### 5. Composed Contexts, Not God Objects

**Philosophy:** Single Responsibility Principle for context objects.

**Instead of:**
```csharp
ITenantContext // 50 properties, does everything
```

**We have:**
```csharp
ICompanyContext      // Company resolution
IFacilityContext     // Facility switching
IDatabaseContext     // Database mapping
IStorageContext      // Blob storage paths
ICacheContext        // Cache key prefixing
IMessagingContext    // Message tagging
IObservabilityContext // Trace enrichment
```

**Benefits:**
- Easy to test (mock only what you need)
- Easy to extend (add new context without changing existing)
- Clear ownership (each context has single responsibility)
- Better discoverability (IntelliSense shows relevant properties only)

### 6. Developer Experience is Paramount

**Philosophy:** Make the right thing easy, the wrong thing hard (Pit of Success).

**Examples:**
- **Tenant isolation:** Impossible to forget CompanyId filter (global query filters)
- **Cache keys:** Automatically prefixed with tenant (can't cause cross-tenant pollution)
- **Observability:** Automatic trace/log enrichment (no manual instrumentation needed)
- **Testing:** Testcontainers make integration tests as easy as unit tests
- **Documentation:** Inline examples, XML comments, README with usage patterns

---

## AI Implementation Framework

### Context Window Management

Each module specification is designed to fit within **8000 tokens** for a single AI agent task. This ensures:
- Agent can load entire module spec
- Implement features with full context
- Write comprehensive tests
- Update documentation

**Module Size Guidelines:**
- Small modules (1-2 weeks): Single spec document
- Medium modules (2-4 weeks): Spec document + implementation guide
- Large modules (4-6 weeks): Split into sub-modules (e.g., Residents.Admission, Residents.Medications)

### AI Agent Lifecycle for Each Module

**Phase 1: Context Loading (AI reads spec)**
```
1. Load module specification
2. Read referenced skills (/mnt/skills/public/**/SKILL.md)
3. Review dependencies (which modules must exist first)
4. Understand domain context (glossary, business rules)
5. Review TDD use cases (understand expected behavior)
```

**Phase 2: Test-First Implementation**
```
1. Write failing unit tests for UC1, UC2, etc.
   - Run tests → Verify they fail (RED)
2. Implement minimum code to pass tests
   - Run tests → Verify they pass (GREEN)
3. Refactor to improve design
   - Run tests → Verify still green (REFACTOR)
4. Write integration tests with Testcontainers
   - Run tests → Verify they pass
5. Run all module tests together
   - Verify 100% pass rate
```

**Phase 3: Documentation & Handoff**
```
1. Update module README with:
   - Usage examples
   - API documentation
   - Configuration options
   - Common pitfalls
2. Generate API documentation (XML comments)
3. Create runbook for operations (if applicable)
4. Mark module as "Complete" in tracking sheet
```

### Critical Rules for AI Agents

**RULE 1: DO NOT ASSUME SUCCESS**
- Always run tests after implementation
- If test fails, fix implementation (not test)
- Never mark task complete without 100% tests passing
- Integration tests must pass with real dependencies (Docker containers)

**RULE 2: RELY ON PASSED TESTS, NOT ASSUMPTIONS**
- Test defines correct behavior, not your understanding
- Edge cases in tests must all pass
- Negative tests (error cases) must pass
- Performance tests must meet benchmarks

**RULE 3: IMPLEMENT EXACTLY WHAT SPEC DEFINES**
- Don't add "nice to have" features
- Don't skip "optional" features (nothing is optional)
- Don't change APIs without architect approval
- Follow naming conventions exactly

**RULE 4: TEST WITH REAL DEPENDENCIES**
- Use Testcontainers for SQL Server, Redis, RabbitMQ
- Don't mock everything (integration tests catch real issues)
- Local dev environment must use same Docker images as production
- Test tenant isolation explicitly (Company A can't see Company B data)

**RULE 5: DOCUMENT AS YOU GO**
- Update README with usage examples immediately
- Add XML comments to public APIs
- Document design decisions (why, not just what)
- Update glossary if introducing new terms

### .NET 10 Skills Required for All Modules

**Core .NET 10 Skills:**
1. **Minimal APIs** (if building HTTP endpoints)
2. **Native AOT Compatibility** (avoid reflection where possible)
3. **Async/Await** (never block with .Result or .Wait())
4. **Dependency Injection** (constructor injection, service lifetimes)
5. **Configuration** (IOptions<T> pattern, strongly-typed config)
6. **Logging** (ILogger<T>, structured logging, log levels)
7. **Health Checks** (startup, readiness, liveness)

**EF Core 10 Skills:**
1. **Global Query Filters** (automatic tenant filtering)
2. **Interceptors** (audit fields, soft delete, performance tracking)
3. **Migrations** (code-first, idempotent, multi-database)
4. **Bulk Operations** (EF.BulkExtensions for performance)
5. **Optimistic Concurrency** (RowVersion for conflict detection)
6. **Computed Columns & Indexes** (database-level performance)
7. **SQL Raw Queries** (when LINQ isn't enough)

**Aspire Skills:**
1. **Service Discovery** (reference dependencies by name)
2. **Configuration Management** (secrets, connection strings)
3. **Resource Orchestration** (Docker containers, volume mounts)
4. **Dashboard** (metrics, logs, traces in single view)
5. **Deployment** (manifest generation for Azure)

**Testing Skills:**
1. **xUnit** (test framework, fixtures, theories)
2. **FluentAssertions** (readable assertions)
3. **NSubstitute** (mocking dependencies)
4. **Testcontainers** (real dependencies via Docker)
5. **WebApplicationFactory** (integration tests for HTTP)
6. **Playwright** (E2E tests for UI)

**Architecture Patterns:**
1. **Repository Pattern** (data access abstraction)
2. **Unit of Work** (transaction coordination)
3. **CQRS** (command/query separation where beneficial)
4. **Outbox Pattern** (reliable messaging)
5. **Circuit Breaker** (Polly resilience)
6. **Cache-Aside** (read-through caching)
7. **Event Sourcing** (for audit trail, analytics)

---

## Testing Strategy

### Test Pyramid

```
        E2E Tests (10%)
      /                \
     /  Integration (30%) \
    /                      \
   /    Unit Tests (60%)    \
  /__________________________\
```

**Unit Tests (60% of total tests):**
- **Purpose:** Test business logic in isolation
- **Speed:** Fast (< 100ms each)
- **Dependencies:** None (use mocks/stubs)
- **Example:** Validating a resident admission rule

**Integration Tests (30% of total tests):**
- **Purpose:** Test infrastructure integration (database, cache, message bus)
- **Speed:** Medium (< 5 seconds each)
- **Dependencies:** Real via Testcontainers (SQL Server, Redis, RabbitMQ)
- **Example:** Verifying tenant isolation in database queries

**E2E Tests (10% of total tests):**
- **Purpose:** Test full user workflows
- **Speed:** Slow (< 30 seconds each)
- **Dependencies:** Full stack running (Aspire + browsers via Playwright)
- **Example:** User logs in, admits resident, views care plan

### TDD Workflow (Detailed)

**Step 1: RED (Write Failing Test)**
```csharp
[Fact]
public async Task GetResident_WithValidId_ReturnsResident()
{
    // Arrange
    var residentId = Guid.NewGuid();
    var companyContext = new Mock<ICompanyContext>();
    companyContext.Setup(x => x.CompanyId).Returns(Guid.NewGuid());
    
    var repository = new ResidentRepository(/* dependencies */);
    
    // Act
    var resident = await repository.GetByIdAsync(residentId);
    
    // Assert
    resident.Should().NotBeNull();
    resident.Id.Should().Be(residentId);
}
```
Run test → **FAILS** (repository not implemented yet)

**Step 2: GREEN (Implement Minimum Code)**
```csharp
public class ResidentRepository : IResidentRepository
{
    private readonly IDbContext _db;
    
    public async Task<Resident?> GetByIdAsync(Guid id)
    {
        return await _db.Residents
            .FirstOrDefaultAsync(r => r.Id == id);
        // Note: Global query filter automatically adds CompanyId
    }
}
```
Run test → **PASSES**

**Step 3: REFACTOR (Improve Design)**
```csharp
public async Task<Resident?> GetByIdAsync(Guid id)
{
    return await _db.Residents
        .AsNoTracking() // Performance: read-only query
        .Include(r => r.CurrentRoom) // Eager load
        .Include(r => r.PrimaryCareGiver)
        .FirstOrDefaultAsync(r => r.Id == id);
}
```
Run test → **STILL PASSES**

**Step 4: INTEGRATION TEST (Real Dependencies)**
```csharp
[Fact]
public async Task GetResident_TenantIsolation_OnlyReturnsOwnCompanyResident()
{
    // Arrange: Using Testcontainers for SQL Server
    await using var container = new MsSqlBuilder().Build();
    await container.StartAsync();
    
    var db = CreateDbContext(container.GetConnectionString());
    
    var companyA = Guid.NewGuid();
    var companyB = Guid.NewGuid();
    
    // Seed data
    db.Residents.AddRange(
        new Resident { Id = Guid.NewGuid(), CompanyId = companyA, Name = "Alice" },
        new Resident { Id = Guid.NewGuid(), CompanyId = companyB, Name = "Bob" }
    );
    await db.SaveChangesAsync();
    
    // Act: Query as Company A
    var companyContext = new Mock<ICompanyContext>();
    companyContext.Setup(x => x.CompanyId).Returns(companyA);
    
    var repository = new ResidentRepository(db, companyContext.Object);
    var residents = await repository.GetAllAsync();
    
    // Assert: Only Company A's resident returned
    residents.Should().HaveCount(1);
    residents.Single().Name.Should().Be("Alice");
}
```
Run test → **PASSES** (tenant isolation verified with real database)

### Performance Testing

**Benchmarks for Each Module:**
- Define performance targets in spec (e.g., < 100ms, < 500ms)
- Use BenchmarkDotNet for micro-benchmarks
- Use K6 or JMeter for load testing
- Fail tests if performance regresses

**Example:**
```csharp
[Fact]
public async Task GetResident_PerformanceBenchmark_UnderOneHundredMilliseconds()
{
    // Arrange
    var stopwatch = Stopwatch.StartNew();
    
    // Act
    var resident = await _repository.GetByIdAsync(residentId);
    
    // Assert
    stopwatch.ElapsedMilliseconds.Should().BeLessThan(100);
}
```

---

## Local Development Environment

### Prerequisites

**Required Tools:**
- .NET 10 SDK
- Docker Desktop
- Visual Studio 2025 or Rider 2025 or VS Code with C# Dev Kit
- Git

**Optional Tools:**
- Azure Data Studio (for SQL queries)
- Redis Insight (for cache inspection)
- RabbitMQ Management UI (via Docker)

### First-Time Setup

```bash
# Clone repository
git clone https://github.com/company/senior-living-platform.git
cd senior-living-platform

# Restore dependencies
dotnet restore

# Run Aspire AppHost (starts all containers + app)
cd src/Platform.AppHost
dotnet run

# Dashboard opens automatically at https://localhost:15000
```

**What Aspire Starts:**
- SQL Server (Admin DB, Tenant DB, Families DB)
- Redis (caching)
- RabbitMQ (messaging)
- Cosmos DB Emulator (event sourcing)
- Azurite (blob storage emulator)
- Platform.Web (ASP.NET Core app)

**All running in Docker containers** with automatic port mapping, health checks, and logs.

### Running Tests

```bash
# Unit tests only (fast)
dotnet test --filter "Category=Unit"

# Integration tests (with Testcontainers)
dotnet test --filter "Category=Integration"

# All tests
dotnet test

# With code coverage
dotnet test --collect:"XPlat Code Coverage"
```

### Database Migrations

```bash
# Add migration
dotnet ef migrations add MigrationName --project Platform.Data --context AdminDbContext

# Apply to local database
dotnet ef database update --project Platform.Data --context AdminDbContext

# Apply to all tenant databases
dotnet run --project Platform.Data.MigrationRunner
```

---

## Implementation Phasing

### Phase 1: Foundation (Weeks 1-7) - CRITICAL PATH

**Week 1-2: Module 1 - Platform.Core**
- Implement context abstractions
- Deliver: ICompanyContext, IFacilityContext, Context middleware
- Tests: 11 use cases, all passing

**Week 3-4: Module 2 - Platform.Data**
- Implement DbContexts with global query filters
- Deliver: TenantDbContext, AdminDbContext, migrations
- Tests: 10 use cases, tenant isolation verified

**Week 5: Module 3 - Platform.Auth**
- Implement authentication & authorization
- Deliver: Cookie, JWT, SSO, RBAC
- Tests: 10 use cases, security verified

**Week 6: Module 4 - Platform.FeatureFlags**
- Implement feature flag system
- Deliver: DB-backed flags, admin UI, A/B testing
- Tests: 10 use cases, cache invalidation verified

**Week 7: Module 5+6 - Storage + FrequentAssets**
- Implement file storage abstraction
- Deliver: Blob storage, Cloudinary integration
- Tests: 10 use cases each, tenant isolation verified

### Phase 2: Infrastructure (Weeks 8-12)

**Week 8: Module 7 - Platform.Caching**
- Implement FusionCache + Redis
- Deliver: L1+L2 caching, backplane, metrics
- Tests: 10 use cases, multi-instance verified

**Week 9: Module 8 - Platform.Messaging**
- Implement RabbitMQ + SignalR
- Deliver: Publisher/Consumer, Outbox pattern
- Tests: 10 use cases, message isolation verified

**Week 10: Module 9 - Platform.BackgroundJobs**
- Implement Hangfire + Azure Functions
- Deliver: Scheduled jobs, long-running exports
- Tests: 10 use cases, context restoration verified

**Week 11: Module 10 - Platform.Integrations**
- Implement HTTP clients (Refit + Polly)
- Deliver: Typed clients, circuit breakers, OAuth2
- Tests: 10 use cases, resilience verified

**Week 12: Module 11 - Platform.Observability**
- Implement OpenTelemetry
- Deliver: Traces, logs, metrics, dashboards
- Tests: 10 use cases, tenant tagging verified

### Phase 3: Business Logic (Weeks 13-30)

**Week 13-16: Module 12 - Platform.Admin**
- Implement admin functionality
- Deliver: Company/Facility/User CRUD, audit logs
- Tests: 15 use cases, full coverage

**Week 17-22: Module 13 - Platform.Residents**
- Implement resident management (largest module)
- Deliver: Admission, care plans, medications, billing
- Tests: 25 use cases, HIPAA compliance verified

**Week 23-26: Module 14 - Platform.Families**
- Implement family portal
- Deliver: Registration, messaging, photo gallery
- Tests: 15 use cases, cross-company families verified

**Week 27-30: Migration & Stabilization**
- Data migration from old system
- Performance tuning
- Security audit
- Production deployment

---

## Success Criteria (Overall Platform)

### Technical Metrics

**Code Quality:**
- ✓ Code coverage > 80% (all modules)
- ✓ Zero critical security vulnerabilities
- ✓ Zero data leak incidents (verified by tenant isolation tests)
- ✓ Performance SLAs met (P95 latency < 500ms)

**Reliability:**
- ✓ Uptime > 99.9%
- ✓ Mean Time to Recovery (MTTR) < 1 hour
- ✓ Zero data loss incidents
- ✓ All critical alerts have runbooks

**Observability:**
- ✓ 100% of operations traced
- ✓ Metrics for all business KPIs
- ✓ Structured logging everywhere
- ✓ Dashboards for ops and business teams

### Business Metrics

**Migration Success:**
- ✓ All features migrated (parity with old system)
- ✓ Zero downtime cutover
- ✓ User satisfaction score > 4.5/5
- ✓ Support ticket volume down by 30%

**Performance Improvement:**
- ✓ Page load time down by 50%
- ✓ API response time down by 40%
- ✓ Database query time down by 60%
- ✓ Cost per transaction down by 25%

**Developer Experience:**
- ✓ New feature development 2x faster
- ✓ Bug fix time down by 50%
- ✓ Onboarding time for new devs down by 40%
- ✓ Developer satisfaction score > 4.5/5

---

## Glossary

**Company:** A customer organization (e.g., "Sunrise Senior Living"). Multiple facilities belong to one company. One company can have one or multiple databases.

**Facility:** A physical location (e.g., "Sunrise of Arlington"). One facility belongs to one company. One facility houses many residents.

**Resident:** A person receiving care at a facility. Each resident belongs to exactly one company and one facility (at a time).

**Tenant:** Synonym for Company in multi-tenancy context. "Tenant isolation" means Company A cannot see Company B's data.

**Global Query Filter:** EF Core feature that automatically adds WHERE clause to all queries (e.g., WHERE CompanyId = @CurrentCompanyId).

**Aspire:** .NET orchestration framework for running distributed apps locally with Docker containers, service discovery, and configuration management.

**Testcontainers:** Library for running Docker containers in tests (e.g., real SQL Server, Redis, RabbitMQ in integration tests).

**Modular Monolith:** Architecture where application is split into modules with clear boundaries, but deployed as single application (not microservices).

**Outbox Pattern:** Storing events in database alongside business data, then publishing to message bus asynchronously. Guarantees at-least-once delivery.

**Circuit Breaker:** Resilience pattern (Polly library). If external service fails repeatedly, stop calling it for a time period to prevent cascading failures.

**FusionCache:** Two-level caching library (L1 = in-memory, L2 = Redis). Automatic failover, backplane for multi-instance invalidation.

**Context:** Abstraction that provides information about current request scope (e.g., ICompanyContext provides CompanyId, CompanyName, etc.).

**Claims:** User identity information (UserId, Email, Roles, CompanyId, FacilityAccess). Stored in authentication cookie or JWT.

**Entitlements:** Permissions granted to user (e.g., "Residents.View", "Residents.Edit", "Admin.ManageUsers").

---

