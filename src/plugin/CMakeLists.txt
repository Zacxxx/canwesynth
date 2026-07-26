dpf_add_plugin(
    CanWeSynth
    TARGETS jack vst3 clap
    FILES_DSP
        CanWeSynthPlugin.cpp
)

target_include_directories(
    CanWeSynth
    PUBLIC
        "${CMAKE_CURRENT_SOURCE_DIR}"
)

target_link_libraries(CanWeSynth-dsp PUBLIC canwesynth_core)

target_compile_options(
    CanWeSynth
    PRIVATE
        $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall;-Wextra;-Wpedantic>
        $<$<CXX_COMPILER_ID:MSVC>:/W4>
)
