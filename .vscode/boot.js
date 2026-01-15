const fs = require('fs');
const path = require('path');
const plist = require('plist');
const { execSync, spawn } = require("child_process");

// -------- OS HELPERS --------
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';


// ============================================================
//                UPDATE ANDROID + iOS VERSION
// ============================================================
function update_android_ios_version() {
    console.log('\n🟡 Updating Android & iOS version from package.json...');

    const pkgPath = path.join(process.cwd(), 'app.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

    const versionName = pkg.appversion;
    const versionCode = pkg.appversionCode;

    // --- Android ---
    const gradlePath = path.join('android', 'app', 'build.gradle');
    let gradleContent = fs.readFileSync(gradlePath, 'utf-8');

    gradleContent = gradleContent.replace(/versionName\s+"(.*?)"/, `versionName "${versionName}"`);
    gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);

    fs.writeFileSync(gradlePath, gradleContent, 'utf-8');
    console.log(`✅ Android updated: versionName=${versionName}, versionCode=${versionCode}`);

    // --- iOS ---
    if (isMac) {
        try {
            const plistPath = path.join('ios', 'datingApp', 'Info.plist');
            const plistContent = fs.readFileSync(plistPath, 'utf8');
            const plistData = plist.parse(plistContent);

            plistData.CFBundleShortVersionString = versionName;
            plistData.CFBundleVersion = versionCode.toString();

            fs.writeFileSync(plistPath, plist.build(plistData), 'utf8');
            console.log(`✅ iOS updated: CFBundleShortVersionString=${versionName}, CFBundleVersion=${versionCode}\n`);
        } catch (error) {
            console.error('❌ Error updating iOS version:', error);
        }
    } else {
        console.log('🔵 iOS update skipped (not macOS)');
    }
    console.log("\n");
}
 

 

 

// ============================================================
//                        RUN ALL
// ============================================================
update_android_ios_version(); 