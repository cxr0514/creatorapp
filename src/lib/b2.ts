import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// B2 Configuration - read environment variables at runtime
export function getB2Config() {
  const BUCKET_NAME = process.env.B2_BUCKET_NAME || process.env.B2_BUCKET || 'Clipverse';
  const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
  const B2_KEY_ID = process.env.B2_KEY_ID || process.env.B2_ACCESS_KEY_ID || '';
  const B2_APP_KEY = process.env.B2_APP_KEY || process.env.B2_SECRET_ACCESS_KEY || '';
  
  // Check if B2 credentials are configured
  const hasValidB2Credentials = B2_KEY_ID && B2_APP_KEY && B2_KEY_ID !== '' && B2_APP_KEY !== '';
  
  return { 
    bucketName: BUCKET_NAME, 
    endpoint: B2_ENDPOINT, 
    keyId: B2_KEY_ID, 
    appKey: B2_APP_KEY, 
    hasValidB2Credentials 
  };
}

// Development TLS workaround
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = '1';

// Create B2 client factory function
function createB2Client() {
  const { endpoint, keyId, appKey } = getB2Config();
  
  return new S3Client({
    endpoint: endpoint,
    region: 'us-east-005',
    credentials: {
      accessKeyId: keyId,
      secretAccessKey: appKey,
    },
    forcePathStyle: true,
    maxAttempts: 3,
    requestHandler: {
      connectionTimeout: 30000,
      requestTimeout: 300000,
    }
  });
}

// Configuration logging will happen when functions are called

// Debug logging for module load
console.log(`[B2-DEBUG] B2 module loaded successfully`);

async function uploadDirectToB2(
  file: Buffer,
  bucket: string,
  key: string,
  contentType: string
): Promise<{ status: number; statusText: string }> {
  console.log(`[UPLOAD-DIRECT] Starting direct upload...`);
  console.log(`[UPLOAD-DIRECT] Bucket: ${bucket}`);
  console.log(`[UPLOAD-DIRECT] Key: ${key}`);
  console.log(`[UPLOAD-DIRECT] Content-Type: ${contentType}`);
  console.log(`[UPLOAD-DIRECT] File size: ${file.length} bytes`);
  
  const b2Client = createB2Client();
  const maxRetries = 3;
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[UPLOAD-DIRECT] Attempt ${attempt}/${maxRetries}...`);
      
      const putCommand = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
      console.log(`[UPLOAD-DIRECT] Created PutObjectCommand`);
      
      const presignedUrl = await getSignedUrl(b2Client, putCommand, { expiresIn: 3600 });
      console.log(`[UPLOAD-DIRECT] Generated presigned URL: ${presignedUrl.substring(0, 100)}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000);
      
      console.log(`[UPLOAD-DIRECT] Making fetch request...`);
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': contentType,
          'Content-Length': file.length.toString(),
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      console.log(`[UPLOAD-DIRECT] Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text');
        const errorMsg = `Upload failed: ${response.status} ${response.statusText} - ${errorText}`;
        console.error(`[UPLOAD-DIRECT] ${errorMsg}`);
        throw new Error(errorMsg);
      }
      
      console.log(`[UPLOAD-DIRECT] Upload successful on attempt ${attempt}`);
      return { status: response.status, statusText: response.statusText };
      
    } catch (error: unknown) {
      console.error(`[UPLOAD-DIRECT] Attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        const delay = 1000 * attempt;
        console.log(`[UPLOAD-DIRECT] Retrying in ${delay}ms...`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
    }
  }
  
  const finalError = `Failed to upload ${key} after ${maxRetries} attempts: ${lastError}`;
  console.error(`[UPLOAD-DIRECT] ${finalError}`);
  throw new Error(finalError);
}

export async function uploadToB2(
  file: Buffer | File | Blob,
  key: string,
  contentType: string
): Promise<{ storageKey: string; storageUrl: string }> {
  console.log(`[B2-UPLOAD] Starting upload process...`);
  console.log(`[B2-UPLOAD] Key: ${key}`);
  console.log(`[B2-UPLOAD] Content-Type: ${contentType}`);
  
  const { bucketName, endpoint, hasValidB2Credentials, keyId, appKey } = getB2Config();
  
  // Log configuration at runtime
  console.log(`[B2-RUNTIME] Bucket: ${bucketName}`);
  console.log(`[B2-RUNTIME] Endpoint: ${endpoint}`);
  console.log(`[B2-RUNTIME] Key ID: ${keyId ? keyId.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log(`[B2-RUNTIME] App Key: ${appKey ? appKey.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log(`[B2-RUNTIME] Valid Credentials: ${hasValidB2Credentials}`);
  
  console.log(`[B2-UPLOAD] File parameter type: ${typeof file}`);
  console.log(`[B2-UPLOAD] File parameter constructor: ${file?.constructor?.name}`);
  console.log(`[B2-UPLOAD] File size: ${Buffer.isBuffer(file) ? file.length : (file as File).size || 'unknown'} bytes`);
  console.log(`[B2-UPLOAD] Is Buffer: ${Buffer.isBuffer(file)}`);
  console.log(`[B2-UPLOAD] Has arrayBuffer method: ${typeof (file as Blob).arrayBuffer === 'function'}`);
  
  let fileBuffer: Buffer;
  // Support Web File or Node Buffer
  if (Buffer.isBuffer(file)) {
    console.log(`[B2-UPLOAD] Using provided Buffer directly...`);
    fileBuffer = file as Buffer;
  } else if (file && 'arrayBuffer' in file && typeof file.arrayBuffer === 'function') {
    console.log(`[B2-UPLOAD] Converting File/Blob object to Buffer...`);
    const arrayBuffer = await file.arrayBuffer();
    fileBuffer = Buffer.from(arrayBuffer);
  } else {
    const error = `Invalid file type provided to uploadToB2. Type: ${typeof file}, Constructor: ${file?.constructor?.name}, IsBuffer: ${Buffer.isBuffer(file)}`;
    console.error(`[B2-UPLOAD] ERROR: ${error}`);
    throw new Error(error);
  }
  
  console.log(`[B2-UPLOAD] Calling uploadDirectToB2 with buffer size: ${fileBuffer.length}`);
  
  try {
    await uploadDirectToB2(fileBuffer, bucketName, key, contentType);
    const result = { storageKey: key, storageUrl: `${endpoint}/${bucketName}/${key}` };
    console.log(`[B2-UPLOAD] Success! Result:`, result);
    return result;
  } catch (error) {
    console.error(`[B2-UPLOAD] Upload failed:`, error);
    throw error;
  }
}

export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const { bucketName } = getB2Config();
  const b2Client = createB2Client();
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  return await getSignedUrl(b2Client, command, { expiresIn });
}

export async function deleteFromB2(key: string): Promise<{ result: string }> {
  const { bucketName } = getB2Config();
  const b2Client = createB2Client();
  const command = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
  await b2Client.send(command);
  return { result: 'Deleted' };
}

export async function listAllB2Objects(): Promise<Array<{ key: string; size?: number; lastModified?: Date }>> {
  const { bucketName } = getB2Config();
  const b2Client = createB2Client();
  const command = new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 1000 });
  const result = await b2Client.send(command);
  const objects: Array<{ key: string; size?: number; lastModified?: Date }> = [];
  if (result.Contents) {
    result.Contents.forEach((item) => {
      objects.push({ key: item.Key || '', size: item.Size, lastModified: item.LastModified });
    });
  }
  return objects;
}

// Additional exports for API routes
export const uploadVideoToB2 = uploadToB2;
export const deleteVideoFromB2 = deleteFromB2;

/**
 * Sync user's videos from B2 to the database. Stub implementation.
 */
export async function syncUserVideosFromB2Enhanced() {
  const objects = await listAllB2Objects();
  return objects;
}

// Alias export to satisfy route import
export const syncUserVideosFromB2 = syncUserVideosFromB2Enhanced;

/**
 * Smart sync logic placeholder.
 */
export async function smartSync() {
  return { synced: true };
}

/**
 * Check storage health (e.g., ping B2 or list minimal items).
 */
export async function checkStorageHealth(): Promise<{ healthy: boolean }> {
  try {
    await listAllB2Objects();
    return { healthy: true };
  } catch {
    return { healthy: false };
  }
}

// Export utility functions for external use
export function getBucketName() {
  return getB2Config().bucketName;
}

export function createB2ClientInstance() {
  return createB2Client();
}
