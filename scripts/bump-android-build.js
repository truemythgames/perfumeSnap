#!/usr/bin/env node
/**
 * Bump Android versionCode across app.config.ts and android/app/build.gradle.
 * Run before Play Store export: npm run android:export
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appConfigPath = path.join(root, 'app.config.ts');
const buildGradlePath = path.join(root, 'android/app/build.gradle');

function readBuildNumbers() {
  const appConfig = fs.readFileSync(appConfigPath, 'utf8');
  const buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

  const fromConfig = Number((appConfig.match(/versionCode:\s*(\d+)/) || [])[1]);
  const fromIos = Number((appConfig.match(/buildNumber:\s*['"](\d+)['"]/) || [])[1]);
  const fromGradle = Number((buildGradle.match(/versionCode\s+(\d+)/) || [])[1]);

  return { fromConfig, fromIos, fromGradle };
}

function bump() {
  const current = readBuildNumbers();
  const max = Math.max(
    current.fromConfig || 0,
    current.fromGradle || 0,
    current.fromIos || 0,
  );
  const next = max + 1;
  const nextStr = String(next);

  let appConfig = fs.readFileSync(appConfigPath, 'utf8');
  if (/versionCode:\s*\d+/.test(appConfig)) {
    appConfig = appConfig.replace(/versionCode:\s*\d+/, `versionCode: ${next}`);
  } else {
    appConfig = appConfig.replace(
      /(android:\s*\{)/,
      `$1\n    versionCode: ${next},`,
    );
  }
  fs.writeFileSync(appConfigPath, appConfig);

  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  buildGradle = buildGradle.replace(/versionCode\s+\d+/, `versionCode ${next}`);
  fs.writeFileSync(buildGradlePath, buildGradle);

  console.log(`Android versionCode: ${max} → ${next}`);
  console.log('Updated: app.config.ts, android/app/build.gradle');
  return next;
}

if (require.main === module) {
  bump();
}

module.exports = { bump, readBuildNumbers };
