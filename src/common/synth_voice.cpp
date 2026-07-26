#include "canwesynth/synth_voice.hpp"

#include <cmath>

namespace canwesynth {

void SynthVoice::set_sample_rate(const double sample_rate) noexcept {
    oscillator_.set_sample_rate(sample_rate);
    envelope_.set_sample_rate(sample_rate);
    filter_.set_sample_rate(sample_rate);
}

void SynthVoice::set_waveform(const Waveform waveform) noexcept {
    oscillator_.set_waveform(waveform);
}

void SynthVoice::set_cutoff(const double cutoff_hz) noexcept {
    filter_.set_cutoff(cutoff_hz);
}

void SynthVoice::set_envelope(
    const double attack_seconds,
    const double decay_seconds,
    const double sustain,
    const double release_seconds) noexcept {
    envelope_.set_parameters(
        attack_seconds, decay_seconds, sustain, release_seconds);
}

void SynthVoice::note_on(
    const std::uint8_t note,
    const float velocity,
    const std::uint64_t age) noexcept {
    note_ = note;
    velocity_ = velocity;
    age_ = age;
    const double frequency = 440.0 * std::exp2(
        (static_cast<double>(note) - 69.0) / 12.0);
    oscillator_.set_frequency(frequency);
    oscillator_.reset();
    filter_.reset();
    envelope_.reset();
    envelope_.note_on();
}

void SynthVoice::note_off(const std::uint8_t note) noexcept {
    if (note == note_) {
        envelope_.note_off();
    }
}

float SynthVoice::next_sample() noexcept {
    return filter_.process(oscillator_.next_sample()) *
        envelope_.next_sample() * velocity_;
}

bool SynthVoice::is_active() const noexcept {
    return envelope_.is_active();
}

std::uint8_t SynthVoice::note() const noexcept {
    return note_;
}

std::uint64_t SynthVoice::age() const noexcept {
    return age_;
}

} // namespace canwesynth
