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
var DefinitionToReference = (function (_super) {
    __extends(DefinitionToReference, _super);
    function DefinitionToReference() {
        _super.apply(this, arguments);
        this.priority = 4;
    }
    /* INTERFACE IMPLEMENTATION */
    DefinitionToReference.prototype.register = function () {
        console.log(clc.blue.bold('Installing Plugin: DefinitionToReference'));
        var config = TSP.TypescriptPreprocessor.readProjectConfig();
        config.pluginData['DefinitionToReference'] = { enableUndo: false };
        TSP.TypescriptPreprocessor.writeProjectConfig(config);
    };
    DefinitionToReference.prototype.processFile = function (content, input, callback) {
        var config = TSP.TypescriptPreprocessor.readProjectConfig();
        var root = TSP.TypescriptPreprocessor.root;
        var sourcePaths = TSP.TypescriptPreprocessor.readProjectConfig().pluginData['SourcePaths'].sources;
        var foundImports;

        while (foundImports = DefinitionToReference.findImports.exec(content)) {
            for (var i = 0, total = sourcePaths.length; i < total; i++) {
                var sourcePath = sourcePaths[i];
                var sourceFolder = root + sourcePath;
                var file = '/' + foundImports[2].split('.').join('/') + '.d.ts';
                var nativePath = sourceFolder + file;
                var relativeToSourceFolder = path.relative(sourceFolder, root);
                var referencePath = relativeToSourceFolder + sourcePath + file;
                if (fs.existsSync(nativePath)) {
                    content = content.replace(foundImports[0], '///<reference path="' + referencePath + '"/>' + (config.pluginData['DefinitionToReference'].enableUndo ? foundImports[1] : ''));
                    console.log(clc.green('Processed @import ' + foundImports[1]));

                    break;
                } else {
                    console.log(clc.red('Could no process @define ' + foundImports[2] + ' ' + nativePath + ' does not exists'));
                }
            }
        }
        callback(input, content);
    };
    DefinitionToReference.findImports = /\/\/\/ ?(@define *((?:[a-z][a-z\.\d\-_\$]+)\.?(?:[a-z][a-z\.\d\-_\$]+))(?![\w\.])[;])/gi;
    return DefinitionToReference;
})(TSP.TSPreprocesorBasePlugin);
exports.DefinitionToReference = DefinitionToReference;

