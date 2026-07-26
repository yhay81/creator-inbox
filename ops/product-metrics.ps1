[CmdletBinding()]
param(
    [switch]$Local
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SqlPath = Join-Path $PSScriptRoot "product-metrics.sql"
$Wrangler = Join-Path $RepoRoot "node_modules\.bin\wrangler.cmd"
$Target = if ($Local) { "--local" } else { "--remote" }
$Sql = (Get-Content $SqlPath) -join " "

$Output = & $Wrangler d1 execute creator-inbox $Target --json --command $Sql
if ($LASTEXITCODE -ne 0) {
    throw "D1 metrics query failed with exit code $LASTEXITCODE"
}

$Payload = ($Output -join [Environment]::NewLine) | ConvertFrom-Json
$Row = $Payload[0].results[0]
if (-not $Row) {
    throw "D1 metrics query returned no result"
}

function Get-Percent {
    param(
        [int]$Numerator,
        [int]$Denominator
    )

    if ($Denominator -eq 0) { return 0.0 }
    return [Math]::Round(($Numerator / $Denominator) * 100, 1)
}

$Users = [int]$Row.users
$ActivatedOwners = [int]$Row.activated_owners
$ReceivingOwners = [int]$Row.receiving_owners
$SuccessfulOwners = [int]$Row.successful_owners

[ordered]@{
    generated_at = (Get-Date).ToUniversalTime().ToString("o")
    service = "creator-inbox"
    environment = if ($Local) { "local" } else { "production" }
    funnel = [ordered]@{
        users = $Users
        activated_owners = $ActivatedOwners
        receiving_owners = $ReceivingOwners
        successful_owners = $SuccessfulOwners
        messages = [int]$Row.messages
        repeat_inboxes = [int]$Row.repeat_inboxes
        signups_7d = [int]$Row.signups_7d
        messages_7d = [int]$Row.messages_7d
    }
    rates = [ordered]@{
        signup_to_inbox_percent = Get-Percent $ActivatedOwners $Users
        inbox_to_receive_percent = Get-Percent $ReceivingOwners $ActivatedOwners
        receive_to_open_percent = Get-Percent $SuccessfulOwners $ReceivingOwners
    }
} | ConvertTo-Json -Depth 4
