param(
    [string] $User = 'Phi',
    [int] $Port = 5190
)

$php = 'C:\Program Files (x86)\PHP\php-8.5.10\php.exe'
$sandbox = 'C:\inetpub\wwwroot\hcms-sandbox'
$code = "echo app(App\Domain\Hotel\Actions\IssueSsoTicketAction::class)->execute(App\Models\User::where('username', '$User')->firstOrFail());"

Push-Location $sandbox
$ticket = (& $php artisan tinker --execute=$code | Select-Object -Last 1).Trim()
Pop-Location

if ($ticket -notmatch '^hcms-[0-9a-f]+$') { throw "No ticket for $User on the sandbox: $ticket" }

"http://localhost:$Port/?sso=$ticket"
