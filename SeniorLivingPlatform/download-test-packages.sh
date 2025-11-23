#!/bin/bash
# Script to download all test project dependencies

set -e

CACHE_DIR="$HOME/.nuget/packages"
NUGET_URL="https://api.nuget.org/v3-flatcontainer"

# Function to download a package
download_package() {
    local package_name=$1
    local version=$2
    local package_lower=$(echo "$package_name" | tr '[:upper:]' '[:lower:]')

    echo "Downloading $package_name $version..."

    # Create directory structure
    mkdir -p "$CACHE_DIR/$package_lower/$version"

    # Download .nupkg file
    wget -q "$NUGET_URL/$package_lower/$version/$package_lower.$version.nupkg" \
         -O "$CACHE_DIR/$package_lower/$version/$package_lower.$version.nupkg" || {
        echo "Failed to download $package_name $version"
        return 1
    }

    # Create SHA512 hash
    python3 -c "
import hashlib
import base64

with open('$CACHE_DIR/$package_lower/$version/$package_lower.$version.nupkg', 'rb') as f:
    sha512 = hashlib.sha512(f.read()).digest()
    hash_b64 = base64.b64encode(sha512).decode()
    with open('$CACHE_DIR/$package_lower/$version/$package_lower.$version.nupkg.sha512', 'w') as h:
        h.write(hash_b64)
"

    # Extract .nuspec
    unzip -q -o "$CACHE_DIR/$package_lower/$version/$package_lower.$version.nupkg" \
        "$package_lower.nuspec" \
        -d "$CACHE_DIR/$package_lower/$version/" 2>/dev/null || true

    echo "✓ Downloaded $package_name $version"
}

# Test framework packages
download_package "Microsoft.NET.Test.Sdk" "17.14.1"
download_package "Microsoft.TestPlatform.ObjectModel" "17.14.1"
download_package "Microsoft.TestPlatform.TestHost" "17.14.1"
download_package "xunit" "2.9.3"
download_package "xunit.core" "2.9.3"
download_package "xunit.assert" "2.9.3"
download_package "xunit.abstractions" "2.0.3"
download_package "xunit.analyzers" "1.18.0"
download_package "xunit.extensibility.core" "2.9.3"
download_package "xunit.extensibility.execution" "2.9.3"
download_package "xunit.runner.visualstudio" "3.1.4"
download_package "FluentAssertions" "7.0.0"
download_package "NSubstitute" "5.3.0"
download_package "coverlet.collector" "6.0.4"

# Microsoft.AspNetCore packages
download_package "Microsoft.AspNetCore.Mvc.Testing" "9.0.0"
download_package "Microsoft.AspNetCore.TestHost" "9.0.0"

# Microsoft.Extensions packages (version 9.0.0)
download_package "Microsoft.Extensions.Configuration" "9.0.0"
download_package "Microsoft.Extensions.Configuration.Abstractions" "9.0.0"
download_package "Microsoft.Extensions.Configuration.Binder" "9.0.0"
download_package "Microsoft.Extensions.Configuration.CommandLine" "9.0.0"
download_package "Microsoft.Extensions.Configuration.EnvironmentVariables" "9.0.0"
download_package "Microsoft.Extensions.Configuration.FileExtensions" "9.0.0"
download_package "Microsoft.Extensions.Configuration.Json" "9.0.0"
download_package "Microsoft.Extensions.Configuration.UserSecrets" "9.0.0"
download_package "Microsoft.Extensions.DependencyInjection" "9.0.0"
download_package "Microsoft.Extensions.Diagnostics" "9.0.0"
download_package "Microsoft.Extensions.Diagnostics.Abstractions" "9.0.0"
download_package "Microsoft.Extensions.FileProviders.Abstractions" "9.0.0"
download_package "Microsoft.Extensions.FileProviders.Physical" "9.0.0"
download_package "Microsoft.Extensions.FileSystemGlobbing" "9.0.0"
download_package "Microsoft.Extensions.Hosting" "9.0.0"
download_package "Microsoft.Extensions.Hosting.Abstractions" "9.0.0"
download_package "Microsoft.Extensions.Logging" "9.0.0"
download_package "Microsoft.Extensions.Logging.Configuration" "9.0.0"
download_package "Microsoft.Extensions.Logging.Console" "9.0.0"
download_package "Microsoft.Extensions.Logging.Debug" "9.0.0"
download_package "Microsoft.Extensions.Logging.EventLog" "9.0.0"
download_package "Microsoft.Extensions.Logging.EventSource" "9.0.0"
download_package "Microsoft.Extensions.Primitives" "9.0.0"

# System packages
download_package "System.Configuration.ConfigurationManager" "9.0.0"
download_package "System.Diagnostics.EventLog" "9.0.0"
download_package "System.Security.Cryptography.ProtectedData" "9.0.0"
download_package "System.Security.Permissions" "9.0.0"
download_package "System.Windows.Extensions" "9.0.0"
download_package "System.Reflection.Metadata" "9.0.0"
download_package "System.Collections.Immutable" "9.0.0"

# Additional dependencies
download_package "Newtonsoft.Json" "13.0.3"
download_package "NuGet.Frameworks" "6.12.1"
download_package "Castle.Core" "5.1.1"

echo ""
echo "All test packages downloaded successfully!"
