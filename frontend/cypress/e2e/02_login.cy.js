describe('🔵 User Login', () => {
  beforeEach(() => {
    cy.visit('/auth');
  });

  it('valid login redirects to customer dashboard', () => {
    cy.get('#login-email').type('customer@mangala.lk');
    cy.get('#login-password').type('cust123');

    cy.contains('button', 'Sign In').click();

    cy.url().should('include', '/dashboard');
    cy.contains('My Orders').should('be.visible');

    cy.screenshot('02_login_valid_redirect_dashboard');
  });

  it('admin valid login redirects to admin dashboard', () => {
    cy.get('#login-email').type('admin@mangala.lk');
    cy.get('#login-password').type('admin123');

    cy.contains('button', 'Sign In').click();

    cy.url().should('include', '/admin');

    cy.screenshot('02_login_admin_redirect');
  });

  it('invalid credentials show error message', () => {
    cy.get('#login-email').type('wrong@example.com');
    cy.get('#login-password').type('wrongpassword');

    cy.contains('button', 'Sign In').click();

    cy.get('.bg-red-50')
      .should('be.visible')
      .and('contain', 'Invalid email or password');

    cy.screenshot('02_login_invalid_credentials_error');
  });
});
