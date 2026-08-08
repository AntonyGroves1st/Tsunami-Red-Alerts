# Hidden Cities Atlas (Android)

A native Android app that maps the world's **hidden caves and concealed entrances that lead down into underground and rock-cut cities** — places like Derinkuyu, the Cappadocian underground cities, Naours, Nushabad, Vardzia, the Longyou Caves, Coober Pedy and more.

Each entry focuses on the *hidden entrance* itself: how the way in was disguised, camouflaged, sealed with rolling stone doors, or lost until someone accidentally broke through.

## Features

- **Atlas list** of 26 real subterranean sites across 15 countries, sorted alphabetically.
- **Free-text search** across names, aliases, countries, regions and descriptions (multi-word queries require all words).
- **Type filters** — underground city, cave dwelling, rock-cut city, tunnel network, mine city, cave system, hidden bunker.
- **Favorites** you can save (persisted on device) and filter to.
- **Detail screen** for each place: the hidden-entrance story, access status, depth/scale, origin era, coordinates and a full write-up.
- **Open entrance in maps** launches a `geo:` pin (with a browser-map fallback), and **tap coordinates to copy** them.

## Building the APK

Requires JDK 17+ and the Android SDK (compileSdk 34).

```bash
cd android-hiddencities
./gradlew assembleRelease   # or assembleDebug
```

APK output: `app/build/outputs/apk/release/app-release.apk`. If `android-hiddencities/release.keystore` is absent, generate one first:

```bash
keytool -genkeypair -keystore release.keystore -alias hiddencities -keyalg RSA \
  -keysize 2048 -validity 10000 -storepass hidden -keypass hidden \
  -dname "CN=Hidden Cities Atlas"
```

Install on a phone with `adb install app-release.apk`, or copy the APK over and open it (enable "install unknown apps").

## Data & disclaimer

Coordinates mark approximate **entrance / orientation** points and are for curiosity and trip-planning only. Many of these sites are fragile, protected, or dangerous; several are restricted or officially closed. Always follow local rules, signage and guides, and never attempt unofficial entry.
