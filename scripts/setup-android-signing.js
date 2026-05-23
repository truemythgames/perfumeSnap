#!/usr/bin/env node
/**
 * Generate upload keystore + android/keystore.properties for Play Store releases.
 * Run once: npm run android:setup-signing
 *
 * BACK UP release.keystore and passwords — losing them blocks future Play updates.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const androidDir = path.join(__dirname, '..', 'android');
const keystorePath = path.join(androidDir, 'app', 'release.keystore');
const propsPath = path.join(androidDir, 'keystore.properties');

if (fs.existsSync(keystorePath)) {
  console.log('Upload keystore already exists:', keystorePath);
  console.log('Delete it first if you want to regenerate.');
  process.exit(0);
}

const password = crypto.randomBytes(16).toString('base64url');
const alias = 'perfumesnap-upload';

const dname = 'CN=PerfumeSnap, OU=Mobile, O=PerfumeSnap, L=Unknown, ST=Unknown, C=US';

execSync(
  [
    'keytool -genkeypair -v',
    '-storetype PKCS12',
    `-keystore "${keystorePath}"`,
    `-alias ${alias}`,
    '-keyalg RSA',
    '-keysize 2048',
    '-validity 10000',
    `-storepass ${password}`,
    `-keypass ${password}`,
    `-dname "${dname}"`,
  ].join(' '),
  { stdio: 'inherit' },
);

const props = [
  'storeFile=release.keystore',
  `storePassword=${password}`,
  `keyAlias=${alias}`,
  `keyPassword=${password}`,
  '',
].join('\n');

fs.writeFileSync(propsPath, props);

console.log('\n✓ Created upload keystore and keystore.properties');
console.log('  Keystore:', keystorePath);
console.log('  Alias:   ', alias);
console.log('\n⚠️  SAVE THESE PASSWORDS (also in android/keystore.properties):');
console.log('  Store/key password:', password);
console.log('\nBack up release.keystore somewhere safe. You need the same key for every Play update.');
