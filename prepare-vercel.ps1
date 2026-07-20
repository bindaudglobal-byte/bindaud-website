$src = 'c:\Users\qalan\Downloads\BINDAUD'
$dest = 'c:\Users\qalan\Downloads\BINDAUD\bindaud-frontend'

New-Item -ItemType Directory -Path $dest -Force | Out-Null

Copy-Item -Path (Join-Path $src 'index.html') -Destination $dest -Force
Copy-Item -Path (Join-Path $src 'about.html') -Destination $dest -Force
Copy-Item -Path (Join-Path $src 'cookies.html') -Destination $dest -Force
Copy-Item -Path (Join-Path $src 'privacy.html') -Destination $dest -Force
Copy-Item -Path (Join-Path $src 'terms.html') -Destination $dest -Force
Copy-Item -Path (Join-Path $src 'thank-you.html') -Destination $dest -Force

Copy-Item -Path (Join-Path $src 'css') -Destination $dest -Recurse -Force
Copy-Item -Path (Join-Path $src 'js') -Destination $dest -Recurse -Force
Copy-Item -Path (Join-Path $src 'pages') -Destination $dest -Recurse -Force
Copy-Item -Path (Join-Path $src 'assets') -Destination $dest -Recurse -Force

Set-Content -Path (Join-Path $dest '.gitignore') -Value @"
.DS_Store
.vscode/
.vercel/
node_modules/
*.log
"@

Set-Content -Path (Join-Path $dest 'vercel.json') -Value @"
{
  \"version\": 2,
  \"routes\": [
    { \"src\": \"/(.*)\", \"dest\": \"/$1\" }
  ]
}
"@

Write-Host 'Prepared deployment folder:' $dest
Get-ChildItem -Path $dest | Select-Object Name,Mode | Format-Table -AutoSize
