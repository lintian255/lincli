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