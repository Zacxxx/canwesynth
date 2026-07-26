#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${CANWESYNTH_BUILD_DIR:-$PROJECT_DIR/build}"
INSTALL_ROOT="${XDG_DATA_HOME:-$HOME/.local/share}/canwesynth"
BIN_DIR="${HOME}/.local/bin"
NATIVE_VST3_DIR="${HOME}/.vst3"
NATIVE_CLAP_DIR="${HOME}/.clap"
FL_PREFIX="${CANWESYNTH_FL_PREFIX:-}"

find_fl_prefix() {
    if [[ -n "$FL_PREFIX" ]]; then
        printf '%s\n' "$FL_PREFIX"
        return
    fi

    local candidate
    for candidate in \
        "$HOME/.local/share/fl-studio-proton/pfx" \
        "$HOME/.wine" \
        "$HOME/.local/share/bottles/bottles/FL-Studio"
    do
        if [[ -d "$candidate/drive_c" ]]; then
            printf '%s\n' "$candidate"
            return
        fi
    done
}

copy_bundle() {
    local source="$1"
    local destination="$2"
    if [[ -e "$source" ]]; then
        mkdir -p "$(dirname -- "$destination")"
        cp -a -- "$source" "$destination"
        printf 'Installed %s\n' "$destination"
    fi
}

mkdir -p "$INSTALL_ROOT" "$BIN_DIR" "$NATIVE_VST3_DIR" "$NATIVE_CLAP_DIR"

copy_bundle "$BUILD_DIR/bin/CanWeSynth.vst3" \
    "$NATIVE_VST3_DIR/CanWeSynth.vst3"
copy_bundle "$BUILD_DIR/bin/CanWeSynth.clap" \
    "$NATIVE_CLAP_DIR/CanWeSynth.clap"

if [[ -x "$BUILD_DIR/bin/CanWeSynth" ]]; then
    copy_bundle "$BUILD_DIR/bin/CanWeSynth" "$INSTALL_ROOT/CanWeSynth"
    ln -sfn "$INSTALL_ROOT/CanWeSynth" "$BIN_DIR/canwesynth-standalone"
fi

WINDOWS_VST3="${CANWESYNTH_WINDOWS_VST3:-$PROJECT_DIR/release/windows/CanWeSynth.vst3}"
RESOLVED_PREFIX="$(find_fl_prefix || true)"
if [[ -e "$WINDOWS_VST3" && -n "$RESOLVED_PREFIX" ]]; then
    WINDOWS_PLUGIN_DIR="$RESOLVED_PREFIX/drive_c/Program Files/Common Files/VST3"
    copy_bundle "$WINDOWS_VST3" "$WINDOWS_PLUGIN_DIR/CanWeSynth.vst3"
    printf 'FL Studio prefix: %s\n' "$RESOLVED_PREFIX"
elif [[ -e "$WINDOWS_VST3" ]]; then
    printf '%s\n' \
        "Windows VST3 found, but no FL Studio prefix was detected." \
        "Re-run with CANWESYNTH_FL_PREFIX=/path/to/prefix."
else
    printf '%s\n' \
        "Windows VST3 not present; native artifacts were installed." \
        "Download the Windows release artifact to release/windows/ for FL Studio under Wine/Proton."
fi

printf '%s\n' \
    "Installation complete. Rescan plugins in your DAW." \
    "No system directories or sudo privileges were used."
