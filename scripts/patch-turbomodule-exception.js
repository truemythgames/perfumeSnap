#!/usr/bin/env node
/**
 * React Native 0.81 turns an NSException from an async void TurboModule
 * into a JS error on the native queue. That touches Hermes off the JS
 * thread and crashes on iOS 26. Rethrow the exception instead, matching
 * the fix that landed in React Native 0.83.
 */
const fs = require('fs');
const path = require('path');

const file = path.join(
  __dirname,
  '../node_modules/react-native/ReactCommon/react/nativemodule/core/platform/ios/ReactCommon/RCTTurboModule.mm'
);

if (!fs.existsSync(file)) {
  process.exit(0);
}

const source = fs.readFileSync(file, 'utf8');
const broken = `    } @catch (NSException *exception) {
      throw convertNSExceptionToJSError(runtime, exception, std::string{moduleName}, methodNameStr);
    } @finally {
      [retainedObjectsForInvocation removeAllObjects];
    }

    if (shouldVoidMethodsExecuteSync_) {`;

const fixed = `    } @catch (NSException *exception) {
      // Void methods run on the native invoker queue. Converting the
      // NSException into a JSError here touches the Hermes runtime off the
      // JS thread and crashes on iOS 26. Rethrow instead, matching RN 0.83+.
      @throw exception;
    } @finally {
      [retainedObjectsForInvocation removeAllObjects];
    }

    if (shouldVoidMethodsExecuteSync_) {`;

if (source.includes(fixed)) {
  process.exit(0);
}

if (!source.includes(broken)) {
  console.warn('patch-turbomodule-exception: expected catch block was not found');
  process.exit(0);
}

fs.writeFileSync(file, source.replace(broken, fixed));
console.log('patch-turbomodule-exception: updated RCTTurboModule.mm');
