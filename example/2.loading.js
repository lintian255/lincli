// 2.loading.js
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