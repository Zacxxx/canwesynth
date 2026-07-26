add_library(
    canwesynth_core STATIC
    oscillator.cpp
    envelope.cpp
    filter.cpp
    synth_voice.cpp
    poly_synth.cpp
)

target_include_directories(
    canwesynth_core
    PUBLIC
        "${CMAKE_CURRENT_SOURCE_DIR}/include"
)

target_compile_options(
    canwesynth_core
    PRIVATE
        $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall;-Wextra;-Wpedantic;-Werror>
        $<$<CXX_COMPILER_ID:MSVC>:/W4;/WX>
)

set_target_properties(
    canwesynth_core
    PROPERTIES
        POSITION_INDEPENDENT_CODE ON
)
