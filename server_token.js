// https://fpieseljust.github.io/pps21-22/Unitats/Unitat%203/APIRest/
// Create express app
"use strict";
var express = require("express")
var app = express()
// Conectamos a la DB
var db = require("./database.js")
//Body-Parser
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//
var md5 = require('md5')
const  bcrypt  =  require('bcryptjs');
//const SECRET_KEY = "secretkey23456";

//Router
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

//db AUTH
const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database("./my.db");

const createUsersTable = () => {
const sqlQuery = 'CREATE TABLE IF NOT EXISTS users (id integer PRIMARY KEY, name text, email text UNIQUE, password text)';

    return database.run(sqlQuery);
}

const findUserByEmail = (email, cb) => {
    return database.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        cb(err, row)
    });
}

const createUser = (user, cb) => {
    return database.run('INSERT INTO users (name, email, password) VALUES (?,?,?)', user, (err) => {
        cb(err)
    });
}

createUsersTable();


// Token
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
process.env.TOKEN_SECRET;

function verifyToken(req, res, next) {
    const token = req.header("Auth-Token");
    if (!token) return res.status(401).send("Access Denied");
   
    try {
     const verified = jwt.verify(token, process.env.TOKEN_SECRET);
     req.user = verified;
     req.token  = token;
     console.log("Autenticado")
     
     next();
    } catch (error) {
     console.log("Error Autenticacion")
     res.status(400).send("Invalid Token");
    }
   }

/*
   // Server port
var HTTP_PORT = 9999 
// Start server
app.listen(HTTP_PORT, () => {
    console.log("Servidor BIEL escoltant a l'adreça http://localhost:%PORT%".replace("%PORT%",HTTP_PORT))
});
// Root endpoint
app.get("/", (req, res, next) => {
    res.json({"message":"Ok. V1"})
});
*/

app.use(router);
const port = process.env.PORT || 9999;
const server = app.listen(port, () => {
    console.log('Server listening at http://localhost:' + port);
});

router.get('/', (req, res) => {
    res.status(200).send('This is an authentication server');
});

/*
//Token  Sign
function generateAccessToken(username) {
    return jwt.sign(username, process.env.TOKEN_SECRET, { expiresIn: '1800s' });
  }

  app.post('/api/createNewUser', (req, res) => {
    // ...
  
    const token = generateAccessToken({ username: req.body.username });
    res.json(token);
  
    // ...
  });

*/

router.post('/register', (req, res) => {

    const  name  =  req.body.name;
    const  email  =  req.body.email;
    console.log(req.body);
    const  password  =  bcrypt.hashSync(req.body.password);

    createUser([name, email, password], (err)=>{
        if(err) return  res.status(500).send("Server error!");
        findUserByEmail(email, (err, user)=>{
            if (err) return  res.status(500).send('Server error!');  
            const  expiresIn  =  24  *  60  *  60;
            const  accessToken  =  jwt.sign({ id:  user.id }, process.env.TOKEN_SECRET, {
                expiresIn:  expiresIn
            });
            res.status(200).send({ "user":  user, "access_token":  accessToken, "expires_in":  expiresIn          
            });
        });
    });
});

router.post('/login', (req, res) => {
    const  email  =  req.body.email;
    const  password  =  req.body.password;
    findUserByEmail(email, (err, user)=>{
        if (err) return  res.status(500).send('Server error!');
        if (!user) return  res.status(404).send('User not found!');
        const  result  =  bcrypt.compareSync(password, user.password);
        if(!result) return  res.status(401).send('Password not valid!');

        const  expiresIn  =  24  *  60  *  60;
        const  accessToken  =  jwt.sign({ id:  user.id }, process.env.TOKEN_SECRET, {
            expiresIn:  expiresIn
        });
        res.status(200).send({ "user":  user, "access_token":  accessToken, "expires_in":  expiresIn});
    });
});

app.get('/status', verifyToken, (req, res) => {
    console.log("ApiUsers")
    jwt.verify(req.token, process.env.TOKEN_SECRET, (error, authData) => {
        if(error){
            res.sendStatus(401);
        }else{
            res.json({
                    mensaje: "Datos Token Activos",
                    authData
                });
        }
    });
//});
})

router.post('/logout', (req, res) => {
    const  email  =  req.body.email;
    const  password  =  req.body.password;
    const token = req.header("Auth-Token");
    findUserByEmail(email, (err, user)=>{
        if (err) return  res.status(500).send('Server error!');
        if (!user) return  res.status(404).send('User not found!');
        const  result  =  bcrypt.compareSync(password, user.password);
        if(!result) return  res.status(401).send('Password not valid!');

        jwrt.destroy(token);
        
        
        res.status(200).send({ "user":  user, "access_token":  accessToken, "expires_in":  expiresIn});
    });
});



// Insert here other API endpoints

app.get('/api/users', verifyToken, (req, res) => {
    console.log("ApiUsers")
// app.get("/api/users", (req, res, next) => {
    var sql = "select * from user"
    
    db.all(sql, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "data":rows
        })
      });
//});
})



/*


app.get("/api/user/:id", (req, res, next) => {
    var sql = "select * from user where id = " + req.params.id
    db.get(sql, (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
        }else{
            res.json({
                "message":"success",
                "data":row
            })
        }
      });
});

//GET parametrizado para evitar inyeccion SQL

app.get("/api/user2/:id", (req, res, next) => {
    var sql = "select * from user where id = ?"
    var params = [req.params.id]
    db.get(sql, (err, row) => {
        if (err) {
          res.status(400).json({"error":err.message});
        }else{
            res.json({
                "message":"success",
                "data":row
            })
        }
      });
});

app.post("/api/user/", (req, res, next) => {
    var errors=[]
   //console.log(req)
    if (!req.body.password){
        errors.push("No password specified");
    }
    if (!req.body.email){
        errors.push("No email specified");
    }
    if (errors.length){
        res.status(400).json({"error":errors.join(",")});
        return;
    }
    var data = {
        name: req.body.name,
        email: req.body.email,
        password : req.body.password ? md5(req.body.password) : null
    }
    var sql ='INSERT INTO user (name, email, password) VALUES (?,?,?)'
    var params =[data.name, data.email, data.password]
    db.run(sql, params, function (err, result) {
        if (err){
            res.status(400).json({"error": err.message})
            return;
        }
        res.json({
            "message": "success",
            "data": data,
            "id" : this.lastID
        })
    });
})

app.patch("/api/user/:id", (req, res, next) => {
    var data = {
        name: req.body.name,
        email: req.body.email,
        password : req.body.password ? md5(req.body.password) : null
    }
    db.run(
        `UPDATE user set 
           name = COALESCE(?,name), 
           email = COALESCE(?,email), 
           password = COALESCE(?,password) 
           WHERE id = ?`,
        [data.name, data.email, data.password, req.params.id],
        function (err, result) {
            if (err){
                res.status(400).json({"error": res.message})
                return;
            }
            res.json({
                message: "success",
                data: data,
                changes: this.changes
            })
    });
})

//Corregimos DELETE para evitar inyeccion SQL
app.delete("/api/user/:id", (req, res, next) => {
    //var sql = "delete from user where id = " + req.params.id
    var sql = "delete from user where id = ?"
    var params = [req.params.id]
    db.get(sql, (err) => {
        if (err) {
          res.status(400).json({"error":err.message});
        }else{
            res.json({
                message: "success2",
                changes: this.changes
            })
        }
      });
});
*/

// Default response for any other request
// Default response for any other request
app.use(function (req, res) {
    res.status(404).json({ "error": "Invalid endpoint. V1" });
});
