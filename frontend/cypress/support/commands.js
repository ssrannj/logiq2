const API = 'http://localhost:8080';

Cypress.Commands.add('loginAs', (email, password) => {
  cy.request('POST', `${API}/api/auth/login`, { email, password }).then((res) => {
    const userData = res.body;
    localStorage.setItem('user', JSON.stringify(userData));
  });
});

Cypress.Commands.add('loginAsAdmin', () => {
  cy.loginAs('admin@mangala.lk', 'admin123');
});

Cypress.Commands.add('loginAsCustomer', () => {
  cy.loginAs('customer@mangala.lk', 'cust123');
});

Cypress.Commands.add('switchToRegister', () => {
  cy.visit('/auth');
  cy.contains('button', 'Register').click();
});
