import crypto from 'node:crypto'

/**
 * Verify HMAC webhook signature using constant-time comparison accross any provider.
 * Must receive raw body (text) before JSON parsing for signature check.
 * 
 * @param rawBody  - raw request body string
 * @param signature - signature from the request header
 * @param secret   - webhook secret used to generate the HMAC
 * @param algorithm - Hash algorithm (default: 'sha256')
 * @returns true if signature is valid
 */

export function verifyHmacSignature(
    rawBody: string,
    signature: string,
    secret: string,
    algorithm: string = 'sha256',
): boolean {
    const digest = crypto
        .createHmac(algorithm, secret)
        .update(rawBody)
        .digest('hex')

    if (signature.length !== digest.length) {
        return false
    }

    return crypto.timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(digest, 'utf8'),
    )
}
