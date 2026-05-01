const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
    return;
  }

  try {
    const quote = req.body;

    if (!quote || !quote.customerName) {
      context.res = { status: 400, body: { error: 'Missing quote data or customerName' } };
      return;
    }

    // Build the quote record
    const record = {
      id: `quote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      customerName: quote.customerName,
      sources: quote.sources,
      sourceCosts: quote.sourceCosts,
      destinations: quote.destinations,
      destinationCosts: quote.destinationCosts,
      totalSourceMonthly: quote.totalSourceMonthly,
      totalDestMonthly: quote.totalDestMonthly,
      savingsMonthly: quote.savingsMonthly,
      savingsPercentage: quote.savingsPercentage,
    };

    // Write to ADLS Gen2
    const connectionString = process.env.ADLS_CONNECTION_STRING;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient('migration-quotes');

    // Organize by year/month/day
    const now = new Date();
    const path = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${record.id}.json`;

    const blockBlobClient = containerClient.getBlockBlobClient(path);
    const content = JSON.stringify(record, null, 2);
    await blockBlobClient.upload(content, Buffer.byteLength(content), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });

    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: { success: true, id: record.id, path },
    };
  } catch (err) {
    context.log.error('SaveQuote error:', err);
    context.res = {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: { error: 'Failed to save quote', details: err.message },
    };
  }
};
