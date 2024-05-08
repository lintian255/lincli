## 从零开始实现 Node 命令行程序（零依赖）

注：如果没有特别说明，本文所有命令都是默认在 Mac 下输入

为什么要从零开始写 node cli 而不是使用各种现成的 node 依赖模块？

主要有两个原因

1，使用 node 标准库函数来完成功能，更有助于对原理的掌握，而且原理是通用的，可以迁移到其他语言

2，在实现过程中，会发现很多地方写起来很繁琐，需要抽象与封装，带着这样的问题再去思考模块的 api 设计，更有助于加深理解

### 程序运行
当在命令行（很多时候命令行、终端是同一个意思）输入 `npm` 命令之后，会得到类似下面的输出结果
```bash
npm <command>

Usage:

npm install        install all the dependencies in your project
npm install <foo>  add the <foo> dependency to your project
...
```

但是输入 `linnpm` 的时候，则是提示
```bash
zsh: command not found: linnpm
```
为什么会有这样的差异？这就得从程序运行的路径来说明

当输入一个绝对路径的程序（比如 `/usr/local/bin/npm`）或者相对路径的程序（比如 `./node_modules/.bin/eslint`），系统会根据路径找到这个程序并运行

而输入类似 `npm` 这种不带路径的程序，系统会去环境变量的 `path` 里面找。如果 `path` 里面包含了 `npm` 程序，就运行，如果没有包含，就会提示 `xxx not found`。可以使用 `echo $path` 命令来得到 `path` 的值，`echo` 相当于 log 函数，打印后面 `path` 的值
```bash
... /usr/local/bin /usr/bin /bin ...
```

`path` 通常很长，这里我省略了大部分，只保留了三个 `/usr/local/bin`、`/usr/bin`、`/bin`
假设 `path` 只有这三个值，输入 `npm` 的时候，会依次在下面的路径里查找
```bash
/usr/local/bin/npm
/usr/bin/npm
/bin/npm
```
找到 `/usr/local/bin/npm` 后就会运行


### node 命令行程序

清楚程序运行时的查找流程后，接下来看看如何实现这样的程序

node 命令行程序实际上做了很大程度的简化，让我们可以专注写逻辑，而不需要关心 linux 底层运行程序的逻辑，每一个 node 命令行程序，都是一个 node package，所以需要先创建 node package

假设 package 的名称是 `lincli`，在 package 根目录（假设这个目录是 `/Users/lin/lincli`）的 `package.json` 里面指定 name、version、bin。这三个字段是必须的，name 和 version 很好理解，不多做解释，bin 是一个字典，key 表示在命令行输入的命令，value 表示输入命令的时候，实际运行的程序

也就是说在命令行输入 `linnpm` 的时候，实际上执行的是 `./index.js` 程序，type 不是必须的，这里这么写是为了可以在程序里直接用 ES module，如果不指定 type: module，就只能用 CommonJS module
``` json
{
    "name": "lincli",
    "version": "0.0.1",
    "bin": {
        "linnpm": "./index.js"
    },
    "type": "module"
}
```

`./index.js` 的内容如下
``` javascript
#!/usr/bin/env node

console.log('lin cli')
```

注意，接下来的所有操作都需要保证切到 `lincli` 根目录（也就是 `/Users/lin/lincli`）下面

创建完 `index.js` 之后，只能通过 `node index.js` 的方式运行

假设用 `./index.js` 方式来运行，会提示 `permission denied: ./index.js`

原因是 `index.js` 没有可执行权限

输入 `ls -l | grep index.js`（把当前目录下 `index.js` 的详细格式列出来）可以得到如下结果
```bash
-rw-r--r--   1 lin  staff   73 Apr 26 11:49 index.js
```
`-rw-r--r--` 实际上由下面四组结果组成

```bash
-
rw-
r--
r--
```

`-` 表示这是个常规文件

`r` 表示有可读权限

`w` 表示有可写权限

`x` 表示有可执行权限

如果没有权限则用 `-` 表示，三组分别表示 owner 权限、group 权限和 other 权限

`-rw-r--r--` 连起来的意思是 `index.js` 是常规文件，当前用户 `lin` 具有可读可写权限，不具备可执行权限，用户组 `staff` 和其他用户都只有可读权限

可以手动给 `index.js` 加上可执行权限，但是这样比较麻烦，而且容易出错，接下来就用 `npm` 来做这个事情


### 当成模块处理
输入 `npm install -g .` 就可以把 `lincli` 安装成模块，这个命令是把当前目录 `lincli` 安装成 node 全局模块，安装完后就可以在命令行输入 `linnpm`，并且得到输出结果。按照前面说的，`linnpm` 能输入成功，说明具备两个条件

1，具备可执行权限

2，在 `path` 里面找到了相关目录

用 `which linnpm` 可以输出 `linnpm` 所在的目录，我电脑上的输出结果是
```bash
/usr/local/bin/linnpm
```

根据这个结果，用 `ls -l /usr/local/bin | grep linnpm` 看看详细的文件信息
```bash
lrwxr-xr-x  1 lin  admin       35 Apr 26 11:53 linnpm -> ../lib/node_modules/lincli/index.js
```
这次可以发现第一列出现了 `l` 而不是 `-`，`l` 表示这是一个 symboliclink（`npm link` 的 `link` 就是这个意思），相当于这是一个 windows 下面的快捷方式
```bash
linnpm -> ../lib/node_modules/lincli/index.js
```
表示 `linnpm` 实际上用的是 `../lib/node_modules/lincli/index.js` 文件，转成绝对路径就是 `/usr/local/lib/node_modules/lincli/index.js`

进一步看看 `ls -l /usr/local/lib/node_modules/lincli`，输出如下
```bash
lrwxr-xr-x  1 lin  wheel  42 Apr 26 11:53 /usr/local/lib/node_modules/lincli -> ../../../../Users/lin/lincli
```
可见 `/usr/local/lib/node_modules/lincli` 也是一个 symboliclink，输出结果给的是相对路径，转成绝对路径后是 `/Users/lin/lincli`，其中 `/Users/lin` 表示 home 目录，通常会写成 `~`，所以上面的绝对路径也可以写成 `~/lincli`


同时再看看 `index.js` 的文件属性
```bash
-rwxr-xr-x   1 lin  staff   73 Apr 26 11:49 index.js
```

会发现 `index.js` 多了 `x` 权限，也就是可执行权限，这一步是 `npm` 处理（内部调用操作系统提供的程序 `chmod`）的，所以在命令行输入 `linnpm`，会按照如下流程来处理

1，找到 `/usr/local/bin/linnpm` 目录

2，发现是个快捷方式，继续找到对应的目录 `/usr/local/lib/node_modules/lincli`

3，再次发现是个快捷方式，继续找到对应的目录 `~/lincli`

4，最后找到真实目录下的 `index.js`，也就是 `~/lincli/index.js`，然后执行

5，因为 `index.js` 此时有 `x` 权限，所以可以执行成功


因为弄成了快捷方式，所以在 index.js 里面写完代码，直接保存就能运行，调试很方便，接下来开始写正式的模块逻辑


### 命令行参数
现在的命令行程序可以运行，但是不够灵活。如果把这个程序看成一个函数，那么可以用参数增加函数的灵活性，对于命令行程序来说，参数可以通过 `process.argv` 获取，在 `index.js` 添加相关代码
```javascript
#!/usr/bin/env node
import { argv } from 'node:process'

console.log('lin cli', argv)
```

通过 `linnpm a=b` 的方式运行之后，得到的 log 结果如下
```bash
lin cli [
  '/usr/local/Cellar/node/21.7.2/bin/node',
  '/usr/local/bin/linnpm',
  'a=b'
]
```

第一个参数是 node 解释器的路径

第二个参数是 linnpm 程序的路径

从第三个位置开始，就是用户传入的参数

我们这里人为规定参数必须是 `key=value` 这样的格式，并且多参数之间用空格 ` ` 分割。虽然和传统的 `npm install xxx` 格式不一样，但是原理是相通的，`key=value` 这样的格式更方便解析，而且对参数的顺序没有要求。

运行 `linnpm a1=b1 a2=b2 a3=b3` 可以得到如下输出
```bash
lin cli [
  '/usr/local/Cellar/node/21.7.2/bin/node',
  '/usr/local/bin/linnpm',
  'a1=b1',
  'a2=b2',
  'a3=b3'
]
```

拿到这样的输出后，可以非常方便地把用户传入的参数转成对象（字典）的形式保存
```javascript
#!/usr/bin/env node
import { argv } from 'node:process'

let argsMapper = {}
for (let arg of argv.slice(2)) {
    let [k, v] = arg.split('=')
    argsMapper[k] = v
}

console.log(argsMapper)
```


### 命令行样式
命令行不像网页，基本上只有一个背景色，输入命令的时候，希望可以得到不同的颜色，这样可以对信息做一定程度的区分，命令行处理颜色的原理是 [ANSI escape](`https://en.wikipedia.org/wiki/ANSI_escape_code`)

文档可能有点不太好理解，直接用实例说明

`0x1B` 启动转义序列，后面跟上 `[` 表示启动 CSI 序列，在 CSI 序列里，30-37 设置前景色，40-47 设置背景色，比如 34 表示蓝色的前景色，41 表示红色的背景色

`34;41` 就表示文字蓝色 + 背景红色，再用 `Ox1B[` 开启转义，效果如下所示
``` javascript
// \x1b[34m 表示在终端输出蓝色的文字, 34 表示蓝色, 其他颜色需要查表
// \x1b[0m 表示重置终端颜色
// https://en.wikipedia.org/wiki/ANSI_escape_code#Colors

// 没重置, hello 和 world 都是蓝色
console.log('\x1b[34;41mhello')
console.log('world')

// 显示完 hello 之后, 重置终端颜色, 所以 world 是默认颜色
console.log('\x1b[34;41mhello\x1b[0m')
console.log('world')
```
除了可以设置颜色，还可以设置文字的样式，比如粗体、斜体、下划线等


### Loading
命令行操作有时候会比较耗时，比如安装模块操作，对于耗时的操作，通常希望增加一个 loading 效果，提升一定的交互性

在网页上实现这样的交互很简单，不管是 css 还是 js 都提供了对应的动画 api，但是命令行显然没有这样的 api，要实现这样的效果，只能自己模拟

动画的原理是指定特定帧数的内容，然后切换显示，这样人眼看起来就觉得在播放动画

第 1 秒显示 .

第 2 秒显示 ..

第 3 秒显示 ...

第 4 秒显示 ....

第 5 秒显示 .

...

这样循环显示，看起来就有一个 loading 效果，loading 内容的问题解决了，新问题是 `console.log` 函数会自带换行，这样会导致每次输出的 loading 内容跟着换行，这样的动画显然是不符合需求的

可以使用 [cursorTo](`https://nodejs.org/api/readline.html#readlinecursortostream-x-y-callback`) 或者 [moveCursor](`https://nodejs.org/api/readline.html#readlinemovecursorstream-dx-dy-callback`) 指定光标的位置，每次在同一个位置显示 loading 的内容，就可以弄成动画效果
```javascript
import readline from 'readline'
import process from 'process'

let spinners = [
    '.   ',
    '..  ',
    '... ',
    '....',
]

let index = 0

setInterval(function() {
    index = (index + 1) % spinners.length
    let line = spinners[index]
    console.log(line)
    readline.moveCursor(process.stdout, 0, -1)
}, 1000 / 10)
```


### 输入
接下来考虑一个问题，假设运行命令行程序后，需要让用户输入内容，这个时候就要求程序具备读取用户输入的能力，这需要同时使用 [process](`https://nodejs.org/api/process.html`) 和 [readline](`https://nodejs.org/api/readline.html`)

当使用 `console.log` 输出内容到终端时，实际上是把内容发给了标准输出，也就是 node 里的 `process.stdout`，往标准输出写内容，就会显示在终端
``` javascript
import process from 'node:process'

process.stdout.write('node stdout')
```

要获取用户的输入，则是从标准输入拿数据，需要使用 node 里的 `process.stdin`，通过监听 `data` 事件可以实现
``` javascript
import process from 'node:process'

process.stdin.on('data', function(data) {
    console.log('user input from stdin', data)
})
```

另一个方案是使用 `readline`，可以通过监听 `line` 事件来完成
``` javascript
import process from 'node:process'
import readline from 'node:readline'

const rl = readline.createInterface(process.stdin, process.stdout)

rl.on('line', function(line) {
    console.log('user input from readline', line)
})
```

除了处理用户的常规输入，有时候可能并不希望让用户输入内容，而是让用户直接选择内容，因为输入容易出现错误

命令行并没有提供任何选择的内容，需要模拟实现 HTML 里的 select + option 功能

原理是同时维护一个数组和一个下标，数组表示可以选择的 option，下标表示具体选择了哪一项

```javascript
import process from 'node:process'

let index = 0
let list = [
    'react',
    'vue',
    'angular',
]
let prompt = 'select framework'

process.stdout.write(prompt)
process.stdout.write('\n')

for (let i = 0; i < list.length; i += 1) {
    let s = list[i]
    if (i === index) {
        s = '\x1b[34m' + '> ' + s + '\x1b[0m'
    } else {
        s = '> ' + s
    }
    process.stdout.write(s + '\n')
}
```

最后可以得到下面这样的输出
```bash
select framework
> react
> vue
> angular
```

一开始输入提示的内容，`console.log` 输出的内容会自带换行，`process.stdout.write` 输出的内容没有换行，所以需要手动加上 `\n`

`index` 表示当前选中的是哪一项，默认选中第一项，这里就是给第一项加上蓝色表示 `active`

显示列表之后，需要绑定键盘事件，然后用上下方向键调整选择的项目

键盘事件和输入稍有不同，会更麻烦点

```javascript
import process from 'node:process'

if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
}

process.stdin.on('data', function(data) {
    console.log('data is', data)
    let s = data.toString('utf-8')
    if (s === '\x03') {
        process.exit()
    } else if (s === '\x1b[A') {
        console.log('up')
    } else if (s === '\x1b[B') {
        console.log('down')
    }
})
```

在按下 `上方向键` 的时候，`log` 出来的内容是 `<Buffer 1b 5b 41>`

在按下 `下方向键` 的时候，`log` 出来的内容是 `<Buffer 1b 5b 42>`

`Buffer` 是二进制数据格式，在这个例子种用起来比较麻烦，所以转成了字符串，然后再根据字符串来判断按下了什么键

需要注意的是 `process.stdin.setRawMode(true)`。常规情况下在终端输入内容按下回车键表示输入完毕，调用 `setRawMode(true)` 之后，就不需要按回车结束，而是把输入变成 “逐字符” 的形式处理，也就是按一次键就会处理一次，具体可以看 [setRawMode](`https://nodejs.org/api/tty.html#readstreamsetrawmodemode`) 文档

当然在这个模式下，需要手动处理 `Ctrl` + `C`，判断是 `Ctrl` + `C` 就调用 `process.exit()` 退出命令行。常规情况下输入 `Ctrl` + `C` 会发送 [SIGINT](`https://nodejs.org/api/process.html#signal-events`) 信号，从而退出命令行的运行状态

现在把列表和方向键组合起来
```javascript
import process from 'node:process'

if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
}

let index = 0
let list = [
    'react',
    'vue',
    'angular',
]
let prompt = 'select framework'

process.stdout.write(prompt)
process.stdout.write('\n')

for (let i = 0; i < list.length; i += 1) {
    let s = list[i]
    if (i === index) {
        s = '\x1b[34m' + '> ' + s + '\x1b[0m'
    } else {
        s = '> ' + s
    }
    process.stdout.write(s + '\n')
}

for (let i = 0; i < list.length; i += 1) {
    process.stdout.write('\x1b[1A')
}

process.stdin.on('data', function(data) {
    let s = data.toString('utf-8')
    if (s === '\x03') {
        process.exit()
    } else if (s === '\x0d') {
        for (let i = 0; i < list.length - index; i += 1) {
            process.stdout.write('\x1b[1B')
        }
        let item = list[index]
        process.stdout.write(`\x1b[1G`)
        process.stdout.write('selected item is ' + item + '\n')
        process.exit()
    } else if (s === '\x1b[A') {
        if (index === 0) {
            return
        }

        process.stdout.write(`\x1b[1G`)
        process.stdout.write('\x1b[0m' + '> ' + list[index] + '\x1b[0m')
        process.stdout.write('\x1b[1A')

        index -= 1

        process.stdout.write(`\x1b[1G`)
        let s1 = '\x1b[34m' + '> ' + list[index] + '\x1b[0m'
        process.stdout.write(s1)
    } else if (s === '\x1b[B') {
        if (index === list.length - 1) {
            return
        }

        process.stdout.write(`\x1b[1G`)
        process.stdout.write('\x1b[0m' + '> ' + list[index] + '\x1b[0m')
        process.stdout.write('\x1b[1B')

        index += 1

        process.stdout.write(`\x1b[1G`)
        let s1 = '\x1b[34m' + '> ' + list[index] + '\x1b[0m'
        process.stdout.write(s1)
    }
})
process.stdout.write('\x1b[?25l')
```

根据 [CSI](`https://en.wikipedia.org/wiki/ANSI_escape_code#CSI_(Control_Sequence_Introducer)_sequences`) 文档，`\x1b[1A` 表示光标往上移动 1 行

```bash
select framework
> react
> vue
> angular
```

默认情况下，光标会在 `angular` 的下一行，但是 `index = 0`，所以光标应该在 `react` 这一行，也就是需要把光标往上移动 `list.length` 次，下面的代码用来完成这个事情

```javascript
for (let i = 0; i < list.length; i += 1) {
    process.stdout.write('\x1b[1A')
}
```

接着看 `s === \x0d` 分支，`\x0d` 表示回车，这里的作用是按下回车后，在 `angular` 的下一行输出具体选择了哪个 item

先把光标移动到 `angular` 的下一行（通过往下移动 `list.length - index` 次），然后把光标移到第一列，接着输出内容，最后退出命令行
```javascript
for (let i = 0; i < list.length - index; i += 1) {
    process.stdout.write('\x1b[1B')
}
let item = list[index]
process.stdout.write(`\x1b[1G`)
process.stdout.write('selected item is ' + item + '\n')
process.exit()
```

再看 `s === \x1b[B` 分支，按 `下方向键` 时，选中下一个 item 并且高亮
```javascript
if (index === list.length - 1) {
    return
}

process.stdout.write(`\x1b[1G`)
process.stdout.write('\x1b[0m' + '> ' + list[index] + '\x1b[0m')
process.stdout.write('\x1b[1B')

index += 1

process.stdout.write(`\x1b[1G`)
let s1 = '\x1b[34m' + '> ' + list[index] + '\x1b[0m'
process.stdout.write(s1)
```

如果已经是最后一个 item，再按 `下方向键` 就不起作用

假设当前选中的是 `react`，按 `下方向键` 后会变成选中 `vue`

那么需要做这样几件事情

1，把 `react` 行的高亮效果去掉

2，光标往下移动一行

3，给 `vue` 行加上高亮效果

也就是分支代码完成的事情，按 `上方向键` 原理一样，就不展开详细描述

另外 `\x1b[?25l` 是隐藏光标

可以发现现在这样写代码非常繁琐，而且有大量 `ansi escape` 硬编码的写法，也很容易出错

那么接下来就需要把代码稍微封装下
```javascript
import process from 'node:process'

class Select {
    constructor(prompt, list) {
        this.index = 0
        this.prompt = prompt
        this.list = list
        this.csi = '\x1b['
        this.drawList()
        this.bindEvents()
    }
    static new(prompt, list) {
        return new Select(prompt, list)
    }
    draw(s) {
        process.stdout.write(s)
    }
    drawList() {
        this.draw(`${this.prompt}\n`)
        for (let i = 0; i < this.list.length; i += 1) {
            let s = this.list[i]
            if (i === this.index) {
                this.activeColor()
                this.draw(`> ${s}\n`)
                this.resetColor()
            } else {
                this.draw(`> ${s}\n`)
            }
        }
        this.cursorUp(this.list.length)
    }
    cursorUp(n = 1) {
        let s = this.csi + n + 'A'
        this.draw(s)
    }
    cursorDown(n = 1) {
        let s = this.csi + n + 'B'
        this.draw(s)
    }
    cursorHorizontal(n = 1) {
        let s = this.csi + n + 'G'
        this.draw(s)
    }
    bindEvents() {
        process.stdin.on('data', (data) => {
            let key = data.toString('utf-8')
            let keyCtrlC = '\x03'
            let keyEnter = '\x0d'
            let keyUpArrow = '\x1b[A'
            let keyDownArrow = '\x1b[B'
            if (key === keyCtrlC) {
                this.actionInterupt()
            } else if (key === keyEnter) {
                this.actionEnter()
            } else if (key === keyUpArrow) {
                this.actionUp()
            } else if (key === keyDownArrow) {
                this.actionDown()
            }
        })
    }
    actionInterupt() {
        process.exit()
    }
    actionEnter() {
        let n = this.list.length - this.index
        this.cursorDown(n)
        this.cursorHorizontal()
        let item = this.list[this.index]
        this.draw(`selected item is ${item}\n`)
        this.actionInterupt()
    }
    actionUp() {
        if (this.index === 0) {
            return
        }
        this.changeCurrent(-1)
    }
    actionDown() {
        if (this.index === this.list.length - 1) {
            return
        }
        this.changeCurrent(1)
    }
    resetColor() {
        let s = this.csi + '0m'
        this.draw(s)
    }
    activeColor() {
        let s = this.csi + '34m'
        this.draw(s)
    }
    changeCurrent(offset) {
        this.cursorHorizontal()
        this.resetColor()
        let list = this.list
        this.draw(`> ${list[this.index]}`)
        this.activeColor()

        if (offset > 0) {
            this.cursorDown()
        } else {
            this.cursorUp()
        }

        this.index += offset
        this.cursorHorizontal()
        this.draw(`> ${list[this.index]}`)
        this.resetColor()
    }
}

function init() {
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true)
    }
}

function main() {
    init()

    let prompt = 'select framework'
    let list = [
        'react',
        'vue',
        'angular',
    ]
    Select.new(prompt, list)
}

main()
```


### 执行程序
假设实现类似 `create-react-app` 这样的程序，给定参数后会安装相应的 node 模块，有两种方案可以实现

当然不管用哪种方案，这个过程都会持续一段时间，所以需要在安装的时候给一个进度条，进度条的实现原理和 loading 差不多，隔一段时间渲染一段关联的文本，这样在文本切换的时候看起来就像是在实现进度条

第一种方案是直接执行 `npx create-react-app my-app` 命令，[child_process](`https://nodejs.org/api/child_process.html`) 的 `exec` 和 `spawn` 方法都可以实现，两个方法的区别是参数不同

先看看 `exec` 的用法，`npx` 和 `npx` 的参数写在了一个字符串里面
```javascript
import { exec } from 'node:child_process'

let child = exec('npx create-react-app my-app')

child.stdout.on('data', function(data) {
    console.log(data.toString('utf-8'))
})

child.stderr.on('data', function(error) {
    console.log('error', error.toString('utf-8'))
})

child.on('exit', function(code) {
    console.log('close', code)
})
```

再看看 `spawn` 的用法，`npx` 的参数写到了单独的数组里，作为 `spawn` 的第二个参数
```javascript
import { spawn } from 'node:child_process'

let child = spawn('npx', ['create-react-app', 'my-app'])

child.stdout.on('data', function(data) {
    console.log(data.toString('utf-8'))
})

child.stderr.on('data', function(error) {
    console.log('error', error.toString('utf-8'))
})

child.on('exit', function(code) {
    console.log('close', code)
})
```

第二种方案是从 [registry.npmjs.com](`https://registry.npmjs.com/`) 网站下载 `create-react-app` 文件，然后在本地解压运行 `create-react-app` 程序，再安装相关依赖
```javascript
import https from 'node:https'
import { writeFile } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const getBuffer = function(response) {
    return new Promise(function(resolve, reject) {
        let list = []
        response.on('data', function(buffer) {
            list.push(buffer)
        })
        response.on('end', function() {
            let b = Buffer.concat(list)
            resolve(b)
        })
        response.on('error', function(error) {
            reject(error)
        })
    })
}
const get = function(url) {
    return new Promise(function(resolve, reject) {
        let req = https.get(url, async function(res) {
            let r = await getBuffer(res)
            resolve(r)
        })
        req.end()
    })
}

const main = async function() {
    let url = 'https://registry.npmjs.com/create-react-app'

    let r = await get(url)
    let body = JSON.parse(r.toString('utf8'))
    let version = body['dist-tags'].latest
    let { shasum, tarball} = body.versions[version].dist
    console.log('shasum and tarball', shasum, tarball)

    let buffer = await get(tarball)
    let paths = tarball.split('/')
    let filename = paths[paths.length - 1]
    await writeFile(filename, buffer)

    let execPromise = promisify(exec)
    let cmd = `tar -xvzf ${filename} && cd package && npm install`
    let { stdout, stderr } = await execPromise(cmd)
    console.log('stdout', stdout)
    console.log('stderr', stderr)
}

main()
```

可以发现这种方案要麻烦不少，因为要先使用 `http(s)` 协议访问 `create-react-app` 的描述信息，从描述信息里拿到最新版本号

再根据版本号找到 `shasum` 和 `tarball`，后者是 `create-react-app` 在服务器上的具体位置，实际上就是一个 `tgz` 文件，`shasum` 是这个文件的摘要

通常下载该文件之后需要拿到摘要，然后和服务器提供的摘要对比，如果两个摘要完全一致，说明下载的文件是服务器提供的文件，中间并没有被篡改，这里为了简化流程，就跳过了对比摘要这一步

把文件下载到本地之后，用 `tar` 程序解压缩 `tgz` 文件，默认会把内容解压缩到 `package` 目录

后面就是切到 `package` 目录，然后用 `npm install` 安装依赖

这里为了方便，直接把解压缩、切目录、安装依赖用 `&&` 的形式写在了一起，同时使用 `promisify` 把 `exec` 从回调改成了 `promise` 的形式，方便使用 `await` 语法

因为这只是为了演示，所以把 `http` 传输过程也做了很大简化，现在的代码是直接发请求，拿到没有经过编码处理的响应。实际过程中拿到的通常是采用压缩算法编码之后的内容，这样可以减少传输量


`http` 的内容比较繁琐，后续可能会专门写相关的专题内容


本文代码
[lincli](`https://github.com/lintian255/lincli`)
