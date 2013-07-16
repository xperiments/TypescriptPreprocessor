///<reference path="Subscriber.ts"/>
interface IBinaryLoaderProgress
{
	loaded:number;
	total:number;
}



class BinaryLoader extends pulsar.events.EventDispatcher
{

	public static ON_DATA:string ="onData";
	public static ON_ERROR:string ="onError";
	public static ON_COMPLETE:string ="onComplete";
	public static ON_OPEN:string ="onOpen";

	private request:XMLHttpRequest = new XMLHttpRequest();
	public position:number = 0;
	private lastPosition:number = 0;
	private data:Uint8Array;
	private url:string = "";

	public ondata:(progress:IBinaryLoaderProgress)=>void;
	public onerror:(error:string)=>void;
	public oncomplete:()=>void;
	public onopen:()=>void;

	constructor( url?:string )
	{
		super();
		if( url ) this.url = url;
	}

	public load( url?:string )
	{
		this.position = 0;
		this.lastPosition = 0;
		if( url ) this.url = url;
		if( this.url.length>0 )
		{
			this.request.open("GET", this.url, true);
			if ('overrideMimeType' in this.request) this.request['overrideMimeType']('text/plain; charset=x-user-defined');
			this.request.onprogress =(e:any)=> this._onProgress( e );
			this.request.onreadystatechange =()=>this._onReadyStateChange;
			this.request.setRequestHeader("If-Modified-Since", "Fri, 01 Jan 1960 00:00:00 GMT"); // no-cache
			this.request.send(null);
		}
	}


	private _onProgress(e:IBinaryLoaderProgress):void
	{
		this.position = e.loaded;
		var chunk = this.request.responseText.substring(this.lastPosition, this.position);
		var data = new Uint8Array(chunk.length);
		for (var i = 0, total = data.length; i < total; i++) data[i] = chunk.charCodeAt(i) & 0xFF;
		this.ondata(<IBinaryLoaderProgress>{ loaded: e.loaded, total: e.total });
		this.lastPosition = this.position;
	}

	private _onReadyStateChange(event):void
	{
		if (this.request.readyState === 4)
		{
			if (this.request.status !== 200 && this.request.status !== 0)
			{
				this.onerror(this.request.statusText);
				return
			}
			this.dispatchEvent( new pulsar.events.Event( BinaryLoader.ON_COMPLETE ))

		}
		else if ( this.request.readyState === 1 && this.onopen )
		{
			this.dispatchEvent( new pulsar.events.Event( BinaryLoader.ON_COMPLETE ))
		}
	}
}