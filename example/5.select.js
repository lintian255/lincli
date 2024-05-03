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