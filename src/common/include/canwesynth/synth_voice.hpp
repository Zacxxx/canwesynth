#pragma once

#include "canwesynth/envelope.hpp"
#include "canwesynth/filter.hpp"
#include "canwesynth/oscillator.hpp"

#include <cstdint>

namespace canwesynth {

class SynthVoice {
public:
    void set_sample_rate(double sample_rate) noexcept;
    void set_waveform(Waveform waveform) noexcept;
    void set_cutoff(double cutoff_hz) noexcept;
    void set_envelope(
        double attack_seconds,
        double decay_seconds,
        double sustain,
        double release_seconds) noexcept;
    void note_on(std::uint8_t note, float velocity, std::uint64_t age) noexcept;
    void note_off(std::uint8_t note) noexcept;
    [[nodiscard]] float next_sample() noexcept;
    [[nodiscard]] bool is_active() const noexcept;
    [[nodiscard]] std::uint8_t note() const noexcept;
    [[nodiscard]] std::uint64_t age() const noexcept;

private:
    Oscillator oscillator_;
    AdsrEnvelope envelope_;
    LowPassFilter filter_;
    std::uint8_t note_ = 0;
    float velocity_ = 0.0F;
    std::uint64_t age_ = 0;
};

} // namespace canwesynth
