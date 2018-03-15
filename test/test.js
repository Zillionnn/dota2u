function testCallback(callback) {
    console.log('come in!');
    callback();
}

/**
 * 被回调的函数
 */
function a() {
    console.log('a');
}

/**
 * 开始测试方法
 */
function start() {
    testCallback(a);
}
start()