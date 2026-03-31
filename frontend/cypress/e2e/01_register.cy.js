describe('🟢 User Registration', () => {
  const timestamp = Date.now();
  const testEmail = `testuser_${timestamp}@example.com`;

  beforeEach(() => {
    cy.visit('/auth');
    cy.contains('button', 'Register').click();
  });

  it('registers a new user with valid data and shows success message', () => {
    cy.get('#reg-fullName').type('Test User');
    cy.get('#reg-email').type(testEmail);
    cy.get('#reg-phone').type('+94771234567');
    cy.get('#reg-password').type('password123');
    cy.get('#reg-confirm').type('password123');

    cy.contains('button', 'Create Account').click();

    cy.get('.bg-green-50')
      .should('be.visible')
      .and('contain', 'Account created');

    cy.screenshot('01_register_success');
  });

  it('shows error when email is already registered', () => {
    cy.get('#reg-fullName').type('Existing User');
    cy.get('#reg-email').type('customer@mangala.lk');
    cy.get('#reg-phone').type('+94771234567');
    cy.get('#reg-password').type('password123');
    cy.get('#reg-confirm').type('password123');

    cy.contains('button', 'Create Account').click();

    cy.get('.bg-red-50, .text-red-500')
      .should('be.visible');

    cy.screenshot('01_register_duplicate_email_error');
  });

  it('shows field error when passwords do not match', () => {
    cy.get('#reg-fullName').type('Test User');
    cy.get('#reg-email').type(`mismatch_${timestamp}@example.com`);
    cy.get('#reg-phone').type('+94771234567');
    cy.get('#reg-password').type('password123');
    cy.get('#reg-confirm').type('differentpassword');

    cy.contains('button', 'Create Account').click();

    cy.contains('Passwords do not match').should('be.visible');

    cy.screenshot('01_register_password_mismatch');
  });
});
