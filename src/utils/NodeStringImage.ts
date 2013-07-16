///<reference path="../../dec/node.d.ts"/>
var Canvas = require('canvas');
declare var InstallTrigger;

export interface IRGB
{
	r:number;
	g:number;
	b:number;
}
export class NodeStringImage
{

	static canvas;
	static ctx;

	static initialize():bool
	{
		NodeStringImage.canvas = new Canvas();
		NodeStringImage.ctx = NodeStringImage.canvas.getContext('2d');
		return true;
	}
	static initialized:bool = NodeStringImage.initialize();

	static dec2hex(i:number):string
	{
		var hex = i.toString(16);
		hex = "000000".substr(0, 6 - hex.length) + hex;
		return hex;
	}
	static hexToRgb(hex:string):IRGB
	{

		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function (m, r, g, b) {
			return r + r + g + g + b + b;
		});
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	}

	static decToRgb( i:number ):IRGB
	{
		return NodeStringImage.hexToRgb( NodeStringImage.dec2hex( i ) );
	}
	static rgbToHex(r:number, g:number, b:number):string
	{
		return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1, 7);
	}
	static encode(str:string, width:number = 256):HTMLCanvasElement
	{
		var len:number = str.length;
		var square:number = Math.ceil(Math.sqrt(len / 3));
		var height:number = Math.ceil((len / 3) / width);
		var imageData:ImageData = NodeStringImage.ctx.createImageData(width, height);
		var lengthHeader:IRGB = NodeStringImage.hexToRgb(NodeStringImage.dec2hex(len));
		var currentPixel:IRGB = { r:0, g:0, b:0 };
		var pixelCount:number = 0;

		// create a new canvas as we need a clone
		var canvas:HTMLCanvasElement = new Canvas;
		var ctx:CanvasRenderingContext2D = canvas.getContext('2d');
		canvas.width = width;
		canvas.height = height;

		NodeStringImage.setPixel(imageData, pixelCount % width, Math.floor(pixelCount / width), lengthHeader );
		pixelCount++;
		for(var i = 0, total = str.length; i < total; i += 3)
		{
			currentPixel.r = str.charCodeAt(i);
			currentPixel.g = str.charCodeAt(i+1);
			currentPixel.b = str.charCodeAt(i+2);
			NodeStringImage.setPixel(imageData, pixelCount % width, Math.floor(pixelCount / width), currentPixel );
			pixelCount++;
		}
		ctx.putImageData(imageData, 0, 0);
		return canvas;
	}
	static decode(imageData:ImageData):string
	{
		var hexHeader:string = NodeStringImage.rgbToHex(imageData.data[0], imageData.data[1], imageData.data[2]);
		var lengthHeader:number = parseInt(hexHeader, 16);
		var str:string = "";
		var i,s:number
		var fromCharCode:string[] = [];
		for( i=0; i<256; i++ )
		{
			fromCharCode.push( String.fromCharCode( i ) );
		}
		for( i = 0; i < lengthHeader; i += 3)
		{
			s = (i / 3) * 4;
			str += fromCharCode[imageData.data[4 + s]];
			if(imageData.data[4 + s + 1]) {
				str += fromCharCode[imageData.data[4 + s + 1]];
				if(imageData.data[4 + s + 2]) {
					str += fromCharCode[ imageData.data[4 + s + 2]];
				}
			}
		}
		return str;
	}
	static setPixel (imageData:ImageData, x:number, y:number, rgb:IRGB )
	{
		var index = ((x + y * imageData.width) * 4);
		imageData.data[index + 0] = rgb.r;
		imageData.data[index + 1] = rgb.g;
		imageData.data[index + 2] = rgb.b;
		imageData.data[index + 3] = 255;
	}
}
//(module).exports = NodeStringImage;
