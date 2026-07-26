#pragma once

#include <cstdint>

namespace canwesynth {

enum class Waveform : std::uint8_t {
    sine = 0,
    saw = 1,
    square = 2,
    triangle = 3,
};

class Oscillator {
public:
    void set_sample_rate(double sample_rate) noexcept;
    void set_frequency(double frequency) noexcept;
    void set_waveform(Waveform waveform) noexcept;
    void reset(double phase = 0.0) noexcept;
    [[nodiscard]] float next_sample() noexcept;

private:
    [[nodiscard]] static double poly_blep(double phase, double increment) noexcept;

    double sample_rate_ = 48000.0;
    double frequency_ = 440.0;
    double phase_ = 0.0;
    double triangle_state_ = 0.0;
    Waveform waveform_ = Waveform::saw;
};

} // namespace canwesynth
