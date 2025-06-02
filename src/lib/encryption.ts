// Encryption utilities for secure token storage
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 64

/**
 * Encrypt text using AES-256-GCM
 */
export function encrypt(text: string, key?: string): string {
  try {
    const encryptionKey = key || process.env.OAUTH_ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('Encryption key not provided')
    }

    // Generate random salt
    const salt = crypto.randomBytes(SALT_LENGTH)

    // Derive key from password using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha512')

    // Create cipher
    const cipher = crypto.createCipher(ALGORITHM, derivedKey)
    cipher.setAAD(salt) // Use salt as additional authenticated data

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get the authentication tag
    const tag = cipher.getAuthTag()

    // Combine salt, tag, and encrypted data
    const result = salt.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted

    return result
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt text using AES-256-GCM
 */
export function decrypt(encryptedText: string, key?: string): string {
  try {
    const encryptionKey = key || process.env.OAUTH_ENCRYPTION_KEY
    if (!encryptionKey) {
      throw new Error('Encryption key not provided')
    }

    // Split the encrypted text into components
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const salt = Buffer.from(parts[0], 'hex')
    const tag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    // Derive the same key
    const derivedKey = crypto.pbkdf2Sync(encryptionKey, salt, 100000, 32, 'sha512')

    // Create decipher
    const decipher = crypto.createDecipher(ALGORITHM, derivedKey)
    decipher.setAuthTag(tag)
    decipher.setAAD(salt)

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Generate a secure encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash a string using SHA-256
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

/**
 * Verify if encryption key is valid
 */
export function isValidEncryptionKey(key: string): boolean {
  try {
    // Test encryption/decryption with the key
    const testData = 'test'
    const encrypted = encrypt(testData, key)
    const decrypted = decrypt(encrypted, key)
    return decrypted === testData
  } catch {
    return false
  }
}
