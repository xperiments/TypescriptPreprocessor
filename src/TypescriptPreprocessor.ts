///<reference path="../dec/node.d.ts"/>
var path = require('path');
var fs = require('fs');

export interface ITSPreprocessorCallback{ (input:string, inputContents:string):void; }
export interface ITSPreprocesorPlugin
{
    priority:number;
	register():void;
	filterFile( inputFile:string ):boolean;
    processFile( content:string, inputFile:string ,callback:ITSPreprocessorCallback ):void;
}
export interface TSPreprocesorPluginConstructable extends ITSPreprocesorPlugin
{
    new(): ITSPreprocesorPlugin;
}

export class TSPreprocesorBasePlugin implements ITSPreprocesorPlugin
{
    priority:number;
	filterFile( inputFile:string ):boolean
	{
		return /\.ts/gi.test( inputFile );
	}
    // initialize the pluging here ... create some config file etc
    register():void{}
    // process the content of the file
	processFile( content:string, inputFile:string ,callback:ITSPreprocessorCallback ):void
	{
		callback( inputFile, content );
	}

}


export interface ITSPConfig
{
    root:string;
    pluginData:{ [name:string]:any; };

}
export class TypescriptPreprocessor
{
    static getClassName( instance:any ):string
    {
        var text:string = Function.prototype.toString.call(instance.constructor)
        return text.match(/function (.*)\(/)[1]
    }
    static PLUGINS_DIR:string;
    static path:any = require('path');
    static currentPluginFiles:string[];
    static avaliablePlugins:ITSPreprocesorPlugin[] = [];

    static inputFile:string;
    static outputFile:string;
    static root:string;

    static configFile:string = "tsp.config.json";
    static configFilePath:string;
    static config:ITSPConfig;

	static currentPluginProcess:number = 0;
	static currentFileOriginalContents:string = "";
    static cmd():void
    {
        var argv = require('optimist').argv;
        if( argv.install)
        {
            TypescriptPreprocessor.root = process.cwd();
            TypescriptPreprocessor.PLUGINS_DIR = TypescriptPreprocessor.root+"/src/plugins/";
            TypescriptPreprocessor.configFilePath = TypescriptPreprocessor.root+'/'+TypescriptPreprocessor.configFile;
            TypescriptPreprocessor.getPlugins();
            TypescriptPreprocessor.createProjectInstall();
            return;
        }

		TypescriptPreprocessor.root = argv.root;
		TypescriptPreprocessor.inputFile = /*argv.root+'/'+*/argv.input;

        TypescriptPreprocessor.PLUGINS_DIR = TypescriptPreprocessor.root+"/src/plugins/";
        TypescriptPreprocessor.configFilePath = TypescriptPreprocessor.root+'/'+TypescriptPreprocessor.configFile;

        TypescriptPreprocessor.readProjectConfig();
        TypescriptPreprocessor.getPlugins();
        TypescriptPreprocessor.processFile( TypescriptPreprocessor.inputFile );

    }

    static readProjectConfig( ):ITSPConfig
    {
        TypescriptPreprocessor.config = JSON.parse(fs.readFileSync(TypescriptPreprocessor.configFilePath, 'utf8'));
        return TypescriptPreprocessor.config;
    }

    static writeProjectConfig( config:ITSPConfig = TypescriptPreprocessor.config ):void
    {
        fs.writeFileSync( TypescriptPreprocessor.configFilePath, JSON.stringify( config, null,'	') );
    }

	static readConfigFile( path:string ):any
	{
		return JSON.parse(fs.readFileSync(TypescriptPreprocessor.root+'/'+path, 'utf8'));
	}
	static writeConfigFile( path:string, config:any, beautify:boolean = true ):void
	{
		fs.writeFileSync( TypescriptPreprocessor.root+'/'+path, JSON.stringify( config, null,beautify?'	':'') );
	}

    static createProjectInstall()
    {

        var currentDir:string = process.cwd();
        var tsconfigpath = path.resolve( currentDir, TypescriptPreprocessor.configFile );
        if( !fs.existsSync( tsconfigpath ) )
        {
            var initialConfig:ITSPConfig =
            {
                root:currentDir,
                pluginData:{}
            }
            TypescriptPreprocessor.writeProjectConfig( initialConfig );

            // Register all the plugins
            for( var i in TypescriptPreprocessor.avaliablePlugins )
            {
                TypescriptPreprocessor.newPlugin( <any>TypescriptPreprocessor.avaliablePlugins[i]).register();
            }

        }
        else
        {
            console.log('Current project already has a config file');
        }

    }
    static processFile( input:string ):void
    {

        var inputContents:string = fs.readFileSync(TypescriptPreprocessor.root+input,'utf8');
		TypescriptPreprocessor.currentFileOriginalContents = inputContents;
		TypescriptPreprocessor.processNextPlugin( input, inputContents );


    }

	static processNextPlugin( input:string, inputContents:string )
	{

		if( TypescriptPreprocessor.currentPluginProcess<TypescriptPreprocessor.avaliablePlugins.length )
		{
			// instanciate pluging
			var currentPlugin:ITSPreprocesorPlugin = TypescriptPreprocessor.newPlugin( <any>TypescriptPreprocessor.avaliablePlugins[TypescriptPreprocessor.currentPluginProcess] );
			// check if pluging parses this kind of input
			if( currentPlugin.filterFile( input ) )
			{
				currentPlugin.processFile( inputContents, input, TypescriptPreprocessor.onPluginProcessed );
			}
			else
			{
				TypescriptPreprocessor.currentPluginProcess++;
				TypescriptPreprocessor.processNextPlugin( input , inputContents );
			}
		}
		else
		{
			if( TypescriptPreprocessor.currentFileOriginalContents != inputContents )
			{
				fs.writeFileSync( TypescriptPreprocessor.root+input, inputContents );
				console.log('Preprocessor parsing done.');
			}
			else
			{
				console.log('Preprocessor finished without changes.');
			}
		}
	}

	static onPluginProcessed( input:string, inputContents:string  ):void
	{
		TypescriptPreprocessor.currentPluginProcess++;
		TypescriptPreprocessor.processNextPlugin( input, inputContents );
	}
    static getPlugins():void
    {
        fs.readdirSync(TypescriptPreprocessor.PLUGINS_DIR).forEach((file:string)=>
        {
            if( /\.js$/.test( file ) )
            {
                var pluginName:string = file.replace('.js','');
                var plugin = require(TypescriptPreprocessor.PLUGINS_DIR + file);

                TypescriptPreprocessor.avaliablePlugins[ TypescriptPreprocessor.newPlugin( plugin[ pluginName ] ).priority ] = <TSPreprocesorBasePlugin>plugin[ pluginName ];
            }

        });
    }

    static newPlugin( Plugin:TSPreprocesorPluginConstructable ):ITSPreprocesorPlugin
    {
        return new Plugin();
    }
}
