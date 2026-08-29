import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { file, z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../../shared/hooks/useToast';
import { useNavigation } from '../../../shared/hooks/useNavigation';
import { Button, Card, Input, Select, Textarea } from '../../../shared/ui';
import { useCategories } from '../api/categories.api';
import { uploadArtifact } from '../api/upload-artifact.api';
import {  
  uploadSoftwareSchema, 
  type SoftwareUploadInput, 
  type SoftwareUploadResponse  
} from '../model/upload-software.schema';
import './upload-software-page.css';

/**
 * Helper function to format bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Human-readable string (e.g., '1.5 MB')
 */
function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

interface SoftwareUploadPageProps {
  onSuccessNavigate?: () => void;
}

export function SoftwareUploadPage({ onSuccessNavigate }: SoftwareUploadPageProps) {
  const toast = useToast();
  const navigate = useNavigation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Fetch categories from backend
  const { data: categoriesData = [], isLoading, isError } = useCategories(200);

  // Form setup with React Hook Form
  const form = useForm<
    z.input<typeof uploadSoftwareSchema>,
    unknown,
    z.output<typeof uploadSoftwareSchema>
  >({
    resolver: zodResolver(uploadSoftwareSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      visibility: true,
      price: 0,
      currency: 'USD',
      version: '',
      changelog: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    setValue,
  } = form;

  const name = watch('name');
  const categoryId = watch('categoryId');
  const version = watch('version');
  const isPublic = watch('visibility');

  // Mutation for software upload
  const mutation = useMutation({
    mutationFn: async (input: SoftwareUploadInput) => {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await uploadArtifact(input, (progress: number) => {
        setUploadProgress(Math.round(progress));
      });

      setIsUploading(false);
      setUploadProgress(100);
      return response as SoftwareUploadResponse;
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // Prevent duplicates by filename
    const existingNames = new Set(selectedFiles.map(f => f.name));
    const newFiles = files.filter(f => !existingNames.has(f.name));

    if (newFiles.length > 0) {
      setSelectedFiles([...selectedFiles, ...newFiles]);
      
    }

    e.target.value = '';
  };

  // Drag and drop handling
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        const newFiles = files.filter(f => !existingNames.has(f.name));
        return [...prev, ...newFiles];
      });
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  // File removal
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Form submission handler
  const onSubmit = form.handleSubmit(async (values) => {
    if (selectedFiles.length === 0) {
      console.log("Files loaded.")
    }

    if (selectedFiles.length === 0) {
      toast({
        variant: 'error',
        title: 'Validation Error',
        description: 'At least one software artifact file is required.',
        duration: 3000,
      });
      return;
    }

    try {
      
      await mutation.mutateAsync({
        ...(values as SoftwareUploadInput),
        files: selectedFiles,
      });
     
      toast({
        variant: 'success',
        title: 'Software Published',
        description: `${values.name} v${(mutation.data as SoftwareUploadResponse)?.version || values.version} is now available.`,
        duration: 3000,
      });

      if (onSuccessNavigate) {
        onSuccessNavigate();
      } else {
        navigate('/software-library');
      }

      // Cleanup after success
      reset();
      setSelectedFiles([]);
    } catch (error: any) {
      toast({
        variant: 'error',
        title: 'Upload Failed',
        description: error?.response?.data?.detail || 'Upload failed. Please try again.',
        duration: 3000,
      });
    }
  });

  // Conditional rendering based on loading/error states
  if (isLoading) {
    return <Card className="tp-card lp-upload-card"><div className="lp-upload-loading">Loading categories...</div></Card>;
  }

  if (isError) {
    return <Card className="tp-card lp-upload-card"><div className="lp-upload-error">Failed to load categories. Please refresh and try again.</div></Card>;
  }

  const getCategoryName = (id: string): string => {
    const category = categoriesData?.find(c => c.id === id);
    return category?.name || 'Not selected';
  };

  return (
    <Card className="tp-card lp-upload-card">
      <form className="lp-upload-form" onSubmit={onSubmit} noValidate>
        <div className="lp-form-header">
          <h1 className="lp-form-title">Publish Software</h1>
          <p className="lp-form-subtitle">
            Enter software details, version information, and upload artifact files.
          </p>
        </div>

        {/* Software Name */}
        <div className="lp-form-group">
          <label className="lp-form-label" htmlFor="name">Software name</label>
          <Input
            id="name"
            type="text"
            {...register("name", { required: 'Software name is required.' })}
            placeholder="Software name"
            aria-label="Software name"
          />
          {errors.name && <p className="lp-form-error">{errors.name.message}</p>}
        </div>

        {/* Description */}
        <div className="lp-form-group">
          <label className="lp-form-label" htmlFor="description">Description</label>
          <Textarea
            id="description"
            {...register("description", { required: 'Description is required.' })}
            placeholder="Write software summary, usage notes, and requirements"
            aria-label="Description"
          />
          {errors.description && <p className="lp-form-error">{errors.description.message}</p>}
        </div>

        {/* Category */}
        <div className="lp-form-group">
          <label className="lp-form-label" htmlFor="categoryId">Category</label>
          <Select
            id="categoryId"
            {...register("categoryId", { required: 'Please select a category.' })}
            aria-label="Category"
          >
            <option value="">Select a category</option>
            {categoriesData?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          {errors.categoryId && <p className="lp-form-error">{errors.categoryId.message}</p>}
        </div>

        {/* Version / Price / Currency Row */}
        <div className="lp-form-row">
          <div className="lp-form-group">
            <label className="lp-form-label" htmlFor="version">Version number</label>
            <Input
              id="version"
              type="text"
              {...register("version", { required: 'Version number is required.' })}
              placeholder="1.0.0"
              aria-label="Version number"
            />
            {errors.version && <p className="lp-form-error">{errors.version.message}</p>}
          </div>

          <div className="lp-form-group">
            <label className="lp-form-label" htmlFor="price">Price</label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price", { 
                valueAsNumber: true,
                min: 0,
              })}
              placeholder="0.00"
              aria-label="Price"
            />
            {errors.price && <p className="lp-form-error">{errors.price.message}</p>}
          </div>

          <div className="lp-form-group">
            <label className="lp-form-label" htmlFor="currency">Currency</label>
            <Select
              id="currency"
              {...register("currency")}
              aria-label="Currency"
            >
              <option value="USD">USD</option>
              <option value="KES">KES</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </Select>
          </div>
        </div>

        {/* Changelog */}
        <div className="lp-form-group">
          <label className="lp-form-label" htmlFor="changelog">Changelog</label>
          <Textarea
            id="changelog"
            {...register("changelog")}
            placeholder="What changed in this release"
            aria-label="Changelog"
          />
        </div>

        {/* Visibility */}
        <div className="lp-form-group">
          <label className="lp-form-checkbox">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => form.setValue('visibility', e.target.checked)}
              aria-label="Public visibility"
            />
            <span>Public visibility</span>
          </label>
          <p className="lp-form-hint">
            {isPublic ? 
              'Public software can be discovered and downloaded by authorized users.' 
            : 'Private software is restricted and requires subscription access for non-owners.'}
          </p>
        </div>

        {/* Artifacts / Files */}
        <div className="lp-form-group">
          <label className="lp-form-label">Artifacts</label>

          <div
            className={`lp-drop-zone ${dragActive ? 'active' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            aria-label="Drag and drop artifact files or click to browse"
          >
            <p className="lp-drop-zone-text">
              {selectedFiles.length === 0
                ? 'Drag and drop files here, or click to browse'
                : `${selectedFiles.length} file(s) selected`}
            </p>
            <input
              type="file"
              multiple
              className="lp-file-input"
              accept=".zip,.tar,.gz,.rar,.7z,.exe,.msi,.deb,.rpm,.whl,.pdf,.docx"
              onChange={handleFileChange}
              aria-label="Select software artifact files"
            />
          </div>
        
          {selectedFiles.map((file, index) => (
            
            <div key={index} className="lp-file-item">
              <div className="lp-file-info">
                <span className="lp-file-name">{file.name}</span>
                <span className="lp-file-size">{formatBytes(file.size)}</span>
                <span className="lp-file-type">{file.type}</span>
              </div>
              
              <button
                type="button"
                className="lp-remove-file"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
              >
              
                Remove
              </button>
            </div>
            
          ))}
        
          {errors.files && <p className="lp-form-error">{errors.files.message}</p>}
        </div>
      
        {/* Upload Progress */}
        {isUploading && (
          <div className="lp-upload-progress">
            <div className="lp-progress-bar-container">
              <div 
                className="lp-progress-bar" 
                style={{ width: `${uploadProgress}%` }}
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
            <p className="lp-progress-text">{uploadProgress}% uploading...</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || isUploading || selectedFiles.length === 0}
          className="lp-submit-button"
          onClick={() => onSubmit()}
        >
          {isUploading ? 'Publishing...' : 'Publish Software'}
        </Button>
      </form>
    </Card>
  );
}