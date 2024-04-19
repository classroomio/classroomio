describe('classroomio dashboard', () => {
  beforeEach(() => {
    cy.visit('https://app.classroomio.com');
  });

  it('shows the signup and login button', () => {
    cy.get('nav button').should('have.length', 2);

    cy.get('nav button').first().should('have.text', 'Login');
    cy.get('nav button').last().should('have.text', 'Sign Up');
  });

  it('can redirect to login page', () => {
    cy.get('nav button').first().click();
    cy.wait(500);

    cy.contains('Welcome back').should('be.visible');

    cy.get('form button').first().should('have.text', 'Log In');
  });

  it('can redirect to signup page', () => {
    cy.get('nav button').first().click();
    cy.wait(500);

    cy.contains('Create a free account').should('be.visible');

    cy.get('form button').first().should('have.text', 'Create Account');
  });
});
