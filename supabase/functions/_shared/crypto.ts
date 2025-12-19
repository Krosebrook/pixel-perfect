/**
 * Cryptographic utilities for secure hashing and verification
 */

/**
 * Hash a string using SHA-256 with a salt
 */
export async function hashWithSalt(value: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a random salt
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a value against a hash with timing-safe comparison
 */
export async function verifyHash(value: string, salt: string, expectedHash: string): Promise<boolean> {
  const computedHash = await hashWithSalt(value, salt);
  
  // Timing-safe comparison
  if (computedHash.length !== expectedHash.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  
  return result === 0;
}
