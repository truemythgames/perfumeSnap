#!/bin/sh
set -e

# Prebuilt RN/Hermes xcframeworks ship without dSYMs. App Store Connect expects
# matching dSYM bundles in the archive. Generate them from the embedded binaries.

if [ "${CONFIGURATION}" != "Release" ]; then
  exit 0
fi

generate_dsym() {
  framework_name="$1"
  binary_name="$2"

  embedded_bin="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/${framework_name}.framework/${binary_name}"

  if [ ! -f "$embedded_bin" ]; then
    echo "warning: ${framework_name} binary not found at ${embedded_bin}, skipping dSYM"
    return 0
  fi

  dsym_output="${DWARF_DSYM_FOLDER_PATH}/${framework_name}.framework.dSYM"
  need_regen=1

  if [ -d "$dsym_output" ]; then
    bin_uuids="$(dwarfdump --uuid "$embedded_bin" 2>/dev/null | awk '{print $2}' | sort | tr '\n' ' ')"
    dsym_uuids="$(dwarfdump --uuid "$dsym_output" 2>/dev/null | awk '{print $2}' | sort | tr '\n' ' ')"
    if [ -n "$bin_uuids" ] && [ "$bin_uuids" = "$dsym_uuids" ]; then
      need_regen=0
      echo "${framework_name}: dSYM already present and UUIDs match"
    else
      echo "${framework_name}: dSYM UUID mismatch, regenerating"
    fi
  else
    echo "${framework_name}: dSYM missing, generating"
  fi

  if [ "$need_regen" -eq 1 ]; then
    rm -rf "$dsym_output"
    dsymutil "$embedded_bin" -o "$dsym_output"
    echo "${framework_name}: dSYM generated"
  fi
}

generate_dsym "hermes" "hermes"
generate_dsym "React" "React"
generate_dsym "ReactNativeDependencies" "ReactNativeDependencies"

exit 0
