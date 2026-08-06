// Generate the ADMIN_PASS_HASH secret value for the Printopack admin login.
// The password never leaves your machine; only the hash is stored as a Cloudflare secret.
//
//   node scripts/hash-password.mjs 'the-marketing-password'
//   wrangler pages secret put ADMIN_PASS_HASH --project-name printopack   (paste the output)
import { webcrypto as crypto } from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs '<password>'");
  process.exit(1);
}
const iterations = 100000; // Cloudflare Workers caps PBKDF2 at 100,000 and throws above it
const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }, key, 256);
const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
console.log(`pbkdf2$${iterations}$${b64url(salt)}$${b64url(new Uint8Array(bits))}`);
