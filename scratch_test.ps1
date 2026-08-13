$u = 'https://docs.google.com/spreadsheets/d/1NCnmqHQ1kz0Fjay63LHdoCzXGYgwyUOhYm8cm3y6c9o/gviz/tq?tqx=out:csv&sheet=RDB_%ED%95%99%EC%9B%90%EC%A0%95%EB%B3%B4'
$wc = New-Object System.Net.WebClient
$wc.Encoding = [System.Text.Encoding]::UTF8
$r = $wc.DownloadString($u)
Out-File -InputObject $r -FilePath 'scratch_test.csv' -Encoding utf8
Get-Content 'scratch_test.csv' -Head 5
