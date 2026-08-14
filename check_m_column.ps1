$u = "https://docs.google.com/spreadsheets/d/1NCnmqHQ1kz0Fjay63LHdoCzXGYgwyUOhYm8cm3y6c9o/export?format=csv&gid=630627369"
$wc = New-Object System.Net.WebClient
$wc.Encoding = [System.Text.Encoding]::UTF8
$csv = $wc.DownloadString($u)
$lines = $csv.Split("`n")

Write-Host "Header:" $lines[0].Trim()
if ($lines.Count -gt 1) { Write-Host "SubHeader:" $lines[1].Trim() }
if ($lines.Count -gt 2) { Write-Host "Row 2:" $lines[2].Trim() }

for ($i = 3; $i -lt [Math]::Min(15, $lines.Count); $i++) {
    if ($lines[$i].Trim()) {
        $cols = $lines[$i].Split(",")
        Write-Host ("Row {0} : Name={1}, ColL(11)={2}, ColM(12)={3}" -f $i, $cols[2], $cols[11], $cols[12])
    }
}
