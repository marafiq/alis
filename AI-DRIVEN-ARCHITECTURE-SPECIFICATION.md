# Senior Living Platform - AI-Driven Architecture Specification
## .NET 10 Modular Monolith Migration from .NET Framework MVC

**Document Purpose:** Complete specification for AI-driven TDD implementation using Aspire + Docker  
**Target Audience:** AI Agents implementing modules independently  
**Approach:** Each module = Complete AI task with Skills, Context, Role, Features, Constraints, and TDD Use Cases

---

## Executive Summary

### Current State (Existing .NET Framework MVC Application)

**Technology Stack:**
- .NET Framework 4.8 MVC
- Entity Framework 6
- SQL Server (4 separate databases)
- Multi-tenant via subdomain detection
- Shared tenant database with CompanyId discriminator

**Database Architecture:**
1. **Admin Database** - Company mappings, users, claims, entitlements, feature flags, audit logs
2. **Tenant Database(s)** - Residents, care logs, billing, scheduling, medications (CompanyId + FacilityId filtered)
3. **FamiliesConnect Database** - Family portal, cross-company family relationships
4. **Cosmos DB** - Event sourcing, activity timelines, analytics

**Infrastructure Components:**
- **Storage:** Azure Blob (primary), Cloudinary (CDN/optimization), Local (dev/logging)
- **Caching:** Redis (L2), In-Memory (L1), FusionCache (orchestration)
- **Messaging:** RabbitMQ (async), Azure Service Bus (functions), SignalR (real-time)
- **Background Jobs:** Hangfire (recurring/scheduled), Azure Functions (long-running exports)
- **Authentication:** Cookie-based (primary), Azure Entra ID (SSO), Managed Identity (service-to-service)
- **Observability:** OpenTelemetry, Azure Monitor, Application Insights
- **HTTP Integrations:** Refit (typed clients), Polly (resilience), 50+ external APIs

**Domain Model:**
```
COMPANY (Customer organization, e.g., "Sunrise Senior Living")
    ↓ maps to
DATABASE(S) (One company → 1+ databases, or multiple companies → 1 shared database)
    ↓ contains
FACILITY(IES) (Physical locations, e.g., "Sunrise of Arlington")
    ↓ houses
RESIDENTS (People receiving care)
```

**Multi-Tenancy Pattern:**
- Subdomain-based tenant resolution (acme.platform.com, demo.platform.com)
- AsyncLocal context propagation throughout request
- All queries filtered by CompanyId (always) + FacilityId (usually)
- User can switch active facility or use "All Facilities" mode

**Pain Points Being Addressed:**
- Tight coupling, difficult to test
- No proper abstractions for multi-tenancy
- EF6 limitations (no async everywhere, poor LINQ translation)
- No modular boundaries
- Mixed concerns across layers
- Difficult local development environment

---

### Target State (.NET 10 Modular Monolith)

**Technology Stack:**
- .NET 10 (latest features)
- Entity Framework Core 10 (with SQLite for local dev)
- Aspire for orchestration
- Docker containers for all dependencies
- Modular monolith architecture (modules can become microservices later)

**Key Architectural Principles:**
1. **Design Through Abstractions, Not Implementations** - Brilliant abstractions make implementation inevitable
2. **Constraints → Invariants → Patterns → Checklists** - Systematic design approach
3. **TDD Mandatory** - Every feature starts with failing tests
4. **Local-First Development** - Full stack runs on laptop with Aspire + Docker
5. **Composed Contexts, Not God Objects** - Single responsibility, easily testable
6. **Developer Experience is Paramount** - Pit of success, discoverability, fast feedback

**Module Boundaries:**
```
Platform.Core/                  # Cross-cutting contexts (Company, Facility, Database, etc.)
Platform.Data/                  # Data access (DbContexts, repositories, migrations)
Platform.Auth/                  # Authentication & authorization
Platform.FeatureFlags/          # Feature flag management
Platform.Storage/               # Blob + Local storage
Platform.FrequentAssets/        # Cloudinary hot cache
Platform.Caching/               # FusionCache + Redis
Platform.Messaging/             # RabbitMQ + SignalR + Service Bus
Platform.BackgroundJobs/        # Hangfire + Azure Functions
Platform.Integrations/          # HTTP clients (Refit + Polly)
Platform.Observability/         # OpenTelemetry setup
Platform.Admin/                 # Admin module (companies, users, facilities)
Platform.Residents/             # Residents module (care, medications, billing)
Platform.Families/              # Family portal module
Platform.Web/                   # MVC controllers, views, middleware
```

**Migration Strategy:**
- Build new platform alongside existing (strangler pattern possible)
- Shared databases initially (same Admin, Tenant, Families, Cosmos DBs)
- Gradual feature migration (prove framework with POCs, then migrate business logic)
- 30-week phased approach (12 weeks framework, 18 weeks business logic migration)

---

## AI Implementation Guidelines

### Required AI Skills

Each module specification will reference the relevant skills needed:

**Available Skills:**
- `/mnt/skills/public/docx/SKILL.md` - For documentation generation
- `/mnt/skills/public/xlsx/SKILL.md` - For tracking spreadsheets
- Additional skills can be created as needed for specialized tasks

### AI Context Template

For each module, AI agents should have this context:

```
ROLE: Senior .NET Engineer specializing in [MODULE_DOMAIN]
EXPERTISE: .NET 10, EF Core 10, TDD, Multi-tenant architectures, [SPECIFIC_TECH]
APPROACH: Test-First, SOLID principles, Pragmatic design
CONSTRAINTS: [MODULE_SPECIFIC_CONSTRAINTS]
TESTING: xUnit, FluentAssertions, Testcontainers for integration tests
ENVIRONMENT: Aspire + Docker for all dependencies
```

### Standard TDD Workflow

Every feature must follow this workflow:

1. **Write Failing Test** - Define expected behavior
2. **Implement Minimum Code** - Make test pass
3. **Refactor** - Improve design while tests stay green
4. **Integration Test** - Verify with real dependencies (Docker)
5. **Documentation** - Update module README with usage examples

### Test Categorization

```
Unit Tests (60%)
    • Pure business logic
    • In-memory providers
    • Fast (< 100ms each)
    • No external dependencies

Integration Tests (30%)
    • Real infrastructure via Docker
    • Database, cache, message bus
    • Medium speed (< 5s each)
    • Testcontainers for isolation

E2E Tests (10%)
    • Full user workflows
    • Playwright for browser automation
    • Slow but comprehensive
    • Smoke tests in CI/CD
```

---

## Module Specifications

---

## MODULE 1: Platform.Core - Context Abstractions

### AI Agent Context

```yaml
role: Senior .NET Architect specializing in Multi-Tenant Abstractions
expertise:
  - .NET 10 DI and service lifetimes
  - AsyncLocal for context propagation
  - Middleware pipeline design
  - SOLID principles and ISP (Interface Segregation)
approach: Design elegant abstractions that prevent tenant data leaks
testing_framework: xUnit + FluentAssertions + NSubstitute
environment: Aspire + SQLite (no external dependencies for this module)
```

### Must-Have Features

**F1: Company Context Abstraction**
- Resolve current company from subdomain or claims
- Provide CompanyId, CompanyName, Tier, DatabaseMapping
- Thread-safe context propagation via AsyncLocal
- No nulls - fail fast if context missing

**F2: Facility Context Abstraction**
- Track active facility for current user
- Support "All Facilities" mode (nullable ActiveFacilityId)
- Provide list of accessible facilities
- Switch facility operation with validation

**F3: Database Context Abstraction**
- Determine which database connection for current company
- Support read replica routing
- Provide connection strings for Admin, Tenant, Families, Cosmos
- Handle company → multiple databases scenario

**F4: Storage Context Abstraction**
- Provide tenant-prefixed paths for blob storage
- Separate containers per company, folders per facility
- Generate SAS URLs with appropriate expiry
- Support local file system for development

**F5: Cache Context Abstraction**
- Provide tenant-prefixed cache keys
- Format: `{companyId}:{facilityId}:{key}`
- Prevent cross-tenant cache pollution
- Cache invalidation by tenant

**F6: Messaging Context Abstraction**
- Tag messages with CompanyId and FacilityId
- Route messages to tenant-specific handlers
- Prevent cross-tenant message leaking
- Support SignalR group management

**F7: Observability Context Abstraction**
- Inject CompanyId, FacilityId, UserId into trace context
- Enrich logs with tenant information
- Metrics with tenant dimensions
- Distributed tracing across modules

**F8: Context Composition**
- All contexts injectable independently
- No monolithic ITenantContext
- Compose contexts as needed per module
- Testable via interface mocking

### Constraints

**C1: Zero Tenant Data Leaks**
- INVARIANT: A query for Company A must NEVER return data from Company B
- Enforce at context level, not trust developers to remember filters
- Global query filters applied automatically in DbContext
- Context validation in middleware before request processing

**C2: Context Lifecycle**
- Scoped lifetime (per HTTP request)
- AsyncLocal propagation to background threads (Hangfire, etc.)
- Fail fast if context accessed outside valid scope
- Clear context at end of request

**C3: Performance**
- Context resolution < 1ms overhead
- Cache context lookups (company → database mapping)
- No N+1 context queries
- Lazy loading of context properties where appropriate

**C4: Developer Experience**
- IntelliSense-friendly interfaces
- Null-safe APIs (use exceptions, not nulls)
- Helpful exception messages with remediation steps
- Auto-complete for context properties

**C5: Testability**
- All contexts mockable via interfaces
- In-memory implementations for unit tests
- Test helpers for setting up context in tests
- No static dependencies

### TDD Use Cases

**UC1.1: Resolve Company from Subdomain**
```
AI SKILL: None (pure code)
AI CONTEXT: ASP.NET Core middleware, subdomain parsing
AI ROLE: Implement middleware for tenant resolution

GIVEN a request to "acme.platform.com"
WHEN CompanyContext is resolved
THEN CompanyId should be the ID for "acme"
AND CompanyName should be "Acme Corporation"
AND Tier should be from database lookup
AND DatabaseMapping should be resolved

UNIT TEST: Mock HTTP context with subdomain header
INTEGRATION TEST: Real request via TestServer with SQLite

NEGATIVE TESTS:
- Invalid subdomain → 404 Not Found
- Subdomain not in database → 404 Not Found
- Missing subdomain → 400 Bad Request
```

**UC1.2: Resolve Company from Claims**
```
AI SKILL: None
AI CONTEXT: ASP.NET Core authentication, ClaimsPrincipal
AI ROLE: Implement claims-based tenant resolution

GIVEN a JWT with claim "companyId: <guid>"
WHEN CompanyContext is resolved
THEN CompanyId should match claim value
AND database lookup should validate company exists

UNIT TEST: Mock ClaimsPrincipal
INTEGRATION TEST: Real JWT validation

NEGATIVE TESTS:
- Missing companyId claim → 401 Unauthorized
- Invalid company ID → 403 Forbidden
- Company disabled → 403 Forbidden
```

**UC1.3: Switch Facility**
```
AI SKILL: None
AI CONTEXT: Facility selection, user permissions
AI ROLE: Implement facility switching with validation

GIVEN user has access to Facility A and Facility B
WHEN user switches to Facility A
THEN ActiveFacilityId should be Facility A's ID
AND subsequent queries should filter by Facility A
AND user session should remember facility choice

UNIT TEST: Mock facility access list
INTEGRATION TEST: Real database with facility permissions

NEGATIVE TESTS:
- Switch to facility without access → 403 Forbidden
- Switch to non-existent facility → 404 Not Found
- Switch to facility in different company → 403 Forbidden
```

**UC1.4: All Facilities Mode**
```
AI SKILL: None
AI CONTEXT: Reporting, cross-facility queries
AI ROLE: Implement "All Facilities" mode for reporting

GIVEN user has access to Facilities A, B, C
WHEN user enables "All Facilities" mode
THEN ActiveFacilityId should be NULL
AND queries should return data from A, B, C only (not other facilities)
AND reports should group by facility

UNIT TEST: Mock accessible facilities
INTEGRATION TEST: Real database with multi-facility data

NEGATIVE TESTS:
- All facilities mode with single facility → Works, returns only that facility
- All facilities mode with no facilities → Empty results, not error
```

**UC1.5: Storage Path Prefixing**
```
AI SKILL: None
AI CONTEXT: Azure Blob Storage, path conventions
AI ROLE: Implement tenant-safe file paths

GIVEN current context is Company "acme", Facility "building-a"
WHEN requesting storage path for "document.pdf"
THEN path should be "acme/building-a/document.pdf"
AND container should be validated for tenant
AND SAS URL should have limited scope

UNIT TEST: Mock context, verify path construction
INTEGRATION TEST: Upload to Azurite (local blob emulator)

NEGATIVE TESTS:
- Path traversal attempts (../) → Sanitized/blocked
- Cross-tenant path access → 403 Forbidden
```

**UC1.6: Cache Key Prefixing**
```
AI SKILL: None
AI CONTEXT: FusionCache, Redis
AI ROLE: Implement tenant-safe cache keys

GIVEN current context is Company "acme", Facility "building-a"
WHEN caching value with key "residents:active"
THEN cache key should be "acme:building-a:residents:active"
AND cache lookup uses same prefix
AND invalidation can target company or facility

UNIT TEST: Mock cache, verify key format
INTEGRATION TEST: Real Redis via Docker

NEGATIVE TESTS:
- Cache key collision across tenants → Impossible (prefix enforced)
- Invalidate wrong tenant → No effect on other tenants
```

**UC1.7: Message Tenant Tagging**
```
AI SKILL: None
AI CONTEXT: RabbitMQ, message envelope pattern
AI ROLE: Implement tenant context in messages

GIVEN current context is Company "acme", Facility "building-a"
WHEN publishing ResidentAdmittedEvent
THEN message envelope should include CompanyId and FacilityId
AND consumer should restore context from envelope
AND filtering should prevent cross-tenant processing

UNIT TEST: Mock message bus, verify envelope
INTEGRATION TEST: Real RabbitMQ via Docker, publish and consume

NEGATIVE TESTS:
- Message without tenant context → Rejected
- Consumer processes wrong tenant → Detected and logged
```

**UC1.8: Observability Enrichment**
```
AI SKILL: None
AI CONTEXT: OpenTelemetry, structured logging
AI ROLE: Implement tenant context in traces and logs

GIVEN current context is Company "acme", Facility "building-a"
WHEN logging or creating span
THEN log entry includes companyId and facilityId fields
AND trace includes tenant tags
AND metrics have tenant dimensions

UNIT TEST: Mock logger, verify structured data
INTEGRATION TEST: Real OpenTelemetry exporter, query for tenant data

NEGATIVE TESTS:
- Missing context → Logs indicate "unknown tenant" not null
- Sensitive data → Never log PII from context
```

---

## MODULE 2: Platform.Data - Data Access Layer

### AI Agent Context

```yaml
role: Senior Database Engineer specializing in EF Core and Multi-Tenancy
expertise:
  - EF Core 10 (global query filters, migrations, interceptors)
  - Multi-database coordination
  - Read/write splitting
  - Optimistic concurrency
  - Audit logging patterns
approach: Data integrity first, zero tolerance for data leaks
testing_framework: xUnit + Testcontainers.SqlServer (or SQLite for speed)
environment: Aspire + Docker (SQL Server, Cosmos emulator)
```

### Must-Have Features

**F1: TenantDbContext Base Class**
- Automatic CompanyId + FacilityId filtering via global query filters
- Audit fields auto-populated (CreatedAt, CreatedBy, UpdatedAt, UpdatedBy)
- Soft delete support (IsDeleted flag, excluded from queries)
- Read replica routing (.Reader() extension)
- Optimistic concurrency via RowVersion

**F2: AdminDbContext**
- No tenant filtering (cross-company data)
- Companies, CompanyDatabaseMappings, Facilities, Users, Claims
- Entitlements, FeatureFlags, AuditLogs, OutboxMessages, JobTracking
- Migrations separate from tenant DBs

**F3: FamiliesDbContext**
- No tenant filtering (cross-company family relationships)
- FamilyMembers, ResidentFamilyMappings, PortalAccessLogs
- Supports family spanning multiple companies

**F4: CosmosDbContext**
- Partition by CompanyId for performance
- Event sourcing (DomainEvents collection)
- Activity timeline (ResidentActivities collection)
- Analytics aggregations
- Point reads and queries within partition

**F5: Multi-Context Transaction Coordination**
- Unit of Work pattern for atomic commits across Admin + Tenant DBs
- Shared connection, single transaction
- Rollback on any context failure
- Outbox pattern for eventual consistency where needed

**F6: Database Migration Strategy**
- Separate migrations for Admin, Tenant, Families
- Migration runner for all tenants
- Zero-downtime migration patterns
- Rollback capability

**F7: Bulk Operations Support**
- Efficient bulk insert/update/delete (EF Core BulkExtensions)
- Preserve audit trails during bulk operations
- Transaction safety

**F8: Query Extensions**
- WhereIf (conditional filtering)
- IncludeIf (conditional eager loading)
- Pagination helpers
- Soft delete awareness

### Constraints

**C1: Tenant Isolation INVARIANT**
- Global query filters MUST be applied to all tenant entities
- No way to accidentally bypass filters (except explicit IgnoreQueryFilters)
- CompanyId and FacilityId validated from context before query execution
- Integration tests MUST verify isolation between tenants

**C2: Audit Trail Completeness**
- Every write operation MUST populate CreatedAt, CreatedBy, UpdatedAt, UpdatedBy
- User identity from ICurrentUserContext
- Timestamp from ISystemClock (UTC always)
- Audit trail immutable after creation

**C3: Performance Requirements**
- Query optimization via appropriate indexes
- No N+1 query patterns (use .Include or projection)
- Read replica for reporting queries (explicit via .Reader())
- Bulk operations for > 100 records

**C4: EF6 Compatibility**
- Preserve field names and types from existing EF6 models
- Support existing stored procedures and views
- Raw SQL queries for complex cases (preserve existing queries)
- Extension methods (WhereIf, etc.) ported from EF6 codebase

**C5: Migration Safety**
- Always generate SQL scripts for review before applying
- Test migrations on copy of production data
- Idempotent migrations (can run multiple times safely)
- Automatic rollback capability

### TDD Use Cases

**UC2.1: Global Query Filters Apply Automatically**
```
AI SKILL: None
AI CONTEXT: EF Core global query filters, multi-tenancy
AI ROLE: Implement automatic tenant filtering

GIVEN current context is Company "acme", Facility "building-a"
WHEN querying Residents without explicit filter
THEN only residents where CompanyId = "acme" AND FacilityId = "building-a" returned
AND SQL query should include WHERE clause automatically

UNIT TEST: In-memory DbContext with mock context
INTEGRATION TEST: Real SQLite with multiple tenants' data

NEGATIVE TESTS:
- Bypass attempt via IgnoreQueryFilters → Still works (explicit is fine)
- Wrong context → Returns empty results (not error)
- Missing context → Exception thrown before query executes
```

**UC2.2: All Facilities Mode Query Filtering**
```
AI SKILL: None
AI CONTEXT: EF Core dynamic query filters
AI ROLE: Implement "All Facilities" query logic

GIVEN current context is Company "acme", ActiveFacilityId = NULL (All Facilities mode)
WHEN querying Residents
THEN only residents where CompanyId = "acme" returned (FacilityId not filtered)
AND user has access to Facilities A, B, C only
AND results only include residents from A, B, C

UNIT TEST: Mock context with accessible facilities
INTEGRATION TEST: Real database with multi-facility data

NEGATIVE TESTS:
- User has no facility access → Empty results
- Facilities list contains facility from other company → Filtered out
```

**UC2.3: Audit Fields Auto-Populated on Insert**
```
AI SKILL: None
AI CONTEXT: EF Core interceptors, SaveChanges override
AI ROLE: Implement audit field population

GIVEN current user is "john@example.com" (UserId: <guid>)
WHEN inserting new Resident entity
THEN CreatedAt should be current UTC timestamp
AND CreatedBy should be "john@example.com"'s UserId
AND UpdatedAt should equal CreatedAt
AND UpdatedBy should equal CreatedBy

UNIT TEST: Mock ICurrentUserContext and ISystemClock
INTEGRATION TEST: Real DbContext save to SQLite

NEGATIVE TESTS:
- Missing current user → Exception (cannot audit without user)
- Null timestamp → Exception (system clock required)
```

**UC2.4: Audit Fields Auto-Populated on Update**
```
AI SKILL: None
AI CONTEXT: EF Core change tracking
AI ROLE: Track updates with audit fields

GIVEN existing Resident with CreatedAt/CreatedBy from insert
WHEN updating Resident.Name
THEN UpdatedAt should be current UTC timestamp
AND UpdatedBy should be current user's UserId
AND CreatedAt/CreatedBy should NOT change

UNIT TEST: Track entity, modify, verify fields
INTEGRATION TEST: Save, load, modify, save again

NEGATIVE TESTS:
- Manually set UpdatedAt → Overwritten by system
- Update without user context → Exception
```

**UC2.5: Soft Delete Hides Records**
```
AI SKILL: None
AI CONTEXT: EF Core soft delete pattern
AI ROLE: Implement IsDeleted filtering

GIVEN Resident exists with IsDeleted = false
WHEN setting IsDeleted = true and saving
THEN subsequent queries should NOT return this resident
AND DeletedAt timestamp should be set
AND DeletedBy should be current user
AND hard queries with IgnoreQueryFilters still find it

UNIT TEST: Mark deleted, verify query exclusion
INTEGRATION TEST: Real database, verify COUNT decreases

NEGATIVE TESTS:
- Soft deleted entity included in navigation → Filtered out
- Soft delete cascade → Dependent entities also marked deleted (if configured)
```

**UC2.6: Cross-Context Transaction Success**
```
AI SKILL: None
AI CONTEXT: EF Core transactions, Unit of Work pattern
AI ROLE: Implement atomic multi-context commits

GIVEN Unit of Work managing AdminDbContext and TenantDbContext
WHEN inserting Resident (Tenant DB) + AuditLog (Admin DB)
THEN both commits succeed
AND transaction committed only after both SaveChanges succeed

UNIT TEST: Mock contexts, verify save order
INTEGRATION TEST: Real SQLite DBs, verify atomicity

POSITIVE TEST:
- Both succeed → Both records persisted
```

**UC2.7: Cross-Context Transaction Rollback**
```
AI SKILL: None
AI CONTEXT: Transaction rollback, error handling
AI ROLE: Ensure rollback on partial failure

GIVEN Unit of Work managing AdminDbContext and TenantDbContext
WHEN inserting Resident succeeds but AuditLog fails (constraint violation)
THEN transaction should rollback
AND Resident should NOT be persisted
AND exception should bubble up

INTEGRATION TEST: Real SQLite DBs, verify rollback

NEGATIVE TEST:
- First context succeeds, second fails → Neither persisted
```

**UC2.8: Read Replica Routing**
```
AI SKILL: None
AI CONTEXT: EF Core connection string management
AI ROLE: Implement read replica routing

GIVEN tenant "acme" has read replica configured
WHEN executing query with .Reader() extension
THEN query should use read connection string
AND write queries use write connection string
AND tenant without replica uses write for both

UNIT TEST: Mock DbContextFactory, verify connection strings
INTEGRATION TEST: Real SQL Server primary + replica (or 2 SQLite files)

NEGATIVE TESTS:
- Read replica down → Fallback to primary (resilience)
- Write on read context → Exception (read-only connection)
```

**UC2.9: Bulk Insert with Audit Trail**
```
AI SKILL: None
AI CONTEXT: EF Core bulk extensions, audit logging
AI ROLE: Implement high-performance bulk operations

GIVEN 1000 Resident entities to insert
WHEN using BulkInsertAsync
THEN all entities inserted in single batch
AND audit fields populated for all
AND operation completes in < 1 second

UNIT TEST: Verify audit field population in batch
INTEGRATION TEST: Real database, measure performance

CONSTRAINTS:
- Batch size limit: 1000 records per batch
- Must preserve transaction atomicity
```

**UC2.10: Migration Execution for All Tenants**
```
AI SKILL: None
AI CONTEXT: EF Core migrations, multi-tenant databases
AI ROLE: Implement safe migration runner

GIVEN migration "AddResidentSocialSecurityNumber"
WHEN running migration for all tenant databases
THEN migration applied to each tenant DB sequentially
AND success/failure logged per tenant
AND rollback on failure option available
AND idempotent (safe to run multiple times)

INTEGRATION TEST: Real SQLite DBs for multiple tenants

CONSTRAINTS:
- Migration must complete in < 5 minutes per tenant
- Zero downtime requirement (use online migrations)
- Must handle new tenants added during migration
```

---

## MODULE 3: Platform.Auth - Authentication & Authorization

### AI Agent Context

```yaml
role: Security Engineer specializing in Multi-Tenant Authentication
expertise:
  - ASP.NET Core Identity
  - OAuth2, OpenID Connect, SAML
  - Azure Entra ID integration
  - Claims-based authorization
  - Cookie and JWT authentication
approach: Security-first, defense in depth
testing_framework: xUnit + WebApplicationFactory for auth flows
environment: Aspire + Docker (SQL Server for identity store)
```

### Must-Have Features

**F1: Hybrid Authentication**
- Cookie-based for web UI (primary)
- JWT for API calls (mobile, SPAs)
- Azure Entra ID SSO for enterprise customers
- Managed Identity for service-to-service

**F2: Claims & Entitlements**
- Claims: UserId, Email, Roles, CompanyId, FacilityAccess
- Entitlements: Permissions, Feature flags, Data access rules
- Claims from database, cached for performance
- Dynamic facility access (user can be granted/revoked)

**F3: Role-Based Access Control (RBAC)**
- Predefined roles: SuperAdmin, CompanyAdmin, FacilityAdmin, Nurse, Caregiver, FamilyMember
- Custom roles per company
- Role hierarchy (SuperAdmin > CompanyAdmin > FacilityAdmin)
- Permission-based (granular) on top of roles

**F4: Multi-Level Authorization**
- Platform level (SuperAdmin only)
- Company level (CompanyAdmin can manage own company)
- Facility level (FacilityAdmin scoped to facilities)
- Data level (only accessible facilities' data)

**F5: SSO Integration**
- Azure Entra ID via OpenID Connect
- SAML for legacy enterprise systems
- User provisioning (JIT or pre-provisioned)
- Group mapping to roles

**F6: API Authentication**
- API Keys for external integrations (medical records, etc.)
- OAuth2 Client Credentials for service-to-service
- JWT Bearer for mobile/SPA
- Scoped permissions per API key

**F7: Session Management**
- Persistent sessions (remember me)
- Sliding expiration
- Concurrent session limits
- Force logout capability

**F8: Password Policies**
- Complexity requirements (configurable per company)
- Expiration policies
- Password history
- Account lockout after failed attempts

### Constraints

**C1: Zero Trust - Always Verify**
- Every request authenticated (except public endpoints)
- Every action authorized (check permissions)
- Claims validated on every request (not just login)
- Tenant context validated matches claims

**C2: Least Privilege**
- Users granted minimum necessary permissions
- Default deny (explicit grant required)
- Time-bound access where appropriate
- Audit all permission changes

**C3: Secure Defaults**
- Strong password policy enabled
- MFA encouraged (optional per company)
- Secure cookies (HttpOnly, Secure, SameSite)
- Short-lived JWTs (15 min, refresh token for long sessions)

**C4: Compliance**
- HIPAA-compliant audit logging (PHI access)
- SOC 2 controls (access review, least privilege)
- GDPR (user consent, data access requests)
- Disable account, not delete (audit trail preservation)

**C5: Performance**
- Claims cached (5 min TTL, invalidate on change)
- Entitlements cached (1 min TTL)
- Facility access list cached per user
- No database hit per request (only cache or token validation)

### TDD Use Cases

**UC3.1: Cookie Authentication - Login**
```
AI SKILL: None
AI CONTEXT: ASP.NET Core authentication middleware
AI ROLE: Implement cookie-based login

GIVEN valid username and password
WHEN POST /auth/login
THEN authentication cookie issued
AND user redirected to dashboard
AND ClaimsPrincipal contains UserId, Email, CompanyId, Roles

UNIT TEST: Mock UserManager, verify cookie creation
INTEGRATION TEST: Real request with TestServer

NEGATIVE TESTS:
- Invalid password → 401 with error message
- Account locked → 403 with unlock instructions
- User disabled → 403
```

**UC3.2: JWT Authentication - API Call**
```
AI SKILL: None
AI CONTEXT: JWT Bearer authentication
AI ROLE: Implement JWT issuance and validation

GIVEN valid API credentials
WHEN POST /api/token
THEN JWT returned with 15min expiry
AND refresh token issued
AND subsequent API calls with Bearer token succeed

UNIT TEST: Mock token generation, verify claims
INTEGRATION TEST: Real token generation and validation

NEGATIVE TESTS:
- Expired JWT → 401, must refresh
- Tampered JWT → 401
- Missing Bearer header → 401
```

**UC3.3: Azure Entra ID SSO**
```
AI SKILL: None
AI CONTEXT: OpenID Connect, Azure Entra ID
AI ROLE: Implement SSO authentication flow

GIVEN user from enterprise customer with SSO enabled
WHEN accessing /auth/login
THEN redirect to Azure Entra ID login
AND after successful auth, user redirected to app
AND claims mapped from Entra ID to application claims
AND JIT user provisioning if user doesn't exist

INTEGRATION TEST: Mock OIDC provider or use test Entra ID tenant

NEGATIVE TESTS:
- Entra ID user not in allowed domain → 403
- Email domain doesn't match company → 403
- Entra ID error → Error page with support instructions
```

**UC3.4: Authorization - Facility Access**
```
AI SKILL: None
AI CONTEXT: ASP.NET Core authorization policies
AI ROLE: Implement facility-scoped authorization

GIVEN user has access to Facility A only
WHEN GET /api/residents?facilityId=B
THEN 403 Forbidden (user lacks facility access)

GIVEN user has access to Facilities A and B
WHEN GET /api/residents?facilityId=A
THEN 200 OK with residents from Facility A

UNIT TEST: Mock authorization handler with facility claims
INTEGRATION TEST: Real request with facility access validation

POSITIVE TESTS:
- User accesses allowed facility → Success
- SuperAdmin accesses any facility → Success (override)
```

**UC3.5: Authorization - Permission-Based**
```
AI SKILL: None
AI CONTEXT: Custom authorization policies
AI ROLE: Implement granular permission checks

GIVEN user has permission "Residents.View" but not "Residents.Edit"
WHEN GET /api/residents/123 → 200 OK
WHEN PUT /api/residents/123 → 403 Forbidden

UNIT TEST: Mock permission store
INTEGRATION TEST: Real database with user permissions

NEGATIVE TESTS:
- No permission → 403
- Permission revoked mid-session → 403 on next request (cache invalidated)
```

**UC3.6: API Key Authentication**
```
AI SKILL: None
AI CONTEXT: Custom authentication handler for API keys
AI ROLE: Implement API key validation

GIVEN external integration with valid API key in X-API-Key header
WHEN calling /api/webhooks/medical-records
THEN request authenticated as service account
AND scoped to specific company (API key is company-specific)
AND rate limiting applied per API key

UNIT TEST: Mock API key validation
INTEGRATION TEST: Real request with test API key

NEGATIVE TESTS:
- Invalid API key → 401
- Expired API key → 401
- API key for wrong company → 403
- Missing API key → 401
```

**UC3.7: Claims Caching and Invalidation**
```
AI SKILL: None
AI CONTEXT: Distributed caching for claims
AI ROLE: Implement cached claims with invalidation

GIVEN user's claims cached with 5 min TTL
WHEN user's facility access changed by admin
THEN cache invalidated immediately
AND next request loads fresh claims

UNIT TEST: Mock cache, verify invalidation
INTEGRATION TEST: Real Redis cache

CONSTRAINTS:
- Cache miss → Load from database (< 100ms)
- Cache invalidation → Push to all app instances via backplane (Redis Pub/Sub)
```

**UC3.8: Account Lockout After Failed Attempts**
```
AI SKILL: None
AI CONTEXT: ASP.NET Core Identity lockout
AI ROLE: Implement brute force protection

GIVEN account lockout policy: 5 failed attempts → 15 min lockout
WHEN user enters wrong password 5 times
THEN account locked for 15 minutes
AND login attempts return 403 with lockout message
AND after 15 min, account unlocked automatically

UNIT TEST: Mock UserManager lockout behavior
INTEGRATION TEST: Real database with Identity tables

POSITIVE TEST:
- 4 failed attempts, then success → No lockout
```

**UC3.9: Force Logout / Session Revocation**
```
AI SKILL: None
AI CONTEXT: Session management, distributed sessions
AI ROLE: Implement admin-initiated logout

GIVEN user logged in with active session
WHEN admin forces logout
THEN user's session invalidated
AND next request requires re-authentication
AND applies to all active sessions (desktop + mobile)

INTEGRATION TEST: Real Redis session store, multi-device simulation

CONSTRAINTS:
- Logout propagates to all devices within 30 seconds
```

**UC3.10: MFA (Multi-Factor Authentication) - Optional**
```
AI SKILL: None
AI CONTEXT: TOTP (Time-based One-Time Password)
AI ROLE: Implement optional MFA for enhanced security

GIVEN company enabled MFA policy (optional for users)
WHEN user opts into MFA
THEN QR code displayed for TOTP app setup
AND subsequent logins require TOTP code after password
AND backup codes generated for account recovery

INTEGRATION TEST: Real TOTP validation with time-based codes

CONSTRAINTS:
- MFA can be enforced per company (policy)
- MFA required for SuperAdmins always
```

---

## MODULE 4: Platform.FeatureFlags - Feature Flag Management

### AI Agent Context

```yaml
role: DevOps Engineer specializing in Feature Management
expertise:
  - Feature flag patterns (gradual rollout, A/B testing, kill switches)
  - FusionCache for performance
  - Admin UI for flag management
approach: Simple, database-backed, no external dependencies
testing_framework: xUnit + Testcontainers for database
environment: Aspire + Docker (SQL Server + Redis)
```

### Must-Have Features

**F1: Global Feature Flags**
- Boolean flags (on/off globally)
- Percentage rollout (0-100%, gradual activation)
- Time window activation (start/end dates)
- Kill switches (emergency disable)

**F2: Tenant-Specific Overrides**
- Enable/disable per company
- Override global setting
- Useful for beta testing with specific customers

**F3: User-Targeting Filters**
- By role (enable for admins first)
- By percentage of users (gradual user rollout)
- Custom filters (tenant size, region, tier)

**F4: A/B Testing Support**
- Multiple variants (A, B, C...)
- Consistent user assignment (user always gets same variant)
- Metric tracking per variant

**F5: Feature Dependencies**
- Feature X requires Feature Y to be enabled
- Validation at activation time
- Prevent invalid states

**F6: Caching for Performance**
- FusionCache with 30s-5min TTL
- Backplane invalidation (when flag changed, all instances notified)
- Fallback to database on cache miss

**F7: Admin UI**
- List all flags with status
- Toggle flags with confirmation
- View flag usage/dependencies
- Audit log of flag changes

**F8: Code Integration**
- Simple API: `await _featureFlags.IsEnabledAsync("NewDashboard")`
- Attribute-based: `[FeatureGate("NewDashboard")]` on controller actions
- View helpers: `@if (await FeatureFlags.IsEnabledAsync("NewDashboard")) { ... }`

### Constraints

**C1: Zero External Dependencies**
- No Azure App Configuration (database-backed only)
- No third-party SaaS (LaunchDarkly, etc.)
- Runs entirely on-premise or in disconnected environments

**C2: Performance**
- Flag evaluation < 1ms (cache hit)
- Cache miss < 10ms (database lookup)
- No impact on request latency

**C3: Consistency**
- User always gets same variant in A/B test (hash-based assignment)
- Flag changes propagate within 30 seconds
- No "flapping" (user sees flag on, then off, then on)

**C4: Safety**
- Flag changes require confirmation (not accidental)
- Audit log of all changes (who, when, what, why)
- Rollback capability (restore previous state)

**C5: Simplicity**
- No complex targeting rules (keep it simple)
- Avoid feature flag sprawl (delete old flags)
- Clear naming conventions

### TDD Use Cases

**UC4.1: Global Feature Flag - Enabled**
```
AI SKILL: None
AI CONTEXT: Database schema, caching
AI ROLE: Implement feature flag evaluation

GIVEN feature flag "NewDashboard" is globally enabled
WHEN IsEnabledAsync("NewDashboard") called
THEN return true
AND result cached for 5 minutes

UNIT TEST: Mock database, verify caching
INTEGRATION TEST: Real database + Redis

POSITIVE TEST:
- Flag enabled → Always true
```

**UC4.2: Global Feature Flag - Disabled**
```
AI SKILL: None
AI CONTEXT: Feature flag evaluation
AI ROLE: Handle disabled flags

GIVEN feature flag "ExperimentalFeature" is globally disabled
WHEN IsEnabledAsync("ExperimentalFeature") called
THEN return false

UNIT TEST: Mock flag service
INTEGRATION TEST: Real database

POSITIVE TEST:
- Flag disabled → Always false
```

**UC4.3: Percentage Rollout**
```
AI SKILL: None
AI CONTEXT: Consistent hashing for user assignment
AI ROLE: Implement gradual rollout

GIVEN feature flag "NewReportingUI" has 50% rollout
WHEN IsEnabledForUserAsync("NewReportingUI", userId) called
THEN ~50% of users get true, ~50% get false
AND same user always gets same result (consistency)

UNIT TEST: Verify hash-based assignment, test 1000 users
INTEGRATION TEST: Real database

CONSTRAINTS:
- Hash algorithm: SHA256 of (userId + featureName)
- Distribute evenly across percentage range
```

**UC4.4: Tenant-Specific Override - Enabled**
```
AI SKILL: None
AI CONTEXT: Tenant overrides
AI ROLE: Implement company-specific flags

GIVEN feature flag "BetaFeature" is globally disabled
AND tenant "acme" has override enabled
WHEN IsEnabledAsync("BetaFeature") called in acme context
THEN return true (override wins)

WHEN called in different tenant context
THEN return false (global default)

UNIT TEST: Mock tenant context
INTEGRATION TEST: Real database, multiple tenants
```

**UC4.5: Time Window Activation**
```
AI SKILL: None
AI CONTEXT: Time-based activation
AI ROLE: Implement scheduled feature activation

GIVEN feature flag "HolidayPromotion" has start: Dec 1, end: Dec 31
WHEN IsEnabledAsync called on Dec 15
THEN return true
WHEN called on Nov 30 or Jan 1
THEN return false

UNIT TEST: Mock system clock
INTEGRATION TEST: Real database with different dates

CONSTRAINTS:
- Always use UTC for time comparisons
- Cache invalidation when entering/exiting time window
```

**UC4.6: A/B Testing - Variant Assignment**
```
AI SKILL: None
AI CONTEXT: A/B testing, consistent assignment
AI ROLE: Implement multi-variant flags

GIVEN feature flag "CheckoutFlow" has variants: A (control), B (new-flow)
WHEN GetVariantAsync("CheckoutFlow", userId) called
THEN 50% of users assigned variant A, 50% variant B
AND same user always gets same variant
AND variant stored/cached for consistent experience

UNIT TEST: Verify distribution and consistency
INTEGRATION TEST: Real database + cache

CONSTRAINTS:
- Support up to 5 variants per flag
- Equal distribution across variants (unless weighted)
```

**UC4.7: Feature Dependencies**
```
AI SKILL: None
AI CONTEXT: Feature dependency graph
AI ROLE: Validate flag dependencies

GIVEN feature flag "AdvancedReporting" depends on "NewDashboard"
WHEN attempting to enable "AdvancedReporting"
AND "NewDashboard" is disabled
THEN validation error (must enable dependency first)

UNIT TEST: Mock dependency graph
INTEGRATION TEST: Real database with dependencies

NEGATIVE TEST:
- Enable dependent without prerequisite → Error
```

**UC4.8: Cache Invalidation on Flag Change**
```
AI SKILL: None
AI CONTEXT: FusionCache backplane, Redis Pub/Sub
AI ROLE: Implement instant flag updates across instances

GIVEN feature flag "EmergencyMode" cached on all app instances
WHEN admin toggles flag in database
THEN cache invalidated via backplane (Redis Pub/Sub)
AND all instances receive fresh value within 30 seconds

INTEGRATION TEST: Real Redis, multiple app instances

CONSTRAINTS:
- Backplane message must include flag name
- Each instance evicts specific cache key
```

**UC4.9: Admin UI - Toggle Flag**
```
AI SKILL: /mnt/skills/public/frontend-design/SKILL.md
AI CONTEXT: Blazor or Razor Pages admin UI
AI ROLE: Implement flag toggle interface

GIVEN admin viewing feature flags list
WHEN clicking toggle for "NewFeature"
THEN confirmation modal shown
AND after confirmation, flag toggled in database
AND cache invalidated
AND audit log entry created

E2E TEST: Playwright automation of toggle flow

CONSTRAINTS:
- Toggle must show current state clearly (on/off)
- Audit log includes: who, when, old value, new value, reason
```

**UC4.10: Audit Log of Flag Changes**
```
AI SKILL: None
AI CONTEXT: Audit logging
AI ROLE: Implement comprehensive audit trail

GIVEN feature flag changed
WHEN change committed
THEN audit log entry created with:
  - FlagName
  - ChangedBy (UserId)
  - ChangedAt (timestamp)
  - OldValue
  - NewValue
  - Reason (optional, from admin)
  - CompanyId (if tenant-specific override)

UNIT TEST: Verify audit entry creation
INTEGRATION TEST: Real database, query audit log

CONSTRAINTS:
- Audit log immutable (no deletes)
- Queryable by flag name, user, date range
```

---

## MODULE 5: Platform.Storage - File Storage Abstraction

### AI Agent Context

```yaml
role: Cloud Storage Engineer
expertise:
  - Azure Blob Storage SDK
  - Local file system for development
  - SAS token generation
  - Content-type detection
approach: Abstract storage provider, tenant-safe paths
testing_framework: xUnit + Azurite (local blob emulator)
environment: Aspire + Docker (Azurite container)
```

### Must-Have Features

**F1: Storage Abstraction**
- Interface: `IStorageProvider` with implementations for Blob and Local
- Factory pattern to select provider based on environment (dev = Local, prod = Blob)
- Tenant-safe path prefixing automatic

**F2: Blob Storage Operations**
- Upload file (with content type detection)
- Download file (stream or byte[])
- Delete file
- List files in folder (with pagination)
- Generate SAS URL (read-only, time-limited)

**F3: Local Storage Operations**
- Same interface as Blob
- Store in `./storage/{company}/{facility}/` during development
- Useful for testing without Azure dependencies

**F4: Tenant Path Prefixing**
- Format: `{companyId}/{facilityId}/{filename}`
- Validation: Prevent path traversal (../)
- Sanitization: Remove unsafe characters

**F5: File Metadata**
- Store metadata with file (tags, custom properties)
- Query files by metadata
- Content-type auto-detection from extension

**F6: Lifecycle Management**
- Automatically move old files to Cool tier (Azure Blob lifecycle policy)
- Delete files after retention period (e.g., backups after 90 days)

**F7: Resilience**
- Retry on transient failures (Polly policies)
- Circuit breaker for blob storage connectivity
- Health check for storage availability

**F8: Observability**
- Trace all storage operations (OpenTelemetry)
- Metrics: upload count, size, duration
- Log failures with context

### Constraints

**C1: Tenant Isolation**
- Separate containers per company (or prefixed paths in shared container)
- Validate tenant context before any operation
- No cross-tenant file access

**C2: Security**
- SAS URLs always time-limited (default 1 hour)
- Read-only SAS for downloads
- Write SAS only for uploads (not listing)
- Validate file types (whitelist, not blacklist)

**C3: Performance**
- Stream large files (no full buffering)
- Parallel uploads for multiple files
- Thumbnail generation asynchronous (background job)

**C4: Storage Limits**
- Max file size: 100 MB per file (configurable)
- Total storage per company: quota enforced
- Rate limiting: prevent abuse

**C5: Cost Optimization**
- Use Cool tier for infrequently accessed files
- Delete temporary files after 24 hours
- Compress text files before upload

### TDD Use Cases

**UC5.1: Upload File to Blob Storage**
```
AI SKILL: None
AI CONTEXT: Azure Blob Storage SDK
AI ROLE: Implement file upload with tenant safety

GIVEN current context is Company "acme", Facility "building-a"
WHEN uploading file "avatar.jpg"
THEN file saved to path "acme/building-a/avatar.jpg"
AND content-type detected as "image/jpeg"
AND metadata includes: UploadedBy, UploadedAt, TenantId

UNIT TEST: Mock BlobContainerClient
INTEGRATION TEST: Real Azurite (local blob emulator)

NEGATIVE TESTS:
- File > 100 MB → Error
- Invalid file type (e.g., .exe) → Error
- Path traversal attempt (../../) → Sanitized/blocked
```

**UC5.2: Generate SAS URL for Download**
```
AI SKILL: None
AI CONTEXT: Azure Blob SAS tokens
AI ROLE: Implement secure download links

GIVEN file exists at "acme/building-a/document.pdf"
WHEN requesting download URL
THEN SAS URL generated with:
  - Read-only permission
  - 1 hour expiry
  - IP restriction (optional, from current request IP)

UNIT TEST: Mock SAS generator, verify parameters
INTEGRATION TEST: Real Azurite, validate SAS URL works

NEGATIVE TESTS:
- SAS expired → 403 when accessing
- SAS for wrong file → 404
```

**UC5.3: Local Storage - Development Mode**
```
AI SKILL: None
AI CONTEXT: File system operations
AI ROLE: Implement local file storage for dev

GIVEN environment is Development
WHEN uploading file "test.txt"
THEN file saved to "./storage/acme/building-a/test.txt"
AND directory created if not exists

INTEGRATION TEST: Real file system, verify path

CONSTRAINTS:
- Use same interface as Blob (transparent swap)
- Cleanup local files in teardown
```

**UC5.4: Tenant Isolation - Prevent Cross-Tenant Access**
```
AI SKILL: None
AI CONTEXT: Authorization, tenant validation
AI ROLE: Ensure storage isolation

GIVEN current context is Company "acme"
WHEN attempting to download file from Company "demo" path
THEN 403 Forbidden
AND operation logged as security violation

UNIT TEST: Mock tenant context, verify exception
INTEGRATION TEST: Real storage with multi-tenant data

NEGATIVE TEST:
- Malicious path (acme/../demo/file.txt) → Sanitized, blocked
```

**UC5.5: File Listing with Pagination**
```
AI SKILL: None
AI CONTEXT: Azure Blob listing, pagination
AI ROLE: Implement efficient file listing

GIVEN 500 files in "acme/building-a/"
WHEN listing files with page size 50
THEN first page returns files 1-50
AND continuation token provided for next page
AND subsequent requests use token

UNIT TEST: Mock blob client with pagination
INTEGRATION TEST: Real Azurite with 500 test files

CONSTRAINTS:
- Default page size: 100
- Max page size: 1000
```

**UC5.6: Delete File**
```
AI SKILL: None
AI CONTEXT: Blob deletion
AI ROLE: Implement file deletion with audit

GIVEN file "acme/building-a/temp.txt" exists
WHEN deleting file
THEN file removed from storage
AND deletion logged to audit trail
AND soft delete enabled (Azure Blob soft delete feature)

UNIT TEST: Mock blob client, verify delete call
INTEGRATION TEST: Real Azurite, verify file gone

POSITIVE TEST:
- Delete non-existent file → No error (idempotent)
```

**UC5.7: Content-Type Detection**
```
AI SKILL: None
AI CONTEXT: MIME type detection
AI ROLE: Auto-detect content type from extension

GIVEN uploading file "document.pdf"
WHEN content-type not provided
THEN auto-detect as "application/pdf"

GIVEN uploading file "avatar.png"
THEN auto-detect as "image/png"

UNIT TEST: Test all common extensions
INTEGRATION TEST: Upload files, verify headers

CONSTRAINTS:
- Whitelist allowed extensions: .pdf, .jpg, .png, .docx, .xlsx
- Unknown extensions → application/octet-stream
```

**UC5.8: Retry on Transient Failure**
```
AI SKILL: None
AI CONTEXT: Polly retry policies
AI ROLE: Implement resilience

GIVEN blob storage returns 503 (Service Unavailable)
WHEN uploading file
THEN retry 3 times with exponential backoff
AND succeed on 2nd attempt (storage recovered)

INTEGRATION TEST: Simulate transient failures with Chaos Engineering

CONSTRAINTS:
- Retry on: 408, 429, 503, 504
- Don't retry on: 400, 401, 403, 404
```

**UC5.9: Storage Health Check**
```
AI SKILL: None
AI CONTEXT: ASP.NET Core health checks
AI ROLE: Monitor storage availability

GIVEN health check endpoint configured
WHEN GET /health
THEN verify blob storage connectivity
AND return Healthy if accessible, Unhealthy otherwise

INTEGRATION TEST: Real Azurite, stop/start container

CONSTRAINTS:
- Health check timeout: 5 seconds
- Failure doesn't crash app (degraded mode)
```

**UC5.10: File Metadata Query**
```
AI SKILL: None
AI CONTEXT: Blob metadata, tagging
AI ROLE: Store and query custom metadata

GIVEN uploading file with metadata: { "Department": "Nursing", "Type": "CarePlan" }
WHEN querying files with Department = "Nursing"
THEN return all files with that metadata tag

INTEGRATION TEST: Real Azurite with tagged files

CONSTRAINTS:
- Max metadata size: 8 KB per file
- Metadata searchable via Blob Index Tags (Azure feature)
```

---

## MODULE 6: Platform.FrequentAssets - Cloudinary Hot Cache

### AI Agent Context

```yaml
role: CDN/Image Optimization Engineer
expertise:
  - Cloudinary SDK
  - Image transformations (resize, crop, format conversion)
  - CDN caching strategies
approach: Cloudinary sits ON TOP of blob storage, not alongside
testing_framework: xUnit + Cloudinary test account
environment: Aspire + Azurite + Cloudinary dev account
```

### Must-Have Features

**F1: Hot Cache Pattern**
- Blob storage = source of truth
- Cloudinary = optimization + CDN layer
- Auto-upload frequently accessed images to Cloudinary
- Fallback to Blob if Cloudinary unavailable

**F2: Asset Categorization**
- Mark assets as "frequent" (avatars, logos, common images)
- Background job uploads frequent assets to Cloudinary
- Non-frequent assets served directly from Blob

**F3: Image Transformations**
- Resize (width, height, aspect ratio)
- Crop (smart crop, face detection)
- Format conversion (PNG → WebP, JPEG optimization)
- Quality adjustment (compress for thumbnails)

**F4: CDN URL Generation**
- Generate Cloudinary URLs with transformations
- Signed URLs for private images
- Responsive images (multiple sizes)

**F5: Synchronization**
- Background job syncs new frequent assets to Cloudinary
- Delete from Cloudinary when deleted from Blob
- Re-upload if transformation parameters change

**F6: Fallback Strategy**
- Cloudinary down → Serve from Blob (SAS URL)
- Circuit breaker to avoid retry storm
- Health check for Cloudinary availability

**F7: Analytics**
- Track asset access frequency
- Auto-promote to Cloudinary if accessed > N times
- Auto-demote from Cloudinary if not accessed in 30 days

**F8: Tenant Isolation**
- Cloudinary folders by company: `acme/`, `demo/`
- Prevent cross-tenant access

### Constraints

**C1: Source of Truth is Blob**
- Cloudinary is cache, not storage
- All uploads go to Blob first
- Cloudinary rebuilt from Blob if lost

**C2: Async Upload to Cloudinary**
- Upload to Blob is synchronous
- Upload to Cloudinary is async (background job)
- User doesn't wait for Cloudinary upload

**C3: Transformation Performance**
- Cloudinary transformations cached on CDN
- First request may be slower (transformation time)
- Subsequent requests fast (served from CDN)

**C4: Cost Management**
- Monitor Cloudinary usage (bandwidth, transformations)
- Alert if nearing quota limits
- Remove unused assets from Cloudinary

**C5: Image Size Limits**
- Cloudinary free tier: max 10 MB per image
- Resize large images before upload to Cloudinary

### TDD Use Cases

**UC6.1: Mark Asset as Frequent**
```
AI SKILL: None
AI CONTEXT: Metadata tagging, asset categorization
AI ROLE: Implement frequent asset marking

GIVEN file "avatar.jpg" uploaded to Blob
WHEN marking as frequent asset
THEN metadata tag "IsFrequent: true" added
AND background job queued to upload to Cloudinary

UNIT TEST: Mock storage, verify metadata update
INTEGRATION TEST: Real Azurite + Cloudinary test account

CONSTRAINTS:
- Only images eligible (check MIME type)
- Max file size for Cloudinary: 10 MB
```

**UC6.2: Background Job - Upload to Cloudinary**
```
AI SKILL: None
AI CONTEXT: Hangfire background jobs
AI ROLE: Implement async Cloudinary upload

GIVEN frequent asset "avatar.jpg" in Blob storage
WHEN background job runs
THEN download from Blob
AND upload to Cloudinary in folder "acme/"
AND store Cloudinary URL in metadata
AND mark asset as synced

INTEGRATION TEST: Real Hangfire + Cloudinary

CONSTRAINTS:
- Retry 3 times on failure
- Job timeout: 5 minutes
```

**UC6.3: Generate Cloudinary URL with Transformations**
```
AI SKILL: None
AI CONTEXT: Cloudinary URL API
AI ROLE: Build transformation URLs

GIVEN asset exists in Cloudinary as "acme/avatar.jpg"
WHEN requesting thumbnail (100x100, crop)
THEN return Cloudinary URL:
  "https://res.cloudinary.com/{cloud}/image/upload/w_100,h_100,c_fill/acme/avatar.jpg"

WHEN requesting WebP format
THEN return URL with f_webp transformation

UNIT TEST: Verify URL construction
INTEGRATION TEST: Real Cloudinary, verify image loads

POSITIVE TESTS:
- Multiple transformations chained
- Signed URLs for private images
```

**UC6.4: Fallback to Blob When Cloudinary Down**
```
AI SKILL: None
AI CONTEXT: Circuit breaker pattern
AI ROLE: Implement resilient fallback

GIVEN Cloudinary API returning 503 errors
WHEN requesting image URL
THEN circuit breaker opens
AND return Blob SAS URL instead
AND log fallback (for alerting)

INTEGRATION TEST: Simulate Cloudinary outage

CONSTRAINTS:
- Circuit breaker threshold: 5 failures in 1 minute
- Half-open retry after 30 seconds
```

**UC6.5: Auto-Promote Asset Based on Access Frequency**
```
AI SKILL: None
AI CONTEXT: Analytics, heuristics
AI ROLE: Implement intelligent caching

GIVEN asset "document.pdf" accessed 100 times in 7 days
WHEN background job analyzes access patterns
THEN mark asset as frequent
AND upload to Cloudinary

INTEGRATION TEST: Simulate access pattern, verify promotion

CONSTRAINTS:
- Threshold: 50 accesses/week OR 10 accesses/day
- Only images/videos promoted (not PDFs)
```

**UC6.6: Auto-Demote Asset Based on Inactivity**
```
AI SKILL: None
AI CONTEXT: Lifecycle management
AI ROLE: Clean up unused Cloudinary assets

GIVEN asset "old-logo.png" in Cloudinary
AND not accessed in 30 days
WHEN cleanup job runs
THEN delete from Cloudinary
AND mark as non-frequent

INTEGRATION TEST: Real Cloudinary, verify deletion

CONSTRAINTS:
- Keep asset in Blob (source of truth)
- Can be re-promoted if accessed again
```

**UC6.7: Sync Deletion from Blob to Cloudinary**
```
AI SKILL: None
AI CONTEXT: Event-driven sync
AI ROLE: Keep Cloudinary in sync

GIVEN asset "avatar.jpg" deleted from Blob
WHEN deletion event published
THEN background job deletes from Cloudinary
AND removes metadata entry

INTEGRATION TEST: Real event flow (Blob → Queue → Cloudinary)

CONSTRAINTS:
- Eventual consistency (may take up to 5 min)
- Idempotent (safe to delete twice)
```

**UC6.8: Responsive Images - Multiple Sizes**
```
AI SKILL: None
AI CONTEXT: Responsive web design, srcset
AI ROLE: Generate multi-size image URLs

GIVEN asset "hero-image.jpg"
WHEN requesting responsive image URLs
THEN return:
  - 1x: 800px width
  - 2x: 1600px width (for retina)
  - Thumbnail: 200px width

UNIT TEST: Verify URL generation for all sizes

EXAMPLE OUTPUT:
srcset="https://.../w_800/.../hero-image.jpg 1x,
        https://.../w_1600/.../hero-image.jpg 2x"
```

**UC6.9: Signed URLs for Private Images**
```
AI SKILL: None
AI CONTEXT: Cloudinary signed URLs
AI ROLE: Secure private asset access

GIVEN asset "medical-record.jpg" marked as private
WHEN generating URL
THEN create signed URL with expiration
AND signature prevents tampering

INTEGRATION TEST: Real Cloudinary, verify signature validation

CONSTRAINTS:
- Expiration: 1 hour default
- Signature algorithm: SHA256
```

**UC6.10: Cloudinary Health Check**
```
AI SKILL: None
AI CONTEXT: Health checks, monitoring
AI ROLE: Monitor Cloudinary availability

GIVEN health check endpoint
WHEN checking Cloudinary status
THEN verify API connectivity (ping endpoint)
AND check quota usage (bandwidth, transformations)
AND return Healthy or Degraded

INTEGRATION TEST: Real Cloudinary API

CONSTRAINTS:
- Health check timeout: 3 seconds
- Alert if quota > 80%
```

---

*[Due to length, this document continues with remaining modules. Would you like me to continue with Modules 7-14?]*

---

## Implementation Orchestration with .NET Aspire

### Aspire AppHost Configuration

**Purpose:** Orchestrate all services locally with Docker containers

```csharp
// AppHost/Program.cs structure
var builder = DistributedApplication.CreateBuilder(args);

// Databases
var sqlserver = builder.AddSqlServer("sqlserver")
    .WithDataVolume()
    .AddDatabase("admin-db")
    .AddDatabase("tenant-db")
    .AddDatabase("families-db");

var cosmos = builder.AddAzureCosmosDB("cosmos")
    .RunAsEmulator();

// Caching
var redis = builder.AddRedis("redis")
    .WithDataVolume();

// Messaging
var rabbitmq = builder.AddRabbitMQ("rabbitmq")
    .WithManagementPlugin();

// Storage
var azurite = builder.AddAzureStorage("storage")
    .RunAsEmulator();

// Web Application
var webApp = builder.AddProject<Projects.Platform_Web>("webapp")
    .WithReference(sqlserver)
    .WithReference(redis)
    .WithReference(rabbitmq)
    .WithReference(azurite)
    .WithReference(cosmos);

builder.Build().Run();
```

### Docker Compose for Integration Tests

```yaml
version: '3.8'
services:
  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=Test123!
    ports:
      - "1433:1433"
    volumes:
      - sqldata:/var/opt/mssql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmqdata:/var/lib/rabbitmq

  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    ports:
      - "10000:10000"
      - "10001:10001"
      - "10002:10002"

  cosmos-emulator:
    image: mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator
    ports:
      - "8081:8081"
    environment:
      - AZURE_COSMOS_EMULATOR_PARTITION_COUNT=10

volumes:
  sqldata:
  redisdata:
  rabbitmqdata:
```

---

## Migration Phasing (30 Weeks)

### Phase 0: Foundation (Weeks 1-12) - PROVE THE FRAMEWORK

**Goal:** Build production-ready framework with all 10 POCs passing

**Modules to Complete:**
1. Platform.Core (Contexts) - Weeks 1-2
2. Platform.Data (DbContexts, Migrations) - Weeks 3-4
3. Platform.Auth (Authentication, Authorization) - Week 5
4. Platform.FeatureFlags - Week 6
5. Platform.Storage - Week 7
6. Platform.FrequentAssets - Week 7
7. Platform.Caching - Week 8
8. Platform.Messaging - Week 9
9. Platform.BackgroundJobs - Week 10
10. Platform.Integrations - Week 11
11. Platform.Observability - Week 11
12. Final Integration Testing & Documentation - Week 12

**Success Criteria:**
- All 10 POCs pass (defined in comprehensive-architecture-plan-final.md)
- Zero data leaks (tenant isolation verified)
- Full test coverage (unit + integration + E2E)
- Developer documentation complete
- Aspire orchestration working locally
- CI/CD pipeline established

---

### Phase 1: Admin Module Migration (Weeks 13-16)

**Goal:** Migrate company, facility, user management to new platform

**Scope:**
- Companies CRUD
- Facilities CRUD
- User management (create, edit, disable, roles)
- Claims and entitlements management
- Admin dashboards

**Approach:**
- Strangler pattern (new endpoints alongside old)
- Gradual traffic shifting (feature flags)
- A/B test with admin users first

---

### Phase 2: Residents Module Migration (Weeks 17-22)

**Goal:** Core resident management in new platform

**Scope:**
- Resident admission
- Care plans
- Medication management
- Activity logs
- Billing

**Approach:**
- Read-only first (dashboards, reports)
- Then writes (admit new residents in new system)
- Dual-write during transition (write to both systems)
- Validate data consistency

---

### Phase 3: Families Module Migration (Weeks 23-26)

**Goal:** Family portal in new platform

**Scope:**
- Family member portal
- Resident-family relationships
- Communication (messages, updates)
- Photo sharing

---

### Phase 4: Integrations & Cleanup (Weeks 27-30)

**Goal:** Migrate all HTTP integrations, decommission old platform

**Scope:**
- Medical records APIs
- Payment processors
- Pharmacy integrations
- Insurance verification
- Decommission old .NET Framework app
- Database cleanup (remove old tables)

---

## Next Steps for AI Agents

### Getting Started

1. **Clone Repository Template**
2. **Set Up Aspire**
   ```bash
   dotnet new aspire-starter -n SeniorLiving
   cd SeniorLiving
   dotnet aspire init
   ```
3. **Start with Module 1: Platform.Core**
   - Read this specification for Module 1
   - Write failing tests for UC1.1
   - Implement until tests pass
   - Iterate through all use cases
   - Document with examples

### AI Agent Workflow for Each Module

```
1. READ module specification (this document)
2. READ relevant AI skills (if referenced)
3. SET UP test project with naming: {Module}.Tests
4. WRITE first failing test (UC X.1)
5. IMPLEMENT minimum code to pass
6. REFACTOR while keeping tests green
7. REPEAT for all use cases
8. WRITE integration tests with Docker
9. UPDATE module README with usage examples
10. SUBMIT for review with test coverage report
```

### Success Metrics

- **Code Coverage:** > 80% (unit tests)
- **Integration Tests:** All scenarios passing
- **Performance:** Meet constraints in specification
- **Documentation:** README + XML comments + usage examples
- **Security:** No vulnerabilities (static analysis)
- **Developer Experience:** Module intuitive to use

---

## Appendix: Glossary

**AsyncLocal:** Thread-safe storage for flowing data across async/await boundaries  
**Aspire:** .NET orchestration framework for cloud-native apps  
**Circuit Breaker:** Resilience pattern to prevent cascading failures  
**DbContext:** EF Core database context  
**FusionCache:** Advanced caching library with L1 (memory) + L2 (distributed) support  
**Global Query Filter:** EF Core feature to automatically apply WHERE clause to all queries  
**Hangfire:** Background job processing framework  
**Modular Monolith:** Single deployable unit with clear module boundaries (can split into microservices later)  
**Outbox Pattern:** Ensure message publishing atomicity with database writes  
**Polly:** .NET resilience library (retry, circuit breaker, timeout)  
**Refit:** Type-safe REST client library  
**SAS (Shared Access Signature):** Time-limited Azure Storage access token  
**Strangler Pattern:** Gradual migration by replacing old system piece by piece  
**Testcontainers:** Library to run Docker containers in tests  
**TDD (Test-Driven Development):** Write test first, then implement  

---

**END OF SPECIFICATION**

*This document is a living specification. As implementation progresses and learnings emerge, update this document to reflect reality. Pragmatism over dogmatism.*
