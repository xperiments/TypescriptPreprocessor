///<reference path="../../dec/node.d.ts"/>
///<reference path="../TypescriptPreprocessor.ts"/>
import TSP = module('../TypescriptPreprocessor');
import path = module('path');
import fs = module('fs');
var clc = require('cli-color');
export class ImportsToReference extends TSP.TSPreprocesorBasePlugin implements TSP.ITSPreprocesorPlugin
{

    public priority:number = 3;
    public static findImports:RegExp = /\/\/\/ ?(@import *((?:[a-z][a-z\.\d\-_\$]+)\.?(?:[a-z][a-z\.\d\-_\$]+))(?![\w\.])[;])/gi;

    /* INTERFACE IMPLEMENTATION */
    register()
    {
        console.log(clc.blue.bold( 'Installing Plugin: ImportsToReference' ));
        var config:TSP.ITSPConfig = TSP.TypescriptPreprocessor.readProjectConfig();
        config.pluginData['ImportsToReference'] = { enableUndo:false };
        TSP.TypescriptPreprocessor.writeProjectConfig( config );

    }
    processFile( content:string, input:string , callback:TSP.ITSPreprocessorCallback):void
    {
        var config:TSP.ITSPConfig = TSP.TypescriptPreprocessor.readProjectConfig();
        var root:string = TSP.TypescriptPreprocessor.root;
        var sourcePaths:any = TSP.TypescriptPreprocessor.readProjectConfig().pluginData['SourcePaths'].sources;
        var foundImports:RegExpExecArray;

        while(  foundImports = ImportsToReference.findImports.exec( content ) )
        {
			var file:string = '/'+foundImports[2].split('.').join('/')+'.ts';
			var found:boolean = false;
            for ( var i:number = 0, total:number = sourcePaths.length; i<total; i++ )
            {
                var sourcePath:string = sourcePaths[i];
                var sourceFolder:string =root+sourcePath;
                var nativePath:string = sourceFolder+file;
                var relativeToSourceFolder:string = path.relative(sourceFolder, root) ;
                var referencePath:string = relativeToSourceFolder+sourcePath+file;
                if( fs.existsSync( nativePath) )
                {
                    content = content.replace ( foundImports[0], '///<reference path="'+referencePath+'"/>'+(config.pluginData['ImportsToReference'].enableUndo ? foundImports[1]:'' ));
                    console.log(clc.green('Processed @import '+foundImports[1]));
					found = true;
                    break;
                }

            }
			if(!found)
			{
				console.log(clc.red( 'Can\'t find '+file+' in source paths.'));
			}

        }
        callback( input, content );
    }

}

