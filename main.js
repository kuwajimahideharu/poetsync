"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/spark-md5/spark-md5.js
var require_spark_md5 = __commonJS({
  "node_modules/spark-md5/spark-md5.js"(exports2, module2) {
    (function(factory) {
      if (typeof exports2 === "object") {
        module2.exports = factory();
      } else if (typeof define === "function" && define.amd) {
        define(factory);
      } else {
        var glob;
        try {
          glob = window;
        } catch (e) {
          glob = self;
        }
        glob.SparkMD5 = factory();
      }
    })(function(undefined) {
      "use strict";
      var add32 = function(a, b) {
        return a + b & 4294967295;
      }, hex_chr = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
      function cmn(q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32(a << s | a >>> 32 - s, b);
      }
      function md5cycle(x, k) {
        var a = x[0], b = x[1], c = x[2], d = x[3];
        a += (b & c | ~b & d) + k[0] - 680876936 | 0;
        a = (a << 7 | a >>> 25) + b | 0;
        d += (a & b | ~a & c) + k[1] - 389564586 | 0;
        d = (d << 12 | d >>> 20) + a | 0;
        c += (d & a | ~d & b) + k[2] + 606105819 | 0;
        c = (c << 17 | c >>> 15) + d | 0;
        b += (c & d | ~c & a) + k[3] - 1044525330 | 0;
        b = (b << 22 | b >>> 10) + c | 0;
        a += (b & c | ~b & d) + k[4] - 176418897 | 0;
        a = (a << 7 | a >>> 25) + b | 0;
        d += (a & b | ~a & c) + k[5] + 1200080426 | 0;
        d = (d << 12 | d >>> 20) + a | 0;
        c += (d & a | ~d & b) + k[6] - 1473231341 | 0;
        c = (c << 17 | c >>> 15) + d | 0;
        b += (c & d | ~c & a) + k[7] - 45705983 | 0;
        b = (b << 22 | b >>> 10) + c | 0;
        a += (b & c | ~b & d) + k[8] + 1770035416 | 0;
        a = (a << 7 | a >>> 25) + b | 0;
        d += (a & b | ~a & c) + k[9] - 1958414417 | 0;
        d = (d << 12 | d >>> 20) + a | 0;
        c += (d & a | ~d & b) + k[10] - 42063 | 0;
        c = (c << 17 | c >>> 15) + d | 0;
        b += (c & d | ~c & a) + k[11] - 1990404162 | 0;
        b = (b << 22 | b >>> 10) + c | 0;
        a += (b & c | ~b & d) + k[12] + 1804603682 | 0;
        a = (a << 7 | a >>> 25) + b | 0;
        d += (a & b | ~a & c) + k[13] - 40341101 | 0;
        d = (d << 12 | d >>> 20) + a | 0;
        c += (d & a | ~d & b) + k[14] - 1502002290 | 0;
        c = (c << 17 | c >>> 15) + d | 0;
        b += (c & d | ~c & a) + k[15] + 1236535329 | 0;
        b = (b << 22 | b >>> 10) + c | 0;
        a += (b & d | c & ~d) + k[1] - 165796510 | 0;
        a = (a << 5 | a >>> 27) + b | 0;
        d += (a & c | b & ~c) + k[6] - 1069501632 | 0;
        d = (d << 9 | d >>> 23) + a | 0;
        c += (d & b | a & ~b) + k[11] + 643717713 | 0;
        c = (c << 14 | c >>> 18) + d | 0;
        b += (c & a | d & ~a) + k[0] - 373897302 | 0;
        b = (b << 20 | b >>> 12) + c | 0;
        a += (b & d | c & ~d) + k[5] - 701558691 | 0;
        a = (a << 5 | a >>> 27) + b | 0;
        d += (a & c | b & ~c) + k[10] + 38016083 | 0;
        d = (d << 9 | d >>> 23) + a | 0;
        c += (d & b | a & ~b) + k[15] - 660478335 | 0;
        c = (c << 14 | c >>> 18) + d | 0;
        b += (c & a | d & ~a) + k[4] - 405537848 | 0;
        b = (b << 20 | b >>> 12) + c | 0;
        a += (b & d | c & ~d) + k[9] + 568446438 | 0;
        a = (a << 5 | a >>> 27) + b | 0;
        d += (a & c | b & ~c) + k[14] - 1019803690 | 0;
        d = (d << 9 | d >>> 23) + a | 0;
        c += (d & b | a & ~b) + k[3] - 187363961 | 0;
        c = (c << 14 | c >>> 18) + d | 0;
        b += (c & a | d & ~a) + k[8] + 1163531501 | 0;
        b = (b << 20 | b >>> 12) + c | 0;
        a += (b & d | c & ~d) + k[13] - 1444681467 | 0;
        a = (a << 5 | a >>> 27) + b | 0;
        d += (a & c | b & ~c) + k[2] - 51403784 | 0;
        d = (d << 9 | d >>> 23) + a | 0;
        c += (d & b | a & ~b) + k[7] + 1735328473 | 0;
        c = (c << 14 | c >>> 18) + d | 0;
        b += (c & a | d & ~a) + k[12] - 1926607734 | 0;
        b = (b << 20 | b >>> 12) + c | 0;
        a += (b ^ c ^ d) + k[5] - 378558 | 0;
        a = (a << 4 | a >>> 28) + b | 0;
        d += (a ^ b ^ c) + k[8] - 2022574463 | 0;
        d = (d << 11 | d >>> 21) + a | 0;
        c += (d ^ a ^ b) + k[11] + 1839030562 | 0;
        c = (c << 16 | c >>> 16) + d | 0;
        b += (c ^ d ^ a) + k[14] - 35309556 | 0;
        b = (b << 23 | b >>> 9) + c | 0;
        a += (b ^ c ^ d) + k[1] - 1530992060 | 0;
        a = (a << 4 | a >>> 28) + b | 0;
        d += (a ^ b ^ c) + k[4] + 1272893353 | 0;
        d = (d << 11 | d >>> 21) + a | 0;
        c += (d ^ a ^ b) + k[7] - 155497632 | 0;
        c = (c << 16 | c >>> 16) + d | 0;
        b += (c ^ d ^ a) + k[10] - 1094730640 | 0;
        b = (b << 23 | b >>> 9) + c | 0;
        a += (b ^ c ^ d) + k[13] + 681279174 | 0;
        a = (a << 4 | a >>> 28) + b | 0;
        d += (a ^ b ^ c) + k[0] - 358537222 | 0;
        d = (d << 11 | d >>> 21) + a | 0;
        c += (d ^ a ^ b) + k[3] - 722521979 | 0;
        c = (c << 16 | c >>> 16) + d | 0;
        b += (c ^ d ^ a) + k[6] + 76029189 | 0;
        b = (b << 23 | b >>> 9) + c | 0;
        a += (b ^ c ^ d) + k[9] - 640364487 | 0;
        a = (a << 4 | a >>> 28) + b | 0;
        d += (a ^ b ^ c) + k[12] - 421815835 | 0;
        d = (d << 11 | d >>> 21) + a | 0;
        c += (d ^ a ^ b) + k[15] + 530742520 | 0;
        c = (c << 16 | c >>> 16) + d | 0;
        b += (c ^ d ^ a) + k[2] - 995338651 | 0;
        b = (b << 23 | b >>> 9) + c | 0;
        a += (c ^ (b | ~d)) + k[0] - 198630844 | 0;
        a = (a << 6 | a >>> 26) + b | 0;
        d += (b ^ (a | ~c)) + k[7] + 1126891415 | 0;
        d = (d << 10 | d >>> 22) + a | 0;
        c += (a ^ (d | ~b)) + k[14] - 1416354905 | 0;
        c = (c << 15 | c >>> 17) + d | 0;
        b += (d ^ (c | ~a)) + k[5] - 57434055 | 0;
        b = (b << 21 | b >>> 11) + c | 0;
        a += (c ^ (b | ~d)) + k[12] + 1700485571 | 0;
        a = (a << 6 | a >>> 26) + b | 0;
        d += (b ^ (a | ~c)) + k[3] - 1894986606 | 0;
        d = (d << 10 | d >>> 22) + a | 0;
        c += (a ^ (d | ~b)) + k[10] - 1051523 | 0;
        c = (c << 15 | c >>> 17) + d | 0;
        b += (d ^ (c | ~a)) + k[1] - 2054922799 | 0;
        b = (b << 21 | b >>> 11) + c | 0;
        a += (c ^ (b | ~d)) + k[8] + 1873313359 | 0;
        a = (a << 6 | a >>> 26) + b | 0;
        d += (b ^ (a | ~c)) + k[15] - 30611744 | 0;
        d = (d << 10 | d >>> 22) + a | 0;
        c += (a ^ (d | ~b)) + k[6] - 1560198380 | 0;
        c = (c << 15 | c >>> 17) + d | 0;
        b += (d ^ (c | ~a)) + k[13] + 1309151649 | 0;
        b = (b << 21 | b >>> 11) + c | 0;
        a += (c ^ (b | ~d)) + k[4] - 145523070 | 0;
        a = (a << 6 | a >>> 26) + b | 0;
        d += (b ^ (a | ~c)) + k[11] - 1120210379 | 0;
        d = (d << 10 | d >>> 22) + a | 0;
        c += (a ^ (d | ~b)) + k[2] + 718787259 | 0;
        c = (c << 15 | c >>> 17) + d | 0;
        b += (d ^ (c | ~a)) + k[9] - 343485551 | 0;
        b = (b << 21 | b >>> 11) + c | 0;
        x[0] = a + x[0] | 0;
        x[1] = b + x[1] | 0;
        x[2] = c + x[2] | 0;
        x[3] = d + x[3] | 0;
      }
      function md5blk(s) {
        var md5blks = [], i;
        for (i = 0; i < 64; i += 4) {
          md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
      }
      function md5blk_array(a) {
        var md5blks = [], i;
        for (i = 0; i < 64; i += 4) {
          md5blks[i >> 2] = a[i] + (a[i + 1] << 8) + (a[i + 2] << 16) + (a[i + 3] << 24);
        }
        return md5blks;
      }
      function md51(s) {
        var n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i, length, tail, tmp, lo, hi;
        for (i = 64; i <= n; i += 64) {
          md5cycle(state, md5blk(s.substring(i - 64, i)));
        }
        s = s.substring(i - 64);
        length = s.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
          tail[i >> 2] |= s.charCodeAt(i) << (i % 4 << 3);
        }
        tail[i >> 2] |= 128 << (i % 4 << 3);
        if (i > 55) {
          md5cycle(state, tail);
          for (i = 0; i < 16; i += 1) {
            tail[i] = 0;
          }
        }
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;
        tail[14] = lo;
        tail[15] = hi;
        md5cycle(state, tail);
        return state;
      }
      function md51_array(a) {
        var n = a.length, state = [1732584193, -271733879, -1732584194, 271733878], i, length, tail, tmp, lo, hi;
        for (i = 64; i <= n; i += 64) {
          md5cycle(state, md5blk_array(a.subarray(i - 64, i)));
        }
        a = i - 64 < n ? a.subarray(i - 64) : new Uint8Array(0);
        length = a.length;
        tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < length; i += 1) {
          tail[i >> 2] |= a[i] << (i % 4 << 3);
        }
        tail[i >> 2] |= 128 << (i % 4 << 3);
        if (i > 55) {
          md5cycle(state, tail);
          for (i = 0; i < 16; i += 1) {
            tail[i] = 0;
          }
        }
        tmp = n * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;
        tail[14] = lo;
        tail[15] = hi;
        md5cycle(state, tail);
        return state;
      }
      function rhex(n) {
        var s = "", j;
        for (j = 0; j < 4; j += 1) {
          s += hex_chr[n >> j * 8 + 4 & 15] + hex_chr[n >> j * 8 & 15];
        }
        return s;
      }
      function hex(x) {
        var i;
        for (i = 0; i < x.length; i += 1) {
          x[i] = rhex(x[i]);
        }
        return x.join("");
      }
      if (hex(md51("hello")) !== "5d41402abc4b2a76b9719d911017c592") {
        add32 = function(x, y) {
          var lsw = (x & 65535) + (y & 65535), msw = (x >> 16) + (y >> 16) + (lsw >> 16);
          return msw << 16 | lsw & 65535;
        };
      }
      if (typeof ArrayBuffer !== "undefined" && !ArrayBuffer.prototype.slice) {
        (function() {
          function clamp(val, length) {
            val = val | 0 || 0;
            if (val < 0) {
              return Math.max(val + length, 0);
            }
            return Math.min(val, length);
          }
          ArrayBuffer.prototype.slice = function(from, to) {
            var length = this.byteLength, begin = clamp(from, length), end = length, num, target, targetArray, sourceArray;
            if (to !== undefined) {
              end = clamp(to, length);
            }
            if (begin > end) {
              return new ArrayBuffer(0);
            }
            num = end - begin;
            target = new ArrayBuffer(num);
            targetArray = new Uint8Array(target);
            sourceArray = new Uint8Array(this, begin, num);
            targetArray.set(sourceArray);
            return target;
          };
        })();
      }
      function toUtf8(str) {
        if (/[\u0080-\uFFFF]/.test(str)) {
          str = unescape(encodeURIComponent(str));
        }
        return str;
      }
      function utf8Str2ArrayBuffer(str, returnUInt8Array) {
        var length = str.length, buff = new ArrayBuffer(length), arr = new Uint8Array(buff), i;
        for (i = 0; i < length; i += 1) {
          arr[i] = str.charCodeAt(i);
        }
        return returnUInt8Array ? arr : buff;
      }
      function arrayBuffer2Utf8Str(buff) {
        return String.fromCharCode.apply(null, new Uint8Array(buff));
      }
      function concatenateArrayBuffers(first, second, returnUInt8Array) {
        var result = new Uint8Array(first.byteLength + second.byteLength);
        result.set(new Uint8Array(first));
        result.set(new Uint8Array(second), first.byteLength);
        return returnUInt8Array ? result : result.buffer;
      }
      function hexToBinaryString(hex2) {
        var bytes = [], length = hex2.length, x;
        for (x = 0; x < length - 1; x += 2) {
          bytes.push(parseInt(hex2.substr(x, 2), 16));
        }
        return String.fromCharCode.apply(String, bytes);
      }
      function SparkMD52() {
        this.reset();
      }
      SparkMD52.prototype.append = function(str) {
        this.appendBinary(toUtf8(str));
        return this;
      };
      SparkMD52.prototype.appendBinary = function(contents) {
        this._buff += contents;
        this._length += contents.length;
        var length = this._buff.length, i;
        for (i = 64; i <= length; i += 64) {
          md5cycle(this._hash, md5blk(this._buff.substring(i - 64, i)));
        }
        this._buff = this._buff.substring(i - 64);
        return this;
      };
      SparkMD52.prototype.end = function(raw) {
        var buff = this._buff, length = buff.length, i, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], ret;
        for (i = 0; i < length; i += 1) {
          tail[i >> 2] |= buff.charCodeAt(i) << (i % 4 << 3);
        }
        this._finish(tail, length);
        ret = hex(this._hash);
        if (raw) {
          ret = hexToBinaryString(ret);
        }
        this.reset();
        return ret;
      };
      SparkMD52.prototype.reset = function() {
        this._buff = "";
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];
        return this;
      };
      SparkMD52.prototype.getState = function() {
        return {
          buff: this._buff,
          length: this._length,
          hash: this._hash.slice()
        };
      };
      SparkMD52.prototype.setState = function(state) {
        this._buff = state.buff;
        this._length = state.length;
        this._hash = state.hash;
        return this;
      };
      SparkMD52.prototype.destroy = function() {
        delete this._hash;
        delete this._buff;
        delete this._length;
      };
      SparkMD52.prototype._finish = function(tail, length) {
        var i = length, tmp, lo, hi;
        tail[i >> 2] |= 128 << (i % 4 << 3);
        if (i > 55) {
          md5cycle(this._hash, tail);
          for (i = 0; i < 16; i += 1) {
            tail[i] = 0;
          }
        }
        tmp = this._length * 8;
        tmp = tmp.toString(16).match(/(.*?)(.{0,8})$/);
        lo = parseInt(tmp[2], 16);
        hi = parseInt(tmp[1], 16) || 0;
        tail[14] = lo;
        tail[15] = hi;
        md5cycle(this._hash, tail);
      };
      SparkMD52.hash = function(str, raw) {
        return SparkMD52.hashBinary(toUtf8(str), raw);
      };
      SparkMD52.hashBinary = function(content, raw) {
        var hash = md51(content), ret = hex(hash);
        return raw ? hexToBinaryString(ret) : ret;
      };
      SparkMD52.ArrayBuffer = function() {
        this.reset();
      };
      SparkMD52.ArrayBuffer.prototype.append = function(arr) {
        var buff = concatenateArrayBuffers(this._buff.buffer, arr, true), length = buff.length, i;
        this._length += arr.byteLength;
        for (i = 64; i <= length; i += 64) {
          md5cycle(this._hash, md5blk_array(buff.subarray(i - 64, i)));
        }
        this._buff = i - 64 < length ? new Uint8Array(buff.buffer.slice(i - 64)) : new Uint8Array(0);
        return this;
      };
      SparkMD52.ArrayBuffer.prototype.end = function(raw) {
        var buff = this._buff, length = buff.length, tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], i, ret;
        for (i = 0; i < length; i += 1) {
          tail[i >> 2] |= buff[i] << (i % 4 << 3);
        }
        this._finish(tail, length);
        ret = hex(this._hash);
        if (raw) {
          ret = hexToBinaryString(ret);
        }
        this.reset();
        return ret;
      };
      SparkMD52.ArrayBuffer.prototype.reset = function() {
        this._buff = new Uint8Array(0);
        this._length = 0;
        this._hash = [1732584193, -271733879, -1732584194, 271733878];
        return this;
      };
      SparkMD52.ArrayBuffer.prototype.getState = function() {
        var state = SparkMD52.prototype.getState.call(this);
        state.buff = arrayBuffer2Utf8Str(state.buff);
        return state;
      };
      SparkMD52.ArrayBuffer.prototype.setState = function(state) {
        state.buff = utf8Str2ArrayBuffer(state.buff, true);
        return SparkMD52.prototype.setState.call(this, state);
      };
      SparkMD52.ArrayBuffer.prototype.destroy = SparkMD52.prototype.destroy;
      SparkMD52.ArrayBuffer.prototype._finish = SparkMD52.prototype._finish;
      SparkMD52.ArrayBuffer.hash = function(arr, raw) {
        var hash = md51_array(new Uint8Array(arr)), ret = hex(hash);
        return raw ? hexToBinaryString(ret) : ret;
      };
      return SparkMD52;
    });
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => PoetSyncPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var import_spark_md5 = __toESM(require_spark_md5());
var BINARY_EXTENSIONS = /* @__PURE__ */ new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "ico",
  "tiff",
  "pdf",
  "zip",
  "gz",
  "tar",
  "mp3",
  "mp4",
  "wav",
  "ogg",
  "mov",
  "avi",
  "mkv"
]);
function isBinaryExt(ext) {
  return BINARY_EXTENSIONS.has(ext.toLowerCase());
}
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
function md5OfText(content) {
  return import_spark_md5.default.hash(content);
}
function md5OfBuffer(buffer) {
  return import_spark_md5.default.ArrayBuffer.hash(buffer);
}
function makeConflictPath(filePath) {
  const d = /* @__PURE__ */ new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}`;
  const dot = filePath.lastIndexOf(".");
  const slash = filePath.lastIndexOf("/");
  if (dot > slash) {
    return `${filePath.slice(0, dot)} (\u7AF6\u5408 ${stamp})${filePath.slice(dot)}`;
  }
  return `${filePath} (\u7AF6\u5408 ${stamp})`;
}
var DEFAULT_SETTINGS = {
  serverUrl: "ws://localhost:27124",
  enabled: true,
  sendEnabled: true,
  authToken: ""
};
var PoetSyncPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.ws = null;
    this.reconnectTimer = null;
    this.isConnecting = false;
    this.ignorePaths = /* @__PURE__ */ new Set();
    this.serverFileHashes = /* @__PURE__ */ new Map();
    // サーバーの file_saved 応答がまだ届いていない（＝未送信かもしれない）ローカル変更。
    // オフライン中の作成・編集もここに記録し、再接続時にアップロードする
    this.pendingPaths = /* @__PURE__ */ new Set();
    // 最後に実際にサーバーへ送信した内容の MD5。file_saved の応答が失われても、
    // ローカル内容がこれと一致していれば「送信済みの変更しかない」と判断でき、
    // 偽の競合コピーを作らずに済む
    this.lastSentHashes = /* @__PURE__ */ new Map();
    this.hashSaveTimer = null;
    this.isSyncing = false;
    this.syncingPaths = /* @__PURE__ */ new Set();
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new PoetSyncSettingTab(this.app, this));
    if (this.settings.enabled) this.connect();
    this.addRibbonIcon("refresh-cw", "PoetSync: \u518D\u63A5\u7D9A", () => {
      this.forceReconnect();
    });
    this.registerEvent(
      this.app.vault.on("modify", async (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        if (!(file instanceof import_obsidian.TFile)) return;
        await this.uploadFile(file);
      })
    );
    this.registerEvent(
      this.app.vault.on("create", async (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        if (!(file instanceof import_obsidian.TFile)) return;
        await this.uploadFile(file);
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        if (!this.settings.sendEnabled) return;
        if (this.ignorePaths.has(file.path)) return;
        this.pendingPaths.delete(file.path);
        this.lastSentHashes.delete(file.path);
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        if (file instanceof import_obsidian.TFolder) {
          this.ws.send(JSON.stringify({ type: "delete_folder", path: file.path, timestamp: Date.now() }));
        } else {
          this.serverFileHashes.delete(file.path);
          this.ws.send(JSON.stringify({ type: "delete_file", path: file.path, timestamp: Date.now() }));
        }
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", async (file, oldPath) => {
        if (!this.settings.sendEnabled) return;
        if (file instanceof import_obsidian.TFolder) {
          const prefix = oldPath + "/";
          for (const key of [...this.serverFileHashes.keys()]) {
            if (key.startsWith(prefix)) {
              const hash = this.serverFileHashes.get(key);
              this.serverFileHashes.delete(key);
              this.serverFileHashes.set(file.path + "/" + key.slice(prefix.length), hash);
            }
          }
          for (const key of [...this.pendingPaths]) {
            if (key.startsWith(prefix)) {
              this.pendingPaths.delete(key);
              this.pendingPaths.add(file.path + "/" + key.slice(prefix.length));
            }
          }
          for (const key of [...this.lastSentHashes.keys()]) {
            if (key.startsWith(prefix)) {
              const hash = this.lastSentHashes.get(key);
              this.lastSentHashes.delete(key);
              this.lastSentHashes.set(file.path + "/" + key.slice(prefix.length), hash);
            }
          }
          this.scheduleSaveHashes();
          if (this.ws?.readyState !== WebSocket.OPEN) return;
          this.ws.send(JSON.stringify({ type: "rename_folder", oldPath, newPath: file.path, timestamp: Date.now() }));
          return;
        }
        const oldHash = this.serverFileHashes.get(oldPath);
        this.serverFileHashes.delete(oldPath);
        if (oldHash) this.serverFileHashes.set(file.path, oldHash);
        if (this.pendingPaths.delete(oldPath)) this.pendingPaths.add(file.path);
        const oldSent = this.lastSentHashes.get(oldPath);
        this.lastSentHashes.delete(oldPath);
        if (oldSent) this.lastSentHashes.set(file.path, oldSent);
        this.scheduleSaveHashes();
        if (this.ws?.readyState !== WebSocket.OPEN) return;
        this.ws.send(JSON.stringify({ type: "rename_file", oldPath, newPath: file.path, timestamp: Date.now() }));
      })
    );
    console.log("PoetSync plugin loaded");
  }
  // ローカルの変更をサーバーへ送る。オフライン時は pendingPaths に記録だけして
  // 再接続時（sync_end 処理）に送信する
  async uploadFile(file) {
    this.pendingPaths.add(file.path);
    this.scheduleSaveHashes();
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    if (isBinaryExt(file.extension)) {
      const buffer = await this.app.vault.readBinary(file);
      const content = arrayBufferToBase64(buffer);
      this.lastSentHashes.set(file.path, md5OfBuffer(buffer));
      this.ws.send(JSON.stringify({ type: "save_file", path: file.path, content, binary: true, timestamp: Date.now() }));
    } else {
      const content = await this.app.vault.read(file);
      this.lastSentHashes.set(file.path, md5OfText(content));
      this.ws.send(JSON.stringify({ type: "save_file", path: file.path, content, timestamp: Date.now() }));
    }
    this.scheduleSaveHashes();
  }
  buildServerUrl() {
    const token = this.settings.authToken.trim();
    if (!token) return this.settings.serverUrl;
    const sep = this.settings.serverUrl.includes("?") ? "&" : "?";
    return `${this.settings.serverUrl}${sep}token=${encodeURIComponent(token)}`;
  }
  forceReconnect() {
    new import_obsidian.Notice("PoetSync: \u518D\u63A5\u7D9A\u4E2D...");
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    this.connect();
  }
  connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;
    try {
      this.ws = new WebSocket(this.buildServerUrl());
      this.ws.onopen = () => {
        this.isConnecting = false;
        new import_obsidian.Notice("PoetSync: \u30B5\u30FC\u30D0\u30FC\u306B\u63A5\u7D9A\u3057\u307E\u3057\u305F \u2705");
        console.log("PoetSync: Connected");
      };
      this.ws.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data);
          await this.handleMessage(message);
        } catch (err) {
          console.error("PoetSync: Message parse error", err);
        }
      };
      this.ws.onclose = () => {
        this.isConnecting = false;
        console.log("PoetSync: Disconnected, reconnecting in 5s...");
        this.reconnectTimer = window.setTimeout(() => this.connect(), 5e3);
      };
      this.ws.onerror = (err) => {
        this.isConnecting = false;
        console.error("PoetSync: WebSocket error", err);
      };
    } catch (err) {
      this.isConnecting = false;
      console.error("PoetSync: Connection failed", err);
    }
  }
  async handleMessage(message) {
    const vault = this.app.vault;
    if (message.type === "sync_start") {
      this.isSyncing = true;
      this.syncingPaths.clear();
    }
    if (message.type === "file_added" || message.type === "file_changed") {
      if (this.isSyncing) {
        this.syncingPaths.add(message.path);
      }
      const serverHash = message.hash;
      if (serverHash) {
        const lastKnownHash = this.serverFileHashes.get(message.path);
        if (lastKnownHash === serverHash) {
          return;
        }
        const localFile = vault.getAbstractFileByPath(message.path);
        if (localFile instanceof import_obsidian.TFile) {
          try {
            const localHash = isBinaryExt(localFile.extension) ? md5OfBuffer(await vault.readBinary(localFile)) : md5OfText(await vault.read(localFile));
            if (localHash === serverHash) {
              this.serverFileHashes.set(message.path, serverHash);
              this.pendingPaths.delete(message.path);
              this.lastSentHashes.delete(message.path);
              this.scheduleSaveHashes();
              return;
            }
          } catch (err) {
            console.error("PoetSync: Local hash check failed", err);
          }
        }
      }
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "get_file", path: message.path }));
      }
    }
    if (message.type === "sync_end") {
      this.isSyncing = false;
      const serverPaths = new Set(this.syncingPaths);
      this.syncingPaths.clear();
      this.app.workspace.onLayoutReady(async () => {
        const allLocalFiles = this.app.vault.getFiles();
        for (const file of allLocalFiles) {
          if (serverPaths.has(file.path)) continue;
          if (this.serverFileHashes.has(file.path)) {
            this.ignorePaths.add(file.path);
            this.serverFileHashes.delete(file.path);
            this.pendingPaths.delete(file.path);
            await this.app.vault.delete(file);
            setTimeout(() => this.ignorePaths.delete(file.path), 5e3);
            console.log(`PoetSync: Removed stale file ${file.path}`);
          } else if (this.settings.sendEnabled) {
            console.log(`PoetSync: Uploading new local file ${file.path}`);
            await this.uploadFile(file);
          }
        }
        if (this.settings.sendEnabled) {
          for (const p of [...this.pendingPaths]) {
            const f = this.app.vault.getAbstractFileByPath(p);
            if (f instanceof import_obsidian.TFile) {
              console.log(`PoetSync: Uploading pending change ${p}`);
              await this.uploadFile(f);
            } else {
              this.pendingPaths.delete(p);
            }
          }
        }
        this.scheduleSaveHashes();
      });
    }
    if (message.type === "file_content") {
      const filePath = message.path;
      const existingFile = vault.getAbstractFileByPath(filePath);
      if (this.pendingPaths.has(filePath) && existingFile instanceof import_obsidian.TFile) {
        try {
          let localHash;
          let localText = null;
          let localBuffer = null;
          if (isBinaryExt(existingFile.extension)) {
            localBuffer = await vault.readBinary(existingFile);
            localHash = md5OfBuffer(localBuffer);
          } else {
            localText = await vault.read(existingFile);
            localHash = md5OfText(localText);
          }
          const sameAsServer = message.hash ? localHash === message.hash : localText !== null && !message.binary && localText === message.content;
          const alreadySent = localHash === this.lastSentHashes.get(filePath);
          if (sameAsServer || alreadySent) {
            console.log(`PoetSync: Stale pending flag for ${filePath} (${sameAsServer ? "same as server" : "already sent"}), skipping conflict copy`);
          } else {
            const conflictPath = makeConflictPath(filePath);
            if (localBuffer !== null) {
              await vault.createBinary(conflictPath, localBuffer);
            } else {
              await vault.create(conflictPath, localText);
            }
            new import_obsidian.Notice(`PoetSync: \u7AF6\u5408\u3092\u691C\u51FA\u3002\u30ED\u30FC\u30AB\u30EB\u7248\u3092\u300C${conflictPath}\u300D\u306B\u4FDD\u5B58\u3057\u307E\u3057\u305F`);
            console.log(`PoetSync: Conflict detected, local copy saved as ${conflictPath}`);
          }
        } catch (err) {
          console.error("PoetSync: Conflict copy failed", err);
        }
        this.pendingPaths.delete(filePath);
        this.lastSentHashes.delete(filePath);
      }
      this.ignorePaths.add(filePath);
      const dir = filePath.split("/").slice(0, -1).join("/");
      if (dir && !vault.getAbstractFileByPath(dir)) {
        await vault.createFolder(dir);
      }
      if (message.binary) {
        const arrayBuffer = base64ToArrayBuffer(message.content);
        if (existingFile instanceof import_obsidian.TFile) {
          await vault.modifyBinary(existingFile, arrayBuffer);
        } else {
          await vault.createBinary(filePath, arrayBuffer);
        }
      } else {
        if (existingFile instanceof import_obsidian.TFile) {
          await vault.modify(existingFile, message.content);
        } else {
          await vault.create(filePath, message.content);
        }
      }
      if (message.hash) {
        this.serverFileHashes.set(filePath, message.hash);
        this.scheduleSaveHashes();
      }
      setTimeout(() => this.ignorePaths.delete(filePath), 5e3);
      console.log(`PoetSync: Synced ${filePath}`);
    }
    if (message.type === "file_saved") {
      this.pendingPaths.delete(message.path);
      this.lastSentHashes.delete(message.path);
      if (message.hash) {
        this.serverFileHashes.set(message.path, message.hash);
      }
      this.scheduleSaveHashes();
    }
    if (message.type === "file_deleted") {
      const file = vault.getAbstractFileByPath(message.path);
      if (file) {
        this.ignorePaths.add(message.path);
        await vault.delete(file);
        setTimeout(() => this.ignorePaths.delete(message.path), 5e3);
        console.log(`PoetSync: Deleted ${message.path}`);
      }
      this.serverFileHashes.delete(message.path);
      this.pendingPaths.delete(message.path);
      this.lastSentHashes.delete(message.path);
      this.scheduleSaveHashes();
    }
    if (message.type === "folder_deleted") {
      const folder = vault.getAbstractFileByPath(message.path);
      if (folder) {
        this.ignorePaths.add(message.path);
        await vault.delete(folder, true);
        setTimeout(() => this.ignorePaths.delete(message.path), 5e3);
        console.log(`PoetSync: Deleted folder ${message.path}`);
      }
      const prefix = message.path + "/";
      for (const key of this.serverFileHashes.keys()) {
        if (key.startsWith(prefix)) this.serverFileHashes.delete(key);
      }
      for (const key of [...this.pendingPaths]) {
        if (key.startsWith(prefix)) this.pendingPaths.delete(key);
      }
      for (const key of [...this.lastSentHashes.keys()]) {
        if (key.startsWith(prefix)) this.lastSentHashes.delete(key);
      }
      this.scheduleSaveHashes();
    }
    if (message.type === "file_renamed") {
      const file = vault.getAbstractFileByPath(message.oldPath);
      if (file) {
        this.ignorePaths.add(message.oldPath);
        this.ignorePaths.add(message.newPath);
        const dir = message.newPath.split("/").slice(0, -1).join("/");
        if (dir && !vault.getAbstractFileByPath(dir)) {
          await vault.createFolder(dir);
        }
        await vault.rename(file, message.newPath);
        setTimeout(() => {
          this.ignorePaths.delete(message.oldPath);
          this.ignorePaths.delete(message.newPath);
        }, 5e3);
        console.log(`PoetSync: Renamed ${message.oldPath} -> ${message.newPath}`);
      }
      const oldHash = this.serverFileHashes.get(message.oldPath);
      this.serverFileHashes.delete(message.oldPath);
      if (oldHash) this.serverFileHashes.set(message.newPath, oldHash);
      if (this.pendingPaths.delete(message.oldPath)) this.pendingPaths.add(message.newPath);
      const oldSent = this.lastSentHashes.get(message.oldPath);
      this.lastSentHashes.delete(message.oldPath);
      if (oldSent) this.lastSentHashes.set(message.newPath, oldSent);
      this.scheduleSaveHashes();
    }
    if (message.type === "folder_renamed") {
      const folder = vault.getAbstractFileByPath(message.oldPath);
      if (folder instanceof import_obsidian.TFolder) {
        this.ignorePaths.add(message.oldPath);
        this.ignorePaths.add(message.newPath);
        const dir = message.newPath.split("/").slice(0, -1).join("/");
        if (dir && !vault.getAbstractFileByPath(dir)) {
          await vault.createFolder(dir);
        }
        await vault.rename(folder, message.newPath);
        setTimeout(() => {
          this.ignorePaths.delete(message.oldPath);
          this.ignorePaths.delete(message.newPath);
        }, 5e3);
        console.log(`PoetSync: Renamed folder ${message.oldPath} -> ${message.newPath}`);
      }
      const prefix = message.oldPath + "/";
      for (const key of [...this.serverFileHashes.keys()]) {
        if (key.startsWith(prefix)) {
          const hash = this.serverFileHashes.get(key);
          this.serverFileHashes.delete(key);
          this.serverFileHashes.set(message.newPath + "/" + key.slice(prefix.length), hash);
        }
      }
      for (const key of [...this.pendingPaths]) {
        if (key.startsWith(prefix)) {
          this.pendingPaths.delete(key);
          this.pendingPaths.add(message.newPath + "/" + key.slice(prefix.length));
        }
      }
      for (const key of [...this.lastSentHashes.keys()]) {
        if (key.startsWith(prefix)) {
          const hash = this.lastSentHashes.get(key);
          this.lastSentHashes.delete(key);
          this.lastSentHashes.set(message.newPath + "/" + key.slice(prefix.length), hash);
        }
      }
      this.scheduleSaveHashes();
    }
  }
  scheduleSaveHashes() {
    if (this.hashSaveTimer) window.clearTimeout(this.hashSaveTimer);
    this.hashSaveTimer = window.setTimeout(() => this.saveSettings(), 3e3);
  }
  onunload() {
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
    if (this.hashSaveTimer) window.clearTimeout(this.hashSaveTimer);
    if (this.ws) this.ws.close();
    console.log("PoetSync plugin unloaded");
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    delete this.settings.serverFileHashes;
    delete this.settings.pendingPaths;
    delete this.settings.lastSentHashes;
    if (data?.serverFileHashes) {
      this.serverFileHashes = new Map(Object.entries(data.serverFileHashes));
      console.log(`PoetSync: Loaded ${this.serverFileHashes.size} cached hashes`);
    }
    if (Array.isArray(data?.pendingPaths)) {
      this.pendingPaths = new Set(data.pendingPaths);
      if (this.pendingPaths.size > 0) {
        console.log(`PoetSync: Loaded ${this.pendingPaths.size} pending paths`);
      }
    }
    if (data?.lastSentHashes) {
      this.lastSentHashes = new Map(Object.entries(data.lastSentHashes));
    }
  }
  async saveSettings() {
    await this.saveData({
      ...this.settings,
      serverFileHashes: Object.fromEntries(this.serverFileHashes),
      pendingPaths: [...this.pendingPaths],
      lastSentHashes: Object.fromEntries(this.lastSentHashes)
    });
  }
};
var PoetSyncSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "PoetSync \u8A2D\u5B9A" });
    new import_obsidian.Setting(containerEl).setName("\u30B5\u30FC\u30D0\u30FCURL").setDesc("PoetSync\u30B5\u30FC\u30D0\u30FC\u306EWebSocket URL").addText((text) => text.setPlaceholder("ws://localhost:27124").setValue(this.plugin.settings.serverUrl).onChange(async (value) => {
      this.plugin.settings.serverUrl = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u8A8D\u8A3C\u30C8\u30FC\u30AF\u30F3").setDesc("\u30B5\u30FC\u30D0\u30FC\u5074\u3067 POETSYNC_TOKEN \u3092\u8A2D\u5B9A\u3057\u305F\u5834\u5408\u306E\u307F\u5165\u529B\uFF08\u7A7A\u6B04\u306A\u3089\u8A8D\u8A3C\u306A\u3057\uFF09").addText((text) => text.setPlaceholder("\uFF08\u672A\u8A2D\u5B9A\uFF09").setValue(this.plugin.settings.authToken).onChange(async (value) => {
      this.plugin.settings.authToken = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u540C\u671F\u3092\u6709\u52B9\u5316").setDesc("\u30B5\u30FC\u30D0\u30FC\u3078\u306E\u63A5\u7D9A\u3092\u6709\u52B9\u306B\u3059\u308B").addToggle((toggle) => toggle.setValue(this.plugin.settings.enabled).onChange(async (value) => {
      this.plugin.settings.enabled = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u9001\u4FE1\u3092\u6709\u52B9\u5316").setDesc("\u3053\u306E\u30C7\u30D0\u30A4\u30B9\u306E\u5909\u66F4\u3092\u30B5\u30FC\u30D0\u30FC\u306B\u9001\u4FE1\u3059\u308B\uFF08Ubuntu\u306F\u30AA\u30D5\u3067OK\uFF09").addToggle((toggle) => toggle.setValue(this.plugin.settings.sendEnabled).onChange(async (value) => {
      this.plugin.settings.sendEnabled = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u518D\u63A5\u7D9A").setDesc("WebSocket\u63A5\u7D9A\u3092\u5207\u308A\u76F4\u3057\u3066\u518D\u63A5\u7D9A\u3059\u308B\uFF08\u540C\u671F\u304C\u6B62\u307E\u3063\u305F\u3068\u304D\u306B\u4F7F\u3046\uFF09").addButton((button) => button.setButtonText("\u518D\u63A5\u7D9A").setCta().onClick(() => {
      this.plugin.forceReconnect();
    }));
    new import_obsidian.Setting(containerEl).setName("\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u30AF\u30EA\u30A2").setDesc("\u30CF\u30C3\u30B7\u30E5\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u30EA\u30BB\u30C3\u30C8\u3057\u3066\u5168\u30D5\u30A1\u30A4\u30EB\u3092\u518D\u540C\u671F\u3059\u308B").addButton((button) => button.setButtonText("\u30AF\u30EA\u30A2").onClick(async () => {
      this.plugin.serverFileHashes.clear();
      await this.plugin.saveSettings();
      if (this.plugin.ws) this.plugin.ws.close();
      new import_obsidian.Notice("PoetSync: \u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u30AF\u30EA\u30A2\u3057\u307E\u3057\u305F\u30025\u79D2\u5F8C\u306B\u518D\u63A5\u7D9A\u3057\u3066\u5168\u30D5\u30A1\u30A4\u30EB\u3092\u518D\u540C\u671F\u3057\u307E\u3059\u3002");
    }));
  }
};
