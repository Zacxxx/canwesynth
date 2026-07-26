#include "DistrhoPlugin.hpp"

#include "canwesynth/poly_synth.hpp"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>

START_NAMESPACE_DISTRHO

class CanWeSynthPlugin final : public Plugin {
public:
    CanWeSynthPlugin()
        : Plugin(kParameterCount, 0, 0) {
        parameters_[kParameterWaveform] = 1.0F;
        parameters_[kParameterCutoff] = 2400.0F;
        parameters_[kParameterAttack] = 20.0F;
        parameters_[kParameterSustain] = 0.8F;
        parameters_[kParameterRelease] = 400.0F;
        parameters_[kParameterGain] = 0.7F;
        update_synth();
    }

protected:
    const char* getLabel() const override {
        return "CanWeSynth";
    }

    const char* getDescription() const override {
        return "Open, AI-native instrument platform. Pre-alpha subtractive voice.";
    }

    const char* getMaker() const override {
        return "CanWeSynth Community";
    }

    const char* getHomePage() const override {
        return "https://github.com/Zacxxx/canwesynth";
    }

    const char* getLicense() const override {
        return "GPL-3.0-or-later";
    }

    std::uint32_t getVersion() const override {
        return d_version(0, 1, 0);
    }

    void initParameter(
        const std::uint32_t index,
        Parameter& parameter) override {
        parameter.hints = kParameterIsAutomatable;

        switch (index) {
        case kParameterWaveform:
            parameter.name = "Waveform";
            parameter.symbol = "waveform";
            parameter.hints |= kParameterIsInteger;
            parameter.ranges = {0.0F, 3.0F, 1.0F};
            break;
        case kParameterCutoff:
            parameter.name = "Cutoff";
            parameter.symbol = "cutoff";
            parameter.unit = "Hz";
            parameter.ranges = {20.0F, 20000.0F, 2400.0F};
            break;
        case kParameterAttack:
            parameter.name = "Attack";
            parameter.symbol = "attack";
            parameter.unit = "ms";
            parameter.ranges = {0.1F, 5000.0F, 20.0F};
            break;
        case kParameterSustain:
            parameter.name = "Sustain";
            parameter.symbol = "sustain";
            parameter.ranges = {0.0F, 1.0F, 0.8F};
            break;
        case kParameterRelease:
            parameter.name = "Release";
            parameter.symbol = "release";
            parameter.unit = "ms";
            parameter.ranges = {1.0F, 10000.0F, 400.0F};
            break;
        case kParameterGain:
            parameter.name = "Gain";
            parameter.symbol = "gain";
            parameter.ranges = {0.0F, 1.0F, 0.7F};
            break;
        default:
            break;
        }
    }

    float getParameterValue(const std::uint32_t index) const override {
        return parameters_[index];
    }

    void setParameterValue(
        const std::uint32_t index,
        const float value) override {
        parameters_[index] = value;
    }

    void run(
        const float**,
        float** outputs,
        const std::uint32_t frames,
        const MidiEvent* midi_events,
        const std::uint32_t midi_event_count) override {
        update_synth();

        std::uint32_t event_index = 0;
        for (std::uint32_t frame = 0; frame < frames; ++frame) {
            while (
                event_index < midi_event_count &&
                midi_events[event_index].frame <= frame) {
                handle_midi(midi_events[event_index]);
                ++event_index;
            }

            const float sample =
                std::clamp(synth_.next_sample() * parameters_[kParameterGain],
                           -1.0F,
                           1.0F);
            outputs[0][frame] = sample;
            outputs[1][frame] = sample;
        }
    }

private:
    void update_synth() noexcept {
        synth_.set_sample_rate(getSampleRate());
        const auto waveform = static_cast<canwesynth::Waveform>(
            std::clamp(
                static_cast<int>(std::lround(parameters_[kParameterWaveform])),
                0,
                3));
        synth_.set_waveform(waveform);
        synth_.set_cutoff(parameters_[kParameterCutoff]);
        synth_.set_envelope(
            parameters_[kParameterAttack] / 1000.0,
            0.15,
            parameters_[kParameterSustain],
            parameters_[kParameterRelease] / 1000.0);
    }

    void handle_midi(const MidiEvent& event) noexcept {
        if (event.size < 3U) {
            return;
        }

        const std::uint8_t status = event.data[0] & 0xF0U;
        const std::uint8_t note = event.data[1] & 0x7FU;
        const std::uint8_t velocity = event.data[2] & 0x7FU;

        if (status == 0x90U && velocity > 0U) {
            synth_.note_on(note, static_cast<float>(velocity) / 127.0F);
        } else if (status == 0x80U || (status == 0x90U && velocity == 0U)) {
            synth_.note_off(note);
        }
    }

    canwesynth::PolySynth synth_;
    std::array<float, kParameterCount> parameters_{};

    DISTRHO_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(CanWeSynthPlugin)
};

Plugin* createPlugin() {
    return new CanWeSynthPlugin();
}

END_NAMESPACE_DISTRHO
