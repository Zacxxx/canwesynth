#include "canwesynth/filter.hpp"

#include <algorithm>
#include <cmath>
#include <numbers>

namespace canwesynth {

void LowPassFilter::set_sample_rate(const double sample_rate) noexcept {
    sample_rate_ = std::max(1.0, sample_rate);
    update_coefficient();
}

void LowPassFilter::set_cutoff(const double cutoff_hz) noexcept {
    cutoff_hz_ = std::clamp(cutoff_hz, 20.0, sample_rate_ * 0.45);
    update_coefficient();
}

void LowPassFilter::reset() noexcept {
    state_ = 0.0;
}

void LowPassFilter::update_coefficient() noexcept {
    coefficient_ =
        1.0 - std::exp(-2.0 * std::numbers::pi * cutoff_hz_ / sample_rate_);
}

float LowPassFilter::process(const float input) noexcept {
    state_ += coefficient_ * (static_cast<double>(input) - state_);
    return static_cast<float>(state_);
}

} // namespace canwesynth
