#pragma once

namespace canwesynth {

class AdsrEnvelope {
public:
    void set_sample_rate(double sample_rate) noexcept;
    void set_parameters(
        double attack_seconds,
        double decay_seconds,
        double sustain,
        double release_seconds) noexcept;
    void note_on() noexcept;
    void note_off() noexcept;
    void reset() noexcept;
    [[nodiscard]] float next_sample() noexcept;
    [[nodiscard]] bool is_active() const noexcept;

private:
    enum class Stage {
        idle,
        attack,
        decay,
        sustain,
        release,
    };

    [[nodiscard]] double step_for_seconds(double seconds) const noexcept;

    double sample_rate_ = 48000.0;
    double attack_seconds_ = 0.01;
    double decay_seconds_ = 0.1;
    double sustain_ = 0.8;
    double release_seconds_ = 0.25;
    double level_ = 0.0;
    double release_step_ = 0.0;
    Stage stage_ = Stage::idle;
};

} // namespace canwesynth
