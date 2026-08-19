$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Start()
Write-Host "Server running on http://localhost:8080/"

# GID 630627369 : RDB_당년학교정보 (학교 정보)
$googleSchoolCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=630627369"

# GID 1376867691 : RDB_학원정보 (지번 학원 정보)
$googleAcademyCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=1376867691"

# GID 211834294 : RDB_지점좌표 (지점 정보)
$googleBranchCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=211834294"

# GID 642130592 : RDB_아파트세대수 (아파트 정보)
$googleApartmentCsvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS5c-_UFAXHCib1iGRSnviv0PFCVKRtapJHMVbcV6sbFLVIkWQIy103SjP8B-HRhGDsRwxCvvx4IRhW/pub?output=csv&gid=642130592"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    
    $localPath = $req.Url.LocalPath.TrimStart('/')

    # 학교 데이터 (/api/data)
    if ($localPath.StartsWith("api/data")) {
        $res.ContentType = "text/csv; charset=utf-8"
        try {
            $webClient = New-Object System.Net.WebClient
            $webClient.Encoding = [System.Text.Encoding]::UTF8
            $csvText = $webClient.DownloadString($googleSchoolCsvUrl)
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($csvText)
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $res.StatusCode = 500
        } finally {
            $res.Close()
        }
        continue
    }

    # 학원 데이터 (/api/academy_data)
    if ($localPath.StartsWith("api/academy_data")) {
        $res.ContentType = "text/csv; charset=utf-8"
        try {
            $webClient = New-Object System.Net.WebClient
            $webClient.Encoding = [System.Text.Encoding]::UTF8
            $csvText = $webClient.DownloadString($googleAcademyCsvUrl)
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($csvText)
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $res.StatusCode = 500
        } finally {
            $res.Close()
        }
        continue
    }

    # 지점 데이터 (/api/branch_data)
    if ($localPath.StartsWith("api/branch_data")) {
        $res.ContentType = "text/csv; charset=utf-8"
        try {
            $webClient = New-Object System.Net.WebClient
            $webClient.Encoding = [System.Text.Encoding]::UTF8
            $csvText = $webClient.DownloadString($googleBranchCsvUrl)
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($csvText)
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $res.StatusCode = 500
        } finally {
            $res.Close()
        }
        continue
    }

    # 아파트 데이터 (/api/apartment_data)
    if ($localPath.StartsWith("api/apartment_data")) {
        $res.ContentType = "text/csv; charset=utf-8"
        try {
            $webClient = New-Object System.Net.WebClient
            $webClient.Encoding = [System.Text.Encoding]::UTF8
            $csvText = $webClient.DownloadString($googleApartmentCsvUrl)
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($csvText)
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } catch {
            $res.StatusCode = 500
        } finally {
            $res.Close()
        }
        continue
    }

    if ([string]::IsNullOrWhiteSpace($localPath)) {
        $localPath = "index.html"
    }
    
    $filePath = Join-Path (Get-Location) $localPath
    if (-not (Test-Path $filePath -PathType Leaf)) {
        $filePath = Join-Path (Get-Location) "index.html"
    }
    
    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
    if ($ext -eq ".html") { $res.ContentType = "text/html; charset=utf-8" }
    elseif ($ext -eq ".css") { $res.ContentType = "text/css; charset=utf-8" }
    elseif ($ext -eq ".js") { $res.ContentType = "text/javascript; charset=utf-8" }
    else { $res.ContentType = "application/octet-stream" }

    try {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
        $res.StatusCode = 500
    } finally {
        $res.Close()
    }
}
