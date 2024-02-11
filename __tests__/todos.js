/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const request = require('supertest')
const cheerio = require('cheerio')

const db = require('../models/index')
const app = require('../app')

let server, agent

function extractCsrfToken (res) {
  const $ = cheerio.load(res.text)
  return $('[name=_csrf]').val()
}

const login = async (agent, username, password) => {
  let res = await agent.get('/login')
  const csrfToken = extractCsrfToken(res)
  res = await agent.post('/session').send({
    email: username,
    password,
    _csrf: csrfToken
  })
}

describe('Todo Application', function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true })
    server = app.listen(process.env.PORT || 3000, () => {})
    agent = request.agent(server)
  })
  afterAll(async () => {
    try {
      await db.sequelize.close()
      await server.close()
    } catch (error) {
      console.log(error)
    }
  })

  test('Sign Up', async () => {
    let res = await agent.get('/signup')
    const csrfToken = extractCsrfToken(res)
    res = await agent.post('/users').send({
      firstName: 'Vineetha',
      lastName: 'Reddy',
      email: 'vineetha@gmail.com',
      password: 'abcd',
      _csrf: csrfToken
    })
    expect(res.statusCode).toBe(302)
  })

  test('Sign out', async () => {
    let res = await agent.get('/todos')
    expect(res.statusCode).toBe(200)
    res = await agent.get('/signout')
    expect(res.statusCode).toBe(302)
    res = await agent.get('/todos')
    expect(res.statusCode).toBe(302)
  })

  test('Test for creating a to-do', async () => {
    const agent = request.agent(server)
    await login(agent, 'vineetha@gmail.com', 'abcd')
    const res = await agent.get('/todos')
    const csrfToken = extractCsrfToken(res)
    const response = await agent.post('/todos').send({
      title: 'Sample todo 1',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    })
    expect(response.statusCode).toBe(302)
  })
  test('Test for updating a to-do', async () => {
    const agent = request.agent(server)
    await login(agent, 'vineetha@gmail.com', 'abcd')
    const res = await agent.get('/todos')
    let csrfToken = extractCsrfToken(res)
    await agent.post('/todos').send({
      title: 'Sample todo 2',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    })
    const gropuedTodosResponse = await agent.get('/todos').set('Accept', 'application/json')
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text)

    const dueTodayCount = parsedGroupedResponse.dueToday.length
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1]

    const boolStatus = !latestTodo.completed
    const res1 = await agent.get('/todos')
    csrfToken = extractCsrfToken(res1)

    const newResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({ _csrf: csrfToken, completed: boolStatus })

    const parsedUpdateResponse = JSON.parse(newResponse.text)
    expect(parsedUpdateResponse.completed).toBe(true)
  })
  test('Test for deleting a to-do', async () => {
    const agent = request.agent(server)
    await login(agent, 'vineetha@gmail.com', 'abcd')
    const res = await agent.get('/todos')
    let csrfToken = extractCsrfToken(res)
    await agent.post('/todos').send({
      title: 'Sample todo 3',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    })
    const gropuedTodosResponse = await agent.get('/todos').set('Accept', 'application/json')
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text)

    const dueTodayCount = parsedGroupedResponse.dueToday.length
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1]

    const boolStatus = !latestTodo.completed
    const res1 = await agent.get('/todos')
    csrfToken = extractCsrfToken(res1)

    const newResponse = await agent
      .delete(`/todos/${latestTodo.id}`)
      .send({ _csrf: csrfToken, completed: boolStatus })

    const boolResponse = Boolean(newResponse.text)
    expect(boolResponse).toBe(true)
  })

  test('Test for marking an item as incomplete', async () => {
    const agent = request.agent(server)
    await login(agent, 'vineetha@gmail.com', 'abcd')
    const res = await agent.get('/todos')
    let csrfToken = extractCsrfToken(res)
    await agent.post('/todos').send({
      title: 'Sample todo 4',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    })
    const gropuedTodosResponse = await agent.get('/todos').set('Accept', 'application/json')
    const parsedGroupedResponse = JSON.parse(gropuedTodosResponse.text)

    const dueTodayCount = parsedGroupedResponse.dueToday.length
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1]

    const boolStatus = !latestTodo.completed
    let res1 = await agent.get('/todos')
    csrfToken = extractCsrfToken(res1)

    const newResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({ _csrf: csrfToken, completed: boolStatus })

    const parsedUpdateResponse = JSON.parse(newResponse.text)
    expect(parsedUpdateResponse.completed).toBe(true)

    res1 = await agent.get('/todos')
    csrfToken = extractCsrfToken(res1)

    const anotherResponse = await agent
      .put(`/todos/${latestTodo.id}`)
      .send({ _csrf: csrfToken, completed: !boolStatus })

    const parsedUpdateResponse2 = JSON.parse(anotherResponse.text)
    expect(parsedUpdateResponse2.completed).toBe(false)
  })

  test('User A cannot delete User B Todos', async () => {
    let res = await agent.get('/signup')
    let csrfToken = extractCsrfToken(res)
    res = await agent.post('/users').send({
      firstName: 'Sandhya',
      lastName: 'Rani',
      email: 'sandhya@gmail.com',
      password: 'rani',
      _csrf: csrfToken
    })
    res = await agent.get('/todos')
    csrfToken = extractCsrfToken(res)
    res = await agent.post('/todos').send({
      title: 'Test todo',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    })
    const userA = res.id
    await agent.get('/signout')

    res = await agent.get('/signup')
    csrfToken = extractCsrfToken(res)
    res = await agent.post('/users').send({
      firstName: 'Srinivas',
      lastName: 'Reddy',
      email: 'srini@gmail.com',
      password: 'reddy',
      _csrf: csrfToken
    })

    res = await agent.get('/todos')
    csrfToken = extractCsrfToken(res)
    const parsedResponse = await agent.delete(`/todos/${userA}`).send({
      _csrf: csrfToken
    })
    expect(parsedResponse.statusCode).toBe(422)
  })
  test('User A cannot update User B Todos', async () => {
    let res = await agent.get('/signup')
    let csrfToken = extractCsrfToken(res)
    res = await agent.post('/users').send({
      firstName: 'Sandhya',
      lastName: 'Rani',
      email: 'sandhya@gmail.com',
      password: 'rani',
      _csrf: csrfToken
    })
    res = await agent.get('/todos')
    csrfToken = extractCsrfToken(res)
    res = await agent.post('/todos').send({
      title: 'Test todo',
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken
    })
    const userA = res.id
    await agent.get('/signout')

    res = await agent.get('/signup')
    csrfToken = extractCsrfToken(res)
    res = await agent.post('/users').send({
      firstName: 'Srinivas',
      lastName: 'Reddy',
      email: 'srini@gmail.com',
      password: 'reddy',
      _csrf: csrfToken
    })

    res = await agent.get('/todos')
    csrfToken = extractCsrfToken(res)
    const parsedResponse = await agent.put(`/todos/${userA}`).send({
      _csrf: csrfToken,
      completed: true
    })
    expect(parsedResponse.statusCode).toBe(422)
  })
})
