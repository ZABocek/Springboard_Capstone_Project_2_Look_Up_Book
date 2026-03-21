$ErrorActionPreference = 'Stop'

$ts = [int][double]::Parse((Get-Date -UFormat %s))
$adminEmail = 'zabocek@gmail.com'
$adminPassword = 'TempAdminPass!123'
$adminUsername = 'zabocek_admin'

$adminRegisterBody = @{ email = $adminEmail; password = $adminPassword; username = $adminUsername } | ConvertTo-Json
$adminRegister = Invoke-RestMethod -Uri 'http://localhost:5000/admin/register' -Method Post -ContentType 'application/json' -Body $adminRegisterBody
"admin_register_id=$($adminRegister.adminId)"

$adminLoginBody = @{ username = $adminEmail; password = $adminPassword } | ConvertTo-Json
$adminLogin = Invoke-RestMethod -Uri 'http://localhost:5000/admin/login' -Method Post -ContentType 'application/json' -Body $adminLoginBody
$adminHeaders = @{ Authorization = "Bearer $($adminLogin.token)"; 'Content-Type' = 'application/json' }
"admin_login_id=$($adminLogin.adminId)"

$userName = "guided_user_$ts"
$userEmail = "guided_user_$ts@example.com"
$userSignupBody = @{ username = $userName; email = $userEmail; password = 'UserPass!123' } | ConvertTo-Json
$userSignup = Invoke-RestMethod -Uri 'http://localhost:5000/signup' -Method Post -ContentType 'application/json' -Body $userSignupBody
$userHeaders = @{ Authorization = "Bearer $($userSignup.token)"; 'Content-Type' = 'application/json' }
"user_signup_id=$($userSignup.userId)"

$title = "Guided Flow Book $ts"
$submitBody = @{ fullName = 'Guided Author'; givenName = 'Guided'; lastName = 'Author'; titleOfWinningBook = $title; prizeYear = 2024; prizeGenre = 'prose'; awardId = 1 } | ConvertTo-Json
$submitted = Invoke-RestMethod -Uri 'http://localhost:5000/api/submit-book' -Method Post -Headers $userHeaders -Body $submitBody
"submitted_book_id=$($submitted.id)"
"submitted_verified=$($submitted.verified)"
"submitted_role=$($submitted.role)"
"submitted_source=$($submitted.source)"

$pending = Invoke-RestMethod -Uri 'http://localhost:5000/api/unverified-books' -Headers $adminHeaders
$pendingMatch = $pending | Where-Object { $_.titleOfWinningBook -eq $title } | Select-Object -First 1
if (-not $pendingMatch) { throw 'Pending queue did not include submitted book.' }
"pending_match_id=$($pendingMatch.bookId)"

Invoke-RestMethod -Uri ("http://localhost:5000/api/books/{0}/verification" -f $pendingMatch.bookId) -Method Patch -Headers $adminHeaders -Body (@{ verified = $true } | ConvertTo-Json) | Out-Null
"verify_action=ok"

$searchRows = Invoke-RestMethod -Uri 'http://localhost:5000/api/search-books-award-winners'
$searchCount = ($searchRows | Where-Object { $_.clean_title -eq $title }).Count
"search_rows_found_after_verify=$searchCount"
if ($searchCount -lt 1) { throw 'Verified book not found in search-books endpoint.' }

$verifiedRows = Invoke-RestMethod -Uri 'http://localhost:5000/api/verified-submitted-books' -Headers $adminHeaders
$verifiedMatch = $verifiedRows | Where-Object { $_.bookId -eq $pendingMatch.bookId } | Select-Object -First 1
if (-not $verifiedMatch) { throw 'Verified submissions endpoint did not include verified book.' }
"verified_queue_match_id=$($verifiedMatch.bookId)"

Invoke-RestMethod -Uri ("http://localhost:5000/api/admin/books/{0}" -f $verifiedMatch.bookId) -Method Delete -Headers @{ Authorization = "Bearer $($adminLogin.token)" } | Out-Null
"admin_delete_action=ok"

$verifiedRowsAfterDelete = Invoke-RestMethod -Uri 'http://localhost:5000/api/verified-submitted-books' -Headers $adminHeaders
$verifiedAfterDeleteCount = ($verifiedRowsAfterDelete | Where-Object { $_.bookId -eq $verifiedMatch.bookId }).Count
"verified_rows_after_delete=$verifiedAfterDeleteCount"

$searchRowsAfterDelete = Invoke-RestMethod -Uri 'http://localhost:5000/api/search-books-award-winners'
$searchAfterDeleteCount = ($searchRowsAfterDelete | Where-Object { $_.clean_title -eq $title }).Count
"search_rows_after_delete=$searchAfterDeleteCount"

$cleanupJs = @'
require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query("DELETE FROM admins");
    console.log(`admins_deleted_after_guided_flow=${result.rowCount}`);
    const left = await client.query("SELECT COUNT(*)::int AS count FROM admins");
    console.log(`admins_remaining_after_guided_flow=${left.rows[0].count}`);
  } finally {
    client.release();
    await pool.end();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@
Set-Content -Path 'c:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\server\guided-admin-cleanup.js' -Value $cleanupJs
node 'c:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\server\guided-admin-cleanup.js'
Remove-Item 'c:\Users\zaboc\Springboard_Capstone_Project_2_Look_Up_Book-main\server\guided-admin-cleanup.js'

"guided_flow_complete=ok"
