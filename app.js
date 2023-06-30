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

function readDirSync(path){
    var ret = {dir:[],files:[]}
	var pa = fs.readdirSync(path);
	pa.forEach(function(ele,index){
		var info = fs.statSync(path+"/"+ele)	
		if(info.isDirectory()){
            ret['dir'].push(ele)
		}else{
            if(ele.indexOf('.pdf') > 0){
                ret['files'].push(ele)
            }
		}	
	})
    return ret
}

app.get('/', (req, res) => {
    var at = req.query.at
    if(!at) at = ''
    console.log(at)
    console.log(mainPath)
    var newpath = path.join(mainPath,at)
    console.log(newpath)
    if(!fs.existsSync(newpath)){
        res.send('error')
        return
    }

    var pdflist = readDirSync(newpath)
    pdflist['files'].forEach(function(v,i){
        var one = {pdf:'',thumb:'',size:''}
        var thumbnail =  path.join('thumbnail',at, pdflist['files'][i])
        thumbnail = thumbnail.replace('.pdf','.png')

        if(fs.existsSync(thumbnail)) {
            one.thumb = path.join(at, pdflist['files'][i]).replace('.pdf','.png')
        }
        one.pdf = path.join(at,pdflist['files'][i])
        one.size = !!thumbnailInfo[path.join('thumbnail',one.thumb)] && thumbnailInfo[path.join('thumbnail',one.thumb)]['size'] || "unknown"
        
        //pdflist['files'][i] = path.join(at,pdflist['files'][i])
        pdflist['files'][i] = one
    })

    if(at == ''){
        pdflist['dir'].removeByValue('public')
        pdflist['dir'].removeByValue('.git')
        pdflist['dir'].removeByValue('node_modules')
        pdflist['dir'].removeByValue('views')
        pdflist['dir'].removeByValue('thumbnail')
    }
    pdflist['dir'].forEach(function(v,i){
        pdflist['dir'][i] = at + '/' + pdflist['dir'][i]
    })
    var pre = ''
    if(!at && at.indexOf('\\') > 0){
        pre = at.substring(at.lastIndexOf('\\')+1,at.length - at.lastIndexOf('\\'))
    }

    res.render('index', {
        pre : pre, 
        pdfdir: pdflist['dir'],
        pdflist: pdflist['files'],
    })
})

app.listen(3000)