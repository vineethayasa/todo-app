/* eslint-disable n/handle-callback-err */
/* eslint-disable no-unused-vars */
const { request, response } = require('express')
const express = require('express')
const app = express()
const csrf = require('tiny-csrf')

const { Todo, User } = require('./models')

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const passport = require('passport')
const connectEnsureLogin = require('connect-ensure-login')
const session = require('express-session')
const LocalStrategy = require('passport-local')

const bcyrpt = require('bcrypt')
const saltRounds = 10

const flash = require('connect-flash')

app.use(express.urlencoded({ extended: false }))
const path = require('path')

app.use(express.static(path.join(__dirname, 'public')))

app.set('views', path.join(__dirname, 'views'))
app.use(flash())
const user = require('./models/user')

app.use(bodyParser.json())
app.use(cookieParser('ssh!!!! some secret string'))
app.use(csrf('this_should_be_32_character_long', ['POST', 'PUT', 'DELETE']))

app.use(session({
  secret: 'this is my secret-258963147536214',
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}))

app.use(passport.initialize())
app.use(passport.session())
app.use((request, response, next) => {
  response.locals.messages = request.flash()
  next()
})

passport.use(new LocalStrategy({
  usernameField: 'email',
  password: 'password'
}, (username, password, done) => {
  User.findOne({ where: { email: username } })
    .then(async (user) => {
      const result = await bcyrpt.compare(password, user.password)
      if (result) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Invalid Password' })
      }
    }).catch((error) => {
      return done(null, false, { message: 'Invalid user credentials' })
    })
}))

passport.serializeUser((user, done) => {
  console.log('Serializing user in session', user.id)
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then(user => {
      done(null, user)
    })
    .catch(error => {
      done(error, null)
    })
})

app.set('view engine', 'ejs')
app.get('/', async (request, response) => {
  response.render('index', {
    title: 'Todo Application',
    csrfToken: request.csrfToken()
  })
})

app.get('/todos', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const loggedInUser = request.user.id
  const allTodos = await Todo.getTodos()
  const overdue = await Todo.overdue(loggedInUser)
  const dueLater = await Todo.dueLater(loggedInUser)
  const dueToday = await Todo.dueToday(loggedInUser)
  const completedItems = await Todo.completedItems(loggedInUser)
  if (request.accepts('html')) {
    response.render('todos', {
      allTodos,
      overdue,
      dueLater,
      dueToday,
      csrfToken: request.csrfToken(),
      completedItems
    })
  } else {
    response.json({ overdue, dueLater, dueToday, completedItems })
  }
})

app.get('/signup', (request, response) => {
  response.render('signup', {
    title: 'Signup',
    csrfToken: request.csrfToken()
  })
})

app.get('/login', (request, response) => {
  response.render('login', {
    title: 'Login',
    csrfToken: request.csrfToken()
  })
})

app.post('/session', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true
}), async (request, response) => {
  console.log(request.user)
  response.redirect('/todos')
})

app.get('/signout', (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err)
    }
    response.redirect('/')
  })
})

app.post('/users', async (request, response) => {
  if (!request.body.firstName) {
    request.flash('error', 'First Name cannot be empty')
    return response.redirect('/signup')
  }
  if (!request.body.email) {
    request.flash('error', 'Email cannot be empty')
    return response.redirect('/signup')
  }

  if (!request.body.password) {
    request.flash('error', 'Password cannot be empty')
    return response.redirect('/signup')
  }
  const hashedPwd = await bcyrpt.hash(request.body.password, saltRounds)
  console.log(hashedPwd)
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd
    })
    request.login(user, (err) => {
      if (err) {
        console.log(err)
        response.redirect('/')
      }
      response.redirect('/todos')
    })
  } catch (error) {
    console.log(error)
    request.flash('error', error.errors[0].message)
    response.redirect('/signup')
  }
})

app.post('/todos', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log('Creating a todo', request.body)
  if (!request.body.title.length) {
    request.flash('error', 'Title cannot be empty')
    return response.redirect('/todos')
  }
  if (!request.body.dueDate.length) {
    request.flash('error', 'Due date cannot be empty')
    return response.redirect('/todos')
  }
  console.log('creating new todo', request.body)
  try {
    const todo = await Todo.addTodo({ title: request.body.title, dueDate: request.body.dueDate, completed: false, userId: request.user.id })
    return response.redirect('/todos')
  } catch (error) {
    console.log(error)
    return response.status(422).json(error)
  }
})

app.put('/todos/:id', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log('Mark Todo as completed:', request.params.id)
  try {
    const todo = await Todo.findByPk(request.params.id)
    const updatedtodo = await todo.setCompletionStatus(request.body.completed)
    return response.json(updatedtodo)
  } catch (error) {
    console.log(error)
    return response.status(422).json(error)
  }
})

app.delete('/todos/:id', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log('We have to delete a todo with ID:', request.params.id)
  try {
    await Todo.remove(request.params.id, request.user.id)
    return response.json({ success: true })
  } catch (error) {
    return response.status(422).json(error)
  }
})

module.exports = app
