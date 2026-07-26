cmake_minimum_required(VERSION 3.22)

project(CanWeSynth VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")

option(CANWESYNTH_BUILD_PLUGIN "Build VST3, CLAP, and JACK targets" ON)
option(CANWESYNTH_BUILD_TESTS "Build the C++ test suite" ON)

add_subdirectory(src/common)
add_subdirectory(src/renderer)

if(CANWESYNTH_BUILD_PLUGIN)
    if(EXISTS "${CMAKE_SOURCE_DIR}/external/dpf/CMakeLists.txt")
        set(DPF_EXAMPLES OFF CACHE BOOL "" FORCE)
        add_subdirectory(external/dpf)
        add_subdirectory(src/plugin)
    else()
        message(WARNING "DPF submodule is missing; plugin targets are disabled. Run git submodule update --init.")
    endif()
endif()

if(CANWESYNTH_BUILD_TESTS)
    enable_testing()
    add_subdirectory(tests/common)
endif()

add_custom_target(
    canwesynth_lint
    COMMAND "${CMAKE_COMMAND}" -E echo
        "C++ warnings are enforced during compilation; add clang-tidy in M1."
)
