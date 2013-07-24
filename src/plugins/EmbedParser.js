var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="../../dec/node.d.ts"/>
///<reference path="../TypescriptPreprocessor.ts"/>
///<reference path="../utils/NodeStringImage"/>
///<reference path="../utils/BinaryPacker"/>
///<reference path="../utils/LibraryAtlas"/>
var TSP = require('../TypescriptPreprocessor');
var path = require('path');
var fs = require('fs');
var PNG = require('../utils/NodeStringImage');
var ATLAS = require('../utils/LibraryAtlas');
var BIN = require('../utils/BinaryPacker');
var SVGConverter = require('svg2ctx');
var Canvas = require('canvas');
var Image = require('canvas').Image;
var clc = require('cli-color');
var execFile = require('child_process').execFile;
var optipngPath = require('optipng-bin').path;
var handlebars = require('handlebars');

var OptiPngCompressionLevel = (function () {
    function OptiPngCompressionLevel() {
    }
    OptiPngCompressionLevel.isLevel = function (level) {
        return /none|low|med|high|best/gi.test(level);
    };
    OptiPngCompressionLevel.NONE = "none";
    OptiPngCompressionLevel.LOW = "low";
    OptiPngCompressionLevel.MED = "med";
    OptiPngCompressionLevel.HIGH = "high";
    OptiPngCompressionLevel.BEST = "best";
    return OptiPngCompressionLevel;
})();
exports.OptiPngCompressionLevel = OptiPngCompressionLevel;
var OptiPngCompressionLevelOptions = (function () {
    function OptiPngCompressionLevelOptions() {
    }
    OptiPngCompressionLevelOptions.none = "-o0";
    OptiPngCompressionLevelOptions.low = "-o2";
    OptiPngCompressionLevelOptions.med = "-o4";
    OptiPngCompressionLevelOptions.high = "-o6";
    OptiPngCompressionLevelOptions.best = "-o9";
    return OptiPngCompressionLevelOptions;
})();
exports.OptiPngCompressionLevelOptions = OptiPngCompressionLevelOptions;

var EmbedParserFileTypes = (function () {
    function EmbedParserFileTypes() {
    }
    EmbedParserFileTypes.PNG = ".png";
    EmbedParserFileTypes.JS = ".js";
    EmbedParserFileTypes.SVG = ".svg";
    EmbedParserFileTypes.CSS = ".css";
    return EmbedParserFileTypes;
})();
exports.EmbedParserFileTypes = EmbedParserFileTypes;
var EmbedParserSvgFormat = (function () {
    function EmbedParserSvgFormat() {
    }
    EmbedParserSvgFormat.PNG = "png";
    EmbedParserSvgFormat.CTX = "ctx";
    return EmbedParserSvgFormat;
})();
exports.EmbedParserSvgFormat = EmbedParserSvgFormat;

var EmbedParser = (function (_super) {
    __extends(EmbedParser, _super);
    function EmbedParser() {
        _super.apply(this, arguments);
        this.priority = 0;
        this.filter = ".lib.ts";
        this.config = {};
        this.asyncEmbedPending = 0;
        this.ctxTemplate = fs.readFileSync(__dirname + '/../templates/ctxClassTemplate.tpl', 'utf8');
    }
    EmbedParser.prototype.filterFile = function (inputFile) {
        return /\.lib\.tsp/gi.test(inputFile);
    };
    EmbedParser.prototype.register = function () {
        console.log(clc.blue.bold('Installing Plugin: EmbedParser'));
    };
    EmbedParser.prototype.processFile = function (content, input, callback) {
        this.callback = callback;
        this.originalData = { input: input, code: content };
        this.asyncEmbedPending = 0;

        var embedLibraryData = EmbedParser.findEmbedClass.exec(content);
        var embedLibraryDataObject;
        try  {
            embedLibraryDataObject = eval("(function(){ return " + embedLibraryData[1] + ' })();');
            this.atlasSortingAlgorithm = embedLibraryDataObject.hasOwnProperty('sort') ? embedLibraryDataObject.sort : 'maxside';
            this.optiPngCompressionLevel = embedLibraryDataObject.hasOwnProperty('compression') ? OptiPngCompressionLevel.isLevel(embedLibraryDataObject.compression) ? embedLibraryDataObject.compression.toLowerCase() : OptiPngCompressionLevel.NONE : OptiPngCompressionLevel.NONE;
        } catch (err) {
            console.log(clc.blue.bold('Incorrect library definition\n'));
        }
        this.library = new ATLAS.LibraryAtlas(embedLibraryDataObject.name);
        var foundEmbeds;
        while (foundEmbeds = EmbedParser.findEmbeds.exec(content)) {
            var embed = eval("(function(){ return " + foundEmbeds[2] + ' })();');
            this.addElementToLibrary(embed, foundEmbeds[1] == "@" ? true : false);
        }

        this.checkPending();
    };

    EmbedParser.prototype.addElementToLibrary = function (embed, forceUpdate) {
        if (typeof forceUpdate === "undefined") { forceUpdate = true; }
        this.processEmbed(embed, forceUpdate);
    };

    EmbedParser.prototype.fileExists = function (path) {
        return fs.existsSync(TSP.TypescriptPreprocessor.root + '/' + path);
    };

    EmbedParser.prototype.getEmbedDataForFile = function (input) {
        return TSP.TypescriptPreprocessor.readConfigFile(input.replace('.ts', '.json'));
    };
    EmbedParser.prototype.processEmbed = function (embed, forceUpdate) {
        if (typeof forceUpdate === "undefined") { forceUpdate = true; }
        var _this = this;
        if (!this.fileExists(embed.src)) {
            console.log(clc.red('Can\'t find ' + embed.src + ' in source folders'));
            return;
        }

        // types
        // 0=>PNG
        // 1=>JS
        // 2=>CSS
        // 3=>SHAPE
        // 4=>TXT
        var srcExtension = path.extname(embed.src.toLowerCase());

        switch (srcExtension) {
            case EmbedParserFileTypes.PNG:
                //var stats = fs.statSync( path ).mtime.getTime();
                //console.log('Add PNG:'+embed.src+' as '+embed.member  )
                this.library.add(embed.member, this.loadImage(embed), 0);
                break;
            case EmbedParserFileTypes.JS:
                //console.log('Add JS:'+embed.src+' as '+embed.member  )
                this.library.add(embed.member, this.sourceFileToPNG(embed), 1);

                break;
            case EmbedParserFileTypes.CSS:
                //console.log('Add JS:'+embed.src+' as '+embed.member  )
                this.library.add(embed.member, this.sourceFileToPNG(embed), 2);

                break;
            case EmbedParserFileTypes.SVG:
                if (embed.format == EmbedParserSvgFormat.PNG) {
                    //console.log('Add SVG=>PNG:'+embed.src+' as '+embed.member  )
                    this.asyncEmbedPending++;
                    SVGConverter.convertToCanvas(embed.src, function (data) {
                        _this.library.add(embed.member, data, 0);
                        _this.asyncEmbedPending--;
                    });
                } else {
                    //console.log('Add SVG=>CTX:'+embed.src+' as '+embed.member  )
                    this.asyncEmbedPending++;
                    SVGConverter.convertToCode(TSP.TypescriptPreprocessor.root + embed.src, embed.member, 'pulsar.lib.shapes.' + this.library.uid.toLowerCase(), this.ctxTemplate, function (data) {
                        _this.library.add(embed.member, _this.sourceCodeToPNG(data), 3);
                        _this.asyncEmbedPending--;
                    });
                }
                break;

            default:
                //console.log('Add file as TextFile:'+embed.src );
                this.library.add(embed.member, this.sourceFileToPNG(embed), 4);
                break;
        }
    };

    /*
    private maskData( autoload:boolean, type:number ):number
    {
    return ( autoload?128:0 ) | type;
    }*/
    EmbedParser.prototype.loadImage = function (embed) {
        var imageSource = fs.readFileSync(TSP.TypescriptPreprocessor.root + embed.src);
        var img = new Image();
        img.src = imageSource;
        return img;
    };
    EmbedParser.prototype.loadFile = function (embed) {
        return fs.readFileSync(TSP.TypescriptPreprocessor.root + embed.src, 'utf8');
    };
    EmbedParser.prototype.sourceFileToPNG = function (embed) {
        return PNG.NodeStringImage.encode(this.loadFile(embed));
    };
    EmbedParser.prototype.sourceCodeToPNG = function (data) {
        return PNG.NodeStringImage.encode(data, 256);
    };
    EmbedParser.prototype.checkPending = function () {
        this.asyncEmbedPending--;
        if (this.asyncEmbedPending <= 0) {
            var sort = BIN.BinarySortType[this.atlasSortingAlgorithm.toUpperCase()] || BIN.BinarySortType.MAXSIDE;
            this.writeLibrary(this.originalData.input, this.library.render(sort).toDataURL().replace(/^data:image\/png;base64,/, ""));
        }
    };

    EmbedParser.prototype.writeLibrary = function (input, data) {
        var _this = this;
        var outputPngFile = TSP.TypescriptPreprocessor.root + input.replace('.tsp', '.png');
        fs.writeFileSync(outputPngFile, data, 'base64');
        var fileSize = fs.statSync(outputPngFile).size;
        if (this.optiPngCompressionLevel != OptiPngCompressionLevel.NONE) {
            execFile(optipngPath, [OptiPngCompressionLevelOptions[this.optiPngCompressionLevel], '-nx', '-strip all', outputPngFile], function (err, stdout, stderr) {
                var resultFileSize = fs.statSync(outputPngFile).size;
                var gained = (fileSize - resultFileSize);
                console.log('Output lib filesize (' + _this.optiPngCompressionLevel.toUpperCase() + '): (' + fileSize + ')=> ' + resultFileSize + ' bytes (-' + gained + ' bytes).');

                // Return point!!
                _this.callback(_this.originalData.input, _this.originalData.code);
            });
        } else {
            // Return point!!
            console.log('Output lib filesize: ' + fileSize + ' bytes.');
            this.callback(this.originalData.input, this.originalData.code);
        }
    };
    EmbedParser.findEmbedClass = /\/\/\/@embedLibrary[\s]?({.*})/gi;
    EmbedParser.findEmbeds = /\/\/\/([@-])embed[\s]?({.*})/gi;
    return EmbedParser;
})(TSP.TSPreprocesorBasePlugin);
exports.EmbedParser = EmbedParser;

