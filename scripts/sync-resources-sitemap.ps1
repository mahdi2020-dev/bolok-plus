# Sync published catalog item URLs into bolok_plus/sitemap-resources.xml
# Run before deploying the static site (or after publishing new books).
$ErrorActionPreference = "Stop"
$ApiBase = if ($env:BOLOK_API_BASE) { $env:BOLOK_API_BASE.TrimEnd("/") } else { "https://iraniplanner.ir" }
$SiteBase = if ($env:BOLOK_PUBLIC_SITE_URL) { $env:BOLOK_PUBLIC_SITE_URL.TrimEnd("/") } else { "https://bolokapp.ir" }
$OutFile = Join-Path $PSScriptRoot "..\sitemap-resources.xml"

Write-Host "Fetching sitemap from $ApiBase/api/site/catalog/sitemap.xml ..."
try {
  $xml = Invoke-WebRequest -Uri "$ApiBase/api/site/catalog/sitemap.xml" -UseBasicParsing
  $xml.Content | Set-Content -Path $OutFile -Encoding utf8
  Write-Host "Wrote $OutFile from API sitemap."
  exit 0
} catch {
  Write-Host "API sitemap unavailable ($($_.Exception.Message)); falling back to search pagination."
}

$offset = 0
$urls = New-Object System.Collections.Generic.List[string]
do {
  $data = Invoke-RestMethod -Uri "$ApiBase/api/site/catalog/search?limit=100&offset=$offset"
  foreach ($it in @($data.items)) {
    if (-not $it.id) { continue }
    $id = [uri]::EscapeDataString([string]$it.id)
    $loc = "$SiteBase/resources/item.html?id=$id"
    $urls.Add($loc)
  }
  $count = @($data.items).Count
  $offset += $count
  $more = [bool]$data.has_more -and $count -gt 0
} while ($more -and $offset -lt 5000)

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$sb.AppendLine('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
[void]$sb.AppendLine("  <url><loc>$SiteBase/resources/</loc><changefreq>daily</changefreq><priority>0.9</priority></url>")
[void]$sb.AppendLine("  <url><loc>$SiteBase/resources/book.html</loc><changefreq>daily</changefreq><priority>0.85</priority></url>")
$today = Get-Date -Format "yyyy-MM-dd"
foreach ($loc in $urls) {
  [void]$sb.AppendLine("  <url><loc>$loc</loc><lastmod>$today</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>")
}
[void]$sb.AppendLine("</urlset>")
$sb.ToString() | Set-Content -Path $OutFile -Encoding utf8
Write-Host "Wrote $($urls.Count) item URLs to $OutFile"
