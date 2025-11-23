# NuGet Configuration for Containerized .NET 10 Environment

## Problem Encountered

**Error:** `NU1301: Unable to load the service index for source https://api.nuget.org/v3/index.json`

**Root Cause:** Malformed `http_proxy` environment variable with embedded JWT credentials caused .NET HttpClient to fail proxy authentication.

## Solution

### 1. Download Packages Using wget

Since `wget` handles the proxy correctly but `dotnet restore` doesn't, download packages manually:

```bash
#!/bin/bash
CACHE_DIR="/root/.nuget/packages"

download_pkg() {
    local id=$1
    local version=$2
    local id_lower=$(echo "$id" | tr '[:upper:]' '[:lower:]')
    local url="https://api.nuget.org/v3-flatcontainer/${id_lower}/${version}/${id_lower}.${version}.nupkg"
    local target_dir="${CACHE_DIR}/${id_lower}/${version}"

    mkdir -p "$target_dir"

    if [ ! -f "${target_dir}/${id_lower}.${version}.nupkg" ]; then
        echo "Downloading $id $version..."
        wget -q -O "${target_dir}/${id_lower}.${version}.nupkg" "$url"
        cd "$target_dir" && unzip -q "${id_lower}.${version}.nupkg" && cd - > /dev/null
    fi
}

# Example usage
download_pkg "Microsoft.Extensions.DependencyInjection.Abstractions" "9.0.0"
```

### 2. Create SHA512 Hash Files

NuGet requires `.nupkg.sha512` files alongside each package:

```bash
python3 << 'PYSCRIPT'
import hashlib
import base64
from pathlib import Path

cache_dir = Path("/root/.nuget/packages")

for nupkg in cache_dir.rglob("*.nupkg"):
    hash_file = Path(str(nupkg) + ".sha512")
    if not hash_file.exists():
        sha512 = hashlib.sha512()
        with open(nupkg, 'rb') as f:
            sha512.update(f.read())

        hash_b64 = base64.b64encode(sha512.digest()).decode('ascii')
        with open(hash_file, 'w') as f:
            f.write(hash_b64)
PYSCRIPT
```

### 3. Configure NuGet for Local Cache Only

Create `nuget.config` in solution root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="local" value="/root/.nuget/packages/" />
  </packageSources>
</configuration>
```

### 4. Unset Proxy Variables and Build

The critical step - unset all proxy environment variables:

```bash
#!/bin/bash
set -e

# Unset ALL proxy vars (per GitHub NuGet/Home#2880)
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY no_proxy NO_PROXY
unset GLOBAL_AGENT_HTTP_PROXY GLOBAL_AGENT_HTTPS_PROXY GLOBAL_AGENT_NO_PROXY

export PATH="$HOME/.dotnet:$PATH"

# Restore with local cache only
dotnet restore --source /root/.nuget/packages/

# Build
dotnet build --no-restore
```

## Complete Working Script

```bash
#!/bin/bash
set -e

CACHE_DIR="/root/.nuget/packages"

# Function to download a package
download_pkg() {
    local id=$1
    local version=$2
    local id_lower=$(echo "$id" | tr '[:upper:]' '[:lower:]')
    local url="https://api.nuget.org/v3-flatcontainer/${id_lower}/${version}/${id_lower}.${version}.nupkg"
    local target_dir="${CACHE_DIR}/${id_lower}/${version}"

    mkdir -p "$target_dir"

    if [ ! -f "${target_dir}/${id_lower}.${version}.nupkg" ]; then
        echo "Downloading $id $version..."
        wget -q -O "${target_dir}/${id_lower}.${version}.nupkg" "$url" && \
        cd "$target_dir" && \
        unzip -q "${id_lower}.${version}.nupkg" && \
        cd - > /dev/null
    fi
}

# Download all required packages
download_pkg "Microsoft.Extensions.DependencyInjection.Abstractions" "9.0.0"
download_pkg "Microsoft.Extensions.Options" "9.0.0"
download_pkg "Microsoft.Extensions.Logging.Abstractions" "9.0.0"
download_pkg "Microsoft.AspNetCore.Http.Abstractions" "2.2.0"

# Add more packages as needed...

# Create SHA512 hashes
python3 << 'PYSCRIPT'
import hashlib
import base64
from pathlib import Path

cache_dir = Path("/root/.nuget/packages")

for nupkg in cache_dir.rglob("*.nupkg"):
    hash_file = Path(str(nupkg) + ".sha512")
    if not hash_file.exists():
        sha512 = hashlib.sha512()
        with open(nupkg, 'rb') as f:
            sha512.update(f.read())

        hash_b64 = base64.b64encode(sha512.digest()).decode('ascii')
        with open(hash_file, 'w') as f:
            f.write(hash_b64)
PYSCRIPT

echo "✅ Packages downloaded and hashed"

# Configure NuGet for local cache
cat > nuget.config << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="local" value="/root/.nuget/packages/" />
  </packageSources>
</configuration>
EOF

# Unset proxy vars and build
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY no_proxy NO_PROXY
unset GLOBAL_AGENT_HTTP_PROXY GLOBAL_AGENT_HTTPS_PROXY GLOBAL_AGENT_NO_PROXY

export PATH="$HOME/.dotnet:$PATH"

# Clean previous build
rm -rf src/Platform.Core/obj src/Platform.Core/bin

# Restore and build
dotnet restore src/Platform.Core/Platform.Core.csproj --source /root/.nuget/packages/
dotnet build --no-restore src/Platform.Core/Platform.Core.csproj

echo "✅ Build succeeded!"
```

## Key Insights

### Why This Works

1. **wget respects the proxy** configuration including JWT credentials
2. **dotnet restore fails** with malformed proxy environment variables
3. **Unsetting proxy vars** forces NuGet to use the local cache configured in `nuget.config`
4. **Local cache becomes the source** avoiding network/proxy issues entirely

### References

- [GitHub NuGet/Home #2880](https://github.com/NuGet/Home/issues/2880) - Malformed proxy causes service index errors
- [NuGet Proxy Settings Blog](https://skolima.blogspot.com/2012/07/nuget-proxy-settings.html) - Configuration priority order
- [NuGet Config Reference](https://learn.microsoft.com/en-us/nuget/reference/nuget-config-file#config-section) - Official proxy configuration
- [Building .NET Offline](https://nodogmablog.bryanhogan.net/2024/11/building-net-while-offline-using-the-local-nuget-cache/) - Local cache patterns
- [.NET Docker NuGet Credentials](https://github.com/dotnet/dotnet-docker/blob/main/documentation/scenarios/nuget-credentials.md) - Container best practices

## Tested On

- **.NET SDK:** 10.0.100
- **Platform:** Linux (containerized environment)
- **Proxy:** JWT-based authentication proxy
- **Result:** ✅ Successful build

## Usage for Future Modules

When adding new packages:

1. Add `download_pkg "PackageName" "Version"` calls
2. Run the download script
3. Create SHA512 hashes with Python script
4. Run `dotnet restore --source /root/.nuget/packages/`
5. Build with `dotnet build --no-restore`

---

**Note:** This solution bypasses the proxy issue by using local cache exclusively. In production environments, ensure packages are verified and from trusted sources.
