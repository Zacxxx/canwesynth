#include "canwesynth/envelope.hpp"

#include <algorithm>

namespace canwesynth {

void AdsrEnvelope::set_sample_rate(const double sample_rate) noexcept {
    sample_rate_ = std::max(1.0, sample_rate);
}

void AdsrEnvelope::set_parameters(
    const double attack_seconds,
    const double decay_seconds,
    const double sustain,
    const double release_seconds) noexcept {
    attack_seconds_ = std::max(0.0001, attack_seconds);
    decay_seconds_ = std::max(0.0001, decay_seconds);
    sustain_ = std::clamp(sustain, 0.0, 1.0);
    release_seconds_ = std::max(0.0001, release_seconds);
}

void AdsrEnvelope::note_on() noexcept {
    stage_ = Stage::attack;
}

void AdsrEnvelope::note_off() noexcept {
    if (stage_ == Stage::idle) {
        return;
    }
    release_step_ = level_ * step_for_seconds(release_seconds_);
    stage_ = Stage::release;
}

void AdsrEnvelope::reset() noexcept {
    stage_ = Stage::idle;
    level_ = 0.0;
    release_step_ = 0.0;
}

double AdsrEnvelope::step_for_seconds(const double seconds) const noexcept {
    return 1.0 / std::max(1.0, seconds * sample_rate_);
}

float AdsrEnvelope::next_sample() noexcept {
    switch (stage_) {
    case Stage::idle:
        level_ = 0.0;
        break;
    case Stage::attack:
        level_ += step_for_seconds(attack_seconds_);
        if (level_ >= 1.0) {
            level_ = 1.0;
            stage_ = Stage::decay;
        }
        break;
    case Stage::decay:
        level_ -= (1.0 - sustain_) * step_for_seconds(decay_seconds_);
        if (level_ <= sustain_) {
            level_ = sustain_;
            stage_ = Stage::sustain;
        }
        break;
    case Stage::sustain:
        level_ = sustain_;
        break;
    case Stage::release:
        level_ -= release_step_;
        if (level_ <= 0.0) {
            level_ = 0.0;
            stage_ = Stage::idle;
        }
        break;
    }
    return static_cast<float>(level_);
}

bool AdsrEnvelope::is_active() const noexcept {
    return stage_ != Stage::idle;
}

} // namespace canwesynth
