# Hidden Cities Atlas (Android)

A native Android app that maps the world's **hidden caves and concealed entrances that lead down into underground and rock-cut cities** — a global network of the underground, from Derinkuyu and the Cappadocian cities to Naours, Nushabad, Vardzia, the Longyou Caves, the Odessa Catacombs, Coober Pedy and far beyond.

Each entry focuses on the *hidden entrance* itself: how the way in was disguised, camouflaged, sealed with rolling stone doors, or lost until someone accidentally broke through. A clearly labelled **Legendary underworlds** section covers the mythic side the query invokes — Agartha/Shambhala, the Greek Hades gateways, the Maya Xibalba, Sheol, Norse Svartálfaheim, Diyu, Naraka and the Hollow-Earth idea — marked as folklore, not fact.

## Features

- **Atlas of 100+ sites across 40+ countries and every continent**, sorted alphabetically, plus mythic gateways.
- **Continent filter** (Africa, Asia, Europe, North/South America, Oceania, Mythic) so you can browse country-by-country.
- **Free-text search** across names, aliases, countries, regions, continents and descriptions (multi-word queries require all words).
- **Type filters** — underground city, cave dwelling, rock-cut city, tunnel network, mine city, cave system, hidden bunker, legendary underworld.
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

Entries in the **Mythic** continent (Agartha, Hades, Xibalba, Sheol, Svartálfaheim, Diyu, Naraka, Hollow Earth) are legends and folklore. They are tagged `Legendary underworld` / `Legend / mythic` and use a representative location; they are not real, mapped places.
