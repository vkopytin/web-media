var express = require('express');
const next = require('next');
var expressServer = express();
var app = next();

expressServer.get('/', function (req, res) {
    res.send('Express is working on IISNode!');
});

expressServer.listen(process.env.PORT || 8080);
