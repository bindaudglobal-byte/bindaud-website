$files = @((Get-ChildItem -Path . -Filter *.html | ForEach-Object { $_.FullName }), (Get-ChildItem -Path .\pages -Filter *.html | ForEach-Object { $_.FullName }))
foreach ($file in $files) {
  $text = Get-Content -LiteralPath $file -Raw
  if ($text -notmatch '<head[^>]*>') { Write-Host "HEAD ISSUE $file" }
  if ($text -match '<head[^>]*>' -and $text -notmatch '</head>') { Write-Host "HEAD ISSUE $file" }
  $matches = [regex]::Matches($text, '(?:href|src)="([^"]+)"')
  foreach ($m in $matches) {
    $val = $m.Groups[1].Value
    if ($val -match '^(https?:|mailto:|tel:|javascript:|#)') { continue }
    if ($val.StartsWith('/')) { $target = $val.TrimStart('/') } else { $target = Join-Path (Split-Path $file -Parent) $val }
    $target = [System.IO.Path]::GetFullPath($target)
    if (-not (Test-Path -LiteralPath $target)) { Write-Host "BROKEN PATH $file -> $val => $target" }
  }
}
