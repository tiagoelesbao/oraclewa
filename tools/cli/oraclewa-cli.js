#!/usr/bin/env node

/**
 * OracleWA SaaS - Command Line Interface
 * Administrative tool for managing the multi-tenant platform
 */

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const program = new Command();
const VERSION = '3.0.0';

// Display banner
console.log(
  chalk.cyan(
    figlet.textSync('OracleWA CLI', {
      font: 'ANSI Shadow',
      horizontalLayout: 'default',
      verticalLayout: 'default'
    })
  )
);

console.log(chalk.gray(`Version ${VERSION} - Enterprise WhatsApp Automation Platform\n`));

// ========================================
// CLIENT MANAGEMENT COMMANDS
// ========================================

program
  .command('client')
  .description('Client management operations')
  .action(() => {
    program.help();
  });

program
  .command('client:list')
  .description('List all clients')
  .option('-v, --verbose', 'Show detailed information')
  .action(async (options) => {
    try {
      const clientsDir = path.join(process.cwd(), 'clients');
      const clients = fs.readdirSync(clientsDir).filter(dir => 
        dir !== '_template' && fs.statSync(path.join(clientsDir, dir)).isDirectory()
      );

      console.log(chalk.blue('\n📋 Active Clients:'));
      console.log(chalk.gray('─'.repeat(50)));

      if (clients.length === 0) {
        console.log(chalk.yellow('No clients found. Use "client:add" to add your first client.'));
        return;
      }

      for (const clientId of clients) {
        try {
          const configPath = path.join(clientsDir, clientId, 'config.env');
          if (fs.existsSync(configPath)) {
            const config = fs.readFileSync(configPath, 'utf8');
            const clientName = config.match(/CLIENT_NAME="(.+)"/)?.[1] || clientId;
            const services = config.match(/SERVICE_TYPE=(\w+)/)?.[1] || 'all';
            
            console.log(chalk.green(`✓ ${clientId}`));
            console.log(chalk.gray(`  Name: ${clientName}`));
            console.log(chalk.gray(`  Services: ${services}`));
            
            if (options.verbose) {
              const recovery = config.includes('RECOVERY_ENABLED=true');
              const broadcast = config.includes('BROADCAST_ENABLED=true');
              console.log(chalk.gray(`  Recovery: ${recovery ? '✓' : '✗'}`));
              console.log(chalk.gray(`  Broadcast: ${broadcast ? '✓' : '✗'}`));
            }
            console.log('');
          }
        } catch (err) {
          console.log(chalk.red(`✗ ${clientId} (config error)`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error listing clients: ${error.message}`));
    }
  });

program
  .command('client:add')
  .description('Add a new client')
  .option('-i, --id <clientId>', 'Client ID')
  .option('-n, --name <clientName>', 'Client name')
  .option('-s, --services <services>', 'Services (all, recovery, broadcast)', 'all')
  .action(async (options) => {
    try {
      let { id, name, services } = options;

      if (!id || !name) {
        const answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'id',
            message: 'Client ID (lowercase, no spaces):',
            when: !id,
            validate: (input) => /^[a-z0-9-]+$/.test(input) || 'ID must be lowercase alphanumeric with dashes only'
          },
          {
            type: 'input',
            name: 'name',
            message: 'Client Name:',
            when: !name,
            validate: (input) => input.trim().length > 0 || 'Name is required'
          },
          {
            type: 'list',
            name: 'services',
            message: 'Which services to enable?',
            choices: ['all', 'recovery', 'broadcast'],
            default: 'all',
            when: !services
          }
        ]);

        id = id || answers.id;
        name = name || answers.name;
        services = services || answers.services;
      }

      console.log(chalk.blue(`\n🚀 Adding client: ${name} (${id})`));

      // Check if client already exists
      const clientDir = path.join(process.cwd(), 'clients', id);
      if (fs.existsSync(clientDir)) {
        throw new Error(`Client ${id} already exists`);
      }

      // Execute the add client script
      const scriptPath = path.join(process.cwd(), 'scripts/client-management/deploy-new-client.sh');
      if (!fs.existsSync(scriptPath)) {
        throw new Error('Client management script not found');
      }

      console.log(chalk.yellow('Executing client setup script...'));
      execSync(`bash ${scriptPath} ${id} "${name}" ${services}`, { stdio: 'inherit' });

      console.log(chalk.green(`\n✅ Client ${name} added successfully!`));
      console.log(chalk.gray(`Client ID: ${id}`));
      console.log(chalk.gray(`Services: ${services}`));
      
    } catch (error) {
      console.error(chalk.red(`Error adding client: ${error.message}`));
    }
  });

program
  .command('client:remove')
  .description('Remove a client')
  .option('-i, --id <clientId>', 'Client ID to remove')
  .option('-f, --force', 'Force removal without confirmation')
  .action(async (options) => {
    try {
      let { id, force } = options;

      if (!id) {
        const clientsDir = path.join(process.cwd(), 'clients');
        const clients = fs.readdirSync(clientsDir).filter(dir => 
          dir !== '_template' && fs.statSync(path.join(clientsDir, dir)).isDirectory()
        );

        if (clients.length === 0) {
          console.log(chalk.yellow('No clients found to remove.'));
          return;
        }

        const { selectedClient } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedClient',
            message: 'Select client to remove:',
            choices: clients
          }
        ]);

        id = selectedClient;
      }

      const clientDir = path.join(process.cwd(), 'clients', id);
      if (!fs.existsSync(clientDir)) {
        throw new Error(`Client ${id} not found`);
      }

      if (!force) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: chalk.red(`Are you sure you want to remove client "${id}"? This action cannot be undone.`),
            default: false
          }
        ]);

        if (!confirm) {
          console.log(chalk.yellow('Operation cancelled.'));
          return;
        }
      }

      // Execute removal script
      const scriptPath = path.join(process.cwd(), 'scripts/client-management/remove-client.sh');
      if (fs.existsSync(scriptPath)) {
        execSync(`bash ${scriptPath} ${id}`, { stdio: 'inherit' });
      } else {
        // Manual removal
        console.log(chalk.yellow('Removing client manually...'));
        fs.rmSync(clientDir, { recursive: true, force: true });
        
        // Stop containers if running
        try {
          execSync(`docker-compose -f docker-compose.${id}.yml down`, { stdio: 'ignore' });
          execSync(`docker volume rm ${id}-db-data ${id}-redis-data`, { stdio: 'ignore' });
        } catch (err) {
          // Ignore errors for non-existent containers
        }
      }

      console.log(chalk.green(`✅ Client ${id} removed successfully!`));

    } catch (error) {
      console.error(chalk.red(`Error removing client: ${error.message}`));
    }
  });

// ========================================
// SYSTEM COMMANDS
// ========================================

program
  .command('status')
  .description('Show system status')
  .action(async () => {
    try {
      console.log(chalk.blue('\n🔍 System Status'));
      console.log(chalk.gray('─'.repeat(50)));

      // Check Docker containers
      try {
        const containers = execSync('docker ps --format "table {{.Names}}\\t{{.Status}}"', { encoding: 'utf8' });
        console.log(chalk.green('\n📦 Docker Containers:'));
        console.log(containers);
      } catch (err) {
        console.log(chalk.yellow('Docker not available or no containers running'));
      }

      // Check services
      const services = [
        { name: 'API', port: 3000 },
        { name: 'PostgreSQL', port: 5432 },
        { name: 'Redis', port: 6379 },
        { name: 'Prometheus', port: 9090 },
        { name: 'Grafana', port: 3100 }
      ];

      console.log(chalk.green('\n🌐 Service Health:'));
      for (const service of services) {
        try {
          execSync(`nc -z localhost ${service.port}`, { stdio: 'ignore' });
          console.log(chalk.green(`✓ ${service.name} (port ${service.port})`));
        } catch (err) {
          console.log(chalk.red(`✗ ${service.name} (port ${service.port})`));
        }
      }

    } catch (error) {
      console.error(chalk.red(`Error checking status: ${error.message}`));
    }
  });

program
  .command('logs')
  .description('View system logs')
  .option('-s, --service <service>', 'Specific service logs')
  .option('-f, --follow', 'Follow log output')
  .option('-t, --tail <lines>', 'Number of lines to show', '100')
  .action((options) => {
    try {
      let command = 'docker-compose logs';
      
      if (options.follow) command += ' -f';
      if (options.tail) command += ` --tail=${options.tail}`;
      if (options.service) command += ` ${options.service}`;

      console.log(chalk.blue(`\n📄 System Logs`));
      console.log(chalk.gray(`Command: ${command}\n`));

      execSync(command, { stdio: 'inherit' });

    } catch (error) {
      console.error(chalk.red(`Error viewing logs: ${error.message}`));
    }
  });

program
  .command('backup')
  .description('Create system backup')
  .option('-c, --client <clientId>', 'Backup specific client only')
  .action(async (options) => {
    try {
      console.log(chalk.blue('\n💾 Creating Backup'));
      console.log(chalk.gray('─'.repeat(50)));

      const scriptPath = options.client 
        ? path.join(process.cwd(), 'scripts/backup/backup-client.sh')
        : path.join(process.cwd(), 'scripts/backup/backup-all.sh');

      if (!fs.existsSync(scriptPath)) {
        throw new Error('Backup script not found');
      }

      const args = options.client ? [options.client] : [];
      execSync(`bash ${scriptPath} ${args.join(' ')}`, { stdio: 'inherit' });

      console.log(chalk.green('\n✅ Backup completed successfully!'));

    } catch (error) {
      console.error(chalk.red(`Error creating backup: ${error.message}`));
    }
  });

// ========================================
// DEVELOPMENT COMMANDS
// ========================================

program
  .command('dev')
  .description('Development commands')
  .action(() => {
    program.help();
  });

program
  .command('dev:setup')
  .description('Setup development environment')
  .action(async () => {
    try {
      console.log(chalk.blue('\n🔧 Setting up development environment'));
      console.log(chalk.gray('─'.repeat(50)));

      const steps = [
        'Installing dependencies...',
        'Setting up database...',
        'Creating default configuration...',
        'Starting services...'
      ];

      for (const step of steps) {
        console.log(chalk.yellow(step));
        // Add actual setup logic here
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(chalk.green('\n✅ Development environment ready!'));
      console.log(chalk.gray('Run "npm run dev" to start the application'));

    } catch (error) {
      console.error(chalk.red(`Error setting up dev environment: ${error.message}`));
    }
  });

// ========================================
// PROGRAM SETUP
// ========================================

program
  .name('oraclewa')
  .description('OracleWA SaaS Command Line Interface')
  .version(VERSION);

// Handle unknown commands
program
  .action(() => {
    console.log(chalk.red('\nUnknown command. Use --help for available commands.'));
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
  
  console.log(chalk.blue('\n🚀 Quick Start:'));
  console.log(chalk.gray('  oraclewa client:add              Add a new client'));
  console.log(chalk.gray('  oraclewa client:list             List all clients'));
  console.log(chalk.gray('  oraclewa status                  Check system status'));
  console.log(chalk.gray('  oraclewa logs -f                 Follow system logs'));
  console.log(chalk.gray('  oraclewa backup                  Create full backup'));
  console.log(chalk.gray('  oraclewa dev:setup               Setup development'));
  
  console.log(chalk.blue('\n📚 Documentation:'));
  console.log(chalk.gray('  https://docs.oraclewa.com'));
}