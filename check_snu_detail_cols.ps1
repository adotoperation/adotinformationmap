$u = "https://docs.google.com/spreadsheets/d/1NCnmqHQ1kz0Fjay63LHdoCzXGYgwyUOhYm8cm3y6c9o/export?format=csv&gid=630627369"
$wc = New-Object System.Net.WebClient
$wc.Encoding = [System.Text.Encoding]::UTF8
$csv = $wc.DownloadString($u)
$lines = $csv.Split("`n")

$header0 = $lines[0].Split(",")
$header1 = $lines[1].Split(",")

for ($c = 0; $c -lt [Math]::Max($header0.Count, $header1.Count); $c++) {
    $val0 = if ($c -lt $header0.Count) { $header0[$c].Trim('"').Trim() } else { "" }
    $val1 = if ($c -lt $header1.Count) { $header1[$c].Trim('"').Trim() } else { "" }
    Write-Host ("Col {0} (Letter {1}): [{2}] / [{3}]" -f $c, [char](65 + $c), $val0, $val1)
}

Write-Host "--- Search for non-empty row 8 ---"
$r8 = $lines[7].Split(",")
for ($c = 0; $c -lt $r8.Count; $c++) {
    Write-Host ("Col {0} (Letter {1}): {2}" -f $c, [char](65 + $c), $r8[$c].Trim('"').Trim())
}
