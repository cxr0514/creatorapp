#!/usr/bin/env node

/**
 * Node Environment Fix Script
 * Diagnoses and fixes non-standard NODE_ENV warnings in Next.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 NODE_ENV Environment Diagnostic Tool\n');

// 1. Check current NODE_ENV
const currentNodeEnv = process.env.NODE_ENV;
const validNodeEnvs = ['development', 'production', 'test'];

console.log('1. Current Environment Check:');
console.log(`   NODE_ENV: "${currentNodeEnv}"`);
console.log(`   Length: ${currentNodeEnv?.length || 0} characters`);
console.log(`   Is Valid: ${validNodeEnvs.includes(currentNodeEnv)}`);
console.log(`   Valid Values: ${validNodeEnvs.join(', ')}\n`);

// 2. Check environment files
const envFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.test'];
console.log('2. Environment Files Check:');

envFiles.forEach(filename => {
  const filePath = path.join(process.cwd(), filename);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const nodeEnvMatch = content.match(/NODE_ENV\s*=\s*(.+)/);
    if (nodeEnvMatch) {
      const value = nodeEnvMatch[1].trim().replace(/['"]/g, '');
      console.log(`   ${filename}: "${value}" ${validNodeEnvs.includes(value) ? '✅' : '❌'}`);
      
      // Check for hidden characters
      if (value.length !== value.trim().length) {
        console.log(`   ⚠️  Warning: "${filename}" contains whitespace in NODE_ENV value`);
      }
    }
  }
});

// 3. Check package.json scripts
console.log('\n3. Package.json Scripts Check:');
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  Object.entries(scripts).forEach(([name, script]) => {
    if (script.includes('NODE_ENV=')) {
      const nodeEnvMatch = script.match(/NODE_ENV=([^\s]+)/);
      if (nodeEnvMatch) {
        const value = nodeEnvMatch[1];
        console.log(`   ${name}: NODE_ENV=${value} ${validNodeEnvs.includes(value) ? '✅' : '❌'}`);
      }
    }
  });
}

// 4. Suggest fixes
console.log('\n4. Recommended Actions:');

// Fix function to clean environment files
function fixEnvironmentFiles() {
  let fixed = false;
  
  envFiles.forEach(filename => {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Fix NODE_ENV values
      content = content.replace(/NODE_ENV\s*=\s*([^'\n\r]+)/g, (match, value) => {
        const cleanValue = value.trim().replace(/['"]/g, '');
        if (!validNodeEnvs.includes(cleanValue)) {
          console.log(`   🔧 Fixing NODE_ENV in ${filename}: "${cleanValue}" → "development"`);
          fixed = true;
          return 'NODE_ENV=development';
        }
        return match;
      });
      
      // Remove any trailing whitespace from NODE_ENV lines
      content = content.replace(/NODE_ENV\s*=\s*([^\n\r]+)[\s]+$/gm, (match, value) => {
        const cleanValue = value.trim();
        if (match !== `NODE_ENV=${cleanValue}`) {
          console.log(`   🔧 Removing whitespace from NODE_ENV in ${filename}`);
          fixed = true;
          return `NODE_ENV=${cleanValue}`;
        }
        return match;
      });
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
      }
    }
  });
  
  return fixed;
}

// Check if fix is needed
const needsFix = !validNodeEnvs.includes(currentNodeEnv) || 
  envFiles.some(filename => {
    const filePath = path.join(process.cwd(), filename);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const nodeEnvMatch = content.match(/NODE_ENV\s*=\s*(.+)/);
      if (nodeEnvMatch) {
        const value = nodeEnvMatch[1].trim().replace(/['"]/g, '');
        return !validNodeEnvs.includes(value) || value !== value.trim();
      }
    }
    return false;
  });

if (needsFix) {
  console.log('   ⚠️  Issues detected. Running automatic fix...');
  const wasFixed = fixEnvironmentFiles();
  if (wasFixed) {
    console.log('   ✅ Environment files have been fixed');
    console.log('   💡 Please restart your Next.js server: npm run dev');
  }
} else {
  console.log('   ✅ All NODE_ENV values are standard and properly configured');
}

// 5. Additional recommendations
console.log('\n5. Prevention Tips:');
console.log('   • Only use: development, production, or test');
console.log('   • Avoid custom NODE_ENV values like "dev", "prod", "staging"');
console.log('   • Check for hidden characters or whitespace');
console.log('   • Restart your development server after changes');
console.log('   • Use .env.local for local overrides');

console.log('\n🎉 NODE_ENV diagnostic complete!');
