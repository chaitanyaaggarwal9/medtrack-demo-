import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AboutPage from './AboutPage.tsx';

function renderAbout() {
  render(
    <MemoryRouter>
      <AboutPage />
    </MemoryRouter>,
  );
}

describe('AboutPage', () => {
  it('renders the page heading', () => {
    renderAbout();
    expect(
      screen.getByRole('heading', { level: 1, name: 'About MedTrack Demo' }),
    ).toBeInTheDocument();
  });

  it('says it is a learning project and all data is fake', () => {
    renderAbout();
    expect(
      screen.getByRole('heading', { name: 'A learning project' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'All data is fake' }),
    ).toBeInTheDocument();
  });

  it('shows the medical disclaimer', () => {
    renderAbout();
    expect(
      screen.getByText(/For education only\. Not medical advice\./),
    ).toBeInTheDocument();
  });

  it('has a link back to the home page', () => {
    renderAbout();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
