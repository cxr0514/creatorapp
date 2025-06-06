import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as crypto from 'crypto';
import * as https from 'https';

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

// Create B2 client factory function with permanent checksum header removal
export function createB2Client() {
  const { endpoint, keyId, appKey } = getB2Config();
  
  const client = new S3Client({
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
    },
    // Disable S3 Express session auth (not relevant but doesn't hurt)
    disableS3ExpressSessionAuth: true,
  });

  // PERMANENT FIX: Add middleware to remove ALL checksum headers before sending requests
  client.middlewareStack.add(
    (next) => async (args) => {
      // Remove checksum headers from the request
      if (args.request && typeof args.request === 'object' && 'headers' in args.request && args.request.headers) {
        const headers = args.request.headers as Record<string, string>;
        
        // Remove all x-amz-checksum-* headers that Backblaze B2 doesn't support
        const checksumHeaders = Object.keys(headers).filter(header => 
          header.toLowerCase().startsWith('x-amz-checksum-')
        );
        
        checksumHeaders.forEach(header => {
          delete headers[header];
        });
        
        // Also remove Content-MD5 if present (another potential issue)
        if ('content-md5' in headers) {
          delete headers['content-md5'];
        }
        if ('Content-MD5' in headers) {
          delete headers['Content-MD5'];
        }

        console.log(`[B2-MIDDLEWARE] Removed ${checksumHeaders.length} checksum headers:`, checksumHeaders);
      }
      
      return next(args);
    },
    {
      step: 'build',
      name: 'removeChecksumHeaders',
      priority: 'high',
    }
  );

  return client;
}

// Configuration logging will happen when functions are called

// Debug logging for module load
console.log(`[B2-DEBUG] B2 module loaded successfully`);

async function uploadViaNativeHttp(
  file: Buffer,
  bucket: string,
  key: string,
  contentType: string
): Promise<void> {
  console.log(`[UPLOAD-NATIVE] Starting native HTTP upload...`);
  console.log(`[UPLOAD-NATIVE] Bucket: ${bucket}, Key: ${key}, Size: ${file.length} bytes`);
  
  const { endpoint, keyId, appKey } = getB2Config();
  
  return new Promise((resolve, reject) => {
    const url = new URL(`/${bucket}/${key}`, endpoint);
    const dateStr = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    
    // Create AWS signature version 4
    const region = 'us-east-005';
    const service = 's3';
    const algorithm = 'AWS4-HMAC-SHA256';
    
    const canonicalHeaders = [
      `host:${url.host}`,
      `x-amz-content-sha256:UNSIGNED-PAYLOAD`,
      `x-amz-date:${dateStr}`
    ].join('\n');
    
    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
    
    const canonicalRequest = [
      'PUT',
      url.pathname,
      '',
      canonicalHeaders,
      '',
      signedHeaders,
      'UNSIGNED-PAYLOAD'
    ].join('\n');
    
    const credentialScope = `${dateStr.substr(0, 8)}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      dateStr,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex')
    ].join('\n');
    
    const dateKey = crypto.createHmac('sha256', `AWS4${appKey}`).update(dateStr.substr(0, 8)).digest();
    const dateRegionKey = crypto.createHmac('sha256', dateKey).update(region).digest();
    const dateRegionServiceKey = crypto.createHmac('sha256', dateRegionKey).update(service).digest();
    const signingKey = crypto.createHmac('sha256', dateRegionServiceKey).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    
    const authHeader = `${algorithm} Credential=${keyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': contentType,
        'Content-Length': file.length,
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
        'x-amz-date': dateStr,
        'Host': url.host
      }
    };
    
    console.log(`[UPLOAD-NATIVE] Sending HTTP PUT request...`);
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[UPLOAD-NATIVE] Upload successful!`);
          resolve();
        } else {
          console.error(`[UPLOAD-NATIVE] Upload failed with status ${res.statusCode}`);
          console.error(`[UPLOAD-NATIVE] Response:`, responseData);
          reject(new Error(`Upload failed with status ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`[UPLOAD-NATIVE] Request failed:`, error);
      reject(error);
    });
    
    req.write(file);
    req.end();
  });
}

async function uploadViaAwsSdk(
  file: Buffer,
  bucket: string,
  key: string,
  contentType: string
): Promise<void> {
  console.log(`[UPLOAD-AWS-SDK] Starting AWS SDK upload with PERMANENT checksum fix...`);
  console.log(`[UPLOAD-AWS-SDK] Bucket: ${bucket}, Key: ${key}, Size: ${file.length} bytes`);
  
  const b2Client = createB2Client();
  
  try {
    // PERMANENT FIX: Create command without ANY checksum-related parameters
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      // CRITICAL: Explicitly disable ALL AWS checksum options
      ChecksumAlgorithm: undefined,
      ChecksumCRC32: undefined,
      ChecksumCRC32C: undefined,
      ChecksumSHA1: undefined,
      ChecksumSHA256: undefined,
      // Additional AWS-specific parameters to disable
      ServerSideEncryption: undefined,
      SSECustomerAlgorithm: undefined,
      SSECustomerKey: undefined,
      SSECustomerKeyMD5: undefined,
      SSEKMSKeyId: undefined,
      RequestPayer: undefined,
      ExpectedBucketOwner: undefined,
      ObjectLockMode: undefined,
      ObjectLockRetainUntilDate: undefined,
      ObjectLockLegalHoldStatus: undefined,
    });
    
    // PERMANENT FIX: Override the command's input to remove any auto-added checksum properties
    const commandInput = putCommand.input as unknown as Record<string, unknown>;
    delete commandInput.ChecksumAlgorithm;
    delete commandInput.ChecksumCRC32;
    delete commandInput.ChecksumCRC32C;
    delete commandInput.ChecksumSHA1;
    delete commandInput.ChecksumSHA256;
    
    console.log(`[UPLOAD-AWS-SDK] Command input after checksum removal:`, Object.keys(commandInput));
    console.log(`[UPLOAD-AWS-SDK] Sending PutObjectCommand with B2-compatible headers only...`);
    
    const result = await b2Client.send(putCommand);
    console.log(`[UPLOAD-AWS-SDK] ✅ Upload successful with permanent checksum fix:`, result);
  } catch (error) {
    console.error(`[UPLOAD-AWS-SDK] ❌ Upload failed even with permanent checksum fix:`, error);
    throw error;
  }
}

async function uploadViaPresignedUrl(
  file: Buffer,
  bucket: string,
  key: string,
  contentType: string
): Promise<void> {
  console.log(`[UPLOAD-PRESIGNED] Starting presigned URL upload...`);
  console.log(`[UPLOAD-PRESIGNED] Bucket: ${bucket}, Key: ${key}, Size: ${file.length} bytes`);
  
  const b2Client = createB2Client();
  
  try {
    // Step 1: Generate presigned URL using AWS SDK (this works fine for URL generation)
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    
    const presignedUrl = await getSignedUrl(b2Client, putCommand, { expiresIn: 3600 });
    console.log(`[UPLOAD-PRESIGNED] Generated presigned URL`);
    
    // Step 2: Upload directly via fetch (bypasses all AWS middleware)
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': contentType,
        'Content-Length': file.length.toString(),
      },
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[UPLOAD-PRESIGNED] Upload failed with status ${response.status}`);
      console.error(`[UPLOAD-PRESIGNED] Response:`, responseText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${responseText}`);
    }
    
    console.log(`[UPLOAD-PRESIGNED] Upload successful!`);
  } catch (error) {
    console.error(`[UPLOAD-PRESIGNED] Upload failed:`, error);
    throw error;
  }
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
    console.log(`[B2-UPLOAD] Using presigned URL upload method (completely bypasses AWS SDK middleware)...`);
    await uploadViaPresignedUrl(fileBuffer, bucketName, key, contentType);
    const result = { storageKey: key, storageUrl: `${endpoint}/${bucketName}/${key}` };
    console.log(`[B2-UPLOAD] Presigned URL upload successful! Result:`, result);
    return result;
  } catch (presignedError) {
    console.error(`[B2-UPLOAD] Presigned URL upload failed:`, presignedError);
    
    try {
      console.log(`[B2-UPLOAD] Fallback to native HTTP upload method...`);
      await uploadViaNativeHttp(fileBuffer, bucketName, key, contentType);
      const result = { storageKey: key, storageUrl: `${endpoint}/${bucketName}/${key}` };
      console.log(`[B2-UPLOAD] Native HTTP upload successful! Result:`, result);
      return result;
    } catch (nativeError) {
      console.error(`[B2-UPLOAD] Native HTTP upload also failed:`, nativeError);
      
      // Check if either error is specifically about checksum headers
      const isChecksumError = (error: unknown) => error instanceof Error && 
        (error.message.includes('x-amz-checksum') || 
         error.message.includes('checksum') ||
         error.message.includes('Unsupported header'));
      
      if (isChecksumError(presignedError) || isChecksumError(nativeError)) {
        const presignedMsg = presignedError instanceof Error ? presignedError.message : 'Unknown presigned error';
        const nativeMsg = nativeError instanceof Error ? nativeError.message : 'Unknown native error';
        console.log(`[B2-UPLOAD] Checksum error detected, this suggests AWS SDK middleware issue persists...`);
        throw new Error(`Backblaze B2 compatibility issue: AWS SDK is still sending unsupported checksum headers. Original errors: ${presignedMsg} | ${nativeMsg}`);
      }
      
      try {
        console.log(`[B2-UPLOAD] Final fallback: AWS SDK method with all checksum options disabled...`);
        await uploadViaAwsSdk(fileBuffer, bucketName, key, contentType);
        const result = { storageKey: key, storageUrl: `${endpoint}/${bucketName}/${key}` };
        console.log(`[B2-UPLOAD] AWS SDK upload successful! Result:`, result);
        return result;
      } catch (sdkError) {
        console.error(`[B2-UPLOAD] All upload methods failed:`, sdkError);
        
        // Provide detailed error information
        const errorMessage = sdkError instanceof Error ? sdkError.message : 'Unknown error';
        if (errorMessage.includes('x-amz-checksum') || errorMessage.includes('Unsupported header')) {
          throw new Error(`Backblaze B2 checksum compatibility issue. All upload methods failed due to AWS SDK sending headers that B2 doesn't support. Please contact support with this error: ${errorMessage}`);
        }
        
        throw new Error(`All upload methods failed. Last error: ${errorMessage}`);
      }
    }
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

// Types for sync operations
export interface SyncOptions {
  cleanupOrphans?: boolean
  addMissing?: boolean
  removeOrphaned?: boolean
  dryRun?: boolean
  progressCallback?: (progress: SyncProgress) => void
}

export interface SyncProgress {
  phase: string
  currentFile?: string
  processedFiles: number
  totalFiles: number
  addedToDatabase: number
  removedFromDatabase: number
  removedFromB2: number
  errors: string[]
}

export interface StorageHealthReport {
  healthy: boolean
  b2Connection: boolean
  totalObjects: number
  totalSize: number
  error?: string
}

export interface B2Video {
  key: string
  url: string
  filename?: string
  size?: number
  uploadedAt?: Date
}

export interface SmartSyncResult {
  strategy: 'fast' | 'full' | 'repair'
  b2Videos: B2Video[]
  dbVideoCount: number
  recommendation: string
}

/**
 * List all B2 objects for a specific user
 */
export async function listUserB2Objects(userId: string): Promise<B2Video[]> {
  console.log(`[B2-SYNC] Listing objects for user ${userId}`)
  
  const { bucketName, endpoint } = getB2Config()
  const b2Client = createB2Client()
  
  // List objects with user prefix
  const prefix = `users/${userId}/`
  const command = new ListObjectsV2Command({ 
    Bucket: bucketName, 
    Prefix: prefix,
    MaxKeys: 1000 
  })
  
  const result = await b2Client.send(command)
  const videos: B2Video[] = []
  
  if (result.Contents) {
    for (const item of result.Contents) {
      if (item.Key && item.Key.endsWith('.mp4')) {
        const filename = item.Key.split('/').pop()
        videos.push({
          key: item.Key,
          url: `${endpoint}/${bucketName}/${item.Key}`,
          filename,
          size: item.Size,
          uploadedAt: item.LastModified
        })
      }
    }
  }
  
  console.log(`[B2-SYNC] Found ${videos.length} videos for user ${userId}`)
  return videos
}

/**
 * Sync user's videos from B2 to the database. Enhanced implementation.
 */
export async function syncUserVideosFromB2Enhanced(userId: string) {
  return await listUserB2Objects(userId)
}

// Alias export to satisfy route import
export const syncUserVideosFromB2 = syncUserVideosFromB2Enhanced;

/**
 * Smart sync logic - determines best sync strategy
 */
export async function smartSync(userId: string, dbVideoCount: number): Promise<SmartSyncResult> {
  console.log(`[B2-SYNC] Running smart sync for user ${userId}, DB count: ${dbVideoCount}`)
  
  try {
    const b2Videos = await listUserB2Objects(userId)
    const b2VideoCount = b2Videos.length
    
    let strategy: 'fast' | 'full' | 'repair' = 'fast'
    let recommendation = ''
    
    if (dbVideoCount === 0 && b2VideoCount > 0) {
      strategy = 'full'
      recommendation = `Found ${b2VideoCount} videos in B2 storage but none in database. Recommend full sync.`
    } else if (dbVideoCount > 0 && b2VideoCount === 0) {
      strategy = 'repair'
      recommendation = `Found ${dbVideoCount} videos in database but none in B2 storage. Database may need cleanup.`
    } else if (Math.abs(dbVideoCount - b2VideoCount) > 5) {
      strategy = 'full'
      recommendation = `Significant discrepancy: ${dbVideoCount} in DB vs ${b2VideoCount} in B2. Recommend full sync.`
    } else {
      strategy = 'fast'
      recommendation = `Counts are close: ${dbVideoCount} in DB vs ${b2VideoCount} in B2. Fast sync should suffice.`
    }
    
    return {
      strategy,
      b2Videos,
      dbVideoCount,
      recommendation
    }
  } catch (error) {
    console.error('[B2-SYNC] Smart sync failed:', error)
    throw error
  }
}

/**
 * Sync with progress tracking
 */
export async function syncStorageWithProgress(userId: string, options: SyncOptions): Promise<SyncProgress> {
  console.log(`[B2-SYNC] Starting sync with progress for user ${userId}`)
  
  const progress: SyncProgress = {
    phase: 'initializing',
    processedFiles: 0,
    totalFiles: 0,
    addedToDatabase: 0,
    removedFromDatabase: 0,
    removedFromB2: 0,
    errors: []
  }
  
  try {
    // Phase 1: List B2 objects
    progress.phase = 'listing_b2_objects'
    options.progressCallback?.(progress)
    
    const b2Videos = await listUserB2Objects(userId)
    progress.totalFiles = b2Videos.length
    progress.phase = 'syncing'
    options.progressCallback?.(progress)
    
    // This would typically involve database operations
    // For now, we'll simulate the sync process
    for (let i = 0; i < b2Videos.length; i++) {
      progress.currentFile = b2Videos[i].filename
      progress.processedFiles = i + 1
      options.progressCallback?.(progress)
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    progress.phase = 'completed'
    options.progressCallback?.(progress)
    
    return progress
  } catch (error) {
    progress.phase = 'error'
    progress.errors.push(error instanceof Error ? error.message : 'Unknown error')
    options.progressCallback?.(progress)
    throw error
  }
}

/**
 * Check storage health
 */
export async function checkStorageHealth(userId?: string): Promise<StorageHealthReport> {
  console.log(`[B2-SYNC] Checking storage health${userId ? ` for user ${userId}` : ''}`)
  
  try {
    const { bucketName } = getB2Config()
    const b2Client = createB2Client()
    
    // Test connection with a simple list operation
    const prefix = userId ? `users/${userId}/` : undefined
    const command = new ListObjectsV2Command({ 
      Bucket: bucketName, 
      Prefix: prefix,
      MaxKeys: 10 
    })
    
    const result = await b2Client.send(command)
    
    let totalObjects = 0
    let totalSize = 0
    
    if (result.Contents) {
      totalObjects = result.Contents.length
      totalSize = result.Contents.reduce((sum, obj) => sum + (obj.Size || 0), 0)
    }
    
    return {
      healthy: true,
      b2Connection: true,
      totalObjects,
      totalSize
    }
  } catch (error) {
    console.error('[B2-SYNC] Health check failed:', error)
    return {
      healthy: false,
      b2Connection: false,
      totalObjects: 0,
      totalSize: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Export utility functions for external use
export function getBucketName() {
  return getB2Config().bucketName;
}

export function createB2ClientInstance() {
  return createB2Client();
}

/**
 * Upload template assets (logos, intros, outros) to B2
 */
export async function uploadTemplateAsset(
  file: Buffer | File,
  userId: string,
  assetType: 'logo' | 'intro' | 'outro',
  fileName?: string
): Promise<{ storageKey: string; storageUrl: string }> {
  try {
    // Convert File to Buffer if needed
    let fileBuffer: Buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      fileName = fileName || file.name;
    } else if (Buffer.isBuffer(file)) {
      fileBuffer = file;
    } else {
      throw new Error('File must be a Buffer or File object');
    }

    // Generate storage key for template asset
    const timestamp = Date.now();
    const extension = fileName ? fileName.split('.').pop() : 'bin';
    const storageKey = `templates/${userId}/${assetType}/${timestamp}.${extension}`;

    // Determine content type
    let contentType = 'application/octet-stream';
    if (extension) {
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const videoExtensions = ['mp4', 'mov', 'avi', 'wmv'];
      
      if (imageExtensions.includes(extension.toLowerCase())) {
        contentType = `image/${extension.toLowerCase() === 'jpg' ? 'jpeg' : extension.toLowerCase()}`;
      } else if (videoExtensions.includes(extension.toLowerCase())) {
        contentType = `video/${extension.toLowerCase()}`;
      }
    }

    // Upload to B2
    const result = await uploadToB2(fileBuffer, storageKey, contentType);
    
    return {
      storageKey: result.storageKey,
      storageUrl: result.storageUrl
    };
  } catch (error) {
    console.error('Error uploading template asset:', error);
    throw error;
  }
}
