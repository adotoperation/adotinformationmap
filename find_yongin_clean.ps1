$u = "https://docs.google.com/spreadsheets/d/1NCnmqHQ1kz0Fjay63LHdoCzXGYgwyUOhYm8cm3y6c9o/export?format=csv&gid=630627369"
$wc = New-Object System.Net.WebClient
$wc.Encoding = [System.Text.Encoding]::UTF8
$csv = $wc.DownloadString($u)
$lines = $csv.Split("`n")

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i].Contains("S090005170")) {
        Write-Host ("Row {0} => {1}" -f $i, $lines[$i].Trim())
    }
}
