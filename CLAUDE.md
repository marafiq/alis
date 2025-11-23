# CLAUDE.md - AI Assistant Guide for Alis

## Project Overview

**Project Name:** Alis
**Type:** .NET Application
**Status:** Initial Setup
**Last Updated:** 2025-11-23

This is a .NET project currently in its initial setup phase. This document serves as a comprehensive guide for AI assistants working with this codebase.

---

## Repository Structure

```
alis/
├── .gitignore          # .NET-specific gitignore configuration
└── CLAUDE.md           # This file - AI assistant guide
```

**Note:** As this is a new repository, the structure will evolve. Update this section as the project grows.

### Expected Future Structure

For a typical .NET project, expect the following structure to develop:

```
alis/
├── src/                # Source code
│   ├── Alis/          # Main project/library
│   ├── Alis.Core/     # Core functionality (if applicable)
│   └── ...
├── tests/              # Test projects
│   ├── Alis.Tests/
│   └── Alis.IntegrationTests/
├── docs/               # Documentation
├── .gitignore
├── README.md
├── CLAUDE.md
├── alis.sln            # Solution file
└── Directory.Build.props  # Common MSBuild properties
```

---

## Technology Stack

### Framework
- **.NET**: Version TBD (check solution files when created)
- **Language**: C#

### Common .NET Patterns to Expect
- Dependency Injection
- Async/Await patterns
- LINQ for data operations
- Repository pattern (if applicable)
- MVC/API controllers (for web projects)

---

## Development Workflow

### Setting Up the Environment

1. **Prerequisites**
   - .NET SDK (version TBD based on project configuration)
   - IDE: Visual Studio, Visual Studio Code, or Rider
   - Git

2. **Initial Setup**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd alis

   # Restore dependencies (once solution exists)
   dotnet restore

   # Build the solution
   dotnet build
   ```

3. **Running Tests**
   ```bash
   # Run all tests
   dotnet test

   # Run tests with coverage
   dotnet test /p:CollectCoverage=true
   ```

### Git Workflow

- **Branch Naming**: Use descriptive names
  - Feature: `feature/feature-name`
  - Bug fix: `fix/bug-description`
  - Claude branches: `claude/claude-md-*` (auto-generated)

- **Commit Messages**: Follow conventional commits format
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation
  - `refactor:` for code refactoring
  - `test:` for test additions/changes
  - `chore:` for maintenance tasks

- **Pull Requests**:
  - Keep PRs focused and atomic
  - Include tests for new functionality
  - Update documentation as needed

---

## Coding Conventions

### C# Style Guidelines

1. **Naming Conventions**
   - Classes, Methods, Properties: `PascalCase`
   - Local variables, parameters: `camelCase`
   - Private fields: `_camelCase` (with underscore prefix)
   - Interfaces: `IPascalCase` (with I prefix)
   - Constants: `PascalCase` or `UPPER_CASE`

2. **Code Organization**
   - One class per file (generally)
   - File name should match the class name
   - Group related functionality into namespaces
   - Use `using` statements at the top of files

3. **Best Practices**
   - Prefer `async/await` for asynchronous operations
   - Use nullable reference types (`#nullable enable`)
   - Follow SOLID principles
   - Keep methods focused and small
   - Use dependency injection over static dependencies
   - Write XML documentation comments for public APIs

4. **Example Code Structure**
   ```csharp
   namespace Alis.Core.Services;

   /// <summary>
   /// Service for managing user operations.
   /// </summary>
   public class UserService : IUserService
   {
       private readonly IUserRepository _userRepository;
       private readonly ILogger<UserService> _logger;

       public UserService(IUserRepository userRepository, ILogger<UserService> logger)
       {
           _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
           _logger = logger ?? throw new ArgumentNullException(nameof(logger));
       }

       /// <summary>
       /// Gets a user by their unique identifier.
       /// </summary>
       /// <param name="userId">The user's unique identifier.</param>
       /// <returns>The user if found; otherwise, null.</returns>
       public async Task<User?> GetUserByIdAsync(Guid userId)
       {
           try
           {
               return await _userRepository.GetByIdAsync(userId);
           }
           catch (Exception ex)
           {
               _logger.LogError(ex, "Error retrieving user {UserId}", userId);
               throw;
           }
       }
   }
   ```

### Testing Conventions

1. **Test Project Naming**: `<ProjectName>.Tests` or `<ProjectName>.IntegrationTests`
2. **Test Class Naming**: `<ClassUnderTest>Tests`
3. **Test Method Naming**: `MethodName_Scenario_ExpectedBehavior`
   - Example: `GetUserById_UserExists_ReturnsUser`
4. **Test Framework**: xUnit, NUnit, or MSTest (TBD based on project choice)
5. **Mocking**: Moq or NSubstitute (TBD)

---

## AI Assistant Guidelines

### When Making Changes

1. **Always Read Before Modifying**
   - Use `Read` tool to examine existing code before making changes
   - Understand the current patterns and conventions in use
   - Check for existing similar implementations

2. **Follow Existing Patterns**
   - Match the coding style already present in the codebase
   - Use the same dependency injection patterns
   - Follow established naming conventions
   - Respect existing architectural decisions

3. **Testing Requirements**
   - Add tests for new functionality
   - Update tests when modifying existing code
   - Ensure all tests pass before committing
   - Run `dotnet test` to verify

4. **Documentation**
   - Add XML comments to public APIs
   - Update README.md for significant features
   - Update this CLAUDE.md when project structure changes
   - Document complex algorithms or business logic

### Common Tasks

#### Adding a New Feature

1. Plan the implementation
   - Identify required classes/interfaces
   - Determine dependencies
   - Consider testability

2. Create necessary files
   - Follow project structure
   - Use appropriate namespaces
   - Register services in DI container if needed

3. Implement the feature
   - Write clean, readable code
   - Handle errors appropriately
   - Use async/await where appropriate

4. Add tests
   - Unit tests for business logic
   - Integration tests for end-to-end scenarios

5. Commit and push
   - Use conventional commit messages
   - Push to the designated branch

#### Fixing a Bug

1. Understand the issue
   - Read the bug report/issue
   - Reproduce if possible
   - Identify the root cause

2. Write a failing test
   - Create a test that reproduces the bug
   - Verify the test fails

3. Fix the bug
   - Make minimal, focused changes
   - Avoid scope creep

4. Verify the fix
   - Ensure the new test passes
   - Ensure all existing tests still pass
   - Test edge cases

5. Commit and push
   - Reference the issue in commit message

#### Refactoring Code

1. Ensure tests exist
   - Add tests if missing
   - Verify all tests pass

2. Make incremental changes
   - Small, focused refactorings
   - Run tests after each change

3. Don't change behavior
   - Refactoring should not alter functionality
   - Tests should still pass without modification

### Security Considerations

- **Never commit secrets**: API keys, connection strings, passwords
- **Use configuration**: appsettings.json, environment variables, Azure Key Vault
- **Validate input**: Always validate and sanitize user input
- **Use parameterized queries**: Prevent SQL injection
- **Encode output**: Prevent XSS attacks
- **Authentication & Authorization**: Implement proper security checks
- **HTTPS**: Use HTTPS for all external communications

### Performance Considerations

- **Async operations**: Use async/await for I/O operations
- **Database queries**: Avoid N+1 queries, use eager loading when appropriate
- **Caching**: Implement caching for frequently accessed data
- **Connection pooling**: Let .NET handle connection pooling
- **Dispose patterns**: Properly dispose of resources (IDisposable)

---

## Dependencies

### Expected Common Dependencies

When the project is initialized, common NuGet packages might include:

- **Logging**: Microsoft.Extensions.Logging, Serilog
- **Testing**: xUnit/NUnit/MSTest, Moq/NSubstitute
- **JSON**: System.Text.Json or Newtonsoft.Json
- **HTTP**: Microsoft.Extensions.Http
- **Configuration**: Microsoft.Extensions.Configuration
- **DI**: Microsoft.Extensions.DependencyInjection

**Note:** Update this section as dependencies are added to the project.

---

## Build and Deployment

### Build Configuration

```bash
# Debug build
dotnet build

# Release build
dotnet build -c Release

# Clean build
dotnet clean && dotnet build
```

### Running the Application

```bash
# Run the main project (update path when project is created)
dotnet run --project src/Alis/Alis.csproj

# Run with specific configuration
dotnet run --project src/Alis/Alis.csproj -c Release
```

### Publishing

```bash
# Publish for production
dotnet publish -c Release -o ./publish

# Self-contained deployment
dotnet publish -c Release -r win-x64 --self-contained
```

---

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Run `dotnet clean`
   - Delete `bin/` and `obj/` folders
   - Run `dotnet restore`
   - Check for package conflicts

2. **Test Failures**
   - Ensure database/external dependencies are available
   - Check configuration settings
   - Verify test data setup

3. **Dependency Issues**
   - Clear NuGet cache: `dotnet nuget locals all --clear`
   - Check package version compatibility
   - Update packages: `dotnet restore --force`

---

## Project-Specific Notes

### To Be Added

As the project develops, add:
- Specific architectural decisions
- Domain-specific terminology
- Integration points with external systems
- Deployment environments and procedures
- Team conventions and preferences

---

## Resources

### .NET Documentation
- [.NET Documentation](https://docs.microsoft.com/dotnet/)
- [C# Programming Guide](https://docs.microsoft.com/dotnet/csharp/)
- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core/)

### Best Practices
- [.NET Design Guidelines](https://docs.microsoft.com/dotnet/standard/design-guidelines/)
- [Dependency Injection in .NET](https://docs.microsoft.com/dotnet/core/extensions/dependency-injection)
- [Unit Testing Best Practices](https://docs.microsoft.com/dotnet/core/testing/unit-testing-best-practices)

---

## Changelog

### 2025-11-23
- Initial CLAUDE.md created
- Repository initialized with .NET .gitignore
- Awaiting project structure initialization

---

## Contact & Contributing

**Note:** Update this section with:
- Project maintainer information
- Contribution guidelines
- Communication channels
- Issue tracking process

---

**For AI Assistants:** This document should be updated regularly as the project evolves. When making significant architectural changes or adding new patterns, update the relevant sections to maintain accuracy.
