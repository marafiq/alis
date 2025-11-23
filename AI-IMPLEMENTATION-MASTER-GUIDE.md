# Senior Living Platform - AI Implementation Master Guide
## Complete Architecture Specification for AI-Driven TDD Development

**Version:** 1.0  
**Last Updated:** November 22, 2025  
**Purpose:** Guide AI agents through modular implementation of .NET 10 platform migration

---

## Document Structure

This architecture specification is split across two main documents plus this index:

### Part 1: Foundation & Infrastructure
**File:** `AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md`

**Contents:**
- Executive Summary (Current State vs Target State)
- AI Implementation Guidelines
- Module 1: Platform.Core - Context Abstractions
- Module 2: Platform.Data - Data Access Layer
- Module 3: Platform.Auth - Authentication & Authorization  
- Module 4: Platform.FeatureFlags - Feature Flag Management
- Module 5: Platform.Storage - File Storage Abstraction
- Module 6: Platform.FrequentAssets - Cloudinary Hot Cache
- Aspire Configuration
- Migration Phasing Overview

### Part 2: Services & Business Domains
**File:** `AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md`

**Contents:**
- Module 7: Platform.Caching - FusionCache + Redis
- Module 8: Platform.Messaging - RabbitMQ + SignalR
- Module 9: Platform.BackgroundJobs - Hangfire + Azure Functions
- Module 10: Platform.Integrations - HTTP Clients (Refit + Polly)
- Module 11: Platform.Observability - OpenTelemetry
- Module 12: Platform.Admin - Admin Module
- Module 13: Platform.Residents - Residents Module
- Module 14: Platform.Families - Family Portal Module
- Final Implementation Checklist
- Extended Glossary
- AI Agent Quick Reference

---

## Quick Navigation by Role

### For AI Agent Starting Module 1 (Contexts)
→ Read: Part 1, Module 1 section  
→ Skills Needed: None (pure code)  
→ Dependencies: None (foundation module)  
→ Expected Duration: 2 weeks  
→ Key Outputs: ICompanyContext, IFacilityContext, Context middleware

### For AI Agent Starting Module 2 (Data Access)
→ Read: Part 1, Module 2 section  
→ Skills Needed: None  
→ Dependencies: Module 1 (Contexts)  
→ Expected Duration: 2 weeks  
→ Key Outputs: TenantDbContext, AdminDbContext, Global query filters, Migration framework

### For AI Agent Starting Module 3 (Auth)
→ Read: Part 1, Module 3 section  
→ Skills Needed: None  
→ Dependencies: Modules 1, 2  
→ Expected Duration: 1 week  
→ Key Outputs: Cookie + JWT auth, RBAC, Claims pipeline

### For AI Agent Starting Module 4 (Feature Flags)
→ Read: Part 1, Module 4 section  
→ Skills Needed: `/mnt/skills/public/frontend-design/SKILL.md` (for admin UI)  
→ Dependencies: Modules 1, 2, 7 (Caching)  
→ Expected Duration: 1 week  
→ Key Outputs: DB-backed flags, FusionCache integration, Admin toggle UI

### For AI Agent Starting Module 5 (Storage)
→ Read: Part 1, Module 5 section  
→ Skills Needed: None  
→ Dependencies: Module 1  
→ Expected Duration: 0.5 week  
→ Key Outputs: IStorageProvider, Blob + Local implementations, Tenant-safe paths

### For AI Agent Starting Module 6 (FrequentAssets)
→ Read: Part 1, Module 6 section  
→ Skills Needed: None  
→ Dependencies: Modules 1, 5, 9 (Background Jobs)  
→ Expected Duration: 0.5 week  
→ Key Outputs: Cloudinary integration, Hot cache pattern, Background sync

### For AI Agent Starting Module 7 (Caching)
→ Read: Part 2, Module 7 section  
→ Skills Needed: None  
→ Dependencies: Module 1  
→ Expected Duration: 1 week  
→ Key Outputs: FusionCache setup, Redis backplane, Tenant-prefixed keys

### For AI Agent Starting Module 8 (Messaging)
→ Read: Part 2, Module 8 section  
→ Skills Needed: None  
→ Dependencies: Modules 1, 2 (for Outbox pattern)  
→ Expected Duration: 1 week  
→ Key Outputs: RabbitMQ publisher/consumer, SignalR hubs, Outbox pattern

### For AI Agent Starting Module 9 (Background Jobs)
→ Read: Part 2, Module 9 section  
→ Skills Needed: None  
→ Dependencies: Modules 1, 2  
→ Expected Duration: 1 week  
→ Key Outputs: Hangfire setup, Tenant context restoration, Azure Durable Functions

### For AI Agent Starting Module 10 (Integrations)
→ Read: Part 2, Module 10 section  
→ Skills Needed: None  
→ Dependencies: Module 1, 11 (Observability)  
→ Expected Duration: 1 week  
→ Key Outputs: Refit clients, Polly policies, OAuth2/mTLS handlers

### For AI Agent Starting Module 11 (Observability)
→ Read: Part 2, Module 11 section  
→ Skills Needed: `/mnt/skills/public/xlsx/SKILL.md` (for dashboard specs)  
→ Dependencies: Module 1  
→ Expected Duration: 1 week  
→ Key Outputs: OpenTelemetry setup, Tenant-aware tracing, Metrics, Dashboards

### For AI Agent Starting Module 12 (Admin)
→ Read: Part 2, Module 12 section  
→ Skills Needed: `/mnt/skills/public/frontend-design/SKILL.md`  
→ Dependencies: Modules 1, 2, 3, 4  
→ Expected Duration: 4 weeks  
→ Key Outputs: Company/Facility/User CRUD, Audit log viewer, Health dashboard

### For AI Agent Starting Module 13 (Residents)
→ Read: Part 2, Module 13 section  
→ Skills Needed: `/mnt/skills/public/frontend-design/SKILL.md`  
→ Dependencies: Modules 1, 2, 3, 5, 8, 9  
→ Expected Duration: 6 weeks  
→ Key Outputs: Admission workflow, Care plans, Medication tracking, Activity logs

### For AI Agent Starting Module 14 (Families)
→ Read: Part 2, Module 14 section  
→ Skills Needed: `/mnt/skills/public/frontend-design/SKILL.md`  
→ Dependencies: Modules 1, 2, 3, 8, 10, 13  
→ Expected Duration: 4 weeks  
→ Key Outputs: Family registration, Updates feed, Messaging, Photo gallery

---

## Implementation Workflow (Detailed)

### Phase 0: Foundation (Weeks 1-12) - CRITICAL PATH

**Goal:** Build production-ready framework that ALL business logic depends on

**Week 1-2: Core Contexts (Module 1)**
```
AI Agent: "Context Architect"
Tasks:
  1. Implement ICompanyContext with subdomain resolution
  2. Implement IFacilityContext with switching
  3. Implement context middleware pipeline
  4. Write 8 unit tests (UC1.1 - UC1.8)
  5. Write 3 integration tests with SQLite
  6. Document usage with examples

Success Criteria:
  ✓ All 11 use cases passing
  ✓ Context propagates via AsyncLocal
  ✓ Tenant data isolation verified
  ✓ Middleware resolves context in < 1ms
```

**Week 3-4: Data Access (Module 2)**
```
AI Agent: "Data Architect"
Tasks:
  1. Create TenantDbContext with global query filters
  2. Create AdminDbContext, FamiliesDbContext
  3. Implement Unit of Work for cross-context transactions
  4. Set up migrations (separate for each context)
  5. Implement audit field population (interceptor)
  6. Write 10 unit tests (UC2.1 - UC2.10)
  7. Write 5 integration tests with Testcontainers

Success Criteria:
  ✓ Global query filters applied automatically
  ✓ Cross-context transactions work atomically
  ✓ Audit fields populated on insert/update
  ✓ Multi-tenant data isolation verified
  ✓ Migration runner tested with multiple tenants
```

**Week 5: Authentication (Module 3)**
```
AI Agent: "Security Engineer"
Tasks:
  1. Implement cookie authentication
  2. Implement JWT authentication
  3. Integrate Azure Entra ID (SSO)
  4. Build authorization policies (RBAC + permissions)
  5. Implement API key authentication
  6. Write 10 unit tests (UC3.1 - UC3.10)
  7. Write 3 E2E tests with TestServer

Success Criteria:
  ✓ All auth flows working (cookie, JWT, SSO, API key)
  ✓ Claims cached, invalidated on change
  ✓ Facility-scoped authorization working
  ✓ No security vulnerabilities (OWASP scan)
```

**Week 6: Feature Flags (Module 4)**
```
AI Agent: "DevOps Engineer"
Tasks:
  1. Create FeatureFlags and TenantFeatureFlags tables
  2. Implement flag evaluation with FusionCache
  3. Build admin UI for toggling flags
  4. Implement A/B testing (variant assignment)
  5. Set up backplane invalidation
  6. Write 10 unit tests (UC4.1 - UC4.10)
  7. Write 3 integration tests

Success Criteria:
  ✓ Flags evaluated in < 1ms (cache hit)
  ✓ Tenant overrides working
  ✓ Percentage rollout distributes evenly
  ✓ Cache invalidation propagates within 30s
```

**Week 7: Storage + FrequentAssets (Modules 5 + 6)**
```
AI Agent: "Storage Engineer"
Tasks:
  1. Implement IStorageProvider (Blob + Local)
  2. Tenant-safe path prefixing
  3. SAS URL generation
  4. Cloudinary integration (hot cache)
  5. Background job to sync to Cloudinary
  6. Write 10 unit tests (UC5.1 - UC5.10)
  7. Write 10 unit tests (UC6.1 - UC6.10)
  8. Write integration tests with Azurite + Cloudinary

Success Criteria:
  ✓ File upload/download working
  ✓ Tenant isolation verified
  ✓ Cloudinary hot cache operational
  ✓ Fallback to Blob when Cloudinary down
```

**Week 8: Caching (Module 7)**
```
AI Agent: "Performance Engineer"
Tasks:
  1. Configure FusionCache (L1 + L2)
  2. Implement tenant-prefixed keys
  3. Set up Redis backplane
  4. Implement cache invalidation strategies
  5. Write 10 unit tests (UC7.1 - UC7.10)
  6. Write integration tests with Redis container

Success Criteria:
  ✓ L1 hit < 1ms, L2 hit < 10ms
  ✓ Backplane invalidation < 500ms
  ✓ Redis down → L1 still works
  ✓ Cache hit ratio > 80% in testing
```

**Week 9: Messaging (Module 8)**
```
AI Agent: "Messaging Architect"
Tasks:
  1. Implement RabbitMQ publisher/subscriber
  2. Create message envelope with tenant context
  3. Implement SignalR hubs (grouped by tenant)
  4. Build outbox pattern for transactional messaging
  5. Set up retry and DLQ
  6. Write 10 unit tests (UC8.1 - UC8.10)
  7. Write integration tests with RabbitMQ container

Success Criteria:
  ✓ Messages delivered with tenant context
  ✓ Outbox ensures at-least-once delivery
  ✓ SignalR notifications < 500ms
  ✓ Retry and DLQ working
```

**Week 10: Background Jobs (Module 9)**
```
AI Agent: "Background Processing Engineer"
Tasks:
  1. Configure Hangfire with SQL Server storage
  2. Implement tenant context restoration in jobs
  3. Set up queue segregation by tier
  4. Integrate Azure Durable Functions
  5. Write 10 unit tests (UC9.1 - UC9.10)
  6. Write integration tests with real Hangfire

Success Criteria:
  ✓ Jobs execute with restored tenant context
  ✓ Queue priority working (Premium > Free)
  ✓ Durable Functions for long-running exports
  ✓ Job dashboard secured and working
```

**Week 11: Integrations + Observability (Modules 10 + 11)**
```
AI Agent: "Integration Engineer" + "Observability Engineer"
Tasks:
  1. Create Refit typed clients with auth handlers
  2. Configure Polly policies (retry, circuit breaker)
  3. Set up OpenTelemetry (traces, metrics, logs)
  4. Implement tenant-aware observability
  5. Build health checks
  6. Write 10 unit tests per module (20 total)
  7. Write integration tests with WireMock + OTel

Success Criteria:
  ✓ HTTP clients resilient (retry, circuit breaker)
  ✓ All operations traced with tenant context
  ✓ Metrics exported to Azure Monitor
  ✓ Health checks operational
```

**Week 12: Framework Validation (10 POCs)**
```
AI Agent: "QA Engineer"
Tasks:
  1. Execute POC 1: Multi-Tenancy & Data Isolation
  2. Execute POC 2: Cross-Module Transactions
  3. Execute POC 3: API with Auth & Validation
  4. Execute POC 4: Caching (L1 + L2 + Redis)
  5. Execute POC 5: Read Replica Routing
  6. Execute POC 6: Feature Flags Toggle
  7. Execute POC 7: HTTP Client with OAuth2
  8. Execute POC 8: Storage + Cloudinary
  9. Execute POC 9: FluentValidation
  10. Execute POC 10: Health Checks

Success Criteria:
  ✓ ALL 10 POCs pass
  ✓ No data leaks (tenant isolation verified)
  ✓ Performance benchmarks met
  ✓ Framework ready for business logic migration
```

**Phase 0 Outcomes:**
- ✅ Modular monolith foundation complete
- ✅ All cross-cutting concerns implemented
- ✅ Full observability in place
- ✅ Local development environment (Aspire) working
- ✅ CI/CD pipeline established
- ✅ Developer documentation complete
- ✅ Team trained on new patterns

---

### Phase 1: Admin Module (Weeks 13-16)

**Week 13-14: Admin Core (Module 12)**
```
AI Agent: "Admin Domain Engineer"
Tasks:
  1. Company CRUD (create, edit, disable)
  2. Facility CRUD
  3. User management (create, roles, facility access)
  4. Claims & entitlements UI

Success Criteria:
  ✓ Admin operations working end-to-end
  ✓ Audit trail for all admin actions
  ✓ Authorization verified (CompanyAdmin vs SuperAdmin)
```

**Week 15-16: Admin Dashboards**
```
Tasks:
  1. Feature flags admin UI
  2. Audit log viewer (query, export)
  3. Health dashboard (system status)
  4. Hangfire job monitor integration

Success Criteria:
  ✓ Admins can manage system via UI
  ✓ All dashboards functional
  ✓ E2E tests passing (Playwright)
```

---

### Phase 2: Residents Module (Weeks 17-22)

**Week 17-18: Resident Core (Module 13)**
```
AI Agent: "Healthcare Domain Engineer"
Tasks:
  1. Resident admission workflow
  2. Resident profile management
  3. Document upload (HIPAA-compliant)

Success Criteria:
  ✓ Admission workflow complete
  ✓ PHI encrypted and audited
```

**Week 19-20: Care Management**
```
Tasks:
  1. Care plans (create, edit, approve)
  2. Medication tracking (schedule, administer, compliance)
  3. Activity logging (timeline)

Success Criteria:
  ✓ Care plans versioned
  ✓ Medication audit trail complete
  ✓ Activity timeline performant (< 1s)
```

**Week 21-22: Reporting & Billing**
```
Tasks:
  1. Resident search (full-text, indexed)
  2. Census reports
  3. Medication compliance reports
  4. Billing integration

Success Criteria:
  ✓ Search < 200ms
  ✓ Reports use read replica
  ✓ Billing accurate
```

---

### Phase 3: Families Module (Weeks 23-26)

**Week 23-24: Family Portal Core (Module 14)**
```
AI Agent: "Family Portal Engineer"
Tasks:
  1. Family member registration
  2. Link to resident (approval workflow)
  3. Updates feed (real-time via SignalR)
  4. Messaging (family ↔ facility)

Success Criteria:
  ✓ Self-registration working
  ✓ Real-time updates < 1s
  ✓ Messaging two-way
```

**Week 25-26: Family Features**
```
Tasks:
  1. Photo gallery
  2. Billing & payments (Stripe)
  3. Visit scheduling
  4. Notification preferences

Success Criteria:
  ✓ Payments PCI-DSS compliant
  ✓ Visit scheduling workflow complete
  ✓ Mobile-optimized (responsive)
```

---

### Phase 4: Integrations & Cleanup (Weeks 27-30)

**Week 27-28: Migrate HTTP Integrations**
```
Tasks:
  1. Medical records (HL7, FHIR)
  2. Payment processors
  3. Pharmacy systems
  4. Insurance verification

Success Criteria:
  ✓ All 50+ integrations migrated
  ✓ Resilience verified (retry, circuit breaker)
```

**Week 29-30: Decommission Old Platform**
```
Tasks:
  1. Final data migration
  2. Cut over DNS (point to new platform)
  3. Monitor for 1 week
  4. Shut down old .NET Framework app
  5. Archive old code
  6. Celebrate! 🎉

Success Criteria:
  ✓ Zero downtime cutover
  ✓ All users on new platform
  ✓ No critical bugs
  ✓ Performance meeting SLAs
```

---

## Critical Success Factors

### For AI Agents

**1. Read Before Coding**
- Always read the full module specification before starting
- Don't skip TDD use cases - they define success
- Reference AI skills when mentioned

**2. Test-First Always**
- Write failing test first (RED)
- Implement minimum to pass (GREEN)
- Refactor to improve (REFACTOR)
- No code without tests

**3. Integration Tests Matter**
- Unit tests catch logic bugs
- Integration tests catch infrastructure issues
- Use Testcontainers for real dependencies
- Don't mock everything

**4. Tenant Isolation is Sacred**
- Every query MUST respect tenant filters
- No cross-tenant data leaks (test extensively)
- Fail fast if context missing

**5. Observability from Day 1**
- Trace all operations
- Tag with tenant context
- Log structured (not strings)
- Metrics for everything

**6. Document as You Go**
- Update README with usage examples
- Document design decisions
- Explain why, not just what

### For Human Reviewers

**1. Code Review Checklist**
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] No security vulnerabilities
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Tenant isolation verified

**2. Architecture Review**
- [ ] Follows module specification
- [ ] Proper abstraction boundaries
- [ ] Dependencies correct
- [ ] No circular dependencies
- [ ] SOLID principles followed

**3. Production Readiness**
- [ ] Observability in place
- [ ] Error handling complete
- [ ] Retry logic configured
- [ ] Health checks working
- [ ] Runbook created

---

## Common Pitfalls (And How to Avoid Them)

### Pitfall 1: God Objects / Monolithic Contexts
**Problem:** Creating `ITenantContext` with 50 properties  
**Solution:** Compose small, focused contexts (ICompanyContext, IFacilityContext, etc.)  
**Reference:** Module 1 specification

### Pitfall 2: Forgetting Tenant Context in Background Jobs
**Problem:** Background jobs run without tenant context, return all companies' data  
**Solution:** Always restore context from job metadata  
**Reference:** Module 9, UC9.4

### Pitfall 3: Caching Without Tenant Prefix
**Problem:** Company A sees Company B's cached data  
**Solution:** Auto-prefix cache keys with `{companyId}:{facilityId}:`  
**Reference:** Module 7, UC7.5

### Pitfall 4: Not Using Testcontainers
**Problem:** Mocking everything, integration bugs slip through  
**Solution:** Use Testcontainers for real SQL Server, Redis, RabbitMQ  
**Reference:** All modules, Integration Test sections

### Pitfall 5: Logging PII
**Problem:** HIPAA violation, fines  
**Solution:** Mask PII in logs (SSN, credit card, etc.)  
**Reference:** Module 11, UC11.9

### Pitfall 6: Blocking Async Code
**Problem:** Using `.Result` or `.Wait()` causes deadlocks  
**Solution:** Async all the way down, never block  
**Reference:** .NET best practices

### Pitfall 7: Not Testing Multi-Tenancy Isolation
**Problem:** Data leak to production, nightmare scenario  
**Solution:** Write explicit tests that Company A can't see Company B data  
**Reference:** Module 2, UC2.11 (Multi-Tenancy Isolation test)

### Pitfall 8: Ignoring Circuit Breakers
**Problem:** Cascading failures when external API down  
**Solution:** Always use Polly circuit breaker for HTTP calls  
**Reference:** Module 10, UC10.4

### Pitfall 9: No Observability
**Problem:** Production bugs impossible to debug  
**Solution:** OpenTelemetry from day 1, trace everything  
**Reference:** Module 11

### Pitfall 10: Analysis Paralysis
**Problem:** Over-designing, never shipping  
**Solution:** Ship MVPs, iterate based on real usage  
**Reference:** Pragmatic architecture philosophy

---

## Resources for AI Agents

### .NET 10 Documentation
- https://learn.microsoft.com/en-us/dotnet/
- https://learn.microsoft.com/en-us/ef/core/
- https://learn.microsoft.com/en-us/aspnet/core/

### Libraries Used
- **Aspire:** https://learn.microsoft.com/en-us/dotnet/aspire/
- **FusionCache:** https://github.com/ZiggyCreatures/FusionCache
- **Hangfire:** https://www.hangfire.io/
- **Polly:** https://github.com/App-vNext/Polly
- **Refit:** https://github.com/reactiveui/refit
- **OpenTelemetry:** https://opentelemetry.io/docs/languages/net/
- **Testcontainers:** https://dotnet.testcontainers.org/

### Testing Frameworks
- **xUnit:** https://xunit.net/
- **FluentAssertions:** https://fluentassertions.com/
- **Playwright:** https://playwright.dev/dotnet/
- **NSubstitute:** https://nsubstitute.github.io/

### Architecture Patterns
- **Modular Monolith:** https://www.kamilgrzybek.com/blog/posts/modular-monolith-primer
- **Domain-Driven Design:** https://martinfowler.com/bliki/DomainDrivenDesign.html
- **Outbox Pattern:** https://microservices.io/patterns/data/transactional-outbox.html

---

## Support & Escalation

### When Stuck

1. **Re-read the module specification** - Answer is usually there
2. **Check the reference implementation** - POC use cases show the way
3. **Review similar modules** - Patterns repeat across modules
4. **Consult the glossary** - Unfamiliar term? Look it up
5. **Ask for human review** - Complex decision? Escalate

### Escalation Criteria

**Escalate to human architect if:**
- Module specification is ambiguous or contradictory
- Performance benchmark impossible to meet
- Security concern discovered
- Breaking change needed to existing API
- Integration with external system not documented
- Uncertainty about HIPAA compliance

**Don't escalate for:**
- Syntax questions (check .NET docs)
- Test failures (debug and fix)
- Refactoring decisions (your judgment is good)
- Minor implementation details (spec gives flexibility)

---

## Version History

**v1.0 - November 22, 2025**
- Initial comprehensive specification
- All 14 modules documented
- 140+ TDD use cases defined
- 30-week implementation plan
- AI agent workflow established

---

## Success Metrics (Overall Project)

### Technical Metrics

**Code Quality:**
- [ ] Code coverage > 80% (all modules)
- [ ] Zero critical vulnerabilities
- [ ] Zero data leak incidents
- [ ] Performance SLAs met (P95 latency < 500ms)

**Reliability:**
- [ ] Uptime > 99.9%
- [ ] Mean Time to Recovery (MTTR) < 1 hour
- [ ] Zero data loss incidents
- [ ] All critical alerts have runbooks

**Observability:**
- [ ] 100% of operations traced
- [ ] Metrics for all business KPIs
- [ ] Structured logging everywhere
- [ ] Dashboards for ops and business teams

### Business Metrics

**Migration Success:**
- [ ] All features migrated (parity with old system)
- [ ] Zero downtime cutover
- [ ] User satisfaction score > 4.5/5
- [ ] Support ticket volume down by 30%

**Performance Improvement:**
- [ ] Page load time down by 50%
- [ ] API response time down by 40%
- [ ] Database query time down by 60%
- [ ] Cost per transaction down by 25%

**Developer Experience:**
- [ ] New feature development 2x faster
- [ ] Bug fix time down by 50%
- [ ] Onboarding time for new devs down by 40%
- [ ] Developer satisfaction score > 4.5/5

---

## Final Words

**To AI Agents Implementing This:**

You're building something important. This platform cares for seniors - real people with families who love them. The code you write will help caregivers provide better care, help families stay connected, and ultimately improve lives.

Do your best work. Test thoroughly. Document clearly. Ship quality.

**To Human Architects Reviewing This:**

This spec is a guide, not gospel. It reflects our best thinking today, but we'll learn as we build. Be pragmatic. Ship code, gather feedback, iterate.

If something in this spec doesn't make sense, change it. If you discover a better pattern, update the spec. This is a living document.

**To All:**

Build with empathy. Test with rigor. Deploy with confidence.

Let's build something great. 🚀

---

**END OF MASTER GUIDE**
