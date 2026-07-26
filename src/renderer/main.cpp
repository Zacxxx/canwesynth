#include "canwesynth/poly_synth.hpp"

#include <algorithm>
#include <array>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <string>

namespace {

void write_u16(std::ofstream& output, const std::uint16_t value) {
    const std::array<char, 2> bytes{
        static_cast<char>(value & 0xffU),
        static_cast<char>((value >> 8U) & 0xffU),
    };
    output.write(bytes.data(), static_cast<std::streamsize>(bytes.size()));
}

void write_u32(std::ofstream& output, const std::uint32_t value) {
    const std::array<char, 4> bytes{
        static_cast<char>(value & 0xffU),
        static_cast<char>((value >> 8U) & 0xffU),
        static_cast<char>((value >> 16U) & 0xffU),
        static_cast<char>((value >> 24U) & 0xffU),
    };
    output.write(bytes.data(), static_cast<std::streamsize>(bytes.size()));
}

} // namespace

int main(int argc, char** argv) {
    const std::string path = argc > 1 ? argv[1] : "canwesynth-preview.wav";
    constexpr std::uint32_t sample_rate = 48000;
    constexpr std::uint32_t seconds = 3;
    constexpr std::uint32_t frames = sample_rate * seconds;
    constexpr std::uint16_t channels = 2;
    constexpr std::uint16_t bits = 16;
    constexpr std::uint32_t data_size =
        frames * channels * static_cast<std::uint32_t>(bits / 8U);

    std::ofstream output(path, std::ios::binary);
    if (!output) {
        std::cerr << "Could not open " << path << '\n';
        return 1;
    }

    output.write("RIFF", 4);
    write_u32(output, 36U + data_size);
    output.write("WAVEfmt ", 8);
    write_u32(output, 16);
    write_u16(output, 1);
    write_u16(output, channels);
    write_u32(output, sample_rate);
    write_u32(output, sample_rate * channels * bits / 8U);
    write_u16(output, channels * bits / 8U);
    write_u16(output, bits);
    output.write("data", 4);
    write_u32(output, data_size);

    canwesynth::PolySynth synth;
    synth.set_sample_rate(sample_rate);
    synth.set_waveform(canwesynth::Waveform::saw);
    synth.set_cutoff(2400.0);
    synth.set_envelope(0.02, 0.2, 0.7, 0.5);
    synth.note_on(60, 0.8F);

    for (std::uint32_t frame = 0; frame < frames; ++frame) {
        if (frame == sample_rate * 2U) {
            synth.note_off(60);
        }
        const float sample = std::clamp(synth.next_sample(), -1.0F, 1.0F);
        const auto encoded = static_cast<std::int16_t>(sample * 32767.0F);
        write_u16(output, static_cast<std::uint16_t>(encoded));
        write_u16(output, static_cast<std::uint16_t>(encoded));
    }

    std::cout << "Rendered " << path << '\n';
    return 0;
}
