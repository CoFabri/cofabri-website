#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test cases for canonical URLs
const testCases = [
  {
    name: 'Homepage canonical URL',
    url: '/',
    expectedCanonical: 'https://cofabri.com/'
  },
  {
    name: 'Status page canonical URL',
    url: '/status',
    expectedCanonical: 'https://cofabri.com/status'
  },
  {
    name: 'Knowledge base page canonical URL',
    url: '/knowledge-base',
    expectedCanonical: 'https://cofabri.com/knowledge-base'
  },
  {
    name: 'Legal page canonical URL',
    url: '/legal',
    expectedCanonical: 'https://cofabri.com/legal'
  }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: url,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

function extractCanonicalUrl(html) {
  const canonicalMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"[^>]*>/i);
  return canonicalMatch ? canonicalMatch[1] : null;
}

async function runTests() {
  console.log('🔗 Testing Canonical URLs...\n');
  
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`URL: ${testCase.url}`);
      
      const result = await makeRequest(testCase.url);
      
      if (result.status === 200) {
        const canonicalUrl = extractCanonicalUrl(result.data);
        
        if (canonicalUrl === testCase.expectedCanonical) {
          console.log(`✅ PASS: Canonical URL is correct: ${canonicalUrl}`);
          passed++;
        } else {
          console.log(`❌ FAIL: Expected ${testCase.expectedCanonical}, got ${canonicalUrl}`);
          failed++;
        }
      } else {
        console.log(`❌ FAIL: Page returned status ${result.status}`);
        failed++;
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}\n`);
      failed++;
    }
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed > 0) {
    console.log('\n🔧 Some tests failed. Please check the canonical URL implementation.');
    process.exit(1);
  } else {
    console.log('\n🎉 All canonical URL tests passed!');
  }
}

// Wait for server to start
setTimeout(runTests, 3000);
