describe('classroomio dashboard', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173');
  });

  it('shows the signup and login button', () => {
    cy.get('nav button').should('have.length', 2);

    cy.get('nav button').first().contains('Login');
    cy.get('nav button').last().contains('Sign Up');
  });

  it('can redirect to login page', () => {
    cy.get('nav button').first().contains('Login').click();

    cy.url().should('contain', '/login');

    cy.contains('Welcome back').should('be.visible');

    cy.get('form button[type="submit"]').contains('Log In');
  });

  it('can redirect to signup page', () => {
    cy.get('nav button').first().contains('Signup').click();

    cy.url().should('contain', '/signup');

    cy.contains('Welcome back').should('be.visible');

    cy.get('form button[type="submit"]').contains('Create Account');
  });
});
