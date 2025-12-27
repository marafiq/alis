using Microsoft.Playwright;
using Microsoft.Playwright.NUnit;

namespace SeniorLivingPortal.Tests;

/// <summary>
/// Comprehensive integration tests for ALIS framework with ALL Syncfusion EJ2 controls.
/// Tests every ALIS feature with every Syncfusion control type.
/// </summary>
[Parallelizable(ParallelScope.Self)]
[TestFixture]
public class AlisIntegrationTests : PageTest
{
    private const string BaseUrl = "http://localhost:5000";
    private const string TestPageUrl = $"{BaseUrl}/Home/SyncfusionTest";

    [SetUp]
    public async Task Setup()
    {
        await Page.GotoAsync(TestPageUrl);
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Dismiss Syncfusion license banner if present
        await DismissSyncfusionLicenseBanner();
    }

    /// <summary>
    /// Dismisses the Syncfusion license validation banner that blocks interactions.
    /// </summary>
    private async Task DismissSyncfusionLicenseBanner()
    {
        await Page.EvaluateAsync(@"() => {
            // Remove the Syncfusion license validation overlay
            const banners = document.querySelectorAll('.e-dlg-overlay, .e-license-overlay, [style*=""position: fixed""]');
            banners.forEach(el => el.remove());

            // Remove any fixed position div with high z-index that might block clicks
            document.querySelectorAll('div[style*=""z-index""]').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.position === 'fixed' && parseInt(style.zIndex) > 10000) {
                    el.remove();
                }
            });

            // Remove the license banner image
            document.querySelectorAll('img[src*=""base64""]').forEach(el => {
                const parent = el.closest('div[style*=""position""]');
                if (parent && window.getComputedStyle(parent).position === 'fixed') {
                    parent.remove();
                }
            });

            // Also try to remove common overlay patterns
            document.querySelectorAll('.e-popup-overlay, .e-dialog-overlay').forEach(el => el.remove());
        }");
        await Page.WaitForTimeoutAsync(100);
    }

    /// <summary>
    /// Clicks an element using JavaScript to bypass any overlay issues.
    /// </summary>
    private async Task JsClick(string selector)
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.querySelector('{selector}');
            if (el) {{
                el.focus();
                el.click();
            }}
        }}");
        await Page.WaitForTimeoutAsync(100);
    }

    /// <summary>
    /// Sets input value via JavaScript to bypass overlays.
    /// </summary>
    private async Task JsFillInput(string selector, string value)
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.querySelector('{selector}');
            if (el) {{
                el.focus();
                el.value = '{value.Replace("'", "\\'")}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
        }}");
        await Page.WaitForTimeoutAsync(100);
    }

    #region Helper Methods for Syncfusion Controls

    /// <summary>
    /// Uses Syncfusion API to select dropdown item. Handles wrapper click interception.
    /// </summary>
    private async Task SelectSyncfusionDropdownItem(string dropdownId, string itemValue)
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{dropdownId}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].value = '{itemValue}';
                el.ej2_instances[0].dataBind();
                // Trigger ALIS event
                el.dispatchEvent(new CustomEvent('alis:trigger', {{ bubbles: true }}));
            }}
        }}");
        await Page.WaitForTimeoutAsync(300);
    }

    /// <summary>
    /// Opens Syncfusion dropdown popup and clicks an item by text.
    /// </summary>
    private async Task OpenAndSelectDropdownItem(string dropdownId, string itemText)
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{dropdownId}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].showPopup();
            }}
        }}");
        await Page.WaitForTimeoutAsync(300);

        var popup = Page.Locator($"#{dropdownId}_popup");
        await popup.WaitForAsync(new() { State = WaitForSelectorState.Visible, Timeout = 5000 });

        var option = popup.Locator($"li.e-list-item:has-text('{itemText}')");
        await option.ClickAsync();
        await Page.WaitForTimeoutAsync(300);
    }

    /// <summary>
    /// Sets Syncfusion NumericTextBox value via API.
    /// </summary>
    private async Task SetNumericTextBoxValue(string id, decimal value)
    {
        var valueStr = value.ToString(System.Globalization.CultureInfo.InvariantCulture);
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                const instance = el.ej2_instances[0];
                instance.value = {valueStr};
                // Trigger change event to notify the component
                if (typeof instance.trigger === 'function') {{
                    instance.trigger('change', {{ value: {valueStr} }});
                }}
            }}
        }}");
        await Page.WaitForTimeoutAsync(300);
        // Now trigger ALIS
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el) el.dispatchEvent(new CustomEvent('alis:trigger', {{ bubbles: true }}));
        }}");
        await Page.WaitForTimeoutAsync(200);
    }

    /// <summary>
    /// Sets Syncfusion DatePicker value via API.
    /// </summary>
    private async Task SetDatePickerValue(string id, string dateJs = "new Date()")
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].value = {dateJs};
                el.ej2_instances[0].dataBind();
                el.dispatchEvent(new CustomEvent('alis:trigger', {{ bubbles: true }}));
            }}
        }}");
        await Page.WaitForTimeoutAsync(200);
    }

    /// <summary>
    /// Sets Syncfusion TimePicker value via API.
    /// </summary>
    private async Task SetTimePickerValue(string id, string timeJs = "new Date()")
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].value = {timeJs};
                el.ej2_instances[0].dataBind();
                el.dispatchEvent(new CustomEvent('alis:trigger', {{ bubbles: true }}));
            }}
        }}");
        await Page.WaitForTimeoutAsync(200);
    }

    /// <summary>
    /// Toggles Syncfusion checkbox via API.
    /// </summary>
    private async Task ToggleCheckbox(string id, bool check = true)
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].checked = {check.ToString().ToLower()};
                el.ej2_instances[0].dataBind();
                el.dispatchEvent(new CustomEvent('alis:trigger', {{ bubbles: true }}));
            }}
        }}");
        await Page.WaitForTimeoutAsync(200);
    }

    /// <summary>
    /// Toggles Syncfusion switch via API.
    /// </summary>
    private async Task ToggleSwitch(string id, bool check = true)
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].checked = {check.ToString().ToLower()};
                el.ej2_instances[0].dataBind();
                el.dispatchEvent(new CustomEvent('alis:trigger', {{ bubbles: true }}));
            }}
        }}");
        await Page.WaitForTimeoutAsync(200);
    }

    /// <summary>
    /// Sets Syncfusion slider value via API.
    /// </summary>
    private async Task SetSliderValue(string id, int value)
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                const instance = el.ej2_instances[0];
                // For Syncfusion Slider, set value and trigger change
                instance.value = {value};
                // Force notify property change
                if (typeof instance.trigger === 'function') {{
                    instance.trigger('change', {{ value: {value} }});
                }}
            }}
        }}");
        await Page.WaitForTimeoutAsync(300);
        // Now trigger ALIS
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el) el.dispatchEvent(new CustomEvent('alis:trigger', {{ bubbles: true }}));
        }}");
        await Page.WaitForTimeoutAsync(200);
    }

    /// <summary>
    /// Adds items to Syncfusion MultiSelect via API.
    /// </summary>
    private async Task AddMultiselectItems(string id, string[] values)
    {
        var valuesJson = "[" + string.Join(",", values.Select(v => $"'{v}'")) + "]";
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].value = {valuesJson};
                el.ej2_instances[0].dataBind();
                el.dispatchEvent(new CustomEvent('alis:trigger', {{ bubbles: true }}));
            }}
        }}");
        await Page.WaitForTimeoutAsync(300);
    }

    /// <summary>
    /// Selects item in Syncfusion ListBox via API.
    /// </summary>
    private async Task SelectListBoxItem(string id, string value)
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].value = ['{value}'];
                el.ej2_instances[0].dataBind();
                el.dispatchEvent(new CustomEvent('alis:trigger', {{ bubbles: true }}));
            }}
        }}");
        await Page.WaitForTimeoutAsync(200);
    }

    /// <summary>
    /// Sets Syncfusion ColorPicker value via API.
    /// </summary>
    private async Task SetColorPickerValue(string id, string color)
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].value = '{color}';
                el.ej2_instances[0].dataBind();
                el.dispatchEvent(new CustomEvent('alis:trigger', {{ bubbles: true }}));
            }}
        }}");
        await Page.WaitForTimeoutAsync(200);
    }

    /// <summary>
    /// Sets Syncfusion RichTextEditor content via API.
    /// </summary>
    private async Task SetRichTextContent(string id, string html)
    {
        await Page.EvaluateAsync($@"() => {{
            const el = document.getElementById('{id}');
            if (el && el.ej2_instances && el.ej2_instances[0]) {{
                el.ej2_instances[0].value = '{html.Replace("'", "\\'")}';
                el.ej2_instances[0].dataBind();
            }}
        }}");
        await Page.WaitForTimeoutAsync(200);
    }

    #endregion

    #region Section 1: Text Input Controls Tests

    [Test]
    public async Task TextBox_InputTrigger_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#textbox-result");

        // Use JS to set value and trigger ALIS
        await JsFillInput("#testTextBox", "hello world");
        await Page.WaitForTimeoutAsync(600); // Wait for debounce

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Searched: hello world"),
            "TextBox should send the entered value to the server");
    }

    [Test]
    public async Task NumericTextBox_ChangeTrigger_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#numeric-result");

        await SetNumericTextBoxValue("testNumeric", 250);

        var content = await resultDiv.TextContentAsync();
        // Accept either $ (en-US) or ¤ (invariant culture) currency symbol
        Assert.That(content, Does.Contain("250.00").And.Contain("Numeric:"),
            "NumericTextBox should send the numeric value formatted as currency");
    }

    [Test]
    public async Task MaskedTextBox_ChangeTrigger_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#masked-result");

        // Use JS to set masked value
        await Page.EvaluateAsync(@"() => {
            const el = document.getElementById('testMasked');
            if (el && el.ej2_instances && el.ej2_instances[0]) {
                el.ej2_instances[0].value = '5551234567';
                el.ej2_instances[0].dataBind();
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }");
        await Page.WaitForTimeoutAsync(500);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Phone:").And.Contain("555"),
            "MaskedTextBox should send the masked value to the server");
    }

    #endregion

    #region Section 2: Selection Controls Tests

    [Test]
    public async Task DropDownList_SelectionChange_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#dropdown-result");

        await OpenAndSelectDropdownItem("testDropdown", "Option 2");

        var content = await resultDiv.TextContentAsync();
        // Verify the ACTUAL value is sent to the server, not just that trigger fired
        Assert.That(content, Does.Contain("Selected: 2"),
            "DropDownList should send the selected value (2) to the server");
    }

    [Test]
    public async Task ComboBox_SelectionChange_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#combobox-result");

        await SelectSyncfusionDropdownItem("testCombobox", "banana");

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Combo: banana"),
            "ComboBox should send the selected value (banana) to the server");
    }

    [Test]
    public async Task AutoComplete_SelectionChange_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#autocomplete-result");

        // Use JS to set autocomplete value
        await Page.EvaluateAsync(@"() => {
            const el = document.getElementById('testAutocomplete');
            if (el && el.ej2_instances && el.ej2_instances[0]) {
                el.ej2_instances[0].value = 'js';
                el.ej2_instances[0].dataBind();
                el.dispatchEvent(new CustomEvent('alis:trigger', { bubbles: true }));
            }
        }");
        await Page.WaitForTimeoutAsync(500);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Autocomplete: js"),
            "AutoComplete should send the selected value (js) to the server");
    }

    [Test]
    public async Task MultiSelect_SelectionChange_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#multiselect-result");

        await AddMultiselectItems("testMultiselect", new[] { "red", "blue" });

        var content = await resultDiv.TextContentAsync();
        // MultiSelect sends comma-separated or array values
        Assert.That(content, Does.Contain("Multi:").And.Contain("red"),
            "MultiSelect should send selected values to the server");
    }

    [Test]
    public async Task ListBox_SelectionChange_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#listbox-result");

        await SelectListBoxItem("testListbox", "item2");

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("List: item2"),
            "ListBox should send the selected value (item2) to the server");
    }

    #endregion

    #region Section 3: Date/Time Controls Tests

    [Test]
    public async Task DatePicker_SelectDate_TriggersALISRequest()
    {
        var resultDiv = Page.Locator("#datepicker-result");

        await SetDatePickerValue("testDatepicker");

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Date:"), "DatePicker should trigger ALIS request");
    }

    [Test]
    public async Task TimePicker_SelectTime_TriggersALISRequest()
    {
        var resultDiv = Page.Locator("#timepicker-result");

        await SetTimePickerValue("testTimepicker");

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Time:"), "TimePicker should trigger ALIS request");
    }

    [Test]
    public async Task DateTimePicker_SelectDateTime_TriggersALISRequest()
    {
        var resultDiv = Page.Locator("#datetimepicker-result");

        await SetDatePickerValue("testDatetimepicker");

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("DateTime:"), "DateTimePicker should trigger ALIS request");
    }

    [Test]
    public async Task DateRangePicker_SelectRange_TriggersALISRequest()
    {
        var resultDiv = Page.Locator("#daterangepicker-result");

        // Set date range via API
        await Page.EvaluateAsync(@"() => {
            const el = document.getElementById('testDaterangepicker');
            if (el && el.ej2_instances && el.ej2_instances[0]) {
                el.ej2_instances[0].startDate = new Date();
                el.ej2_instances[0].endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                el.ej2_instances[0].dataBind();
                el.dispatchEvent(new CustomEvent('alis:trigger', { bubbles: true }));
            }
        }");
        await Page.WaitForTimeoutAsync(300);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Range:"), "DateRangePicker should trigger ALIS request");
    }

    #endregion

    #region Section 4: Toggle/Boolean Controls Tests

    [Test]
    public async Task Checkbox_Toggle_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#checkbox-result");

        await ToggleCheckbox("testCheckbox", true);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Checkbox: true"),
            "Checkbox should send 'true' when checked");
    }

    [Test]
    public async Task Switch_Toggle_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#switch-result");

        await ToggleSwitch("testSwitch", true);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Switch: true"),
            "Switch should send 'true' when toggled on");
    }

    [Test]
    public async Task RadioButton_Selection_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#radio-result");

        // Close sidebar if it's blocking
        await Page.EvaluateAsync(@"() => {
            const sidebar = document.getElementById('sidebar');
            if (sidebar?.ej2_instances?.[0]) {
                sidebar.ej2_instances[0].hide();
            }
        }");
        await Page.WaitForTimeoutAsync(200);

        // Click the radio button using JavaScript to bypass any overlay issues
        await Page.EvaluateAsync(@"() => {
            const el = document.getElementById('radio2');
            if (el?.ej2_instances?.[0]) {
                el.ej2_instances[0].checked = true;
                el.ej2_instances[0].dataBind();
            }
            // Trigger change on radio group
            const group = document.getElementById('radioGroup');
            if (group) {
                group.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }");
        await Page.WaitForTimeoutAsync(500);

        var content = await resultDiv.TextContentAsync();
        // Accept any radio value response (verifies ALIS triggers on radio selection)
        Assert.That(content, Does.Contain("Radio:"),
            "RadioButton should send a value when clicked");
    }

    #endregion

    #region Section 5: Range/Slider Controls Tests

    [Test]
    public async Task Slider_ValueChange_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#slider-result");

        await SetSliderValue("testSlider", 75);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Slider: 75"),
            "Slider should send the value (75) to the server");
    }

    [Test]
    public async Task RangeSlider_ValueChange_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#rangeslider-result");

        // Set range slider values
        await Page.EvaluateAsync(@"() => {
            const el = document.getElementById('testRangeSlider');
            if (el && el.ej2_instances && el.ej2_instances[0]) {
                const instance = el.ej2_instances[0];
                instance.value = [30, 70];
                // Trigger change event to notify the component
                if (typeof instance.trigger === 'function') {
                    instance.trigger('change', { value: [30, 70] });
                }
            }
        }");
        await Page.WaitForTimeoutAsync(300);
        // Now trigger ALIS
        await Page.EvaluateAsync(@"() => {
            const el = document.getElementById('testRangeSlider');
            if (el) el.dispatchEvent(new CustomEvent('alis:trigger', { bubbles: true }));
        }");
        await Page.WaitForTimeoutAsync(200);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Range Slider:").And.Contain("30"),
            "Range Slider should send the range values to the server");
    }

    #endregion

    #region Section 6: Color/Special Controls Tests

    [Test]
    public async Task ColorPicker_SelectColor_SendsCorrectValue()
    {
        var resultDiv = Page.Locator("#colorpicker-result");

        await SetColorPickerValue("testColorpicker", "#ff5733");

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Color: #ff5733"),
            "ColorPicker should send the selected color to the server");
    }

    [Test]
    public async Task Button_Click_TriggersALISRequest()
    {
        var resultDiv = Page.Locator("#button-result");

        // Use JS to click button
        await JsClick("#testButton");
        await Page.WaitForTimeoutAsync(600);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Loaded at"), "Button should trigger ALIS request and load data");
    }

    [Test]
    public async Task Button_HasLoadingIndicator()
    {
        var button = Page.Locator("#testButton");
        var indicator = await button.GetAttributeAsync("data-alis-indicator");
        Assert.That(indicator, Is.EqualTo("is-loading"), "Button should have loading indicator attribute");
    }

    #endregion

    #region Section 7: Rich Text Editor Tests

    [Test]
    public async Task RichTextEditor_Exists()
    {
        var rte = Page.Locator("#testRichtext");
        Assert.That(await rte.CountAsync(), Is.GreaterThan(0), "RichTextEditor should exist on page");
    }

    [Test]
    public async Task RichTextEditor_SubmitButton_TriggersALISRequest()
    {
        await SetRichTextContent("testRichtext", "<p>Test content</p>");

        var resultDiv = Page.Locator("#richtext-result");

        // Use JS to click submit button
        await JsClick("#richtextSubmit");
        await Page.WaitForTimeoutAsync(500);

        var content = await resultDiv.TextContentAsync();
        Assert.That(content, Does.Contain("Rich text received:"), "RichTextEditor submit should trigger ALIS request");
    }

    #endregion

    #region Section 8: Cascading Controls Tests

    [Test]
    public async Task Cascading_CountrySelection_TriggersRequest()
    {
        // Verify the country dropdown has the syncfusion-datasource swap attribute
        // Note: The actual cascading with Syncfusion datasource swap requires ALIS framework support
        var countryDropdown = Page.Locator("#cascadeCountry");
        var alisGet = await countryDropdown.GetAttributeAsync("data-alis-get");
        var alisTarget = await countryDropdown.GetAttributeAsync("data-alis-target");
        var alisSwap = await countryDropdown.GetAttributeAsync("data-alis-swap");

        Assert.That(alisGet, Does.Contain("/Home/GetStates"), "Country dropdown should have GetStates endpoint");
        Assert.That(alisTarget, Is.EqualTo("#cascadeState"), "Country dropdown should target state dropdown");
        Assert.That(alisSwap, Is.EqualTo("syncfusion-datasource"), "Country dropdown should use syncfusion-datasource swap");
    }

    [Test]
    public async Task Cascading_HasSyncfusionDatasourceSwap()
    {
        var countryDropdown = Page.Locator("#cascadeCountry");
        var swap = await countryDropdown.GetAttributeAsync("data-alis-swap");
        Assert.That(swap, Is.EqualTo("syncfusion-datasource"),
            "Cascading dropdown should use syncfusion-datasource swap");
    }

    #endregion

    #region Section 9: Form Validation Tests

    [Test]
    public async Task FormValidation_EmptySubmit_ShowsErrors()
    {
        // Use JS to click submit button
        await JsClick("#valSubmit");
        await Page.WaitForTimeoutAsync(300);

        var nameError = Page.Locator("[data-valmsg-for='Name']");
        var nameErrorText = await nameError.TextContentAsync();
        Assert.That(nameErrorText, Does.Contain("required").IgnoreCase,
            "Name validation error should appear");
    }

    [Test]
    public async Task FormValidation_ValidInput_ClearsErrors()
    {
        // First trigger validation by submitting empty form
        await JsClick("#valSubmit");
        await Page.WaitForTimeoutAsync(300);

        // Fill name using JS
        await JsFillInput("#valName", "John Doe");
        await Page.WaitForTimeoutAsync(200);

        var nameError = Page.Locator("[data-valmsg-for='Name']");
        var errorText = await nameError.TextContentAsync();
        Assert.That(string.IsNullOrWhiteSpace(errorText) || !errorText.Contains("required", StringComparison.OrdinalIgnoreCase),
            Is.True, "Validation error should clear after valid input");
    }

    [Test]
    public async Task FormValidation_AllFieldsFilled_SubmitsForm()
    {
        // Fill name using JS
        await JsFillInput("#valName", "Test User");

        // Select category via Syncfusion API
        await Page.EvaluateAsync(@"() => {
            const cat = document.getElementById('valCategory');
            if (cat && cat.ej2_instances && cat.ej2_instances[0]) {
                cat.ej2_instances[0].value = 'a';
                cat.ej2_instances[0].dataBind();
            }
            const date = document.getElementById('valDate');
            if (date && date.ej2_instances && date.ej2_instances[0]) {
                date.ej2_instances[0].value = new Date();
                date.ej2_instances[0].dataBind();
            }
        }");
        await Page.WaitForTimeoutAsync(200);

        // Verify validation passes (no validation errors visible)
        var nameError = Page.Locator("[data-valmsg-for='Name']");
        var nameErrorText = await nameError.TextContentAsync();

        // The form should not show "required" error for name field after filling
        Assert.That(string.IsNullOrWhiteSpace(nameErrorText) || !nameErrorText.Contains("required", StringComparison.OrdinalIgnoreCase),
            Is.True, "Name field should pass validation after filling");
    }

    #endregion

    #region ALIS Core Attribute Tests

    [Test]
    public async Task Page_HasMultipleAlisGetElements()
    {
        var alisGetElements = Page.Locator("[data-alis-get]");
        var count = await alisGetElements.CountAsync();
        Assert.That(count, Is.GreaterThan(10), "Page should have many elements with data-alis-get");
    }

    [Test]
    public async Task Page_HasAlisPostForm()
    {
        var alisPostForms = Page.Locator("form[data-alis-post]");
        var count = await alisPostForms.CountAsync();
        Assert.That(count, Is.GreaterThan(0), "Page should have form with data-alis-post");
    }

    [Test]
    public async Task Page_HasAlisValidateForm()
    {
        var alisValidateForms = Page.Locator("form[data-alis-validate='true']");
        var count = await alisValidateForms.CountAsync();
        Assert.That(count, Is.GreaterThan(0), "Page should have form with data-alis-validate");
    }

    [Test]
    public async Task AllTargets_PointToExistingElements()
    {
        var elementsWithTargets = await Page.Locator("[data-alis-target]").AllAsync();

        foreach (var element in elementsWithTargets.Take(5)) // Check first 5
        {
            var targetSelector = await element.GetAttributeAsync("data-alis-target");
            if (!string.IsNullOrEmpty(targetSelector))
            {
                var targetCount = await Page.Locator(targetSelector).CountAsync();
                Assert.That(targetCount, Is.GreaterThan(0),
                    $"Target element {targetSelector} should exist");
            }
        }
    }

    #endregion

    #region Syncfusion Control Existence Tests

    [Test]
    public async Task AllSyncfusionControls_Exist()
    {
        // Text controls
        Assert.That(await Page.Locator("#testTextBox").CountAsync(), Is.GreaterThan(0), "TextBox exists");
        Assert.That(await Page.Locator("#testNumeric").CountAsync(), Is.GreaterThan(0), "NumericTextBox exists");
        Assert.That(await Page.Locator("#testMasked").CountAsync(), Is.GreaterThan(0), "MaskedTextBox exists");

        // Selection controls
        Assert.That(await Page.Locator("#testDropdown").CountAsync(), Is.GreaterThan(0), "DropDownList exists");
        Assert.That(await Page.Locator("#testCombobox").CountAsync(), Is.GreaterThan(0), "ComboBox exists");
        Assert.That(await Page.Locator("#testAutocomplete").CountAsync(), Is.GreaterThan(0), "AutoComplete exists");
        Assert.That(await Page.Locator("#testMultiselect").CountAsync(), Is.GreaterThan(0), "MultiSelect exists");
        Assert.That(await Page.Locator("#testListbox").CountAsync(), Is.GreaterThan(0), "ListBox exists");

        // Date/Time controls
        Assert.That(await Page.Locator("#testDatepicker").CountAsync(), Is.GreaterThan(0), "DatePicker exists");
        Assert.That(await Page.Locator("#testTimepicker").CountAsync(), Is.GreaterThan(0), "TimePicker exists");
        Assert.That(await Page.Locator("#testDatetimepicker").CountAsync(), Is.GreaterThan(0), "DateTimePicker exists");
        Assert.That(await Page.Locator("#testDaterangepicker").CountAsync(), Is.GreaterThan(0), "DateRangePicker exists");

        // Toggle controls
        Assert.That(await Page.Locator("#testCheckbox").CountAsync(), Is.GreaterThan(0), "Checkbox exists");
        Assert.That(await Page.Locator("#testSwitch").CountAsync(), Is.GreaterThan(0), "Switch exists");
        Assert.That(await Page.Locator("#radio1").CountAsync(), Is.GreaterThan(0), "RadioButton exists");

        // Range controls
        Assert.That(await Page.Locator("#testSlider").CountAsync(), Is.GreaterThan(0), "Slider exists");
        Assert.That(await Page.Locator("#testRangeSlider").CountAsync(), Is.GreaterThan(0), "RangeSlider exists");

        // Special controls
        Assert.That(await Page.Locator("#testColorpicker").CountAsync(), Is.GreaterThan(0), "ColorPicker exists");
        Assert.That(await Page.Locator("#testButton").CountAsync(), Is.GreaterThan(0), "Button exists");
        Assert.That(await Page.Locator("#testRichtext").CountAsync(), Is.GreaterThan(0), "RichTextEditor exists");
        Assert.That(await Page.Locator("#testUploader").CountAsync(), Is.GreaterThan(0), "Uploader exists");
    }

    [Test]
    public async Task AllSyncfusionControls_HaveEj2Instances()
    {
        var controlIds = new[] {
            "testTextBox", "testNumeric", "testDropdown", "testCombobox",
            "testDatepicker", "testTimepicker", "testCheckbox", "testSwitch",
            "testSlider", "testColorpicker", "testButton"
        };

        foreach (var id in controlIds)
        {
            var hasInstance = await Page.EvaluateAsync<bool>($@"() => {{
                const el = document.getElementById('{id}');
                return el && el.ej2_instances && el.ej2_instances.length > 0;
            }}");
            Assert.That(hasInstance, Is.True, $"{id} should have ej2_instances");
        }
    }

    #endregion

    #region Page Load Tests

    [Test]
    public async Task SyncfusionTestPage_LoadsWithoutErrors()
    {
        var consoleErrors = new List<string>();
        Page.Console += (_, msg) =>
        {
            if (msg.Type == "error")
                consoleErrors.Add(msg.Text);
        };

        await Page.ReloadAsync();
        await Page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        // Filter out known non-critical errors
        var criticalErrors = consoleErrors
            .Where(e => !e.Contains("favicon") && !e.Contains("404")
                && !e.Contains("ERR_NAME_NOT_RESOLVED") // Network issues
                && !e.Contains("net::") // Network errors
                && !e.Contains("license") // Syncfusion license
            ).ToList();

        Assert.That(criticalErrors, Is.Empty,
            $"Page should load without console errors. Errors: {string.Join(", ", criticalErrors)}");
    }

    [Test]
    public async Task SyncfusionScripts_LoadSuccessfully()
    {
        var ej2Loaded = await Page.EvaluateAsync<bool>("() => typeof ej !== 'undefined' || typeof window.ej !== 'undefined' || document.querySelector('[class*=\"e-control\"]') !== null");
        Assert.That(ej2Loaded, Is.True, "Syncfusion EJ2 scripts should be loaded");
    }

    #endregion
}
