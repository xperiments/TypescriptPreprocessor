var lib;
(function (lib) {
    var Event = (function () {
        function Event(type, targetObj) {
            this._type = type;
            this._target = targetObj;
        }
        Event.prototype.getTarget = function () {
            return this._target;
        };

        Event.prototype.getType = function () {
            return this._type;
        };
        return Event;
    })();

    var EventDispatcher = (function () {
        function EventDispatcher() {
            this._listeners = [];
        }
        EventDispatcher.prototype.hasEventListener = function (type, listener) {
            var exists = false;
            for (var i = 0; i < this._listeners.length; i++) {
                if (this._listeners[i].type === type && this._listeners[i].listener === listener) {
                    exists = true;
                }
            }

            return exists;
        };

        EventDispatcher.prototype.addEventListener = function (typeStr, listenerFunc) {
            if (this.hasEventListener(typeStr, listenerFunc)) {
                return;
            }

            this._listeners.push({ type: typeStr, listener: listenerFunc });
        };

        EventDispatcher.prototype.removeEventListener = function (typeStr, listenerFunc) {
            for (var i = 0; i < this._listeners.length; i++) {
                if (this._listeners[i].type === typeStr && this._listeners[i].listener === listenerFunc) {
                    this._listeners.splice(i, 1);
                }
            }
        };

        EventDispatcher.prototype.dispatchEvent = function (evt) {
            for (var i = 0; i < this._listeners.length; i++) {
                if (this._listeners[i].type === evt.getType()) {
                    this._listeners[i].listener.call(this, evt);
                }
            }
        };
        return EventDispatcher;
    })();

    var LibraryLoader = (function () {
        function LibraryLoader() {
            var _this = this;
            this.img = document.createElement('img');
            this.t = 0;
            //super();
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');

            if (LibraryLoader.supportsXMLHttpRequest2) {
                this.request = new XMLHttpRequest();
                this.request.addEventListener("progress", function (evnt) {
                    return _this.updateProgress(evnt);
                }, false);
                this.request.addEventListener("load", function (evnt) {
                    return _this.transferComplete(evnt);
                }, false);
                this.request.addEventListener("error", function (evnt) {
                    return _this.transferFailed(evnt);
                }, false);
                this.request.addEventListener("abort", function (evnt) {
                    return _this.transferCanceled(evnt);
                }, false);
            } else {
                alert('5555');
                this.image = document.createElement('image');
                document.body.appendChild(this.image);
                this.image.onload = function () {
                    return _this.imageComplete();
                };
            }
        }
        LibraryLoader.prototype.load = function (url) {
            this.t = new Date().getTime();
            if (LibraryLoader.supportsXMLHttpRequest2) {
                this.request.open('GET', url, true);
                this.request.responseType = 'arraybuffer';

                //this.request['overrideMimeType']('text/plain; charset=x-user-defined');
                this.request.send(null);
            } else {
                this.image.src = url;
            }
        };

        // progress on transfers from the server to the client (downloads)
        LibraryLoader.prototype.updateProgress = function (oEvent) {
            if (oEvent.lengthComputable) {
                var percentComplete = oEvent.loaded / oEvent.total;
                console.log('%' + percentComplete);
            } else {
            }
        };

        LibraryLoader.prototype.transferComplete = function (evt) {
            var _this = this;
            var buffer = this.request['mozResponseArrayBuffer'] || this.request.response;
            var type = this.request.getResponseHeader('Content-Type');
            this.img.onload = function () {
                _this.canvas.width = _this.img.width;
                _this.canvas.height = _this.img.height;
                _this.context.drawImage(_this.img, 0, 0);
                document.body.appendChild(_this.canvas);
                console.log('DONE=>' + (+new Date() - _this.t));
            };

            if (window['webkitURL'].createObjectURL) {
                this.img.src = window['webkitURL'].createObjectURL(new Blob([buffer], { type: 'image/png' }));
            } else {
                this.img.src = window['URL'].createObjectURL(buffer);
            }
        };

        LibraryLoader.buffer2base64 = function (buffer, type) {
            var bytes = new Uint8Array(buffer);
            var len = bytes.byteLength;
            var base64 = '';
            for (var i = 0; i < len; i += 3) {
                base64 += btoa(String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2]));
            }
            i -= 3;
            if (len - i == 1)
                base64 += btoa(String.fromCharCode(bytes[i]));
            if (len - i == 2)
                base64 += btoa(String.fromCharCode(bytes[i], bytes[i + 1]));

            return 'data:' + type + ';base64,' + base64;
        };

        LibraryLoader.prototype.transferFailed = function (evt) {
            alert("An error occurred while transferring the file.");
        };

        LibraryLoader.prototype.transferCanceled = function (evt) {
            alert("The transfer has been canceled by the user.");
        };

        LibraryLoader.prototype.imageComplete = function () {
            this.canvas.width = this.image.width;
            this.canvas.height = this.image.height;
            this.context.drawImage(this.image, 0, 0);

            //document.body.appendChild( this.canvas );
            console.log('DONE=>' + (+new Date() - this.t));
        };

        LibraryLoader.base64ArrayBuffer = // Converts an ArrayBuffer directly to base64, without any intermediate 'convert to string then
        // use window.btoa' step. According to my tests, this appears to be a faster approach:
        // http://jsperf.com/encoding-xhr-image-data/5
        function (arrayBuffer, type) {
            if (typeof type === "undefined") { type = "image/png"; }
            var base64 = '';
            var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

            var bytes = new Uint8Array(arrayBuffer);
            var byteLength = bytes.byteLength;
            var byteRemainder = byteLength % 3;
            var mainLength = byteLength - byteRemainder;

            var a, b, c, d, chunk, i;

            for (i = 0; i < mainLength; i = i + 3) {
                // Combine the three bytes into a single integer
                chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

                // Use bitmasks to extract 6-bit segments from the triplet
                a = (chunk & 16515072) >> 18;
                b = (chunk & 258048) >> 12;
                c = (chunk & 4032) >> 6;
                d = chunk & 63;

                // Convert the raw binary segments to the appropriate ASCII encoding
                base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
            }

            if (byteRemainder == 1) {
                chunk = bytes[mainLength];

                a = (chunk & 252) >> 2;

                // Set the 4 least significant bits to zero
                b = (chunk & 3) << 4;

                base64 += encodings[a] + encodings[b] + '==';
            } else if (byteRemainder == 2) {
                chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

                a = (chunk & 64512) >> 10;
                b = (chunk & 1008) >> 4;

                // Set the 2 least significant bits to zero
                c = (chunk & 15) << 2;

                base64 += encodings[a] + encodings[b] + encodings[c] + '=';
            }
            return 'data:' + type + ';base64,' + base64;
        };
        LibraryLoader.supportsArrayBuffer = typeof new XMLHttpRequest().responseType === 'string';
        LibraryLoader.supportsXMLHttpRequest2 = 'upload' in new XMLHttpRequest();
        return LibraryLoader;
    })();
    lib.LibraryLoader = LibraryLoader;
})(lib || (lib = {}));
