#!/usr/bin/env node
/**
 * Bump versionCode, build release AAB, open Android Studio + output folder.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { bump } = require('./bump-android-build');

const root = path.join(__dirname, '..');
const androidDir = path.join(root, 'android');
const localPropsPath = path.join(androidDir, 'local.properties');
const sdkPath = path.join(process.env.HOME || '', 'Library/Android/sdk');

function ensureLocalProperties() {
  if (fs.existsSync(localPropsPath)) return;

  if (!fs.existsSync(sdkPath)) {
    console.error('Android SDK not found at', sdkPath);
    console.error('Install Android Studio and the SDK, then retry.');
    process.exit(1);
  }

  fs.writeFileSync(localPropsPath, `sdk.dir=${sdkPath}\n`);
  console.log('Created android/local.properties');
}

function main() {
  bump();
  ensureLocalProperties();

  console.log('\nBuilding release app bundle (AAB)...');
  execSync('./gradlew bundleRelease', {
    cwd: androidDir,
    stdio: 'inherit',
  });

  const aabPath = path.join(
    androidDir,
    'app/build/outputs/bundle/release/app-release.aab',
  );

  if (!fs.existsSync(aabPath)) {
    console.error('AAB not found at expected path:', aabPath);
    process.exit(1);
  }

  console.log('\nRelease AAB:', aabPath);

  try {
    execSync(`open -a "Android Studio" "${androidDir}"`, { stdio: 'ignore' });
    console.log('Opened Android Studio');
  } catch {
    console.log('Could not open Android Studio automatically.');
  }

  try {
    execSync(`open -R "${aabPath}"`, { stdio: 'ignore' });
    console.log('Revealed AAB in Finder');
  } catch {
    // ignore
  }
}

main();
