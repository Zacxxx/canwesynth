#include "canwesynth/poly_synth.hpp"

#include <algorithm>

namespace canwesynth {

void PolySynth::set_sample_rate(const double sample_rate) noexcept {
    for (auto& voice : voices_) {
        voice.set_sample_rate(sample_rate);
    }
}

void PolySynth::set_waveform(const Waveform waveform) noexcept {
    for (auto& voice : voices_) {
        voice.set_waveform(waveform);
    }
}

void PolySynth::set_cutoff(const double cutoff_hz) noexcept {
    for (auto& voice : voices_) {
        voice.set_cutoff(cutoff_hz);
    }
}

void PolySynth::set_envelope(
    const double attack_seconds,
    const double decay_seconds,
    const double sustain,
    const double release_seconds) noexcept {
    for (auto& voice : voices_) {
        voice.set_envelope(
            attack_seconds, decay_seconds, sustain, release_seconds);
    }
}

SynthVoice& PolySynth::voice_for_note_on() noexcept {
    const auto inactive = std::find_if(
        voices_.begin(), voices_.end(), [](const auto& voice) {
            return !voice.is_active();
        });
    if (inactive != voices_.end()) {
        return *inactive;
    }
    return *std::min_element(
        voices_.begin(), voices_.end(), [](const auto& left, const auto& right) {
            return left.age() < right.age();
        });
}

void PolySynth::note_on(const std::uint8_t note, const float velocity) noexcept {
    voice_for_note_on().note_on(note, velocity, ++age_);
}

void PolySynth::note_off(const std::uint8_t note) noexcept {
    for (auto& voice : voices_) {
        voice.note_off(note);
    }
}

float PolySynth::next_sample() noexcept {
    float output = 0.0F;
    for (auto& voice : voices_) {
        if (voice.is_active()) {
            output += voice.next_sample();
        }
    }
    return output / 4.0F;
}

std::size_t PolySynth::active_voice_count() const noexcept {
    return static_cast<std::size_t>(std::count_if(
        voices_.begin(), voices_.end(), [](const auto& voice) {
            return voice.is_active();
        }));
}

} // namespace canwesynth
