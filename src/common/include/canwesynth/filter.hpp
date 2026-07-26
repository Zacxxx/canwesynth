#pragma once

namespace canwesynth {

class LowPassFilter {
public:
    void set_sample_rate(double sample_rate) noexcept;
    void set_cutoff(double cutoff_hz) noexcept;
    void reset() noexcept;
    [[nodiscard]] float process(float input) noexcept;

private:
    void update_coefficient() noexcept;

    double sample_rate_ = 48000.0;
    double cutoff_hz_ = 2400.0;
    double coefficient_ = 0.0;
    double state_ = 0.0;
};

} // namespace canwesynth
