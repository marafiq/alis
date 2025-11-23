using Platform.Core.Models;
using Platform.Core.Repositories;

namespace Platform.Core.Tests.TestHelpers;

/// <summary>
/// In-memory implementation of ICompanyRepository for testing.
/// </summary>
public class TestCompanyRepository : ICompanyRepository
{
    private readonly List<Company> _companies = new();

    public TestCompanyRepository()
    {
        // Seed with test data
        _companies.Add(new Company
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "Acme Corporation",
            Subdomain = "acme",
            Tier = SubscriptionTier.Enterprise,
            DatabaseMapping = "AcmeDb",
            IsActive = true
        });

        _companies.Add(new Company
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = "Demo Company",
            Subdomain = "demo",
            Tier = SubscriptionTier.Basic,
            DatabaseMapping = "DemoDb",
            IsActive = true
        });

        _companies.Add(new Company
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Name = "Inactive Company",
            Subdomain = "inactive",
            Tier = SubscriptionTier.Free,
            DatabaseMapping = "InactiveDb",
            IsActive = false
        });
    }

    public Task<Company?> GetBySubdomainAsync(string subdomain)
    {
        var company = _companies.FirstOrDefault(c => c.Subdomain.Equals(subdomain, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(company);
    }

    public Task<Company?> GetByIdAsync(Guid companyId)
    {
        var company = _companies.FirstOrDefault(c => c.Id == companyId);
        return Task.FromResult(company);
    }

    public void AddCompany(Company company)
    {
        _companies.Add(company);
    }
}
