var BinaryBlock = (function () {
    function BinaryBlock(x, y, w, h, data, id) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.data = data;
        this.id = id;
    }
    return BinaryBlock;
})();
exports.BinaryBlock = BinaryBlock;

var BinarySortType = (function () {
    function BinarySortType(value) {
        this.value = value;
    }
    // static sconstructor = (()=>{ return true})();
    BinarySortType.prototype.toString = function () {
        return this.value;
    };

    BinarySortType.WIDTH = new BinarySortType("width");
    BinarySortType.HEIGHT = new BinarySortType("height");
    BinarySortType.MAXSIDE = new BinarySortType("maxside");
    BinarySortType.AREA = new BinarySortType("area");
    return BinarySortType;
})();
exports.BinarySortType = BinarySortType;

var BinarySort = (function () {
    function BinarySort() {
    }
    BinarySort.w = function (a, b) {
        return b.w - a.w;
    };
    BinarySort.h = function (a, b) {
        return b.h - a.h;
    };
    BinarySort.a = function (a, b) {
        return b.area - a.area;
    };
    BinarySort.max = function (a, b) {
        return Math.max(b.w, b.h) - Math.max(a.w, a.h);
    };
    BinarySort.min = function (a, b) {
        return Math.min(b.w, b.h) - Math.min(a.w, a.h);
    };

    BinarySort.height = function (a, b) {
        return BinarySort.msort(a, b, ['h', 'w']);
    };
    BinarySort.width = function (a, b) {
        return BinarySort.msort(a, b, ['w', 'h']);
    };
    BinarySort.area = function (a, b) {
        return BinarySort.msort(a, b, ['a', 'h', 'w']);
    };
    BinarySort.maxside = function (a, b) {
        return BinarySort.msort(a, b, ['max', 'min', 'h', 'w']);
    };

    BinarySort.sort = function (blocks, sort) {
        if (!sort.match(/(random)|(w)|(h)|(a)|(max)|(min)|(height)|(width)|(area)|(maxside)/))
            return;

        blocks.sort((BinarySort[sort]));
    };

    BinarySort.msort = function (a, b, criteria) {
        /* sort by multiple criteria */
        var diff;
        var n;
        var total = criteria.length;
        for (n = 0; n < total; n++) {
            var sortMethod = BinarySort[criteria[n]];
            diff = sortMethod(a, b);
            if (diff != 0) {
                return diff;
            }
        }
        return 0;
    };
    return BinarySort;
})();
exports.BinarySort = BinarySort;
var BinaryPacker = (function () {
    function BinaryPacker() {
    }
    BinaryPacker.pack = function (blocks, mode) {
        BinarySort.sort(blocks, mode);
        BinaryPacker.fit(blocks);
    };
    BinaryPacker.fit = function (blocks) {
        var n;
        var node;
        var block;

        var len = blocks.length;

        var w = len > 0 ? blocks[0].w : 0;
        var h = len > 0 ? blocks[0].h : 0;

        BinaryPacker.root = {
            x: 0,
            y: 0,
            w: w,
            h: h
        };
        for (n = 0; n < len; n++) {
            block = blocks[n];
            if (node = BinaryPacker.findNode(BinaryPacker.root, block.w, block.h)) {
                block.fit = BinaryPacker.splitNode(node, block.w, block.h);
            } else {
                block.fit = BinaryPacker.growNode(block.w, block.h);
            }
        }
    };

    BinaryPacker.findNode = function (root, w, h) {
        if (root.used) {
            return BinaryPacker.findNode(root.right, w, h) || BinaryPacker.findNode(root.down, w, h);
        } else {
            if ((w <= root.w) && (h <= root.h)) {
                return root;
            } else {
                return null;
            }
        }
    };

    BinaryPacker.splitNode = function (node, w, h) {
        node.used = true;
        node.down = {
            x: node.x,
            y: node.y + h,
            w: node.w,
            h: node.h - h
        };
        node.right = {
            x: node.x + w,
            y: node.y,
            w: node.w - w,
            h: h
        };
        return node;
    };

    BinaryPacker.growNode = function (w, h) {
        var canGrowDown = (w <= BinaryPacker.root.w);
        var canGrowRight = (h <= BinaryPacker.root.h);

        var shouldGrowRight = canGrowRight && (BinaryPacker.root.h >= (BinaryPacker.root.w + w));
        var shouldGrowDown = canGrowDown && (BinaryPacker.root.w >= (BinaryPacker.root.h + h));

        if (shouldGrowRight)
            return BinaryPacker.growRight(w, h); else if (shouldGrowDown)
            return BinaryPacker.growDown(w, h); else if (canGrowRight)
            return BinaryPacker.growRight(w, h); else if (canGrowDown)
            return BinaryPacker.growDown(w, h); else
            return null;
    };

    BinaryPacker.growRight = function (w, h) {
        BinaryPacker.root = {
            used: true,
            x: 0,
            y: 0,
            w: BinaryPacker.root.w + w,
            h: BinaryPacker.root.h,
            down: BinaryPacker.root,
            right: {
                x: BinaryPacker.root.w,
                y: 0,
                w: w,
                h: BinaryPacker.root.h
            }
        };
        var node;
        if (node = BinaryPacker.findNode(BinaryPacker.root, w, h)) {
            return BinaryPacker.splitNode(node, w, h);
        } else {
            return null;
        }
    };

    BinaryPacker.growDown = function (w, h) {
        BinaryPacker.root = {
            used: true,
            x: 0,
            y: 0,
            w: BinaryPacker.root.w,
            h: BinaryPacker.root.h + h,
            down: {
                x: 0,
                y: BinaryPacker.root.h,
                w: BinaryPacker.root.w,
                h: h
            },
            right: BinaryPacker.root
        };
        var node;
        if (node = BinaryPacker.findNode(BinaryPacker.root, w, h)) {
            return BinaryPacker.splitNode(node, w, h);
        } else {
            return null;
        }
    };
    return BinaryPacker;
})();
exports.BinaryPacker = BinaryPacker;

