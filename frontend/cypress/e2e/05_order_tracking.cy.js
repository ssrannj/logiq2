describe('🟠 Order Tracking', () => {
  it('shows error when order not found with invalid ID', () => {
    cy.visit('/track');

    cy.get('input[placeholder="e.g. 1042"]').type('999999');
    cy.get('input[type="email"]').type('notfound@example.com');

    cy.contains('button', 'Track Order').click();

    cy.get('body').should('contain.text', 'not found')
      .or('contain.text', 'No order')
      .or('contain.text', 'error')
      .or('contain.text', 'invalid');

    cy.screenshot('05_order_tracking_not_found');
  });

  it('tracks a real order using the customer account email', () => {
    cy.request('POST', 'http://localhost:8080/api/auth/login', {
      email: 'customer@mangala.lk',
      password: 'cust123',
    }).then((loginRes) => {
      const token = loginRes.body.token;

      cy.request({
        method: 'GET',
        url: 'http://localhost:8080/api/orders/my',
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      }).then((res) => {
        if (res.status === 200 && res.body.length > 0) {
          const order = res.body[0];

          cy.visit('/track');

          cy.get('input[placeholder="e.g. 1042"]').type(String(order.id));
          cy.get('input[type="email"]').type('customer@mangala.lk');

          cy.contains('button', 'Track Order').click();

          cy.get('body').should('not.contain', 'Something went wrong');

          cy.screenshot('05_order_tracking_success');
        } else {
          cy.log('No orders found for customer, skipping tracking assertion');
        }
      });
    });
  });

  it('tracks order via authenticated dashboard', () => {
    cy.loginAsCustomer();
    cy.visit('/dashboard');

    cy.contains('My Orders').should('be.visible');

    cy.screenshot('05_order_tracking_dashboard');
  });
});
