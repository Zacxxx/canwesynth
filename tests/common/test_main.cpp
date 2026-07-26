#include "canwesynth/envelope.hpp"
#include "canwesynth/oscillator.hpp"
#include "canwesynth/poly_synth.hpp"

#include <cmath>
#include <cstdlib>
#include <iostream>

namespace {

void check(const bool condition, const char* message) {
    if (!condition) {
        std::cerr << "FAILED: " << message << '\n';
        std::exit(1);
    }
}

void oscillator_is_finite_and_bounded() {
    canwesynth::Oscillator oscillator;
    oscillator.set_sample_rate(48000.0);
    oscillator.set_frequency(440.0);

    for (const auto waveform : {
             canwesynth::Waveform::sine,
             canwesynth::Waveform::saw,
             canwesynth::Waveform::square,
             canwesynth::Waveform::triangle,
         }) {
        oscillator.set_waveform(waveform);
        oscillator.reset();
        for (int sample = 0; sample < 48000; ++sample) {
            const float value = oscillator.next_sample();
            check(std::isfinite(value), "oscillator output must be finite");
            check(std::abs(value) <= 1.1F, "oscillator output must be bounded");
        }
    }
}

void envelope_reaches_idle() {
    canwesynth::AdsrEnvelope envelope;
    envelope.set_sample_rate(1000.0);
    envelope.set_parameters(0.01, 0.01, 0.5, 0.01);
    envelope.note_on();
    for (int sample = 0; sample < 30; ++sample) {
        static_cast<void>(envelope.next_sample());
    }
    envelope.note_off();
    for (int sample = 0; sample < 30; ++sample) {
        static_cast<void>(envelope.next_sample());
    }
    check(!envelope.is_active(), "released envelope must become idle");
}

void synth_allocates_and_releases_voices() {
    canwesynth::PolySynth synth;
    synth.set_sample_rate(48000.0);
    synth.set_envelope(0.001, 0.001, 1.0, 0.001);
    synth.note_on(60, 1.0F);
    synth.note_on(64, 1.0F);
    check(synth.active_voice_count() == 2, "two notes need two active voices");
    synth.note_off(60);
    synth.note_off(64);
    for (int sample = 0; sample < 1000; ++sample) {
        static_cast<void>(synth.next_sample());
    }
    check(synth.active_voice_count() == 0, "released voices must become idle");
}

} // namespace

int main() {
    oscillator_is_finite_and_bounded();
    envelope_reaches_idle();
    synth_allocates_and_releases_voices();
    std::cout << "All synth-core tests passed\n";
    return 0;
}
