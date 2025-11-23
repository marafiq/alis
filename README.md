# Senior Living Platform - Architecture Documentation
## Complete Guide for AI-Driven Implementation

**Version:** 2.0  
**Date:** November 22, 2025  
**Author:** Senior Principal Software Architect

---

## Document Package Overview

This package contains comprehensive architecture documentation structured for AI-driven, test-driven development of a .NET 10 modular monolith platform. All documents are optimized for AI context windows and emphasize "don't assume success - rely on passed tests."

### What's Included

**Core Architecture Documents:**
1. `SENIOR-LIVING-PLATFORM-ARCHITECTURE.md` - Executive overview, goals, principles, phasing
2. `AI-IMPLEMENTATION-GUIDE.md` - Detailed workflow, rules, and patterns for AI agents
3. `MODULE-01-PLATFORM-CORE.md` - Complete spec for Context Abstractions module (example)

**Detailed Module Specifications (Original Documents):**
4. `AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md` - Modules 1-6 (Foundation)
5. `AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md` - Modules 7-14 (Infrastructure + Business)
6. `AI-IMPLEMENTATION-MASTER-GUIDE.md` - Quick reference and navigation guide

---

## How to Use This Documentation

### For AI Agents Implementing Modules

**Step 1: Start Here**
Read this README to understand the structure.

**Step 2: Understand the Platform**
Read `SENIOR-LIVING-PLATFORM-ARCHITECTURE.md` to understand:
- What problem we're solving (multi-tenant senior living platform)
- Current state (what exists today)
- Target state (what we're building)
- Architectural principles

**Step 3: Learn the Implementation Rules**
Read `AI-IMPLEMENTATION-GUIDE.md` to understand:
- **CRITICAL:** "Don't assume success - rely on passed tests" rule
- TDD workflow (RED → GREEN → REFACTOR)
- .NET 10 and EF Core 10 required skills
- Testing requirements (unit, integration, E2E)
- Performance benchmarks
- Common pitfalls and solutions

**Step 4: Implement Your Assigned Module**
For each module:
1. Locate module spec in detailed documents:
   - Modules 1-6: `AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md`
   - Modules 7-14: `AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md`
   
2. Read complete module specification:
   - AI Agent Context (role, expertise, skills)
   - Must-Have Features
   - Constraints
   - TDD Use Cases (all of them)
   
3. Follow TDD workflow:
   - Write failing tests (RED)
   - Implement minimum code (GREEN)
   - Refactor (REFACTOR)
   - Integration tests (verify with real dependencies)
   - Documentation (README, XML comments)

4. Verify completion:
   - [ ] All use case tests passing (100%)
   - [ ] Integration tests passing
   - [ ] Performance benchmarks met
   - [ ] Tenant isolation verified
   - [ ] Code coverage > 80%
   - [ ] Documentation complete

**Step 5: Mark Complete and Proceed**
Only mark module complete when ALL tests pass. Do not assume success.

### For Human Architects Reviewing Work

**Review Checklist:**
1. All tests passing (run `dotnet test` and verify 100% pass rate)
2. Code coverage meets minimum 80% threshold
3. Tenant isolation verified (cross-tenant tests pass)
4. Performance benchmarks met (check test output)
5. Documentation updated (README, XML comments, runbook)
6. No security vulnerabilities (run security scan)
7. Follows architecture patterns (repository, UoW, etc.)
8. Proper abstractions (no leaking EF Core, no God objects)

### For Project Managers Tracking Progress

**Module Status Tracking:**

| Module | Name | Duration | Dependencies | Status | Tests Passing |
|--------|------|----------|--------------|--------|---------------|
| 1 | Platform.Core | 2 weeks | None | Not Started | 0/8 |
| 2 | Platform.Data | 2 weeks | Module 1 | Not Started | 0/10 |
| 3 | Platform.Auth | 1 week | Modules 1,2 | Not Started | 0/10 |
| 4 | Platform.FeatureFlags | 1 week | Modules 1,2,7 | Not Started | 0/10 |
| 5 | Platform.Storage | 0.5 week | Module 1 | Not Started | 0/10 |
| 6 | Platform.FrequentAssets | 0.5 week | Modules 1,5,9 | Not Started | 0/10 |
| 7 | Platform.Caching | 1 week | Module 1 | Not Started | 0/10 |
| 8 | Platform.Messaging | 1 week | Modules 1,2 | Not Started | 0/10 |
| 9 | Platform.BackgroundJobs | 1 week | Modules 1,2 | Not Started | 0/10 |
| 10 | Platform.Integrations | 1 week | Modules 1,11 | Not Started | 0/10 |
| 11 | Platform.Observability | 1 week | Module 1 | Not Started | 0/10 |
| 12 | Platform.Admin | 4 weeks | Modules 1,2,3,4 | Not Started | 0/15 |
| 13 | Platform.Residents | 6 weeks | Modules 1,2,3,5,8,9 | Not Started | 0/25 |
| 14 | Platform.Families | 4 weeks | Modules 1,2,3,8,10,13 | Not Started | 0/15 |

**Total:** 30 weeks, 140+ use cases

---

## Document Structure

### SENIOR-LIVING-PLATFORM-ARCHITECTURE.md
**Purpose:** High-level architecture overview  
**Audience:** All stakeholders  
**Content:**
- Executive Summary (current state vs target state)
- Architectural Principles
- AI Implementation Framework
- .NET 10 Skills & Best Practices
- Testing Strategy
- Local Development Environment
- Implementation Phasing
- Success Criteria
- Glossary

### AI-IMPLEMENTATION-GUIDE.md
**Purpose:** Detailed implementation guide for AI agents  
**Audience:** AI agents, developers  
**Content:**
- **CRITICAL RULES** (don't assume success, rely on tests)
- .NET 10 & EF Core 10 Skills
- Architecture Patterns (multi-tenancy, repository, UoW, etc.)
- Module Implementation Sequence
- Context Window Optimization Strategy
- Testing Requirements (unit, integration, E2E)
- Performance Benchmarks
- Documentation Requirements
- AI Agent Workflow
- Tracking Progress
- Common Pitfalls & Solutions

### MODULE-01-PLATFORM-CORE.md
**Purpose:** Complete specification for Module 1 (example)  
**Audience:** AI agent implementing Module 1  
**Content:**
- AI Agent Context & Skills
- Module Purpose
- Must-Have Features (F1-F8)
- Constraints (C1-C5)
- TDD Use Cases (UC1.1-UC1.8) with detailed acceptance criteria
- Integration Tests Summary
- Documentation Deliverables
- Implementation Checklist

**Note:** Other modules follow same structure but are in the detailed spec documents.

### AI-DRIVEN-ARCHITECTURE-SPECIFICATION.md
**Purpose:** Modules 1-6 complete specifications  
**Audience:** AI agents implementing foundation modules  
**Content:**
- Executive Summary (current state, target state, migration strategy)
- AI Implementation Guidelines
- **Module 1:** Platform.Core - Context Abstractions
- **Module 2:** Platform.Data - Data Access Layer
- **Module 3:** Platform.Auth - Authentication & Authorization
- **Module 4:** Platform.FeatureFlags - Feature Flag Management
- **Module 5:** Platform.Storage - File Storage Abstraction
- **Module 6:** Platform.FrequentAssets - Cloudinary Hot Cache
- Aspire Configuration
- Migration Phasing Overview

### AI-DRIVEN-ARCHITECTURE-SPECIFICATION-PART2.md
**Purpose:** Modules 7-14 complete specifications  
**Audience:** AI agents implementing infrastructure and business modules  
**Content:**
- **Module 7:** Platform.Caching - FusionCache + Redis
- **Module 8:** Platform.Messaging - RabbitMQ + SignalR
- **Module 9:** Platform.BackgroundJobs - Hangfire + Azure Functions
- **Module 10:** Platform.Integrations - HTTP Clients (Refit + Polly)
- **Module 11:** Platform.Observability - OpenTelemetry
- **Module 12:** Platform.Admin - Admin Module
- **Module 13:** Platform.Residents - Residents Module
- **Module 14:** Platform.Families - Family Portal Module
- Final Implementation Checklist
- Extended Glossary
- AI Agent Quick Reference

### AI-IMPLEMENTATION-MASTER-GUIDE.md
**Purpose:** Quick navigation and reference  
**Audience:** All (quick lookup)  
**Content:**
- Document Structure Overview
- Quick Navigation by Role
- Implementation Workflow (detailed)
- Best Practices for AI Agents
- Best Practices for Human Reviewers
- Common Pitfalls
- Resources
- Support & Escalation
- Success Metrics

---

## Key Architectural Decisions

### 1. Modular Monolith (Not Microservices)
**Decision:** Build as modular monolith with clear module boundaries  
**Rationale:**
- Simpler deployment (single app)
- Easier local development
- Can split into microservices later if needed
- Shared database initially (reduces migration risk)

### 2. Test-Driven Development (Mandatory)
**Decision:** All code must have tests written FIRST  
**Rationale:**
- Tests define correct behavior
- Prevents regressions
- Forces good design (testable code is good code)
- **Critical:** "Don't assume success - rely on passed tests"

### 3. Local-First Development (Aspire + Docker)
**Decision:** Full stack runs on developer laptop with zero cloud dependencies  
**Rationale:**
- Fast feedback loops (< 30s from code to running)
- Deterministic behavior (same environment everywhere)
- No cloud costs for development
- Easy onboarding (clone repo, `dotnet run`)

### 4. Composed Contexts (Not God Objects)
**Decision:** Multiple focused context interfaces (ICompanyContext, IFacilityContext, etc.) instead of monolithic ITenantContext  
**Rationale:**
- Single Responsibility Principle
- Easy to test (mock only what you need)
- Easy to extend (add new context without breaking existing)
- Better discoverability (IntelliSense shows relevant properties)

### 5. Global Query Filters (Automatic Tenant Isolation)
**Decision:** EF Core global query filters automatically add CompanyId/FacilityId to all queries  
**Rationale:**
- Impossible to forget tenant filter (safety by default)
- No repetitive WHERE clauses in every query
- Tested once, works everywhere
- Performance (database indexes on CompanyId/FacilityId)

---

## Success Criteria

### Technical Metrics
- ✓ Code coverage > 80% (all modules)
- ✓ Zero critical security vulnerabilities
- ✓ Zero data leak incidents (verified by isolation tests)
- ✓ Performance SLAs met (P95 latency < 500ms)
- ✓ Uptime > 99.9%

### Business Metrics
- ✓ All features migrated (parity with old system)
- ✓ Zero downtime cutover
- ✓ User satisfaction score > 4.5/5
- ✓ Support ticket volume down by 30%

### Developer Experience Metrics
- ✓ New feature development 2x faster
- ✓ Bug fix time down by 50%
- ✓ Onboarding time for new devs down by 40%
- ✓ Developer satisfaction score > 4.5/5

---

## Getting Started

### For First-Time Implementation

1. **Clone Repository** (when ready)
   ```bash
   git clone https://github.com/company/senior-living-platform.git
   cd senior-living-platform
   ```

2. **Install Prerequisites**
   - .NET 10 SDK
   - Docker Desktop
   - Visual Studio 2025 / Rider 2025 / VS Code with C# Dev Kit

3. **Run Aspire AppHost**
   ```bash
   cd src/Platform.AppHost
   dotnet run
   ```
   This starts all dependencies (SQL Server, Redis, RabbitMQ, etc.) in Docker.

4. **Begin Module 1 Implementation**
   - Read `MODULE-01-PLATFORM-CORE.md`
   - Follow TDD workflow
   - Write tests, implement, verify tests pass

### For Ongoing Development

1. **Check Module Dependencies**
   - Ensure prerequisite modules are complete
   - Review prerequisite module READMEs

2. **Read Module Specification**
   - Locate in detailed spec documents
   - Read all features, constraints, use cases

3. **Implement Using TDD**
   - RED (failing tests)
   - GREEN (passing tests)
   - REFACTOR (improve design)

4. **Verify Completion**
   - Run all tests (`dotnet test`)
   - Verify 100% pass rate
   - Check code coverage (> 80%)
   - Update documentation

---

## FAQs

**Q: Can I skip tests and implement first?**  
A: **NO.** Tests must be written FIRST. This is non-negotiable. Tests define correct behavior.

**Q: What if integration tests fail but unit tests pass?**  
A: Fix the infrastructure setup. Integration tests catch real-world issues that unit tests miss. Both must pass.

**Q: Can I mock everything in integration tests?**  
A: **NO.** Integration tests MUST use real dependencies via Testcontainers (SQL Server, Redis, RabbitMQ). This catches infrastructure issues.

**Q: What if performance benchmarks are impossible to meet?**  
A: Escalate to human architect. Benchmarks are based on production requirements, but if impossible, spec may need adjustment.

**Q: Can I change the module specification?**  
A: **NO**, unless you're the human architect. AI agents implement exactly what spec defines. Breaking changes require architect approval.

**Q: What if I discover a better pattern during implementation?**  
A: Document it in code comments and suggest to architect for future modules. Don't change current module spec.

**Q: How do I know if my module is complete?**  
A: Checklist in each module spec. All items must be checked, especially "All tests passing (100%)".

**Q: What if Testcontainers is slow on my machine?**  
A: Use SQLite for fast unit tests. Use Testcontainers only for integration tests (run less frequently). Full test suite should complete in < 5 minutes.

---

## Support & Escalation

### When to Escalate to Human Architect

**Escalate if:**
- Module spec is ambiguous or contradictory
- Performance benchmark impossible to meet
- Security concern discovered
- Breaking change needed to existing API
- Integration with external system not documented
- Uncertainty about HIPAA compliance
- Tests fail after multiple fix attempts

**Don't Escalate for:**
- Syntax questions (check .NET docs)
- Test failures (debug and fix)
- Refactoring decisions (your judgment is good)
- Minor implementation details (spec gives flexibility)

### Getting Help

1. **Re-read the module specification** - Answer is usually there
2. **Check the AI Implementation Guide** - Common patterns documented
3. **Review similar modules** - Patterns repeat across modules
4. **Consult the glossary** - Unfamiliar term? Look it up
5. **Check .NET documentation** - Official Microsoft docs
6. **Ask for human review** - Complex decision? Escalate

---

## Version History

**v2.0 - November 22, 2025**
- Added comprehensive AI Implementation Guide
- Enhanced "don't assume success - rely on tests" guidance
- Added explicit .NET 10 and EF Core 10 skills
- Added context window optimization strategy
- Added detailed testing requirements
- Added performance benchmarks
- Created example module spec (Module 1)
- Consolidated all documents into single package

**v1.0 - November 22, 2025**
- Initial comprehensive specification
- All 14 modules documented
- 140+ TDD use cases defined
- 30-week implementation plan

---

## License

Internal use only. Copyright © 2025.

---

## Contact

For questions or clarifications, contact the Senior Principal Software Architect.

---

**Remember: Don't assume success. Rely on passed tests. Test-first, always.**

---

END OF README
