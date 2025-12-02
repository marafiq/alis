using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;

namespace SeniorLivingPortal.Infrastructure;

/// <summary>
/// Tag helper that adds data-val-* attributes for ALIS client-side validation.
/// These attributes mirror ASP.NET Core's unobtrusive validation but work with ALIS.
/// </summary>
[HtmlTargetElement("input", Attributes = "alis-val-for")]
[HtmlTargetElement("select", Attributes = "alis-val-for")]
[HtmlTargetElement("textarea", Attributes = "alis-val-for")]
public class ALISValidationTagHelper : TagHelper
{
    [HtmlAttributeName("alis-val-for")]
    public string? PropertyName { get; set; }

    [HtmlAttributeName("alis-val-required")]
    public string? RequiredMessage { get; set; }

    [HtmlAttributeName("alis-val-minlength")]
    public int? MinLength { get; set; }

    [HtmlAttributeName("alis-val-minlength-msg")]
    public string? MinLengthMessage { get; set; }

    [HtmlAttributeName("alis-val-maxlength")]
    public int? MaxLength { get; set; }

    [HtmlAttributeName("alis-val-maxlength-msg")]
    public string? MaxLengthMessage { get; set; }

    [HtmlAttributeName("alis-val-range-min")]
    public double? RangeMin { get; set; }

    [HtmlAttributeName("alis-val-range-max")]
    public double? RangeMax { get; set; }

    [HtmlAttributeName("alis-val-range-msg")]
    public string? RangeMessage { get; set; }

    [HtmlAttributeName("alis-val-regex")]
    public string? RegexPattern { get; set; }

    [HtmlAttributeName("alis-val-regex-msg")]
    public string? RegexMessage { get; set; }

    [HtmlAttributeName("alis-val-email")]
    public bool IsEmail { get; set; }

    [HtmlAttributeName("alis-val-email-msg")]
    public string? EmailMessage { get; set; }

    [HtmlAttributeName("alis-val-equalto")]
    public string? EqualToField { get; set; }

    [HtmlAttributeName("alis-val-equalto-msg")]
    public string? EqualToMessage { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        // Enable validation
        output.Attributes.SetAttribute("data-val", "true");

        // Required validation
        if (!string.IsNullOrEmpty(RequiredMessage))
        {
            output.Attributes.SetAttribute("data-val-required", RequiredMessage);
        }

        // MinLength validation
        if (MinLength.HasValue)
        {
            output.Attributes.SetAttribute("data-val-minlength", MinLengthMessage ?? $"Minimum length is {MinLength}");
            output.Attributes.SetAttribute("data-val-minlength-min", MinLength.Value.ToString());
        }

        // MaxLength validation
        if (MaxLength.HasValue)
        {
            output.Attributes.SetAttribute("data-val-maxlength", MaxLengthMessage ?? $"Maximum length is {MaxLength}");
            output.Attributes.SetAttribute("data-val-maxlength-max", MaxLength.Value.ToString());
        }

        // Range validation
        if (RangeMin.HasValue || RangeMax.HasValue)
        {
            var msg = RangeMessage ?? $"Value must be between {RangeMin ?? double.MinValue} and {RangeMax ?? double.MaxValue}";
            output.Attributes.SetAttribute("data-val-range", msg);
            if (RangeMin.HasValue)
                output.Attributes.SetAttribute("data-val-range-min", RangeMin.Value.ToString());
            if (RangeMax.HasValue)
                output.Attributes.SetAttribute("data-val-range-max", RangeMax.Value.ToString());
        }

        // Regex validation
        if (!string.IsNullOrEmpty(RegexPattern))
        {
            output.Attributes.SetAttribute("data-val-regex", RegexMessage ?? "Invalid format");
            output.Attributes.SetAttribute("data-val-regex-pattern", RegexPattern);
        }

        // Email validation
        if (IsEmail)
        {
            output.Attributes.SetAttribute("data-val-email", EmailMessage ?? "Please enter a valid email address");
        }

        // EqualTo validation (for password confirmation, etc.)
        if (!string.IsNullOrEmpty(EqualToField))
        {
            output.Attributes.SetAttribute("data-val-equalto", EqualToMessage ?? "Values must match");
            output.Attributes.SetAttribute("data-val-equalto-other", EqualToField);
        }
    }
}

/// <summary>
/// Tag helper for validation message spans compatible with ALIS.
/// </summary>
[HtmlTargetElement("span", Attributes = "alis-valmsg-for")]
public class ALISValidationMessageTagHelper : TagHelper
{
    [HtmlAttributeName("alis-valmsg-for")]
    public string? PropertyName { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (!string.IsNullOrEmpty(PropertyName))
        {
            output.Attributes.SetAttribute("data-valmsg-for", PropertyName);
            output.Attributes.SetAttribute("class", "field-validation-valid text-danger");
        }
    }
}

/// <summary>
/// Tag helper for ALIS form configuration.
/// </summary>
[HtmlTargetElement("form", Attributes = "alis-*")]
public class ALISFormTagHelper : TagHelper
{
    [HtmlAttributeName("alis-post")]
    public string? PostUrl { get; set; }

    [HtmlAttributeName("alis-get")]
    public string? GetUrl { get; set; }

    [HtmlAttributeName("alis-put")]
    public string? PutUrl { get; set; }

    [HtmlAttributeName("alis-delete")]
    public string? DeleteUrl { get; set; }

    [HtmlAttributeName("alis-target")]
    public string? Target { get; set; }

    [HtmlAttributeName("alis-swap")]
    public string? Swap { get; set; }

    [HtmlAttributeName("alis-indicator")]
    public string? Indicator { get; set; }

    [HtmlAttributeName("alis-validate")]
    public bool Validate { get; set; } = true;

    [HtmlAttributeName("alis-confirm")]
    public string? ConfirmMessage { get; set; }

    [HtmlAttributeName("alis-on-before")]
    public string? OnBefore { get; set; }

    [HtmlAttributeName("alis-on-after")]
    public string? OnAfter { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (!string.IsNullOrEmpty(PostUrl))
            output.Attributes.SetAttribute("data-alis-post", PostUrl);
        if (!string.IsNullOrEmpty(GetUrl))
            output.Attributes.SetAttribute("data-alis-get", GetUrl);
        if (!string.IsNullOrEmpty(PutUrl))
            output.Attributes.SetAttribute("data-alis-put", PutUrl);
        if (!string.IsNullOrEmpty(DeleteUrl))
            output.Attributes.SetAttribute("data-alis-delete", DeleteUrl);
        if (!string.IsNullOrEmpty(Target))
            output.Attributes.SetAttribute("data-alis-target", Target);
        if (!string.IsNullOrEmpty(Swap))
            output.Attributes.SetAttribute("data-alis-swap", Swap);
        if (!string.IsNullOrEmpty(Indicator))
            output.Attributes.SetAttribute("data-alis-indicator", Indicator);
        if (Validate)
            output.Attributes.SetAttribute("data-alis-validate", "true");
        if (!string.IsNullOrEmpty(ConfirmMessage))
            output.Attributes.SetAttribute("data-alis-confirm", ConfirmMessage);
        if (!string.IsNullOrEmpty(OnBefore))
            output.Attributes.SetAttribute("data-alis-on-before", OnBefore);
        if (!string.IsNullOrEmpty(OnAfter))
            output.Attributes.SetAttribute("data-alis-on-after", OnAfter);
    }
}

/// <summary>
/// Tag helper for ALIS-enabled buttons and links.
/// </summary>
[HtmlTargetElement("button", Attributes = "alis-*")]
[HtmlTargetElement("a", Attributes = "alis-*")]
public class ALISActionTagHelper : TagHelper
{
    [HtmlAttributeName("alis-get")]
    public string? GetUrl { get; set; }

    [HtmlAttributeName("alis-post")]
    public string? PostUrl { get; set; }

    [HtmlAttributeName("alis-delete")]
    public string? DeleteUrl { get; set; }

    [HtmlAttributeName("alis-target")]
    public string? Target { get; set; }

    [HtmlAttributeName("alis-swap")]
    public string? Swap { get; set; }

    [HtmlAttributeName("alis-indicator")]
    public string? Indicator { get; set; }

    [HtmlAttributeName("alis-confirm")]
    public string? ConfirmMessage { get; set; }

    [HtmlAttributeName("alis-trigger")]
    public string? Trigger { get; set; }

    [HtmlAttributeName("alis-on-after")]
    public string? OnAfter { get; set; }

    public override void Process(TagHelperContext context, TagHelperOutput output)
    {
        if (!string.IsNullOrEmpty(GetUrl))
            output.Attributes.SetAttribute("data-alis-get", GetUrl);
        if (!string.IsNullOrEmpty(PostUrl))
            output.Attributes.SetAttribute("data-alis-post", PostUrl);
        if (!string.IsNullOrEmpty(DeleteUrl))
            output.Attributes.SetAttribute("data-alis-delete", DeleteUrl);
        if (!string.IsNullOrEmpty(Target))
            output.Attributes.SetAttribute("data-alis-target", Target);
        if (!string.IsNullOrEmpty(Swap))
            output.Attributes.SetAttribute("data-alis-swap", Swap);
        if (!string.IsNullOrEmpty(Indicator))
            output.Attributes.SetAttribute("data-alis-indicator", Indicator);
        if (!string.IsNullOrEmpty(ConfirmMessage))
            output.Attributes.SetAttribute("data-alis-confirm", ConfirmMessage);
        if (!string.IsNullOrEmpty(Trigger))
            output.Attributes.SetAttribute("data-alis-trigger", Trigger);
        if (!string.IsNullOrEmpty(OnAfter))
            output.Attributes.SetAttribute("data-alis-on-after", OnAfter);
    }
}

