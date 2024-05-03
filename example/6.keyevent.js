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