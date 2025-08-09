import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import logger from '../../../utils/logger.js';

export class CSVProcessor {
  constructor() {
    this.supportedFormats = ['.csv', '.txt'];
    this.defaultMapping = {
      phone: ['phone', 'telefone', 'whatsapp', 'numero', 'celular', 'fone'],
      name: ['name', 'nome', 'cliente', 'contato'],
      email: ['email', 'e-mail', 'correio'],
      cpf: ['cpf', 'documento', 'doc'],
      value: ['value', 'valor', 'preco', 'total'],
      product: ['product', 'produto', 'item', 'campanha'],
      status: ['status', 'situacao', 'estado']
    };
  }

  // Parse CSV file and return structured data
  async parseCSV(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      
      const {
        delimiter = ';',
        encoding = 'utf8',
        skipHeader = false,
        customMapping = {}
      } = options;

      const mapping = { ...this.defaultMapping, ...customMapping };

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`File not found: ${filePath}`));
      }

      // Create read stream
      const stream = fs.createReadStream(filePath, { encoding });
      
      // Parse CSV
      const parser = parse({
        delimiter,
        columns: !skipHeader,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true
      });

      let rowCount = 0;
      let headers = null;

      parser.on('readable', function() {
        let record;
        while ((record = parser.read()) !== null) {
          rowCount++;
          
          // First row as headers if columns: true
          if (rowCount === 1 && !skipHeader) {
            headers = record;
            continue;
          }

          try {
            const processedRecord = processRecord(record, headers, mapping);
            if (processedRecord.phone) {
              results.push(processedRecord);
            } else {
              errors.push({
                row: rowCount,
                error: 'No phone number found',
                data: record
              });
            }
          } catch (error) {
            errors.push({
              row: rowCount,
              error: error.message,
              data: record
            });
          }
        }
      });

      parser.on('error', function(err) {
        logger.error('CSV parsing error:', err);
        reject(err);
      });

      parser.on('end', function() {
        logger.info(`CSV parsed successfully: ${results.length} valid records, ${errors.length} errors`);
        resolve({
          success: true,
          data: results,
          errors: errors,
          stats: {
            totalRows: rowCount,
            validRecords: results.length,
            invalidRecords: errors.length
          }
        });
      });

      stream.pipe(parser);
    });
  }

  // Process and validate phone numbers
  validatePhoneNumbers(records) {
    const validated = {
      valid: [],
      invalid: [],
      duplicates: []
    };

    const seen = new Set();

    for (const record of records) {
      const phone = this.cleanPhoneNumber(record.phone);
      
      if (!phone) {
        validated.invalid.push({
          ...record,
          reason: 'Invalid phone format'
        });
        continue;
      }

      // Check for duplicates
      if (seen.has(phone)) {
        validated.duplicates.push({
          ...record,
          phone: phone
        });
        continue;
      }

      seen.add(phone);
      
      // Validate Brazilian phone format
      if (this.isValidBrazilianPhone(phone)) {
        validated.valid.push({
          ...record,
          phone: phone
        });
      } else {
        validated.invalid.push({
          ...record,
          phone: phone,
          reason: 'Invalid Brazilian phone number'
        });
      }
    }

    return validated;
  }

  // Clean phone number
  cleanPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-digits
    let cleaned = String(phone).replace(/\D/g, '');
    
    // Handle Brazilian numbers
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Add country code if missing
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
    
    // Remove extra 9 if present (some numbers have it duplicated)
    if (cleaned.length === 14 && cleaned[4] === '9') {
      cleaned = cleaned.slice(0, 4) + cleaned.slice(5);
    }
    
    return cleaned;
  }

  // Validate Brazilian phone number
  isValidBrazilianPhone(phone) {
    // Should be 12 or 13 digits: 55 + DDD (2) + number (8 or 9)
    const regex = /^55\d{2}9?\d{8}$/;
    return regex.test(phone);
  }

  // Segment contacts into batches
  segmentContacts(contacts, options = {}) {
    const {
      batchSize = 100,
      delayBetweenBatches = 5000,
      randomizeOrder = false,
      priorityField = null
    } = options;

    let processedContacts = [...contacts];

    // Sort by priority if specified
    if (priorityField && contacts[0][priorityField] !== undefined) {
      processedContacts.sort((a, b) => {
        return (b[priorityField] || 0) - (a[priorityField] || 0);
      });
    }

    // Randomize if requested
    if (randomizeOrder) {
      processedContacts = this.shuffleArray(processedContacts);
    }

    // Create batches
    const batches = [];
    for (let i = 0; i < processedContacts.length; i += batchSize) {
      batches.push({
        batchNumber: Math.floor(i / batchSize) + 1,
        contacts: processedContacts.slice(i, i + batchSize),
        startIndex: i,
        endIndex: Math.min(i + batchSize - 1, processedContacts.length - 1),
        delay: delayBetweenBatches
      });
    }

    return {
      totalContacts: contacts.length,
      totalBatches: batches.length,
      batchSize: batchSize,
      estimatedTime: (batches.length - 1) * delayBetweenBatches,
      batches: batches
    };
  }

  // Shuffle array for randomization
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Generate CSV from results
  async generateResultsCSV(results, outputPath) {
    const headers = ['phone', 'name', 'status', 'messageId', 'sentAt', 'error'];
    const rows = [headers.join(';')];

    for (const result of results) {
      const row = [
        result.phone || '',
        result.name || '',
        result.status || '',
        result.messageId || '',
        result.sentAt || '',
        result.error || ''
      ].map(field => `"${field}"`);
      
      rows.push(row.join(';'));
    }

    const csvContent = rows.join('\n');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    
    logger.info(`Results CSV generated: ${outputPath}`);
    return outputPath;
  }

  // Sample CSV generator for testing
  async generateSampleCSV(outputPath, recordCount = 10) {
    const headers = ['nome', 'telefone', 'email', 'valor', 'produto'];
    const rows = [headers.join(';')];

    const sampleNames = ['João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa', 'Carlos Ferreira'];
    const sampleProducts = ['Sorteio Federal', 'Mega Prêmio', 'Super Sorte', 'Prêmio Especial'];

    for (let i = 0; i < recordCount; i++) {
      const name = sampleNames[i % sampleNames.length];
      const ddd = ['11', '21', '31', '41', '51'][i % 5];
      const phone = `55${ddd}9${Math.floor(Math.random() * 90000000 + 10000000)}`;
      const email = `${name.toLowerCase().replace(' ', '.')}@example.com`;
      const value = (Math.random() * 1000).toFixed(2);
      const product = sampleProducts[i % sampleProducts.length];

      rows.push(`${name};${phone};${email};${value};${product}`);
    }

    const csvContent = rows.join('\n');
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    
    logger.info(`Sample CSV generated: ${outputPath} with ${recordCount} records`);
    return outputPath;
  }
}

// Helper function to process individual record
function processRecord(record, headers, mapping) {
  const processed = {};

  // If record is an object (headers were parsed)
  if (typeof record === 'object' && !Array.isArray(record)) {
    // Direct mapping
    for (const [targetField, possibleFields] of Object.entries(mapping)) {
      for (const field of possibleFields) {
        if (record[field]) {
          processed[targetField] = record[field];
          break;
        }
      }
    }
  } else if (Array.isArray(record) && headers) {
    // Array with headers
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase();
      const value = record[i];

      for (const [targetField, possibleFields] of Object.entries(mapping)) {
        if (possibleFields.includes(header)) {
          processed[targetField] = value;
        }
      }
    }
  } else if (Array.isArray(record)) {
    // Array without headers - assume common order
    if (record[0]) processed.name = record[0];
    if (record[1]) processed.phone = record[1];
    if (record[2]) processed.email = record[2];
    if (record[3]) processed.value = record[3];
    if (record[4]) processed.product = record[4];
  }

  // Add any unmapped fields
  if (typeof record === 'object' && !Array.isArray(record)) {
    for (const [key, value] of Object.entries(record)) {
      if (!processed[key]) {
        processed[key] = value;
      }
    }
  }

  return processed;
}

// Export singleton instance
export const csvProcessor = new CSVProcessor();

export default CSVProcessor;