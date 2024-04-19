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
  cy.get('#signInButton').click();
  cy.visit(`http://localhost:3000/todos`);
}

describe('Todo Application', () => {
  const baseUrl = 'http://localhost:3000';
  beforeEach(() => {
    cy.visit(baseUrl);
  });

  it('Sign up', () => {
    cy.visit(`${baseUrl}/signup`);
    cy.get('input[name="firstName"]').type('Vineetha');
    cy.get('input[name="lastName"]').type('Reddy');
    cy.get('input[name="email"]').type('vineetha@test.com');
    cy.get('input[name="password"]').type('12345678');
    cy.get('#signUpButton').click();
    
  });

  it('Sign out', () => {
    cy.visit(`${baseUrl}/todos`);
    cy.request(`${baseUrl}/signout`);
  });

  it('Login', () => {
    cy.visit(`${baseUrl}/login`);
    cy.get('input[name="email"]').type('vineetha@test.com');
    cy.get('input[name="password"]').type('12345678');

    cy.get('#signInButton').click();
    cy.url().should('include', '/todos');
  });

  it('Should not Login with invalid credentials', () => {
    cy.visit(`${baseUrl}/login`);
    cy.get('input[name="email"]').type('nonexistentuser@test.com');
    cy.get('input[name="password"]').type('invalidpassword');

    cy.get('#signInButton').click();
    cy.url().should('include', '/login');
  });

  it('Creating a sample todo', () => {
    login('vineetha@test.com', '12345678');
  
    cy.visit(`${baseUrl}/todos`);
  
    cy.get('meta[name="csrf-token"]').then((meta) => {
      const csrfToken = meta.attr('content');
  
      cy.request({
        method: 'POST',
        url: `${baseUrl}/todos`,
        form: true,
        body: {
          _csrf: csrfToken, 
          title: 'Sample todo item',
          dueDate: formatDateWithOffset(0),
        },
      }).then((response) => {
        expect(response.status).to.equal(200);
      });
    });
  });
  it('Deleting a todo', () => {
    login('vineetha@test.com', '12345678');

    cy.visit(`${baseUrl}/todos`);

    cy.get('meta[name="csrf-token"]').then((meta) => {
        const csrfToken = meta.attr('content');

        cy.request({
            method: 'POST',
            url: `${baseUrl}/todos`,
            form: true,
            body: {
                _csrf: csrfToken,
                title: 'Sample todo for deletion',
                dueDate: formatDateWithOffset(0),
            },
        }).then((response) => {
          expect(response.status).to.equal(200);
        });
    });
});
it('Marking a todo as complete', () => {
  login('vineetha@test.com', '12345678');

  cy.visit(`${baseUrl}/todos`);

  cy.get('meta[name="csrf-token"]').then((meta) => {
    const csrfToken = meta.attr('content');

    cy.request({
      method: 'POST',
      url: `${baseUrl}/todos`,
      form: true,
      body: {
        _csrf: csrfToken, 
        title: 'Sample todo item new',
        dueDate: formatDateWithOffset(0),
      },
    }).then((response) => {
      expect(response.status).to.equal(200);
    });
  });
});
});
