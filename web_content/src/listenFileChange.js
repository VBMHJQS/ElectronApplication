var fs = require('fs');
var iconv = require('iconv-lite'); // 读取gb2312或gbk编码的文件
var readline = require('readline');
var http = require('http');
var querystring = require('querystring');
var path = require('path');
var dateFormat = require('dateformat');

var currPath = path.resolve(__dirname, '..'); //通过path模块和__dirname来获取web_content目录
var formulaPath = currPath + '\\data\\formula.txt';
var postedFile = currPath + '\\data\\posted.txt'; //发送后的日志保存在此文件
var postHost = 'test.5iquant.com'; // 主机
var postPort = 80; // 端口号
var logsArr = new Array();
var listenArr = new Array();


var recordsArray = new Array();
/**
 * 监听文件初始化
 * @param  {string} logFolder 监听的目标文件所在的目录
 * @return {[type]}           [description]
 */
exports.sendAllHistoryLogs = function(logFolder) {
    // var currDate = dateFormat(new Date(), "yyyymmdd"); // 20160711
    // var currFilename = logFolder + path.sep + currDate.toString() + '.log';

    //fillFormulaLog(formulaPath, currFilename);
    var logslists = new Array();
    fs.readdirSync(logFolder).forEach(function(item, index) {
        var temFile = logFolder + path.sep + item;
        var stat = fs.lstatSync(temFile);
        if (!stat.isDirectory()) {
            logslists.push(temFile);
        }
    });
    recordsArray.length = 0; // 清空数组 必须
    var dataType = 'history';
    sendAllLogRecord(logslists, formulaPath, 0, dataType);
}

function filterLogs(recordsArray, formulaPath, dataType) {
    fs.readFile(formulaPath, {
        enconding: 'utf-8'
    }, function(err, data) {

        if (err) console.log(err);
        var tempArray = data.toString().split('\n');
        for (var i in tempArray) {
            if (tempArray[i] == '' || tempArray[i] == 'undefined') {
                tempArray.splice(i, 1);
                i = i - 1;
            }
        }
        var postedArray = new Array();
        fs.readFile(postedFile, {
            enconding: 'utf-8'
        }, function(err, data) {
            if (err) {
                postedArray.length = 0;
                console.log(err)
            } else {

                postedArray = data.toString().split('\r\n'); // 注意以\r\n分组
                for (var i in postedArray) {
                    if (postedArray[i] == '' || postedArray[i] == 'undefined') {
                        postedArray.splice(i, 1);
                        i = i - 1;
                    }
                }

            };
            if (postedArray.length > 0) {
                var norepateArray = removeRepeat(recordsArray, postedArray);
                generateArraySend(norepateArray, tempArray, true, dataType);
            } else {
                generateArraySend(recordsArray, tempArray, true, dataType);
            }

        });
    });
}

function sendAllLogRecord(logsPath, formulaPath, index, dataType) {
    if (index >= logsPath.length) {
        for (var i in recordsArray) {
            recordsArray[i] = recordsArray[i].replace(/[\r\n]/g, "");
        }
        // 去空
        var re = [];
        var trim = function(s) {
            return s.replace(/\s+/g, '');
        }
        for (var i = 0, len = recordsArray.length; i < len; i++) {
            if (trim(recordsArray[i]).length > 0) re[re.length] = recordsArray[i];
        }
        // 去空结束
        filterLogs(re, formulaPath, dataType);
        return;

    } else if (index == 0) {
        console.log('同步日志');
    }
    var temFile = logsPath[index];
    fs.readFile(temFile, function(err, data) {
        var temp = iconv.decode(data, 'gb2312');
        //console.log(temp);
        var logsArr = temp.split('\r');
        recordsArray = recordsArray.concat(logsArr);
        sendAllLogRecord(logsPath, formulaPath, index + 1, dataType);
    });
}


/**
 * 将策略关系和日志抽出来
 * @param  {string} formulaPath 关系路径
 * @param  {string} filename    日志路径
 * @return {[type]}             [description]
 */
function fillFormulaLog(formulaPath, filename) {
    console.log('处理 ' + filename + ' 当前时间为: ' + dateFormat(new Date(), "yyyy-mm-dd h:MM:ss"));
    fs.readFile(formulaPath, {
        enconding: 'utf-8'
    }, function(err, data) {

        if (err) console.log(err);
        var tempArray = data.toString().split('\n');
        for (var i in tempArray) {
            if (tempArray[i] == '' || tempArray[i] == 'undefined') {
                tempArray.splice(i, 1);
                i = i - 1;
            }
        }
        sendSigleHistory(filename, tempArray);
    });
}


/**
 * 发送历史信号
 * @param  {string}  filename     [监听的目标文件]
 * @param  {array}  formulaArray [策略关系数组]
 */
function sendSigleHistory(filename, formulaArray) {
    console.log('发送历史信号...');

    fs.readFile(filename, function(err, data) {
        if (err) {
            console.log(err);
        } else {
            var temp = iconv.decode(data, 'gb2312');
            var logsArr = temp.split('\r\r\n');
            //logsArr.shift();
            for (var i in logsArr) {
                if (logsArr[i] == '' || logsArr[i] == 'undefined') {
                    logsArr.splice(i, 1);
                    i = i - 1;
                }
            }
            var postedArray = new Array();
            fs.readFile(postedFile, {
                enconding: 'utf-8'
            }, function(err, data) {
                if (err) {
                    postedArray.length = 0;
                    console.log(err)
                } else {

                    postedArray = data.toString().split('\r\n'); // 注意以\r\n分组
                    for (var i in postedArray) {
                        if (postedArray[i] == '' || postedArray[i] == 'undefined') {
                            postedArray.splice(i, 1);
                            i = i - 1;
                        }
                    }
                };
                // posted 文件里有已发送的日志，只需要将TB log里去除发送过的即可
                //console.log(logsArr);
                //console.log(postedArray);
                if (postedArray.length > 0) {
                    //去除已发送的日志记录
                    for (var m in logsArr) {
                        for (var n in postedArray) {
                            if (logsArr[m] == postedArray[n]) {
                                logsArr.splice(m, 1);
                            }
                        }
                    }

                }
                //console.log(logsArr);
                generateArraySend(logsArr, formulaArray, true, dataType); //将历史的数组发送出去
            });

        }
    });
}

/**
 * 解析文件并匹配关系最后发送
 * @param  {array} allArray     历史数据或最新添加
 * @param  {array} formulaArray 关系数组
 * @param  {boolean} flag         是否递归执行的标志：为解决异步，使用递归，同步
 * @param  {string} filename    监听的文件
 */
function generateArraySend(allArray, formulaArray, flag, dataType) {
    var regExp = /(\[.+?\])/g; //(\\[.+?\\])
    var postArray = new Array();
    var tempArray = allArray.slice(0); // 使用slice来复制数组,不能直接用‘=’，相当于指针
    var savePostedArray = new Array();
    console.log(allArray);
    for (var n in allArray) {
        //console.log(allArray[n]);
        var res = allArray[n].match(regExp);
        //console.log(res);
        for (var o in res) {
            res[o] = res[o].replace('[', '').replace(']', ''); //发送历史日志
            //console.log(res[o]);
        }
        //console.log(allArray[n].substring(0, 23));
        res.push(allArray[n].substring(0, 23)); // 截取日期push进数组最后
        allArray[n] = res;
    }
    //console.log(tempArray);
    var pi = 0;
    var symReg = /[a-zA-Z]+/;
    for (var m in formulaArray) {
        var tempJson = JSON.parse(formulaArray[m]);
        for (var n in allArray) {
            //console.log(allArray[n][5] + '>>>>' + tempJson.formula);
            var currSymbolId = allArray[n][1].match(symReg)[0];
            if (tempJson.formula == allArray[n][5] && tempJson.symbolId == currSymbolId) {

                savePostedArray.push(tempArray[n])
                var actoinTemp;
                if (allArray[n][2] == '卖平') {
                    actoinTemp = 8;
                } else if (allArray[n][2] == '买平') {
                    actoinTemp = 2;
                } else if (allArray[n][2] == '买开') {
                    actoinTemp = 4;
                } else if (allArray[n][2] == '卖开') {
                    actoinTemp = 1;
                }
                var tempQuant = tempJson.quant > 0 ? tempJson.quant : allArray[n][3];
                //console.log(str.match(symReg)[0]);
                var postJson = {
                    owner_id: allArray[n][0],
                    symbol_id: currSymbolId,
                    contract: allArray[n][1],
                    action: actoinTemp,
                    quant: tempQuant,
                    order_price: allArray[n][4],
                    order_time: allArray[n][6].replace('/', '-').replace('/', '-'),
                    strategy_id: tempJson.stradegyId,
                    order_type: 1, //默认为市价单
                    data_type: dataType, //历史数据，不计算
                    isChangeMonth: tempJson.isChangeMonth // 是否移仓换月
                };
                postArray.push(postJson);
            }
        }
    }
    postFun(0, postArray, savePostedArray, flag); //发送请求
}

/**
 * 实时监控文件
 */
exports.startListenLogs = function(logFolder) {
    console.log('日志监听中...');
    var currDate = dateFormat(new Date(), "yyyymmdd"); // 20160711
    var currFilPath = logFolder + path.sep + currDate.toString() + '.log';
    fs.watch(logFolder, function(event, newFileName) {
        var filename;
        // rename 标识创建新文件
        if (event == 'rename') {
            fs.readdirSync(logFolder).forEach(function(filename) {
                temp = logFolder + path.sep + filename;
                fs.unwatchFile(temp); // 遍历所有文件，取消监听事件
            });
            listenLogs(logFolder + path.sep + newFileName);
        }
        //console.log(logFolder + path.sep + currDate.toString());
    });
    listenLogs(currFilPath);
}

function listenLogs(filepath) {
    console.log('开始监听文件: ' + filepath + ' 当前时间:' + dateFormat(new Date(), "yyyy-mm-dd h:MM:ss"));
    fs.open(filepath, 'a+', function(error, fd) {
        var buffer;
        var remainder = null;
        fs.watchFile(filepath, {
            persistent: true,
            interval: 1000
        }, function(curr, prev) {
            if (curr.mtime > prev.mtime) {
                //文件内容有变化，那么通知相应的进程可以执行相关操作。例如读物文件写入数据库等
                buffer = new Buffer(curr.size - prev.size + 2);
                fs.read(fd, buffer, 0, (curr.size - prev.size + 2), prev.size, function(err, bytesRead, buffer) {
                    //console.log();
                    var newAddStr = iconv.decode(buffer, 'gb2312');
                    console.log('文件写入:' + newAddStr);
                    generateTxt(newAddStr);
                });
            } else {
                console.log('文件读取错误');
            }
        });

        function generateTxt(str) { // 处理新增内容的地方
            var temp = str.split('\r\r\n');
            temp.pop();
            //console.log(temp);
            fs.readFile(formulaPath, {
                enconding: 'utf-8'
            }, function(err, data) {
                if (err) console.log(err);
                var tempArray = data.toString().split('\n');
                for (var i in tempArray) {
                    if (tempArray[i] == '' || tempArray[i] == 'undefined') {
                        tempArray.splice(i, 1);
                        i = i - 1;
                    }
                }
                //console.log(tempArray);
                var dataType = 'realtime';
                generateArraySend(temp, tempArray, false, dataType);
            });

        }
    });
}

/**
 * 使用POST发送请求
 * @param  {int} index      起始标记
 * @param  {Array} jsonArray  json对象数组
 * @param  {Array} array    原始数组，用来保存已发送的内容
 * @param  {boolean} listenFlag 是否是监听调用了此方法
 * @param  {string} filename 监听的文件
 */
function postFun(index, jsonArray, array, listenFlag, filename) { //listenFlag是否继续监听，当在监听的时候调用次方法时，为false
    //console.log(jsonArray);
    if (index >= jsonArray.length) {
        // if (listenFlag) {
        //     listenLogs(filename); // 批量的请求发送完，开始监听日志
        // }
        return;
    } else if (index == 0) {

    }
    var currParam = jsonArray[index];
    var post_data = querystring.stringify(currParam);
    console.log('发送Param: ' + post_data);
    var options = {
        host: postHost,
        port: postPort,
        path: '/sig/signal/saveSignal',
        method: 'POST',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:47.0) Gecko/20100101 Firefox/47.0',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', // 不写这个参数，后台会接收不到数据
            'Content-Length': post_data.length
        }
    };
    //console.log(post_data);
    var req = http.request(options, function(res) {
        res.setEncoding('utf-8');
        res.on('data', function(body) {
            //console.log('BODY：' + body);
            console.log(res.statusCode);
            if (res.statusCode = 200) {
                //console.log('200');
                // 注意换行符，处理已发送记录的时候根据‘\r\n’区分
                fs.appendFile(postedFile, array[index] + '\r\n', {
                    enconding: 'utf-8'
                }, function(err) {

                    if (err) console.log(err);

                    postFun(index + 1, jsonArray, array, listenFlag, filename);
                });
            } else {
                console.log('状态码： ' + res.statusCode);
                postFun(index + 1, jsonArray, array, listenFlag, filename);
            }
        });
        res.on('end', function() {});
    });
    req.on('error', function(err) {
        console.log('ERROR');
        if (err) {
            console.error(err);
            postFun(index + 1, jsonArray, array, listenFlag, filename); // 当发生异常，不终止，继续解析下一条
        }
    });
    //	post方法里
    req.write(post_data, 'utf-8');
    req.end();
}


/**
 * 比较两个数组，去掉重复
 * @param  {array} array1 数组一
 * @param  {array} array2 数组二
 * @return {array}        一个去掉两个数组重复部分的数组
 */
function removeRepeat(arr1, arr2) {
    var temp = []; //临时数组1
    var temparray = []; //临时数组2
    for (var i = 0; i < arr2.length; i++) {
        temp[arr2[i]] = true; //巧妙地方：把数组B的值当成临时数组1的键并赋值为真
    };
    for (var i = 0; i < arr1.length; i++) {
        if (!temp[arr1[i]]) {
            temparray.push(arr1[i]); //巧妙地方：同时把数组A的值当成临时数组1的键并判断是否为真，如果不为真说明没重复，就合并到一个新数组里，这样就可以得到一个全新并无重复的数组
        };
    };
    return temparray;
}
