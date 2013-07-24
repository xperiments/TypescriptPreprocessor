///<reference path="../../dec/node.d.ts"/>
///<reference path="../TypescriptPreprocessor.ts"/>
import TSP = module('../TypescriptPreprocessor');
var clc = require('cli-color');
interface IDuckTypeDeclaration
{
    className:string;
    methodNames:string;
    propertyNames:string;
}

interface IDuckType
{
    [ name:string ]:IDuckTypeDeclaration;
}

export class DuckTypingInterfacePreprocesor extends TSP.TSPreprocesorBasePlugin
{

    /* INTERFACE IMPLEMENTATION */
    public priority:number = 2;
	register()
	{
		console.log(clc.blue.bold( 'Installing Plugin: DuckTypingInterfacePreprocesor' ));
	}
    processFile( content:string, input:string, callback:TSP.ITSPreprocessorCallback ):void
    {
        var className:string = TSP.TypescriptPreprocessor.getClassName(this);
        var processedDuckType:IDuckType = DuckTypingInterfacePreprocesor.parse( content, className  );
		callback( input, DuckTypingInterfacePreprocesor.generateInterfaceDuck( content, processedDuckType, className ) );
    }

    /* PRIVATE */
    private static findInterfaceNameRegExp:RegExp = /interface\s*([a-zA-Z0-9]*).*IComparable/g;
    private static findDefinitions:RegExp = /IComparable[\s\S]*?{([\s\S]*?)}/g;
    private static findMethodsRegExp:RegExp = /\s*([a-zA-Z0-9: ]*)\(/g;
    private static findProps:RegExp = /([^\([\s][a-zA-Z0-9]+?)[a-zA-Z0-9]+?\s*:\s*[^\(\s]/g;




    private static classTemplate:string =         "\n\
    class I@className implements IInterfaceChecker \n\
    {                                              \n\
        className:string = '@className';           \n\
        @methodNames                               \n\
        @propertyNames                             \n\
    }                                              \n";



    private static parse( str:string, className:string ):IDuckType
    {

        var returnObj:IDuckType = {};
        var interfaces:string[] = [];
        var interfaceDefinitions:string[] = [];
        var interfaceNameResult:RegExpExecArray;
        var definitionResult:RegExpExecArray;
        var foundMethods:string[] = [];
        var foundMethodsResult:RegExpExecArray;
        var foundProperties:string[] = [];
        var foundPropertiesResult:RegExpExecArray;
        var currentInterfaceIndex:number = 0;

        /* Search all the interfaces that implements IComparable */
        while(  interfaceNameResult = DuckTypingInterfacePreprocesor.findInterfaceNameRegExp.exec( str ) )
        {
            interfaces.push( interfaceNameResult[1] );
        }

        /* Process all methods/props of Interface Definitions that implements IComparable */
        while( definitionResult=DuckTypingInterfacePreprocesor.findDefinitions.exec(str) )
        {

            foundMethods = [];
            foundProperties = [];
            /* Process methods */
            while(  foundMethodsResult = DuckTypingInterfacePreprocesor.findMethodsRegExp.exec( definitionResult[1] ) )
            {
                foundMethods.push( foundMethodsResult[1].split(':')[0].trim() );
            }

            /* Process Properties */
            while(  foundPropertiesResult = DuckTypingInterfacePreprocesor.findProps.exec( definitionResult[1] ) )
            {
                foundProperties.push( foundPropertiesResult[0].split(':')[0].trim() );
            }

            returnObj[ interfaces[ currentInterfaceIndex ] ] =
            {
                className:interfaces[ currentInterfaceIndex ],
                methodNames:JSON.stringify( <any>foundMethods ),
                propertyNames:JSON.stringify( <any>foundProperties )
            }
            currentInterfaceIndex++;
        }

        return returnObj;

    }


    private static generateInterfaceDuck( content:string, duck:IDuckType, className:string ):string
    {

        // replace previous generated code;
        var findCommentsRegExp:RegExp = new RegExp("\\/\\*!"+className+"GeneratedCommentsStart\\*\\/([\\s\\S]*)\\/\\*!"+className+"GeneratedCommentsEnd\\*\\/",'gi')
        content = content.replace( findCommentsRegExp,'' );

        var generatedInterfaceCommentsStart:string = "/*!"+className+"GeneratedCommentsStart*/\n";
        var generatedInterfaceCommentsEnd:string = "/*!"+className+"GeneratedCommentsEnd*/\n";

        var output:string = generatedInterfaceCommentsStart;
        var isEmpty:boolean = true;
        for( var i in duck )
        {
            var template:string = DuckTypingInterfacePreprocesor.classTemplate;
            template = template.replace( '@className', i );
            template = template.replace( '@className', i );

            var methods:string = duck[i].methodNames;
            var props:string = duck[i].propertyNames;

            template = template.replace( '@methodNames', methods=="[]"? '':('methodNames:string[] = '+methods+';') );
            template = template.replace( '@propertyNames', props=="[]"? '':('propertyNames:string[] = '+props+';') );
            output+=template;
            isEmpty = false;
        }
        output+=generatedInterfaceCommentsEnd;
        return isEmpty ? content: content+'\n'+output;
    }

}


