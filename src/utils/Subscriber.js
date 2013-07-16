var pulsar;
(function (pulsar) {
    /**
    * EventDispatcher (TypeScript)
    * - Simple extendable event dispatching class
    *
    * @version 0.1.5
    * @author John Vrbanac
    * @license MIT License
    **/
    (function (events) {
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
        events.Event = Event;

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
        events.EventDispatcher = EventDispatcher;
    })(pulsar.events || (pulsar.events = {}));
    var events = pulsar.events;
})(pulsar || (pulsar = {}));
