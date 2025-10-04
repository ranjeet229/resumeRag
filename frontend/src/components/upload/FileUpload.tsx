import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../common';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  uploading?: boolean;
  progress?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      '.docx',
    ],
    'application/zip': ['.zip'],
  },
  uploading = false,
  progress = 0,
}) => {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
      setFiles(newFiles);
      onUpload(newFiles);
    },
    [files, maxFiles, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onUpload(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-500'
        }`}
      >
        <input {...getInputProps()} />
        <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
        {isDragActive ? (
          <p className="mt-2 text-sm text-gray-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop files here, or click to select files
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {Object.values(accept)
                .flat()
                .join(', ')}{' '}
              files up to {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="py-3 flex justify-between items-center"
            >
              <div className="flex items-center">
                <DocumentIcon className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-sm text-gray-900">{file.name}</span>
                <span className="ml-2 text-xs text-gray-500">
                  ({Math.round(file.size / 1024)} KB)
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-200">
                  Uploading
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-primary-600">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary-200">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      )}

      {files.length > 0 && !uploading && (
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              setFiles([]);
              onUpload([]);
            }}
          >
            Clear all
          </Button>
          <Button onClick={() => onUpload(files)}>Upload</Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;