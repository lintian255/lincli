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