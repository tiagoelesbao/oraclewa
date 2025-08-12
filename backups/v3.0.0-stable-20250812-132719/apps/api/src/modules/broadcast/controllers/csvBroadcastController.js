import { csvProcessor } from '../utils/csv-processor.js';
import { getBroadcastProviderSelector } from '../services/provider-selector.js';
import { getEvolutionTemplateWithCTAs } from '../templates/evolution-templates.js';
import logger from '../../../utils/logger.js';
import fs from 'fs';
import path from 'path';

// Process CSV and send broadcast
export const processCsvBroadcast = async (req, res) => {
  try {
    logger.info('=== CSV BROADCAST START ===');
    
    const {
      csvPath,
      template = 'promotional_evolution',
      templateData = {},
      options = {}
    } = req.body;

    if (!csvPath) {
      return res.status(400).json({
        error: 'CSV file path is required'
      });
    }

    // Parse CSV
    logger.info(`Parsing CSV: ${csvPath}`);
    const parseResult = await csvProcessor.parseCSV(csvPath, {
      delimiter: options.delimiter || ';',
      skipHeader: options.skipHeader || false
    });

    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Failed to parse CSV',
        details: parseResult.errors
      });
    }

    // Validate phone numbers
    const validated = csvProcessor.validatePhoneNumbers(parseResult.data);
    
    logger.info('CSV validation complete:', {
      valid: validated.valid.length,
      invalid: validated.invalid.length,
      duplicates: validated.duplicates.length
    });

    if (validated.valid.length === 0) {
      return res.status(400).json({
        error: 'No valid phone numbers found in CSV',
        invalid: validated.invalid,
        duplicates: validated.duplicates
      });
    }

    // Segment into batches
    const segmented = csvProcessor.segmentContacts(validated.valid, {
      batchSize: options.batchSize || 50,
      delayBetweenBatches: options.delayMs || 5000,
      randomizeOrder: options.randomize || false
    });

    // Get provider and template
    const providerSelector = await getBroadcastProviderSelector();
    let compiledMessage = '';
    let buttons = [];

    if (template) {
      try {
        const templateObj = getEvolutionTemplateWithCTAs(template);
        compiledMessage = templateObj.compile(templateData);
        buttons = templateObj.ctas || [];
      } catch (error) {
        logger.warn('Template not found, using custom message');
        compiledMessage = req.body.message || 'Mensagem de teste';
      }
    }

    // Initialize results tracking
    const results = {
      sent: [],
      failed: [],
      startTime: new Date().toISOString()
    };

    // Process batches
    for (const batch of segmented.batches) {
      logger.info(`Processing batch ${batch.batchNumber}/${segmented.totalBatches}`);
      
      const batchResults = await processBatch(
        batch.contacts,
        compiledMessage,
        buttons,
        providerSelector,
        templateData
      );

      results.sent.push(...batchResults.sent);
      results.failed.push(...batchResults.failed);

      // Delay between batches
      if (batch.batchNumber < segmented.totalBatches) {
        logger.info(`Waiting ${batch.delay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, batch.delay));
      }
    }

    results.endTime = new Date().toISOString();

    // Generate results CSV
    const resultsPath = path.join(
      path.dirname(csvPath),
      `results_${Date.now()}.csv`
    );
    
    await csvProcessor.generateResultsCSV(
      [...results.sent, ...results.failed],
      resultsPath
    );

    // Return summary
    res.json({
      success: true,
      summary: {
        totalContacts: validated.valid.length,
        totalBatches: segmented.totalBatches,
        sent: results.sent.length,
        failed: results.failed.length,
        invalid: validated.invalid.length,
        duplicates: validated.duplicates.length,
        duration: new Date(results.endTime) - new Date(results.startTime),
        resultsFile: resultsPath
      },
      details: {
        batches: segmented.totalBatches,
        batchSize: options.batchSize || 50,
        provider: 'evolution',
        template: template
      }
    });

  } catch (error) {
    logger.error('Error processing CSV broadcast:', error);
    res.status(500).json({
      error: 'Failed to process CSV broadcast',
      details: error.message
    });
  }
};

// Process single batch
async function processBatch(contacts, message, buttons, providerSelector, templateData) {
  const results = {
    sent: [],
    failed: []
  };

  for (const contact of contacts) {
    try {
      // Personalize message if name is available
      let personalizedMessage = message;
      if (contact.name) {
        personalizedMessage = personalizedMessage.replace(/{{userName}}/g, contact.name);
      }

      // Merge contact data with template data
      const mergedData = { ...templateData, ...contact };
      
      // Send message
      const result = await providerSelector.sendMessage(
        contact.phone,
        personalizedMessage,
        {
          buttons: buttons,
          provider: 'evolution'
        }
      );

      results.sent.push({
        ...contact,
        status: 'sent',
        messageId: result.messageId,
        sentAt: new Date().toISOString()
      });

      logger.debug(`Message sent to ${contact.phone}`);
    } catch (error) {
      results.failed.push({
        ...contact,
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      });

      logger.error(`Failed to send to ${contact.phone}:`, error.message);
    }

    // Small delay between messages to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

// Upload CSV file
export const uploadCsvFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const uploadPath = path.join(process.cwd(), 'uploads', 'csv', req.file.filename);
    
    // Parse to validate
    const parseResult = await csvProcessor.parseCSV(uploadPath);
    
    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: uploadPath,
        size: req.file.size
      },
      preview: {
        totalRows: parseResult.stats.totalRows,
        validRecords: parseResult.stats.validRecords,
        invalidRecords: parseResult.stats.invalidRecords,
        sampleData: parseResult.data.slice(0, 5)
      }
    });
  } catch (error) {
    logger.error('Error uploading CSV:', error);
    res.status(500).json({
      error: 'Failed to upload CSV',
      details: error.message
    });
  }
};

// Generate sample CSV
export const generateSampleCsv = async (req, res) => {
  try {
    const { recordCount = 10 } = req.query;
    
    const outputPath = path.join(
      process.cwd(),
      'uploads',
      'csv',
      `sample_${Date.now()}.csv`
    );

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await csvProcessor.generateSampleCSV(outputPath, parseInt(recordCount));

    res.json({
      success: true,
      file: outputPath,
      recordCount: parseInt(recordCount),
      download: `/download/csv/${path.basename(outputPath)}`
    });
  } catch (error) {
    logger.error('Error generating sample CSV:', error);
    res.status(500).json({
      error: 'Failed to generate sample CSV',
      details: error.message
    });
  }
};

// Validate CSV without sending
export const validateCsv = async (req, res) => {
  try {
    const { csvPath } = req.body;

    if (!csvPath) {
      return res.status(400).json({
        error: 'CSV file path is required'
      });
    }

    // Parse CSV
    const parseResult = await csvProcessor.parseCSV(csvPath);
    
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Failed to parse CSV',
        details: parseResult.errors
      });
    }

    // Validate phone numbers
    const validated = csvProcessor.validatePhoneNumbers(parseResult.data);

    res.json({
      success: true,
      stats: {
        totalRows: parseResult.stats.totalRows,
        validPhones: validated.valid.length,
        invalidPhones: validated.invalid.length,
        duplicates: validated.duplicates.length
      },
      valid: validated.valid.slice(0, 10),
      invalid: validated.invalid.slice(0, 10),
      duplicates: validated.duplicates.slice(0, 10)
    });
  } catch (error) {
    logger.error('Error validating CSV:', error);
    res.status(500).json({
      error: 'Failed to validate CSV',
      details: error.message
    });
  }
};

// Test broadcast with small sample
export const testBroadcast = async (req, res) => {
  try {
    const {
      phones = [],
      template = 'promotional_evolution',
      templateData = {},
      testMode = true
    } = req.body;

    if (!phones || phones.length === 0) {
      return res.status(400).json({
        error: 'At least one phone number is required for testing'
      });
    }

    // Limit to 5 numbers in test mode
    const testPhones = testMode ? phones.slice(0, 5) : phones;

    // Get template
    const templateObj = getEvolutionTemplateWithCTAs(template);
    const message = templateObj.compile(templateData);
    const buttons = templateObj.ctas || [];

    // Get provider
    const providerSelector = await getBroadcastProviderSelector();
    
    const results = [];
    
    for (const phone of testPhones) {
      try {
        const result = await providerSelector.sendMessage(phone, message, {
          buttons: buttons,
          provider: 'evolution'
        });
        
        results.push({
          phone,
          status: 'sent',
          messageId: result.messageId
        });
        
        // Delay between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          phone,
          status: 'failed',
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      testMode: testMode,
      template: template,
      results: results,
      message: testMode ? 'Test completed (limited to 5 numbers)' : 'Broadcast completed'
    });
  } catch (error) {
    logger.error('Error in test broadcast:', error);
    res.status(500).json({
      error: 'Failed to run test broadcast',
      details: error.message
    });
  }
};

export default {
  processCsvBroadcast,
  uploadCsvFile,
  generateSampleCsv,
  validateCsv,
  testBroadcast
};