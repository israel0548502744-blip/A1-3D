plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Signing: if the CI provides a keystore (GitHub secrets), release builds are
// signed with it so each new APK installs as an update. Otherwise the Android
// debug key is used (then a new build may require uninstalling the old one).
val versionCodeFromCi = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
val ciKeystore = System.getenv("SIGNING_KEYSTORE_PATH")?.let { file(it) }?.takeIf { it.exists() }

android {
    namespace = "com.bambucontrol.studio"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.bambucontrol.studio"
        minSdk = 26
        targetSdk = 35
        versionCode = versionCodeFromCi
        versionName = "0.1.$versionCodeFromCi"
    }

    signingConfigs {
        if (ciKeystore != null) {
            create("ci") {
                storeFile = ciKeystore
                storePassword = System.getenv("SIGNING_STORE_PASSWORD")
                keyAlias = System.getenv("SIGNING_KEY_ALIAS")
                keyPassword = System.getenv("SIGNING_KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (ciKeystore != null) signingConfigs.getByName("ci")
                            else signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
}
