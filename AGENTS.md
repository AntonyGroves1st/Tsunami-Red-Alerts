# AGENTS.md

## Project overview

This repository contains **Emperial Bot**, a native **iOS / SwiftUI** trading & market-analysis app.

- App manifest: `rork.json` (`framework: swift`, path `ios`).
- Xcode project: `ios/EmperialBotFileLocator.xcodeproj` (plain Xcode project — no CocoaPods, no Swift Package Manager manifest, no third-party dependencies).
- Architecture: MVVM. `Models/` and `Services/` are pure `Foundation` Swift; `Views/` and `ViewModels/` use `SwiftUI` + the Observation framework (`@Observable`).
- The app is fully self-contained and runs on **mock data** (`ios/EmperialBotFileLocator/Services/MockDataService.swift`, seeded into `AppViewModel`). There is **no backend, database, or external service** to run — `Config.swift` API URLs are intentionally empty placeholders and login is a stub.
- `ios/tmp/rork-emperial-bot-108-main/` is an incomplete historical React Native/Expo reference snapshot (no `package.json`). It is **not** the deliverable and should be ignored.

## Cursor Cloud specific instructions

Cloud Agent VMs run **Linux**, but this is a native iOS/SwiftUI app. Plan around this hard constraint:

- **The full app cannot be built or run here.** Building/running the app, running the XCTest/swift-testing suites (`EmperialBotFileLocatorTests`, `EmperialBotFileLocatorUITests`), and linting the whole module all require **macOS + Xcode + the iOS SDK** (e.g. `xcodebuild -project ios/EmperialBotFileLocator.xcodeproj -scheme EmperialBotFileLocator -destination 'platform=iOS Simulator,...'`). On Linux any file that does `import SwiftUI` fails with `no such module 'SwiftUI'` (also applies to `import Testing` UI flows tied into the SwiftUI module). There is no iOS Simulator on Linux, so GUI/computer-use testing of the app is not possible here.
- **What you CAN do on Linux:** a Swift toolchain (`swiftly`, currently Swift 6.3.x) is installed in the VM image and is on `PATH` via `~/.profile` and `~/.bashrc`. Use it to compile/run the **Foundation-only** core: `Models/TradingModels.swift`, `Services/MockDataService.swift`, and `Config.swift`. This is the engine behind the Dashboard (P&L, win rate, performance, portfolio math).
- To exercise the core engine, copy those three files plus a small `main.swift` driver into a throwaway SwiftPM executable package and run `swift run` (do **not** add Swift sources or a `Package.swift` to the repo — the product is an Xcode project, not a SwiftPM package). Note `Models/TradingModels.swift` uses Swift 6 `nonisolated enum`/`Sendable` syntax, so use a recent Swift 6.x toolchain.
- There are **no dependencies to install** for the iOS project (no lockfile / package manager), so the startup update script is intentionally a no-op verification of the Swift toolchain.
- For real UI/end-to-end verification, work must be done on macOS in Xcode; verify Linux-portable changes (Models/Services logic) with a `swift run` driver as above.
