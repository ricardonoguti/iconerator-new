"use strict";

var iconerator = require('../lib/iconerator'),
    fs = require('fs'),
    commander = require('commander'),
    path = require('path'),
    packageJson = require(path.join(__dirname, '..', 'package.json')),
    platform, device;

commander
    .version(packageJson.version)
    .usage('[options] <file ...> <output directory ...>')
    .option('--only-ios', 'Only generate iOS icons')
    .option('--only-android', 'Only generate Android icons')
    .option('--only-iphone', 'Only generate iPhone icons')
    .option('--only-ipad', 'Only generate iPad icons')
    .option('--only-web', 'Only generate Web icons')
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
    case commander.onlyIos:
        platform = 'ios';
        break;
    case commander.onlyIphone:
        platform = 'ios';
        device = 'phone';
        break;
    case commander.onlyIpad:
        platform = 'ios';
        device = 'tablet';
        break;
    case commander.onlyAndroid:
        platform = 'android';
        break;
    case commander.onlyWeb:
        platform = 'web';
        break;
    default:
        break;
}
// if (commander.onlyIos) {
//     platform = 'ios';
// } else if (commander.onlyIphone) {
//     platform = 'ios';
//     device = 'phone';
// } else if (commander.onlyIpad) {
//     platform = 'ios';
//     device = 'tablet';
// } else if (commander.onlyAndroid) {
//     platform = 'android';
// } else if (commander.onlyWeb) {
//     platform = 'web';
// }

iconerator.generateBaseIcons(inputImage, function (err, imageRadius, imageRound) {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    iconerator.generateIcons(inputImage, imageRadius, imageRound, outputPath, platform, device, function (err) {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log("Successfully generated app icon images in ", outputPath);
    });
});

// Disabled 'checkDependencies' due a bug on Windows
// iconerator.checkDependencies(function (err) {
    // if(err){
    //     console.error(err);
    //     process.exit(1);
    // }

    // iconerator.generateIcons(_inputImage, _inputImageRound, outputPath, platform, device, function(err){
    //     if(err){
    //         console.error(err);
    //         process.exit(1);
    //     }
    //     console.log("Successfully generated app icon images in ", outputPath);
    // });
// });