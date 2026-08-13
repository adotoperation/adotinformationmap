$u = 'https://docs.google.com/spreadsheets/d/1NCnmqHQ1kz0Fjay63LHdoCzXGYgwyUOhYm8cm3y6c9o/gviz/tq?tqx=out:csv&sheet=' + [System.Uri]::EscapeDataString('RDB_당년학교정보')
$wc = New-Object System.Net.WebClient
$wc.Encoding = [System.Text.Encoding]::UTF8
$r = $wc.DownloadString($u)
Out-File -InputObject $r -FilePath 'school_test.csv' -Encoding utf8
Get-Content 'school_test.csv' -Head 5
