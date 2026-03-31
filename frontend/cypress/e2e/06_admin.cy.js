describe('🟡 Admin Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('admin can log in and view the admin dashboard', () => {
    cy.visit('/admin');

    cy.url().should('include', '/admin');
    cy.contains('Overview').should('be.visible');
    cy.contains('Orders').should('be.visible');
    cy.contains('Inventory').should('be.visible');

    cy.screenshot('06_admin_dashboard_loaded');
  });

  it('admin can navigate to orders tab and view orders', () => {
    cy.visit('/admin');

    cy.contains('button', 'Orders').click();

    cy.get('table').should('be.visible');
    cy.get('tbody tr').should('have.length.greaterThan', 0);

    cy.screenshot('06_admin_orders_tab');
  });

  it('admin can change order status to Order Confirmed', () => {
    cy.visit('/admin');

    cy.contains('button', 'Orders').click();

    cy.get('tbody tr').first().within(() => {
      cy.get('select').then(($select) => {
        const currentStatus = $select.val();
        cy.log(`Current order status: ${currentStatus}`);

        cy.wrap($select).select('ORDER_CONFIRMED');

        cy.wrap($select).should('have.value', 'ORDER_CONFIRMED');
      });
    });

    cy.wait(1500);

    cy.get('tbody tr').first().within(() => {
      cy.get('select').should('have.value', 'ORDER_CONFIRMED');
    });

    cy.screenshot('06_admin_order_status_confirmed');
  });

  it('admin can view order overview statistics', () => {
    cy.visit('/admin');

    cy.get('body').should('contain.text', 'Rs.');

    cy.screenshot('06_admin_overview_stats');
  });
});
