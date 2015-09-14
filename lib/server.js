/**
 * @since 150524 20:41
 * @author vivaxy
 */
var fs = require('fs'),
    url = require('url'),
    http = require('http'),
    path = require('path'),
    util = require('util'),
    childProcess = require('child_process'),

    ip = require('./ip'),
    mime = require('./mime'),
    html = require('./html'),
    color = require('./color'),
	isUtf8 = require('./is-utf8'),
    ssiChunk = require('./xssi').ssiChunk,
    chunkParser = require('./chunk').parse,
	iconv = require('iconv-lite'),
	utils = require('./utils'),

    log = util.log,
    join = path.join,
    exec = childProcess.exec,

    hostname = ip.ipv4,

    /**
     * create a server
     * @param options
     * @constructor
     */
    Server = function (options) {

        this.port = options.port;
        this.watch = options.watch;
        this.silent = options.silent;
        this.verbose = options.verbose;
        this.directory = options.directory;
        this.watcherPort = options.watcherPort;

        this.init();
        this.listen();

    }, p = {};
Server.prototype = p;
p.constructor = Server;
module.exports = Server;

/* LESS动态编译 */
function lessCompiler(xcssfile) {
  var less = require("./engines/less");
  return less.compile.call(this, xcssfile);
}

/* SASS动态编译 */
function sassCompiler(xcssfile) {
  var sass = require("./engines/sass");
  return sass.compile.call(this, xcssfile);
}

/*是css文件*/
function isCss(filename){
	return /\.css$/i.test(filename);
}

/*如果对应的less文件存在*/
function isLessExits(cssfile){
	return utils.isFile(getLessFile(cssfile));
}

/*如果对应的scss文件存在*/
function isScssExits(cssfile){
	return utils.isFile(getScssFile(cssfile));
}

/*得到css对应的less文件*/
function getLessFile(cssfile){
	return cssfile.replace(/\.css$/i,'.less');
}

/*得到css对应的scss文件*/
function getScssFile(cssfile){
	return cssfile.replace(/\.css$/i,'.scss');
}

/**
 * create server instance
 */
p.init = function () {
    var _this = this;
    this.server = http.createServer(function (req, res) {

        var reqUrl = decodeURIComponent(req.url),

            pathname = url.parse(reqUrl).pathname,
            responseFile = join(process.cwd(), _this.directory, pathname),

            extension = path.extname(responseFile),
            contentType = mime[extension] || 'text/plain';

        _this.verbose && log('[server] ' + color(req.method, 'green') + ' ' + reqUrl);



        fs.readFile(responseFile, function (err, data) {
            if (err) {
                // if requested file is a folder, returns files link
                if (err.code === 'EISDIR') {
                    // request a folder
                    // read files
                    fs.readdir(responseFile, function (e, files) {
                        if (e) {
                            // error occurs
                            res.writeHead(404);
                            res.end(JSON.stringify(err));
                        } else {
							// respond links
							res.writeHead(200);
							var resp = html(files, hostname, _this.port, pathname, _this.directory);
							if (!_this.watch) {
								res.end(resp);
							} else {
								res.end(resp.replace('</head>', '<script>new WebSocket(\'ws://127.0.0.1:' + _this.watcherPort + '\').onmessage = function (data) {if (data.data === \'reload\'){location.reload();}};</script></head>'));
							}
                        }
                    });
                } else if (isCss(responseFile)) { // 处理less
					var result = '';
					if(isLessExits(responseFile)){
						result = lessCompiler(getLessFile(responseFile));
					} else if (isScssExits(responseFile)) {
						result = sassCompiler(getScssFile(responseFile));
					}
					var encoding = isUtf8(result) ? 'utf8' : 'gbk';
					if (encoding == 'gbk') {
						result = iconv.encode(iconv.decode(result, 'gbk'), 'utf8');
					}
                    res.writeHead(200,{
						'Content-Type': contentType + '; charset=utf-8'
					});
					res.end(result);
				} else { // 处理 scss
                    // other errors
                    res.writeHead(404);
                    res.end(JSON.stringify(err));
                }
            } else {
                // request a file
                if (_this.watch && contentType === 'text/html') {
					res.writeHead(200, {
						'Content-Type': contentType + '; charset=utf-8'
					});
                    data = parseChunkData(data,responseFile).toString('utf-8');
                    res.end(data.replace('</head>', '<script>new WebSocket(\'ws://127.0.0.1:' + _this.watcherPort + '\').onmessage = function (data) {if (data.data === \'reload\'){location.reload();}};</script></head>'));
                } else if (/(html|shtml|php|xhtml|htm)$/i.test(contentType)) {
					// added by jayli
					var chunk = parseChunkData(data,responseFile);
					doResponse(res, chunk, contentType);
                    // res.end(parseChunkData(data,responseFile));
                } else {
					res.writeHead(200, {
						'Content-Type': contentType + '; charset=utf-8'
					});
					res.end(data.toString('utf-8'))
				}
            }
        });
    });
};

// data，二进制文件
function parseChunkData(data,filepath){
	var chunk = data;
	var encoding = isUtf8(chunk) ? 'utf8' : 'gbk';
	if (encoding == 'gbk') {
		chunk = iconv.encode(iconv.decode(chunk, 'gbk'), 'utf8');
	}
	return ssiChunk(filepath, chunk.toString('utf8'));
}

// chunk 一定是二进制的
function doResponse(res, chunk, contentType) {
    chunkParser(chunk, function (chunk) {
        chunk = teardownChunk(chunk, 'utf-8');
		res.writeHead(200, {
			'Content-Type': contentType + '; charset=utf-8',
			'content-Length' : chunk.length
		});
        res.write(chunk);
        res.end();
    });
}

// 传入的chunk一定是utf8的
function teardownChunk(chunk, encoding) {
    if (!(chunk instanceof Buffer)) {
        chunk = new Buffer(chunk);
    }
    if (encoding == 'gbk') {
        chunk = iconv.encode(iconv.decode(chunk, 'utf8'), 'gbk');
    }
    return chunk;
}

/**
 * start it
 */
p.listen = function () {
    var _this = this;
    this.server.on('error', function (err) {
        if (err.code === 'EADDRINUSE') {
            // red
            log(color('server port ' + _this.port + ' in use', 'red'));
            _this.port = parseInt(_this.port) + 1;
            _this.server.listen(_this.port);
            //process.exit(1);
        }
    });
    this.server.listen(this.port, function () {
        var openUrl = 'http://' + hostname + ':' + _this.port + '/';
        // green
        log(color('LISTEN ', 'green') + openUrl);
        var execCommand = process.platform === "darwin" ?
            'open' : process.platform === "win32" ?
            'start' : 'xdg-open';
        _this.silent || exec(execCommand + ' ' + openUrl);
    });
};
