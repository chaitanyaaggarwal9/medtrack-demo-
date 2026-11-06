import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import App from './App.tsx';

describe('App', () => {
  it('renders the home page heading', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: 'MedTrack' }),
    ).toBeInTheDocument();
  });
});
