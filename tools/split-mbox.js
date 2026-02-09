#!/usr/bin/env node

/**
 * MBOX File Splitter
 * Splits large MBOX files into smaller manageable chunks
 * command: node split-mbox.js <input_file> [output_directory] [chunk_size_mb]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function splitMboxFile(inputFile, outputDir, maxSizeMB = 50) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    
    if (!fs.existsSync(inputFile)) {
        console.error(`Error: File not found: ${inputFile}`);
        process.exit(1);
    }

    const stats = fs.statSync(inputFile);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`\n📧 MBOX File Splitter`);
    console.log(`=====================`);
    console.log(`Input file: ${path.basename(inputFile)}`);
    console.log(`File size: ${fileSizeMB} MB`);
    console.log(`Target chunk size: ${maxSizeMB} MB`);
    console.log(`Output directory: ${outputDir}\n`);

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }

    let chunkNumber = 1;
    let currentChunkSize = 0;
    let currentChunkContent = '';
    let totalMessages = 0;
    let messagesInChunk = 0;
    let chunkMessages = [];

    const rl = readline.createInterface({
        input: fs.createReadStream(inputFile),
        crlfDelay: Infinity
    });

    const basename = path.basename(inputFile, path.extname(inputFile));

    console.log('Processing file...\n');

    let isNewMessage = false;
    let currentMessage = '';

    for await (const line of rl) {
        // Check if this line starts a new message (Google Takeout MBOX format)
        const isMessageBoundary = /^From \S+@\S+\s+\d{4}-\d{2}-\d{2}/.test(line) || line.startsWith('From ');
        
        if (isMessageBoundary && currentMessage) {
            // Save the previous message
            const messageSize = currentMessage.length;
            
            // Check if adding this message would exceed the limit
            if (currentChunkSize + messageSize > maxSizeBytes && currentMessage) {
                // Write current chunk to file
                await writeChunk(basename, chunkNumber, currentChunkContent, messagesInChunk, outputDir);
                
                console.log(`  Chunk ${chunkNumber}: ${(currentChunkSize / 1024 / 1024).toFixed(1)} MB (${messagesInChunk} messages)`);
                
                chunkNumber++;
                currentChunkSize = 0;
                currentChunkContent = '';
                messagesInChunk = 0;
            }
            
            // Add message to current chunk
            currentChunkContent += currentMessage;
            currentChunkSize += messageSize;
            messagesInChunk++;
            totalMessages++;
            currentMessage = '';
        }
        
        currentMessage += line + '\n';
    }

    // Write the last message and chunk
    if (currentMessage.trim()) {
        currentChunkContent += currentMessage;
        currentChunkSize += currentMessage.length;
        messagesInChunk++;
        totalMessages++;
    }

    if (currentChunkContent.trim()) {
        await writeChunk(basename, chunkNumber, currentChunkContent, messagesInChunk, outputDir);
        console.log(`  Chunk ${chunkNumber}: ${(currentChunkSize / 1024 / 1024).toFixed(1)} MB (${messagesInChunk} messages)`);
    }

    console.log(`\n✅ Splitting complete!`);
    console.log(`Total messages: ${totalMessages}`);
    console.log(`Total chunks created: ${chunkNumber}`);
    console.log(`\n📂 Output files are in: ${outputDir}`);
    console.log(`\n💡 Tip: You can now upload each chunk to the MBOX parser app.`);
}

async function writeChunk(basename, chunkNumber, content, messageCount, outputDir) {
    const filename = `${basename}_part${chunkNumber}.mbox`;
    const filepath = path.join(outputDir, filename);
    
    return new Promise((resolve, reject) => {
        fs.writeFile(filepath, content, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log(`
MBOX File Splitter

Usage: node split-mbox.js <input_file> [output_directory] [chunk_size_mb]

Examples:
  node split-mbox.js mail.mbox
  node split-mbox.js mail.mbox ./split_files 100
  node split-mbox.js "C:\\path\\to\\mail.mbox" output 50

Arguments:
  input_file      - Path to the MBOX file to split (required)
  output_directory - Where to save the split files (default: ./split_mbox)
  chunk_size_mb   - Maximum size of each chunk in MB (default: 50)
`);
    process.exit(0);
}

const inputFile = args[0];
const outputDir = args[1] || './split_mbox';
const chunkSize = parseInt(args[2]) || 50;

if (chunkSize < 5) {
    console.error('Error: Chunk size must be at least 5 MB');
    process.exit(1);
}

if (chunkSize > 200) {
    console.warn('Warning: Large chunk sizes may still cause browser issues. Recommended: 20-100 MB');
}

splitMboxFile(inputFile, outputDir, chunkSize).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
