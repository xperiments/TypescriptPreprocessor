var {{{package.[0]}}};
(function ({{{package.[0]}}}) {
    (function ({{{package.[1]}}}) {
        (function ({{{package.[2]}}}) {
            (function ({{{package.[3]}}}) {
                var {{{className}}} = (function (_super) {
                    __extends({{{className}}}, _super);
                    function {{{className}}}() {
                        _super.call(this);
                    }
                    {{{className}}}.prototype.initialize = function () {
                        this._initialize({{{totalImages}}}, {{{width}}}, {{{height}}});
                    };
                    {{{className}}}.prototype._render = function (ctx) {
						if (typeof ctx === "undefined") { ctx = this.ctx; };
						{{{noClearRect width height}}};
                    };
                    {{{className}}}.prototype.loadImages = function () {
                    	{{{images}}};
                    };
                    {{{className}}}.prototype.initializeGradients = function () {
                    	{{{gradients}}};
                    };
                    return {{{className}}};
                })(pulsar.lib.shapes.Shape);
                {{{package.[3]}}}.{{{className}}} = {{{className}}};
            })({{{package.[2]}}}.{{{package.[3]}}} || ({{{package.[2]}}}.{{{package.[3]}}} = {}));
            var {{{package.[3]}}} = {{{package.[2]}}}.{{{package.[3]}}};
        })({{{package.[1]}}}.{{{package.[2]}}} || ({{{package.[1]}}}.{{{package.[2]}}} = {}));
        var {{{package.[2]}}} = {{{package.[1]}}}.{{{package.[2]}}};
    })({{{package.[0]}}}.{{{package.[1]}}} || ({{{package.[0]}}}.{{{package.[1]}}} = {}));
    var {{{package.[1]}}} = {{{package.[0]}}}.{{{package.[1]}}};
})({{{package.[0]}}} || ({{{package.[0]}}} = {}));