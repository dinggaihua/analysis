/*
* @Author: liucong
* @Date:   2016-03-31 11:19:09
* @Last Modified by:   HellMagic
* @Last Modified time: 2016-07-01 08:44:01
*/

'use strict';

var express = require('express');
var path = require("path");
var fs = require("fs");
var onFinished = require('on-finished');
var unless = require('express-unless');
var url = require('url');
var engines = require('consolidate');
var when = require('when');
var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
var expressValidator = require('express-validator');

var config = require("./env");
var rootPath = path.join(__dirname, '..', '..', 'index.html');

var NotFoundError = require('../errors/NotFoundError');

var http_port = process.env.HTTP_PORT || config.port;

var debug = require('debug')('app:' + process.pid);

var compiled_app_module_path = path.resolve(__dirname, '../../', 'public', 'assets', 'server.js');
var App = require(compiled_app_module_path); // var App = require(compiled_app_module_path).default;

var peterHFS = require('peter').getManager('hfs');
var peterFX = require('peter').getManager('fx');

var mongodb = require('mongodb');
var ObjectId = mongodb.ObjectId;

var auth = require('../middlewares/auth');

// var User = require('../models/user');

//Init Peter
    // var peter = require('../lib/peter');
    // peter.bindDb(config.db, function(error) {
    //     if(error) {
    //         debug("Peter connection error");
    //         process.exit(1);
    //     } else {
    //         debug("Peter connected to the database");
    //     }
    // });

module.exports = function(app) {
    var hsfPromise = bindHFS();
    var fxPromise = bindFX();
    when.all([hsfPromise, fxPromise]).then(function(msgArr) {
        console.log('msgArr :  ', msgArr);
        try {
            initWebServer(app);
        } catch(e) {
            console.log('Init WebServer Error: ', e);
            process.exit(1);
        }
    }).catch(function(err) {
        console.log('Bind DB Error: ', err);
        process.exit(1);
    });
}

function bindHFS() {
console.log('hfs mongo:   ',  config.hfsdb);

    return when.promise(function(resolve, reject) {
        peterHFS.bindDb(config.hfsdb, function(error) {
            if(error) {
                console.log('bind Error : ', error);
                return reject(error);
            }
            resolve('success bind HFS');
        });
    });
}

function bindFX() {
console.log('fx mongo:   ',  config.fxdb);

    return when.promise(function(resolve, reject) {
        peterFX.bindDb(config.fxdb, function(error) {
            if(error) {
                console.log('bind again error: ', error);
                return reject(error);
            }
            resolve('success bind FX');
        });
    });
}

function initWebServer(app) {
    app.use(require('morgan')("dev"));

    //为了对login的时候使用cookie来存储token
    app.use(cookieParser());

    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    app.use(expressValidator());

    app.use(express.static(path.join(__dirname, '../..', 'public')));

    app.engine('html', engines.swig);
    app.engine('jade', engines.jade);
    app.set('view engine', 'html');
    app.set('views', path.join(__dirname, '../..', 'server/views'));

    app.use(require('compression')());
    app.use(require('response-time')());

    app.use(function (req, res, next) {

        onFinished(res, function (err) {
            debug("[%s] finished request", req.connection.remoteAddress);
        });

        next();

    });

    //把unless的path都提到上面来

    //app.use(auth.verify)

    //下面的都是要受到保护的路由

    app.use(require('../routes/unless'));
    app.use(auth.verify);
    // Bootstrap routes（会添加各个版本不同的路由）
    require('../routes/v1')(app);
    // ...其他版本的路由

    app.all("*", function (req, res, next) {
        App(req, res);
    });

    // error handler for all the applications
    app.use(function (err, req, res, next) {
        var code = err.status || 500;
        switch (err.name) {
            case "HttpStatusError":
                if(code == 401 && err.message && (err.message.errorCode == 1 || err.message.errorCode == 2)) {
                    console.log('成功返回错误信息');
                    return res.status(200).json(err.message);
                }
                if(code == 400) {
                    console.log('重定向');
                    return res.redirect('/login');
                }
                if(code == 401 && err.message && err.message.errorCode == 3) {
                    console.log('重定向');
                    return res.redirect('/login');
                }
                break;
            default:
                break;
        }

        if(code === 500) {
            //For Debugg
            console.log('服务端Error', err);
        }

        return res.status(code).json(err);
    });

    debug("Creating HTTP server on port: %s", http_port);
    require('http').createServer(app).listen(http_port, function () {
        debug("HTTP Server listening on port: %s, in %s mode", http_port, app.get('env'));
    });
}
