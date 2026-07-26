add_executable(
    canwesynth_core_tests
    test_main.cpp
)
target_link_libraries(canwesynth_core_tests PRIVATE canwesynth_core)
target_compile_options(
    canwesynth_core_tests
    PRIVATE
        $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall;-Wextra;-Wpedantic;-Werror>
        $<$<CXX_COMPILER_ID:MSVC>:/W4;/WX>
)
add_test(NAME canwesynth_core_tests COMMAND canwesynth_core_tests)
