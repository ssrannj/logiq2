describe('🔴 Form Validation', () => {
  describe('Login Form Validation', () => {
    beforeEach(() => {
      cy.visit('/auth');
    });

    it('shows browser validation for empty login form', () => {
      cy.get('#login-email').should('have.attr', 'required');
      cy.get('#login-password').should('have.attr', 'required');

      cy.contains('button', 'Sign In').click();

      cy.url().should('include', '/auth');

      cy.screenshot('03_validation_empty_login_form');
    });

    it('rejects invalid email format', () => {
      cy.get('#login-email').type('not-an-email');
      cy.get('#login-password').type('password123');

      cy.get('#login-email').then(($input) => {
        expect($input[0].validity.valid).to.be.false;
      });

      cy.screenshot('03_validation_invalid_email_format');
    });

    it('shows error for wrong credentials with short-looking password', () => {
      cy.get('#login-email').type('test@example.com');
      cy.get('#login-password').type('abc');

      cy.contains('button', 'Sign In').click();

      cy.get('.bg-red-50').should('be.visible');

      cy.screenshot('03_validation_short_password_error');
    });
  });

  describe('Register Form Validation', () => {
    beforeEach(() => {
      cy.visit('/auth');
      cy.contains('button', 'Register').click();
    });

    it('enforces minimum password length of 6 characters', () => {
      cy.get('#reg-fullName').type('Test User');
      cy.get('#reg-email').type('valtest@example.com');
      cy.get('#reg-phone').type('+94771234567');
      cy.get('#reg-password').type('abc');
      cy.get('#reg-confirm').type('abc');

      cy.contains('button', 'Create Account').click();

      cy.contains('Password must be at least 6 characters').should('be.visible');

      cy.screenshot('03_validation_register_short_password');
    });

    it('shows required field validation for empty register form', () => {
      cy.get('#reg-fullName').should('have.attr', 'required');
      cy.get('#reg-email').should('have.attr', 'required');
      cy.get('#reg-phone').should('have.attr', 'required');

      cy.contains('button', 'Create Account').click();

      cy.url().should('include', '/auth');

      cy.screenshot('03_validation_empty_register_form');
    });
  });
});
