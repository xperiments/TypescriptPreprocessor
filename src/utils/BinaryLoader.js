var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BinaryLoader = (function (_super) {
    __extends(BinaryLoader, _super);
    function BinaryLoader(url) {
        _super.call(this);
        this.request = new XMLHttpRequest();
        this.position = 0;
        this.lastPosition = 0;
        this.url = "";
        if (url)
            this.url = url;
    }
    BinaryLoader.prototype.load = function (url) {
        var _this = this;
        this.position = 0;
        this.lastPosition = 0;
        if (url)
            this.url = url;
        if (this.url.length > 0) {
            this.request.open("GET", this.url, true);
            if ('overrideMimeType' in this.request)
                this.request['overrideMimeType']('text/plain; charset=x-user-defined');
            this.request.onprogress = function (e) {
                return _this._onProgress(e);
            };
            this.request.onreadystatechange = function () {
                return _this._onReadyStateChange;
            };
            this.request.setRequestHeader("If-Modified-Since", "Fri, 01 Jan 1960 00:00:00 GMT");
            this.request.send(null);
        }
    };

    BinaryLoader.prototype._onProgress = function (e) {
        this.position = e.loaded;
        var chunk = this.request.responseText.substring(this.lastPosition, this.position);
        var data = new Uint8Array(chunk.length);
        for (var i = 0, total = data.length; i < total; i++)
            data[i] = chunk.charCodeAt(i) & 0xFF;
        this.ondata({ loaded: e.loaded, total: e.total });
        this.lastPosition = this.position;
    };

    BinaryLoader.prototype._onReadyStateChange = function (event) {
        if (this.request.readyState === 4) {
            if (this.request.status !== 200 && this.request.status !== 0) {
                this.onerror(this.request.statusText);
                return;
            }
            this.dispatchEvent(new pulsar.events.Event(BinaryLoader.ON_COMPLETE));
        } else if (this.request.readyState === 1 && this.onopen) {
            this.dispatchEvent(new pulsar.events.Event(BinaryLoader.ON_COMPLETE));
        }
    };
    BinaryLoader.ON_DATA = "onData";
    BinaryLoader.ON_ERROR = "onError";
    BinaryLoader.ON_COMPLETE = "onComplete";
    BinaryLoader.ON_OPEN = "onOpen";
    return BinaryLoader;
})(pulsar.events.EventDispatcher);
