/* eslint-disable no-unused-vars */
const {request, response} = require('express');
const express = require('express');
const app = express();
const csrf = require('tiny-csrf');

const {Todo, User} = require('./models');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');

const bcrypt = require('bcrypt');
const saltRounds = 10;
const path = require('path');

const i18next = require('./i18n');
const middleware = require('i18next-http-middleware');
app.use(middleware.handle(i18next));

require('dotenv').config();

const flash = require('connect-flash');

app.use(express.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.use(flash());
const user = require('./models/user');

app.use(bodyParser.json());
app.use(cookieParser('ssh!!!! some secret string'));
app.use(csrf('this_should_be_32_character_long', ['POST', 'PUT', 'DELETE']));

app.use(
    session({
      secret: process.env.SECRET_KEY,
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
      },
    }),
);

app.use(passport.initialize());
app.use(passport.session());

app.use((request, response, next) => {
  response.locals.messages = request.flash();
  next();
});

//level 9

const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
  dsn: process.env.DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    nodeProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});

app.use(function onError(err, req, res, next) {
  Sentry.captureException(err);
  next(err);
});

passport.use(
  new LocalStrategy(
      {
        usernameField: 'email',
        password: 'password',
      },
      (username, password, done) => {
        User.findOne({where: {email: username}})
            .then(async (user) => {
              const result = await bcrypt.compare(password, user.password);
              if (result) {
                return done(null, user);
              } else {
                return done(null, false, {message: i18next.t('invalidPassword')});
              }
            })
            .catch((error) => {
              return done(null, false, {message: i18next.t('invalidCredentials')});
            });
      },
  ),
);

passport.serializeUser((user, done) => {
  console.log(`[Worker ${process.pid}] Serializing user in session ${user.id}`);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
      .then((user) => {
        done(null, user);
      })
      .catch((error) => {
        Sentry.captureException(error);
        done(error, null);
      });
});


app.set('view engine', 'ejs');

//lvl 10

// const OpenAI = require("openai"); 

// const openai = new OpenAI({
// apikey: process.env["OPENAI_API_KEY"], 
// });

// async function askChatGPT(question) {
//   try {
//     const chatCompletion = await openai.chat.completions.create({ 
//        messages: [{ role: "user", content: question}],
//        model: "gpt-3.5-turbo",
//     });
    
//     return chatCompletion.choices[0].message.content;
//   } catch (error) {
//     console.error("Error making a query to ChatGPT:", error);
//     return null;
//   }
// }

// async function addTodoWithChatGPT (question){
//   const suggestion = await askChatGPT (question);
//   if (suggestion) {
//     console.log("Response from ChatGPT:", suggestion);
//   } else {
//     console.log("No response received from ChatGPT.");
//   }
// }  


app.get('/', async (request, response) => {
  try {
    const title = i18next.t('Todo Application');
    const csrfToken = await request.csrfToken();
    response.render('index', {
      title: title,
      csrfToken: csrfToken,
      i18next: i18next,
    });
  } catch (error) {
    Sentry.captureException(error);
  }
});

app.get(
    '/todos',
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      try {
      const loggedInUser = request.user.id;
      const allTodos = await Todo.getTodos();
      const overdue = await Todo.overdue(loggedInUser);
      const dueLater = await Todo.dueLater(loggedInUser);
      const dueToday = await Todo.dueToday(loggedInUser);
      const completedItems = await Todo.completedItems(loggedInUser);
      const userLocale = i18next.language;

      const date = new Date();

      // Date formatter
      const dateFormatter = new Intl.DateTimeFormat(userLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Time formatter
      const timeFormatter = new Intl.DateTimeFormat(userLocale, {
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      });

      const formattedDate = dateFormatter.format(date);
      const formattedTime = timeFormatter.format(date);

      if (request.accepts("html")) {
        response.render("todos", {
          allTodos,
          overdue,
          dueLater,
          dueToday,
          csrfToken: request.csrfToken(),
          completedItems,
          i18next: i18next,
          userLocale,
          formattedDate,
          formattedTime,
        });
      } else {
        response.json({ overdue, dueLater, dueToday, completedItems });
      }
      } catch (error) {
        Sentry.captureException(error);
      }
    },
);

app.get('/signup', (request, response) => {
  try {
    response.render('signup', {
      title: 'Signup',
      csrfToken: request.csrfToken(),
      i18next: i18next,
    });
  } catch (error) {
      Sentry.captureException(error);
  }
});

app.get('/login', (request, response) => {
  try {
    response.render('login', {
      title: i18next.t('login'),
      csrfToken: request.csrfToken(),
      i18next: i18next,
    });
  } catch (error) {
      Sentry.captureException(error);
  }
});

app.post('/toggle-lang', (req, res) => {
  try {
    console.log("Current Language",i18next.language);

    const requestedLang = req.body.language;
    console.log("User request Language",requestedLang);

    const supportedLanguages = ["en", "te", "hi", "de", "ja", "fr"];

    if (supportedLanguages.includes(requestedLang)) {
      i18next.changeLanguage(requestedLang);
    }

    setTimeout(() => {
      console.log("Updated Language", i18next.language);
    }, 500);

    res.redirect(req.get("referer") || "/");  
  } catch (error) {
    Sentry.captureException(error);
  }
});

app.post('/add-natural',(req,res) => {
   addTodoWithChatGPT(req.body.title);
  res.redirect(req.get("referer") || "/");  
});

app.post(
    '/session',
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: true,
    }),
    async (request, response) => {
      console.log(request.user);
      response.redirect('/todos');
    },
);

app.get('/signout', (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect('/');
  });
});

app.post('/users', async (request, response) => {
  if (!request.body.firstName) {
    request.flash('error', i18next.t('firstNameEmpty'));
    return response.redirect('/signup');
  }
  if (!request.body.email) {
    request.flash('error', i18next.t('emailEmpty'));
    return response.redirect('/signup');
  }

  if (!request.body.password) {
    request.flash('error', i18next.t('passwordEmpty'));
    return response.redirect('/signup');
  }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.redirect('/');
      }
      response.redirect('/todos');
    });
  } catch (error) {
    console.log(error);
    // request.flash('error', error.errors[0].message);
    response.redirect('/signup');
  }
});

app.post(
    '/todos',
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      if (!request.body.title.length) {
        request.flash('error', i18next.t('titleEmpty'));
        return response.redirect('/todos');
      }
      if (!request.body.dueDate.length) {
        request.flash('error', i18next.t('dueDateEmpty'));
        return response.redirect('/todos');
      }
      try {
        const todo = await Todo.addTodo({
          title: request.body.title,
          dueDate: request.body.dueDate,
          completed: false,
          userId: request.user.id,
        });
        return response.redirect('/todos');
      } catch (error) {
        console.log(error);
        Sentry.captureException(error); 
        return response.status(422).json(error);
      }
    },
);

app.put(
    '/todos/:id',
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      console.log('Mark Todo as completed:', request.params.id);
      try {
        const todo = await Todo.findByPk(request.params.id);
        const updatedtodo = await todo.setCompletionStatus(
            request.body.completed,
        );
        return response.json(updatedtodo);
      } catch (error) {
        console.log(error);
        Sentry.captureException(error); 
        return response.status(422).json(error);
      }
    },
);

app.delete(
    '/todos/:id',
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      console.log('We have to delete a todo with ID:', request.params.id);
      try {
        await Todo.remove(request.params.id, request.user.id);
        return response.json({success: true});
      } catch (error) {
        Sentry.captureException(error); 
        return response.status(422).json(error);
      }
    },
);

module.exports = app;