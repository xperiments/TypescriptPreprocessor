///<reference path="../dec/node.d.ts"/>
var path = require('path');
var fs = require('fs');

var TSPreprocesorBasePlugin = (function () {
    function TSPreprocesorBasePlugin() {
    }
    TSPreprocesorBasePlugin.prototype.filterFile = function (inputFile) {
        return /\.ts/gi.test(inputFile);
    };

    // initialize the pluging here ... create some config file etc
    TSPreprocesorBasePlugin.prototype.register = function () {
    };

    // process the content of the file
    TSPreprocesorBasePlugin.prototype.processFile = function (content, inputFile, callback) {
        callback(inputFile, content);
    };
    return TSPreprocesorBasePlugin;
})();
exports.TSPreprocesorBasePlugin = TSPreprocesorBasePlugin;

var TypescriptPreprocessor = (function () {
    function TypescriptPreprocessor() {
    }
    TypescriptPreprocessor.getClassName = function (instance) {
        var text = Function.prototype.toString.call(instance.constructor);
        return text.match(/function (.*)\(/)[1];
    };

    TypescriptPreprocessor.cmd = function () {
        var argv = require('optimist').argv;
        if (argv.install) {
            TypescriptPreprocessor.root = process.cwd();
            TypescriptPreprocessor.PLUGINS_DIR = TypescriptPreprocessor.root + "/src/plugins/";
            TypescriptPreprocessor.configFilePath = TypescriptPreprocessor.root + '/' + TypescriptPreprocessor.configFile;
            TypescriptPreprocessor.getPlugins();
            TypescriptPreprocessor.createProjectInstall();
            return;
        }

        TypescriptPreprocessor.root = argv.root;
        TypescriptPreprocessor.inputFile = argv.input;

        TypescriptPreprocessor.PLUGINS_DIR = TypescriptPreprocessor.root + "/src/plugins/";
        TypescriptPreprocessor.configFilePath = TypescriptPreprocessor.root + '/' + TypescriptPreprocessor.configFile;

        TypescriptPreprocessor.readProjectConfig();
        TypescriptPreprocessor.getPlugins();
        TypescriptPreprocessor.processFile(TypescriptPreprocessor.inputFile);
    };

    TypescriptPreprocessor.readProjectConfig = function () {
        TypescriptPreprocessor.config = JSON.parse(fs.readFileSync(TypescriptPreprocessor.configFilePath, 'utf8'));
        return TypescriptPreprocessor.config;
    };

    TypescriptPreprocessor.writeProjectConfig = function (config) {
        if (typeof config === "undefined") { config = TypescriptPreprocessor.config; }
        fs.writeFileSync(TypescriptPreprocessor.configFilePath, JSON.stringify(config, null, '	'));
    };

    TypescriptPreprocessor.readConfigFile = function (path) {
        return JSON.parse(fs.readFileSync(TypescriptPreprocessor.root + '/' + path, 'utf8'));
    };
    TypescriptPreprocessor.writeConfigFile = function (path, config, beautify) {
        if (typeof beautify === "undefined") { beautify = true; }
        fs.writeFileSync(TypescriptPreprocessor.root + '/' + path, JSON.stringify(config, null, beautify ? '	' : ''));
    };

    TypescriptPreprocessor.createProjectInstall = function () {
        var currentDir = process.cwd();
        var tsconfigpath = path.resolve(currentDir, TypescriptPreprocessor.configFile);
        if (!fs.existsSync(tsconfigpath)) {
            var initialConfig = {
                root: currentDir,
                pluginData: {}
            };
            TypescriptPreprocessor.writeProjectConfig(initialConfig);

            for (var i in TypescriptPreprocessor.avaliablePlugins) {
                TypescriptPreprocessor.newPlugin(TypescriptPreprocessor.avaliablePlugins[i]).register();
            }
        } else {
            console.log('Current project already has a config file');
        }
    };
    TypescriptPreprocessor.processFile = function (input) {
        var inputContents = fs.readFileSync(TypescriptPreprocessor.root + input, 'utf8');
        TypescriptPreprocessor.currentFileOriginalContents = inputContents;
        TypescriptPreprocessor.processNextPlugin(input, inputContents);
    };

    TypescriptPreprocessor.processNextPlugin = function (input, inputContents) {
        if (TypescriptPreprocessor.currentPluginProcess < TypescriptPreprocessor.avaliablePlugins.length) {
            // instanciate pluging
            var currentPlugin = TypescriptPreprocessor.newPlugin(TypescriptPreprocessor.avaliablePlugins[TypescriptPreprocessor.currentPluginProcess]);

            if (currentPlugin.filterFile(input)) {
                currentPlugin.processFile(inputContents, input, TypescriptPreprocessor.onPluginProcessed);
            } else {
                TypescriptPreprocessor.currentPluginProcess++;
                TypescriptPreprocessor.processNextPlugin(input, inputContents);
            }
        } else {
            if (TypescriptPreprocessor.currentFileOriginalContents != inputContents) {
                fs.writeFileSync(TypescriptPreprocessor.root + input, inputContents);
                console.log('Preprocessor parsing done.');
            } else {
                console.log('Preprocessor finished without changes.');
            }
        }
    };

    TypescriptPreprocessor.onPluginProcessed = function (input, inputContents) {
        TypescriptPreprocessor.currentPluginProcess++;
        TypescriptPreprocessor.processNextPlugin(input, inputContents);
    };
    TypescriptPreprocessor.getPlugins = function () {
        fs.readdirSync(TypescriptPreprocessor.PLUGINS_DIR).forEach(function (file) {
            if (/\.js$/.test(file)) {
                var pluginName = file.replace('.js', '');
                var plugin = require(TypescriptPreprocessor.PLUGINS_DIR + file);

                TypescriptPreprocessor.avaliablePlugins[TypescriptPreprocessor.newPlugin(plugin[pluginName]).priority] = plugin[pluginName];
            }
        });
    };

    TypescriptPreprocessor.newPlugin = function (Plugin) {
        return new Plugin();
    };
    TypescriptPreprocessor.path = require('path');

    TypescriptPreprocessor.avaliablePlugins = [];

    TypescriptPreprocessor.configFile = "tsp.config.json";

    TypescriptPreprocessor.currentPluginProcess = 0;
    TypescriptPreprocessor.currentFileOriginalContents = "";
    return TypescriptPreprocessor;
})();
exports.TypescriptPreprocessor = TypescriptPreprocessor;

