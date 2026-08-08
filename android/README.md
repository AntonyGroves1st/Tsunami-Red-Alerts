# Tsunami Red Alert (Android)

A native Android app that watches for tsunami danger and screams RED ALERT when the big one hits. Default watch zone is the **Mid-Atlantic Ridge (the "mid rift")**, with East Pacific Rise, Cascadia, East African Rift, and Global also selectable.

## What it tracks

| Signal | Source | Alert trigger |
| --- | --- | --- |
| Earthquakes (M4.5+, last 24 h) | USGS + EMSC global feeds, deduplicated | M8+ anywhere, or M7.5+ inside the watch zone → RED |
| Official tsunami warnings | NWS `api.weather.gov` active alerts | Any active Tsunami Warning → RED |
| Coastal water rise | NOAA CO-OPS tide gauge (station ID) or any global IOC gauge (`ioc:code`) | +25 cm or more between 6-minute readings → RED |
| Global buoys (~850 worldwide) | NOAA NDBC latest-observations feed | 12 m+ seas or ≤950 hPa at a buoy in the watch zone → ORANGE |
| Barometric pressure | The phone's own pressure sensor | Rapid pressure crash raises the level |

Threat level is GREEN → YELLOW → ORANGE → RED. Going RED triggers a full-screen flashing alarm, vibration siren, and a high-priority notification. A **Start 24/7 watch** button runs a foreground service that keeps polling every 5 minutes in the background. **Test red alert** lets you drill the alarm.

## Building the APK

Requires JDK 17+ and the Android SDK (compileSdk 34).

```bash
cd android
./gradlew assembleRelease   # or assembleDebug
```

APK output: `app/build/outputs/apk/release/app-release.apk`. If `android/release.keystore` is absent, generate one first:

```bash
keytool -genkeypair -keystore release.keystore -alias tsunami -keyalg RSA \
  -keysize 2048 -validity 10000 -storepass redalert -keypass redalert \
  -dname "CN=Tsunami Red Alert"
```

Install on a phone with `adb install app-release.apk`, or copy the APK over and open it (enable "install unknown apps").

## Tide station IDs

Enter any NOAA CO-OPS station in the app, e.g. `8443970` Boston, `8518750` New York (The Battery), `8534720` Atlantic City, `9410230` La Jolla, `1612340` Honolulu. Full list: https://tidesandcurrents.noaa.gov/

## Disclaimer

This is a personal monitoring tool, not an official warning system. Always follow guidance from NOAA / NWS tsunami warning centers and local authorities.
