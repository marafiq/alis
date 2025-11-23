# MODULE 1: Platform.Core - Context Abstractions

**Module Owner:** AI Agent "Context Architect"  
**Dependencies:** None (foundation module)  
**Estimated Duration:** 2 weeks  
**Context Window:** This document is self-contained for AI implementation

---

## AI Agent Context & Skills

### Role & Expertise
```yaml
role: Senior .NET Architect specializing in Multi-Tenant Abstractions
expertise:
  - .NET 10 DI and service lifetimes (Transient, Scoped, Singleton)
  - AsyncLocal<T> for context propagation across async boundaries
  - Middleware pipeline design and execution order
  - SOLID principles, especially ISP (Interface Segregation Principle)
  - Tenant isolation patterns and data leak prevention
approach: Design elegant abstractions that make tenant data leaks impossible
testing_framework: xUnit + FluentAssertions + NSubstitute (for mocking)
environment: Aspire + SQLite (no external dependencies for this module)
```

### Required .NET 10 Skills

**Core Framework:**
- Dependency Injection (IServiceCollection, service lifetimes, factory patterns)
- Middleware (IMiddleware vs inline, execution order, short-circuiting)
- AsyncLocal<T> (thread-safe context propagation in async code)
- Options Pattern (IOptions<T>, IOptionsSnapshot<T>, validation)

**ASP.NET Core:**
- HttpContext (request/response, headers, subdomain extraction)
- ClaimsPrincipal (authentication claims, custom claims)
- IHttpContextAccessor (accessing HttpContext in services)

**Testing:**
- xUnit (facts, theories, async tests, fixtures)
- FluentAssertions (readable assertions, Should().Be(), Should().NotBeNull())
- NSubstitute (mocking interfaces, Setup, Returns, Received)

**No AI Skills Required:** This module is pure code.

---

## Module Purpose

This module provides the foundation for multi-tenancy by defining focused context abstractions. Instead of a monolithic `ITenantContext` with 50 properties, we compose small, single-responsibility interfaces.

**Key Principle:** Each context interface answers ONE question:
- `ICompanyContext` → "Which company is this request for?"
- `IFacilityContext` → "Which facility is the user working in?"
- `IDatabaseContext` → "Which database should I query?"
- `IStorageContext` → "Where should I store files for this tenant?"
- `ICacheContext` → "What cache key prefix should I use?"
- `IMessagingContext` → "How do I tag messages for this tenant?"
- `IObservabilityContext` → "How do I enrich traces/logs with tenant info?"

**Benefits:**
- Easy to test (mock only what you need)
- Easy to extend (add new context without changing existing)
- Clear ownership (each context has single responsibility)
- Better discoverability (IntelliSense shows relevant properties only)

---

## Must-Have Features

### F1: Company Context Abstraction
- Resolve current company from subdomain (e.g., `acme.platform.com` → Company "Acme Corporation")
- Resolve current company from JWT claims (for API requests)
- Provide `CompanyId`, `CompanyName`, `Tier` (Enterprise/Professional/Basic)
- Provide `DatabaseMapping` (which database for this company)
- Thread-safe context propagation via `AsyncLocal<CompanyContextData>`
- **Fail-fast if context missing** (throw exception, don't return null)

### F2: Facility Context Abstraction
- Track active facility for current user
- Support "All Facilities" mode (nullable `ActiveFacilityId`)
- Provide list of accessible facilities (user permissions)
- Switch facility operation with validation (can user access this facility?)
- Persist facility choice in session or claims

### F3: Database Context Abstraction
- Determine which database connection string for current company
- Support read replica routing (separate connection for read-only queries)
- Provide connection strings for:
  - Admin DB (cross-company data)
  - Tenant DB (company-specific data)
  - Families DB (cross-company family relationships)
  - Cosmos DB (event sourcing, analytics)
- Handle company → multiple databases scenario (some large customers have dedicated DBs)

### F4: Storage Context Abstraction
- Provide tenant-prefixed paths for blob storage
  - Format: `{companyName}/{facilityName}/{fileName}`
  - Example: `acme/building-a/documents/contract.pdf`
- Separate containers per company, folders per facility
- Generate SAS URLs with appropriate expiry (1 hour for download, 5 min for upload)
- Support local file system for development (paths like `C:\temp\acme\building-a\...`)

### F5: Cache Context Abstraction
- Provide tenant-prefixed cache keys
  - Format: `{companyId}:{facilityId}:{logicalKey}`
  - Example: `<guid>:<guid>:residents:active`
- Prevent cross-tenant cache pollution (impossible to collide keys)
- Cache invalidation by tenant (invalidate all keys for company or facility)
- Support "All Facilities" mode (cache keys without facilityId)

### F6: Messaging Context Abstraction
- Tag messages with `CompanyId` and `FacilityId`
  - Envelope pattern: `{ CompanyId: <guid>, FacilityId: <guid>, Payload: {...} }`
- Route messages to tenant-specific handlers
- Prevent cross-tenant message leaking (consumer validates context)
- Support SignalR group management (groups per company/facility)

### F7: Observability Context Abstraction
- Inject `CompanyId`, `FacilityId`, `UserId` into trace context (OpenTelemetry baggage)
- Enrich logs with tenant information (structured logging fields)
- Metrics with tenant dimensions (e.g., `requests_total{company="acme", facility="building-a"}`)
- Distributed tracing across modules (propagate context via headers)

### F8: Context Composition
- All contexts injectable independently (register all in DI container)
- No monolithic `ITenantContext` (compose contexts as needed)
- Each context accessible via constructor injection
  - Example: `public ResidentService(ICompanyContext company, IFacilityContext facility)`
- Testable via interface mocking (mock only what the service needs)

---

## Constraints

### C1: Thread Safety (INVARIANT)
- `AsyncLocal<T>` MUST be used for context storage (supports async/await)
- Context MUST propagate across async boundaries (await, Task.Run, etc.)
- No `ThreadLocal<T>` (doesn't work with async)
- No static mutable state (not thread-safe in web server)

### C2: Fail-Fast on Missing Context
- If context required but not available → throw `InvalidOperationException`
- Better to fail immediately than return corrupt data
- Example: Querying residents without `CompanyId` → exception, not empty results
- Middleware MUST set context early in pipeline (before MVC)

### C3: Performance Requirements
- Context resolution < 1ms (measured via middleware timing)
- No database calls in middleware (use cached mappings)
- Subdomain parsing via string manipulation (no regex)
- Context storage via `AsyncLocal` (zero-allocation in happy path)

### C4: Testing Requirements
- Every context interface MUST be mockable (interface, not class)
- Unit tests MUST use mocks (no real HTTP requests)
- Integration tests MUST use real middleware pipeline (TestServer)
- Tenant isolation MUST be verified (Company A can't access Company B's context)

### C5: Extensibility
- New contexts can be added without breaking existing (open/closed principle)
- Context interfaces immutable once released (breaking changes require new interface)
- Context data classes can have computed properties (derived from core data)

---

## TDD Use Cases

**CRITICAL:** Every use case MUST have tests written BEFORE implementation. Tests define correct behavior.

### UC1.1: Resolve Company from Subdomain

**AI SKILL:** None  
**AI CONTEXT:** ASP.NET Core middleware, subdomain parsing, database lookup  
**AI ROLE:** Implement middleware for tenant resolution from subdomain

```
GIVEN a request to "acme.platform.com"
WHEN CompanyContext is resolved via middleware
THEN CompanyId should be the ID for "acme" (from database lookup)
AND CompanyName should be "Acme Corporation"
AND Tier should be "Enterprise" (from database)
AND DatabaseMapping should indicate which DB to use

UNIT TEST: Mock HttpContext with subdomain in Host header
  - Create fake HttpContext with Host = "acme.platform.com"
  - Mock ICompanyRepository to return company for "acme"
  - Assert context populated correctly

INTEGRATION TEST: Real request via TestServer with in-memory database
  - Seed database with companies: acme, demo, test
  - Send HTTP request to each subdomain
  - Assert correct company context resolved
  - Assert request.HttpContext.Items["CompanyContext"] set correctly

NEGATIVE TESTS:
  - Invalid subdomain (xyz.platform.com, not in DB) → 404 Not Found
  - Missing subdomain (just "platform.com") → 400 Bad Request
  - Subdomain for disabled company → 403 Forbidden

PERFORMANCE:
  - Context resolution < 1ms (measure middleware execution time)
  - Database lookup cached (second request doesn't hit DB)
```

**Implementation Hints:**
```csharp
// Middleware skeleton
public class CompanyContextMiddleware : IMiddleware
{
    private readonly ICompanyRepository _companies;
    
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var subdomain = ExtractSubdomain(context.Request.Host);
        var company = await _companies.GetBySubdomainAsync(subdomain);
        
        if (company == null)
            context.Response.StatusCode = 404;
        else
        {
            var companyContext = new CompanyContext(company);
            context.Items["CompanyContext"] = companyContext;
            await next(context);
        }
    }
}
```

### UC1.2: Resolve Company from JWT Claims

**AI SKILL:** None  
**AI CONTEXT:** ASP.NET Core authentication, ClaimsPrincipal, JWT  
**AI ROLE:** Implement claims-based tenant resolution for API requests

```
GIVEN a JWT with claim "companyId: <guid>"
WHEN CompanyContext is resolved
THEN CompanyId should match claim value
AND database lookup validates company exists and is active

UNIT TEST: Mock ClaimsPrincipal with companyId claim
  - Create ClaimsPrincipal with companyId claim
  - Mock ICompanyRepository to validate company exists
  - Assert context populated from claim

INTEGRATION TEST: Real JWT validation with test user
  - Generate JWT with test companyId claim
  - Send API request with Bearer token
  - Assert context resolved from claim
  - Assert request succeeds

NEGATIVE TESTS:
  - Missing companyId claim → 401 Unauthorized (invalid token)
  - Invalid company ID (not a GUID) → 400 Bad Request
  - Company ID not in database → 403 Forbidden
  - Company disabled → 403 Forbidden

SECURITY:
  - JWT signature MUST be validated (don't trust claims without validation)
  - Company existence verified (claim could be forged)
```

**Implementation Hints:**
```csharp
// In middleware, check if authenticated
if (context.User.Identity?.IsAuthenticated == true)
{
    var companyIdClaim = context.User.FindFirst("companyId")?.Value;
    if (!Guid.TryParse(companyIdClaim, out var companyId))
        context.Response.StatusCode = 400; // Bad Request
    
    var company = await _companies.GetByIdAsync(companyId);
    // ... validate and set context
}
```

### UC1.3: Switch Facility

**AI SKILL:** None  
**AI CONTEXT:** Facility selection, user permissions, session management  
**AI ROLE:** Implement facility switching with authorization validation

```
GIVEN user has access to Facility A and Facility B (but not C)
WHEN user switches to Facility A
THEN ActiveFacilityId should be Facility A's ID
AND subsequent queries should filter by Facility A
AND user session should remember facility choice (persist in cookie or DB)

UNIT TEST: Mock facility access list and switch logic
  - Mock IFacilityContext with accessible facilities [A, B]
  - Call SwitchFacility(A)
  - Assert ActiveFacilityId == A

INTEGRATION TEST: Real session storage, real permission check
  - Seed database with user having access to facilities A, B
  - POST /api/facility/switch?facilityId=A
  - Assert session updated
  - GET /api/residents
  - Assert results filtered by Facility A

NEGATIVE TESTS:
  - Switch to facility without access (C) → 403 Forbidden
  - Switch to non-existent facility → 404 Not Found
  - Switch to facility in different company → 403 Forbidden (impossible via UI, but API must validate)

USABILITY:
  - Facility choice persists across requests (session or cookie)
  - UI shows current facility name
```

**Implementation Hints:**
```csharp
public interface IFacilityContext
{
    Guid? ActiveFacilityId { get; }
    IReadOnlyList<Facility> AccessibleFacilities { get; }
    Task SwitchFacilityAsync(Guid facilityId);
}

public async Task SwitchFacilityAsync(Guid facilityId)
{
    if (!AccessibleFacilities.Any(f => f.Id == facilityId))
        throw new ForbiddenException("User doesn't have access to this facility");
    
    // Update session
    _httpContext.Session.SetString("ActiveFacilityId", facilityId.ToString());
    // ... refresh context
}
```

### UC1.4: All Facilities Mode

**AI SKILL:** None  
**AI CONTEXT:** Reporting, cross-facility queries, optional filtering  
**AI ROLE:** Implement "All Facilities" mode for reports and dashboards

```
GIVEN user has access to Facilities A, B, C (but not D, E)
WHEN user enables "All Facilities" mode
THEN ActiveFacilityId should be NULL
AND queries should return data from A, B, C only (not D, E)
AND reports should group by facility

UNIT TEST: Mock accessible facilities and verify filtering
  - Set ActiveFacilityId = null
  - Mock AccessibleFacilities = [A, B, C]
  - Build query filter
  - Assert WHERE clause: facilityId IN (A, B, C)

INTEGRATION TEST: Real database with multi-facility data
  - Seed residents for facilities A, B, C, D, E
  - Query in "All Facilities" mode as user with access to A, B, C
  - Assert results include only A, B, C residents
  - Assert count matches expected

NEGATIVE TESTS:
  - All facilities mode with single facility → Works, returns only that facility
  - All facilities mode with no facilities → Empty results, not error
  - User tries to query facility D in "all facilities" mode → D not included

REPORTING:
  - Results grouped by facility for clarity
  - Report shows facility names, not just IDs
```

**Implementation Hints:**
```csharp
public IQueryable<Resident> GetResidents()
{
    var query = _db.Residents.AsQueryable();
    
    if (ActiveFacilityId.HasValue)
        query = query.Where(r => r.FacilityId == ActiveFacilityId);
    else
        query = query.Where(r => AccessibleFacilities.Select(f => f.Id).Contains(r.FacilityId));
    
    return query;
}
```

### UC1.5: Storage Path Prefixing

**AI SKILL:** None  
**AI CONTEXT:** Azure Blob Storage, path conventions, tenant safety  
**AI ROLE:** Implement tenant-safe file paths with automatic prefixing

```
GIVEN current context is Company "acme", Facility "building-a"
WHEN requesting storage path for "resident-photo.jpg"
THEN path should be "acme/building-a/resident-photo.jpg"
AND container should be validated for tenant (e.g., "documents" container)
AND SAS URL should have limited scope (can't access other tenants' files)

UNIT TEST: Mock context, verify path construction
  - ICompanyContext.CompanyId = <acme-guid>
  - IFacilityContext.ActiveFacilityId = <building-a-guid>
  - IStorageContext.GetPath("resident-photo.jpg")
  - Assert path == "acme/building-a/resident-photo.jpg"

INTEGRATION TEST: Upload to Azurite (local blob emulator)
  - Start Azurite container
  - Upload file via IStorageContext
  - Verify file at correct path
  - Verify SAS URL works for download
  - Verify SAS URL expires after 1 hour

NEGATIVE TESTS:
  - Path traversal attempts (../, ..\, absolute paths) → Sanitized/rejected
  - Cross-tenant path access (manually construct path to Company B) → 403 Forbidden
  - Special characters in filename → Sanitized or rejected

SECURITY:
  - SAS URLs expire (1 hour for download, 5 min for upload)
  - SAS URLs scoped to specific blob (can't list container)
```

**Implementation Hints:**
```csharp
public interface IStorageContext
{
    string GetBlobPath(string fileName);
    string GetSasUrl(string blobPath, TimeSpan expiry);
}

public string GetBlobPath(string fileName)
{
    var companyName = SanitizePath(_companyContext.CompanyName);
    var facilityName = SanitizePath(_facilityContext.ActiveFacilityName);
    var safeName = SanitizePath(fileName);
    
    return $"{companyName}/{facilityName}/{safeName}";
}
```

### UC1.6: Cache Key Prefixing

**AI SKILL:** None  
**AI CONTEXT:** FusionCache, Redis, key formatting, tenant isolation  
**AI ROLE:** Implement automatic tenant-prefixed cache keys

```
GIVEN current context is Company "acme" (ID: <guid>), Facility "building-a" (ID: <guid>)
WHEN caching value with key "residents:active"
THEN cache key should be "<acme-guid>:<building-a-guid>:residents:active"
AND cache lookup uses same prefix automatically
AND invalidation can target company or facility (e.g., invalidate "acme:*")

UNIT TEST: Mock cache, verify key format
  - ICacheContext.GetCacheKey("residents:active")
  - Assert key format matches "<companyId>:<facilityId>:residents:active"

INTEGRATION TEST: Real Redis via Docker, verify isolation
  - Start Redis container
  - Cache value for Company A, Facility X
  - Switch context to Company B, Facility Y
  - Cache same logical key
  - Assert both values stored separately (no collision)
  - Assert Company A can't access Company B's cached data

NEGATIVE TESTS:
  - Cache key collision across tenants → Impossible (enforced by prefix)
  - Invalidate wrong tenant → No effect on other tenants
  - Malicious key (contains colons) → Rejected or sanitized

PERFORMANCE:
  - Key construction < 0.1ms (string interpolation)
  - Cache lookup with prefix < 1ms (L1) or < 10ms (L2 Redis)
```

**Implementation Hints:**
```csharp
public interface ICacheContext
{
    string GetCacheKey(string logicalKey);
    string GetInvalidationPrefix(); // for bulk invalidation
}

public string GetCacheKey(string logicalKey)
{
    if (logicalKey.Contains(':'))
        throw new ArgumentException("Logical key cannot contain colons");
    
    var companyId = _companyContext.CompanyId;
    var facilityId = _facilityContext.ActiveFacilityId ?? Guid.Empty;
    
    return $"{companyId}:{facilityId}:{logicalKey}";
}
```

### UC1.7: Message Tenant Tagging

**AI SKILL:** None  
**AI CONTEXT:** RabbitMQ, message envelope pattern, async messaging  
**AI ROLE:** Implement tenant context in message envelopes

```
GIVEN current context is Company "acme", Facility "building-a"
WHEN publishing ResidentAdmittedEvent { ResidentId: <guid>, Name: "John Doe" }
THEN message envelope should include CompanyId and FacilityId
  - Envelope: { CompanyId: <guid>, FacilityId: <guid>, Payload: { ResidentId, Name } }
AND consumer should restore context from envelope before processing
AND filtering should prevent cross-tenant processing

UNIT TEST: Mock message bus, verify envelope structure
  - Publish event via IMessagePublisher
  - Assert envelope contains CompanyId, FacilityId, Payload
  - Assert Payload serialized correctly

INTEGRATION TEST: Real RabbitMQ via Docker, publish and consume
  - Start RabbitMQ container
  - Publish event from Company A context
  - Consume event
  - Assert consumer context restored to Company A
  - Assert consumer can query Company A's data

NEGATIVE TESTS:
  - Message without tenant context → Rejected (dead letter queue)
  - Consumer processes wrong tenant → Detected and logged as error
  - Message from Company A consumed by handler expecting Company B → Context mismatch error

RELIABILITY:
  - At-least-once delivery (ack after processing)
  - Dead letter queue for invalid messages
```

**Implementation Hints:**
```csharp
public class MessageEnvelope<T>
{
    public Guid CompanyId { get; set; }
    public Guid? FacilityId { get; set; }
    public Guid CorrelationId { get; set; }
    public DateTime Timestamp { get; set; }
    public T Payload { get; set; }
}

// Publisher
public async Task PublishAsync<T>(T message)
{
    var envelope = new MessageEnvelope<T>
    {
        CompanyId = _companyContext.CompanyId,
        FacilityId = _facilityContext.ActiveFacilityId,
        CorrelationId = Guid.NewGuid(),
        Timestamp = DateTime.UtcNow,
        Payload = message
    };
    
    await _messageBus.PublishAsync(envelope);
}

// Consumer
public async Task ConsumeAsync<T>(MessageEnvelope<T> envelope)
{
    // Restore context
    _companyContext.SetContext(envelope.CompanyId);
    _facilityContext.SetContext(envelope.FacilityId);
    
    // Process with correct context
    await _handler.HandleAsync(envelope.Payload);
}
```

### UC1.8: Observability Enrichment

**AI SKILL:** None  
**AI CONTEXT:** OpenTelemetry, structured logging, tracing, metrics  
**AI ROLE:** Implement automatic tenant context in traces and logs

```
GIVEN current context is Company "acme", Facility "building-a", User "john@example.com"
WHEN logging or creating span
THEN log entry includes companyId, facilityId, userId fields
AND trace includes tenant tags (baggage in OpenTelemetry)
AND metrics have tenant dimensions

UNIT TEST: Mock logger, verify structured data
  - ILogger.LogInformation("Processing resident")
  - Assert log entry contains: { companyId, facilityId, userId, message }

INTEGRATION TEST: Real OpenTelemetry exporter, query for tenant data
  - Configure OTLP exporter to console or Jaeger
  - Make request as Company A
  - Verify trace span has tags: company=acme, facility=building-a
  - Verify logs have structured fields

NEGATIVE TESTS:
  - Missing context → Logs indicate "unknown tenant" (not null or error)
  - Sensitive data (PII) → Never logged (no SSN, DOB in logs)
  - Performance overhead → < 1ms per log/trace (minimal)

COMPLIANCE:
  - No PII in logs (HIPAA violation)
  - Tenant ID logged for audit trail
  - User ID logged for accountability
```

**Implementation Hints:**
```csharp
// Middleware to enrich logs
public class TenantLoggingMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        using (LogContext.PushProperty("CompanyId", _companyContext.CompanyId))
        using (LogContext.PushProperty("FacilityId", _facilityContext.ActiveFacilityId))
        using (LogContext.PushProperty("UserId", _currentUser.UserId))
        {
            await next(context);
        }
    }
}

// OpenTelemetry trace enrichment
Activity.Current?.SetTag("tenant.company", _companyContext.CompanyId);
Activity.Current?.SetTag("tenant.facility", _facilityContext.ActiveFacilityId);
Activity.Current?.SetTag("user.id", _currentUser.UserId);
```

---

## Integration Tests Summary

All integration tests use:
- **TestServer** (ASP.NET Core in-memory server for HTTP tests)
- **SQLite** (in-memory database for company/facility lookups)
- **Azurite** (local blob storage emulator, if testing storage paths)
- **Redis** (Docker container, if testing cache keys)
- **RabbitMQ** (Docker container, if testing message envelopes)

**Test Execution:**
```bash
# Run all Module 1 tests
dotnet test --filter "Module=PlatformCore"

# Run only unit tests (fast)
dotnet test --filter "Module=PlatformCore&Category=Unit"

# Run only integration tests (with Docker)
dotnet test --filter "Module=PlatformCore&Category=Integration"
```

**Success Criteria:**
- ✓ All 8 use cases implemented
- ✓ All unit tests passing (100%)
- ✓ All integration tests passing (100%)
- ✓ Code coverage > 80%
- ✓ No tenant data leaks (verified by cross-tenant isolation tests)
- ✓ Performance targets met (context resolution < 1ms)

---

## Documentation Deliverables

### README.md
```markdown
# Platform.Core - Context Abstractions

## Overview
This module provides focused context abstractions for multi-tenancy.

## Usage Examples

### Company Context
```csharp
public class ResidentService
{
    private readonly ICompanyContext _company;
    
    public ResidentService(ICompanyContext company)
    {
        _company = company;
    }
    
    public async Task<Resident> GetResidentAsync(Guid id)
    {
        // CompanyId automatically included in query via global filter
        return await _db.Residents.FindAsync(id);
    }
}
```

### Facility Context
```csharp
public class DashboardController : Controller
{
    private readonly IFacilityContext _facility;
    
    [HttpPost("switch-facility")]
    public async Task<IActionResult> SwitchFacility(Guid facilityId)
    {
        await _facility.SwitchFacilityAsync(facilityId);
        return RedirectToAction("Index");
    }
}
```

## Testing
See `tests/Platform.Core.Tests` for examples.
```

### API Documentation (XML Comments)
Every public interface and method must have XML comments for IntelliSense.

---

## Implementation Checklist

- [ ] All 8 context interfaces defined (ICompanyContext, IFacilityContext, etc.)
- [ ] Middleware for subdomain resolution implemented
- [ ] Middleware for claims resolution implemented
- [ ] Facility switching logic implemented
- [ ] Storage path prefixing implemented
- [ ] Cache key prefixing implemented
- [ ] Message envelope tagging implemented
- [ ] Observability enrichment implemented
- [ ] All unit tests written and passing
- [ ] All integration tests written and passing
- [ ] Code coverage > 80%
- [ ] README.md updated with usage examples
- [ ] XML comments on all public APIs
- [ ] Performance benchmarks met (< 1ms context resolution)
- [ ] Tenant isolation verified (cross-tenant tests)

**DO NOT MARK COMPLETE UNTIL ALL TESTS PASS.**

---

END OF MODULE 1 SPECIFICATION
