///<reference path="../../dec/node.d.ts"/>
///<reference path="../TypescriptPreprocessor.ts"/>
///<reference path="../utils/NodeStringImage"/>
///<reference path="../utils/BinaryPacker"/>
///<reference path="../utils/DynamicTextureAtlas"/>


import TSP = module('../TypescriptPreprocessor');
import path = module('path');
import fs = module('fs');
import PNG = module('../utils/NodeStringImage');
import ATLAS = module('../utils/DynamicTextureAtlas');
import BIN = module('../utils/BinaryPacker');
var SVGConverter = require('svg2ctx');
var Canvas = require('canvas');
var Image = require('canvas').Image;
var clc = require('cli-color');
var execFile = require('child_process').execFile;
var optipngPath = require('optipng-bin').path;

export interface IEmbed
{
    src:string;
	member:string;
	format:EmbedParserSvgFormat;
}

export interface ILibrary
{
	name:string;
	sort?:string;
	compression?:string;
}

export class OptiPngCompressionLevel
{
	public static NONE:string="none";
	public static LOW:string="low";
	public static MED:string="med";
	public static HIGH:string="high";
	public static BEST:string="best";
	public static isLevel( level:string ):boolean
	{
		return /none|low|med|high|best/gi.test( level );
	}
}
export class OptiPngCompressionLevelOptions
{

	public static none:string="-o0";
	public static low:string="-o2";
	public static med:string="-o4";
	public static high:string="-o6";
	public static best:string="-o9";

}


export class EmbedParserFileTypes
{
	public static PNG:string=".png";
	public static JS:string=".js";
	public static SVG:string=".svg";
}
export class EmbedParserSvgFormat
{
	public static PNG:string="png";
	public static CTX:string="ctx";
}

export interface EmbedProperties
{
	src:string;
	type:string;
}
export class EmbedParser extends TSP.TSPreprocesorBasePlugin implements TSP.ITSPreprocesorPlugin
{


    public priority:number = 0;
    public static findEmbedClass:RegExp = /\/\/\/@embedClass[\s]?({.*})/gi;
    public static findEmbeds:RegExp = /\/\/\/([@-])embed[\s]?({.*})/gi;
	public filter:string =".lib.ts";
	private config:{ [name:string]:any; } = { };
	private libraryConfig:{ [name:string]:EmbedProperties };
	private library:ATLAS.DynamicTextureAtlas;
	private asyncEmbedPending:number = 0;
	private originalData:{ input:string; code:string; };
	private callback:TSP.ITSPreprocessorCallback;
	private atlasSortingAlgorithm:string;
	private optiPngCompressionLevel:string;

	filterFile( inputFile: string ):boolean
	{
		return /\.lib\.ts/gi.test( inputFile );
	}
	register()
	{
		console.log(clc.blue.bold( 'Installing Plugin: EmbedParser' ));
		var config:TSP.ITSPConfig = TSP.TypescriptPreprocessor.readProjectConfig();
		config.pluginData['EmbedParser'] =
		{
			libraries:{}
		};
		TSP.TypescriptPreprocessor.writeProjectConfig( config );
	}
    processFile( content:string, input:string, callback:TSP.ITSPreprocessorCallback  ):void
    {

		this.callback = callback;
		this.originalData = { input:input, code:content };
		this.asyncEmbedPending = 0;
		this.library = new ATLAS.DynamicTextureAtlas('TypescriptPreprocessor');
		var embedLibraryData:RegExpExecArray = EmbedParser.findEmbedClass.exec( content );
		var embedLibraryDataObject:ILibrary;
		try{
			embedLibraryDataObject = <ILibrary>eval( "(function(){ return "+ embedLibraryData[1] +' })();' );
			this.atlasSortingAlgorithm = embedLibraryDataObject.hasOwnProperty('sort')? embedLibraryDataObject.sort:'maxside';
			this.optiPngCompressionLevel = embedLibraryDataObject.hasOwnProperty('sort') ? OptiPngCompressionLevel.isLevel( embedLibraryDataObject.compression ) ? embedLibraryDataObject.compression.toLowerCase() : OptiPngCompressionLevel.NONE:OptiPngCompressionLevel.NONE;

		}
		catch( err )
		{
			console.log(clc.blue.bold('Incorrect library definition'))
		}

		var foundEmbeds:RegExpExecArray;
		while(  foundEmbeds = EmbedParser.findEmbeds.exec( content ) )
		{
			var embed:IEmbed = <IEmbed>eval( "(function(){ return "+ foundEmbeds[2] +' })();' );
			this.addElementToLibrary( embed , foundEmbeds[1]=="@" ? true:false );
			//content = content.replace( foundEmbeds[0], '///-'+foundEmbeds[0].substring(4))
		}


		this.checkPending();

    }



	private addElementToLibrary( embed:IEmbed, forceUpdate:boolean = true ):void
	{
		this.processEmbed( embed , forceUpdate );
	}


	private fileExists( path:string ):boolean
	{
		return fs.existsSync( TSP.TypescriptPreprocessor.root+'/'+path );
	}

	private getEmbedDataForFile( input:string ):any
	{
		return TSP.TypescriptPreprocessor.readConfigFile( input.replace('.ts','.json'))

	}
	private processEmbed( embed:IEmbed, forceUpdate:boolean = true ):void
	{
		if( !this.fileExists( embed.src ) )
		{
			console.log( clc.red('Can\'t find '+embed.src+' in source folders'));
			return;
		}



		var srcExtension:string = path.extname(embed.src.toLowerCase());

		switch( srcExtension )
		{
			case EmbedParserFileTypes.PNG:
				//var stats = fs.statSync( path ).mtime.getTime();
				//console.log('Add PNG:'+embed.src+' as '+embed.member  )
				this.library.add( embed.member, this.loadImage( embed ) );
				break;
			case EmbedParserFileTypes.JS:
				//console.log('Add JS:'+embed.src+' as '+embed.member  )
				this.library.add( embed.member, this.sourceFileToPNG( embed ) );

				break;
			case EmbedParserFileTypes.SVG:
				if( embed.format == EmbedParserSvgFormat.PNG )
				{
					//console.log('Add SVG=>PNG:'+embed.src+' as '+embed.member  )
					this.asyncEmbedPending++;
					SVGConverter.convertToCanvas( embed.src, ( data:HTMLCanvasElement )=>
					{
						this.library.add( embed.member, data );
						this.asyncEmbedPending--;
					});
				}
				else
				{
					//console.log('Add SVG=>CTX:'+embed.src+' as '+embed.member  )
					this.asyncEmbedPending++;
					SVGConverter.convertToCode( TSP.TypescriptPreprocessor.root+embed.src, ( data:string)=>
					{
						this.library.add( embed.member, this.sourceCodeToPNG( data ) );
						this.asyncEmbedPending--;
					});
				}
				break;

			default:
				//console.log('Add file as TextFile:'+embed.src );
				this.library.add( embed.member, this.sourceFileToPNG( embed ) );
				break;
		}




	}


	private loadImage( embed:IEmbed ):HTMLImageElement
	{
		var imageSource = fs.readFileSync( TSP.TypescriptPreprocessor.root+embed.src );
		var img = new Image;
			img.src = imageSource;
		return img;
	}
	private loadFile( embed:IEmbed ):string
	{
		return fs.readFileSync( TSP.TypescriptPreprocessor.root+embed.src,'utf8' );
	}
	private sourceFileToPNG( embed:IEmbed ):HTMLCanvasElement
	{
		return <HTMLCanvasElement>PNG.NodeStringImage.encode( this.loadFile( embed ) );
	}
	private sourceCodeToPNG( data:string ):HTMLCanvasElement
	{
		return <HTMLCanvasElement>PNG.NodeStringImage.encode( data, 256 );
	}
	private checkPending():void
	{
		this.asyncEmbedPending--;
		if( this.asyncEmbedPending <= 0 )
		{
			var sort:BIN.BinarySortType = BIN.BinarySortType[ this.atlasSortingAlgorithm.toUpperCase() ] || BIN.BinarySortType.MAXSIDE;
			this.writeLibrary( this.originalData.input, this.library.render( sort ).toDataURL().replace( /^data:image\/png;base64,/, "" ) );
		}
	}

	private writeLibrary( input:string, data:string )
	{
		var outputPngFile:string = TSP.TypescriptPreprocessor.root+input.replace('.ts','.png');
		fs.writeFileSync( outputPngFile , data, 'base64');
		var fileSize:number = fs.statSync(outputPngFile).size;
		if( this.optiPngCompressionLevel!= OptiPngCompressionLevel.NONE )
		{
			execFile(optipngPath, [OptiPngCompressionLevelOptions[this.optiPngCompressionLevel],'-nx','-strip all',outputPngFile], (err, stdout, stderr)=>{
				var resultFileSize:number = fs.statSync(outputPngFile).size;
				var gained:number = (fileSize-resultFileSize);
				console.log('Output lib filesize ('+this.optiPngCompressionLevel.toUpperCase()+'): ('+  fileSize+')=> '+resultFileSize+' bytes (-'+gained+' bytes).' );
				// Return point!!
				this.callback( this.originalData.input, this.originalData.code );
			});
		}
		else
		{
			// Return point!!
			console.log('Output lib filesize: '+ fileSize+' bytes.' );
			this.callback( this.originalData.input, this.originalData.code );
		}

	}




}

