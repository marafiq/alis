using FluentValidation;
using SeniorLivingPortal.Services;
using SeniorLivingPortal.Validators;
using Syncfusion.Licensing;

var builder = WebApplication.CreateBuilder(args);

// Register Syncfusion license
// Get license key from appsettings.json or environment variable
var syncfusionKey = builder.Configuration["Syncfusion:LicenseKey"] 
    ?? Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY");

if (!string.IsNullOrEmpty(syncfusionKey) && syncfusionKey != "YOUR_SYNCFUSION_LICENSE_KEY_HERE")
{
    SyncfusionLicenseProvider.RegisterLicense(syncfusionKey);
}

// Add services to the container.
builder.Services.AddControllersWithViews();

// Register FluentValidation validators
builder.Services.AddValidatorsFromAssemblyContaining<ResidentFormValidator>();

// Register application services (Singleton for in-memory demo data)
builder.Services.AddSingleton<IResidentService, ResidentService>();
builder.Services.AddSingleton<IVitalsService, VitalsService>();
builder.Services.AddSingleton<IFacilityService, FacilityService>();
builder.Services.AddSingleton<IMedicationService, MedicationService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

app.Run();
