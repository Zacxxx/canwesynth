#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

find_fl_prefix() {
    local home="${1:-$HOME}"
    local override="${2:-${CANWESYNTH_FL_PREFIX:-}}"

    if [[ -n "$override" ]]; then
        printf '%s\n' "$override"
        return
    fi

    local candidate
    for candidate in \
        "$home/.local/share/fl-studio-proton/pfx" \
        "$home/.wine" \
        "$home/.local/share/bottles/bottles/FL-Studio"
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
        rm -rf -- "$destination"
        cp -a -- "$source" "$destination"
        printf 'Installed %s\n' "$destination"
    fi
}

main() {
    local build_dir="${CANWESYNTH_BUILD_DIR:-$PROJECT_DIR/build}"
    local install_root="${XDG_DATA_HOME:-$HOME/.local/share}/canwesynth"
    local bin_dir="${HOME}/.local/bin"
    local native_vst3_dir="${HOME}/.vst3"
    local native_clap_dir="${HOME}/.clap"
    local windows_vst3="${CANWESYNTH_WINDOWS_VST3:-$PROJECT_DIR/release/windows/CanWeSynth.vst3}"
    local resolved_prefix

    mkdir -p "$install_root" "$bin_dir" "$native_vst3_dir" "$native_clap_dir"

    copy_bundle "$build_dir/bin/CanWeSynth.vst3" \
        "$native_vst3_dir/CanWeSynth.vst3"
    copy_bundle "$build_dir/bin/CanWeSynth.clap" \
        "$native_clap_dir/CanWeSynth.clap"

    if [[ -x "$build_dir/bin/CanWeSynth" ]]; then
        copy_bundle "$build_dir/bin/CanWeSynth" "$install_root/CanWeSynth"
        ln -sfn "$install_root/CanWeSynth" "$bin_dir/canwesynth-standalone"
    fi

    resolved_prefix="$(find_fl_prefix || true)"
    if [[ -e "$windows_vst3" && -n "$resolved_prefix" ]]; then
        local windows_plugin_dir="$resolved_prefix/drive_c/Program Files/Common Files/VST3"
        copy_bundle "$windows_vst3" "$windows_plugin_dir/CanWeSynth.vst3"
        printf 'FL Studio prefix: %s\n' "$resolved_prefix"
    elif [[ -e "$windows_vst3" ]]; then
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
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    main "$@"
fi
