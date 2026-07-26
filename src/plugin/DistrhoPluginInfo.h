#ifndef DISTRHO_PLUGIN_INFO_H_INCLUDED
#define DISTRHO_PLUGIN_INFO_H_INCLUDED

#define DISTRHO_PLUGIN_BRAND "CanWeSynth"
#define DISTRHO_PLUGIN_NAME "CanWeSynth"
#define DISTRHO_PLUGIN_URI "https://github.com/Zacxxx/canwesynth"
#define DISTRHO_PLUGIN_CLAP_ID "org.canwesynth.instrument"

#define DISTRHO_PLUGIN_BRAND_ID CwSy
#define DISTRHO_PLUGIN_UNIQUE_ID CwS1

#define DISTRHO_PLUGIN_HAS_UI 1
#define DISTRHO_PLUGIN_IS_RT_SAFE 1
#define DISTRHO_PLUGIN_IS_SYNTH 1
#define DISTRHO_PLUGIN_NUM_INPUTS 0
#define DISTRHO_PLUGIN_NUM_OUTPUTS 2
#define DISTRHO_PLUGIN_WANT_MIDI_INPUT 1

#define DISTRHO_UI_DEFAULT_WIDTH 860
#define DISTRHO_UI_DEFAULT_HEIGHT 520
#define DISTRHO_UI_USE_NANOVG 1

enum Parameters {
    kParameterWaveform = 0,
    kParameterCutoff,
    kParameterAttack,
    kParameterSustain,
    kParameterRelease,
    kParameterGain,
    kParameterCount
};

#endif
