using FluentAssertions;
using Microsoft.AspNetCore.Http;
using NSubstitute;
using Xunit;

namespace Platform.Core.Tests;

/// <summary>
/// Tests for UC1.1: Resolve Company from Subdomain
/// Following TDD: RED → GREEN → REFACTOR
/// </summary>
[Trait("Module", "PlatformCore")]
[Trait("Category", "Unit")]
public class CompanyContextTests
{
    [Fact]
    public async Task ResolveCompanyFromSubdomain_ValidSubdomain_ReturnsCompanyContext()
    {
        // Arrange - RED: This test will fail because ICompanyContext doesn't exist yet
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Host = new HostString("acme.platform.com");

        var mockRepository = Substitute.For<ICompanyRepository>();
        var expectedCompany = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Acme Corporation",
            Subdomain = "acme",
            Tier = CompanyTier.Enterprise,
            DatabaseName = "AcmeDB"
        };

        mockRepository.GetBySubdomainAsync("acme")
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
        companyContext.Tier.Should().Be(expectedCompany.Tier);
        companyContext.DatabaseMapping.Should().Be(expectedCompany.DatabaseName);
    }

    [Fact]
    public async Task ResolveCompanyFromSubdomain_InvalidSubdomain_Returns404()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Host = new HostString("invalid.platform.com");
        httpContext.Response.Body = new MemoryStream();

        var mockRepository = Substitute.For<ICompanyRepository>();
        mockRepository.GetBySubdomainAsync("invalid")
            .Returns(Task.FromResult<Company?>(null));

        var middleware = new CompanyContextMiddleware(mockRepository);

        // Act
        RequestDelegate next = (ctx) => Task.CompletedTask;
        await middleware.InvokeAsync(httpContext, next);

        // Assert
        httpContext.Response.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task ResolveCompanyFromSubdomain_MissingSubdomain_Returns400()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Host = new HostString("platform.com");
        httpContext.Response.Body = new MemoryStream();

        var mockRepository = Substitute.For<ICompanyRepository>();
        var middleware = new CompanyContextMiddleware(mockRepository);

        // Act
        RequestDelegate next = (ctx) => Task.CompletedTask;
        await middleware.InvokeAsync(httpContext, next);

        // Assert
        httpContext.Response.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task ResolveCompanyFromSubdomain_DisabledCompany_Returns403()
    {
        // Arrange
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Host = new HostString("disabled.platform.com");
        httpContext.Response.Body = new MemoryStream();

        var mockRepository = Substitute.For<ICompanyRepository>();
        var disabledCompany = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Disabled Corp",
            Subdomain = "disabled",
            Tier = CompanyTier.Basic,
            DatabaseName = "DisabledDB",
            IsActive = false
        };

        mockRepository.GetBySubdomainAsync("disabled")
            .Returns(Task.FromResult<Company?>(disabledCompany));

        var middleware = new CompanyContextMiddleware(mockRepository);

        // Act
        RequestDelegate next = (ctx) => Task.CompletedTask;
        await middleware.InvokeAsync(httpContext, next);

        // Assert
        httpContext.Response.StatusCode.Should().Be(403);
    }
}
