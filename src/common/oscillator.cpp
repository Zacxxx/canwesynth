#include "canwesynth/oscillator.hpp"

#include <algorithm>
#include <cmath>
#include <numbers>

namespace canwesynth {

void Oscillator::set_sample_rate(const double sample_rate) noexcept {
    sample_rate_ = std::max(1.0, sample_rate);
}

void Oscillator::set_frequency(const double frequency) noexcept {
    frequency_ = std::clamp(frequency, 0.0, sample_rate_ * 0.45);
}

void Oscillator::set_waveform(const Waveform waveform) noexcept {
    waveform_ = waveform;
}

void Oscillator::reset(const double phase) noexcept {
    phase_ = phase - std::floor(phase);
    triangle_state_ = 0.0;
}

double Oscillator::poly_blep(const double phase, const double increment) noexcept {
    if (increment <= 0.0) {
        return 0.0;
    }
    if (phase < increment) {
        const double x = phase / increment;
        return x + x - x * x - 1.0;
    }
    if (phase > 1.0 - increment) {
        const double x = (phase - 1.0) / increment;
        return x * x + x + x + 1.0;
    }
    return 0.0;
}

float Oscillator::next_sample() noexcept {
    const double increment = frequency_ / sample_rate_;
    double sample = 0.0;

    switch (waveform_) {
    case Waveform::sine:
        sample = std::sin(2.0 * std::numbers::pi * phase_);
        break;
    case Waveform::saw:
        sample = 2.0 * phase_ - 1.0;
        sample -= poly_blep(phase_, increment);
        break;
    case Waveform::square: {
        sample = phase_ < 0.5 ? 1.0 : -1.0;
        sample += poly_blep(phase_, increment);
        double falling_phase = phase_ + 0.5;
        if (falling_phase >= 1.0) {
            falling_phase -= 1.0;
        }
        sample -= poly_blep(falling_phase, increment);
        break;
    }
    case Waveform::triangle: {
        double square = phase_ < 0.5 ? 1.0 : -1.0;
        square += poly_blep(phase_, increment);
        double falling_phase = phase_ + 0.5;
        if (falling_phase >= 1.0) {
            falling_phase -= 1.0;
        }
        square -= poly_blep(falling_phase, increment);
        triangle_state_ += square * increment * 4.0;
        triangle_state_ *= 0.9995;
        sample = std::clamp(triangle_state_, -1.0, 1.0);
        break;
    }
    }

    phase_ += increment;
    phase_ -= std::floor(phase_);
    return static_cast<float>(sample);
}

} // namespace canwesynth
