///<reference path="../../dec/node.d.ts"/>
///<reference path="../TypescriptPreprocessor.ts"/>
import TSP = module('../TypescriptPreprocessor');
import path = module('path');
import fs = module('fs');
var clc = require('cli-color');
export class DefinitionToReference extends TSP.TSPreprocesorBasePlugin implements TSP.ITSPreprocesorPlugin
{

    public priority:number = 4;
    public static findImports:RegExp = /\/\/\/ ?(@define *((?:[a-z][a-z\.\d\-_\$]+)\.?(?:[a-z][a-z\.\d\-_\$]+))(?![\w\.])[;])/gi;

    /* INTERFACE IMPLEMENTATION */
    register()
    {
        console.log(clc.blue.bold( 'Installing Plugin: DefinitionToReference' ));
        var config:TSP.ITSPConfig = TSP.TypescriptPreprocessor.readProjectConfig();
        config.pluginData['DefinitionToReference'] = { enableUndo:false };
        TSP.TypescriptPreprocessor.writeProjectConfig( config );

    }
    processFile( content:string, input:string, callback:TSP.ITSPreprocessorCallback ):void
    {
        var config:TSP.ITSPConfig = TSP.TypescriptPreprocessor.readProjectConfig();
        var root:string = TSP.TypescriptPreprocessor.root;
        var sourcePaths:any = TSP.TypescriptPreprocessor.readProjectConfig().pluginData['SourcePaths'].sources;
        var foundImports:RegExpExecArray;

        while(  foundImports = DefinitionToReference.findImports.exec( content ) )
        {
			var found:boolean = false;
			var file:string = '/'+foundImports[2].split('.').join('/')+'.d.ts';
            for ( var i:number = 0, total:number = sourcePaths.length; i<total; i++ )
            {
                var sourcePath:string = sourcePaths[i];
                var sourceFolder:string =root+sourcePath;
                var nativePath:string = sourceFolder+file;
                var relativeToSourceFolder:string = path.relative(sourceFolder, root) ;
                var referencePath:string = relativeToSourceFolder+sourcePath+file;
                if( fs.existsSync( nativePath) )
                {
                    content = content.replace ( foundImports[0], '///<reference path="'+referencePath+'"/>'+(config.pluginData['DefinitionToReference'].enableUndo ? foundImports[1]:'' ));
                    console.log(clc.green('Processed @define '+foundImports[1]));
					found = true;
					break;
                }
            }

			if(!found)
			{
				console.log(clc.red( 'Could no process @define '+foundImports[2]+' '+ nativePath +' does not exists'));
			}
        }
		callback( input,content );
	}

}

