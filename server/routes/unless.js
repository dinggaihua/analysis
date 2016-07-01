/*
* @Author: HellMagic
* @Date:   2016-05-05 11:51:30
* @Last Modified by:   HellMagic
* @Last Modified time: 2016-07-01 08:44:41
*/

'use strict';

var router = require('express').Router();
var auth = require('auth');
var _ = require('lodash');

router.get('/login', function(req, res, next) {
    res.render('login');
});

router.post('/login', auth.authenticate, function(req, res, next) {
    var options = (_.includes(req.hostname, 'yunxiao')) ? { domain: '.yunxiao.com'} : {};
    res.cookie('authorization', req.user.token, options);//写入cookie会受cookie时效性影响，所以最好还是返回后写入localStorage--但可能要考虑到降级，或者将此cookie时效性放大，但是对于登出的处理只在客户端
    //删除--但是在服务端就不再有任何验证了。。。
    res.status(200).json(req.user);
});

module.exports = router;
