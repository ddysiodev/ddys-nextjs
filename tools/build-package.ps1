param(
    [string]$Version = "0.1.0"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$resolvedRoot = $root.Path.TrimEnd("\")
$dist = Join-Path $resolvedRoot "dist"
$work = Join-Path $dist "__package"
$zip = Join-Path $dist ("ddys-nextjs-v{0}.zip" -f $Version)

New-Item -ItemType Directory -Force -Path $dist | Out-Null
$resolvedDist = (Resolve-Path $dist).Path.TrimEnd("\")
if (-not $resolvedDist.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Resolved dist path is outside the package root."
}

if (Test-Path -LiteralPath $work) {
    $resolvedWork = (Resolve-Path $work).Path.TrimEnd("\")
    if (-not $resolvedWork.StartsWith($resolvedDist, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove a work directory outside dist."
    }
    Remove-Item -LiteralPath $resolvedWork -Recurse -Force
}

if (Test-Path -LiteralPath $zip) {
    Remove-Item -LiteralPath $zip -Force
}

New-Item -ItemType Directory -Force -Path $work | Out-Null
$excludedRoots = @(".git", "dist", "node_modules", ".next", "out", "coverage")
$files = Get-ChildItem -LiteralPath $resolvedRoot -Recurse -File | Where-Object {
    $relative = $_.FullName.Substring($resolvedRoot.Length + 1).Replace("\", "/")
    $parts = $relative.Split("/")
    -not ($excludedRoots -contains $parts[0])
}

foreach ($file in $files) {
    $relative = $file.FullName.Substring($resolvedRoot.Length + 1)
    $target = Join-Path $work $relative
    $targetDir = Split-Path -Parent $target
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    Copy-Item -LiteralPath $file.FullName -Destination $target -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($zip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
    Get-ChildItem -LiteralPath $work -Recurse -File | ForEach-Object {
        $entryName = $_.FullName.Substring($work.Length + 1).Replace("\", "/")
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
} finally {
    $archive.Dispose()
}

$hash = Get-FileHash -LiteralPath $zip -Algorithm SHA256
Remove-Item -LiteralPath $work -Recurse -Force

[PSCustomObject]@{
    ok = $true
    version = $Version
    zip = $zip
    sha256 = $hash.Hash
} | ConvertTo-Json -Depth 3
