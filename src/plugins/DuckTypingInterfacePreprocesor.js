var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="../../dec/node.d.ts"/>
///<reference path="../TypescriptPreprocessor.ts"/>
var TSP = require('../TypescriptPreprocessor');
var clc = require('cli-color');

var DuckTypingInterfacePreprocesor = (function (_super) {
    __extends(DuckTypingInterfacePreprocesor, _super);
    function DuckTypingInterfacePreprocesor() {
        _super.apply(this, arguments);
        /* INTERFACE IMPLEMENTATION */
        this.priority = 2;
    }
    DuckTypingInterfacePreprocesor.prototype.register = function () {
        console.log(clc.blue.bold('Installing Plugin: DuckTypingInterfacePreprocesor'));
    };
    DuckTypingInterfacePreprocesor.prototype.processFile = function (content, input, callback) {
        var className = TSP.TypescriptPreprocessor.getClassName(this);
        var processedDuckType = DuckTypingInterfacePreprocesor.parse(content, className);
        callback(input, DuckTypingInterfacePreprocesor.generateInterfaceDuck(content, processedDuckType, className));
    };

    DuckTypingInterfacePreprocesor.parse = function (str, className) {
        var returnObj = {};
        var interfaces = [];
        var interfaceDefinitions = [];
        var interfaceNameResult;
        var definitionResult;
        var foundMethods = [];
        var foundMethodsResult;
        var foundProperties = [];
        var foundPropertiesResult;
        var currentInterfaceIndex = 0;

        while (interfaceNameResult = DuckTypingInterfacePreprocesor.findInterfaceNameRegExp.exec(str)) {
            interfaces.push(interfaceNameResult[1]);
        }

        while (definitionResult = DuckTypingInterfacePreprocesor.findDefinitions.exec(str)) {
            foundMethods = [];
            foundProperties = [];

            while (foundMethodsResult = DuckTypingInterfacePreprocesor.findMethodsRegExp.exec(definitionResult[1])) {
                foundMethods.push(foundMethodsResult[1].split(':')[0].trim());
            }

            while (foundPropertiesResult = DuckTypingInterfacePreprocesor.findProps.exec(definitionResult[1])) {
                foundProperties.push(foundPropertiesResult[0].split(':')[0].trim());
            }

            returnObj[interfaces[currentInterfaceIndex]] = {
                className: interfaces[currentInterfaceIndex],
                methodNames: JSON.stringify(foundMethods),
                propertyNames: JSON.stringify(foundProperties)
            };
            currentInterfaceIndex++;
        }

        return returnObj;
    };

    DuckTypingInterfacePreprocesor.generateInterfaceDuck = function (content, duck, className) {
        // replace previous generated code;
        var findCommentsRegExp = new RegExp("\\/\\*!" + className + "GeneratedCommentsStart\\*\\/([\\s\\S]*)\\/\\*!" + className + "GeneratedCommentsEnd\\*\\/", 'gi');
        content = content.replace(findCommentsRegExp, '');

        var generatedInterfaceCommentsStart = "/*!" + className + "GeneratedCommentsStart*/\n";
        var generatedInterfaceCommentsEnd = "/*!" + className + "GeneratedCommentsEnd*/\n";

        var output = generatedInterfaceCommentsStart;
        var isEmpty = true;
        for (var i in duck) {
            var template = DuckTypingInterfacePreprocesor.classTemplate;
            template = template.replace('@className', i);
            template = template.replace('@className', i);

            var methods = duck[i].methodNames;
            var props = duck[i].propertyNames;

            template = template.replace('@methodNames', methods == "[]" ? '' : ('methodNames:string[] = ' + methods + ';'));
            template = template.replace('@propertyNames', props == "[]" ? '' : ('propertyNames:string[] = ' + props + ';'));
            output += template;
            isEmpty = false;
        }
        output += generatedInterfaceCommentsEnd;
        return isEmpty ? content : content + '\n' + output;
    };
    DuckTypingInterfacePreprocesor.findInterfaceNameRegExp = /interface\s*([a-zA-Z0-9]*).*IComparable/g;
    DuckTypingInterfacePreprocesor.findDefinitions = /IComparable[\s\S]*?{([\s\S]*?)}/g;
    DuckTypingInterfacePreprocesor.findMethodsRegExp = /\s*([a-zA-Z0-9: ]*)\(/g;
    DuckTypingInterfacePreprocesor.findProps = /([^\([\s][a-zA-Z0-9]+?)[a-zA-Z0-9]+?\s*:\s*[^\(\s]/g;

    DuckTypingInterfacePreprocesor.classTemplate = "\n\
    class I@className implements IInterfaceChecker \n\
    {                                              \n\
        className:string = '@className';           \n\
        @methodNames                               \n\
        @propertyNames                             \n\
    }                                              \n";
    return DuckTypingInterfacePreprocesor;
})(TSP.TSPreprocesorBasePlugin);
exports.DuckTypingInterfacePreprocesor = DuckTypingInterfacePreprocesor;

