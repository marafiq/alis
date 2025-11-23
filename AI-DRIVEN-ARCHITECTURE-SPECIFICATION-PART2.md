# Senior Living Platform - AI-Driven Architecture Specification (Continued)
## Modules 7-14: Infrastructure and Business Domains

*This document continues from AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md*

---

## MODULE 7: Platform.Caching - FusionCache + Redis

### AI Agent Context

```yaml
role: Performance Engineer specializing in Distributed Caching
expertise:
  - FusionCache (L1 memory + L2 distributed caching)
  - Redis cluster configuration
  - Cache invalidation strategies
  - Backplane for multi-instance sync
approach: Performance-first, tenant-safe keys, observability
testing_framework: xUnit + Testcontainers.Redis
environment: Aspire + Docker (Redis container)
```

### Must-Have Features

**F1: Two-Level Caching (L1 + L2)**
- L1: In-memory cache (fast, per instance)
- L2: Redis distributed cache (shared across instances)
- FusionCache orchestrates both levels
- Automatic failover (L2 down → L1 still works)

**F2: Tenant-Safe Cache Keys**
- Auto-prefix with `{companyId}:{facilityId}:`
- Prevent cross-tenant cache pollution
- Key format validation

**F3: Cache Policies**
- Configurable TTL per cache entry
- Sliding expiration support
- Absolute expiration support
- Fail-safe (serve stale on error)

**F4: Backplane for Multi-Instance Sync**
- Redis Pub/Sub for cache invalidation messages
- When cache invalidated on one instance, all instances notified
- Ensures consistency across scaled-out app

**F5: Cache Invalidation Strategies**
- By key (specific entry)
- By prefix (all entries for company/facility)
- By tag (grouped invalidation)
- Time-based expiration

**F6: Null Caching**
- Cache "not found" results to prevent cache stampede
- Short TTL for null entries (e.g., 30 seconds)

**F7: Metrics & Observability**
- Cache hit/miss ratio
- Cache size (L1 and L2)
- Eviction count
- Backplane message count

**F8: Health Checks**
- Redis connectivity check
- Cache operation latency
- Alert on degraded performance

### Constraints

**C1: Performance Targets**
- L1 cache hit: < 1ms
- L2 cache hit: < 10ms
- Cache miss (database): < 100ms
- Backplane notification: < 500ms

**C2: Tenant Isolation**
- Keys MUST include tenant prefix
- No shared keys across tenants (except platform-level config)
- Invalidation scoped to tenant

**C3: Memory Limits**
- L1 cache max size: 500 MB per instance
- Eviction policy: LRU (least recently used)
- Don't cache large objects (> 1 MB) in L1

**C4: Redis Configuration**
- Max memory policy: allkeys-lru
- Persistence: AOF (append-only file) for durability
- Clustering support for high availability

**C5: Fail-Safe Behavior**
- Redis down → L1 cache still works
- L1 cache full → Evict, don't crash
- Backplane failure → Log, don't block requests

### TDD Use Cases

**UC7.1: Cache Set and Get - L1 Hit**
```
AI SKILL: None
AI CONTEXT: FusionCache API
AI ROLE: Implement basic caching

GIVEN current context is Company "acme", Facility "building-a"
WHEN setting cache value with key "residents:active" = [list of residents]
THEN value stored in L1 cache with key "acme:building-a:residents:active"
WHEN getting same key immediately after
THEN value returned from L1 (no L2 or database hit)

UNIT TEST: Mock FusionCache
INTEGRATION TEST: Real FusionCache + in-memory L1

CONSTRAINTS:
- L1 hit time < 1ms
```

**UC7.2: Cache Set and Get - L2 Hit**
```
AI SKILL: None
AI CONTEXT: FusionCache with Redis backplane
AI ROLE: Implement distributed caching

GIVEN value cached on Instance 1
WHEN Instance 2 requests same key
THEN L1 miss on Instance 2
AND L2 hit from Redis
AND value promoted to L1 on Instance 2 (for next hit)

INTEGRATION TEST: Real Redis container, multiple app instances

CONSTRAINTS:
- L2 hit time < 10ms
- Value automatically promoted to L1 after L2 hit
```

**UC7.3: Cache Miss - Fetch from Database**
```
AI SKILL: None
AI CONTEXT: Cache-aside pattern
AI ROLE: Implement GetOrSet pattern

GIVEN key "residents:123" not in cache
WHEN calling GetOrSetAsync with factory function
THEN factory executes (queries database)
AND result cached in L1 and L2
AND subsequent calls hit cache

UNIT TEST: Mock factory function, verify called once
INTEGRATION TEST: Real cache + database

CONSTRAINTS:
- Factory called exactly once (no double-fetch)
- Total time < 100ms (database query time)
```

**UC7.4: Backplane - Invalidation Across Instances**
```
AI SKILL: None
AI CONTEXT: Redis Pub/Sub backplane
AI ROLE: Implement cache invalidation sync

GIVEN value cached on Instance 1 and Instance 2
WHEN value invalidated on Instance 1
THEN backplane message published via Redis Pub/Sub
AND Instance 2 receives message and invalidates local L1
AND subsequent request on Instance 2 cache misses

INTEGRATION TEST: Real Redis + multiple app instances

CONSTRAINTS:
- Notification delivery < 500ms
- Idempotent (safe to invalidate twice)
```

**UC7.5: Tenant-Prefixed Keys**
```
AI SKILL: None
AI CONTEXT: Key formatting, tenant safety
AI ROLE: Auto-prefix cache keys

GIVEN current context is Company "acme", Facility "building-a"
WHEN caching with logical key "user:settings"
THEN physical key is "acme:building-a:user:settings"

GIVEN switching to Company "demo"
WHEN caching same logical key "user:settings"
THEN physical key is "demo::user:settings" (no facility in demo context)

UNIT TEST: Verify key formatting
INTEGRATION TEST: Real cache with multiple tenants

CONSTRAINTS:
- No key collisions across tenants
- Key format validated (no special chars like `:` in logical key)
```

**UC7.6: Cache Invalidation by Prefix**
```
AI SKILL: None
AI CONTEXT: Bulk invalidation
AI ROLE: Implement prefix-based invalidation

GIVEN multiple cache entries:
  - "acme:building-a:residents:123"
  - "acme:building-a:residents:456"
  - "acme:building-a:staff:789"
WHEN invalidating prefix "acme:building-a:residents"
THEN only resident cache entries invalidated
AND staff cache entry remains

UNIT TEST: Mock cache, verify selective invalidation
INTEGRATION TEST: Real Redis with SCAN command

CONSTRAINTS:
- Use Redis SCAN for prefix invalidation (not KEYS, to avoid blocking)
- Batch delete for efficiency
```

**UC7.7: Fail-Safe - Redis Down**
```
AI SKILL: None
AI CONTEXT: Resilience, degraded mode
AI ROLE: Handle Redis outages gracefully

GIVEN Redis container stopped
WHEN setting cache value
THEN L1 cache still works
AND L2 operation logged as failed (not exception)
AND application continues functioning

WHEN getting cached value
THEN L1 hit returns value
AND L2 miss doesn't block request

INTEGRATION TEST: Stop Redis container mid-test

CONSTRAINTS:
- No exceptions thrown on Redis failure
- L1 cache continues to work
- Alert triggered for ops team
```

**UC7.8: Cache Null Values (Prevent Stampede)**
```
AI SKILL: None
AI CONTEXT: Null caching pattern
AI ROLE: Cache "not found" results

GIVEN querying resident ID 999 (doesn't exist)
WHEN GetOrSetAsync called with database factory
THEN factory returns null
AND null cached with short TTL (30 seconds)
AND subsequent queries within 30s return cached null (no DB hit)

UNIT TEST: Verify null caching behavior
INTEGRATION TEST: Real cache, measure DB hit count

CONSTRAINTS:
- Null TTL: 30 seconds (prevent stale nulls)
- Explicitly cache nulls (not just ignore)
```

**UC7.9: Cache Metrics - Hit/Miss Ratio**
```
AI SKILL: None
AI CONTEXT: OpenTelemetry metrics
AI ROLE: Implement cache observability

GIVEN 100 cache operations: 80 hits, 20 misses
WHEN querying metrics
THEN hit ratio = 80%
AND metrics include:
  - cache.hits (counter)
  - cache.misses (counter)
  - cache.latency (histogram)
  - cache.size (gauge)

INTEGRATION TEST: Real OpenTelemetry exporter

CONSTRAINTS:
- Metrics exported every 10 seconds
- Dimensions: cache_level (L1 or L2), tenant_id
```

**UC7.10: Cache Health Check**
```
AI SKILL: None
AI CONTEXT: Health check monitoring
AI ROLE: Monitor cache health

GIVEN health check endpoint configured
WHEN GET /health
THEN verify:
  - Redis connectivity (ping)
  - L1 cache operational
  - Backplane messaging working
AND return:
  - Healthy: All good
  - Degraded: Redis down but L1 working
  - Unhealthy: Both L1 and L2 down

INTEGRATION TEST: Real health check with Redis stop/start

CONSTRAINTS:
- Health check timeout: 3 seconds
- Don't block app startup on Redis unavailability
```

---

## MODULE 8: Platform.Messaging - RabbitMQ + SignalR

### AI Agent Context

```yaml
role: Messaging Architect
expertise:
  - RabbitMQ (exchanges, queues, routing)
  - SignalR for real-time notifications
  - Azure Service Bus for function triggers
  - Event-driven architecture
approach: Reliable messaging, at-least-once delivery, tenant isolation
testing_framework: xUnit + Testcontainers.RabbitMQ
environment: Aspire + Docker (RabbitMQ container)
```

### Must-Have Features

**F1: RabbitMQ Message Bus**
- Publish domain events (ResidentAdmitted, MedicationGiven, etc.)
- Subscribe to events in different modules
- Tenant context in message envelope
- Routing by event type

**F2: Message Envelope Pattern**
- Standard envelope: { MessageId, Timestamp, CompanyId, FacilityId, UserId, Payload }
- Correlation ID for tracing
- Replay protection (idempotency keys)

**F3: SignalR for Real-Time Notifications**
- Push notifications to connected clients
- Groups by company and facility
- User-specific notifications
- Connection state management

**F4: Azure Service Bus for Function Triggers**
- Long-running operations (exports, imports)
- Durable functions orchestration
- Dead-letter queue handling

**F5: Outbox Pattern for Transactional Messaging**
- Save message to database in same transaction as domain change
- Background processor publishes from outbox to RabbitMQ
- Guarantees at-least-once delivery

**F6: Retry and Dead-Letter Queue**
- Automatic retry on transient failures (3 attempts)
- Exponential backoff
- Move to DLQ after max retries
- Alert on DLQ messages

**F7: Message Versioning**
- Support multiple versions of same event (backward compatibility)
- Version in message header
- Consumers handle version gracefully

**F8: Observability**
- Trace message flow across modules
- Metrics: message count, processing time, errors
- Correlation IDs link messages to requests

### Constraints

**C1: Tenant Isolation**
- Messages MUST include CompanyId and FacilityId
- Consumers validate tenant context before processing
- No cross-tenant message leaking

**C2: At-Least-Once Delivery**
- Messages delivered at least once (may duplicate)
- Consumers MUST be idempotent
- Use idempotency keys to detect duplicates

**C3: Ordering**
- No global ordering guarantee (distributed system)
- Partial ordering within partition (same CompanyId)
- If strict ordering needed, use single-partition queue

**C4: Performance**
- Message publish: < 10ms
- Message delivery: < 1 second
- SignalR notification: < 500ms

**C5: Reliability**
- Message persistence (RabbitMQ durable queues)
- Survive broker restarts
- No message loss (use publisher confirms)

### TDD Use Cases

**UC8.1: Publish Event to RabbitMQ**
```
AI SKILL: None
AI CONTEXT: RabbitMQ publisher
AI ROLE: Implement event publishing

GIVEN current context is Company "acme", Facility "building-a"
WHEN publishing ResidentAdmittedEvent
THEN message sent to RabbitMQ exchange
AND envelope includes:
  - MessageId (GUID)
  - Timestamp (UTC)
  - CompanyId = "acme"
  - FacilityId = "building-a"
  - UserId (current user)
  - CorrelationId (from current trace)
  - Payload = { ResidentId, Name, AdmittedAt }

UNIT TEST: Mock RabbitMQ publisher
INTEGRATION TEST: Real RabbitMQ container, verify message received

CONSTRAINTS:
- Publish time < 10ms
- Publisher confirms enabled (ensure delivery)
```

**UC8.2: Subscribe to Event**
```
AI SKILL: None
AI CONTEXT: RabbitMQ consumer
AI ROLE: Implement event subscription

GIVEN subscriber registered for ResidentAdmittedEvent
WHEN event published
THEN subscriber receives message
AND tenant context restored from envelope
AND handler executed with event data

UNIT TEST: Mock message bus, verify handler called
INTEGRATION TEST: Real RabbitMQ, publish and consume

CONSTRAINTS:
- Consumer acknowledges message after successful processing
- Failed processing → message requeued (retry)
```

**UC8.3: Tenant Context Validation in Consumer**
```
AI SKILL: None
AI CONTEXT: Security, tenant isolation
AI ROLE: Prevent cross-tenant processing

GIVEN message with CompanyId = "acme"
AND current consumer configured for Company "demo"
WHEN message received
THEN message rejected (not processed)
AND logged as security violation
AND sent to DLQ for investigation

INTEGRATION TEST: Real RabbitMQ, cross-tenant message

CONSTRAINTS:
- Never process message from wrong tenant
- Log all rejections for audit
```

**UC8.4: Outbox Pattern - Transactional Messaging**
```
AI SKILL: None
AI CONTEXT: Outbox table, background processor
AI ROLE: Guarantee message delivery with database writes

GIVEN creating new resident in database
WHEN transaction commits
THEN resident record persisted
AND ResidentAdmittedEvent saved to OutboxMessages table (same transaction)

WHEN background processor runs
THEN message read from outbox
AND published to RabbitMQ
AND outbox record marked as Published

INTEGRATION TEST: Real database + RabbitMQ

CONSTRAINTS:
- Message publishing eventual (within 10 seconds)
- No message loss (even if RabbitMQ down during commit)
```

**UC8.5: Retry Logic on Failure**
```
AI SKILL: None
AI CONTEXT: Resilience, exponential backoff
AI ROLE: Handle transient failures

GIVEN consumer processing message
AND processing fails (exception thrown)
WHEN failure occurs
THEN message requeued
AND retry attempt 1 after 1 second
AND retry attempt 2 after 2 seconds
AND retry attempt 3 after 4 seconds
AND after 3 failures, move to DLQ

INTEGRATION TEST: Simulate processing failures

CONSTRAINTS:
- Max retries: 3
- Exponential backoff: 1s, 2s, 4s
- DLQ for manual investigation
```

**UC8.6: SignalR - Push Notification to Facility Group**
```
AI SKILL: None
AI CONTEXT: SignalR groups, hub
AI ROLE: Implement real-time notifications

GIVEN user connected to SignalR hub
AND user in Company "acme", Facility "building-a"
WHEN ResidentAdmittedEvent processed
THEN SignalR notification sent to group "acme:building-a"
AND all connected users in that facility receive notification

INTEGRATION TEST: Real SignalR hub, multiple client connections

CONSTRAINTS:
- Notification delivery < 500ms
- Users auto-added to groups based on facility context
```

**UC8.7: SignalR - User-Specific Notification**
```
AI SKILL: None
AI CONTEXT: SignalR user targeting
AI ROLE: Send notifications to individual users

GIVEN assigning task to specific user
WHEN task assignment completed
THEN SignalR notification sent to that user's connection(s)
AND notification includes task details

INTEGRATION TEST: Real SignalR, target specific connection

CONSTRAINTS:
- User can have multiple connections (desktop + mobile)
- Notification sent to all user's connections
```

**UC8.8: Message Versioning**
```
AI SKILL: None
AI CONTEXT: Backward compatibility
AI ROLE: Support multiple event versions

GIVEN ResidentAdmittedEvent v1 with fields: ResidentId, Name
AND v2 adds field: AdmissionType
WHEN v2 event published
THEN message header includes version: "2.0"

GIVEN consumer supports v1 only
WHEN receiving v2 message
THEN consumer reads v1 fields (ignores new field)
AND processes successfully

UNIT TEST: Verify version handling
INTEGRATION TEST: Publish v2, consume with v1 handler

CONSTRAINTS:
- Breaking changes require new event type
- Additive changes use versioning
```

**UC8.9: Dead-Letter Queue Monitoring**
```
AI SKILL: None
AI CONTEXT: DLQ alerting
AI ROLE: Monitor and alert on failed messages

GIVEN messages in DLQ
WHEN DLQ count > 10
THEN alert sent to ops team
AND include: message count, age, error reasons

INTEGRATION TEST: Simulate failures, verify DLQ

CONSTRAINTS:
- Alert threshold: 10 messages
- DLQ messages retained for 7 days
- Manual investigation and replay capability
```

**UC8.10: Observability - Message Tracing**
```
AI SKILL: None
AI CONTEXT: OpenTelemetry distributed tracing
AI ROLE: Trace messages across modules

GIVEN HTTP request triggers domain event
WHEN event published and consumed
THEN trace includes:
  - HTTP request span
  - Message publish span
  - Message delivery span
  - Consumer processing span
AND CorrelationId links all spans

INTEGRATION TEST: Real OpenTelemetry exporter

CONSTRAINTS:
- Trace context propagated in message headers
- All spans tagged with tenant info
```

---

## MODULE 9: Platform.BackgroundJobs - Hangfire + Azure Functions

### AI Agent Context

```yaml
role: DevOps/Background Processing Engineer
expertise:
  - Hangfire (recurring jobs, fire-and-forget)
  - Azure Durable Functions
  - Job scheduling strategies
  - Tenant context restoration
approach: Reliable job execution, tenant-safe, observable
testing_framework: xUnit + Hangfire in-memory storage
environment: Aspire + Docker (SQL Server for Hangfire)
```

### Must-Have Features

**F1: Hangfire Job Types**
- Fire-and-forget (one-time background task)
- Delayed jobs (execute after delay)
- Recurring jobs (cron schedule)
- Continuations (chained jobs)

**F2: Tenant Context Restoration**
- Jobs tagged with CompanyId and FacilityId
- Context restored before job execution
- Isolated job execution per tenant

**F3: Queue Segregation by Tier**
- Free tier: "low-priority" queue
- Standard tier: "normal" queue
- Premium tier: "high-priority" queue
- Prevents free tenants from starving premium

**F4: Job Monitoring Dashboard**
- Hangfire built-in dashboard
- Secured with authentication
- View job status, history, errors
- Retry failed jobs manually

**F5: Azure Durable Functions for Long-Running**
- Export large datasets (100K+ rows)
- Import bulk data
- Orchestration of multi-step processes
- Checkpointing for resumability

**F6: Job Retry and Failure Handling**
- Automatic retry on transient failures
- Exponential backoff
- Alert on repeated failures
- Dead-letter for manual intervention

**F7: Job Scheduling**
- Cron expressions for recurring jobs
- Time zone support
- Skip execution if previous still running

**F8: Observability**
- Trace job execution
- Metrics: job count, duration, success/failure rate
- Logs with tenant context

### Constraints

**C1: Tenant Isolation**
- Jobs MUST restore tenant context before execution
- Prevent cross-tenant data access in jobs
- Job logs tagged with tenant

**C2: Performance Tiers**
- Free tier: 1 worker thread
- Standard tier: 5 worker threads
- Premium tier: 20 worker threads
- Queue priority ensures fair resource allocation

**C3: Reliability**
- Job storage in SQL Server (durable)
- Survive app restarts (jobs resume)
- At-least-once execution (may execute twice on failure)

**C4: Long-Running Limits**
- Hangfire jobs max duration: 30 minutes
- Longer jobs → Azure Durable Functions
- Durable Functions: No time limit (checkpointed)

**C5: Scalability**
- Horizontal scaling (multiple Hangfire servers)
- Distributed lock for recurring jobs (execute once)
- Queue-based scaling for Azure Functions

### TDD Use Cases

**UC9.1: Fire-and-Forget Job**
```
AI SKILL: None
AI CONTEXT: Hangfire background jobs
AI ROLE: Implement one-time background task

GIVEN current context is Company "acme"
WHEN enqueueing job to send welcome email
THEN job stored in Hangfire
AND executed asynchronously
AND tenant context restored in job

UNIT TEST: Mock Hangfire, verify job enqueued
INTEGRATION TEST: Real Hangfire with SQL Server storage

CONSTRAINTS:
- Enqueue time < 10ms
- Job execution within 10 seconds (under load)
```

**UC9.2: Delayed Job**
```
AI SKILL: None
AI CONTEXT: Scheduled execution
AI ROLE: Implement delayed job

GIVEN password reset requested
WHEN enqueueing delayed job (15 minutes) to expire reset token
THEN job scheduled for execution in 15 minutes
AND executed at correct time

INTEGRATION TEST: Real Hangfire, verify timing

CONSTRAINTS:
- Timing accuracy ± 10 seconds
- Job survives app restart (persisted)
```

**UC9.3: Recurring Job**
```
AI SKILL: None
AI CONTEXT: Cron scheduling
AI ROLE: Implement recurring background job

GIVEN recurring job to generate daily reports
WHEN scheduled with cron: "0 2 * * *" (2 AM daily)
THEN job executed every day at 2 AM
AND skipped if previous execution still running
AND tenant context from job metadata

INTEGRATION TEST: Mock time, verify execution schedule

CONSTRAINTS:
- Cron expressions supported
- Time zone: UTC (consistent across servers)
- Distributed lock prevents duplicate execution
```

**UC9.4: Tenant Context Restoration in Job**
```
AI SKILL: None
AI CONTEXT: AsyncLocal context flow
AI ROLE: Restore tenant context for background jobs

GIVEN job enqueued with CompanyId = "acme", FacilityId = "building-a"
WHEN job executes
THEN CompanyContext restored with CompanyId = "acme"
AND FacilityContext restored with FacilityId = "building-a"
AND database queries automatically filtered

UNIT TEST: Mock context restoration
INTEGRATION TEST: Real job execution, verify DB queries filtered

CONSTRAINTS:
- Context restoration before job method execution
- Fail job if context invalid (company/facility doesn't exist)
```

**UC9.5: Queue Priority by Tier**
```
AI SKILL: None
AI CONTEXT: Hangfire queue configuration
AI ROLE: Implement tiered job queues

GIVEN Company "acme" on Premium tier
AND Company "demo" on Free tier
WHEN both enqueue jobs simultaneously
THEN "acme" jobs go to "high-priority" queue
AND "demo" jobs go to "low-priority" queue
AND high-priority jobs processed first

INTEGRATION TEST: Real Hangfire, enqueue to different queues

CONSTRAINTS:
- Queue names: "critical", "high-priority", "normal", "low-priority"
- Worker allocation: 50% critical, 30% high, 15% normal, 5% low
```

**UC9.6: Job Retry on Failure**
```
AI SKILL: None
AI CONTEXT: Automatic retry
AI ROLE: Handle transient failures

GIVEN job execution throws transient exception (e.g., database timeout)
WHEN failure occurs
THEN job automatically retried (max 3 attempts)
AND retry delay: 1 min, 5 min, 15 min

INTEGRATION TEST: Simulate transient failures

CONSTRAINTS:
- Max retries: 3
- Exponential backoff
- After max retries → Failed state (alert)
```

**UC9.7: Azure Durable Function - Long Export**
```
AI SKILL: None
AI CONTEXT: Azure Durable Functions orchestration
AI ROLE: Implement long-running export job

GIVEN request to export 500K resident records
WHEN export initiated
THEN Durable Function started
AND orchestration:
  1. Query database in batches (10K records/batch)
  2. Write each batch to CSV
  3. Upload CSV to Blob
  4. Generate signed URL
  5. Send email with download link

INTEGRATION TEST: Real Durable Functions with local emulator

CONSTRAINTS:
- Checkpointing every 10K records (resumable)
- No timeout (can run for hours)
- Progress tracking (show % complete)
```

**UC9.8: Job Dashboard - View Status**
```
AI SKILL: None
AI CONTEXT: Hangfire dashboard
AI ROLE: Secure and monitor job dashboard

GIVEN admin accessing /hangfire dashboard
WHEN viewing dashboard
THEN see:
  - Succeeded jobs (last 24 hours)
  - Failed jobs
  - Processing jobs
  - Scheduled jobs
  - Queues status

INTEGRATION TEST: Real Hangfire dashboard

CONSTRAINTS:
- Dashboard requires authentication (admin role)
- Tenant-scoped view (admins see only their tenant's jobs)
- SuperAdmins see all jobs
```

**UC9.9: Job Failure Alerts**
```
AI SKILL: None
AI CONTEXT: Monitoring, alerting
AI ROLE: Alert on repeated job failures

GIVEN job failed 3 times (max retries exceeded)
WHEN failure logged
THEN alert sent to ops team
AND include: job name, tenant, error message, stack trace

INTEGRATION TEST: Simulate job failure, verify alert

CONSTRAINTS:
- Alert channel: Email + Slack
- Alert includes link to Hangfire dashboard for job
```

**UC9.10: Job Observability - Tracing**
```
AI SKILL: None
AI CONTEXT: OpenTelemetry tracing
AI ROLE: Trace background job execution

GIVEN job enqueued from HTTP request
WHEN job executes
THEN trace includes:
  - HTTP request span (originator)
  - Job enqueue span
  - Job execution span
AND CorrelationId links all spans

INTEGRATION TEST: Real OpenTelemetry exporter

CONSTRAINTS:
- Trace context persisted with job metadata
- Job execution tagged with tenant, queue, job type
```

---

## MODULE 10: Platform.Integrations - HTTP Clients (Refit + Polly)

### AI Agent Context

```yaml
role: Integration Engineer
expertise:
  - Refit for typed HTTP clients
  - Polly for resilience (retry, circuit breaker, timeout)
  - OAuth2, mTLS, API Key authentication
  - HL7, FHIR, SAML
approach: Type-safe clients, resilient, observable
testing_framework: xUnit + WireMock for mocking HTTP APIs
environment: Aspire + WireMock container for testing
```

### Must-Have Features

**F1: Refit Typed Clients**
- Generate strongly-typed HTTP clients from interfaces
- Automatic request/response serialization
- Support all HTTP methods (GET, POST, PUT, DELETE, PATCH)

**F2: Authentication Handlers**
- OAuth2 (Client Credentials, Authorization Code)
- API Key (header or query string)
- Basic Auth (legacy systems)
- mTLS (medical records systems)
- Custom auth handlers

**F3: Polly Resilience Policies**
- Retry (transient failures: 408, 429, 503, 504)
- Circuit Breaker (prevent cascading failures)
- Timeout (prevent hung requests)
- Fallback (return default on failure)
- Bulkhead (limit concurrent requests)

**F4: Tenant-Specific Configuration**
- Each tenant can have different API endpoints
- Credentials stored securely (Key Vault or encrypted DB)
- Configuration cached for performance

**F5: Rate Limiting**
- Client-side rate limiting (respect API limits)
- Sliding window algorithm
- Per-tenant rate limits

**F6: Webhooks (Incoming)**
- Signature validation (verify sender)
- Idempotency (handle duplicates)
- Async processing (queue for background)

**F7: HL7 and FHIR Support**
- HL7v2 message parsing/generation
- FHIR JSON/XML (R4 standard)
- Integration with medical records systems

**F8: Observability**
- Trace all HTTP calls
- Metrics: request count, duration, errors
- Log request/response (with PII masking)

### Constraints

**C1: Security**
- Never log sensitive data (passwords, tokens, PII)
- Credentials encrypted at rest
- Use HTTPS always (no HTTP)
- Validate SSL certificates (no bypass in production)

**C2: Performance**
- HTTP client reuse (singleton HttpClient instances)
- Connection pooling
- Parallel requests where safe
- Timeout all requests (default 30s)

**C3: Reliability**
- Retry only idempotent operations (GET, PUT, DELETE)
- Never retry POST (unless idempotency key used)
- Circuit breaker threshold: 5 failures in 1 minute
- Fallback to cached data when possible

**C4: Compliance**
- HIPAA-compliant (encrypt PHI in transit and at rest)
- Audit all API calls
- Log retention: 7 years

**C5: Cost**
- Respect API rate limits (avoid overage charges)
- Cache API responses where appropriate
- Batch requests when possible

### TDD Use Cases

**UC10.1: Refit Client - Simple GET Request**
```
AI SKILL: None
AI CONTEXT: Refit interface definition
AI ROLE: Implement typed HTTP client

GIVEN Refit interface:
  public interface IMedicalRecordsApi
  {
      [Get("/patients/{id}")]
      Task<Patient> GetPatientAsync(string id);
  }

WHEN calling GetPatientAsync("12345")
THEN HTTP GET to /patients/12345
AND response deserialized to Patient object

UNIT TEST: WireMock server to mock API
INTEGRATION TEST: Real API (test environment)

CONSTRAINTS:
- Request timeout: 30 seconds
- Content-Type: application/json
```

**UC10.2: OAuth2 Authentication**
```
AI SKILL: None
AI CONTEXT: OAuth2 Client Credentials flow
AI ROLE: Implement token acquisition and refresh

GIVEN API requires OAuth2
WHEN making first request
THEN acquire access token from token endpoint
AND cache token (with expiry - 5 minutes)
AND include in Authorization header: "Bearer {token}"

WHEN token expires
THEN automatically refresh token
AND retry original request

UNIT TEST: Mock OAuth2 server
INTEGRATION TEST: Real OAuth2 provider (test account)

CONSTRAINTS:
- Token cache TTL: token expiry - 5 minutes (early refresh)
- Concurrent requests share token (no duplicate acquisition)
```

**UC10.3: Retry Policy - Transient Failures**
```
AI SKILL: None
AI CONTEXT: Polly retry policy
AI ROLE: Handle transient HTTP failures

GIVEN API returns 503 (Service Unavailable)
WHEN making request
THEN retry 3 times with exponential backoff: 1s, 2s, 4s
AND succeed if API recovers

UNIT TEST: WireMock returns 503 twice, then 200
INTEGRATION TEST: Simulate transient failures

CONSTRAINTS:
- Retry on: 408, 429, 503, 504
- Don't retry on: 400, 401, 403, 404, 500
- Max retries: 3
```

**UC10.4: Circuit Breaker - Prevent Cascading Failures**
```
AI SKILL: None
AI CONTEXT: Polly circuit breaker
AI ROLE: Implement circuit breaker pattern

GIVEN API consistently failing (5 failures in 1 minute)
WHEN circuit breaker opens
THEN subsequent requests fail fast (no attempt)
AND circuit breaker half-open after 30 seconds
AND close if next request succeeds

UNIT TEST: Mock API failures, verify circuit state
INTEGRATION TEST: Real API with simulated outage

CONSTRAINTS:
- Threshold: 5 failures
- Break duration: 30 seconds
- Half-open: 1 test request
```

**UC10.5: Tenant-Specific API Configuration**
```
AI SKILL: None
AI CONTEXT: Dynamic configuration per tenant
AI ROLE: Load API settings from tenant config

GIVEN Company "acme" configured with:
  - MedicalRecordsApi.BaseUrl = "https://acme-emr.example.com"
  - MedicalRecordsApi.ApiKey = "acme-key-123"

WHEN acme user makes API call
THEN use acme's base URL and API key

GIVEN Company "demo" has different config
THEN use demo's settings when demo user calls

UNIT TEST: Mock tenant configuration
INTEGRATION TEST: Real tenants with different configs

CONSTRAINTS:
- Configuration cached (5 min TTL)
- Credentials encrypted in database
```

**UC10.6: Rate Limiting - Client-Side**
```
AI SKILL: None
AI CONTEXT: Rate limiting (sliding window)
AI ROLE: Respect API provider rate limits

GIVEN API allows 100 requests/minute
WHEN making 101st request in same minute
THEN delay request until next window
AND log rate limit hit (for capacity planning)

UNIT TEST: Simulate high request rate
INTEGRATION TEST: Real API with rate limits

CONSTRAINTS:
- Rate limit configurable per API
- Sliding window (not fixed window)
- Queue requests if limit hit (don't fail immediately)
```

**UC10.7: Webhook Signature Validation**
```
AI SKILL: None
AI CONTEXT: HMAC signature verification
AI ROLE: Validate incoming webhook authenticity

GIVEN webhook from payment processor
WHEN webhook received at POST /webhooks/payments
THEN verify signature in X-Signature header
AND signature = HMAC-SHA256(payload, secret)
AND reject if signature invalid

UNIT TEST: Mock webhook with valid/invalid signatures
INTEGRATION TEST: Real webhook test events

CONSTRAINTS:
- Reject webhooks without signature
- Signature secret stored securely (Key Vault)
- Log all rejected webhooks (security audit)
```

**UC10.8: FHIR API Integration**
```
AI SKILL: None
AI CONTEXT: FHIR R4 standard
AI ROLE: Implement FHIR patient API

GIVEN FHIR-compliant EMR system
WHEN creating patient record
THEN send FHIR Bundle:
  POST /fhir/Patient
  Content-Type: application/fhir+json
  Body: { "resourceType": "Patient", "name": [...], ... }

WHEN querying patient
THEN GET /fhir/Patient/{id}
AND parse FHIR JSON response

UNIT TEST: FHIR JSON serialization/deserialization
INTEGRATION TEST: FHIR test server

CONSTRAINTS:
- FHIR R4 compliance
- Validate FHIR resources before sending
- Handle FHIR OperationOutcome errors
```

**UC10.9: mTLS Authentication**
```
AI SKILL: None
AI CONTEXT: Mutual TLS certificate authentication
AI ROLE: Configure client certificate

GIVEN medical records API requires mTLS
WHEN configuring HttpClient
THEN attach client certificate
AND certificate validated by server

INTEGRATION TEST: mTLS-enabled test server

CONSTRAINTS:
- Certificates stored in Key Vault
- Certificate rotation supported
- Validate server certificate (no bypass)
```

**UC10.10: HTTP Call Tracing**
```
AI SKILL: None
AI CONTEXT: OpenTelemetry HTTP instrumentation
AI ROLE: Trace HTTP requests

GIVEN HTTP request to external API
WHEN request initiated
THEN trace includes:
  - HTTP method, URL
  - Request headers (sanitized)
  - Response status code
  - Duration

AND trace linked to parent request

INTEGRATION TEST: Real OpenTelemetry exporter

CONSTRAINTS:
- PII masking in logs (SSN, credit card, etc.)
- Trace all outbound HTTP calls
- Tag with: tenant, api_name, endpoint
```

---

## MODULE 11: Platform.Observability - OpenTelemetry

### AI Agent Context

```yaml
role: Observability Engineer
expertise:
  - OpenTelemetry (tracing, metrics, logs)
  - Structured logging (Serilog)
  - Azure Monitor / Application Insights
approach: Instrument everything, correlate with tenant context
testing_framework: xUnit + OpenTelemetry test exporter
environment: Aspire + Azure Monitor emulator (or local collector)
```

### Must-Have Features

**F1: Distributed Tracing**
- Trace all HTTP requests, database queries, cache operations, HTTP calls
- Parent-child span relationships
- Correlation IDs across services

**F2: Metrics**
- Request count, duration, errors
- Database query performance
- Cache hit/miss ratio
- Custom business metrics (residents admitted, medications given)

**F3: Structured Logging**
- Serilog for structured logs
- Enrich logs with tenant context (CompanyId, FacilityId, UserId)
- Log levels: Trace, Debug, Info, Warning, Error, Critical

**F4: Tenant-Aware Observability**
- Every trace/log/metric tagged with tenant info
- Query performance by tenant
- Alert per tenant (threshold violations)

**F5: Correlation**
- Link logs, traces, metrics via CorrelationId
- End-to-end visibility (HTTP request → DB query → cache → message → background job)

**F6: Exporters**
- Azure Monitor / Application Insights (production)
- Console exporter (development)
- OTLP exporter (OpenTelemetry protocol, for Jaeger, Zipkin, etc.)

**F7: Sampling**
- Always sample errors
- Sample successful requests (e.g., 10%) in high traffic
- Tenant-specific sampling (higher for premium tiers)

**F8: Dashboards**
- Pre-built dashboards: request rate, latency, errors
- Tenant performance comparison
- SLA monitoring

### Constraints

**C1: Performance**
- Instrumentation overhead < 5% latency
- Async export (don't block requests)
- Buffer and batch (reduce network calls)

**C2: Privacy**
- Never log PII without masking
- Scrub sensitive data from traces (SSN, credit card)
- Comply with GDPR, HIPAA

**C3: Cost**
- Sample aggressively in production (can't trace everything)
- Retain traces: 7 days (longer for errors)
- Archive metrics: 90 days

**C4: Reliability**
- Exporter failure doesn't crash app (fail-safe)
- Buffer traces/logs locally if exporter down
- Alert if export failing

**C5: Standardization**
- Use OpenTelemetry semantic conventions
- Consistent naming (snake_case for metrics, PascalCase for spans)

### TDD Use Cases

**UC11.1: Trace HTTP Request**
```
AI SKILL: None
AI CONTEXT: OpenTelemetry ASP.NET Core instrumentation
AI ROLE: Auto-trace all HTTP requests

GIVEN HTTP request: GET /api/residents/123
WHEN request processed
THEN trace created with:
  - Span name: "GET /api/residents/{id}"
  - HTTP method, URL, status code
  - Duration
  - Tenant tags: company_id, facility_id, user_id

INTEGRATION TEST: Real HTTP request, verify trace exported

CONSTRAINTS:
- Auto-instrumentation via OpenTelemetry SDK
- URL template (not full URL with IDs) for grouping
```

**UC11.2: Trace Database Query**
```
AI SKILL: None
AI CONTEXT: EF Core instrumentation
AI ROLE: Trace all DB queries

GIVEN querying residents from database
WHEN query executes
THEN trace span created with:
  - Span name: "SELECT Residents"
  - SQL query (parameterized)
  - Database name
  - Duration
  - Row count

AND span is child of HTTP request span

INTEGRATION TEST: Real EF Core query, verify span

CONSTRAINTS:
- Use parameterized queries in logs (no raw SQL with data)
- Tag with: db.system (SQL Server), db.name (tenant-db)
```

**UC11.3: Custom Business Metric**
```
AI SKILL: None
AI CONTEXT: OpenTelemetry metrics API
AI ROLE: Track business KPIs

GIVEN resident admitted
WHEN ResidentAdmittedEvent processed
THEN increment metric:
  - Name: "residents.admitted"
  - Tags: company_id, facility_id
  - Type: Counter

WHEN querying metrics
THEN group by company_id to see admission rate per company

UNIT TEST: Mock metric recorder
INTEGRATION TEST: Real metrics exporter

CONSTRAINTS:
- Metrics exported every 60 seconds
- Dimensions: company_id, facility_id, admission_type
```

**UC11.4: Structured Logging with Tenant Context**
```
AI SKILL: None
AI CONTEXT: Serilog structured logging
AI ROLE: Enrich logs with context

GIVEN current context is Company "acme", Facility "building-a", User "john@example.com"
WHEN logging: _logger.LogInformation("Resident admitted: {ResidentId}", residentId)
THEN log entry includes:
  - Message: "Resident admitted: 12345"
  - Timestamp (UTC)
  - Level: Information
  - CompanyId: "acme"
  - FacilityId: "building-a"
  - UserId: "john-id"
  - TraceId: (from OpenTelemetry)

INTEGRATION TEST: Real log sink, query logs

CONSTRAINTS:
- Use structured logging (not string concatenation)
- Enrich with tenant context automatically (via Serilog enricher)
```

**UC11.5: Correlation Across Services**
```
AI SKILL: None
AI CONTEXT: W3C Trace Context propagation
AI ROLE: Link distributed traces

GIVEN HTTP request triggers message to RabbitMQ
WHEN message published
THEN TraceId/SpanId propagated in message headers
AND consumer creates child span with same TraceId

WHEN querying trace
THEN see full end-to-end flow:
  1. HTTP request span
  2. Message publish span
  3. Message consume span
  4. Database write span

INTEGRATION TEST: Real HTTP → RabbitMQ → DB flow

CONSTRAINTS:
- Use W3C Trace Context standard
- Propagate via headers: traceparent, tracestate
```

**UC11.6: Sampling Strategy**
```
AI SKILL: None
AI CONTEXT: Probabilistic sampling
AI ROLE: Reduce trace volume in production

GIVEN production environment with high traffic
WHEN configuring sampler
THEN sample:
  - 100% of errors (status code >= 400)
  - 100% of slow requests (> 5s)
  - 10% of successful fast requests

INTEGRATION TEST: Verify sampling rates

CONSTRAINTS:
- Always sample errors (for debugging)
- Sampling configurable per environment
- Tenant override: Premium tenants = 100% sampling
```

**UC11.7: Alert on Anomalies**
```
AI SKILL: None
AI CONTEXT: Azure Monitor alerts
AI ROLE: Configure proactive alerts

GIVEN metric: "database.query.duration"
WHEN P95 latency > 1 second for 5 minutes
THEN alert: "Database performance degraded"
AND include: affected company_id, query type

INTEGRATION TEST: Simulate slow queries, verify alert

CONSTRAINTS:
- Alert channels: Email, Slack, PagerDuty
- Alert includes: metric value, threshold, time range, link to dashboard
```

**UC11.8: Dashboard - Request Rate by Tenant**
```
AI SKILL: /mnt/skills/public/xlsx/SKILL.md (for generating dashboard spec)
AI CONTEXT: Azure Monitor workbooks or Grafana
AI ROLE: Build tenant performance dashboard

GIVEN dashboard for ops team
WHEN viewing dashboard
THEN see charts:
  - Request rate (req/sec) by company_id
  - P50, P95, P99 latency by company_id
  - Error rate by company_id
  - Top endpoints by request count

CONSTRAINTS:
- Real-time (1 min refresh)
- Filterable by company, facility, time range
```

**UC11.9: PII Masking in Logs**
```
AI SKILL: None
AI CONTEXT: Data privacy, log scrubbing
AI ROLE: Prevent PII leakage in logs

GIVEN logging resident information
WHEN log contains SSN: "123-45-6789"
THEN SSN masked: "***-**-****"

WHEN log contains email: "john@example.com"
THEN email partially masked: "j***@example.com"

UNIT TEST: Verify masking rules
INTEGRATION TEST: Real logs, verify no PII

CONSTRAINTS:
- Mask: SSN, credit card, phone, email (partial)
- Use regex patterns for detection
- Configurable mask patterns
```

**UC11.10: Export Failure Handling**
```
AI SKILL: None
AI CONTEXT: Resilient exporters
AI ROLE: Handle exporter outages gracefully

GIVEN Azure Monitor exporter down
WHEN traces generated
THEN buffer traces locally (max 1000 traces)
AND periodically retry export
AND drop oldest traces if buffer full

INTEGRATION TEST: Simulate exporter failure

CONSTRAINTS:
- Buffer size: 1000 traces
- Retry interval: 30 seconds
- Don't crash app on export failure
- Alert if export failing > 5 minutes
```

---

## MODULE 12: Platform.Admin - Admin Module

### AI Agent Context

```yaml
role: Full-Stack Engineer (Admin Domain)
expertise:
  - ASP.NET Core MVC
  - Entity Framework Core
  - Blazor or Razor Pages for admin UI
approach: CRUD operations, multi-tenant, auditable
testing_framework: xUnit + Playwright for E2E
environment: Aspire + all dependencies
```

### Must-Have Features

**F1: Company Management**
- Create, edit, disable companies
- Assign database mapping (which tenant DB to use)
- Configure subscription tier (Free, Standard, Premium)

**F2: Facility Management**
- Add facilities to company
- Edit facility details
- Enable/disable facilities

**F3: User Management**
- Create users (with email invitation)
- Assign roles (CompanyAdmin, FacilityAdmin, etc.)
- Grant facility access
- Disable users (soft delete)

**F4: Claims & Entitlements**
- Assign permissions to roles
- View user's effective permissions
- Audit permission changes

**F5: Feature Flags Admin**
- Toggle global flags
- Override flags per tenant
- View flag usage

**F6: Audit Log Viewer**
- Query audit logs (by user, date, entity, action)
- Export audit logs (CSV)

**F7: Health Dashboard**
- View system health (database, cache, queues)
- Recent errors
- Performance metrics (request rate, latency)

**F8: Background Job Monitor**
- Hangfire dashboard integration
- View job status (succeeded, failed, in-progress)
- Retry failed jobs

### Constraints

**C1: Security**
- Admin endpoints require SuperAdmin or CompanyAdmin role
- CompanyAdmins can only manage own company
- SuperAdmins can manage all companies

**C2: Audit Everything**
- All admin actions logged (who, what, when)
- Immutable audit trail

**C3: Validation**
- Prevent invalid states (e.g., can't delete company with active users)
- Validate email uniqueness
- Validate facility belongs to company

**C4: Performance**
- Paginate large lists (companies, users, facilities)
- Search with indexes

**C5: User Experience**
- Confirmation modals for destructive actions
- Helpful error messages
- Breadcrumb navigation

### TDD Use Cases

**UC12.1: Create Company**
```
AI SKILL: /mnt/skills/public/frontend-design/SKILL.md
AI CONTEXT: MVC controller, Razor form validation
AI ROLE: Implement company creation

GIVEN SuperAdmin user
WHEN POST /admin/companies
WITH: Name, Tier, DatabaseConnectionString
THEN company created in Admin DB
AND database mapping created
AND audit log entry created

E2E TEST: Playwright automation

CONSTRAINTS:
- Name unique
- ConnectionString validated (test connectivity)
- Default subscription tier: Free
```

**UC12.2: Assign Facility to Company**
```
AI SKILL: None
AI CONTEXT: Hierarchical data management
AI ROLE: Implement facility assignment

GIVEN company "acme" exists
WHEN creating facility "Sunrise of Arlington"
THEN facility linked to company
AND facility visible in company's facilities list

NEGATIVE TEST:
- Create facility for non-existent company → Error

CONSTRAINTS:
- Facility name unique within company
- Facility can't be moved to different company (immutable)
```

**UC12.3: Create User and Assign Roles**
```
AI SKILL: None
AI CONTEXT: ASP.NET Core Identity, email invitations
AI ROLE: Implement user provisioning

GIVEN CompanyAdmin of company "acme"
WHEN creating user "jane@acme.com" with role "FacilityAdmin"
THEN user record created
AND role assigned
AND email invitation sent
AND user must set password on first login

E2E TEST: Full user creation flow

CONSTRAINTS:
- Email unique globally
- CompanyAdmins can only create users in own company
- SuperAdmins can create users in any company
```

**UC12.4: Grant Facility Access to User**
```
AI SKILL: None
AI CONTEXT: Access control, permissions
AI ROLE: Implement facility access grants

GIVEN user "jane" in company "acme"
WHEN granting access to facilities "building-a" and "building-b"
THEN user's facility access list updated
AND user can switch between those facilities
AND user cannot access "building-c"

INTEGRATION TEST: Real database, verify access filtering

CONSTRAINTS:
- Can only grant access to facilities within user's company
- Audit log records grant/revoke
```

**UC12.5: Toggle Feature Flag**
```
AI SKILL: None
AI CONTEXT: Feature flag management UI
AI ROLE: Implement flag toggle

GIVEN SuperAdmin viewing feature flags
WHEN toggling "NewDashboard" from disabled to enabled
THEN flag updated in database
AND cache invalidated
AND audit log entry created
AND confirmation modal shown before change

E2E TEST: Playwright toggle flow

CONSTRAINTS:
- Toggle requires confirmation (prevent accidents)
- Audit log includes: flag name, old value, new value, reason
```

**UC12.6: View Audit Logs**
```
AI SKILL: None
AI CONTEXT: Audit log querying
AI ROLE: Implement audit log viewer

GIVEN CompanyAdmin of company "acme"
WHEN viewing audit logs
THEN see only logs for company "acme"
AND filter by: user, date range, entity type, action
AND paginate results (50 per page)

GIVEN SuperAdmin
THEN see logs for all companies

INTEGRATION TEST: Real database with audit entries

CONSTRAINTS:
- Search indexed (EntityType, UserId, Timestamp)
- Export to CSV (max 10,000 records)
```

**UC12.7: Health Dashboard**
```
AI SKILL: /mnt/skills/public/frontend-design/SKILL.md
AI CONTEXT: Health checks, real-time dashboard
AI ROLE: Build admin health dashboard

GIVEN SuperAdmin viewing dashboard
WHEN page loads
THEN see:
  - Database status (healthy/unhealthy)
  - Redis status
  - RabbitMQ status
  - Recent errors (last 24 hours)
  - Request rate (last 1 hour)
  - P95 latency

E2E TEST: Playwright verify dashboard loads

CONSTRAINTS:
- Auto-refresh every 30 seconds
- Click error to see details
```

**UC12.8: Hangfire Job Monitor**
```
AI SKILL: None
AI CONTEXT: Hangfire dashboard integration
AI ROLE: Embed Hangfire dashboard in admin

GIVEN SuperAdmin accessing /admin/jobs
WHEN viewing jobs
THEN redirect to Hangfire dashboard
AND see job status (succeeded, failed, in-progress)
AND retry failed jobs

CONSTRAINTS:
- Hangfire dashboard secured (admin only)
- Tenant-scoped for CompanyAdmins (see only their jobs)
- SuperAdmins see all jobs
```

**UC12.9: Disable User**
```
AI SKILL: None
AI CONTEXT: Soft delete, cascading access revocation
AI ROLE: Implement user deactivation

GIVEN active user "john@acme.com"
WHEN CompanyAdmin disables user
THEN user's IsActive flag set to false
AND user cannot log in
AND user's sessions invalidated (force logout)
AND audit log entry created

INTEGRATION TEST: Verify login fails after disable

CONSTRAINTS:
- Soft delete (don't delete from DB)
- Re-enable capability (set IsActive back to true)
```

**UC12.10: Database Mapping Configuration**
```
AI SKILL: None
AI CONTEXT: Company-to-database mapping
AI ROLE: Configure multi-database scenarios

GIVEN company "large-enterprise" with data residency requirement
WHEN configuring database mapping
THEN can assign multiple databases to company:
  - Primary DB: "large-enterprise-us-east"
  - Secondary DB: "large-enterprise-eu-west"

AND queries routed based on facility location

INTEGRATION TEST: Real multi-database setup

CONSTRAINTS:
- Complex scenario (most companies use single DB)
- Validate connection strings before saving
- Test connectivity during configuration
```

---

## MODULE 13: Platform.Residents - Residents Module

### AI Agent Context

```yaml
role: Domain Expert (Healthcare/Senior Living)
expertise:
  - Healthcare workflows (admissions, care plans, medications)
  - HIPAA compliance
  - ASP.NET Core MVC
  - Complex business logic
approach: Domain-driven design, rich domain models
testing_framework: xUnit + domain event testing
environment: Aspire + full stack
```

### Must-Have Features

**F1: Resident Admission**
- Capture resident demographics
- Assign to facility
- Admission date, room number
- Emergency contact information

**F2: Care Plans**
- Create care plan for resident
- Define care activities (medication, meals, exercise)
- Schedule recurring activities

**F3: Medication Management**
- Record medications prescribed
- Schedule medication administration
- Mark medication as given
- Alert on missed doses

**F4: Activity Logs**
- Log daily activities (meals eaten, exercise, social activities)
- Caregiver notes
- Timeline view of resident's day

**F5: Billing**
- Track services provided
- Generate invoices
- Payment tracking

**F6: Documents**
- Upload resident documents (medical records, ID, contracts)
- Secure storage (HIPAA-compliant)
- Version history

**F7: Family Portal Integration**
- Share updates with family
- Photo sharing
- Messaging

**F8: Reporting**
- Resident census
- Medication compliance
- Activity participation

### Constraints

**C1: HIPAA Compliance**
- PHI (Protected Health Information) encrypted at rest and in transit
- Audit all PHI access
- Business Associate Agreements (BAAs) with vendors

**C2: Data Integrity**
- Medications require two-factor confirmation (nurse + witness)
- Care plans approved by physician
- Cannot delete records (soft delete only)

**C3: Performance**
- Resident list query < 500ms (with pagination)
- Search residents < 200ms (indexed)
- Timeline view < 1 second (with lazy loading)

**C4: Regulatory**
- Retain records: 7 years (state requirement)
- Incident reporting (mandatory for certain events)
- Medication error tracking

**C5: User Experience**
- Mobile-friendly (caregivers use tablets)
- Offline capability for activity logging (sync later)
- Quick actions (mark medication given in 2 clicks)

### TDD Use Cases

**UC13.1: Admit New Resident**
```
AI SKILL: None
AI CONTEXT: Resident aggregate root, domain events
AI ROLE: Implement resident admission workflow

GIVEN FacilityAdmin in facility "building-a"
WHEN admitting resident:
  - Name: "John Doe"
  - DOB: 1940-05-15
  - Room: "101A"
  - AdmissionDate: today
THEN resident record created in Tenant DB
AND ResidentAdmittedEvent published
AND family notified (if family portal enabled)

INTEGRATION TEST: Full admission flow with event

CONSTRAINTS:
- Resident name required
- DOB validated (must be > 60 years old)
- Room availability checked
- CompanyId and FacilityId automatically assigned from context
```

**UC13.2: Create Care Plan**
```
AI SKILL: None
AI CONTEXT: Care plan as aggregate
AI ROLE: Implement care plan creation

GIVEN resident "John Doe" admitted
WHEN creating care plan:
  - Medications: ["Aspirin 81mg daily", "Lisinopril 10mg daily"]
  - Meals: 3 meals/day
  - Exercise: "Walk 15 minutes, twice daily"
THEN care plan saved
AND activities scheduled (recurring jobs)
AND CarePlanCreatedEvent published

INTEGRATION TEST: Verify Hangfire jobs created for recurring activities

CONSTRAINTS:
- Care plan requires physician approval (workflow)
- Care plan version tracked (changes create new version)
```

**UC13.3: Administer Medication**
```
AI SKILL: None
AI CONTEXT: Medication administration, audit trail
AI ROLE: Implement medication logging

GIVEN scheduled medication "Aspirin 81mg at 8:00 AM"
WHEN nurse marks medication as given:
  - Timestamp: 8:05 AM
  - AdministeredBy: Nurse ID
  - WitnessedBy: Witness ID (optional, required for controlled substances)
THEN medication record updated
AND MedicationGivenEvent published
AND audit log entry created

INTEGRATION TEST: Full medication flow

CONSTRAINTS:
- Cannot mark medication given > 2 hours late (requires incident report)
- Controlled substances require witness signature
- Audit trail immutable
```

**UC13.4: Log Activity**
```
AI SKILL: None
AI CONTEXT: Activity logging, timeline
AI ROLE: Implement resident activity logging

GIVEN caregiver on tablet
WHEN logging activity:
  - Type: "Meal"
  - Description: "Lunch - ate 75%"
  - Timestamp: now
THEN activity saved to ResidentActivities (Cosmos DB)
AND visible in resident timeline
AND family notified (if opted in)

INTEGRATION TEST: Cosmos DB write, timeline query

CONSTRAINTS:
- Activities partitioned by ResidentId in Cosmos
- Timeline query < 1 second (last 30 days)
- Offline logging (queue if no internet, sync later)
```

**UC13.5: Search Residents**
```
AI SKILL: None
AI CONTEXT: Full-text search, indexing
AI ROLE: Implement resident search

GIVEN 500 residents in facility
WHEN searching "John"
THEN return residents with "John" in name
AND order by relevance (last name match > first name)
AND paginate results (50 per page)

INTEGRATION TEST: Real database with search index

CONSTRAINTS:
- Search indexed (Name, Room)
- Search time < 200ms
- Respects tenant filters (only current company/facility)
```

**UC13.6: Generate Resident Census Report**
```
AI SKILL: None
AI CONTEXT: Reporting, data aggregation
AI ROLE: Implement census report

GIVEN facility "building-a" with 50 residents
WHEN generating census report for last month
THEN report includes:
  - Total residents: 50
  - New admissions: 5
  - Discharges: 2
  - Average length of stay: 180 days
AND export to PDF

INTEGRATION TEST: Real data, verify calculations

CONSTRAINTS:
- Report generation uses read replica (not primary DB)
- Heavy query (> 1 sec) → background job, email when ready
```

**UC13.7: Upload Resident Document**
```
AI SKILL: None
AI CONTEXT: Document management, encryption
AI ROLE: Implement HIPAA-compliant document upload

GIVEN resident "John Doe"
WHEN uploading medical record (PDF)
THEN upload to Blob Storage with path:
  - "acme/building-a/residents/john-doe-id/medical-records/record-v1.pdf"
AND encrypt file at rest (Blob encryption)
AND log document access (audit trail)

INTEGRATION TEST: Real Blob upload, verify encryption

CONSTRAINTS:
- Max file size: 50 MB
- Allowed types: PDF, DOCX, JPEG, PNG
- Retain forever (HIPAA requirement)
```

**UC13.8: Share Update with Family**
```
AI SKILL: None
AI CONTEXT: Family portal integration
AI ROLE: Implement family communication

GIVEN resident "John Doe" has family portal access
WHEN caregiver shares update: "John enjoyed bingo today!"
THEN message published to FamilyUpdateEvent
AND family receives notification (email + push)
AND visible in family portal

INTEGRATION TEST: Event published, family notified

CONSTRAINTS:
- Family opt-in required (privacy)
- HIPAA-compliant (no PHI in notifications)
- Rate limit: 5 updates/day per resident
```

**UC13.9: Medication Compliance Report**
```
AI SKILL: None
AI CONTEXT: Compliance reporting
AI ROLE: Implement medication adherence tracking

GIVEN resident "John Doe" with scheduled medications
WHEN generating compliance report for last 30 days
THEN report shows:
  - Total scheduled: 90 doses (3/day × 30 days)
  - Administered: 88 doses
  - Missed: 2 doses
  - Compliance rate: 97.8%

INTEGRATION TEST: Real medication data

CONSTRAINTS:
- Report by resident, medication, or facility
- Flag low compliance (< 95%) for review
```

**UC13.10: Incident Reporting**
```
AI SKILL: None
AI CONTEXT: Regulatory compliance, incident tracking
AI ROLE: Implement mandatory incident reporting

GIVEN resident fall incident
WHEN logging incident:
  - Type: "Fall"
  - Severity: "Minor"
  - Description: "Resident slipped in bathroom"
  - Actions: "Ice applied, physician notified"
THEN incident record created
AND IncidentReportedEvent published
AND state regulatory agency notified (if severity > threshold)
AND family notified

INTEGRATION TEST: Full incident flow

CONSTRAINTS:
- Incidents reported within 24 hours (state law)
- Serious incidents (hospital admission) → immediate notification
- Audit trail of all incident actions
```

---

## MODULE 14: Platform.Families - Family Portal Module

### AI Agent Context

```yaml
role: Full-Stack Engineer (Family Portal)
expertise:
  - Public-facing web application
  - Blazor or React for SPA
  - SignalR for real-time updates
  - Mobile-first design
approach: User-friendly, privacy-first, accessible
testing_framework: xUnit + Playwright for E2E
environment: Aspire + all dependencies
```

### Must-Have Features

**F1: Family Member Registration**
- Self-registration with email verification
- Link to resident (requires facility staff approval)
- Multi-family support (one member linked to multiple residents)

**F2: Resident Updates Feed**
- View updates from facility (photos, notes, activities)
- Real-time notifications (SignalR)
- Like and comment on updates

**F3: Messaging**
- Send messages to facility staff
- Receive responses
- Message history

**F4: Photo Gallery**
- View resident photos
- Download photos
- Tag family members in photos

**F5: Billing & Payments**
- View invoices
- Make payments (Stripe integration)
- Payment history

**F6: Visit Scheduling**
- Schedule visit with resident
- Facility approves/rejects visit
- Calendar integration

**F7: Notifications**
- Email notifications for updates
- Push notifications (mobile)
- SMS notifications (optional)

**F8: Privacy Controls**
- Family member can opt out of updates
- Granular notification preferences
- HIPAA-compliant (no PHI without consent)

### Constraints

**C1: Privacy & Security**
- Family access requires facility approval
- No PHI shared without consent
- Audit all family access to resident data

**C2: Multi-Resident Support**
- One family member can link to multiple residents across different facilities/companies
- Switching between residents seamless

**C3: Performance**
- Updates feed loads < 2 seconds
- Real-time notifications < 1 second
- Mobile-optimized (low bandwidth)

**C4: Accessibility**
- WCAG 2.1 AA compliance
- Screen reader friendly
- Large fonts for seniors

**C5: Offline Support**
- View cached updates offline
- Queue messages to send when back online

### TDD Use Cases

**UC14.1: Family Member Registration**
```
AI SKILL: /mnt/skills/public/frontend-design/SKILL.md
AI CONTEXT: Public registration form
AI ROLE: Implement self-registration

GIVEN new family member "jane@example.com"
WHEN registering:
  - Name: "Jane Doe"
  - Email: "jane@example.com"
  - Relation: "Daughter"
  - Resident: "John Doe" (search by name)
THEN family member record created
AND email verification sent
AND facility notified for approval

E2E TEST: Playwright full registration flow

CONSTRAINTS:
- Email verification required
- Facility staff must approve link (prevent unauthorized access)
```

**UC14.2: Link to Resident After Approval**
```
AI SKILL: None
AI CONTEXT: Approval workflow
AI ROLE: Implement family-resident linking

GIVEN facility staff reviewing pending link request
WHEN approving "Jane Doe" link to "John Doe"
THEN ResidentFamilyMapping created
AND Jane granted access to John's updates
AND Jane receives confirmation email

INTEGRATION TEST: Full approval workflow

CONSTRAINTS:
- Multiple family members can link to same resident
- One family member can link to multiple residents
- Cross-company support (Jane's mother in facility A, father in facility B)
```

**UC14.3: View Updates Feed**
```
AI SKILL: /mnt/skills/public/frontend-design/SKILL.md
AI CONTEXT: Feed UI, infinite scroll
AI ROLE: Implement real-time updates feed

GIVEN Jane linked to resident "John Doe"
WHEN viewing updates feed
THEN see updates for John (last 30 days)
AND ordered by timestamp (newest first)
AND lazy load more on scroll

WHEN new update posted by facility
THEN SignalR notification received
AND update appears in feed (no refresh needed)

E2E TEST: Real-time update simulation

CONSTRAINTS:
- Feed query < 2 seconds
- Real-time updates via SignalR
- Pagination: 20 updates per page
```

**UC14.4: Send Message to Facility**
```
AI SKILL: None
AI CONTEXT: Messaging system
AI ROLE: Implement family-facility messaging

GIVEN Jane viewing John's updates
WHEN sending message: "Can you send more photos?"
THEN message saved to Messages table
AND facility staff notified (email + dashboard)
AND message appears in Jane's message history

INTEGRATION TEST: Full messaging flow

CONSTRAINTS:
- Messages threaded by conversation
- Facility can reply (two-way messaging)
- Message retention: 90 days
```

**UC14.5: Photo Gallery**
```
AI SKILL: /mnt/skills/public/frontend-design/SKILL.md
AI CONTEXT: Photo gallery UI
AI ROLE: Implement photo viewing

GIVEN facility shared 10 photos of John
WHEN Jane views photo gallery
THEN see thumbnails (grid layout)
AND click to view full size
AND download option available

INTEGRATION TEST: Real Blob URLs

CONSTRAINTS:
- Photos served from Cloudinary (optimized for web)
- Lazy load images (performance)
- Download watermarked with "Facility Name" (prevent misuse)
```

**UC14.6: Make Payment**
```
AI SKILL: None
AI CONTEXT: Stripe payment integration
AI ROLE: Implement secure payment

GIVEN invoice for John's care: $5,000
WHEN Jane makes payment via Stripe
THEN payment processed securely
AND invoice marked as paid
AND receipt emailed to Jane

INTEGRATION TEST: Stripe test mode

CONSTRAINTS:
- PCI-DSS compliant (Stripe handles card data)
- Payment confirmation within 5 seconds
- Retry on transient failures
```

**UC14.7: Visit Scheduling**
```
AI SKILL: None
AI CONTEXT: Calendar integration
AI ROLE: Implement visit booking

GIVEN Jane wants to visit John
WHEN scheduling visit:
  - Date: Next Saturday
  - Time: 2:00 PM - 4:00 PM
THEN visit request sent to facility
AND facility approves/rejects
AND calendar invite sent to Jane (ICS file)

INTEGRATION TEST: Full scheduling flow

CONSTRAINTS:
- Facility sets visiting hours
- Max visitors per resident configurable
- Automatic reminders (email 1 day before)
```

**UC14.8: Notification Preferences**
```
AI SKILL: None
AI CONTEXT: User preferences
AI ROLE: Implement granular notification controls

GIVEN Jane's notification preferences
WHEN configuring:
  - Email: Yes (for all updates)
  - Push: Yes (for important updates only)
  - SMS: No
THEN preferences saved
AND notifications sent accordingly

INTEGRATION TEST: Verify notification delivery

CONSTRAINTS:
- Opt-out option for all notifications
- Granular: updates, messages, billing, visits
- GDPR-compliant (easy opt-out)
```

**UC14.9: Multi-Resident Dashboard**
```
AI SKILL: /mnt/skills/public/frontend-design/SKILL.md
AI CONTEXT: Aggregated dashboard
AI ROLE: Implement cross-resident view

GIVEN Jane linked to mother (Facility A) and father (Facility B)
WHEN viewing dashboard
THEN see:
  - Combined updates feed (both residents)
  - Separate tabs for each resident
  - Switch between residents seamlessly

E2E TEST: Playwright multi-resident flow

CONSTRAINTS:
- Dashboard aggregates across companies/facilities
- Clear indication which update is for which resident
- Filter by resident
```

**UC14.10: Privacy Audit Log**
```
AI SKILL: None
AI CONTEXT: HIPAA compliance, audit trail
AI ROLE: Track family member access

GIVEN Jane viewing John's updates
WHEN accessing any data
THEN audit log entry created:
  - Who: Jane's UserId
  - What: Update viewed
  - When: Timestamp
  - Resident: John's ResidentId

INTEGRATION TEST: Verify audit entries

CONSTRAINTS:
- Audit all PHI access
- Retain audit logs: 7 years
- Queryable by resident, date, action
```

---

## Final Implementation Checklist

### Pre-Implementation (Before Any Code)

- [ ] Review all module specifications
- [ ] Set up Aspire AppHost project
- [ ] Configure Docker Compose for dependencies
- [ ] Create solution structure (modular monolith folders)
- [ ] Set up CI/CD pipeline (GitHub Actions or Azure DevOps)
- [ ] Configure OpenTelemetry exporters
- [ ] Establish code review process

### Module Implementation Order

**Phase 0: Foundation (Weeks 1-12)**
1. [ ] Module 1: Platform.Core (Contexts)
2. [ ] Module 2: Platform.Data (DbContexts)
3. [ ] Module 11: Platform.Observability (early, needed for all modules)
4. [ ] Module 3: Platform.Auth
5. [ ] Module 4: Platform.FeatureFlags
6. [ ] Module 5: Platform.Storage
7. [ ] Module 6: Platform.FrequentAssets
8. [ ] Module 7: Platform.Caching
9. [ ] Module 8: Platform.Messaging
10. [ ] Module 9: Platform.BackgroundJobs
11. [ ] Module 10: Platform.Integrations
12. [ ] 10 POC Use Cases (validate framework)

**Phase 1-4: Business Logic (Weeks 13-30)**
13. [ ] Module 12: Platform.Admin
14. [ ] Module 13: Platform.Residents
15. [ ] Module 14: Platform.Families
16. [ ] Migrate existing integrations
17. [ ] Decommission old platform

### Success Criteria Per Module

- [ ] All TDD use cases pass (unit + integration + E2E)
- [ ] Code coverage > 80%
- [ ] Documentation complete (README + API docs)
- [ ] Performance benchmarks met
- [ ] Security scan passed (no critical vulnerabilities)
- [ ] Peer review approved
- [ ] Deployed to staging environment
- [ ] Smoke tests passed

---

## Glossary (Extended)

**Aggregate Root:** DDD pattern - entity that controls access to a cluster of related entities  
**Aspire:** .NET orchestration framework for distributed applications  
**Backplane:** Message bus for cache invalidation across multiple app instances  
**Circuit Breaker:** Resilience pattern to fail fast when service is down  
**Cosmos DB:** Azure NoSQL database (document store)  
**DDD (Domain-Driven Design):** Software design approach focused on business domain  
**Durable Functions:** Azure Functions with state persistence (long-running workflows)  
**EF Core (Entity Framework Core):** ORM for .NET  
**FHIR:** Fast Healthcare Interoperability Resources (HL7 standard)  
**FusionCache:** Advanced caching library (L1 + L2 + backplane)  
**Hangfire:** Background job framework for .NET  
**HIPAA:** Health Insurance Portability and Accountability Act (US healthcare privacy law)  
**HL7:** Health Level 7 (healthcare data exchange standard)  
**Idempotent:** Operation that produces same result if executed multiple times  
**LINQ:** Language Integrated Query (.NET)  
**mTLS:** Mutual TLS (both client and server authenticate with certificates)  
**OAuth2:** Authorization framework (delegated access)  
**OpenTelemetry:** Observability framework (traces, metrics, logs)  
**Outbox Pattern:** Transactional messaging pattern  
**PHI:** Protected Health Information (HIPAA term)  
**Polly:** .NET resilience library  
**Refit:** Type-safe REST client library  
**SAS:** Shared Access Signature (Azure Storage time-limited token)  
**SignalR:** Real-time communication library for .NET  
**Strangler Pattern:** Gradual migration by replacing parts incrementally  
**TDD:** Test-Driven Development  
**Testcontainers:** Library to run Docker containers in tests  
**WCAG:** Web Content Accessibility Guidelines

---

## AI Agent Quick Reference

### When Starting a Module

1. Read module specification (this document)
2. Read referenced AI skills (if any)
3. Set up test project: `{ModuleName}.Tests`
4. Create first failing test (UC X.1)
5. Implement until green
6. Refactor
7. Repeat for all use cases
8. Integration tests with Docker
9. E2E tests (if applicable)
10. Document with examples
11. Submit for review

### Testing Commands

```bash
# Run all unit tests
dotnet test --filter Category=Unit

# Run integration tests (Docker required)
dotnet test --filter Category=Integration

# Run E2E tests
dotnet test --filter Category=E2E

# Code coverage
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover

# Run specific module tests
dotnet test Platform.Core.Tests
```

### Aspire Commands

```bash
# Start all services
dotnet run --project AppHost

# View dashboard
# Open browser to https://localhost:17000

# Stop all services
Ctrl+C
```

### Common Gotchas

- **Context propagation:** Always restore tenant context in background jobs
- **Global query filters:** Don't bypass with `IgnoreQueryFilters` unless necessary
- **Async all the way:** Use async/await consistently (no blocking .Result)
- **Dispose resources:** Use `using` for DbContext, HttpClient, etc.
- **PII in logs:** Always mask sensitive data
- **Cache keys:** Always prefix with tenant
- **Idempotency:** Consumers must handle duplicate messages

---

**END OF CONTINUATION**

*Remember: This is a guide, not gospel. Adapt as you learn. Ship code, gather feedback, iterate.*
