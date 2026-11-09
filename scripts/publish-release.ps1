param(
    [Parameter(Mandatory=$true)][ValidatePattern('^[\w.-]+/[\w.-]+$')][string]$Repository,
    [Parameter(Mandatory=$true)][ValidatePattern('^[1-9][0-9]*$')][string]$ReleaseId,
    [Parameter(Mandatory=$true)][ValidatePattern('^[a-f0-9]{40}$')][string]$Commit,
    [string]$GitHubCli = 'gh',
    [switch]$VerifyOnly
)

$ErrorActionPreference = 'Stop'

function Invoke-GitHubApi([string[]]$Arguments) {
    $response = & $GitHubCli api @Arguments
    if ($LASTEXITCODE -ne 0) { throw 'GitHub API call failed.' }
    return $response
}

$root = Split-Path -Parent $PSScriptRoot
$version = (Get-Content -LiteralPath (Join-Path $root 'package.json') -Raw | ConvertFrom-Json).releaseVersion
if ($version -notmatch '^\d+\.\d+\.\d+\.\d+$') { throw 'Invalid package release version.' }
$tag = "v$version"
$endpoint = "repos/$Repository/releases/$ReleaseId"
$release = Invoke-GitHubApi @($endpoint) | ConvertFrom-Json
if ($release.tag_name -ne $tag -or $release.target_commitish -ne $Commit) {
    throw "Release must target $tag at $Commit."
}

$prefix = "Wuwatappo_Helper-$version"
$packages = @("$prefix.exe", "$prefix-Lite.exe", "$prefix-Setup.exe", "$prefix-Portable.zip")
$manifestName = 'SHA256SUMS.txt'
$names = $packages + $manifestName
$assets = @{}
foreach ($asset in $release.assets) {
    if ($asset.name -cnotin $names -or $assets.ContainsKey($asset.name) -or
        $asset.state -ne 'uploaded' -or $asset.size -le 0 -or
        $asset.digest -cnotmatch '^sha256:[a-f0-9]{64}$') {
        throw "Unexpected or incomplete release asset: $($asset.name)."
    }
    $assets.Add($asset.name, $asset)
}
if ($assets.Count -ne $names.Count) { throw 'Release assets are incomplete.' }

$manifestId = $assets[$manifestName].id
$lines = @(Invoke-GitHubApi @("repos/$Repository/releases/assets/$manifestId", '-H', 'Accept: application/octet-stream'))
if ($lines.Count -ne $packages.Count) { throw 'Checksum manifest has an unexpected number of entries.' }
$checked = @{}
foreach ($line in $lines) {
    if ($line -cnotmatch '^(?<hash>[a-f0-9]{64})  (?<name>[^/\\]+)$') { throw 'Invalid checksum entry.' }
    $name = $Matches.name
    $digest = 'sha256:' + $Matches.hash
    if ($name -cnotin $packages -or $checked.ContainsKey($name) -or $assets[$name].digest -cne $digest) {
        throw "Checksum verification failed for $name."
    }
    $checked.Add($name, $true)
    Write-Output "Verified $name"
}

if (!$VerifyOnly -and $release.draft) {
    $release = Invoke-GitHubApi @('--method', 'PATCH', $endpoint, '-F', 'draft=false', '-f', 'make_latest=true') | ConvertFrom-Json
    if ($release.draft -or $release.tag_name -ne $tag) { throw 'GitHub did not publish the expected release.' }
}
Write-Output $release.html_url
