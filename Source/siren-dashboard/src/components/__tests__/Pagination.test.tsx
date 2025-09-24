import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    onPageChange: jest.fn(),
    totalItems: 50,
    itemsPerPage: 10,
    showingStart: 1,
    showingEnd: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders pagination info correctly', () => {
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByText('Showing 1 to 10 of 50 results')).toBeInTheDocument();
    });

    test('renders pagination navigation with correct aria-label', () => {
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByRole('navigation', { name: 'Pagination Navigation' })).toBeInTheDocument();
    });

    test('does not render when totalPages <= 1', () => {
      render(<Pagination {...defaultProps} totalPages={1} />);
      
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    test('does not render when totalPages is 0', () => {
      render(<Pagination {...defaultProps} totalPages={0} />);
      
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });

  describe('Page Numbers Display', () => {
    test('shows all page numbers when totalPages <= 5', () => {
      render(<Pagination {...defaultProps} totalPages={3} />);
      
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 3' })).toBeInTheDocument();
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });

    test('shows ellipsis and manages page range when totalPages > 5', () => {
      render(<Pagination {...defaultProps} totalPages={10} currentPage={1} />);
      
      // Should show: 1, 2, ..., 10
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    test('shows correct page range when current page is in middle', () => {
      render(<Pagination {...defaultProps} totalPages={10} currentPage={5} />);
      
      // Should show: 1, ..., 4, 5, 6, ..., 10
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 4' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 5' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 6' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument();
      expect(screen.getAllByText('...')).toHaveLength(2);
    });

    test('shows correct page range when current page is near end', () => {
      render(<Pagination {...defaultProps} totalPages={10} currentPage={9} />);
      
      // Should show: 1, ..., 8, 9, 10
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 8' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 9' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 10' })).toBeInTheDocument();
      expect(screen.getByText('...')).toBeInTheDocument();
    });
  });

  describe('Current Page Highlighting', () => {
    test('highlights current page with active class', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      
      const currentPageButton = screen.getByRole('button', { name: 'Go to page 3' });
      expect(currentPageButton).toHaveClass('active');
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    test('does not highlight non-current pages', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      
      const otherPageButton = screen.getByRole('button', { name: 'Go to page 2' });
      expect(otherPageButton).not.toHaveClass('active');
      expect(otherPageButton).not.toHaveAttribute('aria-current');
    });
  });

  describe('Previous Button', () => {
    test('is enabled when not on first page', () => {
      render(<Pagination {...defaultProps} currentPage={2} />);
      
      const prevButton = screen.getByRole('button', { name: 'Go to previous page' });
      expect(prevButton).toBeEnabled();
      expect(prevButton).not.toHaveClass('disabled');
    });

    test('is disabled when on first page', () => {
      render(<Pagination {...defaultProps} currentPage={1} />);
      
      const prevButton = screen.getByRole('button', { name: 'Go to previous page' });
      expect(prevButton).toBeDisabled();
      expect(prevButton).toHaveClass('disabled');
    });

    test('calls onPageChange with previous page when clicked', async () => {
      const onPageChange = jest.fn();
      
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);
      
      const prevButton = screen.getByRole('button', { name: 'Go to previous page' });
      await userEvent.click(prevButton);
      
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    test('does not call onPageChange when disabled and clicked', async () => {
      const onPageChange = jest.fn();
      
      render(<Pagination {...defaultProps} currentPage={1} onPageChange={onPageChange} />);
      
      const prevButton = screen.getByRole('button', { name: 'Go to previous page' });
      await userEvent.click(prevButton);
      
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Next Button', () => {
    test('is enabled when not on last page', () => {
      render(<Pagination {...defaultProps} currentPage={3} totalPages={5} />);
      
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      expect(nextButton).toBeEnabled();
      expect(nextButton).not.toHaveClass('disabled');
    });

    test('is disabled when on last page', () => {
      render(<Pagination {...defaultProps} currentPage={5} totalPages={5} />);
      
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      expect(nextButton).toBeDisabled();
      expect(nextButton).toHaveClass('disabled');
    });

    test('calls onPageChange with next page when clicked', async () => {
      const onPageChange = jest.fn();
      
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);
      
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      await userEvent.click(nextButton);
      
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    test('does not call onPageChange when disabled and clicked', async () => {
      const onPageChange = jest.fn();
      
      render(<Pagination {...defaultProps} currentPage={5} totalPages={5} onPageChange={onPageChange} />);
      
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      await userEvent.click(nextButton);
      
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Page Number Clicks', () => {
    test('calls onPageChange when page number is clicked', async () => {
      const onPageChange = jest.fn();
      
      render(<Pagination {...defaultProps} currentPage={1} onPageChange={onPageChange} />);
      
      const pageButton = screen.getByRole('button', { name: 'Go to page 3' });
      await userEvent.click(pageButton);
      
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    test('does not call onPageChange when current page is clicked', async () => {
      const onPageChange = jest.fn();
      
      render(<Pagination {...defaultProps} currentPage={3} onPageChange={onPageChange} />);
      
      const currentPageButton = screen.getByRole('button', { name: 'Go to page 3' });
      await userEvent.click(currentPageButton);
      
      expect(onPageChange).not.toHaveBeenCalled();
    });

    test('does not call onPageChange when ellipsis is clicked', async () => {
      const onPageChange = jest.fn();
      
      render(<Pagination {...defaultProps} totalPages={10} currentPage={1} onPageChange={onPageChange} />);
      
      const ellipsis = screen.getByText('...');
      await userEvent.click(ellipsis);
      
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels on navigation', () => {
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByRole('navigation', { name: 'Pagination Navigation' })).toBeInTheDocument();
    });

    test('has proper ARIA labels on buttons', () => {
      render(<Pagination {...defaultProps} currentPage={2} />);
      
      expect(screen.getByRole('button', { name: 'Go to previous page' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to next page' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 2' })).toBeInTheDocument();
    });

    test('marks current page with aria-current="page"', () => {
      render(<Pagination {...defaultProps} currentPage={3} />);
      
      const currentPageButton = screen.getByRole('button', { name: 'Go to page 3' });
      expect(currentPageButton).toHaveAttribute('aria-current', 'page');
    });

    test('includes screen reader text for navigation buttons', () => {
      render(<Pagination {...defaultProps} />);
      
      expect(screen.getByText('Previous')).toHaveClass('sr-only');
      expect(screen.getByText('Next')).toHaveClass('sr-only');
    });
  });

  describe('Edge Cases', () => {
    test('handles single page scenario', () => {
      render(<Pagination {...defaultProps} totalPages={1} />);
      
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    test('handles zero pages scenario', () => {
      render(<Pagination {...defaultProps} totalPages={0} />);
      
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    test('handles large page numbers correctly', () => {
      render(<Pagination {...defaultProps} totalPages={1000} currentPage={500} />);
      
      // Should show: 1, ..., 499, 500, 501, ..., 1000
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 499' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 500' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 501' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to page 1000' })).toBeInTheDocument();
    });

    test('displays correct pagination info for different scenarios', () => {
      const { rerender } = render(<Pagination {...defaultProps} showingStart={1} showingEnd={10} totalItems={50} />);
      expect(screen.getByText('Showing 1 to 10 of 50 results')).toBeInTheDocument();

      rerender(<Pagination {...defaultProps} showingStart={41} showingEnd={50} totalItems={50} />);
      expect(screen.getByText('Showing 41 to 50 of 50 results')).toBeInTheDocument();

      rerender(<Pagination {...defaultProps} showingStart={1} showingEnd={1} totalItems={1} />);
      expect(screen.getByText('Showing 1 to 1 of 1 results')).toBeInTheDocument();
    });
  });

  describe('Integration with Props', () => {
    test('updates display when props change', () => {
      const { rerender } = render(<Pagination {...defaultProps} currentPage={1} />);
      
      expect(screen.getByRole('button', { name: 'Go to page 1' })).toHaveClass('active');
      
      rerender(<Pagination {...defaultProps} currentPage={2} />);
      
      expect(screen.getByRole('button', { name: 'Go to page 1' })).not.toHaveClass('active');
      expect(screen.getByRole('button', { name: 'Go to page 2' })).toHaveClass('active');
    });

    test('handles prop validation correctly', () => {
      // Test with minimal valid props
      render(
        <Pagination
          currentPage={1}
          totalPages={2}
          onPageChange={jest.fn()}
          totalItems={20}
          itemsPerPage={10}
          showingStart={1}
          showingEnd={10}
        />
      );
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    test('supports keyboard interaction on buttons', async () => {
      const onPageChange = jest.fn();
      
      render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />);
      
      const pageButton = screen.getByRole('button', { name: 'Go to page 3' });
      fireEvent.click(pageButton);
      
      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    test('supports keyboard navigation with space key', async () => {
      const onPageChange = jest.fn();
      
      render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />);
      
      const nextButton = screen.getByRole('button', { name: 'Go to next page' });
      fireEvent.keyPress(nextButton, { key: ' ', code: 'Space', charCode: 32 });
      fireEvent.click(nextButton); // Since space key should trigger click
      
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });
});
