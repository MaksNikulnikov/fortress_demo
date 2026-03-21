[CmdletBinding()]
param(
    [string]$Platform = 'web-desktop',
    [string]$OutputPath,
    [string]$ProjectPath,
    [string]$HomePath,
    [int]$BuildTimeoutSeconds = 900
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $OutputPath = Join-Path $PSScriptRoot '..\.pages-dist'
}

if ([string]::IsNullOrWhiteSpace($ProjectPath)) {
    $ProjectPath = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

if ([string]::IsNullOrWhiteSpace($HomePath)) {
    if (-not [string]::IsNullOrWhiteSpace($env:COCOS_HOME_DIR)) {
        $HomePath = $env:COCOS_HOME_DIR
    } elseif (-not [string]::IsNullOrWhiteSpace($env:RUNNER_TEMP)) {
        $HomePath = Join-Path $env:RUNNER_TEMP 'cocos-home'
    } else {
        $HomePath = Join-Path $ProjectPath '.cocos-home'
    }
}

$defaultCreatorExe = 'C:\ProgramData\cocos\editors\Creator\3.8.8\CocosCreator.exe'
$creatorExe = if ($env:COCOS_CREATOR_EXE) { $env:COCOS_CREATOR_EXE } else { $defaultCreatorExe }

if (-not (Test-Path $creatorExe)) {
    throw "Cocos Creator executable not found: $creatorExe. Set the COCOS_CREATOR_EXE repository variable for your self-hosted runner."
}

$resolvedProjectPath = [System.IO.Path]::GetFullPath($ProjectPath)
$resolvedOutputPath = [System.IO.Path]::GetFullPath($OutputPath)
$resolvedHomePath = [System.IO.Path]::GetFullPath($HomePath)
$resolvedBuildRoot = Split-Path -Parent $resolvedOutputPath
$outputName = Split-Path -Leaf $resolvedOutputPath
$logDirectory = Join-Path $resolvedBuildRoot '.cocos-ci-logs'
$stdoutLogPath = Join-Path $logDirectory 'creator-stdout.log'
$stderrLogPath = Join-Path $logDirectory 'creator-stderr.log'

if (Test-Path $resolvedOutputPath) {
    Remove-Item $resolvedOutputPath -Recurse -Force
}

if (-not (Test-Path $resolvedBuildRoot)) {
    New-Item -ItemType Directory -Path $resolvedBuildRoot -Force | Out-Null
}

New-Item -ItemType Directory -Path $resolvedHomePath -Force | Out-Null
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Remove-Item $stdoutLogPath, $stderrLogPath -Force -ErrorAction SilentlyContinue

$buildArgs = "platform=$Platform;buildPath=$resolvedBuildRoot;outputName=$outputName;debug=false;md5Cache=false"
$indexHtmlPath = Join-Path $resolvedOutputPath 'index.html'
$noJekyllPath = Join-Path $resolvedOutputPath '.nojekyll'

$runningCreatorProcesses = @(Get-Process -Name 'CocosCreator' -ErrorAction SilentlyContinue)
if ($runningCreatorProcesses.Count -gt 0) {
    $runningProcessIds = ($runningCreatorProcesses | Select-Object -ExpandProperty Id) -join ', '
    throw @"
Cocos Creator is already running on the runner machine (PID: $runningProcessIds).

For self-hosted GitHub Actions builds, the runner must use a clean desktop session with no interactive Cocos Creator windows open.
Otherwise the new invocation can attach to the existing editor session, open the project, and never execute the CLI build.

Close Cocos Creator on the runner machine and rerun the workflow.
"@
}

function Write-ProcessLogTail {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        return
    }

    Write-Host "----- $Label ($Path) -----"
    Get-Content $Path -Tail 200 | ForEach-Object { Write-Host $_ }
}

function Invoke-CocosBuild {
    $originalElectronRunAsNode = $null
    $hadElectronRunAsNode = Test-Path Env:ELECTRON_RUN_AS_NODE

    if ($hadElectronRunAsNode) {
        $originalElectronRunAsNode = $env:ELECTRON_RUN_AS_NODE
        Write-Host 'Removing inherited ELECTRON_RUN_AS_NODE for Cocos Creator launch.'
        Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
    }

    try {
        Write-Host "Starting Cocos build with --project ..."
        Write-Host "Project path: $resolvedProjectPath"
        Write-Host "Output path: $resolvedOutputPath"
        Write-Host "Home path: $resolvedHomePath"

        $process = Start-Process -FilePath $creatorExe -ArgumentList @(
            '--home',
            $resolvedHomePath,
            '--project',
            $resolvedProjectPath,
            '--build',
            $buildArgs
        ) -PassThru -RedirectStandardOutput $stdoutLogPath -RedirectStandardError $stderrLogPath

        if (-not (Wait-Process -Id $process.Id -Timeout $BuildTimeoutSeconds -ErrorAction SilentlyContinue)) {
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Write-ProcessLogTail -Label 'Cocos stdout tail' -Path $stdoutLogPath
            Write-ProcessLogTail -Label 'Cocos stderr tail' -Path $stderrLogPath
            throw "Cocos Creator build process exceeded the timeout of $BuildTimeoutSeconds seconds."
        }

        $process.Refresh()
        $exitCode = $process.ExitCode

        if ($exitCode -eq 36) {
            Write-Host 'Cocos Creator reported a successful build.'
        } elseif ($exitCode -ne 0 -and $exitCode -ne $null) {
            Write-Host "Cocos Creator exited with code $exitCode."
        }

        for ($attempt = 0; $attempt -lt 120; $attempt += 1) {
            if (Test-Path $indexHtmlPath) {
                return
            }

            Start-Sleep -Seconds 1
        }

        Write-ProcessLogTail -Label 'Cocos stdout tail' -Path $stdoutLogPath
        Write-ProcessLogTail -Label 'Cocos stderr tail' -Path $stderrLogPath

        throw @"
Cocos build did not produce $indexHtmlPath.

Checked Creator executable:
  $creatorExe

Used arguments:
  --home $resolvedHomePath
  --project $resolvedProjectPath
  --build $buildArgs

If the runner machine injects Electron or browser-related environment variables, clear them before launching Cocos Creator.
"@
    } finally {
        if ($hadElectronRunAsNode) {
            $env:ELECTRON_RUN_AS_NODE = $originalElectronRunAsNode
        }
    }
}

Invoke-CocosBuild

New-Item -ItemType File -Path $noJekyllPath -Force | Out-Null

Write-Host "Pages artifact is ready at $resolvedOutputPath"
