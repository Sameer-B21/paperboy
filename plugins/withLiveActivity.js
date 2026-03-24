/**
 * Expo Config Plugin: withLiveActivity
 *
 * Automatically configures the iOS project for Live Activities during
 * `npx expo prebuild`. This plugin:
 *
 *   1. Adds NSSupportsLiveActivities = YES to Info.plist
 *   2. Copies Swift source files from ios-native/ into the generated ios/ dir
 *   3. Adds the native module files to the main app target
 *   4. Creates a PaperboyWidgets Widget Extension target in the Xcode project
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
      const appName = cfg.modRequest.projectName;

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

      // --- Create Info.plist for the Widget Extension target ---
      const widgetInfoPlist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleDisplayName</key>
    <string>Paperboy Widgets</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key>
    <string>$(PRODUCT_BUNDLE_PACKAGE_TYPE)</string>
    <key>CFBundleShortVersionString</key>
    <string>$(MARKETING_VERSION)</string>
    <key>CFBundleVersion</key>
    <string>$(CURRENT_PROJECT_VERSION)</string>
    <key>NSExtension</key>
    <dict>
        <key>NSExtensionPointIdentifier</key>
        <string>com.apple.widgetkit-extension</string>
    </dict>
</dict>
</plist>`;
      fs.writeFileSync(
        path.join(widgetDestDir, "PaperboyWidgets-Info.plist"),
        widgetInfoPlist
      );

      // --- Copy the ActivityAttributes into the main app target too ---
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

    // ── Add native module files to main app target ──

    const nativeModuleFiles = [
      { name: "PaperboyActivityAttributes.swift", type: "sourcecode.swift" },
      { name: "LiveActivityModule.swift", type: "sourcecode.swift" },
      { name: "LiveActivityModule.m", type: "sourcecode.c.objc" },
    ];

    // Find the main app group
    const mainGroupKey =
      proj.findPBXGroupKey({ name: appName }) ||
      proj.findPBXGroupKey({ path: appName });

    if (mainGroupKey) {
      for (const file of nativeModuleFiles) {
        proj.addSourceFile(
          `${appName}/${file.name}`,
          { target: proj.getFirstTarget().uuid },
          mainGroupKey
        );
      }
    }

    // ── Create the Widget Extension target ──

    // 1. Create a PBXGroup for the widget files
    const widgetGroupKey = proj.pbxCreateGroup(widgetTargetName, widgetTargetName);

    // Add widget group to the main (root) project group
    const rootGroupKey = proj.getFirstProject().firstProject.mainGroup;
    if (rootGroupKey) {
      const rootGroup = proj.getPBXGroupByKey(rootGroupKey);
      if (rootGroup && rootGroup.children) {
        rootGroup.children.push({
          value: widgetGroupKey,
          comment: widgetTargetName,
        });
      }
    }

    // 2. Create the extension target
    const extTarget = proj.addTarget(
      widgetTargetName,
      "app_extension",
      widgetTargetName,
      widgetBundleId
    );

    if (!extTarget) {
      console.warn("[withLiveActivity] Failed to create extension target");
      return cfg;
    }

    // 3. Add a Sources build phase for the extension target
    const sourcesBuildPhase = proj.addBuildPhase(
      [],
      "PBXSourcesBuildPhase",
      "Sources",
      extTarget.uuid
    );

    // 4. Add a Frameworks build phase for the extension target
    proj.addBuildPhase(
      [],
      "PBXFrameworksBuildPhase",
      "Frameworks",
      extTarget.uuid
    );

    // 5. Add a Resources build phase for the extension target
    proj.addBuildPhase(
      [],
      "PBXResourcesBuildPhase",
      "Resources",
      extTarget.uuid
    );

    // 6. Add widget Swift files to the extension
    const widgetSwiftFiles = [
      "PaperboyWidgetBundle.swift",
      "PaperboyActivityAttributes.swift",
      "PaperboyLiveActivity.swift",
    ];

    for (const fileName of widgetSwiftFiles) {
      proj.addSourceFile(
        fileName,
        { target: extTarget.uuid },
        widgetGroupKey
      );
    }

    // 7. Add WidgetKit and SwiftUI frameworks to the extension
    proj.addFramework("WidgetKit.framework", {
      target: extTarget.uuid,
      link: true,
    });
    proj.addFramework("SwiftUI.framework", {
      target: extTarget.uuid,
      link: true,
    });

    // ── Configure build settings ──

    const configurations = proj.pbxXCBuildConfigurationSection();
    for (const key in configurations) {
      const buildConfig = configurations[key];
      if (
        typeof buildConfig !== "object" ||
        !buildConfig.buildSettings ||
        !buildConfig.name
      ) {
        continue;
      }

      const productName = buildConfig.buildSettings.PRODUCT_NAME;

      // Widget extension build settings
      if (
        productName === quoted(widgetTargetName) ||
        productName === widgetTargetName
      ) {
        Object.assign(buildConfig.buildSettings, {
          IPHONEOS_DEPLOYMENT_TARGET: "16.2",
          SWIFT_VERSION: "5.0",
          CODE_SIGN_STYLE: "Automatic",
          GENERATE_INFOPLIST_FILE: "YES",
          CURRENT_PROJECT_VERSION: "1",
          MARKETING_VERSION: "1.0",
          PRODUCT_BUNDLE_IDENTIFIER: quoted(widgetBundleId),
          TARGETED_DEVICE_FAMILY: quoted("1,2"),
          INFOPLIST_KEY_CFBundleDisplayName: quoted("Paperboy Widgets"),
          INFOPLIST_KEY_NSHumanReadableCopyright: quoted(""),
          LD_RUNPATH_SEARCH_PATHS: quoted(
            "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks"
          ),
          SKIP_INSTALL: "YES",
        });
      }

      // Ensure main app deployment target is >= 16.1
      if (
        productName === quoted(appName) ||
        productName === appName ||
        buildConfig.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === quoted(bundleId)
      ) {
        const currentTarget =
          buildConfig.buildSettings.IPHONEOS_DEPLOYMENT_TARGET;
        if (
          !currentTarget ||
          parseFloat(String(currentTarget).replace(/"/g, "")) < 16.2
        ) {
          buildConfig.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = "16.2";
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
