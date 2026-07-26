.PHONY: install configure build test lint fmt coverage plugin clean

install:
	bun install --frozen-lockfile

configure:
	cmake -S . -B build -G Ninja -DCMAKE_BUILD_TYPE=RelWithDebInfo

build:
	cmake --build build --parallel
	bun run build

test:
	ctest --test-dir build --output-on-failure
	bun test

lint:
	bun run typecheck
	cmake --build build --target canwesynth_lint

fmt:
	bun run fmt

coverage:
	bun test --coverage

plugin:
	bun run build:codex-plugin
	python3 plugins/canwesynth/scripts/validate_manifest.py

clean:
	cmake --build build --target clean
