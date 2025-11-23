using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Platform.Core.Abstractions;
using Platform.Core.Extensions;
using Platform.Core.Middleware;
using Platform.Core.Models;
using Platform.Core.Repositories;
using Platform.Core.Tests.TestHelpers;

namespace Platform.Core.Tests;

[Trait("Module", "PlatformCore")]
[Trait("Category", "Unit")]
public class UC1_CompanyFromSubdomainTests
{
    [Fact]
    public async Task ResolveCompanyFromSubdomain_ValidSubdomain_ShouldSetCompanyContext()
    {
        // Arrange
        var repository = new TestCompanyRepository();
        var middleware = new CompanyContextMiddleware(
            repository,
            new LoggerFactory().CreateLogger<CompanyContextMiddleware>());

        var context = new DefaultHttpContext();
        context.Request.Host = new HostString("acme.platform.com");

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
    public async Task ResolveCompanyFromSubdomain_InvalidSubdomain_ShouldReturn404()
    {
        // Arrange
        var repository = new TestCompanyRepository();
        var middleware = new CompanyContextMiddleware(
            repository,
            new LoggerFactory().CreateLogger<CompanyContextMiddleware>());

        var context = new DefaultHttpContext();
        context.Request.Host = new HostString("nonexistent.platform.com");
        context.Response.Body = new MemoryStream();

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

    [Fact]
    public async Task ResolveCompanyFromSubdomain_InactiveCompany_ShouldReturn403()
    {
        // Arrange
        var repository = new TestCompanyRepository();
        var middleware = new CompanyContextMiddleware(
            repository,
            new LoggerFactory().CreateLogger<CompanyContextMiddleware>());

        var context = new DefaultHttpContext();
        context.Request.Host = new HostString("inactive.platform.com");
        context.Response.Body = new MemoryStream();

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
        context.Response.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task CompanyContext_ShouldProvideCorrectInformation()
    {
        // Arrange
        var company = new Company
        {
            Id = Guid.NewGuid(),
            Name = "Test Company",
            Subdomain = "test",
            Tier = SubscriptionTier.Professional,
            DatabaseMapping = "TestDb",
            IsActive = true
        };

        Implementation.CompanyContext.SetContext(company);
        var context = new Implementation.CompanyContext();

        // Act & Assert
        context.CompanyId.Should().Be(company.Id);
        context.CompanyName.Should().Be("Test Company");
        context.Subdomain.Should().Be("test");
        context.Tier.Should().Be(SubscriptionTier.Professional);
        context.DatabaseMapping.Should().Be("TestDb");
        context.IsAvailable.Should().BeTrue();

        // Cleanup
        Implementation.CompanyContext.Clear();
    }

    [Fact]
    public void CompanyContext_WhenNotAvailable_ShouldThrowException()
    {
        // Arrange
        Implementation.CompanyContext.Clear();
        var context = new Implementation.CompanyContext();

        // Act & Assert
        var act = () => _ = context.CompanyId;
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Company context is not available*");
    }
}

[Trait("Module", "PlatformCore")]
[Trait("Category", "Integration")]
public class UC1_CompanyFromSubdomainIntegrationTests
{
    [Fact]
    public async Task ResolveCompanyFromSubdomain_RealMiddlewarePipeline_ShouldWork()
    {
        // Arrange
        var hostBuilder = new HostBuilder()
            .ConfigureWebHost(webHost =>
            {
                webHost.UseTestServer();
                webHost.ConfigureServices(services =>
                {
                    services.AddSingleton<ICompanyRepository, TestCompanyRepository>();
                    services.AddSingleton<IFacilityRepository, TestFacilityRepository>();
                    services.AddPlatformCore();
                });
                webHost.Configure(app =>
                {
                    app.UsePlatformCore();
                    app.Run(async context =>
                    {
                        var companyContext = context.RequestServices.GetRequiredService<ICompanyContext>();
                        await context.Response.WriteAsync($"Company: {companyContext.CompanyName}");
                    });
                });
            });

        using var host = await hostBuilder.StartAsync();
        var client = host.GetTestClient();

        // Act
        var response = await client.GetAsync("http://acme.platform.com/test");

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("Acme Corporation");
    }
}
