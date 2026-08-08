# AGENTS.md

## Repository layout

This repo hosts more than one app across branches. On this branch the active product is **Tsunami Red Alert**, a native **Android** app (Kotlin + Gradle) under `android/`, package `com.redalert.tsunami`. It watches seismic/tsunami/water/pressure data sources and escalates GREEN → YELLOW → ORANGE → RED, with a foreground "24/7 watch" service, a full-screen alarm, siren, and vibration.

- App module: `android/app` (view binding enabled; MVVM-ish with `MainActivity`, `WatchService`, `AlertEngine`, `DataRepository`, `FeedParsers`).
- Build config: AGP 8.5.2, Gradle 8.9, Kotlin 1.9.24, `compileSdk 34`, `minSdk 26`, `targetSdk 34`.

## Building and testing

Run everything from the `android/` directory with the Gradle wrapper.

- Unit tests: `./gradlew testDebugUnitTest`
- Debug APK: `./gradlew assembleDebug` → `app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release*.apk`
  - Without a `release.keystore` (or `TSUNAMI_KEYSTORE` env), the release APK is produced **unsigned** (`app-release-unsigned.apk`); the build still succeeds. See `android/README.md` for generating a keystore.
- UI/behavior tests run on the JVM via **Robolectric** (e.g. `ScanningIndicatorTest`) — no device/emulator needed. `testOptions.unitTests.includeAndroidResources = true` is required for these.

## Cursor Cloud specific instructions

Cloud Agent VMs run **Linux x86_64**. Set up the toolchain once, then build/test on the JVM:

- Requires the **Android SDK** (`platform-tools`, `platforms;android-34`, `build-tools;34.0.0`) plus a JDK. Building with JDK 21 works for this AGP/Gradle combo (JDK 17 also fine). Point Gradle at the SDK via `ANDROID_SDK_ROOT`/`ANDROID_HOME` (or a `local.properties` `sdk.dir`, which must not be committed).
- **Do NOT rely on the Android emulator here.** Nested KVM is unstable in this VM: the x86_64 system image never finishes booting (guest never connects to `adb`) and the host kernel logs an oops. Windowed, headless, and `-no-accel` (TCG) boots were all tried and none came online. Go straight to `assembleDebug`/`assembleRelease` + Robolectric JVM tests for verification instead of spinning up an AVD.
- For process cleanup, kill by explicit PID or exact process name (`ps -eo pid,comm | awk '$2 ~ /^qemu-system/ {print $1}'`). Avoid `pkill -f` / `pgrep -f <pattern>` when the pattern also matches the invoking shell command — it will match and kill your own shell mid-command.
