"use strict";

var fs = require('fs'),
    path = require('path'),
    gm = require('gm'),
    im = require('imagemagick'),
    async = require('async'),
    _ = require('underscore'),
    child_process = require('child_process'),
    config = require(__dirname + '/config'),
    sharp = require('sharp'),
    mkdirp = require('mkdirp'),
    find = require('./utils/find'),
    mergedirs = require('merge-dirs'),
    fse = require('fs-extra');

function createWebIconFolders(outputPath) {
    if (!fs.existsSync(path.join(outputPath, config.output.webDir))) {
        fs.mkdirSync(path.join(outputPath, config.output.webDir));
    }
};

function createIOSIconFolders(outputPath) {
    if (!fs.existsSync(path.join(outputPath))) {
        fs.mkdirSync(path.join(outputPath), { recursive: true });
    }
};

function createAndroidIconFolders(outputPath) {
    var baseDir = path.join(outputPath, config.output.androidDir);
    var dirs = ['', '/res', '/res/mipmap-ldpi', '/res/mipmap-mdpi', '/res/mipmap-hdpi',
        '/res/mipmap-xhdpi', '/res/mipmap-xxhdpi', '/res/mipmap-xxxhdpi'];
    for (var i = 0; i < dirs.length; i++) {
        if (!fs.existsSync(path.join(baseDir, dirs[i]))) fs.mkdirSync(baseDir + dirs[i]);
    }
};

function createAndroidIconNotificationFolders(outputPath) {
    var baseDir = path.join(outputPath, config.output.androidDir);
    var dirs = ['', '/res', '/res/drawable-hdpi', '/res/drawable-mdpi', '/res/drawable-xhdpi', '/res/drawable-xxhdpi', '/res/drawable-xxxhdpi'];
    for (var i = 0; i < dirs.length; i++) {
        if (!fs.existsSync(path.join(baseDir, dirs[i]))) fs.mkdirSync(baseDir + dirs[i]);
    }
};

exports.checkDependencies = function (cb) {
    child_process.exec("/usr/bin/type convert", function (err, stdout) {
        if (err || stdout === "") return cb("ImageMagick binary not found");
        child_process.exec("/usr/bin/type gm", function (err, stdout) {
            if (err || stdout === "") return cb("GraphicsMagick binary not found");
            cb(null);
        });
    });
};

exports.generateBaseIcons = function (inputImg, cb) {
    // Generate image with radius and rounded one
    const rectRadius = Buffer.from('<svg><rect x="0" y="0" width="1024" height="1024" rx="85" ry="85" /></svg>');
    const circle = Buffer.from('<svg><rect x="0" y="0" width="1024" height="1024" rx="512" ry="512" /></svg>');

    // Create tmp dir if not exists
    mkdirp('./tmp').then(made => {
        let radiusImg = sharp(inputImg).resize(1024, 1024).composite([{ input: rectRadius, blend: 'dest-in' }]).toFile('./tmp/icon-radius.png', (err, info, data) => {
            let roundImg = sharp(inputImg).resize(1024, 1024).composite([{ input: circle, blend: 'dest-in' }]).toFile('./tmp/icon-round.png', (err2, info2, data2) => {
                return cb(null, './tmp/icon-radius.png', './tmp/icon-round.png');
            });
        });
    });
}

exports.generateIcons = function (inputImageOriginal, inputImgRadius, inputImgRound, outputPath, platform, device, type, cb) {
    var iconMeta = config.icons,
        error;

    if (!fs.statSync(inputImageOriginal).isFile()) {
        error = new Error("Original image not found: " + inputImageOriginal);
        if (cb) return cb(error);
        else throw error;
    }

    if (!fs.statSync(inputImgRadius).isFile()) {
        error = new Error("Input image radius not found: " + inputImgRadius);
        if (cb) return cb(error);
        else throw error;
    }

    if (!fs.statSync(inputImgRound).isFile()) {
        error = new Error("Input image round not found: " + inputImgRound);
        if (cb) return cb(error);
        else throw error;
    }

    switch (platform) {
        case 'ios':
            switch (device) {
                // case 'phone':
                //     iconMeta = _.where(config.icons, { platform: 'iOS', device: 'phone' }).filter(x => x.type !== 'Splash');
                //     break;
                // case 'tablet':
                //     iconMeta = _.where(config.icons, { platform: 'iOS', device: 'tablet' }).filter(x => x.type !== 'Splash');;
                //     break;
                default:
                    {

                        if (type && type === 'Splash') {
                            iconMeta = _.where(config.icons, { platform: 'iOS', type: 'Splash' });
                            outputPath = path.join(outputPath, config.output.iosDir, 'Assets.xcassets', 'Splash.imageset')
                        } else {
                            iconMeta = _.where(config.icons, { platform: 'iOS' }).filter(x => x.type !== 'Splash');
                            outputPath = path.join(outputPath, config.output.iosDir, 'Assets.xcassets', 'AppIcon.appiconset')
                        }
                        createIOSIconFolders(outputPath);
                        //criar Contents.json
                        const contents = iconMeta.map(x => ({
                            "size": `${x.width}x${x.height}`,
                            "expected-size": x.file_name.replace('.png', ''),
                            "filename": x.file_name,
                            "folder": `${x.folder}/`,
                            "idiom": x.device,
                            "scale": `${(Number(x.file_name.replace('.png', '')) / x.width)}x`
                        }));
                        fs.appendFile(
                            path.join(outputPath, 'Contents.json'),
                            `{"images":${JSON.stringify(contents)}}`,
                            function (err) {
                                if (err) throw err;
                            }
                        );

                    } break;
            }

            break;
        case 'android':
            {
                switch (true) {
                    case type === 'Notification icon':
                        iconMeta = _.where(config.icons, { platform: 'Android', type: 'Notification icon' });
                        createAndroidIconNotificationFolders(outputPath);
                        break;
                    case type === 'Splash':
                        iconMeta = _.where(config.icons, { platform: 'Android', type: 'Splash' });
                        createAndroidIconNotificationFolders(outputPath);
                        break;
                    default:
                        iconMeta = _.where(config.icons, { platform: 'Android', type: 'Launcher Icon' });
                        createAndroidIconFolders(outputPath);
                        break;
                }
            }
            break
        case 'web':
            iconMeta = _.where(config.icons, { platform: 'Web' });
            createWebIconFolders(outputPath);
            break
        default:
            createAndroidIconFolders(outputPath);
            createWebIconFolders(outputPath);
            createIOSIconFolders(path.join(outputPath, config.output.iosDir));
            break;
    }

    async.each(iconMeta, function (meta, cb) {
        var _inputImage = inputImageOriginal;
        if (meta.radius) _inputImage = inputImgRadius;
        if (meta.round) _inputImage = inputImgRound;
        var outputFile;
        switch (meta.platform) {
            case 'iOS':
                outputFile = path.join(outputPath, meta.file_name);
                break;
            case 'Android':
                if (meta.type === 'Launcher Icon') {
                    outputFile = path.join(outputPath, config.output.androidDir, 'res', 'mipmap-' + meta.resolution, meta.file_name);
                } else if (meta.type === 'Notification icon' || meta.type === 'Splash') {
                    outputFile = path.join(outputPath, config.output.androidDir, 'res', 'drawable-' + meta.resolution, meta.file_name);
                }
                else {
                    outputFile = path.join(outputPath, config.output.androidDir, meta.file_name);
                }
                break;
            case 'Web':
                outputFile = path.join(outputPath, config.output.webDir, meta.file_name);
                break;
            default:
                break;
        }


        if (meta.platform == 'Web') {
            im.convert([_inputImage, '-bordercolor', 'white', '-border', '0', '-alpha', 'off', '-colors', '256', '-resize', meta.width + 'x' + meta.height, outputFile], function (err) {
                if (err) {
                    console.error("Error generating %s (res: %s) icon: %s:: %s", meta.platform, (meta.resolution || ''), meta.file_name, err);
                    return cb(error);
                } else {
                    //console.log("Generated %s (res: %s) icon: %s", meta.platform, (meta.resolution || ''), meta.file_name);
                    cb(null);
                }
            });
        } else if (meta.type === 'Notification icon') {
            gm(_inputImage)
                .background('none')
                .noProfile()
                .negative()
                .monochrome()
                .resize(meta.width, meta.height)
                .gravity('Center')
                .extent(meta.width, meta.height)
                .quality(100)
                .write(outputFile, function (err) {
                    if (err) {
                        console.error("Error generating %s (res: %s) icon: %s:: %s", meta.platform, (meta.resolution || ''), meta.file_name, err);
                        return cb(error);
                    } else {
                        console.log("Generated %s (res: %s) icon: %s", meta.platform, (meta.resolution || ''), meta.file_name);
                        cb(null);
                    }
                });
        } else {
            gm(_inputImage)
                .background('none')
                .noProfile()
                .resize(meta.width, meta.height)
                .gravity('Center')
                .extent(meta.width, meta.height)
                .quality(100)
                .write(outputFile, function (err) {
                    if (err) {
                        console.error("Error generating %s (res: %s) icon: %s:: %s", meta.platform, (meta.resolution || ''), meta.file_name, err);
                        return cb(error);
                    } else {
                        //console.log("Generated %s (res: %s) icon: %s", meta.platform, (meta.resolution || ''), meta.file_name);
                        cb(null);
                    }
                });
        }
    }, function (err) {
        if (err) {
            if (cb) return cb(err);
            else throw err;
        }
        fse.remove(inputImgRadius).then((err) => {
            fse.remove(inputImgRound).then((err) => {
                fse.remove('./tmp').then((err) => {
                    // if (platform === 'android') {
                    //     fs.stat('./android/app/src/main/res', (err, stats) => {
                    //         if (!err) {
                    //             var androidPath = outputPath + config.output.androidDir;
                    //             androidPath = androidPath.replace(/\\/g, '/');

                    //             mergedirs.default(androidPath, './android/app/src/main', 'overwrite');

                    //             fse.remove(androidPath).then((err) => {
                    //                 console.log('> Android icons moved to: ' + './android/app/src/main/res');
                    //             });
                    //         }
                    //     });
                    // }
                    // if (platform === 'ios') {
                    //     find('./ios/', (path, stat) => {
                    //         var isIconSet = path.match(/AppIcon.appiconset/) && stat.isDirectory();

                    //         var iosPath = outputPath + config.output.iosDir;
                    //         iosPath = iosPath.replace(/\\/g, '/');

                    //         if (isIconSet) {
                    //             mergedirs.default(iosPath, path, 'overwrite');

                    //             fse.remove(iosPath).then((err) => {
                    //                 console.log('> iOS icons moved to: ' + path);
                    //             });
                    //         }
                    //     });
                    // }
                    // fse.remove(outputPath + config.output.webDir).then((err) => { });
                    if (cb) cb(null);
                });
            });
        });
    });
};
