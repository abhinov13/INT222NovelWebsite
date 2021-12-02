//require lib
const express = require("express");
const mongo = require("mongodb");
const MongoClient = mongo.MongoClient;
const url = "mongodb://localhost:27017/userdb";
const path = require("path");
const http = require("http");
const fs = require("fs");
const { EDESTADDRREQ } = require("constants");
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

var dbobj;
var userdataPresent;
var userPassword = "";

//deleteCollection();
//middleware
app.use(express.static(path.join(__dirname + "/public")));
app.use(express.json());
app.use(express.urlencoded());

const users = {}

//routes
app.get('/login', (req, res) => {
  res.sendFile(__dirname + "/public/login.html");
})
app.get('/signup', (req, res) => {
  res.sendFile(__dirname + "/public/signup.html");
})
app.get('/deleteid', (req, res) => {
  res.sendFile(__dirname + "/public/deleteid.html");
})
app.get('/novel_1', (req, res) => {
  res.sendFile(__dirname + "/public/novel.html");
})
app.get('/novel_2', (req, res) => {
  res.sendFile(__dirname + "/public/novel.html");
})


//handling all the forms
app.post('/loginAttempt', (req, res) => {
  getData(req.body.Name);
  var password = req.body.password;
  setTimeout(trytologin, 500, password, res);
})
function trytologin(password_, res) {
  if (password_ == userPassword) {
    res.redirect("http://localhost:5000/novel_1");
  }
  else {
    res.redirect("http://localhost:5000/login");
  }
}
app.post('/signupAttempt', (req, res) => {
  getData(req.body.Name);
  var username = req.body.Name;
  var password = req.body.password;
  setTimeout(trytosignup, 500, username, password, res);

})
function trytosignup(username, password, res) {
  if (userdataPresent == true) {
    res.redirect("http://localhost:5000/login");
  }
  else {
    addToDb(username, password);
    res.redirect("http://localhost:5000/novel_1");
  }
}

app.post('/deleteAttempt', (req, res) => {
  getData(req.body.Name);
  var password = req.body.password;
  setTimeout(trytodelete, 500,password,req, res);
})
function trytodelete(password,req,res) {
  if (password == userPassword && userdataPresent == true)
  {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbobj = db.db("userdb");
      var query = { Name: req.body.Name };
      dbobj.collection("userdata").deleteOne(query, function (err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        db.close();
      });
    });
  }
  res.redirect("http://localhost:5000/");
}
//mongo
MongoClient.connect(url, (err, db) => {
  if (err) {
    console.log(err);
  }
  else {
    console.log("database created");
    dbobj = db.db('userdb');
    dbobj.createCollection("userdata", (err, res) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("collection created");
        db.close();
      }
    })

    dbobj.createCollection("comments", (err, res) => {
      if (err) {
        console.log(err);
      }
      else {
        console.log("collection created");
        db.close();
      }
    })
  }
})

function getData(Name_) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbobj = db.db("userdb");
    dbobj.collection("userdata").find({}).toArray(function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        for (var i = 0; i <= result.length; i++) {
          if (i == result.length) {
            db.close();
            userdataPresent = false;
            userPassword = "";
          }
          else if (Name_ == result[i].Name) {
            userdataPresent = true;
            userPassword = result[i].password;
            break;
          }
        }
        db.close();
      }
    });
  });
}
function addToDb(Name_, password_) {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbobj = db.db("userdb");
    var myobj = { Name: Name_, password: password_ };
    dbobj.collection("userdata").insertOne(myobj, function (err, res) {
      if (err) {
        console.log(err);
      }
      else {
        db.close();
      }

    });
  });
}
function deleteCollection() {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("userdb");
    dbo.collection("userdata").drop(function (err, delete_) {
      if (err) throw err;
      if (delete_) console.log("Collection deleted");
    });

    dbo.collection("comments").drop(function (err, delete_) {
      if (err) throw err;
      if (delete_) console.log("Collection deleted");
      db.close();
    });
  });
}
//user database ends here
function addToComments(message)
{
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbobj = db.db("userdb");
    var myobj = { comment: message};
    dbobj.collection("comments").insertOne(myobj, function (err, res) {
      if (err) {
        console.log(err);
      }
      else {
        db.close();
      }
    });
  });
}
function getComments()
{
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbobj = db.db("userdb");
    dbobj.collection("comments").find({}).toArray(function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        db.close();
        return result;
      }
    });
  });
}
//comment database ends here

//to handle comments
io.on('connection', socket => {
  socket.on('pageloaded', (chapter) => {
    fs.readFile("./public/thebeginningaftertheend/"+chapter+".txt", 'utf-8', (err, data) => {
      if (err) {
        console.log(err);
      }
      else {
        socket.join("room_"+chapter);
        socket.emit('dataLoaded', data);
      }
    })
  })
  socket.on('loadComments', (chapter) => {
    
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbobj = db.db("userdb");
      var myquery = {room: "room_"+chapter};
      dbobj.collection("comments").find(myquery).toArray(function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          db.close();
          socket.emit('sendComments',result);
        }
      });
    });
  })
  socket.on('newuser', name => {
    users[socket.id] = name;
  })

  socket.on('sendcomment', ({chapter_,message_}) => {
    console.log(chapter_+ " " + message_);
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbobj = db.db("userdb");
      var myobj = { room: "room_"+chapter_ ,comment: users[socket.id] + ':' + message_};
      dbobj.collection("comments").insertOne(myobj, function (err, res) {
        if (err) {
          console.log(err);
        }
        else {
          console.log("data entered successfully");
          console.log(myobj);
          db.close();
        }
      });
    });
    socket.broadcast.to("room_"+chapter_).emit('commentmessage', { message: message_, name: users[socket.id] });
  })

  socket.on('disconnect', () => {
    delete users[socket.id];
  })
})

//start server
server.listen(5000);