#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
source "$ROOT_DIR/scripts/install.sh"

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

assert_eq() {
    local expected="$1"
    local actual="$2"
    local label="$3"

    if [[ "$actual" != "$expected" ]]; then
        printf 'not ok - %s\nexpected: %s\nactual:   %s\n' "$label" "$expected" "$actual" >&2
        exit 1
    fi
}

new_home() {
    mktemp -d "$TMP_ROOT/home.XXXXXX"
}

detect_with_home() {
    local home="$1"
    local override="${2:-}"

    (
        export HOME="$home"
        if [[ -n "$override" ]]; then
            export CANWESYNTH_FL_PREFIX="$override"
        else
            unset CANWESYNTH_FL_PREFIX
        fi
        find_fl_prefix
    )
}

assert_within_temp_home() {
    local value="$1"
    local home="$2"
    local label="$3"

    case "$value" in
        "$home"/* | "$home") ;;
        *)
            printf 'not ok - %s escaped temporary HOME: %s\n' "$label" "$value" >&2
            exit 1
            ;;
    esac
}

home="$(new_home)"
override="$home/custom-prefix"
mkdir -p "$home/.wine/drive_c"
actual="$(detect_with_home "$home" "$override")"
assert_eq "$override" "$actual" "CANWESYNTH_FL_PREFIX override wins"
assert_within_temp_home "$actual" "$home" "override"

home="$(new_home)"
expected="$home/.local/share/fl-studio-proton/pfx"
mkdir -p "$expected/drive_c"
actual="$(detect_with_home "$home")"
assert_eq "$expected" "$actual" "dedicated FL Studio Proton prefix is detected"
assert_within_temp_home "$actual" "$home" "fl-studio-proton"

home="$(new_home)"
expected="$home/.wine"
mkdir -p "$expected/drive_c"
actual="$(detect_with_home "$home")"
assert_eq "$expected" "$actual" "default Wine prefix is detected"
assert_within_temp_home "$actual" "$home" "default wine"

home="$(new_home)"
expected="$home/.local/share/bottles/bottles/FL-Studio"
mkdir -p "$expected/drive_c"
actual="$(detect_with_home "$home")"
assert_eq "$expected" "$actual" "Bottles FL Studio prefix is detected"
assert_within_temp_home "$actual" "$home" "bottles"

home="$(new_home)"
expected="$home/.local/share/fl-studio-proton/pfx"
mkdir -p \
    "$expected/drive_c" \
    "$home/.wine/drive_c" \
    "$home/.local/share/bottles/bottles/FL-Studio/drive_c"
actual="$(detect_with_home "$home")"
assert_eq "$expected" "$actual" "first existing prefix wins deterministically"
assert_within_temp_home "$actual" "$home" "first-choice"

home="$(new_home)"
build_dir="$TMP_ROOT/build"
windows_vst3="$TMP_ROOT/windows/CanWeSynth.vst3"
windows_destination="$home/.wine/drive_c/Program Files/Common Files/VST3/CanWeSynth.vst3"

mkdir -p \
    "$build_dir/bin/CanWeSynth.vst3/Contents" \
    "$build_dir/bin/CanWeSynth.clap/Contents" \
    "$home/.wine/drive_c" \
    "$windows_vst3/Contents"
printf 'native vst3\n' > "$build_dir/bin/CanWeSynth.vst3/Contents/plugin.txt"
printf 'native clap\n' > "$build_dir/bin/CanWeSynth.clap/Contents/plugin.txt"
printf '#!/usr/bin/env bash\n' > "$build_dir/bin/CanWeSynth"
chmod +x "$build_dir/bin/CanWeSynth"
printf 'windows vst3\n' > "$windows_vst3/Contents/plugin.txt"

(
    export HOME="$home"
    export CANWESYNTH_BUILD_DIR="$build_dir"
    export CANWESYNTH_WINDOWS_VST3="$windows_vst3"
    unset XDG_DATA_HOME
    unset CANWESYNTH_FL_PREFIX
    main >/dev/null
    main >/dev/null
)

[[ -e "$home/.vst3/CanWeSynth.vst3/Contents/plugin.txt" ]]
[[ -e "$home/.clap/CanWeSynth.clap/Contents/plugin.txt" ]]
[[ -e "$windows_destination/Contents/plugin.txt" ]]
[[ -L "$home/.local/bin/canwesynth-standalone" ]]
[[ ! -e "$home/.vst3/CanWeSynth.vst3/CanWeSynth.vst3" ]]
[[ ! -e "$home/.clap/CanWeSynth.clap/CanWeSynth.clap" ]]
[[ ! -e "$windows_destination/CanWeSynth.vst3" ]]

printf 'ok - install prefix selection fixtures passed\n'
