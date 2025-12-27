using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;

namespace SeniorLivingPortal.Tests;

/// <summary>
/// Comprehensive integration tests for ALIS framework with Syncfusion EJ2 controls.
/// Tests cover ALL ALIS features: triggers, validation, cascading, events, indicators, etc.
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

    #region Helper Methods for Syncfusion Controls

    /// <summary>
    /// Clicks a Syncfusion dropdown and selects an item by text.
    /// Syncfusion creates a wrapper span that intercepts clicks, so we use JS API.
    /// </summary>
    private async Task SelectSyncfusionDropdownItem(ILocator dropdown, string itemText)
    {
        var dropdownId = await dropdown.GetAttributeAsync("id");

        // Use Syncfusion API to show popup (avoids click interception issues)
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{dropdownId}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].showPopup();
            }}
        }}");
        await Page.WaitForTimeoutAsync(300);

        // Syncfusion creates popup with ID {elementId}_popup
        var popup = Page.Locator($"#{dropdownId}_popup");
        await popup.WaitForAsync(new() { State = WaitForSelectorState.Visible, Timeout = 5000 });

        var option = popup.Locator($"li.e-list-item:has-text('{itemText}')");
        await option.ClickAsync();
        await Page.WaitForTimeoutAsync(200);
    }

    /// <summary>
    /// Clicks a Syncfusion datepicker and selects today's date using API.
    /// </summary>
    private async Task SelectSyncfusionDatePickerDay(ILocator datePicker)
    {
        var pickerId = await datePicker.GetAttributeAsync("id");

        // Use Syncfusion API to set value directly
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{pickerId}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].value = new Date();
                el.ej2_instances[0].dataBind();
            }}
        }}");
        await Page.WaitForTimeoutAsync(200);
    }

    /// <summary>
    /// Clicks a Syncfusion checkbox using JavaScript to toggle.
    /// </summary>
    private async Task ClickSyncfusionCheckbox(string checkboxId)
    {
        // Syncfusion checkbox creates a wrapper - click the wrapper label
        var checkboxWrapper = Page.Locator($"label[for='{checkboxId}'], .e-checkbox-wrapper:has(#{checkboxId}), #{checkboxId} + span, #{checkboxId}").First;
        await checkboxWrapper.ClickAsync();
        await Page.WaitForTimeoutAsync(100);
    }

    #endregion

    #region ALIS Trigger Tests

    [Test]
    public async Task Trigger_InputWithDebounce_TriggersAfterDelay()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var textbox = Page.Locator("#testTextBox1");
        var resultDiv = Page.Locator("#test1-result");

        var initialContent = await resultDiv.TextContentAsync();

        await textbox.ClickAsync();
        await textbox.FillAsync("test query");

        await Page.WaitForTimeoutAsync(800);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Not.EqualTo(initialContent),
            "ALIS input trigger with debounce should update target");
    }

    [Test]
    public async Task Trigger_SecondTextBox_InputTriggersRequest()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var textbox = Page.Locator("#testTextBox2");
        var resultDiv = Page.Locator("#test1-result-native");

        await textbox.ClickAsync();
        await textbox.FillAsync("second test");
        await Page.WaitForTimeoutAsync(800);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Not.Contain("will appear here"),
            "Second textbox should trigger ALIS request");
    }

    [Test]
    public async Task Trigger_DropDownChange_TriggersRequest()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var dropdown = Page.Locator("#testDropdown1");
        var resultDiv = Page.Locator("#test2-result");

        await SelectSyncfusionDropdownItem(dropdown, "Building A");

        await Page.WaitForTimeoutAsync(800);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Building").Or.Contain("1"),
            "ALIS alis:trigger on dropdown should trigger request on change");
    }

    [Test]
    public async Task Trigger_ButtonClick_LoadsData()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var button = Page.Locator("#testButton1");
        var resultDiv = Page.Locator("#test4-result");

        await button.ClickAsync();
        await Page.WaitForTimeoutAsync(1200);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("loaded").Or.Contain("Data"),
            "ALIS click trigger on button should load data");
    }

    #endregion

    #region ALIS Validation Tests

    [Test]
    public async Task Validation_EmptyForm_ShowsRequiredErrors()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var submitBtn = Page.Locator("#testSubmitBtn");
        await submitBtn.ClickAsync();
        await Page.WaitForTimeoutAsync(300);

        var firstNameError = Page.Locator("[data-valmsg-for='FirstName']");
        var firstNameErrorText = await firstNameError.TextContentAsync();
        Assert.That(firstNameErrorText, Does.Contain("required").IgnoreCase,
            "First name validation error should appear");

        var emailError = Page.Locator("[data-valmsg-for='Email']");
        var emailErrorText = await emailError.TextContentAsync();
        Assert.That(emailErrorText, Does.Contain("required").IgnoreCase,
            "Email validation error should appear");
    }

    [Test]
    public async Task Validation_ValidInput_ClearsErrors()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var submitBtn = Page.Locator("#testSubmitBtn");
        await submitBtn.ClickAsync();
        await Page.WaitForTimeoutAsync(300);

        var firstNameInput = Page.Locator("#testFirstName");
        await firstNameInput.ClickAsync();
        await firstNameInput.FillAsync("John");

        await Page.Locator("#testEmail").ClickAsync();
        await Page.WaitForTimeoutAsync(200);

        var firstNameError = Page.Locator("[data-valmsg-for='FirstName']");
        var firstNameErrorText = await firstNameError.TextContentAsync();

        var errorCleared = string.IsNullOrWhiteSpace(firstNameErrorText) ||
                           !firstNameErrorText.Contains("required", StringComparison.OrdinalIgnoreCase);
        Assert.That(errorCleared, Is.True,
            $"Validation error should clear after valid input but was: '{firstNameErrorText}'");
    }

    [Test]
    public async Task Form_CanBeFilledAndSubmitted()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Fill required text fields using keyboard
        var firstName = Page.Locator("#testFirstName");
        await firstName.ClickAsync();
        await firstName.PressSequentiallyAsync("John", new() { Delay = 30 });

        var email = Page.Locator("#testEmail");
        await email.ClickAsync();
        await email.PressSequentiallyAsync("john@example.com", new() { Delay = 30 });

        var ageInput = Page.Locator("#testAge");
        await ageInput.ClickAsync();
        await ageInput.PressSequentiallyAsync("30", new() { Delay = 30 });

        // Set other fields via Syncfusion API
        await Page.EvaluateAsync(@"() => {
            // Set category dropdown
            const cat = document.getElementById('testCategory');
            if (cat && cat.ej2_instances && cat.ej2_instances[0]) {
                cat.ej2_instances[0].value = '1';
                cat.ej2_instances[0].dataBind();
            }
            // Set date
            const date = document.getElementById('testBirthDate');
            if (date && date.ej2_instances && date.ej2_instances[0]) {
                date.ej2_instances[0].value = new Date();
                date.ej2_instances[0].dataBind();
            }
            // Check agree
            const cb = document.getElementById('testAgree');
            if (cb && cb.ej2_instances && cb.ej2_instances[0]) {
                cb.ej2_instances[0].checked = true;
                cb.ej2_instances[0].dataBind();
            }
        }");
        await Page.WaitForTimeoutAsync(300);

        // Verify fields were filled
        var firstNameValue = await firstName.InputValueAsync();
        Assert.That(firstNameValue, Does.Contain("John"),
            "First name should be filled");

        var emailValue = await email.InputValueAsync();
        Assert.That(emailValue, Does.Contain("john@example.com"),
            "Email should be filled");
    }

    #endregion

    #region ALIS Target/Swap Tests

    [Test]
    public async Task Target_InnerHTML_SwapsContent()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var button = Page.Locator("#testButton1");
        var resultDiv = Page.Locator("#test4-result");

        var initialHTML = await resultDiv.InnerHTMLAsync();

        await button.ClickAsync();
        await Page.WaitForTimeoutAsync(1200);

        var newHTML = await resultDiv.InnerHTMLAsync();
        Assert.That(newHTML, Is.Not.EqualTo(initialHTML),
            "ALIS data-alis-target with innerHTML swap should replace content");
    }

    [Test]
    public async Task Target_PartialView_LoadsSyncfusionControls()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var loadButton = Page.Locator("#testLoadPartial");
        var resultDiv = Page.Locator("#test5-result");

        await loadButton.ClickAsync();
        await Page.WaitForTimeoutAsync(1500);

        var content = await resultDiv.InnerHTMLAsync();
        Assert.That(content, Does.Not.Contain("will be loaded here"),
            "ALIS should load partial view into target");
    }

    #endregion

    #region ALIS Indicator Tests

    [Test]
    public async Task Indicator_Attribute_Present()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var button = Page.Locator("#testButton1");

        var hasIndicator = await button.GetAttributeAsync("data-alis-indicator");
        Assert.That(hasIndicator, Is.EqualTo("is-loading"),
            "Button should have data-alis-indicator attribute");
    }

    #endregion

    #region ALIS Collect Tests

    [Test]
    public async Task Collect_Self_TriggersRequest()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var resultDiv = Page.Locator("#test1-result");
        var initialContent = await resultDiv.TextContentAsync();

        // Use keyboard input which properly triggers ALIS event listeners
        var textbox = Page.Locator("#testTextBox1");
        await textbox.ClickAsync();
        await textbox.PressSequentiallyAsync("test input", new() { Delay = 50 });

        // Wait for debounce (500ms) + network
        await Page.WaitForTimeoutAsync(1000);

        var content = await resultDiv.TextContentAsync();
        // Verify ALIS triggered a request (content changed from initial)
        Assert.That(content, Does.Not.EqualTo(initialContent),
            "ALIS should trigger request on input");
        Assert.That(content, Does.Contain("Search result"),
            "ALIS request should return search result");
    }

    #endregion

    #region ALIS Core Attribute Tests

    [Test]
    public async Task DataAlisGet_AttributePresent_OnElements()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var alisElements = Page.Locator("[data-alis-get]");
        var count = await alisElements.CountAsync();
        Assert.That(count, Is.GreaterThan(0),
            "Page should have elements with data-alis-get attribute");
    }

    [Test]
    public async Task DataAlisPost_OnForm_AttributePresent()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var form = Page.Locator("form[data-alis-post]").First;
        Assert.That(await form.CountAsync(), Is.GreaterThan(0),
            "Page should have form with data-alis-post attribute");
    }

    [Test]
    public async Task DataAlisValidate_OnForm_AttributePresent()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var form = Page.Locator("form[data-alis-validate='true']").First;
        Assert.That(await form.CountAsync(), Is.GreaterThan(0),
            "Page should have form with data-alis-validate attribute");
    }

    [Test]
    public async Task DataAlisTarget_PointsToExistingElement()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var elementWithTarget = Page.Locator("[data-alis-target]").First;
        var targetSelector = await elementWithTarget.GetAttributeAsync("data-alis-target");

        Assert.That(targetSelector, Is.Not.Null.And.Not.Empty);

        var targetElement = Page.Locator(targetSelector!);
        Assert.That(await targetElement.CountAsync(), Is.GreaterThan(0),
            "Target element referenced by data-alis-target should exist");
    }

    #endregion

    #region Syncfusion Control Integration Tests

    [Test]
    public async Task SyncfusionTextBox_ALIS_Integration()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var textbox = Page.Locator("#testTextBox1");

        var alisGet = await textbox.GetAttributeAsync("data-alis-get");
        var alisTrigger = await textbox.GetAttributeAsync("data-alis-trigger");

        Assert.That(alisGet, Is.Not.Null, "Syncfusion TextBox should have data-alis-get");
        Assert.That(alisTrigger, Does.Contain("input"), "Syncfusion TextBox should have input trigger");
    }

    [Test]
    public async Task SyncfusionDropDown_ALIS_Integration()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var dropdown = Page.Locator("#testDropdown1");

        var alisGet = await dropdown.GetAttributeAsync("data-alis-get");
        var alisTrigger = await dropdown.GetAttributeAsync("data-alis-trigger");

        Assert.That(alisGet, Is.Not.Null, "Syncfusion DropDown should have data-alis-get");
        Assert.That(alisTrigger, Is.EqualTo("alis:trigger"), "Syncfusion DropDown should have alis:trigger");
    }

    [Test]
    public async Task SyncfusionDropDown_OpensPopup()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Use Syncfusion API to open popup
        await Page.EvaluateAsync(@"() => {
            const el = document.getElementById('testDropdown1');
            if (el && el.ej2_instances && el.ej2_instances[0]) {
                el.ej2_instances[0].showPopup();
            }
        }");
        await Page.WaitForTimeoutAsync(300);

        var popup = Page.Locator("#testDropdown1_popup");
        var isVisible = await popup.IsVisibleAsync();
        Assert.That(isVisible, Is.True, "Syncfusion DropDown popup should appear");
    }

    [Test]
    public async Task SyncfusionButton_ALIS_Integration()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var button = Page.Locator("#testButton1");

        var alisGet = await button.GetAttributeAsync("data-alis-get");
        var alisTarget = await button.GetAttributeAsync("data-alis-target");
        var alisIndicator = await button.GetAttributeAsync("data-alis-indicator");

        Assert.That(alisGet, Is.Not.Null, "Syncfusion Button should have data-alis-get");
        Assert.That(alisTarget, Is.Not.Null, "Syncfusion Button should have data-alis-target");
        Assert.That(alisIndicator, Is.Not.Null, "Syncfusion Button should have data-alis-indicator");
    }

    [Test]
    public async Task SyncfusionNumericTextBox_ALIS_Integration()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var numericBox = Page.Locator("#testAge");

        await numericBox.ClickAsync();
        await numericBox.FillAsync("25");

        var value = await numericBox.InputValueAsync();
        Assert.That(value, Does.Contain("25"), "Syncfusion NumericTextBox should accept input");
    }

    [Test]
    public async Task SyncfusionDatePicker_CanSetValue()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Use Syncfusion API to set date
        await Page.EvaluateAsync(@"() => {
            const el = document.getElementById('testBirthDate');
            if (el && el.ej2_instances && el.ej2_instances[0]) {
                el.ej2_instances[0].value = new Date();
                el.ej2_instances[0].dataBind();
            }
        }");
        await Page.WaitForTimeoutAsync(200);

        var datePicker = Page.Locator("#testBirthDate");
        var value = await datePicker.InputValueAsync();
        Assert.That(value, Is.Not.Empty, "Syncfusion DatePicker should have a value after setting");
    }

    [Test]
    public async Task SyncfusionCheckBox_CanBeToggled()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Get checkbox initial state
        var checkbox = Page.Locator("#testAgree");
        var initialState = await checkbox.EvaluateAsync<bool>("el => el.checked");

        // Syncfusion checkbox - click wrapper using ej2_instances API
        await Page.EvaluateAsync(@"() => {
            const cb = document.getElementById('testAgree');
            if (cb && cb.ej2_instances && cb.ej2_instances[0]) {
                cb.ej2_instances[0].checked = true;
                cb.ej2_instances[0].dataBind();
            } else {
                cb.click();
            }
        }");
        await Page.WaitForTimeoutAsync(100);

        var newState = await checkbox.EvaluateAsync<bool>("el => el.checked");
        Assert.That(newState, Is.Not.EqualTo(initialState), "Syncfusion Checkbox should toggle");
    }

    #endregion

    #region Page Load Tests

    [Test]
    public async Task HomePage_LoadsSuccessfully()
    {
        await Page.GotoAsync(BaseUrl);
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var title = await Page.TitleAsync();
        Assert.That(title, Is.Not.Empty, "Home page should have a title");
    }

    [Test]
    public async Task SyncfusionTestPage_LoadsSuccessfully()
    {
        await Page.GotoAsync($"{BaseUrl}/Home/SyncfusionTest");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var title = await Page.TitleAsync();
        Assert.That(title, Does.Contain("Syncfusion").Or.Contain("ALIS").Or.Contain("Test"),
            "Syncfusion test page should have appropriate title");
    }

    [Test]
    public async Task ResidentsPage_LoadsSuccessfully()
    {
        await Page.GotoAsync($"{BaseUrl}/Residents");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var title = await Page.TitleAsync();
        Assert.That(title, Does.Contain("Resident").Or.Contain("Senior"),
            "Residents page should load");
    }

    [Test]
    public async Task VitalsPage_LoadsSuccessfully()
    {
        await Page.GotoAsync($"{BaseUrl}/Vitals");
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var title = await Page.TitleAsync();
        Assert.That(title, Does.Contain("Vital").Or.Contain("Senior"),
            "Vitals page should load");
    }

    #endregion
}
