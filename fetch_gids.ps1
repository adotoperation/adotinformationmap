$wc = New-Object System.Net.WebClient
$wc.Encoding = [System.Text.Encoding]::UTF8

$gids = @(
    "1034972515",
    "1376867691",
    "965359853",
    "361080156",
    "630627369",
    "1246810063",
    "1165046183",
    "211834294",
    "2014728794"
)

foreach ($g in $gids) {
    $u = "https://docs.google.com/spreadsheets/d/1NCnmqHQ1kz0Fjay63LHdoCzXGYgwyUOhYm8cm3y6c9o/export?format=csv&gid=" + $g
    try {
        $text = $wc.DownloadString($u)
        $firstLine = $text.Split("`n")[0].Trim()
        [Console]::WriteLine("GID $g => $firstLine")
    } catch {
        [Console]::WriteLine("GID $g => ERROR")
    }
}
