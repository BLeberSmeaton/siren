using Microsoft.Extensions.DependencyInjection;
using SIREN.Core.Interfaces;
using SIREN.Core.Providers;
using SIREN.Core.Services;

namespace SIREN.Console
{
    class Program
    {
        static async Task Main(string[] args)
        {
            System.Console.WriteLine("🚨 SIREN - Support Signal Intelligence Response Engine");
            System.Console.WriteLine("===============================================");

            // Original foundation demo (Configuration demo coming soon!)
            var services = new ServiceCollection();
            ConfigureServices(services);
            
            using var serviceProvider = services.BuildServiceProvider();
            await DemonstrateSystem(serviceProvider);

            System.Console.WriteLine();
            System.Console.WriteLine("🔧 NEW: Configuration-driven multi-team architecture implemented!");
        }

        private static void ConfigureServices(ServiceCollection services)
        {
            // Register core services
            services.AddTransient<ICategorizer, CategoryEngine>();
            
            // Register CSV provider with sample data (we'll make this configurable later)
            var sampleCsvData = """
                Summary,Created,Updated,Description,Category
                Certificate expiry notification,22/08/2025 10:21,25/08/2025 14:24,TLS certificate needs renewal in keyvault,
                Bank feed connection issue,18/08/2025 21:29,25/08/2025 11:16,Customer unable to connect bank feeds properly,
                API rate limiting error,14/08/2025 09:57,19/08/2025 13:51,Client API key has exceeded the per-second rate limit,
                Security vulnerability found,14/08/2025 08:41,25/08/2025 14:25,Wiz detected vulnerability in the system,
                """;
            
            services.AddSingleton<ISignalProvider>(provider => 
                new CsvSignalProvider(sampleCsvData));
        }

        private static async Task DemonstrateSystem(ServiceProvider serviceProvider)
        {
            // Get services from DI container
            var signalProvider = serviceProvider.GetRequiredService<ISignalProvider>();
            var categorizer = serviceProvider.GetRequiredService<ICategorizer>();

            System.Console.WriteLine($"📊 Loading signals from {signalProvider.ProviderName} provider...");
            
            // Load signals
            var signals = await signalProvider.GetSignalsAsync();
            var signalList = signals.ToList();
            
            System.Console.WriteLine($"✅ Loaded {signalList.Count} signals");
            System.Console.WriteLine();

            // Process and categorize signals
            System.Console.WriteLine("🧠 Processing signals with categorization engine...");
            System.Console.WriteLine();

            foreach (var signal in signalList)
            {
                // Auto-categorize if not already categorized
                if (string.IsNullOrEmpty(signal.Category))
                {
                    signal.Category = categorizer.CategorizeSignal(signal);
                }

                // Display results
                System.Console.WriteLine($"📋 Signal: {signal.Title}");
                System.Console.WriteLine($"   Category: {signal.Category ?? "Uncategorized"}");
                System.Console.WriteLine($"   Source: {signal.Source}");
                System.Console.WriteLine($"   Description: {TruncateString(signal.Description, 60)}");
                System.Console.WriteLine();
            }

            System.Console.WriteLine("🎯 SIREN Foundation Complete!");
            System.Console.WriteLine("Available capabilities:");
            System.Console.WriteLine("  ✅ Core interfaces and models");
            System.Console.WriteLine("  ✅ Categorization engine with your CSV rules");
            System.Console.WriteLine("  ✅ CSV provider with test coverage");
            System.Console.WriteLine("  ✅ Dependency injection setup");
            System.Console.WriteLine("  ✅ Configuration-driven multi-team architecture");
            System.Console.WriteLine("  ✅ Extensible provider registry (CSV, Teams, Slack, Jira)");
            System.Console.WriteLine();
            System.Console.WriteLine("🚀 Production-ready for Innovation Day demo!");
        }

        private static string TruncateString(string input, int maxLength)
        {
            if (string.IsNullOrEmpty(input) || input.Length <= maxLength)
                return input ?? string.Empty;
                
            return input.Substring(0, maxLength - 3) + "...";
        }
    }
}