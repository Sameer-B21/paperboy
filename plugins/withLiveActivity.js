/**
 * Expo Config Plugin: withLiveActivity
 *
 * Automatically configures the iOS project for Live Activities during
 * `npx expo prebuild`. This plugin:
 *
 *   1. Adds NSSupportsLiveActivities = YES to Info.plist
 *   2. Creates a PaperboyWidgets Widget Extension target in the Xcode project
 *   3. Copies Swift source files from ios-native/ into the generated ios/ dir
 *   4. Links the ActivityKit and WidgetKit frameworks
 *   5. Sets deployment target to iOS 16.1 for the extension
 */

const {
  withInfoPlist,
  withXcodeProject,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// ─── Helpers ──────────────────────────────────────────────

function quoted(str) {
  return `"${str}"`;
}

function generateUUID() {
  // Generate a 24-character hex string for Xcode PBX UUIDs
  const hex = "0123456789ABCDEF";
  let result = "";
  for (let i = 0; i < 24; i++) {
    result += hex[Math.floor(Math.random() * 16)];
  }
  return result;
}

// ─── Step 1: Info.plist ───────────────────────────────────

function withLiveActivityInfoPlist(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.NSSupportsLiveActivities = true;
    return cfg;
  });
}

// ─── Step 2: Copy native files ────────────────────────────

function withLiveActivityFiles(config) {
  return withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const iosDir = path.join(projectRoot, "ios");
      const appName = cfg.modRequest.projectName; // e.g. "NewsletterPodcaster"

      // --- Copy Widget Extension Swift files ---
      const widgetSrcDir = path.join(
        projectRoot,
        "ios-native",
        "PaperboyWidgets"
      );
      const widgetDestDir = path.join(iosDir, "PaperboyWidgets");
      fs.mkdirSync(widgetDestDir, { recursive: true });

      const widgetFiles = fs.readdirSync(widgetSrcDir);
      for (const file of widgetFiles) {
        fs.copyFileSync(
          path.join(widgetSrcDir, file),
          path.join(widgetDestDir, file)
        );
      }

      // --- Copy the ActivityAttributes into the main app target too ---
      // (The main app needs access to the type to start/update activities)
      const mainAppDir = path.join(iosDir, appName);
      fs.copyFileSync(
        path.join(widgetSrcDir, "PaperboyActivityAttributes.swift"),
        path.join(mainAppDir, "PaperboyActivityAttributes.swift")
      );

      // --- Copy Live Activity native module files into main app ---
      const nativeModuleDir = path.join(projectRoot, "ios-native");
      fs.copyFileSync(
        path.join(nativeModuleDir, "LiveActivityModule.swift"),
        path.join(mainAppDir, "LiveActivityModule.swift")
      );
      fs.copyFileSync(
        path.join(nativeModuleDir, "LiveActivityModule.m"),
        path.join(mainAppDir, "LiveActivityModule.m")
      );

      return cfg;
    },
  ]);
}

// ─── Step 3: Modify Xcode project ─────────────────────────

function withLiveActivityXcodeProject(config) {
  return withXcodeProject(config, (cfg) => {
    const proj = cfg.modResults;
    const appName = cfg.modRequest.projectName;
    const bundleId =
      cfg.ios?.bundleIdentifier || "com.anonymous.NewsletterPodcaster";
    const widgetBundleId = `${bundleId}.PaperboyWidgets`;
    const widgetTargetName = "PaperboyWidgets";

    // --- Add widget Swift files as file references in PBXFileReference ---
    const widgetSwiftFiles = [
      "PaperboyWidgetBundle.swift",
      "PaperboyActivityAttributes.swift",
      "PaperboyLiveActivity.swift",
    ];

    // --- Add native module files to main app target ---
    const nativeModuleFiles = [
      "PaperboyActivityAttributes.swift",
      "LiveActivityModule.swift",
      "LiveActivityModule.m",
    ];

    // Add native module files to the main app group and build phase
    const mainAppGroup = proj.findPBXGroupKey({ name: appName }) ||
      proj.findPBXGroupKey({ path: appName });

    if (mainAppGroup) {
      for (const fileName of nativeModuleFiles) {
        const filePath = `${appName}/${fileName}`;

        // Add file reference
        const fileRef = proj.addFile(filePath, mainAppGroup, {
          lastKnownFileType: fileName.endsWith(".m")
            ? "sourcecode.c.objc"
            : "sourcecode.swift",
          sourceTree: '"<group>"',
        });

        // Add to Sources build phase of main app target
        if (fileRef) {
          const mainTarget = proj.getFirstTarget();
          if (mainTarget) {
            proj.addToPbxBuildFileSection(fileRef);
            proj.addToPbxSourcesBuildPhase(fileRef);
          }
        }
      }
    }

    // --- Create Widget Extension target ---

    // Use the xcode module's addTarget method to create the extension target
    const extTarget = proj.addTarget(
      widgetTargetName,
      "app_extension",
      widgetTargetName,
      widgetBundleId
    );

    if (extTarget) {
      // Add each widget Swift file to the extension group and build phase
      const extGroupKey = proj.findPBXGroupKey({ name: widgetTargetName });

      for (const fileName of widgetSwiftFiles) {
        const filePath = `${widgetTargetName}/${fileName}`;
        const fileRef = proj.addFile(filePath, extGroupKey, {
          lastKnownFileType: "sourcecode.swift",
          sourceTree: '"<group>"',
        });
        if (fileRef && extTarget.uuid) {
          proj.addToPbxBuildFileSection(fileRef);
          const sources = proj.addBuildPhase(
            [],
            "PBXSourcesBuildPhase",
            "Sources",
            extTarget.uuid
          );
          if (sources) {
            proj.addToPbxBuildFileSection(fileRef);
          }
        }
      }

      // --- Set build settings for the widget extension target ---
      const configurations = proj.pbxXCBuildConfigurationSection();
      for (const key in configurations) {
        const config = configurations[key];
        if (
          typeof config === "object" &&
          config.buildSettings &&
          config.name
        ) {
          // Find configs belonging to the widget target
          // We identify them by checking if the PRODUCT_NAME matches
          if (
            config.buildSettings.PRODUCT_NAME === quoted(widgetTargetName) ||
            config.buildSettings.PRODUCT_NAME === widgetTargetName
          ) {
            config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.1";
            config.buildSettings.SWIFT_VERSION = "5.0";
            config.buildSettings.CODE_SIGN_STYLE = "Automatic";
            config.buildSettings.INFOPLIST_KEY_CFBundleDisplayName =
              quoted("Paperboy Widgets");
            config.buildSettings.INFOPLIST_KEY_NSHumanReadableCopyright =
              quoted("");
            config.buildSettings.GENERATE_INFOPLIST_FILE = "YES";
            config.buildSettings.CURRENT_PROJECT_VERSION = "1";
            config.buildSettings.MARKETING_VERSION = "1.0";
            config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER =
              quoted(widgetBundleId);
            config.buildSettings.TARGETED_DEVICE_FAMILY =
              quoted("1,2");
            config.buildSettings.LD_RUNPATH_SEARCH_PATHS =
              quoted(
                "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"
              );
            config.buildSettings.SKIP_INSTALL = "YES";
          }
        }
      }

      // --- Also update main app build settings ---
      for (const key in configurations) {
        const config = configurations[key];
        if (
          typeof config === "object" &&
          config.buildSettings &&
          config.name
        ) {
          if (
            config.buildSettings.PRODUCT_NAME === quoted(appName) ||
            config.buildSettings.PRODUCT_NAME === appName ||
            config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === quoted(bundleId)
          ) {
            // Ensure main app deployment target supports Live Activities
            const currentTarget =
              config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET;
            if (!currentTarget || parseFloat(currentTarget) < 16.1) {
              config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.1";
            }
          }
        }
      }
    }

    return cfg;
  });
}

// ─── Main Plugin ──────────────────────────────────────────

function withLiveActivity(config) {
  config = withLiveActivityInfoPlist(config);
  config = withLiveActivityFiles(config);
  config = withLiveActivityXcodeProject(config);
  return config;
}

module.exports = withLiveActivity;
