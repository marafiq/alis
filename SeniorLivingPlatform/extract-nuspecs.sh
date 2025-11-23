#!/bin/bash
# Script to extract .nuspec files from all downloaded packages

set -e

CACHE_DIR="$HOME/.nuget/packages"

# Function to extract nuspec
extract_nuspec() {
    local package_name=$1
    local version=$2
    local package_lower=$(echo "$package_name" | tr '[:upper:]' '[:lower:]')

    cd "$CACHE_DIR/$package_lower/$version/"

    # Find the .nuspec file name (case-insensitive)
    local nuspec_file=$(unzip -l "$package_lower.$version.nupkg" | grep -i "\.nuspec$" | awk '{print $NF}')

    if [ -n "$nuspec_file" ]; then
        unzip -o "$package_lower.$version.nupkg" "$nuspec_file" >/dev/null 2>&1
        echo "✓ Extracted $nuspec_file"
    else
        echo "✗ No nuspec found in $package_name $version"
    fi
}

# Test framework packages
extract_nuspec "Microsoft.NET.Test.Sdk" "17.14.1"
extract_nuspec "Microsoft.TestPlatform.ObjectModel" "17.14.1"
extract_nuspec "Microsoft.TestPlatform.TestHost" "17.14.1"
extract_nuspec "xunit" "2.9.3"
extract_nuspec "xunit.core" "2.9.3"
extract_nuspec "xunit.assert" "2.9.3"
extract_nuspec "xunit.abstractions" "2.0.3"
extract_nuspec "xunit.analyzers" "1.18.0"
extract_nuspec "xunit.extensibility.core" "2.9.3"
extract_nuspec "xunit.extensibility.execution" "2.9.3"
extract_nuspec "xunit.runner.visualstudio" "3.1.4"
extract_nuspec "FluentAssertions" "7.0.0"
extract_nuspec "NSubstitute" "5.3.0"
extract_nuspec "coverlet.collector" "6.0.4"

# Microsoft.AspNetCore packages
extract_nuspec "Microsoft.AspNetCore.Mvc.Testing" "9.0.0"
extract_nuspec "Microsoft.AspNetCore.TestHost" "9.0.0"

# Microsoft.Extensions packages
extract_nuspec "Microsoft.Extensions.Configuration" "9.0.0"
extract_nuspec "Microsoft.Extensions.Configuration.Abstractions" "9.0.0"
extract_nuspec "Microsoft.Extensions.Configuration.Binder" "9.0.0"
extract_nuspec "Microsoft.Extensions.Configuration.CommandLine" "9.0.0"
extract_nuspec "Microsoft.Extensions.Configuration.EnvironmentVariables" "9.0.0"
extract_nuspec "Microsoft.Extensions.Configuration.FileExtensions" "9.0.0"
extract_nuspec "Microsoft.Extensions.Configuration.Json" "9.0.0"
extract_nuspec "Microsoft.Extensions.Configuration.UserSecrets" "9.0.0"
extract_nuspec "Microsoft.Extensions.DependencyInjection" "9.0.0"
extract_nuspec "Microsoft.Extensions.Diagnostics" "9.0.0"
extract_nuspec "Microsoft.Extensions.Diagnostics.Abstractions" "9.0.0"
extract_nuspec "Microsoft.Extensions.FileProviders.Abstractions" "9.0.0"
extract_nuspec "Microsoft.Extensions.FileProviders.Physical" "9.0.0"
extract_nuspec "Microsoft.Extensions.FileSystemGlobbing" "9.0.0"
extract_nuspec "Microsoft.Extensions.Hosting" "9.0.0"
extract_nuspec "Microsoft.Extensions.Hosting.Abstractions" "9.0.0"
extract_nuspec "Microsoft.Extensions.Logging" "9.0.0"
extract_nuspec "Microsoft.Extensions.Logging.Configuration" "9.0.0"
extract_nuspec "Microsoft.Extensions.Logging.Console" "9.0.0"
extract_nuspec "Microsoft.Extensions.Logging.Debug" "9.0.0"
extract_nuspec "Microsoft.Extensions.Logging.EventLog" "9.0.0"
extract_nuspec "Microsoft.Extensions.Logging.EventSource" "9.0.0"
extract_nuspec "Microsoft.Extensions.Primitives" "9.0.0"

# System packages
extract_nuspec "System.Configuration.ConfigurationManager" "9.0.0"
extract_nuspec "System.Diagnostics.EventLog" "9.0.0"
extract_nuspec "System.Security.Cryptography.ProtectedData" "9.0.0"
extract_nuspec "System.Security.Permissions" "9.0.0"
extract_nuspec "System.Windows.Extensions" "9.0.0"
extract_nuspec "System.Reflection.Metadata" "9.0.0"
extract_nuspec "System.Collections.Immutable" "9.0.0"

# Additional dependencies
extract_nuspec "Newtonsoft.Json" "13.0.3"
extract_nuspec "NuGet.Frameworks" "6.12.1"
extract_nuspec "Castle.Core" "5.1.1"

echo ""
echo "All nuspec files extracted successfully!"
