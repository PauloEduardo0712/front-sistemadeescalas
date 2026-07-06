$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distPath = Join-Path $projectRoot "dist"
$targetPath = "C:\xampp\htdocs\sistema-shekinah"
$expectedRoot = "C:\xampp\htdocs"

npm run build

if (-not (Test-Path $distPath)) {
  throw "Build nao encontrado em $distPath"
}

$resolvedTargetParent = Resolve-Path (Split-Path $targetPath -Parent)
if ($resolvedTargetParent.Path -ne $expectedRoot) {
  throw "Destino inesperado: $targetPath"
}

if (Test-Path $targetPath) {
  Remove-Item -LiteralPath $targetPath -Recurse -Force
}

Copy-Item -LiteralPath $distPath -Destination $targetPath -Recurse -Force
Write-Host "Publicado em $targetPath"
Write-Host "Abra: http://localhost:8090/sistema-shekinah/"
