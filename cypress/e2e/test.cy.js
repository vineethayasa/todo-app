/* eslint-disable require-jsdoc */
function formatDateWithOffset(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function login(email, password) {
  cy.visit(`http://localhost:3000/login`);
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('form').submit();
  cy.visit(`http://localhost:3000/todos`);
}

describe('Todo Application', () => {
  const baseUrl = 'http://localhost:3000';
  beforeEach(() => {
    cy.visit(baseUrl);
  });

  // it('Sign up', () => {
  //   cy.visit(`${baseUrl}/signup`);
  //   cy.get('input[name="firstName"]').type('Vineetha');
  //   cy.get('input[name="lastName"]').type('Reddy');
  //   cy.get('input[name="email"]').type('vineetha@test.com');
  //   cy.get('input[name="password"]').type('12345678');
  //   cy.get('button[type="submit"]').click();
  //   cy.log('Current URL:', cy.url());
  // });

  // it('Sign out', () => {
  //   cy.visit(`${baseUrl}/todos`);
  //   cy.request(`${baseUrl}/signout`);
  // });

  // it('Login', () => {
  //   cy.visit(`${baseUrl}/login`);
  //   cy.get('input[name="email"]').type('vineetha@test.com');
  //   cy.get('input[name="password"]').type('12345678');

  //   cy.get('form').submit();
  //   cy.visit(`${baseUrl}/todos`);
  // });

  // it('Should not Login with invalid credentials', () => {
  //   cy.visit(`${baseUrl}/login`);
  //   cy.get('input[name="email"]').type('nonexistentuser@test.com');
  //   cy.get('input[name="password"]').type('invalidpassword');

  //   cy.get('form').submit();
  //   cy.url().should('include', '/login');
  // });

  // it('Creating a sample todo', () => {
  //   login('vineetha@test.com', '12345678');

  //   cy.visit(`${baseUrl}/todos`);
  //   cy.get('input[name="title"]').type('Sample todo item');
  //   cy.get('input[name="dueDate"]').type(formatDateWithOffset(0));

  //   cy.get('button[type="submit"]').click();
  //   cy.wait(500);

  //   cy.get('.Todo-Item').contains('Sample todo item').should('exist');
  // });
});
