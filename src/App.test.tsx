import { fireEvent, render, screen } from '@testing-library/react';
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

  it("shows today's checklist at /app", () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: "Today's checklist" }),
    ).toBeInTheDocument();
  });

  it('About this app on the landing page goes to /about', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'About this app' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'About MedTrack Demo' }),
    ).toBeInTheDocument();
  });

  it('Get started on the landing page goes to /app', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Get started' }));
    expect(
      screen.getByRole('heading', { level: 1, name: "Today's checklist" }),
    ).toBeInTheDocument();
  });
});
