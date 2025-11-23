using FluentAssertions;
using Microsoft.AspNetCore.Http;
using NSubstitute;
using System.Security.Claims;
using Xunit;

namespace Platform.Core.Tests;

/// <summary>
/// Tests for UC1.2: Resolve Company from JWT Claims
/// Following TDD: RED → GREEN → REFACTOR
/// </summary>
[Trait("Module", "PlatformCore")]
[Trait("Category", "Unit")]
public class CompanyContextFromClaimsTests
{
    [Fact]
    public async Task ResolveCompanyFromClaims_ValidCompanyIdClaim_ReturnsCompanyContext()
    {
        // Arrange - RED: Test JWT claim resolution
        var httpContext = new DefaultHttpContext();
        var companyId = Guid.NewGuid();

        var claims = new List<Claim>
        {
            new Claim("companyId", companyId.ToString()),
            new Claim(ClaimTypes.Name, "testuser@example.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        httpContext.User = claimsPrincipal;

        var mockRepository = Substitute.For<ICompanyRepository>();
        var expectedCompany = new Company
        {
            Id = companyId,
            Name = "Acme Corporation",
            Subdomain = "acme",
            Tier = CompanyTier.Enterprise,
            DatabaseName = "AcmeDB",
            IsActive = true
        };

        mockRepository.GetByIdAsync(companyId)
            .Returns(Task.FromResult<Company?>(expectedCompany));

        var middleware = new CompanyContextMiddleware(mockRepository);

        // Act
        RequestDelegate next = (ctx) => Task.CompletedTask;
        await middleware.InvokeAsync(httpContext, next);

        // Assert
        var companyContext = httpContext.Items["CompanyContext"] as ICompanyContext;
        companyContext.Should().NotBeNull();
        companyContext!.CompanyId.Should().Be(expectedCompany.Id);
        companyContext.CompanyName.Should().Be(expectedCompany.Name);
        companyContext.Tier.Should().Be(CompanyTier.Enterprise);
    }

    [Fact]
    public async Task ResolveCompanyFromClaims_MissingCompanyIdClaim_Returns401()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, "testuser@example.com")
            // No companyId claim
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        httpContext.User = claimsPrincipal;

        var mockRepository = Substitute.For<ICompanyRepository>();
        var middleware = new CompanyContextMiddleware(mockRepository);

        // Act
        RequestDelegate next = (ctx) => Task.CompletedTask;
        await middleware.InvokeAsync(httpContext, next);

        // Assert
        httpContext.Response.StatusCode.Should().Be(401); // Unauthorized
    }

    [Fact]
    public async Task ResolveCompanyFromClaims_InvalidGuidFormat_Returns400()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        var claims = new List<Claim>
        {
            new Claim("companyId", "not-a-valid-guid"),
            new Claim(ClaimTypes.Name, "testuser@example.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        httpContext.User = claimsPrincipal;

        var mockRepository = Substitute.For<ICompanyRepository>();
        var middleware = new CompanyContextMiddleware(mockRepository);

        // Act
        RequestDelegate next = (ctx) => Task.CompletedTask;
        await middleware.InvokeAsync(httpContext, next);

        // Assert
        httpContext.Response.StatusCode.Should().Be(400); // Bad Request
    }

    [Fact]
    public async Task ResolveCompanyFromClaims_CompanyNotFound_Returns403()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();
        var companyId = Guid.NewGuid();

        var claims = new List<Claim>
        {
            new Claim("companyId", companyId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        httpContext.User = claimsPrincipal;

        var mockRepository = Substitute.For<ICompanyRepository>();
        mockRepository.GetByIdAsync(companyId)
            .Returns(Task.FromResult<Company?>(null));

        var middleware = new CompanyContextMiddleware(mockRepository);

        // Act
        RequestDelegate next = (ctx) => Task.CompletedTask;
        await middleware.InvokeAsync(httpContext, next);

        // Assert
        httpContext.Response.StatusCode.Should().Be(403); // Forbidden
    }

    [Fact]
    public async Task ResolveCompanyFromClaims_DisabledCompany_Returns403()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();
        var companyId = Guid.NewGuid();

        var claims = new List<Claim>
        {
            new Claim("companyId", companyId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        httpContext.User = claimsPrincipal;

        var mockRepository = Substitute.For<ICompanyRepository>();
        var disabledCompany = new Company
        {
            Id = companyId,
            Name = "Disabled Corp",
            Subdomain = "disabled",
            Tier = CompanyTier.Basic,
            DatabaseName = "DisabledDB",
            IsActive = false
        };

        mockRepository.GetByIdAsync(companyId)
            .Returns(Task.FromResult<Company?>(disabledCompany));

        var middleware = new CompanyContextMiddleware(mockRepository);

        // Act
        RequestDelegate next = (ctx) => Task.CompletedTask;
        await middleware.InvokeAsync(httpContext, next);

        // Assert
        httpContext.Response.StatusCode.Should().Be(403); // Forbidden
    }

    [Fact]
    public async Task ResolveCompanyFromClaims_ClaimsTakePrecedenceOverSubdomain()
    {
        // Arrange - When both claim and subdomain exist, claim should win
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Host = new HostString("different.platform.com");
        var companyId = Guid.NewGuid();

        var claims = new List<Claim>
        {
            new Claim("companyId", companyId.ToString())
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        httpContext.User = claimsPrincipal;

        var mockRepository = Substitute.For<ICompanyRepository>();
        var expectedCompany = new Company
        {
            Id = companyId,
            Name = "Claims Company",
            Subdomain = "claims",
            Tier = CompanyTier.Professional,
            DatabaseName = "ClaimsDB",
            IsActive = true
        };

        mockRepository.GetByIdAsync(companyId)
            .Returns(Task.FromResult<Company?>(expectedCompany));

        var middleware = new CompanyContextMiddleware(mockRepository);

        // Act
        RequestDelegate next = (ctx) => Task.CompletedTask;
        await middleware.InvokeAsync(httpContext, next);

        // Assert
        var companyContext = httpContext.Items["CompanyContext"] as ICompanyContext;
        companyContext.Should().NotBeNull();
        companyContext!.CompanyName.Should().Be("Claims Company");

        // Verify subdomain lookup was NOT called
        await mockRepository.DidNotReceive().GetBySubdomainAsync(Arg.Any<string>());
    }
}
