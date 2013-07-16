///<reference path="../../dec/node.d.ts"/>
///<reference path='BinaryPacker.ts'/>
///<reference path='jsonh.d.ts'/>
///<reference path='NodeStringImage.ts'/>

import BIN = require('BinaryPacker');

var Canvas = require('canvas');
var JSONH = require('./jsonh');
var Image = require('canvas').Image;
var base91 = require('base91');
var NSI = require('./NodeStringImage');


	export interface TextureAtlas
	{
		[s: string]: TextureAtlasElement;
	}

	export interface TextureAtlasElement
	{
		frame: TextureAtlasFrame;
		rotated:bool;
		trimmed:bool;
		spriteSourceSize:TextureAtlasFrame;
		sourceSize:TextureAtlasSourceSize;
	}
	export interface CTextureAtlasElement
	{
		f:number[];
	}
	export interface TextureAtlasFrame
	{
		x:number;
		y:number;
		w:number;
		h:number;
	}

	export interface TextureAtlasSourceSize
	{
		w:number;
		h:number;
	}

	export class DynamicTextureAtlas
	{
		//static BinaryBlock: { new( x:number, y:number, w:number, h:number, data:any, id:string ): binarySort.BinaryBlock; };

		private static LIBS:DynamicTextureAtlas[] = [];
		public static getLibrary( id:string ):DynamicTextureAtlas
		{
			return DynamicTextureAtlas.LIBS[ id ];
		}

		public static getNextPowerOfTwo( num:number ):number
		{
			if (num > 0 && (num & (num - 1)) == 0)
			{
				return num;
			}
			else
			{
				var result:number = 1;
				while (result < num) result <<= 1;
				return result;
			}
		}

		/**
		 * Contains the blocks used in the Binary Packing
		 * @type {Array}
		 */
		private blocks:BIN.IBinaryBlock[] = [];

		/**
		 * Contains the Canvas context
		 */
		private context:CanvasRenderingContext2D;

		/**
		 * Contains the resulting Canvas Element that holds our texture
		 */
		public canvas:HTMLCanvasElement;

		/**
		 * The resulting Texture Atlas
		 */
		public textureAtlas:TextureAtlas;

		/**
		 * Creates a new DynamicTextureAtlas
		 * @param uid A unique identifier for use with DynamicTextureAtlas.getLibrary method
		 * @param shapePadding The padding value that is appened to each Image Block
		 */
		constructor( public uid:string, public shapePadding:number = 4 )
		{

			DynamicTextureAtlas.LIBS[ uid ] = this;

			// Create the Canvas&Context
			this.canvas = new Canvas;
			this.context =  this.canvas.getContext('2d');

		}

		/**
		 * Add an element to the DynamicTextureAtlas
		 * @param id The id that will be used to identify the element in the json SpriteAtlas
		 * @param image
		 */
		public add( id:string, image:HTMLElement ):void
		{
			var block:BIN.BinaryBlock;
			var shapePadding2x:number = this.shapePadding*2;
			if( image instanceof Image )
			{
				block = new BIN.BinaryBlock
				(
					this.shapePadding,
					this.shapePadding,
					(<HTMLImageElement>image).width+shapePadding2x,
					(<HTMLImageElement>image).height+shapePadding2x,
					image,
					id
				);

			}
			else if( image instanceof Canvas )
			{
				block = new BIN.BinaryBlock
				(
					this.shapePadding,
					this.shapePadding,
					(<HTMLCanvasElement>image).width+shapePadding2x,
					(<HTMLCanvasElement>image).height+shapePadding2x,
					image,
					id
				);
			}
			else
			{
				throw "Image element must be Canvas or Image";
			}

			this.blocks.push( block );

		}

		/**
		 *
		 * @param id
		 * @param dataURL
		 */
		private addFromDataURL(  id:string, dataURL:string )
		{
			var image:HTMLImageElement = new Image();
				image.src = dataURL;

			this.blocks.push( new BIN.BinaryBlock(0,0,image.width, image.height, image,  id ) );
		}

		private compressAtlas( atlas:{[libraryName:string]:TextureAtlas}, libraryName:string )
		{
			var compressed ={};
			var l= compressed[ libraryName ] = {};
				for( var i in atlas[libraryName] )
				{
					l[i]=this.compressAtlasElement( atlas[libraryName][i] );
				}
			return compressed;
		}
		private compressAtlasElement( obj:TextureAtlasElement ):CTextureAtlasElement
		{
			return <CTextureAtlasElement>{
				f:[ obj.frame.x, obj.frame.y, obj.frame.w, obj.frame.h]
			}
		}
		/**
		 * Packs all block elements and generates the BaseTexture & TextureAtlas
		 * @param mode
		 */
		public render( mode:BIN.BinarySortType = BIN.BinarySortType.MAXSIDE ,atlasSize:number = 32 ):HTMLCanvasElement
		{
			var i:number;
			var t:string;
			var total:number;

			var canvasAtlas:HTMLCanvasElement = new Canvas;
				canvasAtlas.width = atlasSize;
				canvasAtlas.height = atlasSize;

			var ctx:CanvasRenderingContext2D = <CanvasRenderingContext2D>canvasAtlas.getContext('2d');
				ctx.fillStyle = "#FF0000";
				ctx.fillRect(0,0,atlasSize,atlasSize);

			var avaliableStringBytes:number = atlasSize*atlasSize*3;

			var shapePadding2x:number = this.shapePadding*2;

			var canvasAtlasBlock= new BIN.BinaryBlock
			(
				this.shapePadding,
				this.shapePadding,
				atlasSize+shapePadding2x,
				atlasSize+shapePadding2x,
				canvasAtlas,
				'TextureAtlas'
			);

			this.blocks.push( canvasAtlasBlock );


			// Packs & Order the image blocks

			BIN.BinaryPacker.pack(this.blocks, mode.toString() );

			this.canvas.width = BIN.BinaryPacker.root.w// DynamicTextureAtlas.getNextPowerOfTwo( BIN.BinaryPacker.root.w );
			this.canvas.height = BIN.BinaryPacker.root.h//DynamicTextureAtlas.getNextPowerOfTwo( BIN.BinaryPacker.root.h );

			var textureAtlas:TextureAtlas = {};
			for( i=0, total = this.blocks.length; i<total; i++ )
			{
				var cur:BIN.IBinaryBlock = this.blocks[i];

				// create Atlas Element
				textureAtlas[ cur.id ] = <TextureAtlasElement>
				{
					frame: 				<TextureAtlasFrame>{ x:cur.fit.x+this.shapePadding, y:cur.fit.y+this.shapePadding, w:cur.w, h:cur.h },
					rotated:			false,
					trimmed:			false,
					spriteSourceSize:	<TextureAtlasFrame>{ x:cur.fit.x+this.shapePadding, y:cur.fit.y+this.shapePadding, w:cur.w, h:cur.h },
					sourceSize:			<TextureAtlasSourceSize>{ w:cur.w, h:cur.h}
				}
				// draw image to canvas
				this.context.drawImage(cur.data, cur.fit.x+this.shapePadding, cur.fit.y+this.shapePadding );

			}

			// create texture from resulting canvas
			this.textureAtlas = textureAtlas;
			var textureAtlasObject={}
			textureAtlasObject[ this.uid ] = this.textureAtlas;

			//console.log( JSON.stringify( textureAtlasObject).length )
			//console.log( JSON.stringify( this.compressAtlas( textureAtlasObject ,this.uid )).length );
			//console.log( JSON.stringify( this.compressAtlas( textureAtlasObject, this.uid )).length );


			//console.log( canvasAtlasBlock.fit.x , canvasAtlasBlock.fit.y )


			// Free blocks as it contains image references
			this.blocks = null;

			this.writeRectangleAtlasHeader( canvasAtlasBlock.fit.x, canvasAtlasBlock.fit.y, atlasSize, atlasSize );

			return this.canvas;

		}

		private writeRectangleAtlasHeader(x,y,w,h):void
		{
			var imageData:ImageData = this.context.createImageData(4,1);
			NSI.NodeStringImage.setPixel( imageData, 0, 0, NSI.NodeStringImage.decToRgb( x ) );
			NSI.NodeStringImage.setPixel( imageData, 1, 0, NSI.NodeStringImage.decToRgb( y ) );
			NSI.NodeStringImage.setPixel( imageData, 2, 0, NSI.NodeStringImage.decToRgb( w ) );
			NSI.NodeStringImage.setPixel( imageData, 3, 0, NSI.NodeStringImage.decToRgb( h ) );
			this.context.putImageData( imageData,0,0 );

		}



	}
