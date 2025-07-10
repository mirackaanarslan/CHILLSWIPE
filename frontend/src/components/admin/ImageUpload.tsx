'use client';

import React, { useState, useRef } from 'react';
import { uploadQuestionImage } from '@/lib/admin';
import { storageService } from '@/lib/supabase-service';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  onUploadStart: () => void;
  onUploadEnd: () => void;
  currentImageUrl?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  onUploadStart,
  onUploadEnd,
  currentImageUrl
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    onUploadStart();

    try {
      // Upload new image
      const imageUrl = await uploadQuestionImage(file);
      onImageUploaded(imageUrl);
      toast.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      onUploadEnd();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    try {
      // Extract filename from URL for deletion
      const urlParts = currentImageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      await storageService.deleteImage(fileName);
      onImageUploaded('');
      toast.success('Image removed successfully!');
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  return (
    <div className="image-upload-container">
      {currentImageUrl ? (
        // Show current image - smaller size
        <div className="image-preview-container">
          <div className="image-preview">
            <img
              src={currentImageUrl}
              alt="Question image"
              className="preview-image"
            />
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            className="remove-image-btn"
            title="Remove image"
          >
            ✕
          </button>
        </div>
      ) : (
        // Upload area - more compact
        <div
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="file-input"
            disabled={uploading}
          />
          
          <div className="upload-content">
            {uploading ? (
              <div className="upload-loading">
                <div className="upload-spinner"></div>
                <p className="upload-text">Uploading...</p>
              </div>
            ) : (
              <div className="upload-placeholder">
                <span className="upload-icon">📷</span>
                <p className="upload-text">
                  <span className="upload-highlight">Click to upload</span> or drag & drop
                </p>
                <p className="upload-hint">PNG, JPG, GIF up to 5MB</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 