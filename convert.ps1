param(
  [string]$inputPath,
  [string]$outputPath
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($inputPath)
$doc.SaveAs($outputPath, 17)  # 17 = PDF format
$doc.Close()
$word.Quit()
