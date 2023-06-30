const express = require('express')
const app = express()
const fs = require('fs')
const path = require('path')
const packageData = require("./package.json")
const thumbnailInfo = require('./thumbnail.json')

app.set('view engine', 'ejs')
var mainPath = __dirname
if(!!packageData.workpath){
    mainPath = packageData.workpath
}
app.use(express.static(mainPath))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'thumbnail')))

Array.prototype.removeByValue = function (val) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] === val) {
        this.splice(i, 1);
        i--;
      }
    }
    return this;
}

function readDirSync(path,suffix){    
    var ret = {dir:[],files:[]}
	var pa = fs.readdirSync(path);
	pa.forEach(function(ele,index){
		var info = fs.statSync(path+"/"+ele)	
		if(info.isDirectory()){
            ret['dir'].push(ele)
		}else{
            if(ele.indexOf(suffix) > 0){
                ret['files'].push(ele)
            }
		}	
	})
    return ret
}

function getShowFileList(newpath, at , suffix){
    suffix = '.'+suffix
    var showFileList = readDirSync(newpath,suffix)
    showFileList['files'].forEach(function(v,i){
        var one = {file:'',thumb:'',size:''}
        var thumbnail =  path.join('thumbnail',at, showFileList['files'][i])
        thumbnail = thumbnail.replace(suffix,'.png')

        if(fs.existsSync(thumbnail)) {
            one.thumb = path.join(at, showFileList['files'][i]).replace(suffix,'.png')
        }
        one.file = path.join(at,showFileList['files'][i])
        one.size = !!thumbnailInfo[path.join('thumbnail',one.thumb)] && thumbnailInfo[path.join('thumbnail',one.thumb)]['size'] || "unknown"
        
        //showFileList['files'][i] = path.join(at,showFileList['files'][i])
        showFileList['files'][i] = one
    })

    if(at == ''){
        showFileList['dir'].removeByValue('public')
        showFileList['dir'].removeByValue('.git')
        showFileList['dir'].removeByValue('node_modules')
        showFileList['dir'].removeByValue('views')
        showFileList['dir'].removeByValue('thumbnail')
    }
    showFileList['dir'].forEach(function(v,i){
        showFileList['dir'][i] = at + '/' + showFileList['dir'][i]
    })
    return showFileList
}

function getPrePath(at){
    var pre = ''
    if(!at && at.indexOf('\\') > 0){
        pre = at.substring(at.lastIndexOf('\\')+1,at.length - at.lastIndexOf('\\'))
    }
    return pre
}

app.get('/', (req, res) => {
    var at = req.query.at
    if(!at) at = ''
    var newpath = path.join(mainPath,at)
    if(!fs.existsSync(newpath)){
        res.send('error')
        return
    }
    var type = 'pdf'
    var showFileList = getShowFileList(newpath,at,type)
    var pre = getPrePath(at)
    res.render('index', {
        current: '/',
        type: type,
        pre : pre, 
        filedir: showFileList['dir'],
        showFileList: showFileList['files'],
    })
})

var typeList = ['mp4','pdf']

app.get('/'+typeList[0], (req, res) => {
    var at = req.query.at
    if(!at) at = ''
    var newpath = path.join(mainPath,at)
    if(!fs.existsSync(newpath)){
        res.send('error')
        return
    }
    var type = typeList[0]
    var showFileList = getShowFileList(newpath,at,type)
    var pre = getPrePath(at)
    res.render('index', {
        current: '/'+ type,
        type: type,
        pre : pre, 
        filedir: showFileList['dir'],
        showFileList: showFileList['files'],
    })
})

app.get('/'+typeList[1], (req, res) => {
    var at = req.query.at
    if(!at) at = ''
    var newpath = path.join(mainPath,at)
    if(!fs.existsSync(newpath)){
        res.send('error')
        return
    }
    var type = typeList[1]
    var showFileList = getShowFileList(newpath,at,type)
    var pre = getPrePath(at)
    res.render('index', {
        current: '/'+ type,
        type: type,
        pre : pre, 
        filedir: showFileList['dir'],
        showFileList: showFileList['files'],
    })
})

app.listen(3000)