namespace KitchenMate.Domain;

public static class CookTimeRules
{
    public const int MinMinutes = 1;
    public const int MaxMinutes = 240;
    public const int DefaultMinutes = 10;

    public static void Validate(int minutes)
    {
        if (minutes is < MinMinutes or > MaxMinutes)
            throw new ArgumentOutOfRangeException(nameof(minutes), $"Cook time must be between {MinMinutes} and {MaxMinutes} minutes.");
    }

    public static int EstimateOrderMinutes(IEnumerable<int> lineCookTimes)
    {
        var times = lineCookTimes.ToList();
        return times.Count == 0 ? 0 : times.Max();
    }
}
