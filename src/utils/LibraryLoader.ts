module lib
{
	class Event {
		private _type:string;
		private _target:any;

		constructor(type:string, targetObj:any) {
			this._type = type;
			this._target = targetObj;
		}

		public getTarget():any {
			return this._target;
		}

		public getType():string {
			return this._type;
		}
	}

	 class EventDispatcher {
		private _listeners:any[];
		constructor() {
			this._listeners = [];
		}

		public hasEventListener(type:string, listener:Function):Boolean {
			var exists:Boolean = false;
			for (var i = 0; i < this._listeners.length; i++) {
				if (this._listeners[i].type === type && this._listeners[i].listener === listener) {
					exists = true;
				}
			}

			return exists;
		}

		public addEventListener (typeStr:string, listenerFunc:Function):void {
			if (this.hasEventListener(typeStr, listenerFunc)) {
				return;
			}

			this._listeners.push({type: typeStr, listener: listenerFunc});
		}

		public removeEventListener (typeStr:string, listenerFunc:Function):void {
			for (var i = 0; i < this._listeners.length; i++) {
				if (this._listeners[i].type === typeStr && this._listeners[i].listener === listenerFunc) {
					this._listeners.splice(i, 1);
				}
			}
		}

		public dispatchEvent (evt:Event) {
			for (var i = 0; i < this._listeners.length; i++) {
				if (this._listeners[i].type === evt.getType()) {
					this._listeners[i].listener.call(this, evt);
				}
			}
		}
	}


	export interface IProgressEvent {
		lengthComputable:number;
		loaded:number;
		total:number;
	}


	export class LibraryLoader
	{
		canvas:HTMLCanvasElement;
		context:CanvasRenderingContext2D;
		request:XMLHttpRequest;
		image:HTMLImageElement;
		img:HTMLImageElement = <HTMLImageElement>document.createElement('img');
		static supportsArrayBuffer:boolean = typeof new XMLHttpRequest().responseType === 'string';
		static supportsXMLHttpRequest2 = 'upload' in new XMLHttpRequest();
		t:number = 0;
		constructor()
		{

			//super();
			this.canvas = <HTMLCanvasElement>document.createElement('canvas');
			this.context = <CanvasRenderingContext2D>this.canvas.getContext('2d');

			if( LibraryLoader.supportsXMLHttpRequest2 )
			{
				this.request = new XMLHttpRequest()
				this.request.addEventListener("progress", 	(evnt)=>this.updateProgress(evnt), false);
				this.request.addEventListener("load", 		(evnt)=>this.transferComplete(evnt), false);
				this.request.addEventListener("error", 		(evnt)=>this.transferFailed(evnt), false);
				this.request.addEventListener("abort", 		(evnt)=>this.transferCanceled(evnt), false);
			}
			else
			{

				alert('5555')
				this.image = <HTMLImageElement>document.createElement('image');
				document.body.appendChild( this.image );
				this.image.onload =()=> this.imageComplete();
			}

		}

		public load( url:string ):void
		{

			this.t = new Date().getTime();
			if( LibraryLoader.supportsXMLHttpRequest2 )
			{
				this.request.open('GET', url, true);
				this.request.responseType = 'arraybuffer';
				//this.request['overrideMimeType']('text/plain; charset=x-user-defined');
				this.request.send(null);
			}
			else
			{
				this.image.src = url;
			}
		}


		// progress on transfers from the server to the client (downloads)
		private updateProgress ( oEvent ):void
		{
			if (oEvent.lengthComputable)
			{
				var percentComplete = oEvent.loaded / oEvent.total;
				console.log( '%'+percentComplete )
				// ...
			}
			else
			{
				// Unable to compute progress information since the total size is unknown
			}
		}

		private transferComplete(evt)
		{

			var buffer = this.request['mozResponseArrayBuffer'] || this.request.response;
			var type = this.request.getResponseHeader('Content-Type');
			this.img.onload = ()=>
			{

				this.canvas.width = this.img.width;
				this.canvas.height = this.img.height;
				this.context.drawImage( this.img ,0, 0 );
				document.body.appendChild( this.canvas );
				console.log( 'DONE=>'+ (+new Date-this.t));
			}
			//this.img.src = LibraryLoader.base64ArrayBuffer( buffer );
			//var LURL = (<any>window).URL || (<any>window).webkitURL;
			//console.log( this.request.response.length )


			if(window['webkitURL'].createObjectURL){
				this.img.src = window['webkitURL'].createObjectURL(new Blob([buffer], {	type: 'image/png'}));
			}else{
				this.img.src = window['URL'].createObjectURL(buffer);
			}



		}

		private static buffer2base64( buffer:ArrayBuffer, type:string ):string
		{
			var bytes:Uint8Array = new Uint8Array(buffer);
			var len:number = bytes.byteLength;
			var base64:string = '';
			for (var i:number = 0; i < len; i+=3)
			{
				base64 += btoa(String.fromCharCode(bytes[i], bytes[i+1], bytes[i+2]));
			}
			i -= 3;
			if(len - i == 1) base64 += btoa(String.fromCharCode(bytes[i]));
			if(len - i == 2) base64 += btoa(String.fromCharCode(bytes[i], bytes[i + 1]));

			return 'data:'+type+';base64,' + base64;
		}

		private transferFailed(evt)
		{
			alert("An error occurred while transferring the file.");
		}

		private transferCanceled(evt)
		{
			alert("The transfer has been canceled by the user.");
		}

		private imageComplete()
		{
			this.canvas.width = this.image.width;
			this.canvas.height = this.image.height;
			this.context.drawImage( this.image ,0,0 );
			//document.body.appendChild( this.canvas );
			console.log( 'DONE=>'+ (+new Date-this.t));
		}

		// Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
		// use window.btoa' step. According to my tests, this appears to be a faster approach:
		// http://jsperf.com/encoding-xhr-image-data/5
		private static base64ArrayBuffer( arrayBuffer:ArrayBuffer , type:string = "image/png" ):string
		{
			var base64:string    = '';
			var encodings:string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

			var bytes:Uint8Array = new Uint8Array(arrayBuffer);
			var byteLength:number    = bytes.byteLength;
			var byteRemainder:number = byteLength % 3;
			var mainLength:number    = byteLength - byteRemainder;

			var  a:number
				,b:number
				,c:number
				,d:number
				,chunk:number
				,i:number;

			// Main loop deals with bytes in chunks of 3
			for ( i = 0; i < mainLength; i = i + 3)
			{
				// Combine the three bytes into a single integer
				chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]

				// Use bitmasks to extract 6-bit segments from the triplet
				a = (chunk & 16515072) >> 18 // 16515072 = (2^6 - 1) << 18
				b = (chunk & 258048)   >> 12 // 258048   = (2^6 - 1) << 12
				c = (chunk & 4032)     >>  6 // 4032     = (2^6 - 1) << 6
				d = chunk & 63               // 63       = 2^6 - 1

				// Convert the raw binary segments to the appropriate ASCII encoding
				base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d]
			}

			// Deal with the remaining bytes and padding
			if (byteRemainder == 1)
			{
				chunk = bytes[mainLength]

				a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2

				// Set the 4 least significant bits to zero
				b = (chunk & 3)   << 4 // 3   = 2^2 - 1

				base64 += encodings[a] + encodings[b] + '=='
			}
			else if (byteRemainder == 2)
			{
				chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1]

				a = (chunk & 64512) >> 10 // 64512 = (2^6 - 1) << 10
				b = (chunk & 1008)  >>  4 // 1008  = (2^6 - 1) << 4

				// Set the 2 least significant bits to zero
				c = (chunk & 15)    <<  2 // 15    = 2^4 - 1

				base64 += encodings[a] + encodings[b] + encodings[c] + '='
			}
			return 'data:'+type+';base64,' + base64;
		}
	}
}