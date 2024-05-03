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