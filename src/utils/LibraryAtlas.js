var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="../../dec/node.d.ts"/>
///<reference path='BinaryPacker.ts'/>
///<reference path='NodeStringImage.ts'/>
var BIN = require('./BinaryPacker');
var fs = require('fs');
var Canvas = require('canvas');
var Image = require('canvas').Image;
var NSI = require('./NodeStringImage');
var handlebars = require('handlebars');

var CustomBinaryBlock = (function (_super) {
    __extends(CustomBinaryBlock, _super);
    function CustomBinaryBlock() {
        _super.apply(this, arguments);
    }
    return CustomBinaryBlock;
})(BIN.BinaryBlock);
exports.CustomBinaryBlock = CustomBinaryBlock;

var LibraryAtlas = (function () {
    /**
    * Creates a new LibraryAtlas
    * @param uid A unique identifier for use with LibraryAtlas.getLibrary method
    * @param shapePadding The padding value that is appened to each Image Block
    */
    function LibraryAtlas(uid, shapePadding) {
        if (typeof shapePadding === "undefined") { shapePadding = 4; }
        this.uid = uid;
        this.shapePadding = shapePadding;
        /**
        * Contains the blocks used in the Binary Packing
        * @type {Array}
        */
        this.blocks = [];
        LibraryAtlas.LIBS[uid] = this;

        // Create the Canvas&Context
        this.canvas = new Canvas();
        this.context = this.canvas.getContext('2d');

        // create css template
        this.cssCompiledTemplate = handlebars.compile(fs.readFileSync(__dirname + '/../templates/LibrarySpriteSheet.tpl', 'utf8'), { noEscape: true });
    }
    LibraryAtlas.getLibrary = function (id) {
        return LibraryAtlas.LIBS[id];
    };

    LibraryAtlas.getNextPowerOfTwo = function (num) {
        if (num > 0 && (num & (num - 1)) == 0) {
            return num;
        } else {
            var result = 1;
            while (result < num)
                result <<= 1;
            return result;
        }
    };

    /**
    * Add an element to the LibraryAtlas
    * @param id The id that will be used to identify the element in the json SpriteAtlas
    * @param image
    */
    LibraryAtlas.prototype.add = function (id, image, type) {
        var block;
        var shapePadding2x = this.shapePadding * 2;
        if (image instanceof Image) {
            block = new CustomBinaryBlock(this.shapePadding, this.shapePadding, (image).width + shapePadding2x, (image).height + shapePadding2x, image, id);
            block.type = type;
        } else if (image instanceof Canvas) {
            block = new CustomBinaryBlock(this.shapePadding, this.shapePadding, (image).width + shapePadding2x, (image).height + shapePadding2x, image, id);
            block.type = type;
        } else {
            throw "Image element must be Canvas or Image";
        }

        this.blocks.push(block);
    };

    /**
    *
    * @param id
    * @param dataURL
    */
    /*
    private addFromDataURL(  id:string, dataURL:string )
    {
    var image:HTMLImageElement = new Image();
    image.src = dataURL;
    
    this.blocks.push( new BIN.BinaryBlock(0,0,image.width, image.height, image,  id ) );
    }
    */
    LibraryAtlas.prototype.compressAtlas = function (atlas, libraryName) {
        var compressed = {
            name: libraryName,
            elements: {}
        };

        for (var i in atlas[libraryName]) {
            compressed.elements[i] = this.compressAtlasElement(atlas[libraryName][i]);
        }
        return compressed;
    };
    LibraryAtlas.prototype.compressAtlasElement = function (obj) {
        return [obj.frame.x, obj.frame.y, obj.frame.w, obj.frame.h, obj['type']];
    };

    /**
    * Packs all block elements and generates the BaseTexture & TextureAtlas
    * @param mode
    */
    LibraryAtlas.prototype.render = function (mode, atlasSize) {
        if (typeof mode === "undefined") { mode = BIN.BinarySortType.MAXSIDE; }
        if (typeof atlasSize === "undefined") { atlasSize = 32; }
        var i;
        var t;
        var total;

        var canvasAtlas = new Canvas();
        canvasAtlas.width = atlasSize;
        canvasAtlas.height = atlasSize;

        var ctx = canvasAtlas.getContext('2d');

        //ctx.fillStyle = "#FF0000";
        //ctx.fillRect(0,0,atlasSize,atlasSize);
        var avaliableStringBytes = atlasSize * atlasSize * 3;

        var shapePadding2x = this.shapePadding * 2;

        var canvasAtlasBlock = new CustomBinaryBlock(this.shapePadding, this.shapePadding, atlasSize + shapePadding2x, atlasSize + shapePadding2x, canvasAtlas, 'TextureAtlas');

        this.blocks.push(canvasAtlasBlock);

        // Packs & Order the image blocks
        BIN.BinaryPacker.pack(this.blocks, mode.toString());

        this.canvas.width = BIN.BinaryPacker.root.w + 4;
        this.canvas.height = BIN.BinaryPacker.root.h + 4;

        var textureAtlas = {};
        for (i = 0, total = this.blocks.length; i < total; i++) {
            var cur = this.blocks[i];

            // create Atlas Element
            textureAtlas[cur.id] = {
                frame: { x: cur.fit.x + this.shapePadding, y: cur.fit.y + this.shapePadding, w: cur.w, h: cur.h },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: cur.fit.x + this.shapePadding, y: cur.fit.y + this.shapePadding, w: cur.w, h: cur.h },
                sourceSize: { w: cur.w, h: cur.h },
                type: cur.type
            };

            // draw image to canvas
            this.context.drawImage(cur.data, cur.fit.x + this.shapePadding, cur.fit.y + this.shapePadding);
        }

        // create texture from resulting canvas
        this.textureAtlas = textureAtlas;
        var textureAtlasObject = {};
        textureAtlasObject[this.uid] = this.textureAtlas;

        var codeCanvasAtlas = NSI.NodeStringImage.encode(JSON.stringify(this.compressAtlas(textureAtlasObject, this.uid)), 32);

        this.context.drawImage(codeCanvasAtlas, canvasAtlasBlock.fit.x, canvasAtlasBlock.fit.y);

        // Free blocks as it contains image references
        this.blocks = null;

        this.writeRectangleAtlasHeader(canvasAtlasBlock.fit.x, canvasAtlasBlock.fit.y, atlasSize, atlasSize);

        return this.canvas;
    };

    LibraryAtlas.prototype.createCssSheet = function (atlas, libraryName) {
    };
    LibraryAtlas.prototype.writeRectangleAtlasHeader = function (x, y, w, h) {
        var imageData = this.context.createImageData(4, 1);
        NSI.NodeStringImage.setPixel(imageData, 0, 0, NSI.NodeStringImage.decToRgb(x));
        NSI.NodeStringImage.setPixel(imageData, 1, 0, NSI.NodeStringImage.decToRgb(y));
        NSI.NodeStringImage.setPixel(imageData, 2, 0, NSI.NodeStringImage.decToRgb(w));
        NSI.NodeStringImage.setPixel(imageData, 3, 0, NSI.NodeStringImage.decToRgb(h));
        this.context.putImageData(imageData, 0, 0);
    };
    LibraryAtlas.LIBS = [];
    return LibraryAtlas;
})();
exports.LibraryAtlas = LibraryAtlas;

