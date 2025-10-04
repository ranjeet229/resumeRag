import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/common';
import FileUpload from '../../components/upload/FileUpload';
import { resumeService } from '../../services';
import { RoutePath } from '../../router/types';

const ResumeUpload: React.FC = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      setUploading(true);
      setError(null);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      if (files.length === 1) {
        // Single file upload
        await resumeService.uploadFile(files[0]);
      } else {
        // Bulk upload
        await resumeService.uploadBulk(files);
      }

      clearInterval(progressInterval);
      setProgress(100);

      // Navigate to resumes list after successful upload
      setTimeout(() => {
        navigate(RoutePath.RESUMES);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload resume(s)');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Upload Resumes
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload single resume or bulk upload multiple resumes in a ZIP file
          </p>
        </div>
      </div>

      <Card>
        {error && (
          <div className="mb-4 p-4 bg-red-50 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <FileUpload
          onUpload={handleUpload}
          maxFiles={10}
          maxSize={50 * 1024 * 1024} // 50MB
          uploading={uploading}
          progress={progress}
        />
      </Card>

      <div className="mt-6">
        <h3 className="text-lg font-medium text-gray-900">Upload Guidelines</h3>
        <div className="mt-2 text-sm text-gray-500">
          <ul className="list-disc pl-5 space-y-1">
            <li>Supported formats: PDF, DOC, DOCX</li>
            <li>Maximum file size: 50MB</li>
            <li>For bulk uploads, create a ZIP file containing multiple resumes</li>
            <li>
              File names should be descriptive (e.g., "John_Doe_Resume.pdf")
            </li>
            <li>
              Make sure resumes are text-searchable (not scanned images)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;