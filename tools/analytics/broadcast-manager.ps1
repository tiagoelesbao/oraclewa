# Broadcast Manager PowerShell Script
# Para gerenciar o módulo broadcast da sua máquina Windows

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "menu"
)

# Configurações
$HETZNER_HOST = "evolution-imperio.opti.host"
$RAILWAY_URL = "https://oraclewa-imperio.up.railway.app"
$SSH_USER = "root"

# Cores
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"
$Blue = "Blue"

function Show-Header {
    Clear-Host
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
    Write-Host "║               🚀 BROADCAST MANAGER - IMPÉRIO              ║" -ForegroundColor $Cyan
    Write-Host "║                   Hetzner + Railway                       ║" -ForegroundColor $Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
    Write-Host ""
}

function Show-Menu {
    Show-Header
    Write-Host "📋 CONFIGURAÇÃO E SETUP:" -ForegroundColor $Yellow
    Write-Host "1.  📱 Criar nova instância broadcast (Hetzner)" -ForegroundColor $Green
    Write-Host "2.  🔍 Verificar status de conexão" -ForegroundColor $Green
    Write-Host "3.  📊 Ver instâncias ativas (Hetzner)" -ForegroundColor $Green
    Write-Host ""
    Write-Host "📝 PREPARAÇÃO DE DADOS:" -ForegroundColor $Yellow
    Write-Host "4.  📄 Gerar CSV de exemplo" -ForegroundColor $Green
    Write-Host "5.  ✅ Validar arquivo CSV" -ForegroundColor $Green
    Write-Host "6.  📤 Upload CSV para servidor" -ForegroundColor $Green
    Write-Host ""
    Write-Host "🧪 TESTES:" -ForegroundColor $Yellow
    Write-Host "7.  🔬 Teste com 1 número" -ForegroundColor $Green
    Write-Host "8.  🔬 Teste com 5 números" -ForegroundColor $Green
    Write-Host ""
    Write-Host "📨 BROADCAST EM MASSA:" -ForegroundColor $Yellow
    Write-Host "9.  🚀 Enviar broadcast via CSV" -ForegroundColor $Green
    Write-Host "10. 📈 Ver progresso do broadcast" -ForegroundColor $Green
    Write-Host ""
    Write-Host "🔧 MANUTENÇÃO:" -ForegroundColor $Yellow
    Write-Host "11. 📋 Ver logs Hetzner" -ForegroundColor $Green
    Write-Host "12. 🚂 Ver logs Railway" -ForegroundColor $Green
    Write-Host "13. 🔄 Reiniciar Evolution" -ForegroundColor $Green
    Write-Host "14. 🧹 Limpar arquivos temporários" -ForegroundColor $Green
    Write-Host ""
    Write-Host "0.  ❌ Sair" -ForegroundColor $Red
    Write-Host ""
}

function Setup-BroadcastInstance {
    Write-Host "🚀 Configurando nova instância broadcast..." -ForegroundColor $Yellow
    Write-Host ""
    
    Write-Host "⚠️  IMPORTANTE:" -ForegroundColor $Yellow
    Write-Host "- Use um WhatsApp DIFERENTE do sistema principal"
    Write-Host "- Mantenha o celular sempre conectado"
    Write-Host "- Anote o número usado para broadcast"
    Write-Host ""
    
    $confirm = Read-Host "Continuar? (s/n)"
    if ($confirm -ne "s") { return }
    
    Write-Host "Conectando ao Hetzner..." -ForegroundColor $Blue
    
    # Script para criar instância
    $script = @'
#!/bin/bash
EVOLUTION_API_KEY="SUA_EVOLUTION_API_KEY"
INSTANCE_NAME="broadcast-imperio-$(date +%Y%m%d)"
WEBHOOK_URL="https://oraclewa-imperio.up.railway.app/api/broadcast/webhook"

echo "Creating broadcast instance: $INSTANCE_NAME"

# Create instance
curl -X POST http://localhost:8080/instance/create \
  -H "Content-Type: application/json" \
  -H "apikey: $EVOLUTION_API_KEY" \
  -d '{
    "instanceName": "'$INSTANCE_NAME'",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

echo "Getting QR Code..."
sleep 3

# Get QR Code
curl -X GET http://localhost:8080/instance/connect/$INSTANCE_NAME \
  -H "apikey: $EVOLUTION_API_KEY" | jq -r '.qrcode' | qrencode -t ANSI

echo ""
echo "✅ Instance created: $INSTANCE_NAME"
echo "📱 Scan the QR Code with your broadcast WhatsApp"
'@
    
    # Salvar script temporário
    $tempScript = "$env:TEMP\setup_broadcast.sh"
    $script | Out-File -FilePath $tempScript -Encoding ASCII
    
    # Enviar e executar no servidor
    try {
        Write-Host "Enviando script para servidor..." -ForegroundColor $Blue
        scp $tempScript "${SSH_USER}@${HETZNER_HOST}:/tmp/setup_broadcast.sh"
        ssh "${SSH_USER}@${HETZNER_HOST}" "chmod +x /tmp/setup_broadcast.sh && /tmp/setup_broadcast.sh"
        
        Write-Host "✅ Instância criada com sucesso!" -ForegroundColor $Green
        Write-Host "📱 Escaneie o QR Code que apareceu no terminal" -ForegroundColor $Yellow
    }
    catch {
        Write-Host "❌ Erro ao criar instância: $_" -ForegroundColor $Red
    }
}

function Check-BroadcastStatus {
    Write-Host "🔍 Verificando status do broadcast..." -ForegroundColor $Yellow
    
    try {
        # Status Railway
        Write-Host "`n📊 Status Railway:" -ForegroundColor $Blue
        $railwayStatus = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/status" -Method Get -TimeoutSec 10
        
        if ($railwayStatus.success) {
            Write-Host "✅ Railway: Online" -ForegroundColor $Green
            
            if ($railwayStatus.status.available) {
                foreach ($provider in $railwayStatus.status.available) {
                    $statusIcon = if ($provider.status.connected) { "🟢" } else { "🔴" }
                    Write-Host "$statusIcon $($provider.name): $($provider.status.connected ? 'Conectado' : 'Desconectado')"
                    
                    if ($provider.provider -eq "evolution" -and $provider.status.totalInstances) {
                        Write-Host "   📊 Instâncias: $($provider.status.connectedInstances)/$($provider.status.totalInstances)"
                        Write-Host "   💚 Health: $($provider.status.healthPercentage)%"
                    }
                }
            }
        }
        
        # Status Hetzner
        Write-Host "`n🖥️  Status Hetzner (Evolution API):" -ForegroundColor $Blue
        $hetznerCmd = "curl -s http://localhost:8080/instance/list -H 'apikey: \$EVOLUTION_API_KEY' | jq '.instances[] | {name: .instance.instanceName, state: .instance.state}'"
        ssh "${SSH_USER}@${HETZNER_HOST}" $hetznerCmd 2>$null | ForEach-Object {
            if ($_ -match '"name".*"state"') {
                Write-Host "   $_"
            }
        }
        
    }
    catch {
        Write-Host "❌ Erro ao verificar status: $_" -ForegroundColor $Red
    }
}

function Show-ActiveInstances {
    Write-Host "📊 Verificando instâncias ativas no Hetzner..." -ForegroundColor $Yellow
    
    try {
        ssh "${SSH_USER}@${HETZNER_HOST}" "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep evolution"
        Write-Host ""
        ssh "${SSH_USER}@${HETZNER_HOST}" "curl -s http://localhost:8080/instance/list -H 'apikey: \$EVOLUTION_API_KEY' | jq '.instances[] | \"Instance: \" + .instance.instanceName + \" - State: \" + .instance.state'"
    }
    catch {
        Write-Host "❌ Erro ao listar instâncias: $_" -ForegroundColor $Red
    }
}

function Generate-SampleCSV {
    Write-Host "📄 Gerando CSV de exemplo..." -ForegroundColor $Yellow
    
    $count = Read-Host "Quantos registros? (padrão: 10)"
    if ([string]::IsNullOrEmpty($count)) { $count = "10" }
    
    # Gerar CSV local
    $desktop = [Environment]::GetFolderPath("Desktop")
    $filename = "broadcast_exemplo_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
    $filepath = Join-Path $desktop $filename
    
    # Conteúdo do CSV
    $csvHeader = "nome;telefone;email;valor;produto"
    $csvRows = @()
    
    $nomes = @("João Silva", "Maria Santos", "Pedro Costa", "Ana Oliveira", "Carlos Ferreira", "Lucia Alves", "Roberto Lima", "Fernanda Souza", "Marcos Pereira", "Juliana Rocha")
    $produtos = @("Sorteio Federal", "Mega Prêmio", "Super Sorte", "Prêmio Especial", "Sorte Grande")
    $ddds = @("11", "21", "31", "41", "51", "61", "71", "81", "91", "85")
    
    for ($i = 1; $i -le [int]$count; $i++) {
        $nome = $nomes | Get-Random
        $ddd = $ddds | Get-Random
        $numero = "9" + (Get-Random -Minimum 10000000 -Maximum 99999999)
        $telefone = $ddd + $numero
        $email = $nome.ToLower().Replace(" ", ".") + "@email.com"
        $valor = Get-Random -Minimum 10 -Maximum 500
        $produto = $produtos | Get-Random
        
        $csvRows += "$nome;$telefone;$email;$valor;$produto"
    }
    
    # Salvar arquivo
    $csvContent = $csvHeader + "`n" + ($csvRows -join "`n")
    $csvContent | Out-File -FilePath $filepath -Encoding UTF8
    
    Write-Host "✅ CSV gerado com sucesso!" -ForegroundColor $Green
    Write-Host "📁 Arquivo: $filepath" -ForegroundColor $Blue
    Write-Host "📊 Registros: $count"
    
    # Mostrar preview
    Write-Host "`n📋 Preview do arquivo:" -ForegroundColor $Yellow
    Get-Content $filepath | Select-Object -First 6 | ForEach-Object { Write-Host "   $_" }
    
    return $filepath
}

function Validate-CSV {
    Write-Host "✅ Validando arquivo CSV..." -ForegroundColor $Yellow
    
    # Seletor de arquivo
    Add-Type -AssemblyName System.Windows.Forms
    $openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $openFileDialog.Filter = "CSV Files (*.csv)|*.csv|Text Files (*.txt)|*.txt|All Files (*.*)|*.*"
    $openFileDialog.Title = "Selecione o arquivo CSV para validar"
    $openFileDialog.InitialDirectory = [Environment]::GetFolderPath("Desktop")
    
    if ($openFileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $csvPath = $openFileDialog.FileName
        Write-Host "📁 Arquivo selecionado: $csvPath" -ForegroundColor $Blue
        
        # Enviar para servidor temporariamente
        $tempPath = "/tmp/validate_" + (Get-Random) + ".csv"
        
        try {
            Write-Host "📤 Enviando arquivo para validação..." -ForegroundColor $Blue
            scp $csvPath "${SSH_USER}@${HETZNER_HOST}:$tempPath"
            
            # Validar via API Railway
            $body = @{
                csvPath = $tempPath
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/csv/validate" `
                -Method Post `
                -ContentType "application/json" `
                -Body $body `
                -TimeoutSec 30
            
            # Mostrar resultados
            Write-Host "`n📊 Resultado da Validação:" -ForegroundColor $Green
            Write-Host "Total de linhas: $($response.stats.totalRows)"
            Write-Host "Telefones válidos: $($response.stats.validPhones)" -ForegroundColor $Green
            Write-Host "Telefones inválidos: $($response.stats.invalidPhones)" -ForegroundColor $Red
            Write-Host "Duplicados: $($response.stats.duplicates)" -ForegroundColor $Yellow
            
            if ($response.invalid.Count -gt 0) {
                Write-Host "`n⚠️  Exemplos de números inválidos:" -ForegroundColor $Yellow
                $response.invalid | Select-Object -First 3 | ForEach-Object {
                    Write-Host "   ❌ $($_.phone) - $($_.reason)" -ForegroundColor $Red
                }
            }
            
            # Limpeza
            ssh "${SSH_USER}@${HETZNER_HOST}" "rm -f $tempPath"
            
            if ($response.stats.validPhones -gt 0) {
                Write-Host "`n✅ Arquivo pronto para broadcast!" -ForegroundColor $Green
                return $csvPath
            }
            
        }
        catch {
            Write-Host "❌ Erro na validação: $_" -ForegroundColor $Red
        }
    }
}

function Upload-CSVToServer {
    Write-Host "📤 Upload de CSV para servidor..." -ForegroundColor $Yellow
    
    # Seletor de arquivo
    Add-Type -AssemblyName System.Windows.Forms
    $openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $openFileDialog.Filter = "CSV Files (*.csv)|*.csv|Text Files (*.txt)|*.txt"
    $openFileDialog.Title = "Selecione o arquivo CSV para upload"
    $openFileDialog.InitialDirectory = [Environment]::GetFolderPath("Desktop")
    
    if ($openFileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $localPath = $openFileDialog.FileName
        $filename = [System.IO.Path]::GetFileName($localPath)
        $remotePath = "/tmp/broadcast_$filename"
        
        try {
            Write-Host "📤 Enviando $filename para servidor..." -ForegroundColor $Blue
            scp $localPath "${SSH_USER}@${HETZNER_HOST}:$remotePath"
            
            Write-Host "✅ Upload concluído!" -ForegroundColor $Green
            Write-Host "📁 Arquivo no servidor: $remotePath" -ForegroundColor $Blue
            
            return $remotePath
        }
        catch {
            Write-Host "❌ Erro no upload: $_" -ForegroundColor $Red
        }
    }
}

function Test-SingleNumber {
    Write-Host "🔬 Teste com 1 número..." -ForegroundColor $Yellow
    
    $phone = Read-Host "Digite o número (apenas números, com DDD)"
    $name = Read-Host "Nome do contato (opcional)"
    
    if ([string]::IsNullOrEmpty($name)) { $name = "Teste" }
    
    Write-Host "`n📋 Templates disponíveis:" -ForegroundColor $Blue
    Write-Host "1 - Promoção (padrão)"
    Write-Host "2 - Carrinho abandonado"
    Write-Host "3 - Convite VIP"
    Write-Host "4 - Lembrete de sorteio"
    
    $templateChoice = Read-Host "Escolha o template (1-4, padrão: 1)"
    if ([string]::IsNullOrEmpty($templateChoice)) { $templateChoice = "1" }
    
    $templates = @{
        "1" = "promotional_evolution"
        "2" = "abandoned_cart_evolution"
        "3" = "vip_invite_evolution"
        "4" = "contest_reminder_evolution"
    }
    
    $template = $templates[$templateChoice]
    if (-not $template) { $template = "promotional_evolution" }
    
    try {
        Write-Host "`n📨 Enviando mensagem teste..." -ForegroundColor $Blue
        
        $body = @{
            phones = @($phone)
            template = $template
            templateData = @{
                userName = $name
                availableQuotas = "150"
                promotionDetails = "🎯 Teste do sistema broadcast`n🔥 Desconto especial"
            }
            testMode = $true
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/csv/test" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 30
        
        if ($response.results[0].status -eq "sent") {
            Write-Host "✅ Mensagem enviada com sucesso!" -ForegroundColor $Green
            Write-Host "📱 ID: $($response.results[0].messageId)"
            Write-Host "🎨 Template usado: $template"
        }
        else {
            Write-Host "❌ Falha no envio: $($response.results[0].error)" -ForegroundColor $Red
        }
        
    }
    catch {
        Write-Host "❌ Erro no teste: $_" -ForegroundColor $Red
    }
}

function Test-MultipleNumbers {
    Write-Host "🔬 Teste com 5 números..." -ForegroundColor $Yellow
    
    $numbers = @()
    for ($i = 1; $i -le 5; $i++) {
        $number = Read-Host "Digite o número $i (ENTER para pular)"
        if (-not [string]::IsNullOrEmpty($number)) {
            $numbers += $number
        }
    }
    
    if ($numbers.Count -eq 0) {
        Write-Host "❌ Nenhum número fornecido!" -ForegroundColor $Red
        return
    }
    
    try {
        Write-Host "`n📨 Enviando para $($numbers.Count) números..." -ForegroundColor $Blue
        
        $body = @{
            phones = $numbers
            template = "promotional_evolution"
            templateData = @{
                userName = "Teste"
                availableQuotas = "150"
            }
            testMode = $true
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/csv/test" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 30
        
        Write-Host "📊 Resultados:" -ForegroundColor $Green
        foreach ($result in $response.results) {
            $icon = if ($result.status -eq "sent") { "✅" } else { "❌" }
            Write-Host "$icon $($result.phone) - $($result.status)"
        }
        
    }
    catch {
        Write-Host "❌ Erro no teste: $_" -ForegroundColor $Red
    }
}

function Send-CSVBroadcast {
    Write-Host "🚀 ENVIO DE BROADCAST EM MASSA" -ForegroundColor $Red
    Write-Host "=" * 50 -ForegroundColor $Red
    Write-Host "⚠️  ATENÇÃO: Este comando enviará mensagens para TODOS os números do CSV!" -ForegroundColor $Red
    Write-Host ""
    
    # Seletor de arquivo
    Add-Type -AssemblyName System.Windows.Forms
    $openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $openFileDialog.Filter = "CSV Files (*.csv)|*.csv"
    $openFileDialog.Title = "Selecione o CSV para BROADCAST COMPLETO"
    $openFileDialog.InitialDirectory = [Environment]::GetFolderPath("Desktop")
    
    if ($openFileDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        return
    }
    
    $csvPath = $openFileDialog.FileName
    $filename = [System.IO.Path]::GetFileName($csvPath)
    
    Write-Host "📁 Arquivo selecionado: $filename" -ForegroundColor $Blue
    
    # Configurações
    $batchSize = Read-Host "Tamanho do lote (padrão: 50, máx: 100)"
    if ([string]::IsNullOrEmpty($batchSize) -or [int]$batchSize -le 0) { $batchSize = "50" }
    if ([int]$batchSize -gt 100) { $batchSize = "100" }
    
    $delayMs = Read-Host "Delay entre lotes em ms (padrão: 5000, mín: 3000)"
    if ([string]::IsNullOrEmpty($delayMs) -or [int]$delayMs -lt 3000) { $delayMs = "5000" }
    
    # Confirmação de segurança
    Write-Host ""
    Write-Host "CONFIGURAÇÕES DO BROADCAST:" -ForegroundColor $Yellow
    Write-Host "📄 Arquivo: $filename"
    Write-Host "📦 Lote: $batchSize mensagens"
    Write-Host "⏱️  Delay: $delayMs ms"
    Write-Host ""
    Write-Host "🚨 ISSO ENVIARÁ MENSAGENS REAIS!" -ForegroundColor $Red
    
    $confirm1 = Read-Host "Digite 'ENTENDI' para continuar"
    if ($confirm1 -ne "ENTENDI") {
        Write-Host "Cancelado por segurança." -ForegroundColor $Yellow
        return
    }
    
    $confirm2 = Read-Host "Digite 'ENVIAR' para confirmar DEFINITIVAMENTE"
    if ($confirm2 -ne "ENVIAR") {
        Write-Host "Cancelado." -ForegroundColor $Yellow
        return
    }
    
    try {
        # Upload do arquivo
        $remotePath = "/tmp/broadcast_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".csv"
        Write-Host "`n📤 Enviando arquivo para servidor..." -ForegroundColor $Blue
        scp $csvPath "${SSH_USER}@${HETZNER_HOST}:$remotePath"
        
        # Processar broadcast
        Write-Host "🚀 Iniciando broadcast..." -ForegroundColor $Blue
        
        $body = @{
            csvPath = $remotePath
            template = "promotional_evolution"
            templateData = @{
                availableQuotas = "150"
                promotionDetails = "🎯 Oferta especial limitada!`n🔥 Aproveite agora!"
            }
            options = @{
                batchSize = [int]$batchSize
                delayMs = [int]$delayMs
                randomize = $false
            }
        } | ConvertTo-Json -Depth 10
        
        Write-Host "⏳ Processando... (isso pode demorar alguns minutos)" -ForegroundColor $Yellow
        
        $response = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/csv/process" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 600  # 10 minutos timeout
        
        # Resultados
        $summary = $response.summary
        
        Write-Host ""
        Write-Host "✅ BROADCAST CONCLUÍDO!" -ForegroundColor $Green
        Write-Host "=" * 40 -ForegroundColor $Green
        Write-Host "📊 Total de contatos: $($summary.totalContacts)"
        Write-Host "📨 Enviados: $($summary.sent)" -ForegroundColor $Green
        Write-Host "❌ Falhas: $($summary.failed)" -ForegroundColor $Red
        Write-Host "🚫 Inválidos: $($summary.invalid)" -ForegroundColor $Yellow
        Write-Host "🔄 Duplicados: $($summary.duplicates)" -ForegroundColor $Yellow
        Write-Host "⏱️  Duração: $([math]::Round($summary.duration / 1000)) segundos"
        Write-Host "📁 Resultados salvos: $($summary.resultsFile)" -ForegroundColor $Blue
        
        # Limpeza
        ssh "${SSH_USER}@${HETZNER_HOST}" "rm -f $remotePath"
        
        Write-Host "`n🎉 Broadcast finalizado com sucesso!" -ForegroundColor $Green
        
    }
    catch {
        Write-Host "❌ ERRO NO BROADCAST: $_" -ForegroundColor $Red
        Write-Host "Verifique logs e tente novamente." -ForegroundColor $Yellow
    }
}

function Show-BroadcastProgress {
    Write-Host "📈 Monitoramento de broadcast em tempo real..." -ForegroundColor $Yellow
    Write-Host "Pressione CTRL+C para parar"
    Write-Host ""
    
    try {
        # Logs em tempo real
        ssh "${SSH_USER}@${HETZNER_HOST}" "tail -f /var/log/evolution/app.log | grep -i broadcast"
    }
    catch {
        Write-Host "❌ Erro ao acessar logs: $_" -ForegroundColor $Red
    }
}

function View-HetznerLogs {
    Write-Host "📋 Visualizando logs do Hetzner..." -ForegroundColor $Yellow
    
    Write-Host "`n📊 Escolha o tipo de log:" -ForegroundColor $Blue
    Write-Host "1 - Evolution API (últimas 50 linhas)"
    Write-Host "2 - Evolution API (tempo real)"
    Write-Host "3 - Sistema (Docker)"
    Write-Host "4 - Broadcast específico"
    
    $choice = Read-Host "Opção (1-4)"
    
    try {
        switch ($choice) {
            "1" { 
                ssh "${SSH_USER}@${HETZNER_HOST}" "docker logs evolution-api --tail 50"
            }
            "2" { 
                Write-Host "Logs em tempo real (CTRL+C para sair):" -ForegroundColor $Yellow
                ssh "${SSH_USER}@${HETZNER_HOST}" "docker logs evolution-api -f"
            }
            "3" { 
                ssh "${SSH_USER}@${HETZNER_HOST}" "docker ps -a"
                ssh "${SSH_USER}@${HETZNER_HOST}" "docker stats --no-stream"
            }
            "4" { 
                ssh "${SSH_USER}@${HETZNER_HOST}" "docker logs evolution-api --tail 100 | grep -i broadcast"
            }
            default {
                ssh "${SSH_USER}@${HETZNER_HOST}" "docker logs evolution-api --tail 20"
            }
        }
    }
    catch {
        Write-Host "❌ Erro ao acessar logs: $_" -ForegroundColor $Red
    }
}

function View-RailwayLogs {
    Write-Host "🚂 Abrindo logs do Railway..." -ForegroundColor $Yellow
    
    # Tentar abrir URL dos logs do Railway
    $railwayLogsUrl = "https://railway.app/dashboard"  # Substitua pelo seu projeto específico
    
    try {
        Start-Process $railwayLogsUrl
        Write-Host "✅ Navegador aberto com logs do Railway" -ForegroundColor $Green
    }
    catch {
        Write-Host "❌ Erro ao abrir navegador. Acesse manualmente: $railwayLogsUrl" -ForegroundColor $Red
    }
    
    # Também mostrar status via API
    try {
        Write-Host "`n📊 Status via API:" -ForegroundColor $Blue
        $response = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/health" -TimeoutSec 10
        $response | ConvertTo-Json -Depth 5
    }
    catch {
        Write-Host "⚠️  API não respondeu: $_" -ForegroundColor $Yellow
    }
}

function Restart-Evolution {
    Write-Host "🔄 Reiniciando Evolution API no Hetzner..." -ForegroundColor $Yellow
    
    $confirm = Read-Host "Confirma o restart do Evolution? (s/n)"
    if ($confirm -ne "s") { return }
    
    try {
        Write-Host "Parando Evolution..." -ForegroundColor $Blue
        ssh "${SSH_USER}@${HETZNER_HOST}" "docker stop evolution-api"
        
        Write-Host "Iniciando Evolution..." -ForegroundColor $Blue
        ssh "${SSH_USER}@${HETZNER_HOST}" "docker start evolution-api"
        
        Write-Host "Aguardando inicialização..." -ForegroundColor $Blue
        Start-Sleep -Seconds 10
        
        Write-Host "Verificando status..." -ForegroundColor $Blue
        ssh "${SSH_USER}@${HETZNER_HOST}" "docker ps | grep evolution"
        
        Write-Host "✅ Evolution reiniciado!" -ForegroundColor $Green
        
    }
    catch {
        Write-Host "❌ Erro ao reiniciar Evolution: $_" -ForegroundColor $Red
    }
}

function Clean-TempFiles {
    Write-Host "🧹 Limpando arquivos temporários..." -ForegroundColor $Yellow
    
    try {
        # Limpar local
        Write-Host "Limpando arquivos locais..." -ForegroundColor $Blue
        $tempFiles = Get-ChildItem $env:TEMP -Filter "*broadcast*" -ErrorAction SilentlyContinue
        foreach ($file in $tempFiles) {
            Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
            Write-Host "🗑️  Removido: $($file.Name)"
        }
        
        # Limpar servidor
        Write-Host "Limpando arquivos do servidor..." -ForegroundColor $Blue
        ssh "${SSH_USER}@${HETZNER_HOST}" "rm -f /tmp/broadcast_* /tmp/validate_* /tmp/setup_*"
        
        Write-Host "✅ Limpeza concluída!" -ForegroundColor $Green
        
    }
    catch {
        Write-Host "❌ Erro na limpeza: $_" -ForegroundColor $Red
    }
}

function Wait-ForInput {
    Write-Host ""
    Write-Host "Pressione ENTER para continuar..." -ForegroundColor $Yellow
    Read-Host
}

# Main execution loop
do {
    Show-Menu
    $choice = Read-Host "Escolha uma opção (0-14)"
    
    switch ($choice) {
        "1" { Setup-BroadcastInstance; Wait-ForInput }
        "2" { Check-BroadcastStatus; Wait-ForInput }
        "3" { Show-ActiveInstances; Wait-ForInput }
        "4" { Generate-SampleCSV; Wait-ForInput }
        "5" { Validate-CSV; Wait-ForInput }
        "6" { Upload-CSVToServer; Wait-ForInput }
        "7" { Test-SingleNumber; Wait-ForInput }
        "8" { Test-MultipleNumbers; Wait-ForInput }
        "9" { Send-CSVBroadcast; Wait-ForInput }
        "10" { Show-BroadcastProgress; Wait-ForInput }
        "11" { View-HetznerLogs; Wait-ForInput }
        "12" { View-RailwayLogs; Wait-ForInput }
        "13" { Restart-Evolution; Wait-ForInput }
        "14" { Clean-TempFiles; Wait-ForInput }
        "0" { break }
        default { 
            Write-Host "❌ Opção inválida!" -ForegroundColor $Red
            Wait-ForInput
        }
    }
} while ($choice -ne "0")

Write-Host "`n✅ Broadcast Manager encerrado!" -ForegroundColor $Green
Write-Host "🚀 Obrigado por usar o sistema!" -ForegroundColor $Cyan