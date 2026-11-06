import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App.tsx';

describe('App', () => {
  it('shows the landing page at /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'MedTrack Demo' }),
    ).toBeInTheDocument();
  });
});
