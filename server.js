const express = require("express");
const app = express();
const methodOverride = require('method-override')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')
const MongoStore = require('connect-mongo')


require('dotenv').config();

app.set('view engine', 'ejs'); 

app.use(express.json()); 
app.use(express.urlencoded({extended:true}));
app.use(methodOverride('_method')) 
app.use(passport.initialize())
app.use(session({
    resave : false,
    saveUninitialized : false,
    secret: '0011223', //세션 암호화 비밀번호
    cookie : {maxAge : 1000 * 60 * 60},
    store: MongoStore.create({
      mongoUrl : process.env.mongodb_Url, //홈페이지 DB접속용 URL'
      dbName: 'forum', //DB 이름
    })
  }))
  

app.use(passport.session())

passport.use(new LocalStrategy(async (ID, PASSWORD, cb) => {
    let result = await db.collection('user').findOne({ username : ID})
    if (!result) {
      return cb(null, false, { message: '아이디 DB에 없음' })
    }
  
    if (await bcrypt.compare(PASSWORD, result.password)) {
      return cb(null, result)
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
  }))
  

passport.serializeUser((user, done) => {
    process.nextTick(() => {
      done(null, { id: user._id, username: user.username })
    })
  })
passport.deserializeUser(async (user, done) => {
    let result = await db.collection('user').findOne({_id : new ObjectId(user.id) })
    delete result.password
    process.nextTick(() => {
      return done(null, result)
    })
  })
  
  
  
  


const { MongoClient, ObjectId } = require('mongodb')
let db
const url = process.env.mongodb_Url;
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공');
  db = client.db('forum');
  app.listen(process.env.PORT, () => {
    console.log("http://localhost:" + process.env.PORT)
});
}).catch((err)=>{
  console.log(err)
})



app.get("/", (req, res) => {
    res.render("index.ejs");
})

app.get("/list",async (req, res) => {
    let result = await db.collection('post').find().toArray();
    res.render("list.ejs", { result });
})

app.get("/detail/:id", async (req, res) => {
    let result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id)});
    res.render("detail.ejs", { result })
});

app.get("/write", (req, res) => {
    res.render("write.ejs");
});
app.post("/add", async (req, res) => {
    await db.collection('post').insertOne({ title: req.body.title, content: req.body.content });
    res.redirect("/list");
});

app.get("/edit/:id", async (req, res) => {
    let result = await db.collection('post').findOne({ _id: new ObjectId(req.params.id) });
    res.render("edit.ejs", { result });
});
app.put("/edit", async (req, res) => {
    await db.collection('post').updateOne({ _id: new ObjectId(req.body.id) }, {$set: { title: req.body.title, content: req.body.content}})
    res.redirect("/detail/" + req.body.id);
});

app.delete("/delete", async(req, res) => {
    await db.collection('post').deleteOne({ _id: new ObjectId(req.query.docid )});
    res.redirect("/list");
})

app.get("/register", (req, res) => {
    res.render("register.ejs");
})
app.post('/register', async (req, res) => {
    let hash = await bcrypt.hash(req.body.password, 10) 
    await db.collection('user').insertOne({
      username : req.body.username,
      password : hash
    })
    res.redirect('/')
  })

app.get("/login", (req, res) => {
    res.render("login.ejs");
})
app.post('/login', async (req, res, next) => {

    passport.authenticate('local', (error, user, info) => {
        if (error) return res.status(500).json(error)
        if (!user) return res.status(401).json(info.message)
        req.logIn(user, (err) => {
          if (err) return next(err)
          res.redirect('/')
        })
    })(req, res, next)
  })


  