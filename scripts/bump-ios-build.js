#!/usr/bin/env node
/**
 * Bump iOS build number across app.config.ts, Info.plist, and project.pbxproj.
 * Run before archiving in Xcode: npm run ios:xcode
 */

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const appConfigPath = path.join(root, 'app.config.ts');
const infoPlistPath = path.join(root, 'ios/PerfumeSnap/Info.plist');
const pbxprojPath = path.join(root, 'ios/PerfumeSnap.xcodeproj/project.pbxproj');

function readBuildNumbers() {
  const appConfig = fs.readFileSync(appConfigPath, 'utf8');
  const infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
  const pbxproj = fs.readFileSync(pbxprojPath, 'utf8');

  const fromConfig = Number((appConfig.match(/buildNumber:\s*['"](\d+)['"]/) || [])[1]);
  const fromPlist = Number((infoPlist.match(/<key>CFBundleVersion<\/key>\s*<string>(\d+)<\/string>/) || [])[1]);
  const fromPbx = Number((pbxproj.match(/CURRENT_PROJECT_VERSION = (\d+);/) || [])[1]);

  return { fromConfig, fromPlist, fromPbx };
}

function bump() {
  const current = readBuildNumbers();
  const max = Math.max(current.fromConfig || 0, current.fromPlist || 0, current.fromPbx || 0);
  const next = max + 1;
  const nextStr = String(next);

  let appConfig = fs.readFileSync(appConfigPath, 'utf8');
  appConfig = appConfig.replace(/buildNumber:\s*['"]\d+['"]/, `buildNumber: '${nextStr}'`);
  fs.writeFileSync(appConfigPath, appConfig);

  let infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
  infoPlist = infoPlist.replace(
    /(<key>CFBundleVersion<\/key>\s*<string>)\d+(<\/string>)/,
    `$1${nextStr}$2`
  );
  fs.writeFileSync(infoPlistPath, infoPlist);

  let pbxproj = fs.readFileSync(pbxprojPath, 'utf8');
  pbxproj = pbxproj.replace(/CURRENT_PROJECT_VERSION = \d+;/g, `CURRENT_PROJECT_VERSION = ${nextStr};`);
  fs.writeFileSync(pbxprojPath, pbxproj);

  console.log(`iOS build number: ${max} → ${next}`);
  console.log('Updated: app.config.ts, Info.plist, project.pbxproj');
  return next;
}

if (require.main === module) {
  bump();
}

module.exports = { bump, readBuildNumbers };
