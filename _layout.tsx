{
  "expo": {
    "name": "Fée Belette Reboot System",
    "slug": "blacklace-island",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "blacklace-island",
    "userInterfaceStyle": "dark",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/images/icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#080810"
    },
    "ios": {
      "supportsTablet": false,
      "infoPlist": {
        "NSCameraUsageDescription": "Utilisé pour l'effet stroboscopique LED pendant les séances."
      }
    },
    "android": {
      "package": "com.feebeletterebootsystem.brs",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/icon.png",
        "backgroundColor": "#080810"
      },
      "permissions": [
        "VIBRATE",
        "RECORD_AUDIO",
        "CAMERA",
        "FLASHLIGHT"
      ]
    },
    "web": {
      "favicon": "./assets/images/icon.png",
      "backgroundColor": "#080810",
      "themeColor": "#080810",
      "bundler": "metro"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://replit.com/"
        }
      ],
      [
        "expo-font",
        {
          "fonts": [
            "./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf",
            "./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf",
            "./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf",
            "./node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/FontAwesome.ttf"
          ]
        }
      ],
      "expo-web-browser",
      [
        "expo-camera",
        {
          "cameraPermission": "Autorise Fée Belette à utiliser la torche LED pour les effets stroboscopiques."
        }
      ],
      [
        "expo-av",
        {
          "microphonePermission": false
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true,
      "reactCompiler": true
    }
  }
}
