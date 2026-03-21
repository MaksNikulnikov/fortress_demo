[CmdletBinding()]
param(
    [string]$BuildPath = "build/web-desktop",
    [string]$PublishPath = "docs"
)

$ErrorActionPreference = "Stop"

function Resolve-AbsolutePath {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if ([System.IO.Path]::IsPathRooted($Path)) {
        return [System.IO.Path]::GetFullPath($Path)
    }

    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Path))
}

function Disable-CocosSplash {
    param(
        [Parameter(Mandatory = $true)]
        [string]$RootPath
    )

    $settingsPath = Join-Path $RootPath "src/settings.json"
    if (Test-Path $settingsPath) {
        $settings = Get-Content -Path $settingsPath -Raw | ConvertFrom-Json
        $settings.PSObject.Properties.Remove("splashScreen")
        $settings | ConvertTo-Json -Depth 100 -Compress | Set-Content -Path $settingsPath -NoNewline
    }

    $engineChunk = Get-ChildItem -Path (Join-Path $RootPath "cocos-js") -Filter "_virtual_cc-*.js" -File | Select-Object -First 1
    if (-not $engineChunk) {
        throw "Cannot find Cocos engine chunk under $RootPath\\cocos-js."
    }

    $chunkContent = Get-Content -Path $engineChunk.FullName -Raw
    $originalFactory = 'e.createInstance=function(){return e._ins=new e,e._ins}'
    $patchedFactory = 'e.createInstance=function(){return e._ins={init:function(){return Promise.resolve([])},update:function(){},destroy:function(){},settings:{totalTime:0},_curTime:0,isFinished:!0},e._ins}'

    if ($chunkContent.Contains($originalFactory)) {
        $chunkContent = $chunkContent.Replace($originalFactory, $patchedFactory)
        Set-Content -Path $engineChunk.FullName -Value $chunkContent -NoNewline
    }
    elseif (-not $chunkContent.Contains($patchedFactory)) {
        throw "Failed to patch splash screen factory in $($engineChunk.FullName)."
    }
}

$sourcePath = Resolve-AbsolutePath -Path $BuildPath
$publishPath = Resolve-AbsolutePath -Path $PublishPath

$sourceIndexPath = Join-Path $sourcePath "index.html"
if (-not (Test-Path $sourceIndexPath)) {
    throw "Build output is missing $sourceIndexPath. Build the project in Cocos Creator before publishing."
}

Disable-CocosSplash -RootPath $sourcePath

New-Item -ItemType Directory -Path $publishPath -Force | Out-Null
Get-ChildItem -Path $publishPath -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $sourcePath "*") -Destination $publishPath -Recurse -Force

$publishIndexPath = Join-Path $publishPath "index.html"
if (-not (Test-Path $publishIndexPath)) {
    throw "Publish output is missing $publishIndexPath after copy."
}

$noJekyllPath = Join-Path $publishPath ".nojekyll"
Set-Content -Path $noJekyllPath -Value "" -NoNewline

$indexPath = Join-Path $publishPath "index.html"
$indexContent = Get-Content -Path $indexPath -Raw
$indexContent = $indexContent -replace "<title>[^<]+</title>", "<title>Fortress Demo</title>"
$indexContent = [System.Text.RegularExpressions.Regex]::Replace(
    $indexContent,
    "\s*<h1 class=""header"">.*?</h1>\s*",
    [Environment]::NewLine,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)
$indexContent = [System.Text.RegularExpressions.Regex]::Replace(
    $indexContent,
    "\s*<p class=""footer"">.*?</p>\s*",
    [Environment]::NewLine,
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)
Set-Content -Path $indexPath -Value $indexContent -NoNewline

Disable-CocosSplash -RootPath $publishPath

$nativeAssetRoot = Join-Path $publishPath "assets/main/native"
if (-not (Test-Path $nativeAssetRoot)) {
    throw "Published build is missing $nativeAssetRoot. Do not publish a partial copy of the build output."
}

Write-Host "Published web build to $publishPath"
Write-Host "Splash screen removed from published settings"
Write-Host "Commit docs/ after checking the result in a browser"
