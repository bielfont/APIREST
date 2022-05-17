// https://fpieseljust.github.io/pps21-22/Unitats/Unitat%203/APIRest/

"use strict";
var express = require("express")
var app = express()
var fs = require('fs'); // HTTPS
var https = require('https'); // HTTPS

//Body-Parser
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Cookie
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Tipos de Encriptacion
var md5 = require('md5')
const  bcrypt  =  require('bcryptjs');

// Token
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const db = require("./database");
dotenv.config();
process.env.TOKEN_SECRET;
//Secreto TOKEN en Variable


//Router
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

//Servidor Web de la API en HTTP
 /*
app.use(router);
const port = process.env.PORT || 9999;
const server = app.listen(port, () => {
    console.log('Server listening at http://localhost:' + port);
});

router.get('/', (req, res) => {
    res.status(200).send('This is an authentication server');
});
*/



//Servidor Web de la API en HTTPS
app.use(router);
var PORT = 8443 // HTTPS
https.createServer({
    key: fs.readFileSync('my_cert.key'),
    cert: fs.readFileSync('my_cert.crt')
  }, app).listen(PORT, () => {
    console.log("Biel HTTPS server con COOKIES en HTTPS puerto " + PORT + "...");
  });


router.get('/', (req, res) => {
    res.status(200).send('Esto es un servidor con autentificacion');
});


//DB autentificacion y subprocesos
const sqlite3 = require('sqlite3').verbose();
const database = new sqlite3.Database("./my.db");
const createUsersTable = () => {
const sqlQuery = 'CREATE TABLE IF NOT EXISTS users (id integer PRIMARY KEY, name text, email text UNIQUE, password text, admin text)';
    return database.run(sqlQuery);
}

const findUserByEmail = (email, cb) => {
    return database.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        cb(err, row)
    });
}

const createUser = (user, cb) => {
    return database.run('INSERT INTO users (name, email, password, admin) VALUES (?,?,?,?)', user, (err) => {
        cb(err)
    });
}

createUsersTable();

//Verificador de Autorizacion en llamadas a la API via COOKIE
const authorization = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
      return res.sendStatus(403);
    }
    try {
      const data = jwt.verify(token, process.env.TOKEN_SECRET);
      req.userId = data.id;
      req.userAdmin = data.admin;
      
      return next();
    } catch {
      return res.sendStatus(403);
    }
  };




//Endpoints de la API de AUTH

router.post('/register', (req, res) => {

    const  name  =  req.body.name;
    const  email  =  req.body.email;
    const  admin  =  req.body.admin;
    //console.log(req.body);
    const  password  =  bcrypt.hashSync(req.body.password);

    createUser([name, email, password, admin], (err)=>{
        if(err) return  res.status(500).send("Server error!");
        findUserByEmail(email, (err, user)=>{
            if (err) return  res.status(500).send('Server error!');  
            const  expiresIn  =  24  *  60  *  60;
            const  accessToken  =  jwt.sign({ id:  user.id, admin: user.admin }, process.env.TOKEN_SECRET, {
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
        const  accessToken  =  jwt.sign({ id:  user.id, admin: user.admin  }, process.env.TOKEN_SECRET, {
            expiresIn:  expiresIn
        });

        return res
        .cookie("access_token", accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "logeado",
        })
        .status(200)
        .redirect('http://127.0.0.1/loged.html');
        //.json({ message: "Logeado!!" });

        //res.status(200).send({ "user":  user, "access_token":  accessToken, "expires_in":  expiresIn});
        //res.cookie("refreshToken", accessToken, {httpOnly: true, sameSite: "strict"});
    });
});


app.get("/logout", authorization, (req, res) => {
    return res
      .clearCookie("access_token")
      .status(200)
      //res.type('text/plain');
      //return res.send('Deslogeado');
      .redirect('http://127.0.0.1/logout.html');
      //.clearCookie("access_token");
      //.json({ message: "Deslogeado.." });
});

//Enpoints

app.get('/api/users', authorization, (req, res, next) => {
    

    var sql = "select * from users"
// Verifica si es admin para aceptar la consulta de todos los usuarios.
    if (req.userAdmin == 'on') {  

    database.all(sql, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          return;
        }
        res.json({
            "message":"success",
            "admin": req.userAdmin,
            "data":rows
        })
      });
    }    
      else{
        res.json({
            "message":"Usuario No Admin",
            "admin": req.userAdmin
        })
            
    }
//});
})

//GET parametrizado para evitar inyeccion SQL
app.get('/api/user/:id', authorization, (req, res, next) => {

    var sql = "select * from users where id = ? IN ('id','name')"
    var params = [req.params.id]
    
// Verifica si es es el propietario o admin para aceptar la consulta de todos los usuarios.
    if ((req.params.id == req.userId) || (req.userAdmin == 'on')) {  
    
    database.all(sql, (err, rows) => {
        if (err) {
          res.status(400).json({"error":err.message});
          
        }else{
            res.json({
                "message":"success",
                "admin": req.userAdmin,
                "data":rows,
                "id_userdb": params,
                "id_userauth": req.userId
                
                
            
                
            })
        }
      });
    }else{
        res.json({
            "message":"Usuario No autorizado"
        })
            
    }
});

// Las pruebas de ROLES se han limitado a dos (Listar usuarios totales , lista usuario individual)
/*
app.patch('/api/user/:id', authorization, (req, res, next) => {

//app.patch("/api/user/:id", (req, res, next) => {
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
app.delete('/api/user/:id', authorization, (req, res, next) => {

//app.delete("/api/user/:id", (req, res, next) => {
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

//Respuesta ante consultas de rutas inexistentes

app.use(function (req, res) {
    res.status(404).json({ "error": "Invalid endpoint. V1"});
    
});
