#pragma once

#include "canwesynth/oscillator.hpp"
#include "canwesynth/synth_voice.hpp"

#include <array>
#include <cstddef>
#include <cstdint>

namespace canwesynth {

class PolySynth {
public:
    static constexpr std::size_t max_voices = 16;

    void set_sample_rate(double sample_rate) noexcept;
    void set_waveform(Waveform waveform) noexcept;
    void set_cutoff(double cutoff_hz) noexcept;
    void set_envelope(
        double attack_seconds,
        double decay_seconds,
        double sustain,
        double release_seconds) noexcept;
    void note_on(std::uint8_t note, float velocity) noexcept;
    void note_off(std::uint8_t note) noexcept;
    [[nodiscard]] float next_sample() noexcept;
    [[nodiscard]] std::size_t active_voice_count() const noexcept;

private:
    [[nodiscard]] SynthVoice& voice_for_note_on() noexcept;

    std::array<SynthVoice, max_voices> voices_;
    std::uint64_t age_ = 0;
};

} // namespace canwesynth
