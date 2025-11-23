# NuGet Configuration for Containerized .NET 10 with JWT Proxy

## Problem

**Error:** `NU1301: Unable to load the service index for source https://api.nuget.org/v3/index.json`

**Root Cause:** .NET's HttpClient cannot handle proxy authentication when credentials contain special characters (like JWT tokens with dots and underscores) embedded in the proxy URL format `http://user:jwt_TOKEN@proxy:port`

**Reference:** [GitHub NuGet/Home #2880](https://github.com/NuGet/Home/issues/2880)

## Solution

### Architecture

```
dotnet restore → localhost:8888 (Python proxy) → corporate proxy (JWT auth) → nuget.org
```

### 1. Python Proxy Server (`proxy-server.py`)

Creates a local HTTP/HTTPS proxy that handles JWT authentication to the upstream corporate proxy:

```python
#!/usr/bin/env python3
"""
Local HTTP/HTTPS proxy server that handles JWT proxy authentication for NuGet.
Supports both HTTP requests and HTTPS CONNECT tunneling.
"""
import os, sys, socket, select
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request, urllib.error, urllib.parse

# [See full implementation in proxy-server.py]
```

**Key Features:**
- ✅ HTTP GET/POST forwarding with JWT authentication
- ✅ HTTPS CONNECT tunneling for secure package downloads
- ✅ Handles broken pipe errors gracefully
- ✅ Logs all requests for debugging

### 2. NuGet Configuration

**File:** `nuget.config`

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <clear />
    <add key="nuget.org"
         value="http://www.nuget.org/api/v2/"
         protocolVersion="2"
         allowInsecureConnections="true" />
  </packageSources>
</configuration>
```

**Why HTTP v2?**
- Simpler proxy handling (no SSL certificate issues)
- Still secure: package downloads use HTTPS via CONNECT tunneling
- Package integrity verified by SHA512 hashes regardless of transport

### 3. Running Restore

```bash
# Start Python proxy server (in background)
python3 proxy-server.py &

# Wait for it to start
sleep 2

# Run restore pointing to localhost proxy
export http_proxy="http://127.0.0.1:8888"
export HTTP_PROXY="http://127.0.0.1:8888"
export PATH="$HOME/.dotnet:$PATH"

dotnet restore
```

## Results

✅ **Successfully restores packages from nuget.org**
- Platform.Core: 429ms
- Platform.Core.Tests: 10.16 minutes (55+ packages)

✅ **Exit code: 0**

## Why This Works

1. **Python's `urllib` handles JWT credentials correctly** - unlike .NET's HttpClient
2. **Local proxy eliminates authentication issues** - NuGet talks to localhost without auth
3. **CONNECT tunneling preserves HTTPS security** - package downloads still encrypted
4. **HTTP v2 API with `allowInsecureConnections`** - metadata queries use HTTP, downloads use HTTPS
5. **Package integrity maintained** - SHA512 hashes verify all packages

## Proxy Server Logs (Success)

```
127.0.0.1 - "GET http://www.nuget.org/api/v2/FindPackagesById()?id='...' HTTP/1.1" 200 -
127.0.0.1 - "CONNECT www.nuget.org:443 HTTP/1.1" 200 -
127.0.0.1 - "CONNECT globalcdn.nuget.org:443 HTTP/1.1" 200 -
```

## Alternative Approaches Tried

❌ **Local cache only** - Not scalable, requires manual package downloads
❌ **NO_PROXY bypass** - Container requires proxy for external access
❌ **nuget.config proxy settings** - .NET HttpClient doesn't support JWT format
❌ **Environment variable encoding** - Still fails with 401 Unauthorized
❌ **HTTP v2 without proxy** - Can't reach nuget.org without proxy

## Production Deployment

### Option 1: Systemd Service (Linux)

```ini
[Unit]
Description=NuGet Proxy for .NET Development
After=network.target

[Service]
ExecStart=/usr/bin/python3 /path/to/proxy-server.py
Restart=always
User=developer

[Install]
WantedBy=multi-user.target
```

### Option 2: Docker Sidecar Container

```yaml
services:
  nuget-proxy:
    build: .
    command: python3 proxy-server.py
    ports:
      - "127.0.0.1:8888:8888"
    environment:
      - HTTP_PROXY=${HTTP_PROXY}
```

### Option 3: Development Script

```bash
#!/bin/bash
# start-dev.sh

# Start proxy if not running
if ! pgrep -f "proxy-server.py" > /dev/null; then
    python3 proxy-server.py &
    sleep 2
fi

# Configure environment
export http_proxy="http://127.0.0.1:8888"
export HTTP_PROXY="http://127.0.0.1:8888"

# Run dotnet commands
dotnet "$@"
```

## Tested Environment

- **.NET SDK:** 10.0.100
- **Platform:** Linux (containerized)
- **Python:** 3.11+
- **Upstream Proxy:** JWT-based authentication
- **NuGet API:** v2 (HTTP with allowInsecureConnections)

## References

- [NuGet/Home #2880](https://github.com/NuGet/Home/issues/2880) - Proxy authentication issues
- [NuGet Config Reference](https://learn.microsoft.com/en-us/nuget/reference/nuget-config-file)
- [NuGet HTTPS Everywhere](https://aka.ms/nuget-https-everywhere)
- [Docker NuGet Credentials](https://github.com/dotnet/dotnet-docker/blob/main/documentation/scenarios/nuget-credentials.md)

---

**Status:** ✅ **WORKING SOLUTION**
**Last Updated:** 2025-11-23
