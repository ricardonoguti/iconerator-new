"use strict";

var iconerator = require('../lib/iconerator'),
    fs = require('fs'),
    commander = require('commander'),
    path = require('path'),
    packageJson = require(path.join(__dirname, '..', 'package.json')),
    platform, device, type;

commander
    .version(packageJson.version)
    .usage('[options] <file ...> <output directory ...>')
    .option('--only-ios-appicon', 'Only generate iOS icons')
    .option('--only-ios-splash', 'Only generate iOs splash')
    .option('--only-android', 'Only generate Android icons')
    .option('--only-android-notification', 'Only generate Android icons Notifications')
    .option('--only-android-splash', 'Only generate Android splash')
    .parse(process.argv);

var inputImage = path.resolve(process.cwd(), commander.args[0]);
var outputPath = (commander.args[1] &&
    fs.statSync(path.resolve(process.cwd(), commander.args[1])).isDirectory()) ?
    path.resolve(process.cwd(), commander.args[1]) :
    process.cwd();

// Establish and clean input file & output path
if (outputPath.slice(-1) !== '/') outputPath += '/';

// Check input file existence
if (!inputImage || !fs.statSync(inputImage).isFile()) {
    console.error("Must reference a valid image in order to generate icons");
    process.exit(1);
}

// Populate iconMeta array from any parsed cmd line options
switch (true) {
    case commander.onlyIosAppicon:
        platform = 'ios';
        break;
    case commander.onlyIphone:
        platform = 'ios';
        device = 'iphone';
        break;
    case commander.onlyIpad:
        platform = 'ios';
        device = 'ipad';
        break;
    case commander.onlyAndroid:
        platform = 'android';
        type = 'Launcher Icon'
        break;
    case commander.onlyAndroidNotification:
        platform = 'android';
        type = 'Notification icon'
        break;
    case commander.onlyAndroidSplash:
        platform = 'android';
        type = 'Splash'
        break;
    case commander.onlyIosSplash:
        platform = 'ios';
        type = 'Splash'
        break;
    case commander.onlyWeb:
        platform = 'web';
        break;
    default:
        break;
}

iconerator.generateBaseIcons(inputImage, function (err, imageRadius, imageRound) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    iconerator.generateIcons(inputImage, imageRadius, imageRound, outputPath, platform, device, type, function (err) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log("Successfully generated app icon images in ", outputPath);
    });
});
