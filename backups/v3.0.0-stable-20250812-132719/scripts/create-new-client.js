#!/usr/bin/env node

/**
 * Script para criar novos clientes automaticamente
 * Usage: node scripts/create-new-client.js cliente_id "Nome do Cliente" "https://cliente.com"
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function createNewClient(clientId, clientName, clientUrl) {
  try {
    console.log('🚀 Creating new client...');
    console.log(`📋 ID: ${clientId}`);
    console.log(`👤 Name: ${clientName}`);
    console.log(`🌐 URL: ${clientUrl}`);
    
    // Validar parâmetros
    if (!clientId || !clientName || !clientUrl) {
      throw new Error('Usage: node scripts/create-new-client.js <client_id> "<Client Name>" "<https://client.com>"');
    }
    
    // Validar ID do cliente
    if (!/^[a-z0-9-_]+$/.test(clientId)) {
      throw new Error('Client ID must contain only lowercase letters, numbers, hyphens and underscores');
    }
    
    const clientDir = path.join(rootDir, 'clients', clientId);
    
    // Verificar se já existe
    try {
      await fs.access(clientDir);
      throw new Error(`Client already exists: ${clientId}`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    
    // Copiar template
    console.log('📁 Copying template...');
    const templateDir = path.join(rootDir, 'clients', '_template');
    await copyDirectory(templateDir, clientDir);
    
    // Customizar config.json
    console.log('⚙️ Customizing configuration...');
    const configPath = path.join(clientDir, 'config.json');
    let configContent = await fs.readFile(configPath, 'utf8');
    
    // Substituir placeholders
    configContent = configContent
      .replace(/CLIENT_ID/g, clientId)
      .replace(/Client Name/g, clientName)
      .replace(/https:\/\/your-app\.railway\.app/g, clientUrl)
      .replace(/Description of client services/g, `Sistema WhatsApp para ${clientName}`);
    
    // Atualizar datas
    const now = new Date().toISOString();
    configContent = configContent
      .replace(/2025-01-10T00:00:00Z/g, now);
    
    await fs.writeFile(configPath, configContent);
    
    // Customizar templates
    console.log('🎨 Customizing templates...');
    await customizeTemplates(clientDir, clientName);
    
    // Criar README específico
    console.log('📚 Creating client README...');
    await createClientReadme(clientDir, clientId, clientName);
    
    console.log('✅ Client created successfully!');
    console.log('\n🔧 Next steps:');
    console.log(`1. Edit clients/${clientId}/config.json with specific settings`);
    console.log(`2. Customize templates in clients/${clientId}/templates/`);
    console.log(`3. Add broadcast CSV files to clients/${clientId}/data/broadcast/`);
    console.log(`4. Restart the application: npm restart`);
    console.log(`5. Test webhook: POST /webhook/${clientId}/order_paid`);
    
  } catch (error) {
    console.error('❌ Error creating client:', error.message);
    process.exit(1);
  }
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function customizeTemplates(clientDir, clientName) {
  // Customizar order-paid.js
  const orderPaidPath = path.join(clientDir, 'templates', 'order-paid.js');
  let orderPaidContent = await fs.readFile(orderPaidPath, 'utf8');
  orderPaidContent = orderPaidContent
    .replace(/\*Sua Empresa\*/g, `*${clientName}*`)
    .replace(/template/g, clientName.toLowerCase().replace(/\s+/g, '_'));
  await fs.writeFile(orderPaidPath, orderPaidContent);
  
  // Customizar order-expired.js
  const orderExpiredPath = path.join(clientDir, 'templates', 'order-expired.js');
  let orderExpiredContent = await fs.readFile(orderExpiredPath, 'utf8');
  orderExpiredContent = orderExpiredContent
    .replace(/\*Sua Empresa\*/g, `*${clientName}*`)
    .replace(/template/g, clientName.toLowerCase().replace(/\s+/g, '_'));
  await fs.writeFile(orderExpiredPath, orderExpiredContent);
}

async function createClientReadme(clientDir, clientId, clientName) {
  const readmePath = path.join(clientDir, 'README.md');
  const readmeContent = `# ${clientName} - OracleWA Client

Sistema WhatsApp automatizado para ${clientName}.

## 📊 Configuração

- **Client ID:** ${clientId}
- **Status:** Active
- **Services:** Webhooks, Broadcast
- **Anti-ban:** Enabled (90s+ delays)

## 🔗 Endpoints

- **Order Paid:** \`POST /webhook/${clientId}/order_paid\`
- **Order Expired:** \`POST /webhook/${clientId}/order_expired\`

## 📁 Estrutura de Dados

- **Broadcast Lists:** \`data/broadcast/*.csv\`
- **Export Reports:** \`data/exports/\`
- **Backups:** \`data/backups/\`

## 🎨 Templates

Templates personalizados em \`templates/\`:
- \`order-paid.js\` - Confirmação de pedido
- \`order-expired.js\` - Recuperação de pedido

## 📋 Status

- ✅ Client configured
- ⏳ WhatsApp instances pending connection
- ⏳ Broadcast lists pending upload
- ⏳ Templates pending final customization

## 🚀 Testing

\`\`\`bash
curl -X POST http://localhost:3000/webhook/${clientId}/order_paid \\
  -H "Content-Type: application/json" \\
  -d '{
    "data": {
      "user": {"name": "Teste", "phone": "11999999999"},
      "product": {"title": "Produto Teste"},
      "total": 100
    }
  }'
\`\`\`

Created: ${new Date().toLocaleDateString()}
`;
  
  await fs.writeFile(readmePath, readmeContent);
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const [,, clientId, clientName, clientUrl] = process.argv;
  createNewClient(clientId, clientName, clientUrl);
}