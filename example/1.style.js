// \x1b[34m 表示在终端输出蓝色的文字, 34 表示蓝色, 其他颜色需要查表
// \x1b[0m 表示重置终端颜色
// https://en.wikipedia.org/wiki/ANSI_escape_code#Colors

// 没重置, hello 和 world 都是蓝色
console.log('\x1b[34;41mhello')
console.log('world')

// 显示完 hello 之后, 重置终端颜色, 所以 world 是默认颜色
console.log('\x1b[34;41mhello\x1b[0m')
console.log('world')