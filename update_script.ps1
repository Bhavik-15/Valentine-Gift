$eng = @(Get-ChildItem '.\Engagement' -File | Select-Object -ExpandProperty Name)
$kan = @(Get-ChildItem '.\Kanku Pagla' -File | Select-Object -ExpandProperty Name)
$engJson = if ($eng.Count -gt 0) { $eng | ConvertTo-Json -Compress } else { '[]' }
$kanJson = if ($kan.Count -gt 0) { $kan | ConvertTo-Json -Compress } else { '[]' }
$content = "const engagementPhotos = $engJson; const kankuPhotos = $kanJson;"
Set-Content -Path '.\data.js' -Value $content -Encoding UTF8
