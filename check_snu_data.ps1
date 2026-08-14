$u = "https://docs.google.com/spreadsheets/d/1NCnmqHQ1kz0Fjay63LHdoCzXGYgwyUOhYm8cm3y6c9o/export?format=csv&gid=630627369"
$wc = New-Object System.Net.WebClient
$wc.Encoding = [System.Text.Encoding]::UTF8
$csv = $wc.DownloadString($u)
$lines = $csv.Split("`n")

Write-Host "Total Rows:" $lines.Count
Write-Host "Header:" $lines[0].Trim()

for ($i = 1; $i -lt [Math]::Min(15, $lines.Count); $i++) {
    if ($lines[$i].Trim()) {
        Write-Host "Row $i =>" $lines[$i].Trim()
    }
}
