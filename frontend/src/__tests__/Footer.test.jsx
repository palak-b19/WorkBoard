import { render, screen } from '@testing-library/react';
import React from 'react';
import Footer from '../components/Footer';

describe('Footer component', () => {
  it('renders footer content', () => {
    render(<Footer />);
    expect(screen.getByText(/© 2025 Task Manager/i)).toBeInTheDocument();
  });
});
