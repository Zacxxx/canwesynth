#include "DistrhoUI.hpp"

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cstdio>

START_NAMESPACE_DISTRHO

class CanWeSynthUI final : public UI {
public:
    CanWeSynthUI()
        : UI(DISTRHO_UI_DEFAULT_WIDTH, DISTRHO_UI_DEFAULT_HEIGHT) {
        parameters_[kParameterWaveform] = 1.0F;
        parameters_[kParameterCutoff] = 2400.0F;
        parameters_[kParameterAttack] = 20.0F;
        parameters_[kParameterSustain] = 0.8F;
        parameters_[kParameterRelease] = 400.0F;
        parameters_[kParameterGain] = 0.7F;

#ifdef DGL_NO_SHARED_RESOURCES
        createFontFromFile(
            "sans",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
#else
        loadSharedResources();
#endif

        setGeometryConstraints(
            DISTRHO_UI_DEFAULT_WIDTH,
            DISTRHO_UI_DEFAULT_HEIGHT,
            true);
    }

protected:
    void parameterChanged(
        const std::uint32_t index,
        const float value) override {
        if (index >= kParameterCount) {
            return;
        }
        parameters_[index] = value;
        repaint();
    }

    void onNanoDisplay() override {
        draw_background();
        draw_header();
        draw_waveform_picker();
        draw_controls();
        draw_keyboard();
    }

    bool onMouse(const MouseEvent& event) override {
        if (!event.press) {
            if (active_note_ >= 0) {
                sendNote(0, static_cast<std::uint8_t>(active_note_), 0);
                active_note_ = -1;
                repaint();
                return true;
            }
            return false;
        }

        if (event.button != 1) {
            return false;
        }

        const float x = static_cast<float>(event.pos.getX());
        const float y = static_cast<float>(event.pos.getY());

        if (handle_waveform_click(x, y) ||
            handle_control_click(x, y) ||
            handle_keyboard_click(x, y)) {
            repaint();
            return true;
        }

        return false;
    }

private:
    struct Control {
        const char* label;
        const char* unit;
        std::uint32_t parameter;
        float minimum;
        float maximum;
        bool logarithmic;
    };

    static constexpr std::array<const char*, 4> WAVEFORM_NAMES{
        "SINE",
        "SAW",
        "SQUARE",
        "TRIANGLE",
    };

    static constexpr std::array<const char*, 12> NOTE_NAMES{
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
    };

    static constexpr std::array<Control, 5> CONTROLS{{
        {"CUTOFF", "Hz", kParameterCutoff, 20.0F, 20000.0F, true},
        {"ATTACK", "ms", kParameterAttack, 0.1F, 5000.0F, true},
        {"SUSTAIN", "", kParameterSustain, 0.0F, 1.0F, false},
        {"RELEASE", "ms", kParameterRelease, 1.0F, 10000.0F, true},
        {"OUTPUT", "%", kParameterGain, 0.0F, 1.0F, false},
    }};

    static constexpr float PANEL_X = 28.0F;
    static constexpr float PANEL_Y = 104.0F;
    static constexpr float PANEL_WIDTH = 804.0F;
    static constexpr float PANEL_HEIGHT = 258.0F;
    static constexpr float KEYBOARD_Y = 392.0F;
    static constexpr float KEYBOARD_X = 28.0F;
    static constexpr float KEY_WIDTH = 63.0F;
    static constexpr float KEY_GAP = 4.0F;
    static constexpr float KEY_HEIGHT = 94.0F;

    void draw_background() {
        beginPath();
        fillColor(8, 10, 19);
        rect(0.0F, 0.0F, getWidth(), getHeight());
        fill();
        closePath();

        beginPath();
        fillColor(18, 21, 36);
        roundedRect(PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, 14.0F);
        fill();
        strokeColor(58, 65, 94);
        strokeWidth(1.0F);
        stroke();
        closePath();
    }

    void draw_header() {
        beginPath();
        fontSize(30.0F);
        textAlign(ALIGN_LEFT | ALIGN_MIDDLE);
        fillColor(238, 242, 255);
        text(28.0F, 42.0F, "CAN WE SYNTH?", nullptr);
        closePath();

        beginPath();
        fontSize(13.0F);
        textLetterSpacing(1.5F);
        textAlign(ALIGN_LEFT | ALIGN_MIDDLE);
        fillColor(96, 224, 202);
        text(30.0F, 74.0F, "OPEN INSTRUMENT LAB  /  PRE-ALPHA", nullptr);
        closePath();

        beginPath();
        fillColor(96, 224, 202);
        roundedRect(697.0F, 28.0F, 135.0F, 34.0F, 17.0F);
        fill();
        closePath();

        beginPath();
        fontSize(12.0F);
        textLetterSpacing(1.0F);
        textAlign(ALIGN_CENTER | ALIGN_MIDDLE);
        fillColor(8, 22, 26);
        text(764.5F, 45.0F, "CODEX READY", nullptr);
        closePath();
    }

    void draw_waveform_picker() {
        draw_section_label(48.0F, 128.0F, "OSCILLATOR");

        for (std::size_t index = 0; index < WAVEFORM_NAMES.size(); ++index) {
            const float x = 48.0F + static_cast<float>(index) * 128.0F;
            const bool selected =
                static_cast<int>(std::lround(parameters_[kParameterWaveform])) ==
                static_cast<int>(index);

            beginPath();
            fillColor(
                selected ? 96 : 29,
                selected ? 224 : 34,
                selected ? 202 : 54);
            roundedRect(x, 152.0F, 116.0F, 38.0F, 8.0F);
            fill();
            closePath();

            beginPath();
            fontSize(11.0F);
            textLetterSpacing(0.8F);
            textAlign(ALIGN_CENTER | ALIGN_MIDDLE);
            if (selected) {
                fillColor(5, 28, 29);
            } else {
                fillColor(188, 197, 219);
            }
            text(x + 58.0F, 171.0F, WAVEFORM_NAMES[index], nullptr);
            closePath();
        }
    }

    void draw_controls() {
        draw_section_label(48.0F, 218.0F, "VOICE");

        for (std::size_t index = 0; index < CONTROLS.size(); ++index) {
            const Control& control = CONTROLS[index];
            const float x = 48.0F + static_cast<float>(index) * 151.0F;
            const float normalized = value_to_normalized(
                parameters_[control.parameter],
                control);

            beginPath();
            fillColor(35, 40, 61);
            roundedRect(x, 274.0F, 126.0F, 8.0F, 4.0F);
            fill();
            closePath();

            beginPath();
            fillColor(130, 103, 255);
            roundedRect(
                x,
                274.0F,
                std::max(8.0F, 126.0F * normalized),
                8.0F,
                4.0F);
            fill();
            closePath();

            beginPath();
            fillColor(239, 240, 255);
            circle(x + 126.0F * normalized, 278.0F, 7.0F);
            fill();
            closePath();

            beginPath();
            fontSize(11.0F);
            textLetterSpacing(0.7F);
            textAlign(ALIGN_LEFT | ALIGN_MIDDLE);
            fillColor(153, 162, 187);
            text(x, 250.0F, control.label, nullptr);
            closePath();

            char value_text[32]{};
            if (control.parameter == kParameterSustain) {
                std::snprintf(
                    value_text,
                    sizeof(value_text),
                    "%.2f",
                    parameters_[control.parameter]);
            } else if (control.parameter == kParameterGain) {
                std::snprintf(
                    value_text,
                    sizeof(value_text),
                    "%.0f %s",
                    parameters_[control.parameter] * 100.0F,
                    control.unit);
            } else {
                std::snprintf(
                    value_text,
                    sizeof(value_text),
                    "%.0f %s",
                    parameters_[control.parameter],
                    control.unit);
            }

            beginPath();
            fontSize(15.0F);
            textAlign(ALIGN_LEFT | ALIGN_MIDDLE);
            fillColor(235, 238, 252);
            text(x, 313.0F, value_text, nullptr);
            closePath();
        }
    }

    void draw_keyboard() {
        draw_section_label(28.0F, 378.0F, "PLAY");

        for (std::size_t index = 0; index < NOTE_NAMES.size(); ++index) {
            const float x =
                KEYBOARD_X + static_cast<float>(index) * (KEY_WIDTH + KEY_GAP);
            const bool active =
                active_note_ == static_cast<int>(60 + index);
            const bool accidental =
                NOTE_NAMES[index][1] == '#';

            beginPath();
            if (active) {
                fillColor(130, 103, 255);
            } else if (accidental) {
                fillColor(28, 31, 48);
            } else {
                fillColor(224, 228, 241);
            }
            roundedRect(x, KEYBOARD_Y, KEY_WIDTH, KEY_HEIGHT, 7.0F);
            fill();
            closePath();

            beginPath();
            fontSize(12.0F);
            textAlign(ALIGN_CENTER | ALIGN_BOTTOM);
            if (active || accidental) {
                fillColor(245, 246, 255);
            } else {
                fillColor(33, 37, 52);
            }
            text(
                x + KEY_WIDTH / 2.0F,
                KEYBOARD_Y + KEY_HEIGHT - 12.0F,
                NOTE_NAMES[index],
                nullptr);
            closePath();
        }
    }

    void draw_section_label(
        const float x,
        const float y,
        const char* const label) {
        beginPath();
        fontSize(10.0F);
        textLetterSpacing(1.4F);
        textAlign(ALIGN_LEFT | ALIGN_MIDDLE);
        fillColor(104, 113, 139);
        text(x, y, label, nullptr);
        closePath();
    }

    bool handle_waveform_click(const float x, const float y) {
        if (y < 152.0F || y > 190.0F) {
            return false;
        }

        for (std::size_t index = 0; index < WAVEFORM_NAMES.size(); ++index) {
            const float left = 48.0F + static_cast<float>(index) * 128.0F;
            if (x >= left && x <= left + 116.0F) {
                set_parameter(
                    kParameterWaveform,
                    static_cast<float>(index));
                return true;
            }
        }
        return false;
    }

    bool handle_control_click(const float x, const float y) {
        if (y < 257.0F || y > 302.0F) {
            return false;
        }

        for (const Control& control : CONTROLS) {
            const std::size_t index =
                static_cast<std::size_t>(&control - CONTROLS.data());
            const float left = 48.0F + static_cast<float>(index) * 151.0F;
            if (x >= left && x <= left + 126.0F) {
                const float normalized =
                    std::clamp((x - left) / 126.0F, 0.0F, 1.0F);
                set_parameter(
                    control.parameter,
                    normalized_to_value(normalized, control));
                return true;
            }
        }
        return false;
    }

    bool handle_keyboard_click(const float x, const float y) {
        if (y < KEYBOARD_Y || y > KEYBOARD_Y + KEY_HEIGHT) {
            return false;
        }

        for (std::size_t index = 0; index < NOTE_NAMES.size(); ++index) {
            const float left =
                KEYBOARD_X + static_cast<float>(index) * (KEY_WIDTH + KEY_GAP);
            if (x >= left && x <= left + KEY_WIDTH) {
                active_note_ = static_cast<int>(60 + index);
                sendNote(
                    0,
                    static_cast<std::uint8_t>(active_note_),
                    108);
                return true;
            }
        }
        return false;
    }

    void set_parameter(
        const std::uint32_t parameter,
        const float value) {
        parameters_[parameter] = value;
        editParameter(parameter, true);
        setParameterValue(parameter, value);
        editParameter(parameter, false);
    }

    static float value_to_normalized(
        const float value,
        const Control& control) {
        if (control.logarithmic) {
            const float clamped =
                std::clamp(value, control.minimum, control.maximum);
            return std::log(clamped / control.minimum) /
                std::log(control.maximum / control.minimum);
        }
        return (value - control.minimum) /
            (control.maximum - control.minimum);
    }

    static float normalized_to_value(
        const float normalized,
        const Control& control) {
        if (control.logarithmic) {
            return control.minimum *
                std::pow(
                    control.maximum / control.minimum,
                    normalized);
        }
        return control.minimum +
            normalized * (control.maximum - control.minimum);
    }

    std::array<float, kParameterCount> parameters_{};
    int active_note_ = -1;

    DISTRHO_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(CanWeSynthUI)
};

UI* createUI() {
    return new CanWeSynthUI();
}

END_NAMESPACE_DISTRHO
