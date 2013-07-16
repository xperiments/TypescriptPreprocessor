var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="../../dec/node.d.ts"/>
///<reference path="../TypescriptPreprocessor.ts"/>
var TSP = require('../TypescriptPreprocessor');
var path = require('path');
var fs = require('fs');
var clc = require('cli-color');
var ImportsToReference = (function (_super) {
    __extends(ImportsToReference, _super);
    function ImportsToReference() {
        _super.apply(this, arguments);
        this.priority = 3;
    }
    /* INTERFACE IMPLEMENTATION */
    ImportsToReference.prototype.register = function () {
        console.log(clc.blue.bold('Installing Plugin: ImportsToReference'));
        var config = TSP.TypescriptPreprocessor.readProjectConfig();
        config.pluginData['ImportsToReference'] = { enableUndo: false };
        TSP.TypescriptPreprocessor.writeProjectConfig(config);
    };
    ImportsToReference.prototype.processFile = function (content, input, callback) {
        var config = TSP.TypescriptPreprocessor.readProjectConfig();
        var root = TSP.TypescriptPreprocessor.root;
        var sourcePaths = TSP.TypescriptPreprocessor.readProjectConfig().pluginData['SourcePaths'].sources;
        var foundImports;

        while (foundImports = ImportsToReference.findImports.exec(content)) {
            var file = '/' + foundImports[2].split('.').join('/') + '.ts';
            var found = false;
            for (var i = 0, total = sourcePaths.length; i < total; i++) {
                var sourcePath = sourcePaths[i];
                var sourceFolder = root + sourcePath;
                var nativePath = sourceFolder + file;
                var relativeToSourceFolder = path.relative(sourceFolder, root);
                var referencePath = relativeToSourceFolder + sourcePath + file;
                if (fs.existsSync(nativePath)) {
                    content = content.replace(foundImports[0], '///<reference path="' + referencePath + '"/>' + (config.pluginData['ImportsToReference'].enableUndo ? foundImports[1] : ''));
                    console.log(clc.green('Processed @import ' + foundImports[1]));
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.log(clc.red('Can\'t find ' + file + ' in source paths.'));
            }
        }
        callback(input, content);
    };
    ImportsToReference.findImports = /\/\/\/ ?(@import *((?:[a-z][a-z\.\d\-_\$]+)\.?(?:[a-z][a-z\.\d\-_\$]+))(?![\w\.])[;])/gi;
    return ImportsToReference;
})(TSP.TSPreprocesorBasePlugin);
exports.ImportsToReference = ImportsToReference;

