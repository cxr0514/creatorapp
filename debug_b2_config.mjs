import { getB2Config } from './src/lib/b2.js';

console.log('🔧 B2 Configuration Debug:');
const config = getB2Config();
console.log('- Bucket Name:', config.bucketName);
console.log('- Endpoint:', config.endpoint);
console.log('- Has Valid Credentials:', config.hasValidB2Credentials);
console.log('- Key ID length:', config.keyId?.length || 0);
console.log('- App Key length:', config.appKey?.length || 0);

// Check environment variables
console.log('\n🔍 Environment Variables:');
console.log('- B2_BUCKET_NAME:', process.env.B2_BUCKET_NAME || 'Not set');
console.log('- B2_ENDPOINT:', process.env.B2_ENDPOINT || 'Not set'); 
console.log('- B2_KEY_ID:', process.env.B2_KEY_ID ? `${process.env.B2_KEY_ID.substring(0, 10)}...` : 'Not set');
console.log('- B2_APP_KEY:', process.env.B2_APP_KEY ? `${process.env.B2_APP_KEY.substring(0, 10)}...` : 'Not set');
