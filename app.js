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

const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

app.post('/add-natural', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const prompt = req.body.title;
  const userId=req.user.id;
  try {
    await getTitleAndDateFromGemini(prompt,userId)

    return res.redirect('/todos')
  } catch (error) {
    console.error('Error adding todo with Gemini API:', error)
    req.flash('error', 'Error adding todo with Gemini API: ' + error.message)
    return res.redirect('/todos')
  }
})

async function getTitleAndDateFromGemini (prompt,userId) {
  try {
    const currentDate = new Date().toISOString().slice(0, 10);
    const systemPrompt = 
      "You are assisting a user in managing their tasks within a to-do application. Users can create, delete, or mark tasks as complete. Your job is to analyze the user input and categorize it into one of three actions"+
      "CASE 1: CREATE "+
      "Users will input a sentence describing a task, potentially including a due date explicitly or implicitly (e.g., 'today', 'tomorrow'). "+
      "Your task is to analyze the input sentence, extracting the task title and its due date if mentioned. "+
      "If a due date is provided , include it in the output directly in the format YYYY-MM-DD ; "+
      "otherwise, extract the task title and analyze its urgency to decide on a due date yourself. "+
      `Make sure to use the current date ${currentDate} to compute any relative dates. `+
      "Return 'Action : Title @ Due Date' (YYYY-MM-DD format). Here action is create . Sample return example : 'Create : Buy groceries @ 2024-04-24' "+
      "CASE 2: DELETE Users want to delete certain tasks, like 'delete all completed todos'. Return 'Action: Condition' (completed, overdue, due later, due today). Here action is delete. Sample return example : 'Delete : completed'"+
      "CASE 3: MARKASCOMPLETE Users want to mark tasks as complete, e.g., 'mark all overdue todos as complete'. Return 'Action: Condition' (overdue, due later, due today). Your task is to return a single sentence in the specified format for the given user input. Here action is mark. Sample return example : 'Mark : overdue'"+
      "Important things to keep in mind while returning, The output format should be consistent, dont write action followed by the actual action just directly give the action, title and due date sepearated by : "
      "USER INPUT IS :";

    const suggestion = await askGemini(systemPrompt + ' ' + prompt)
    console.log("original here",suggestion);
    const [action, data] = suggestion.split(':').map(str => str.trim());

    if (action.toLowerCase() === 'create') {
      const  [title, date] = data.split('@').map(str => str.trim());

      console.log("data",data);
      console.log('Extracted title and date: ', title, date)
      if (!title || !date) {
        throw new Error('Unable to extract the title and date from the suggestion.')
      }

      const dueDate = new Date(date)
      if (isNaN(dueDate.getTime())) {
        throw new Error('Invalid due date format.')
      }
      
      await Todo.addTodo({
        title,
        dueDate,
        completed: false,
        userId
      })

    } else if (action.toLowerCase() === 'delete') {
      try {
        const todosToDelete = await getTodosByCondition(data, userId); 
        if (todosToDelete){
          await Promise.all(todosToDelete.map(async (todo) => {
            await Todo.remove(todo.id, userId);
        }));
        } else{
          console.log("Empty todo list");
        }
        console.log("Todos deleted successfully");
    } catch (error) {
        Sentry.captureException(error); 
        return response.status(422).json(error);
    }

    } else if (action.toLowerCase() === 'mark') {
      try {
        const todosToMarkComplete = await getTodosByCondition(data, userId); 
        if(todosToMarkComplete){
          await Promise.all(todosToMarkComplete.map(async (todo) => {
            const updatedTodo = await todo.setCompletionStatus(true); 
            return updatedTodo;
        }));
        }else{
          console.log("Empty todo list");
        }
    } catch (error) {
        console.log(error);
        Sentry.captureException(error); 
        return response.status(422).json(error);
    }
    } else {
      throw new Error('Invalid action extracted from the suggestion.');
    }
  } catch (error) {
    console.error('Error getting action and conditions from Gemini API:', error);
    throw error;
  }
}

async function getTodosByCondition(conditions,loggedInUser) {
  try {
    const overdue = await Todo.overdue(loggedInUser);
    const dueLater = await Todo.dueLater(loggedInUser);
    const dueToday = await Todo.dueToday(loggedInUser);
    const completedItems = await Todo.completedItems(loggedInUser);

    if (conditions.includes('completed')) {
      return completedItems;
    }

    if (conditions.includes('overdue' || 'over due')) {
      return overdue;
    }

    if (conditions=='duelater' || conditions=='due later') {
      return dueLater;
    }

    if (conditions=='duetoday' || conditions=='due today') {
      return dueToday;
    }
  } catch (error) {
    console.error('Error fetching todos to delete:', error);
    throw error;
  }
}

async function askGemini (prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = await response.text()
    console.log('Input by user:', text)
    return text
  } catch (error) {
    console.error('Error making a query to Gemini API:', error)
    return null
  }
}

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
    const user = await User.addUser({
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
    request.flash('error', error.errors[0].message);
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

app.get(
  "/edit_todo/:name/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const todo = await Todo.getTodoById(request.params.id);
    if (todo.userId == request.user.id) {
      const todo_name = todo.todo_name;
      const todo_id = request.params.id;
      response.render("edit_todo", {
        todo_name,
        todo_id,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.status(401).json({ message: "Unauthorized user." });
    }
  }
);


module.exports = app;