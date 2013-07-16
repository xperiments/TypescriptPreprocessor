///<reference path="../../dec/node.d.ts"/>
///<reference path="../TypescriptPreprocessor.ts"/>
import TSP = module('../TypescriptPreprocessor');
import path = module('path');
import fs = module('fs');
var clc = require('cli-color');


export class SourcePaths extends TSP.TSPreprocesorBasePlugin implements TSP.ITSPreprocesorPlugin
{

    public priority:number = 1;
    public static findSourceFolders:RegExp = /\/\/@source\s["']?([\/a-zA-Z0-9 ]*)["']?/gi;
    //public static findSourceFolders:RegExp = /\/\/@SourceFolder[\s]?({.*})/gi;
    public static sourceFilePath:string = TSP.TypescriptPreprocessor.root+'/tsp.sources.ts';

	filterFile( inputFile: string ):boolean
	{
		return /\.sources\.ts/gi.test( inputFile );
	}
    register()
    {
        console.log(clc.blue.bold( 'Installing Plugin: SourcePaths' ));
        if( !fs.existsSync( SourcePaths.sourceFilePath ) )
        {
            fs.writeFileSync( SourcePaths.sourceFilePath, "///<!SOURCE_FOLDER_PATHS>" );
        }
        var config:TSP.ITSPConfig = TSP.TypescriptPreprocessor.readProjectConfig();
        config.pluginData['SourcePaths'] = { sources:[] };
        TSP.TypescriptPreprocessor.writeProjectConfig( config );
    }
    processFile( content:string, input:string, callback:TSP.ITSPreprocessorCallback ):void
    {
		console.log(clc.blue.bold( 'Processing SourceFolder paths.' ));
        var sourcepathsContent:string = fs.readFileSync(SourcePaths.sourceFilePath, 'utf8');
        var foundSourcePaths:RegExpExecArray;
        var config:TSP.ITSPConfig = TSP.TypescriptPreprocessor.readProjectConfig();
        var sources:string[] = [];
        while(  foundSourcePaths = SourcePaths.findSourceFolders.exec( sourcepathsContent ) )
        {
            sources.push( foundSourcePaths[1] );
        }

        config.pluginData['SourcePaths'] = { sources:sources };

        TSP.TypescriptPreprocessor.writeProjectConfig( config );
		callback(input,content);
	}

}

