#!/bin/bash
# Script to fully extract all package contents

set -e

CACHE_DIR="$HOME/.nuget/packages"

# Function to fully extract a package
extract_package() {
    local package_name=$1
    local version=$2
    local package_lower=$(echo "$package_name" | tr '[:upper:]' '[:lower:]')

    echo "Extracting $package_name $version..."

    cd "$CACHE_DIR/$package_lower/$version/"

    # Extract everything from the package
    unzip -o -q "$package_lower.$version.nupkg"

    echo "✓ Extracted $package_name $version"
}

# Extract all packages
extract_package "Microsoft.NET.Test.Sdk" "17.14.1"
extract_package "Microsoft.TestPlatform.ObjectModel" "17.14.1"
extract_package "Microsoft.TestPlatform.TestHost" "17.14.1"
extract_package "xunit" "2.9.3"
extract_package "xunit.core" "2.9.3"
extract_package "xunit.assert" "2.9.3"
extract_package "xunit.abstractions" "2.0.3"
extract_package "xunit.analyzers" "1.18.0"
extract_package "xunit.extensibility.core" "2.9.3"
extract_package "xunit.extensibility.execution" "2.9.3"
extract_package "xunit.runner.visualstudio" "3.1.4"
extract_package "FluentAssertions" "7.0.0"
extract_package "NSubstitute" "5.3.0"
extract_package "coverlet.collector" "6.0.4"
extract_package "Microsoft.AspNetCore.Mvc.Testing" "9.0.0"
extract_package "Microsoft.AspNetCore.TestHost" "9.0.0"
extract_package "Microsoft.Extensions.Configuration" "9.0.0"
extract_package "Microsoft.Extensions.Configuration.Abstractions" "9.0.0"
extract_package "Microsoft.Extensions.Configuration.Binder" "9.0.0"
extract_package "Microsoft.Extensions.Configuration.CommandLine" "9.0.0"
extract_package "Microsoft.Extensions.Configuration.EnvironmentVariables" "9.0.0"
extract_package "Microsoft.Extensions.Configuration.FileExtensions" "9.0.0"
extract_package "Microsoft.Extensions.Configuration.Json" "9.0.0"
extract_package "Microsoft.Extensions.Configuration.UserSecrets" "9.0.0"
extract_package "Microsoft.Extensions.DependencyInjection" "9.0.0"
extract_package "Microsoft.Extensions.Diagnostics" "9.0.0"
extract_package "Microsoft.Extensions.Diagnostics.Abstractions" "9.0.0"
extract_package "Microsoft.Extensions.FileProviders.Abstractions" "9.0.0"
extract_package "Microsoft.Extensions.FileProviders.Physical" "9.0.0"
extract_package "Microsoft.Extensions.FileSystemGlobbing" "9.0.0"
extract_package "Microsoft.Extensions.Hosting" "9.0.0"
extract_package "Microsoft.Extensions.Hosting.Abstractions" "9.0.0"
extract_package "Microsoft.Extensions.Logging" "9.0.0"
extract_package "Microsoft.Extensions.Logging.Configuration" "9.0.0"
extract_package "Microsoft.Extensions.Logging.Console" "9.0.0"
extract_package "Microsoft.Extensions.Logging.Debug" "9.0.0"
extract_package "Microsoft.Extensions.Logging.EventLog" "9.0.0"
extract_package "Microsoft.Extensions.Logging.EventSource" "9.0.0"
extract_package "Microsoft.Extensions.Primitives" "9.0.0"
extract_package "Microsoft.Extensions.Options.ConfigurationExtensions" "9.0.0"
extract_package "System.Configuration.ConfigurationManager" "9.0.0"
extract_package "System.Diagnostics.EventLog" "9.0.0"
extract_package "System.Security.Cryptography.ProtectedData" "9.0.0"
extract_package "System.Security.Permissions" "9.0.0"
extract_package "System.Windows.Extensions" "9.0.0"
extract_package "System.Reflection.Metadata" "9.0.0"
extract_package "System.Collections.Immutable" "9.0.0"
extract_package "Newtonsoft.Json" "13.0.3"
extract_package "NuGet.Frameworks" "6.12.1"
extract_package "Castle.Core" "5.1.1"

echo ""
echo "All packages fully extracted!"
