import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  showingStart: number;
  showingEnd: number;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showingStart,
  showingEnd,
}) => {
  const getVisiblePages = () => {
    const visiblePages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      // Always show first page
      visiblePages.push(1);
      
      // Calculate range around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis if there's a gap
      if (startPage > 2) {
        visiblePages.push('...');
      }
      
      // Add pages around current page
      for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
      }
      
      // Add ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        visiblePages.push('...');
      }
      
      // Always show last page
      if (totalPages > 1) {
        visiblePages.push(totalPages);
      }
    }
    
    return visiblePages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        <span className="pagination-text">
          Showing {showingStart} to {showingEnd} of {totalItems} results
        </span>
      </div>
      
      <nav className="pagination-nav" aria-label="Pagination Navigation">
        <div className="pagination-controls">
          {/* Previous button */}
          <button
            className={`pagination-btn pagination-prev ${currentPage === 1 ? 'disabled' : ''}`}
            onClick={handlePrevious}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            <span aria-hidden="true">‹</span>
            <span className="sr-only">Previous</span>
          </button>

          {/* Page numbers */}
          <div className="pagination-pages">
            {getVisiblePages().map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    className={`pagination-btn pagination-page ${
                      page === currentPage ? 'active' : ''
                    }`}
                    onClick={() => handlePageClick(page)}
                    aria-label={`Go to page ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next button */}
          <button
            className={`pagination-btn pagination-next ${currentPage === totalPages ? 'disabled' : ''}`}
            onClick={handleNext}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            <span className="sr-only">Next</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Pagination;
