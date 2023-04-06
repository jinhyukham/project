var fs = require("fs-extra")
var path = require('path')
var spawn = require('cross-spawn')
var moment = require('moment')
var args = process.argv.slice(2)

console.log(args)
var app = 'apiwrap'
var task = args[0]
var target = args[1] || ''

console.log('task::', task)
console.log('target::',target);

if(task == 'build'){

}else if(task == 'docker'){
    let tag = target
    if(!tag) process.exit(1)
    console.log('tag >>', tag)

    fs.removeSync('docker')
	fs.mkdirpSync('docker')
    copy('logs','src','env.yml','pm2.json','server.js','pm2.json','package.json','package-lock.json')
    version(tag)

    spawn.sync('docker', 
                [
                    'build', 
                    '--platform','linux/amd64',
                    '-t', `docker.mindwareworks.com/coginsight/${app}:${tag}`, 
                    '--squash', '-f', 'Dockerfile', `./docker`
                ], 
                { stdio: 'inherit' })
    // fs.removeSync('docker')

}else if(task == 'deploy'){
	let tag = target;
	if(!tag) process.exit(1)
	console.log('tag >>', tag)
	
	spawn.sync('docker',
                [
                    'push', 
                    `docker.mindwareworks.com/coginsight/${app}:${tag}`
                ],
				{ stdio: 'inherit' })
}


function copy(){
	// console.log(arguments)
	let targets = Array.from(arguments)
	console.log(targets)
	targets.forEach((f)=>{
		fs.copySync(f,'docker/'+f)
	})
	
}


function version(tag){
        let result = spawn.sync('git',['log','-1',"--pretty=%ad.%h","--date=format:%y%m%d"]);
        let hash_date = result.stdout.toString().trim();

        //let version = JSON.parse(fs.readFileSync('./package.json','utf-8')).version

        let version = `${app} ${tag} (${hash_date})\n`
        fs.writeFileSync('docker/VERSION',version,'utf-8');
        console.log('version : ',version)
}

