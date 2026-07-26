add_executable(canwesynth-render main.cpp)
target_link_libraries(canwesynth-render PRIVATE canwesynth_core)
target_compile_options(
    canwesynth-render
    PRIVATE
        $<$<CXX_COMPILER_ID:GNU,Clang>:-Wall;-Wextra;-Wpedantic;-Werror>
        $<$<CXX_COMPILER_ID:MSVC>:/W4;/WX>
)
