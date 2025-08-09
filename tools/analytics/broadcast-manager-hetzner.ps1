# Broadcast Manager - Específico para VPS Hetzner 128.140.7.154
# Adaptado para o ambiente real do Império

param(
    [Parameter(Mandatory=$false)]
    [string]$Action = "menu"
)

# Configurações específicas do seu ambiente
$HETZNER_IP = "128.140.7.154"
$HETZNER_USER = "root"
$HETZNER_PASS = "KtwppRMpJfi3"
$HETZNER_PATH = "/opt/whatsapp-imperio"
$RAILWAY_URL = "https://oraclewa-imperio.up.railway.app"

# Cores
$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"
$Blue = "Blue"

function Show-Header {
    Clear-Host
    Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor $Cyan
    Write-Host "║          🏆 BROADCAST MANAGER - IMPÉRIO PREMIAÇÕES       ║" -ForegroundColor $Cyan
    Write-Host "║                VPS: 128.140.7.154                        ║" -ForegroundColor $Cyan
    Write-Host "║             /opt/whatsapp-imperio                        ║" -ForegroundColor $Cyan
    Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor $Cyan
    Write-Host ""
}

function Show-Menu {
    Show-Header
    
    Write-Host "🔧 CONFIGURAÇÃO INICIAL:" -ForegroundColor $Yellow
    Write-Host "1.  📱 Criar instância broadcast na VPS" -ForegroundColor $Green
    Write-Host "2.  🔍 Verificar containers Evolution" -ForegroundColor $Green
    Write-Host "3.  📊 Status de todas as instâncias" -ForegroundColor $Green
    Write-Host "4.  🚂 Configurar variáveis Railway" -ForegroundColor $Green
    Write-Host ""
    
    Write-Host "📝 PREPARAÇÃO DE DADOS:" -ForegroundColor $Yellow
    Write-Host "5.  📄 Gerar CSV de exemplo" -ForegroundColor $Green
    Write-Host "6.  ✅ Validar arquivo CSV" -ForegroundColor $Green
    Write-Host "7.  📤 Upload CSV para VPS" -ForegroundColor $Green
    Write-Host ""
    
    Write-Host "🧪 TESTES DE BROADCAST:" -ForegroundColor $Yellow
    Write-Host "8.  🔬 Teste rápido (1 número)" -ForegroundColor $Green
    Write-Host "9.  🔬 Teste pequeno (5 números)" -ForegroundColor $Green
    Write-Host "10. ✅ Validar conexão broadcast" -ForegroundColor $Green
    Write-Host ""
    
    Write-Host "📨 BROADCAST EM MASSA:" -ForegroundColor $Yellow
    Write-Host "11. 🚀 Executar broadcast completo" -ForegroundColor $Green
    Write-Host "12. 📈 Monitorar progresso em tempo real" -ForegroundColor $Green
    Write-Host ""
    
    Write-Host "🔧 MANUTENÇÃO VPS:" -ForegroundColor $Yellow
    Write-Host "13. 📋 Ver logs Evolution (docker logs)" -ForegroundColor $Green
    Write-Host "14. 🔄 Reiniciar containers Evolution" -ForegroundColor $Green
    Write-Host "15. 🧹 Limpar arquivos temporários" -ForegroundColor $Green
    Write-Host "16. 📊 Status sistema VPS" -ForegroundColor $Green
    Write-Host ""
    
    Write-Host "0.  ❌ Sair" -ForegroundColor $Red
    Write-Host ""
}

function Execute-SSHCommand {
    param(
        [string]$Command,
        [string]$Description = "Executando comando SSH"
    )
    
    Write-Host "$Description..." -ForegroundColor $Blue
    
    try {
        # Para Windows, usar plink ou ssh nativo
        $result = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${HETZNER_USER}@${HETZNER_IP}" $Command
        return $result
    }
    catch {
        Write-Host "❌ Erro SSH: $_" -ForegroundColor $Red
        return $null
    }
}

function Setup-BroadcastInstance {
    Write-Host "📱 CRIAR NOVA INSTÂNCIA BROADCAST" -ForegroundColor $Yellow
    Write-Host "=================================" -ForegroundColor $Yellow
    Write-Host ""
    
    Write-Host "⚠️  IMPORTANTE:" -ForegroundColor $Yellow
    Write-Host "- Esta operação será executada na VPS ${HETZNER_IP}"
    Write-Host "- Será criada uma nova instância Evolution para broadcast"
    Write-Host "- Use um WhatsApp DIFERENTE do sistema principal"
    Write-Host "- Mantenha o WhatsApp sempre conectado"
    Write-Host ""
    
    $confirm = Read-Host "Continuar com a criação? (s/n)"
    if ($confirm -ne "s") { return }
    
    Write-Host "`n🔄 Enviando script de setup para VPS..." -ForegroundColor $Blue
    
    # Enviar script de setup para VPS
    try {
        scp "scripts\broadcast-hetzner-setup.sh" "${HETZNER_USER}@${HETZNER_IP}:/tmp/"
        
        Write-Host "🚀 Executando setup na VPS..." -ForegroundColor $Blue
        
        # Executar script na VPS
        $setupResult = Execute-SSHCommand "cd $HETZNER_PATH && chmod +x /tmp/broadcast-hetzner-setup.sh && /tmp/broadcast-hetzner-setup.sh" "Setup de instância broadcast"
        
        if ($setupResult) {
            Write-Host $setupResult
            Write-Host ""
            Write-Host "✅ Setup executado!" -ForegroundColor $Green
            Write-Host "📱 Verifique o QR Code acima e escaneie com o WhatsApp dedicado" -ForegroundColor $Yellow
        }
        
    }
    catch {
        Write-Host "❌ Erro no setup: $_" -ForegroundColor $Red
    }
}

function Check-EvolutionContainers {
    Write-Host "🔍 VERIFICANDO CONTAINERS EVOLUTION" -ForegroundColor $Yellow
    Write-Host "===================================" -ForegroundColor $Yellow
    Write-Host ""
    
    # Ver containers Docker
    Write-Host "🐳 Containers Docker:" -ForegroundColor $Blue
    $containers = Execute-SSHCommand "cd $HETZNER_PATH && docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep evolution" "Listando containers"
    
    if ($containers) {
        $containers | ForEach-Object { Write-Host "   $_" }
    } else {
        Write-Host "❌ Nenhum container Evolution encontrado" -ForegroundColor $Red
    }
    
    Write-Host ""
    
    # Ver logs do docker-compose
    Write-Host "📋 Logs recentes:" -ForegroundColor $Blue
    $logs = Execute-SSHCommand "cd $HETZNER_PATH && docker-compose logs --tail=10 2>/dev/null || docker compose logs --tail=10" "Verificando logs"
    
    if ($logs) {
        $logs | Select-Object -Last 10 | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    }
}

function Check-AllInstances {
    Write-Host "📊 STATUS DE TODAS AS INSTÂNCIAS" -ForegroundColor $Yellow
    Write-Host "================================" -ForegroundColor $Yellow
    Write-Host ""
    
    # Verificar instâncias nas portas padrão
    $ports = @("8081", "8082", "8083", "8084")
    
    foreach ($port in $ports) {
        Write-Host "🔍 Testando porta ${port}:" -ForegroundColor $Blue
        
        $testCommand = "curl -s --connect-timeout 5 http://localhost:${port}/instance/list -H 'apikey: `$EVOLUTION_API_KEY' | jq -r '.instances[]?.instance.instanceName' 2>/dev/null || echo 'Erro ou sem resposta'"
        $instances = Execute-SSHCommand $testCommand "Testando porta $port"
        
        if ($instances -and $instances -ne "Erro ou sem resposta") {
            Write-Host "   ✅ Porta $port: Ativa" -ForegroundColor $Green
            $instances | ForEach-Object { 
                if ($_ -ne "") {
                    Write-Host "      📱 $_" -ForegroundColor $Cyan
                }
            }
        } else {
            Write-Host "   ❌ Porta $port: Não responde" -ForegroundColor $Red
        }
    }
    
    Write-Host ""
    
    # Status do Railway
    Write-Host "🚂 Status Railway:" -ForegroundColor $Blue
    try {
        $railwayStatus = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/health" -Method Get -TimeoutSec 10
        Write-Host "   ✅ Railway: Online" -ForegroundColor $Green
        Write-Host "   📊 Módulo: $($railwayStatus.module)"
        Write-Host "   📅 Timestamp: $($railwayStatus.timestamp)"
    }
    catch {
        Write-Host "   ❌ Railway: Não responde" -ForegroundColor $Red
    }
}

function Configure-RailwayVariables {
    Write-Host "🚂 CONFIGURAR VARIÁVEIS RAILWAY" -ForegroundColor $Yellow
    Write-Host "===============================" -ForegroundColor $Yellow
    Write-Host ""
    
    Write-Host "📋 Variáveis necessárias para o Railway:" -ForegroundColor $Blue
    Write-Host ""
    
    # Detectar instância broadcast ativa
    Write-Host "🔍 Detectando instância broadcast na VPS..." -ForegroundColor $Blue
    
    $detectCommand = @"
cd $HETZNER_PATH
for port in 8081 8082 8083 8084; do
    instances=`$(curl -s http://localhost:`$port/instance/list -H "apikey: `$EVOLUTION_API_KEY" 2>/dev/null | jq -r '.instances[]? | select(.instance.instanceName | contains("broadcast")) | .instance.instanceName' 2>/dev/null)
    if [ ! -z "`$instances" ]; then
        echo "PORT:`$port"
        echo "INSTANCES:`$instances"
        break
    fi
done
"@
    
    $detectResult = Execute-SSHCommand $detectCommand "Detectando broadcast"
    
    $broadcastPort = "8081"  # padrão
    $broadcastInstance = "broadcast-imperio"  # padrão
    
    if ($detectResult) {
        $lines = $detectResult -split "`n"
        foreach ($line in $lines) {
            if ($line.StartsWith("PORT:")) {
                $broadcastPort = $line.Split(":")[1]
            }
            if ($line.StartsWith("INSTANCES:")) {
                $broadcastInstance = $line.Split(":")[1].Trim()
            }
        }
    }
    
    Write-Host "🎯 Instância detectada: $broadcastInstance (porta $broadcastPort)" -ForegroundColor $Green
    Write-Host ""
    
    # Mostrar variáveis
    Write-Host "📋 COPIE ESTAS VARIÁVEIS PARA O RAILWAY:" -ForegroundColor $Yellow
    Write-Host "=======================================" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "BROADCAST_MODULE_ENABLED=true" -ForegroundColor $Cyan
    Write-Host "DEFAULT_BROADCAST_PROVIDER=evolution" -ForegroundColor $Cyan
    Write-Host "EVOLUTION_API_URL=http://${HETZNER_IP}:${broadcastPort}" -ForegroundColor $Cyan
    Write-Host "EVOLUTION_BROADCAST_INSTANCE_1=${broadcastInstance}" -ForegroundColor $Cyan
    Write-Host ""
    Write-Host "🔑 EVOLUTION_API_KEY=<sua-chave-evolution>" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "💡 Passos no Railway:" -ForegroundColor $Blue
    Write-Host "1. Acesse o dashboard do Railway"
    Write-Host "2. Vá em Variables"
    Write-Host "3. Adicione as variáveis acima"
    Write-Host "4. Aguarde o redeploy automático"
    Write-Host ""
    
    $openRailway = Read-Host "Abrir Railway no navegador? (s/n)"
    if ($openRailway -eq "s") {
        Start-Process "https://railway.app/dashboard"
    }
}

function Generate-SampleCSV {
    Write-Host "📄 GERAR CSV DE EXEMPLO" -ForegroundColor $Yellow
    Write-Host "=======================" -ForegroundColor $Yellow
    Write-Host ""
    
    $count = Read-Host "Quantos registros? (padrão: 20)"
    if ([string]::IsNullOrEmpty($count)) { $count = "20" }
    
    # Gerar CSV local
    $desktop = [Environment]::GetFolderPath("Desktop")
    $filename = "broadcast_imperio_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
    $filepath = Join-Path $desktop $filename
    
    # Dados específicos do Império
    $nomes = @(
        "João Silva", "Maria Santos", "Pedro Oliveira", "Ana Costa", "Carlos Ferreira",
        "Lucia Almeida", "Roberto Lima", "Fernanda Souza", "Marcos Pereira", "Juliana Rocha",
        "Antonio Ribeiro", "Patricia Alves", "Ricardo Monteiro", "Sandra Nunes", "Felipe Cardoso",
        "Camila Torres", "Daniel Castro", "Renata Barbosa", "Eduardo Ramos", "Cristina Dias"
    )
    
    $produtos = @(
        "Sorteio Federal Império", 
        "Mega Prêmio R$ 170.000", 
        "Super Sorte Império", 
        "Prêmio Especial Federal",
        "Sorteio Relâmpago"
    )
    
    $ddds = @("11", "21", "31", "41", "51", "61", "71", "81", "91", "85", "47", "48", "27", "62", "84")
    
    # Cabeçalho
    $csvHeader = "nome;telefone;email;valor;produto"
    $csvRows = @()
    
    for ($i = 1; $i -le [int]$count; $i++) {
        $nome = $nomes | Get-Random
        $ddd = $ddds | Get-Random
        $numero = "9" + (Get-Random -Minimum 10000000 -Maximum 99999999)
        $telefone = $ddd + $numero
        $email = $nome.ToLower().Replace(" ", ".") + "@email.com"
        $valor = Get-Random -Minimum 25 -Maximum 200  # Valores realistas
        $produto = $produtos | Get-Random
        
        $csvRows += "$nome;$telefone;$email;$valor;$produto"
    }
    
    # Salvar arquivo
    $csvContent = $csvHeader + "`n" + ($csvRows -join "`n")
    $csvContent | Out-File -FilePath $filepath -Encoding UTF8
    
    Write-Host "✅ CSV gerado com sucesso!" -ForegroundColor $Green
    Write-Host "📁 Arquivo: $filepath" -ForegroundColor $Blue
    Write-Host "📊 Registros: $count"
    Write-Host ""
    
    # Mostrar preview
    Write-Host "📋 Preview (primeiras 5 linhas):" -ForegroundColor $Yellow
    Get-Content $filepath | Select-Object -First 6 | ForEach-Object { Write-Host "   $_" -ForegroundColor $Cyan }
    
    Write-Host ""
    Write-Host "💡 Este arquivo está pronto para ser usado no broadcast!" -ForegroundColor $Green
    
    return $filepath
}

function Validate-CSV {
    Write-Host "✅ VALIDAR ARQUIVO CSV" -ForegroundColor $Yellow
    Write-Host "======================" -ForegroundColor $Yellow
    Write-Host ""
    
    # Seletor de arquivo
    Add-Type -AssemblyName System.Windows.Forms
    $openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $openFileDialog.Filter = "CSV Files (*.csv)|*.csv|Text Files (*.txt)|*.txt|All Files (*.*)|*.*"
    $openFileDialog.Title = "Selecione o arquivo CSV para validar"
    $openFileDialog.InitialDirectory = [Environment]::GetFolderPath("Desktop")
    
    if ($openFileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        $csvPath = $openFileDialog.FileName
        Write-Host "📁 Arquivo selecionado: $([System.IO.Path]::GetFileName($csvPath))" -ForegroundColor $Blue
        
        # Upload para VPS
        $remotePath = "/tmp/validate_$(Get-Random).csv"
        
        try {
            Write-Host "📤 Enviando arquivo para VPS..." -ForegroundColor $Blue
            scp $csvPath "${HETZNER_USER}@${HETZNER_IP}:$remotePath"
            
            # Validar via Railway API
            Write-Host "🔍 Validando via Railway..." -ForegroundColor $Blue
            
            $body = @{
                csvPath = $remotePath
            } | ConvertTo-Json
            
            $response = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/csv/validate" `
                -Method Post `
                -ContentType "application/json" `
                -Body $body `
                -TimeoutSec 60
            
            # Mostrar resultados
            Write-Host ""
            Write-Host "📊 RESULTADO DA VALIDAÇÃO:" -ForegroundColor $Green
            Write-Host "Total de linhas: $($response.stats.totalRows)"
            Write-Host "Telefones válidos: $($response.stats.validPhones)" -ForegroundColor $Green
            Write-Host "Telefones inválidos: $($response.stats.invalidPhones)" -ForegroundColor $(if($response.stats.invalidPhones -gt 0) { $Red } else { $Green })
            Write-Host "Duplicados: $($response.stats.duplicates)" -ForegroundColor $(if($response.stats.duplicates -gt 0) { $Yellow } else { $Green })
            
            $percentValid = [math]::Round(($response.stats.validPhones / $response.stats.totalRows) * 100, 2)
            Write-Host "Taxa de sucesso: $percentValid%" -ForegroundColor $(if($percentValid -gt 90) { $Green } elseif($percentValid -gt 70) { $Yellow } else { $Red })
            
            if ($response.invalid -and $response.invalid.Count -gt 0) {
                Write-Host ""
                Write-Host "⚠️  Exemplos de números inválidos:" -ForegroundColor $Yellow
                $response.invalid | Select-Object -First 3 | ForEach-Object {
                    Write-Host "   ❌ $($_.phone) - $($_.reason)" -ForegroundColor $Red
                }
            }
            
            # Limpeza
            Execute-SSHCommand "rm -f $remotePath" "Limpando arquivo temporário"
            
            if ($response.stats.validPhones -gt 0) {
                Write-Host ""
                Write-Host "✅ Arquivo está pronto para broadcast!" -ForegroundColor $Green
                
                if ($response.stats.validPhones -gt 1000) {
                    Write-Host "⚠️  ATENÇÃO: Arquivo grande ($($response.stats.validPhones) números)" -ForegroundColor $Yellow
                    Write-Host "   Considere dividir em lotes menores ou aumentar delays" -ForegroundColor $Yellow
                }
                
                return $csvPath
            }
            
        }
        catch {
            Write-Host "❌ Erro na validação: $_" -ForegroundColor $Red
            # Limpeza em caso de erro
            Execute-SSHCommand "rm -f $remotePath" "Limpando arquivo temporário"
        }
    }
}

function Upload-CSVToVPS {
    Write-Host "📤 UPLOAD CSV PARA VPS" -ForegroundColor $Yellow
    Write-Host "======================" -ForegroundColor $Yellow
    Write-Host ""
    
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
            Write-Host "📤 Enviando $filename para VPS..." -ForegroundColor $Blue
            Write-Host "   Local:  $localPath" -ForegroundColor $Gray
            Write-Host "   Remoto: $remotePath" -ForegroundColor $Gray
            
            scp $localPath "${HETZNER_USER}@${HETZNER_IP}:$remotePath"
            
            # Verificar se arquivo chegou
            $checkResult = Execute-SSHCommand "ls -la $remotePath 2>/dev/null && wc -l $remotePath" "Verificando upload"
            
            if ($checkResult) {
                Write-Host "✅ Upload concluído com sucesso!" -ForegroundColor $Green
                Write-Host $checkResult
                Write-Host ""
                Write-Host "📁 Arquivo disponível em: $remotePath" -ForegroundColor $Blue
                return $remotePath
            } else {
                Write-Host "❌ Falha no upload" -ForegroundColor $Red
            }
            
        }
        catch {
            Write-Host "❌ Erro no upload: $_" -ForegroundColor $Red
        }
    }
}

function Test-SingleNumber {
    Write-Host "🔬 TESTE COM 1 NÚMERO" -ForegroundColor $Yellow
    Write-Host "=====================" -ForegroundColor $Yellow
    Write-Host ""
    
    $phone = Read-Host "Digite o número (apenas números, com DDD)"
    $name = Read-Host "Nome do contato (opcional)"
    
    if ([string]::IsNullOrEmpty($name)) { $name = "Teste Império" }
    
    Write-Host ""
    Write-Host "📋 Templates disponíveis:" -ForegroundColor $Blue
    Write-Host "1 - Promoção Império (padrão)"
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
        Write-Host ""
        Write-Host "📨 Enviando mensagem teste para $phone..." -ForegroundColor $Blue
        
        $body = @{
            phones = @($phone)
            template = $template
            templateData = @{
                userName = $name
                availableQuotas = "150"
                promotionDetails = "🎯 TESTE do sistema Império Premiações`n🔥 R$ 170.000 em prêmios"
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
            Write-Host "📱 ID: $($response.results[0].messageId)" -ForegroundColor $Cyan
            Write-Host "🎨 Template: $template" -ForegroundColor $Cyan
            Write-Host ""
            Write-Host "💡 Verifique se a mensagem chegou no WhatsApp do número $phone" -ForegroundColor $Yellow
        }
        else {
            Write-Host "❌ Falha no envio: $($response.results[0].error)" -ForegroundColor $Red
        }
        
    }
    catch {
        Write-Host "❌ Erro no teste: $_" -ForegroundColor $Red
        Write-Host "Verifique se o módulo broadcast está ativo no Railway" -ForegroundColor $Yellow
    }
}

function Test-MultipleNumbers {
    Write-Host "🔬 TESTE COM 5 NÚMEROS" -ForegroundColor $Yellow
    Write-Host "======================" -ForegroundColor $Yellow
    Write-Host ""
    
    $numbers = @()
    Write-Host "Digite até 5 números para teste:" -ForegroundColor $Blue
    
    for ($i = 1; $i -le 5; $i++) {
        $number = Read-Host "Número $i (ENTER para pular)"
        if (-not [string]::IsNullOrEmpty($number)) {
            $numbers += $number.Replace(" ", "").Replace("-", "").Replace("(", "").Replace(")", "")
        }
    }
    
    if ($numbers.Count -eq 0) {
        Write-Host "❌ Nenhum número fornecido!" -ForegroundColor $Red
        return
    }
    
    Write-Host ""
    Write-Host "📊 Números para teste: $($numbers.Count)" -ForegroundColor $Blue
    $numbers | ForEach-Object { Write-Host "   📱 $_" -ForegroundColor $Cyan }
    
    $confirm = Read-Host "`nConfirma envio para estes números? (s/n)"
    if ($confirm -ne "s") { return }
    
    try {
        Write-Host ""
        Write-Host "📨 Enviando mensagens teste..." -ForegroundColor $Blue
        
        $body = @{
            phones = $numbers
            template = "promotional_evolution"
            templateData = @{
                userName = "Teste"
                availableQuotas = "150"
                promotionDetails = "🎯 TESTE sistema Império`n🏆 R$ 170.000 em prêmios"
            }
            testMode = $true
        } | ConvertTo-Json -Depth 10
        
        $response = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/csv/test" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 60
        
        Write-Host ""
        Write-Host "📊 RESULTADOS DO TESTE:" -ForegroundColor $Green
        Write-Host "======================" -ForegroundColor $Green
        
        $sent = 0
        $failed = 0
        
        foreach ($result in $response.results) {
            $icon = if ($result.status -eq "sent") { "✅"; $sent++ } else { "❌"; $failed++ }
            Write-Host "$icon $($result.phone) - $($result.status)"
            
            if ($result.error) {
                Write-Host "     Erro: $($result.error)" -ForegroundColor $Red
            }
        }
        
        Write-Host ""
        Write-Host "📈 Resumo: $sent enviadas, $failed falhas" -ForegroundColor $(if($failed -eq 0) { $Green } else { $Yellow })
        
        if ($sent -gt 0) {
            Write-Host "💡 Verifique os WhatsApps dos números testados" -ForegroundColor $Yellow
        }
        
    }
    catch {
        Write-Host "❌ Erro no teste: $_" -ForegroundColor $Red
    }
}

function Validate-BroadcastConnection {
    Write-Host "✅ VALIDAR CONEXÃO BROADCAST" -ForegroundColor $Yellow
    Write-Host "============================" -ForegroundColor $Yellow
    Write-Host ""
    
    Write-Host "🔍 Verificando Railway..." -ForegroundColor $Blue
    try {
        $railwayStatus = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/status" -Method Get -TimeoutSec 15
        Write-Host "✅ Railway API: Respondendo" -ForegroundColor $Green
        
        if ($railwayStatus.status.available) {
            foreach ($provider in $railwayStatus.status.available) {
                $statusIcon = if ($provider.status.connected) { "✅" } else { "❌" }
                Write-Host "$statusIcon $($provider.name): $($provider.status.connected ? 'Conectado' : 'Desconectado')"
                
                if ($provider.provider -eq "evolution") {
                    Write-Host "   📊 Instâncias: $($provider.status.connectedInstances)/$($provider.status.totalInstances)"
                    Write-Host "   💚 Health: $($provider.status.healthPercentage)%"
                }
            }
        }
    }
    catch {
        Write-Host "❌ Railway: Não responde" -ForegroundColor $Red
        Write-Host "   Erro: $_" -ForegroundColor $Gray
    }
    
    Write-Host ""
    Write-Host "🔍 Verificando VPS..." -ForegroundColor $Blue
    
    # Verificar instâncias broadcast na VPS
    $checkCommand = @"
cd $HETZNER_PATH
echo "=== CONTAINERS EVOLUTION ==="
docker ps --format "table {{.Names}}\t{{.Status}}" | grep evolution
echo ""
echo "=== INSTÂNCIAS BROADCAST ==="
for port in 8081 8082 8083 8084; do
    echo "Testando porta `$port:"
    instances=`$(curl -s --connect-timeout 5 http://localhost:`$port/instance/list -H "apikey: `$EVOLUTION_API_KEY" 2>/dev/null | jq -r '.instances[]? | select(.instance.instanceName | contains("broadcast")) | .instance.instanceName + " - " + .instance.state' 2>/dev/null)
    if [ ! -z "`$instances" ]; then
        echo "  ✅ `$instances"
    else
        echo "  ❌ Sem instâncias broadcast"
    fi
done
"@
    
    $vpsResult = Execute-SSHCommand $checkCommand "Verificando VPS"
    if ($vpsResult) {
        $vpsResult | ForEach-Object { Write-Host "   $_" -ForegroundColor $Gray }
    }
    
    Write-Host ""
    Write-Host "🔍 Teste de conectividade completa..." -ForegroundColor $Blue
    
    try {
        $healthCheck = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/health" -Method Get -TimeoutSec 10
        Write-Host "✅ Módulo broadcast: Funcional" -ForegroundColor $Green
        Write-Host "   📊 Providers: $($healthCheck.providers -join ', ')" -ForegroundColor $Cyan
        Write-Host "   📅 Timestamp: $($healthCheck.timestamp)" -ForegroundColor $Cyan
    }
    catch {
        Write-Host "❌ Health check: Falhou" -ForegroundColor $Red
    }
}

function Send-FullBroadcast {
    Write-Host "🚀 BROADCAST COMPLETO - IMPÉRIO PREMIAÇÕES" -ForegroundColor $Red
    Write-Host "==========================================" -ForegroundColor $Red
    Write-Host ""
    Write-Host "⚠️  ATENÇÃO: ESTE COMANDO ENVIARÁ MENSAGENS REAIS!" -ForegroundColor $Red
    Write-Host "⚠️  CERTIFIQUE-SE DE TER VALIDADO O CSV ANTES!" -ForegroundColor $Red
    Write-Host ""
    
    # Seletor de arquivo
    Add-Type -AssemblyName System.Windows.Forms
    $openFileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $openFileDialog.Filter = "CSV Files (*.csv)|*.csv"
    $openFileDialog.Title = "Selecione o CSV VALIDADO para BROADCAST COMPLETO"
    $openFileDialog.InitialDirectory = [Environment]::GetFolderPath("Desktop")
    
    if ($openFileDialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
        Write-Host "Operação cancelada." -ForegroundColor $Yellow
        return
    }
    
    $csvPath = $openFileDialog.FileName
    $filename = [System.IO.Path]::GetFileName($csvPath)
    
    Write-Host "📁 Arquivo selecionado: $filename" -ForegroundColor $Blue
    
    # Mostrar prévia do arquivo
    Write-Host ""
    Write-Host "📋 Prévia do arquivo:" -ForegroundColor $Yellow
    $preview = Get-Content $csvPath | Select-Object -First 6
    $preview | ForEach-Object { Write-Host "   $_" -ForegroundColor $Gray }
    
    $totalLines = (Get-Content $csvPath).Count - 1  # -1 para descontar cabeçalho
    Write-Host ""
    Write-Host "📊 Total estimado: $totalLines registros" -ForegroundColor $Blue
    
    # Configurações de envio
    Write-Host ""
    Write-Host "⚙️  CONFIGURAÇÕES DE ENVIO:" -ForegroundColor $Yellow
    
    $batchSize = Read-Host "Tamanho do lote (padrão: 50, máx: 100)"
    if ([string]::IsNullOrEmpty($batchSize) -or [int]$batchSize -le 0) { $batchSize = "50" }
    if ([int]$batchSize -gt 100) { 
        Write-Host "⚠️  Limitando a 100 por segurança" -ForegroundColor $Yellow
        $batchSize = "100" 
    }
    
    $delayMs = Read-Host "Delay entre lotes em ms (padrão: 5000, mín: 3000)"
    if ([string]::IsNullOrEmpty($delayMs) -or [int]$delayMs -lt 3000) { $delayMs = "5000" }
    
    # Cálculo de tempo estimado
    $totalBatches = [math]::Ceiling($totalLines / [int]$batchSize)
    $estimatedTimeMinutes = [math]::Round(($totalBatches * [int]$delayMs) / 60000, 1)
    
    Write-Host ""
    Write-Host "📊 RESUMO DO BROADCAST:" -ForegroundColor $Yellow
    Write-Host "Arquivo: $filename"
    Write-Host "Registros: ~$totalLines"
    Write-Host "Lotes: $totalBatches de $batchSize mensagens"
    Write-Host "Delay: $delayMs ms entre lotes"
    Write-Host "Tempo estimado: $estimatedTimeMinutes minutos"
    Write-Host ""
    
    # Confirmações de segurança
    Write-Host "🚨 CONFIRMAÇÕES DE SEGURANÇA:" -ForegroundColor $Red
    
    $confirm1 = Read-Host "Você VALIDOU este CSV? Digite 'VALIDEI'"
    if ($confirm1 -ne "VALIDEI") {
        Write-Host "❌ Broadcast cancelado. Valide o CSV primeiro!" -ForegroundColor $Red
        return
    }
    
    $confirm2 = Read-Host "Tem certeza do envio? Digite 'TENHO CERTEZA'"
    if ($confirm2 -ne "TENHO CERTEZA") {
        Write-Host "❌ Broadcast cancelado por segurança." -ForegroundColor $Red
        return
    }
    
    $confirm3 = Read-Host "ÚLTIMA CONFIRMAÇÃO - Digite 'ENVIAR AGORA'"
    if ($confirm3 -ne "ENVIAR AGORA") {
        Write-Host "❌ Broadcast cancelado." -ForegroundColor $Red
        return
    }
    
    # Iniciar broadcast
    try {
        Write-Host ""
        Write-Host "📤 Enviando arquivo para VPS..." -ForegroundColor $Blue
        
        $remotePath = "/tmp/broadcast_final_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
        scp $csvPath "${HETZNER_USER}@${HETZNER_IP}:$remotePath"
        
        Write-Host "🚀 INICIANDO BROADCAST..." -ForegroundColor $Green
        Write-Host "========================" -ForegroundColor $Green
        
        $body = @{
            csvPath = $remotePath
            template = "promotional_evolution"
            templateData = @{
                availableQuotas = "150"
                promotionDetails = "🎯 SORTEIO ESPECIAL IMPÉRIO PREMIAÇÕES`n🏆 R$ 170.000 em prêmios`n🔥 Últimas vagas disponíveis!"
            }
            options = @{
                batchSize = [int]$batchSize
                delayMs = [int]$delayMs
                randomize = $false
            }
        } | ConvertTo-Json -Depth 10
        
        Write-Host "⏳ Processando broadcast... (Tempo estimado: $estimatedTimeMinutes min)" -ForegroundColor $Yellow
        Write-Host "💡 NÃO FECHE ESTA JANELA!" -ForegroundColor $Yellow
        
        $startTime = Get-Date
        
        $response = Invoke-RestMethod -Uri "$RAILWAY_URL/api/broadcast/csv/process" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -TimeoutSec 1800  # 30 minutos timeout
        
        $endTime = Get-Date
        $actualDuration = ($endTime - $startTime).TotalMinutes
        
        # Mostrar resultados
        $summary = $response.summary
        
        Write-Host ""
        Write-Host "🎉 BROADCAST CONCLUÍDO!" -ForegroundColor $Green
        Write-Host "=======================" -ForegroundColor $Green
        Write-Host ""
        Write-Host "📊 ESTATÍSTICAS FINAIS:" -ForegroundColor $Blue
        Write-Host "Total de contatos: $($summary.totalContacts)"
        Write-Host "✅ Enviados: $($summary.sent)" -ForegroundColor $Green
        Write-Host "❌ Falhas: $($summary.failed)" -ForegroundColor $(if($summary.failed -eq 0) { $Green } else { $Red })
        Write-Host "🚫 Inválidos: $($summary.invalid)" -ForegroundColor $Yellow
        Write-Host "🔄 Duplicados: $($summary.duplicates)" -ForegroundColor $Yellow
        Write-Host "⏱️  Duração real: $([math]::Round($actualDuration, 1)) minutos"
        Write-Host "📁 Resultados salvos: $($summary.resultsFile)" -ForegroundColor $Blue
        
        # Cálculo da taxa de sucesso
        $successRate = [math]::Round(($summary.sent / $summary.totalContacts) * 100, 2)
        Write-Host "📈 Taxa de sucesso: $successRate%" -ForegroundColor $(if($successRate -gt 90) { $Green } elseif($successRate -gt 70) { $Yellow } else { $Red })
        
        Write-Host ""
        
        if ($summary.sent -gt 0) {
            Write-Host "✅ BROADCAST REALIZADO COM SUCESSO!" -ForegroundColor $Green
            Write-Host "📱 $($summary.sent) mensagens foram entregues!" -ForegroundColor $Green
        }
        
        if ($summary.failed -gt 0) {
            Write-Host "⚠️  $($summary.failed) mensagens falharam - verifique os logs" -ForegroundColor $Yellow
        }
        
        # Limpeza
        Execute-SSHCommand "rm -f $remotePath" "Limpando arquivo temporário"
        
    }
    catch {
        Write-Host ""
        Write-Host "❌ ERRO NO BROADCAST: $_" -ForegroundColor $Red
        Write-Host "Verifique:"
        Write-Host "- Conexão com Railway" -ForegroundColor $Yellow
        Write-Host "- Status das instâncias Evolution" -ForegroundColor $Yellow
        Write-Host "- Logs do sistema" -ForegroundColor $Yellow
    }
}

function Monitor-BroadcastProgress {
    Write-Host "📈 MONITORAMENTO EM TEMPO REAL" -ForegroundColor $Yellow
    Write-Host "==============================" -ForegroundColor $Yellow
    Write-Host ""
    Write-Host "Monitorando logs de broadcast... (CTRL+C para parar)" -ForegroundColor $Blue
    Write-Host ""
    
    try {
        # Monitorar logs do docker-compose
        Execute-SSHCommand "cd $HETZNER_PATH && docker-compose logs -f --tail=50 | grep -i -E '(broadcast|message|sent|error)'" "Monitorando logs"
    }
    catch {
        Write-Host "❌ Erro no monitoramento: $_" -ForegroundColor $Red
    }
}

function View-EvolutionLogs {
    Write-Host "📋 LOGS EVOLUTION (DOCKER)" -ForegroundColor $Yellow
    Write-Host "==========================" -ForegroundColor $Yellow
    Write-Host ""
    
    Write-Host "📊 Escolha o tipo de log:" -ForegroundColor $Blue
    Write-Host "1 - Logs completos (últimas 100 linhas)"
    Write-Host "2 - Logs em tempo real"
    Write-Host "3 - Logs específicos de broadcast"
    Write-Host "4 - Logs de erro"
    Write-Host "5 - Status de containers"
    
    $choice = Read-Host "Opção (1-5)"
    
    try {
        switch ($choice) {
            "1" { 
                Write-Host "📋 Últimas 100 linhas dos logs..." -ForegroundColor $Blue
                Execute-SSHCommand "cd $HETZNER_PATH && docker-compose logs --tail=100" "Obtendo logs"
            }
            "2" { 
                Write-Host "📺 Logs em tempo real (CTRL+C para sair)..." -ForegroundColor $Blue
                Execute-SSHCommand "cd $HETZNER_PATH && docker-compose logs -f" "Logs tempo real"
            }
            "3" { 
                Write-Host "🔍 Logs de broadcast..." -ForegroundColor $Blue
                Execute-SSHCommand "cd $HETZNER_PATH && docker-compose logs --tail=200 | grep -i -E '(broadcast|csv|template)'" "Logs broadcast"
            }
            "4" { 
                Write-Host "❌ Logs de erro..." -ForegroundColor $Blue
                Execute-SSHCommand "cd $HETZNER_PATH && docker-compose logs --tail=100 | grep -i -E '(error|fail|exception)'" "Logs de erro"
            }
            "5" { 
                Write-Host "📊 Status de containers..." -ForegroundColor $Blue
                $statusResult = Execute-SSHCommand "cd $HETZNER_PATH && docker ps && echo '--- COMPOSE STATUS ---' && docker-compose ps" "Status containers"
                if ($statusResult) {
                    $statusResult | ForEach-Object { Write-Host $_ }
                }
            }
            default {
                Execute-SSHCommand "cd $HETZNER_PATH && docker-compose logs --tail=50" "Logs padrão"
            }
        }
    }
    catch {
        Write-Host "❌ Erro ao acessar logs: $_" -ForegroundColor $Red
    }
}

function Restart-EvolutionContainers {
    Write-Host "🔄 REINICIAR CONTAINERS EVOLUTION" -ForegroundColor $Yellow
    Write-Host "=================================" -ForegroundColor $Yellow
    Write-Host ""
    
    Write-Host "⚠️  Esta operação irá reiniciar todos os containers Evolution!" -ForegroundColor $Yellow
    Write-Host "⚠️  Instâncias WhatsApp serão desconectadas temporariamente!" -ForegroundColor $Yellow
    Write-Host ""
    
    $confirm = Read-Host "Confirma o restart dos containers? (s/n)"
    if ($confirm -ne "s") { 
        Write-Host "Operação cancelada." -ForegroundColor $Yellow
        return 
    }
    
    try {
        Write-Host ""
        Write-Host "🛑 Parando containers Evolution..." -ForegroundColor $Blue
        Execute-SSHCommand "cd $HETZNER_PATH && docker-compose stop evolution-1 evolution-2 evolution-3 evolution-4" "Parando Evolution"
        
        Write-Host "⏳ Aguardando 10 segundos..." -ForegroundColor $Blue
        Start-Sleep -Seconds 10
        
        Write-Host "🚀 Iniciando containers Evolution..." -ForegroundColor $Blue
        Execute-SSHCommand "cd $HETZNER_PATH && docker-compose up -d evolution-1 evolution-2 evolution-3 evolution-4" "Iniciando Evolution"
        
        Write-Host "⏳ Aguardando inicialização..." -ForegroundColor $Blue
        Start-Sleep -Seconds 15
        
        Write-Host "📊 Verificando status..." -ForegroundColor $Blue
        $statusResult = Execute-SSHCommand "cd $HETZNER_PATH && docker-compose ps | grep evolution" "Verificando status"
        
        if ($statusResult) {
            Write-Host "✅ Status dos containers:" -ForegroundColor $Green
            $statusResult | ForEach-Object { Write-Host "   $_" }
        }
        
        Write-Host ""
        Write-Host "✅ Containers Evolution reiniciados!" -ForegroundColor $Green
        Write-Host "💡 Aguarde alguns minutos para reconexão das instâncias WhatsApp" -ForegroundColor $Yellow
        
    }
    catch {
        Write-Host "❌ Erro ao reiniciar containers: $_" -ForegroundColor $Red
    }
}

function Clean-TempFiles {
    Write-Host "🧹 LIMPEZA DE ARQUIVOS TEMPORÁRIOS" -ForegroundColor $Yellow
    Write-Host "==================================" -ForegroundColor $Yellow
    Write-Host ""
    
    try {
        Write-Host "🗑️  Limpando arquivos locais..." -ForegroundColor $Blue
        $localTempFiles = Get-ChildItem $env:TEMP -Filter "*broadcast*" -ErrorAction SilentlyContinue
        $cleaned = 0
        
        foreach ($file in $localTempFiles) {
            try {
                Remove-Item $file.FullName -Force -ErrorAction SilentlyContinue
                Write-Host "   ✅ $($file.Name)" -ForegroundColor $Green
                $cleaned++
            }
            catch {
                Write-Host "   ❌ $($file.Name) (em uso)" -ForegroundColor $Yellow
            }
        }
        
        Write-Host "🗑️  Limpando arquivos da VPS..." -ForegroundColor $Blue
        $cleanResult = Execute-SSHCommand "rm -f /tmp/broadcast_* /tmp/validate_* /tmp/qrcode_* /tmp/test_* && ls /tmp/ | wc -l" "Limpando VPS"
        
        if ($cleanResult) {
            Write-Host "   ✅ VPS limpa" -ForegroundColor $Green
        }
        
        Write-Host ""
        Write-Host "✅ Limpeza concluída!" -ForegroundColor $Green
        Write-Host "📊 Arquivos locais removidos: $cleaned" -ForegroundColor $Blue
        
    }
    catch {
        Write-Host "❌ Erro na limpeza: $_" -ForegroundColor $Red
    }
}

function Show-VPSStatus {
    Write-Host "📊 STATUS SISTEMA VPS" -ForegroundColor $Yellow
    Write-Host "=====================" -ForegroundColor $Yellow
    Write-Host ""
    
    # Status do sistema
    Write-Host "🖥️  Sistema:" -ForegroundColor $Blue
    $systemResult = Execute-SSHCommand "uptime && free -h && df -h /opt" "Status sistema"
    if ($systemResult) {
        $systemResult | ForEach-Object { Write-Host "   $_" }
    }
    
    Write-Host ""
    Write-Host "🐳 Docker:" -ForegroundColor $Blue
    $dockerResult = Execute-SSHCommand "cd $HETZNER_PATH && docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" "Status Docker"
    if ($dockerResult) {
        $dockerResult | ForEach-Object { Write-Host "   $_" }
    }
    
    Write-Host ""
    Write-Host "🌐 Portas Evolution:" -ForegroundColor $Blue
    $portResult = Execute-SSHCommand "ss -tlnp | grep -E ':(808[1-4])'" "Verificando portas"
    if ($portResult) {
        $portResult | ForEach-Object { Write-Host "   $_" }
    } else {
        Write-Host "   ❌ Nenhuma porta Evolution detectada" -ForegroundColor $Red
    }
}

function Wait-ForInput {
    Write-Host ""
    Write-Host "Pressione ENTER para continuar..." -ForegroundColor $Yellow
    Read-Host
}

# Loop principal
do {
    Show-Menu
    $choice = Read-Host "Escolha uma opção (0-16)"
    
    switch ($choice) {
        "1" { Setup-BroadcastInstance; Wait-ForInput }
        "2" { Check-EvolutionContainers; Wait-ForInput }
        "3" { Check-AllInstances; Wait-ForInput }
        "4" { Configure-RailwayVariables; Wait-ForInput }
        "5" { Generate-SampleCSV; Wait-ForInput }
        "6" { Validate-CSV; Wait-ForInput }
        "7" { Upload-CSVToVPS; Wait-ForInput }
        "8" { Test-SingleNumber; Wait-ForInput }
        "9" { Test-MultipleNumbers; Wait-ForInput }
        "10" { Validate-BroadcastConnection; Wait-ForInput }
        "11" { Send-FullBroadcast; Wait-ForInput }
        "12" { Monitor-BroadcastProgress; Wait-ForInput }
        "13" { View-EvolutionLogs; Wait-ForInput }
        "14" { Restart-EvolutionContainers; Wait-ForInput }
        "15" { Clean-TempFiles; Wait-ForInput }
        "16" { Show-VPSStatus; Wait-ForInput }
        "0" { break }
        default { 
            Write-Host "❌ Opção inválida!" -ForegroundColor $Red
            Wait-ForInput
        }
    }
} while ($choice -ne "0")

Write-Host ""
Write-Host "✅ Broadcast Manager encerrado!" -ForegroundColor $Green
Write-Host "🏆 Obrigado por usar o sistema Império Premiações!" -ForegroundColor $Cyan