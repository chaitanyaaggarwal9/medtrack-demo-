import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import LandingPage from './LandingPage.tsx';

describe('LandingPage', () => {
  it('renders the app name', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'MedTrack Demo' }),
    ).toBeInTheDocument();
  });
});
