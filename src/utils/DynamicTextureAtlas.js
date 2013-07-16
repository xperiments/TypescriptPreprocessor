///<reference path="../../dec/node.d.ts"/>
///<reference path='BinaryPacker.ts'/>
///<reference path='jsonh.d.ts'/>
///<reference path='NodeStringImage.ts'/>
var BIN = require("./BinaryPacker");

var Canvas = require('canvas');
var JSONH = require('./jsonh');
var Image = require('canvas').Image;
var base91 = require('base91');
var NSI = require('./NodeStringImage');

var DynamicTextureAtlas = (function () {
    /**
    * Creates a new DynamicTextureAtlas
    * @param uid A unique identifier for use with DynamicTextureAtlas.getLibrary method
    * @param shapePadding The padding value that is appened to each Image Block
    */
    function DynamicTextureAtlas(uid, shapePadding) {
        if (typeof shapePadding === "undefined") { shapePadding = 4; }
        this.uid = uid;
        this.shapePadding = shapePadding;
        /**
        * Contains the blocks used in the Binary Packing
        * @type {Array}
        */
        this.blocks = [];
        DynamicTextureAtlas.LIBS[uid] = this;

        // Create the Canvas&Context
        this.canvas = new Canvas();
        this.context = this.canvas.getContext('2d');
    }
    DynamicTextureAtlas.getLibrary = function (id) {
        return DynamicTextureAtlas.LIBS[id];
    };

    DynamicTextureAtlas.getNextPowerOfTwo = function (num) {
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
    * Add an element to the DynamicTextureAtlas
    * @param id The id that will be used to identify the element in the json SpriteAtlas
    * @param image
    */
    DynamicTextureAtlas.prototype.add = function (id, image) {
        var block;
        var shapePadding2x = this.shapePadding * 2;
        if (image instanceof Image) {
            block = new BIN.BinaryBlock(this.shapePadding, this.shapePadding, (image).width + shapePadding2x, (image).height + shapePadding2x, image, id);
        } else if (image instanceof Canvas) {
            block = new BIN.BinaryBlock(this.shapePadding, this.shapePadding, (image).width + shapePadding2x, (image).height + shapePadding2x, image, id);
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
    DynamicTextureAtlas.prototype.addFromDataURL = function (id, dataURL) {
        var image = new Image();
        image.src = dataURL;

        this.blocks.push(new BIN.BinaryBlock(0, 0, image.width, image.height, image, id));
    };

    DynamicTextureAtlas.prototype.compressAtlas = function (atlas, libraryName) {
        var compressed = {};
        var l = compressed[libraryName] = {};
        for (var i in atlas[libraryName]) {
            l[i] = this.compressAtlasElement(atlas[libraryName][i]);
        }
        return compressed;
    };
    DynamicTextureAtlas.prototype.compressAtlasElement = function (obj) {
        return {
            f: [obj.frame.x, obj.frame.y, obj.frame.w, obj.frame.h]
        };
    };

    /**
    * Packs all block elements and generates the BaseTexture & TextureAtlas
    * @param mode
    */
    DynamicTextureAtlas.prototype.render = function (mode, atlasSize) {
        if (typeof mode === "undefined") { mode = BIN.BinarySortType.MAXSIDE; }
        if (typeof atlasSize === "undefined") { atlasSize = 32; }
        var i;
        var t;
        var total;

        var canvasAtlas = new Canvas();
        canvasAtlas.width = atlasSize;
        canvasAtlas.height = atlasSize;

        var ctx = canvasAtlas.getContext('2d');
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(0, 0, atlasSize, atlasSize);

        var avaliableStringBytes = atlasSize * atlasSize * 3;

        var shapePadding2x = this.shapePadding * 2;

        var canvasAtlasBlock = new BIN.BinaryBlock(this.shapePadding, this.shapePadding, atlasSize + shapePadding2x, atlasSize + shapePadding2x, canvasAtlas, 'TextureAtlas');

        this.blocks.push(canvasAtlasBlock);

        // Packs & Order the image blocks
        BIN.BinaryPacker.pack(this.blocks, mode.toString());

        this.canvas.width = BIN.BinaryPacker.root.w;
        this.canvas.height = BIN.BinaryPacker.root.h;

        var textureAtlas = {};
        for (i = 0, total = this.blocks.length; i < total; i++) {
            var cur = this.blocks[i];

            // create Atlas Element
            textureAtlas[cur.id] = {
                frame: { x: cur.fit.x + this.shapePadding, y: cur.fit.y + this.shapePadding, w: cur.w, h: cur.h },
                rotated: false,
                trimmed: false,
                spriteSourceSize: { x: cur.fit.x + this.shapePadding, y: cur.fit.y + this.shapePadding, w: cur.w, h: cur.h },
                sourceSize: { w: cur.w, h: cur.h }
            };

            // draw image to canvas
            this.context.drawImage(cur.data, cur.fit.x + this.shapePadding, cur.fit.y + this.shapePadding);
        }

        // create texture from resulting canvas
        this.textureAtlas = textureAtlas;
        var textureAtlasObject = {};
        textureAtlasObject[this.uid] = this.textureAtlas;

        //console.log( JSON.stringify( textureAtlasObject).length )
        //console.log( JSON.stringify( this.compressAtlas( textureAtlasObject ,this.uid )).length );
        //console.log( JSON.stringify( this.compressAtlas( textureAtlasObject, this.uid )).length );
        //console.log( canvasAtlasBlock.fit.x , canvasAtlasBlock.fit.y )
        // Free blocks as it contains image references
        this.blocks = null;

        this.writeRectangleAtlasHeader(canvasAtlasBlock.fit.x, canvasAtlasBlock.fit.y, atlasSize, atlasSize);

        return this.canvas;
    };

    DynamicTextureAtlas.prototype.writeRectangleAtlasHeader = function (x, y, w, h) {
        var imageData = this.context.createImageData(4, 1);
        NSI.NodeStringImage.setPixel(imageData, 0, 0, NSI.NodeStringImage.decToRgb(x));
        NSI.NodeStringImage.setPixel(imageData, 1, 0, NSI.NodeStringImage.decToRgb(y));
        NSI.NodeStringImage.setPixel(imageData, 2, 0, NSI.NodeStringImage.decToRgb(w));
        NSI.NodeStringImage.setPixel(imageData, 3, 0, NSI.NodeStringImage.decToRgb(h));
        this.context.putImageData(imageData, 0, 0);
    };
    DynamicTextureAtlas.LIBS = [];
    return DynamicTextureAtlas;
})();
exports.DynamicTextureAtlas = DynamicTextureAtlas;

