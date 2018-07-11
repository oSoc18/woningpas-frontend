var express = require('express');
var app = express();
var fs = require("fs");
var qs = require('querystring');
var uuid = require("uuid/v4")
var statusSuccess=200

var connected={
    inspector:[],
    owner:[],
    admin:[]
}

function error(response, message){
    response.status(400);
    let data = {
        "message": message
    };
    response.write(JSON.stringify(data));
    response.end();
}

function success(response, data) {
    response.status(200);
    response.write(JSON.stringify(data));
    response.end();
}


app.get('/login', function(req, res){
    console.log("login")
    type = req.query.type
    if(type==="inspector" || type ==="admin" || type==="owner"){
        key = uuid()
        connected[type].push(key)
        success(res, {key:key});
    }
    else{
        error(res, "Unknown type");
    }
})


app.get('/listFiles', function (req, res) {
    console.log("listing files")
    data = fs.readFileSync( __dirname + "/" + "houses.json", 'utf8')
    key=req.query.key
    if(connected.inspector.includes(key) || connected.owner.includes(key) || connected.admin.includes(key)) {
        success(res, data);
    }
    else{
        error(res, "Error listing files");
    }
})


app.get('/download', function(req, res){
    console.log("download")
    var name = req.query.name
    var key = req.query.key

    sendFile = function(name){
        data=fs.readFileSync( __dirname + "/" + name, 'base64')
        returnData = {
            key:key,
            name: name,
            data: data,
        }
        return returnData
    }
    var file = fs.readFileSync( __dirname + "/" + "houses.json", 'utf8')
    var certificate = JSON.parse(file)
    if( (connected.inspector.includes(key) || connected.owner.includes(key) || connected.admin.includes(key)) &&
    certificate.hasOwnProperty(name)){
        success(res, sendFile(name, "base64"))
    }
    else{
        error(res, "Error downloading file")
    }
})


app.post('/validate', function(req, res){
    console.log("validate")
    var body ="";
    req.on('data', function(data){
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) { 
            // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        result=JSON.parse(body)
        splitName=String(result.name).split(".")
        if(splitName[splitName.length-1]==="pdf"){
            var file = fs.readFileSync( __dirname + "/" + "houses.json", 'utf8')
            var certificate = JSON.parse(file)
            if (certificate.hasOwnProperty(String(result.name)) && connected.inspector.includes(String(result.key))){
                certificate[String(result.name)].inspected = true
                StringifiedCertificate=JSON.stringify(certificate)
                fs.writeFileSync( __dirname + "/" + "houses.json", StringifiedCertificate, 'utf8')
                res.status(statusSuccess)
                res.write(JSON.stringify({success:true}))
                res.end()
            } else {
                error(res, "Error")
            }
        }
        else{
            error(res, "Error")
        }
    });
})

app.post('/upload', function(req, res){
    console.log("upload")
    var body = '';
    req.on('data', function(data){
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) { 
            // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            req.connection.destroy();
        }
    });
    req.on('end', function () {
        result=JSON.parse(body)
        splitName=String(result.name).split(".")
        if(splitName[splitName.length-1]==="pdf" && connected.owner.includes(String(result.key))){
            fs.writeFileSync( __dirname +"/logo/"+ result.name, result.data, 'base64');
            var file = fs.readFileSync( __dirname + "/" + "houses.json", 'utf8')
            var certificate = JSON.parse(file)
            certificate[String(result.name)]={
                uri: String(result.name),
                inspected: false
            }
            StringifiedCertificate=JSON.stringify(certificate)
            fs.writeFileSync( __dirname + "/" + "houses.json", StringifiedCertificate, 'utf8')
            res.status(statusSuccess)
            res.write(JSON.stringify({success:true}))
            res.end()
        }
        else{
            error(res, "Error")
        }
    });
})

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)

})