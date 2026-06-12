using System.Text.RegularExpressions;

namespace KitchenMate.Infrastructure.Tenancy;

public static partial class TenantSlugNormalizer
{
    public static string Normalize(string slug) =>
        slug.Trim().ToLowerInvariant();

    public static string FromRestaurantName(string name)
    {
        var slug = name.Trim().ToLowerInvariant();
        slug = NonAlphanumeric().Replace(slug, "-");
        slug = MultipleHyphens().Replace(slug, "-").Trim('-');
        return slug.Length > 0 ? slug : "restaurant";
    }

    public static bool IsValid(string slug) =>
        ValidSlug().IsMatch(slug) && slug.Length is >= 3 and <= 50;

    [GeneratedRegex(@"^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex ValidSlug();

    [GeneratedRegex(@"[^a-z0-9]+")]
    private static partial Regex NonAlphanumeric();

    [GeneratedRegex(@"-{2,}")]
    private static partial Regex MultipleHyphens();
}
