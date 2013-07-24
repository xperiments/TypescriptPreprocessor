///<reference path="../../dec/node.d.ts"/>
var Canvas = require('canvas');

var NodeStringImage = (function () {
    function NodeStringImage() {
    }
    NodeStringImage.initialize = function () {
        NodeStringImage.canvas = new Canvas();
        NodeStringImage.ctx = NodeStringImage.canvas.getContext('2d');
        return true;
    };

    NodeStringImage.dec2hex = function (i) {
        var hex = i.toString(16);
        hex = "000000".substr(0, 6 - hex.length) + hex;
        return hex;
    };
    NodeStringImage.hexToRgb = function (hex) {
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
    };

    NodeStringImage.decToRgb = function (i) {
        return NodeStringImage.hexToRgb(NodeStringImage.dec2hex(i));
    };
    NodeStringImage.rgbToHex = function (r, g, b) {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1, 7);
    };
    NodeStringImage.encode = function (str, width) {
        if (typeof width === "undefined") { width = 256; }
        var len = str.length;
        var square = Math.ceil(Math.sqrt(len / 3));
        var height = Math.ceil((len / 3) / width);
        var imageData = NodeStringImage.ctx.createImageData(width, height);
        var lengthHeader = NodeStringImage.hexToRgb(NodeStringImage.dec2hex(len));
        var currentPixel = { r: 0, g: 0, b: 0 };
        var pixelCount = 0;

        // create a new canvas as we need a clone
        var canvas = new Canvas();
        var ctx = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        NodeStringImage.setPixel(imageData, 0, 0, lengthHeader);
        pixelCount++;
        for (var i = 0, total = str.length; i < total; i += 3) {
            currentPixel.r = str.charCodeAt(i);
            currentPixel.g = str.charCodeAt(i + 1);
            currentPixel.b = str.charCodeAt(i + 2);
            NodeStringImage.setPixel(imageData, pixelCount % width, Math.floor(pixelCount / width), currentPixel);
            pixelCount++;
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    };
    NodeStringImage.decode = function (imageData) {
        var hexHeader = NodeStringImage.rgbToHex(imageData.data[0], imageData.data[1], imageData.data[2]);
        var lengthHeader = parseInt(hexHeader, 16);
        var str = "";
        var i, s;
        var fromCharCode = [];
        for (i = 0; i < 256; i++) {
            fromCharCode.push(String.fromCharCode(i));
        }
        for (i = 0; i < lengthHeader; i += 3) {
            s = (i / 3) * 4;
            str += fromCharCode[imageData.data[4 + s]];
            if (imageData.data[4 + s + 1]) {
                str += fromCharCode[imageData.data[4 + s + 1]];
                if (imageData.data[4 + s + 2]) {
                    str += fromCharCode[imageData.data[4 + s + 2]];
                }
            }
        }
        return str;
    };
    NodeStringImage.setPixel = function (imageData, x, y, rgb) {
        var index = ((x + y * imageData.width) * 4);
        imageData.data[index + 0] = rgb.r;
        imageData.data[index + 1] = rgb.g;
        imageData.data[index + 2] = rgb.b;
        imageData.data[index + 3] = 255;
    };
    NodeStringImage.initialized = NodeStringImage.initialize();
    return NodeStringImage;
})();
exports.NodeStringImage = NodeStringImage;

