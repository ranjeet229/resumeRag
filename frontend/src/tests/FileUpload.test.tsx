import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test/setup';
import { createMockFile, createDragEvent } from '../test/setup';
import FileUpload from '../components/upload/FileUpload';

describe('FileUpload Component', () => {
  const defaultProps = {
    onUpload: vi.fn(),
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
    uploading: false,
    progress: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload area correctly', () => {
    renderWithProviders(<FileUpload {...defaultProps} />);
    
    expect(screen.getByText(/Drag and drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
  });

  it('handles file drop correctly', async () => {
    renderWithProviders(<FileUpload {...defaultProps} />);
    
    const dropzone = screen.getByTestId('dropzone');
    const files = [
      createMockFile('test1.pdf'),
      createMockFile('test2.pdf'),
    ];

    fireEvent(dropzone, createDragEvent('drop', files));

    expect(defaultProps.onUpload).toHaveBeenCalledWith(files);
  });

  it('shows progress when uploading', () => {
    renderWithProviders(
      <FileUpload {...defaultProps} uploading={true} progress={50} />
    );

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('validates file size', async () => {
    renderWithProviders(<FileUpload {...defaultProps} />);
    
    const dropzone = screen.getByTestId('dropzone');
    const largeFile = createMockFile('large.pdf', 'application/pdf', 6 * 1024 * 1024);

    fireEvent(dropzone, createDragEvent('drop', [largeFile]));

    expect(screen.getByText(/File size exceeds/i)).toBeInTheDocument();
    expect(defaultProps.onUpload).not.toHaveBeenCalled();
  });

  it('validates file count', async () => {
    renderWithProviders(<FileUpload {...defaultProps} maxFiles={2} />);
    
    const dropzone = screen.getByTestId('dropzone');
    const files = [
      createMockFile('test1.pdf'),
      createMockFile('test2.pdf'),
      createMockFile('test3.pdf'),
    ];

    fireEvent(dropzone, createDragEvent('drop', files));

    expect(screen.getByText(/Maximum 2 files allowed/i)).toBeInTheDocument();
    expect(defaultProps.onUpload).not.toHaveBeenCalled();
  });

  it('validates file type', async () => {
    renderWithProviders(<FileUpload {...defaultProps} />);
    
    const dropzone = screen.getByTestId('dropzone');
    const invalidFile = createMockFile('test.txt', 'text/plain');

    fireEvent(dropzone, createDragEvent('drop', [invalidFile]));

    expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
    expect(defaultProps.onUpload).not.toHaveBeenCalled();
  });

  it('handles drag events correctly', () => {
    renderWithProviders(<FileUpload {...defaultProps} />);
    
    const dropzone = screen.getByTestId('dropzone');

    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass('border-blue-500');

    fireEvent.dragLeave(dropzone);
    expect(dropzone).not.toHaveClass('border-blue-500');
  });

  it('disables upload area when uploading', () => {
    renderWithProviders(
      <FileUpload {...defaultProps} uploading={true} />
    );
    
    const dropzone = screen.getByTestId('dropzone');
    expect(dropzone).toHaveClass('opacity-50');
    expect(dropzone).toHaveAttribute('aria-disabled', 'true');
  });
});