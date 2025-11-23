using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Platform.Core.Middleware;
using Platform.Core.Models;
using Platform.Core.Tests.TestHelpers;
using System.Security.Claims;

namespace Platform.Core.Tests;

[Trait("Module", "PlatformCore")]
[Trait("Category", "Unit")]
public class UC2_CompanyFromJWTTests
{
    [Fact]
    public async Task ResolveCompanyFromJWT_ValidClaim_ShouldSetCompanyContext()
    {
        // Arrange
        var repository = new TestCompanyRepository();
        var middleware = new CompanyContextMiddleware(
            repository,
            new LoggerFactory().CreateLogger<CompanyContextMiddleware>());

        var context = new DefaultHttpContext();
        context.Request.Host = new HostString("api.platform.com");

        // Set up authenticated user with company ID claim
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "user@example.com"),
            new Claim("companyId", "11111111-1111-1111-1111-111111111111")
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        // Act
        await middleware.InvokeAsync(context, next);

        // Assert
        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task ResolveCompanyFromJWT_InvalidCompanyId_ShouldFallbackToSubdomain()
    {
        // Arrange
        var repository = new TestCompanyRepository();
        var middleware = new CompanyContextMiddleware(
            repository,
            new LoggerFactory().CreateLogger<CompanyContextMiddleware>());

        var context = new DefaultHttpContext();
        context.Request.Host = new HostString("acme.platform.com");

        // Set up authenticated user with invalid company ID
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "user@example.com"),
            new Claim("companyId", "not-a-guid")
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        // Act
        await middleware.InvokeAsync(context, next);

        // Assert - Should fallback to subdomain resolution
        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task ResolveCompanyFromJWT_NonExistentCompany_ShouldFallbackAndReturn404()
    {
        // Arrange
        var repository = new TestCompanyRepository();
        var middleware = new CompanyContextMiddleware(
            repository,
            new LoggerFactory().CreateLogger<CompanyContextMiddleware>());

        var context = new DefaultHttpContext();
        context.Request.Host = new HostString("api.platform.com"); // No subdomain fallback
        context.Response.Body = new MemoryStream();

        // Set up authenticated user with non-existent company ID
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "user@example.com"),
            new Claim("companyId", "00000000-0000-0000-0000-000000000000")
        };
        context.User = new ClaimsPrincipal(new ClaimsIdentity(claims, "Bearer"));

        var nextCalled = false;
        RequestDelegate next = (ctx) =>
        {
            nextCalled = true;
            return Task.CompletedTask;
        };

        // Act
        await middleware.InvokeAsync(context, next);

        // Assert
        nextCalled.Should().BeFalse();
        context.Response.StatusCode.Should().Be(404);
    }
}
