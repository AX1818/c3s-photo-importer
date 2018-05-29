'use strict';

const  resize = require('./transformer').resize;

const fs = require('fs');

const ws = fs.createWriteStream('./beauty3.jpg')

const rs = fs.createReadStream(__dirname + '/beauty.jpg');
resize(rs, 100).then(ops => ops.pipe(ws));