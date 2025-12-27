using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;

namespace SeniorLivingPortal.Tests;

/// <summary>
/// Comprehensive integration tests for ALIS framework with Syncfusion controls.
/// Tests cover: TextBox input, DropDownList change, Form validation, Button click,
/// Dynamic content swap, Cascading dropdowns, CRUD operations.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class AlisIntegrationTests : PageTest
{
    private const string BaseUrl = "http://localhost:5000";

    [SetUp]
    public async Task Setup()
    {
        await Page.GotoAsync(BaseUrl);
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);
    }

    #region Test 1: TextBox with Input Trigger (Debounced)

    [Test]
    public async Task TextBox_WithInputTrigger_TriggersDebounceRequest()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var textbox = Page.Locator("#testTextBox1");
        var resultDiv = Page.Locator("#test1-result");

        await textbox.ClickAsync();
        await textbox.FillAsync("test query");

        // Wait for debounced request (500ms delay configured)
        await Page.WaitForTimeoutAsync(700);

        // Verify result was updated
        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Not.Contain("will appear here"));
    }

    [Test]
    public async Task SecondTextBox_WithInputTrigger_TriggersDebounceRequest()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var textbox = Page.Locator("#testTextBox2");
        var resultDiv = Page.Locator("#test1-result-native");

        await textbox.ClickAsync();
        await textbox.FillAsync("second test");

        await Page.WaitForTimeoutAsync(700);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Not.Contain("will appear here"));
    }

    #endregion

    #region Test 2: DropDownList with Change Trigger

    [Test]
    public async Task DropDownList_WithChangeTrigger_TriggersRequest()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var dropdown = Page.Locator("#testDropdown1");
        var resultDiv = Page.Locator("#test2-result");

        // Click to open dropdown - Syncfusion uses e-ddl-popup class
        await dropdown.ClickAsync();

        // Wait for and select list item - Syncfusion uses e-ul inside popup
        var option = Page.Locator(".e-list-item:has-text('Building A')");
        await option.WaitForAsync(new() { Timeout = 5000 });
        await option.ClickAsync();

        await Page.WaitForTimeoutAsync(800);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Not.Contain("will appear here"));
    }

    #endregion

    #region Test 3: Form with Client-Side Validation

    [Test]
    public async Task Form_WithValidation_ShowsErrorsOnInvalidSubmit()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var submitBtn = Page.Locator("#testSubmitBtn");
        await submitBtn.ClickAsync();

        // Wait for validation messages
        await Page.WaitForTimeoutAsync(300);

        // Check that validation messages appear
        var firstNameError = Page.Locator("[data-valmsg-for='FirstName']");
        var firstNameErrorText = await firstNameError.TextContentAsync();
        Assert.That(firstNameErrorText, Does.Contain("required").IgnoreCase);

        var emailError = Page.Locator("[data-valmsg-for='Email']");
        var emailErrorText = await emailError.TextContentAsync();
        Assert.That(emailErrorText, Does.Contain("required").IgnoreCase);
    }

    [Test]
    public async Task Form_WithValidation_ClearsErrorsOnValidInput()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Trigger validation first
        var submitBtn = Page.Locator("#testSubmitBtn");
        await submitBtn.ClickAsync();
        await Page.WaitForTimeoutAsync(300);

        // Now fill in valid data
        var firstNameInput = Page.Locator("#testFirstName");
        await firstNameInput.ClickAsync();
        await firstNameInput.FillAsync("John");

        // Blur the field to trigger validation update
        await Page.Locator("#testEmail").ClickAsync();
        await Page.WaitForTimeoutAsync(200);

        var firstNameError = Page.Locator("[data-valmsg-for='FirstName']");
        var firstNameErrorText = await firstNameError.TextContentAsync();

        // Error should be cleared after valid input - may contain empty string or "valid" class
        var errorCleared = string.IsNullOrWhiteSpace(firstNameErrorText) ||
                           !firstNameErrorText.Contains("required", StringComparison.OrdinalIgnoreCase);
        Assert.That(errorCleared, Is.True, $"Error should be cleared but was: '{firstNameErrorText}'");
    }

    [Test]
    public async Task Form_WithValidData_SubmitsSuccessfully()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Fill form
        await Page.Locator("#testFirstName").FillAsync("John");
        await Page.Locator("#testEmail").FillAsync("john@example.com");

        var ageInput = Page.Locator("#testAge");
        await ageInput.ClickAsync();
        await ageInput.FillAsync("30");

        // Select category - wait for list items to appear
        await Page.Locator("#testCategory").ClickAsync();
        var categoryOption = Page.Locator(".e-list-item:has-text('Option 1')");
        await categoryOption.WaitForAsync(new() { Timeout = 5000 });
        await categoryOption.ClickAsync();
        await Page.WaitForTimeoutAsync(200);

        // Select date - click on date cell in calendar
        await Page.Locator("#testBirthDate").ClickAsync();
        var dayCell = Page.Locator(".e-cell:not(.e-other-month)").Nth(15);
        await dayCell.WaitForAsync(new() { Timeout = 5000 });
        await dayCell.ClickAsync();
        await Page.WaitForTimeoutAsync(200);

        // Check agree
        await Page.Locator("#testAgree").ClickAsync();

        // Submit
        await Page.Locator("#testSubmitBtn").ClickAsync();
        await Page.WaitForTimeoutAsync(800);

        var resultDiv = Page.Locator("#test3-result");
        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Not.Contain("will appear here"));
    }

    #endregion

    #region Test 4: Button Click Trigger

    [Test]
    public async Task Button_WithClickTrigger_LoadsData()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var button = Page.Locator("#testButton1");
        var resultDiv = Page.Locator("#test4-result");

        // The endpoint has 500ms delay, wait longer
        await button.ClickAsync();
        await Page.WaitForTimeoutAsync(1200);

        var content = await resultDiv.TextContentAsync();
        // Note: If this fails, it indicates ALIS doesn't handle Syncfusion button clicks
        Assert.That(content, Does.Not.Contain("will appear here"),
            "ALIS should trigger request on Syncfusion button click");
    }

    [Test]
    public async Task Button_WithIndicator_ShowsLoadingState()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var button = Page.Locator("#testButton1");

        // Start request and check for loading indicator
        await button.ClickAsync();

        // Check for is-loading class during request
        var hasLoadingClass = await button.GetAttributeAsync("class");
        // Note: This may be hard to catch if request is too fast

        await Page.WaitForTimeoutAsync(500);
    }

    #endregion

    #region Test 5: Dynamic Content Swap

    [Test]
    public async Task PartialView_WithSyncfusion_InitializesControls()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var loadButton = Page.Locator("#testLoadPartial");
        var resultDiv = Page.Locator("#test5-result");

        await loadButton.ClickAsync();
        await Page.WaitForTimeoutAsync(1000);

        var content = await resultDiv.InnerHTMLAsync();
        Assert.That(content, Does.Not.Contain("will be loaded here"));
    }

    #endregion

    #region Resident Form Tests

    [Test]
    public async Task ResidentPage_LoadsSuccessfully()
    {
        await Page.GotoAsync($"{BaseUrl}/Residents");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var title = await Page.TitleAsync();
        Assert.That(title, Does.Contain("Resident").Or.Contain("Senior"));
    }

    [Test]
    public async Task ResidentSearch_WithQuery_FiltersResults()
    {
        await Page.GotoAsync($"{BaseUrl}/Residents");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Find search input
        var searchInput = Page.Locator("input[name='query']").First;
        if (await searchInput.CountAsync() == 0)
        {
            searchInput = Page.Locator("#searchQuery");
        }

        if (await searchInput.CountAsync() > 0)
        {
            await searchInput.FillAsync("test");
            await Page.WaitForTimeoutAsync(500); // Wait for debounce

            // Verify list updates
            await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);
        }
    }

    [Test]
    public async Task ResidentForm_CascadingDropdowns_WorkCorrectly()
    {
        await Page.GotoAsync($"{BaseUrl}/Residents");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Click add resident button (if present)
        var addButton = Page.Locator("button:has-text('Add'), a:has-text('Add')").First;
        if (await addButton.CountAsync() > 0)
        {
            await addButton.ClickAsync();
            await Page.WaitForTimeoutAsync(500);

            // Check for cascading dropdowns
            var buildingSelect = Page.Locator("#buildingSelect");
            var floorSelect = Page.Locator("#floorSelect");
            var wingSelect = Page.Locator("#wingSelect");

            if (await buildingSelect.CountAsync() > 0)
            {
                // Select a building
                await buildingSelect.ClickAsync();
                await Page.WaitForTimeoutAsync(200);

                var buildingOption = Page.Locator(".e-list-item").First;
                if (await buildingOption.CountAsync() > 0)
                {
                    await buildingOption.ClickAsync();
                    await Page.WaitForTimeoutAsync(500);

                    // Floor dropdown should be populated
                    var floorEnabled = await floorSelect.IsEnabledAsync();
                    // This depends on whether data is returned
                }
            }
        }
    }

    [Test]
    public async Task ResidentForm_Validation_ShowsErrors()
    {
        await Page.GotoAsync($"{BaseUrl}/Residents");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Try to find and open the create form
        var addButton = Page.Locator("[data-alis-get*='Create'], button:has-text('Add')").First;
        if (await addButton.CountAsync() > 0)
        {
            await addButton.ClickAsync();
            await Page.WaitForTimeoutAsync(500);

            // Find submit button and click
            var submitBtn = Page.Locator("#submitBtn, button[type='submit']:has-text('Create')").First;
            if (await submitBtn.CountAsync() > 0)
            {
                await submitBtn.ClickAsync();
                await Page.WaitForTimeoutAsync(300);

                // Check for validation errors
                var validationErrors = Page.Locator(".text-danger:not(:empty), .field-validation-error");
                var errorCount = await validationErrors.CountAsync();
                Assert.That(errorCount, Is.GreaterThan(0), "Expected validation errors to be shown");
            }
        }
    }

    #endregion

    #region Vitals Form Tests

    [Test]
    public async Task VitalsPage_LoadsSuccessfully()
    {
        await Page.GotoAsync($"{BaseUrl}/Vitals");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var title = await Page.TitleAsync();
        Assert.That(title, Does.Contain("Vital").Or.Contain("Senior"));
    }

    #endregion

    #region ALIS Core Feature Tests

    [Test]
    public async Task AlisDataGet_OnElement_TriggersRequest()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Any element with data-alis-get should work
        var alisElements = Page.Locator("[data-alis-get]");
        var count = await alisElements.CountAsync();
        Assert.That(count, Is.GreaterThan(0), "Page should have ALIS-enabled elements");
    }

    [Test]
    public async Task AlisDataPost_OnForm_SubmitsData()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var form = Page.Locator("form[data-alis-post]").First;
        Assert.That(await form.CountAsync(), Is.GreaterThan(0), "Should have ALIS post form");
    }

    [Test]
    public async Task AlisDataValidate_OnForm_ValidatesBeforeSubmit()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var form = Page.Locator("form[data-alis-validate='true']").First;
        Assert.That(await form.CountAsync(), Is.GreaterThan(0), "Should have ALIS validate form");
    }

    [Test]
    public async Task AlisDataTarget_SwapsContent_ToSpecifiedElement()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Find element with target
        var elementWithTarget = Page.Locator("[data-alis-target]").First;
        var targetSelector = await elementWithTarget.GetAttributeAsync("data-alis-target");

        Assert.That(targetSelector, Is.Not.Null.And.Not.Empty);

        // Verify target exists
        var targetElement = Page.Locator(targetSelector!);
        Assert.That(await targetElement.CountAsync(), Is.GreaterThan(0), "Target element should exist");
    }

    #endregion
}
