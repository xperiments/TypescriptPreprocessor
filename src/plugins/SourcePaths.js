var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="../../dec/node.d.ts"/>
///<reference path="../TypescriptPreprocessor.ts"/>
var TSP = require('../TypescriptPreprocessor');

var fs = require('fs');
var clc = require('cli-color');

var SourcePaths = (function (_super) {
    __extends(SourcePaths, _super);
    function SourcePaths() {
        _super.apply(this, arguments);
        this.priority = 1;
    }
    SourcePaths.prototype.filterFile = function (inputFile) {
        return /sources\.tsp/gi.test(inputFile);
    };
    SourcePaths.prototype.register = function () {
        console.log(clc.blue.bold('Installing Plugin: SourcePaths'));
        if (!fs.existsSync(SourcePaths.sourceFilePath)) {
            fs.writeFileSync(SourcePaths.sourceFilePath, "///<!SOURCE_FOLDER_PATHS>");
        }
        var config = TSP.TypescriptPreprocessor.readProjectConfig();
        config.pluginData['SourcePaths'] = { sources: [] };
        TSP.TypescriptPreprocessor.writeProjectConfig(config);
    };
    SourcePaths.prototype.processFile = function (content, input, callback) {
        console.log(clc.blue.bold('Processing SourceFolder paths.'));
        var sourcepathsContent = fs.readFileSync(SourcePaths.sourceFilePath, 'utf8');
        var foundSourcePaths;
        var config = TSP.TypescriptPreprocessor.readProjectConfig();
        var sources = [];
        while (foundSourcePaths = SourcePaths.findSourceFolders.exec(sourcepathsContent)) {
            sources.push(foundSourcePaths[1]);
        }

        config.pluginData['SourcePaths'] = { sources: sources };

        TSP.TypescriptPreprocessor.writeProjectConfig(config);
        callback(input, content);
    };
    SourcePaths.findSourceFolders = /\/\/\/@source\s["']?([\/a-zA-Z0-9 ]*)["']?/gi;

    SourcePaths.sourceFilePath = TSP.TypescriptPreprocessor.root + '/sources.tsp';
    return SourcePaths;
})(TSP.TSPreprocesorBasePlugin);
exports.SourcePaths = SourcePaths;

