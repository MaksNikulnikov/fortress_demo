[CmdletBinding()]
param(
    [string]$Platform = 'web-desktop',
    [string]$OutputPath = (Join-Path $PSScriptRoot '..\.pages-dist'),
    [string]$ProjectPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

$defaultCreatorExe = 'C:\ProgramData\cocos\editors\Creator\3.8.8\CocosCreator.exe'
$creatorExe = if ($env:COCOS_CREATOR_EXE) { $env:COCOS_CREATOR_EXE } else { $defaultCreatorExe }

if (-not (Test-Path $creatorExe)) {
    throw "Cocos Creator executable not found: $creatorExe. Set the COCOS_CREATOR_EXE repository variable for your self-hosted runner."
}

$resolvedOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$resolvedBuildRoot = Split-Path -Parent $resolvedOutputPath
$outputName = Split-Path -Leaf $resolvedOutputPath

if (Test-Path $resolvedOutputPath) {
    Remove-Item $resolvedOutputPath -Recurse -Force
}

if (-not (Test-Path $resolvedBuildRoot)) {
    New-Item -ItemType Directory -Path $resolvedBuildRoot -Force | Out-Null
}

$buildArgs = "platform=$Platform;buildPath=$resolvedBuildRoot;outputName=$outputName;debug=false;md5Cache=false"
$indexHtmlPath = Join-Path $resolvedOutputPath 'index.html'
$noJekyllPath = Join-Path $resolvedOutputPath '.nojekyll'

function Invoke-CocosBuild {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectArgument
    )

    Write-Host "Trying Cocos build with $ProjectArgument ..."

    & $creatorExe $ProjectArgument $ProjectPath --build $buildArgs
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 36) {
        Write-Host 'Cocos Creator reported a successful build.'
    } elseif ($exitCode -ne 0 -and $exitCode -ne $null) {
        Write-Host "Cocos Creator exited with code $exitCode."
    }

    for ($attempt = 0; $attempt -lt 120; $attempt += 1) {
        if (Test-Path $indexHtmlPath) {
            return $true
        }

        Start-Sleep -Seconds 1
    }

    return $false
}

$buildSucceeded = $false

foreach ($projectArgument in @('--project', '--path')) {
    if (Invoke-CocosBuild -ProjectArgument $projectArgument) {
        $buildSucceeded = $true
        break
    }
}

if (-not $buildSucceeded) {
    throw @"
Cocos build did not produce $indexHtmlPath.

Checked Creator executable:
  $creatorExe

Tried argument styles:
  --project
  --path

If your local Cocos installation uses another CLI entrypoint, update scripts/build-pages.ps1 accordingly.
"@
}

New-Item -ItemType File -Path $noJekyllPath -Force | Out-Null

Write-Host "Pages artifact is ready at $resolvedOutputPath"
