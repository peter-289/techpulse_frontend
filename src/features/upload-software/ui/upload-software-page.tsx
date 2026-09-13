import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../../shared/hooks/useToast';
import { useNavigation } from '../../../shared/hooks/useNavigation';
import { Button, Card, Input, Select, Textarea } from '../../../shared/ui';
import { useCategories } from '../api/categories.api';
import { uploadArtifact } from '../api/upload-artifact.api';

// CORRECTION:
// Import the response schema as a runtime value.
// SoftwareUploadResponse is only a TypeScript type and therefore
// cannot be used with `.parse()`.
import {
  uploadSoftwareSchema,
  softwareUploadResponseSchema,
  type SoftwareUploadInput,
  type SoftwareUploadResponse,
} from '../model/upload-software.schema';

import './upload-software-page.css';

/**
 * Helper function to format bytes to human-readable format.
 *
 * @param bytes - File size in bytes
 * @returns Human-readable string (e.g. "1.5 MB")
 */
function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

interface SoftwareUploadPageProps {
  onSuccessNavigate?: () => void;
}

export function SoftwareUploadPage({
  onSuccessNavigate,
}: SoftwareUploadPageProps) {
  const toast = useToast();
  const navigate = useNavigation();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // CORRECTION:
  // selectedFiles is no longer maintained as separate source-of-truth
  // state. Files now belong to React Hook Form and are accessed through
  // `watch('files')`.
  const { data: categoriesData = [], isLoading, isError } = useCategories(200);

  // CORRECTION:
  // `files` is included in defaultValues so the RHF form and Zod schema
  // have the same shape.
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
      files: [],
    },
  });

  const {
    register,
    formState: { errors, isValid },
    watch,
    reset,
    setValue,
  } = form;

  // CORRECTION:
  // These are the only watched values actually needed by the UI.
  // The previous implementation watched name, categoryId and version
  // without using them.
  const isPublic = watch('visibility');
  const selectedFiles = watch('files');

  // CORRECTION:
  // The response schema is now used to validate the actual backend
  // response instead of blindly asserting that it matches the type.
  const mutation = useMutation({
    mutationFn: async (input: SoftwareUploadInput) => {
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const response = await uploadArtifact(
          input,
          (progress: number) => {
            setUploadProgress(Math.round(progress));
          },
        );

        setUploadProgress(100);

        // CORRECTION:
        // `SoftwareUploadResponse` is a TypeScript type, so it cannot
        // perform runtime parsing. The Zod response schema does.
        return softwareUploadResponseSchema.parse(response);
      } finally {
        setIsUploading(false);
      }
    },
  });

  /**
   * Add files to the form.
   *
   * CORRECTION:
   * File selection and drag/drop now use exactly the same validation
   * and state-update path. This prevents the two upload mechanisms
   * from behaving differently.
   */
  const addFiles = (incomingFiles: File[]) => {
    if (incomingFiles.length === 0) {
      return;
    }

    const currentFiles = form.getValues('files');

    // CORRECTION:
    // Prevent duplicate filenames while preserving the existing files.
    const existingNames = new Set(
      currentFiles.map((file) => file.name.toLowerCase()),
    );

    const newFiles = incomingFiles.filter(
      (file) => !existingNames.has(file.name.toLowerCase()),
    );

    if (newFiles.length === 0) {
      return;
    }

    const nextFiles = [...currentFiles, ...newFiles];

    // CORRECTION:
    // Validate the complete File[] through the same Zod schema used
    // during form submission. This means invalid extensions and files
    // over 500MB are rejected before the API is called.
    const result = uploadSoftwareSchema.shape.files.safeParse(nextFiles);

    if (!result.success) {
      const firstIssue = result.error.issues[0];

      toast({
        variant: 'error',
        title: 'Invalid Artifact',
        description:
          firstIssue?.message ??
          'One or more selected files are invalid.',
        duration: 4000,
      });

      return;
    }

    // CORRECTION:
    // `setValue` makes the files part of RHF's form state.
    // `shouldValidate` immediately updates Zod/RHF validation.
    // `shouldDirty` marks the field as changed.
    setValue('files', nextFiles, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // Handle normal file input selection.
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);

    addFiles(files);

    // CORRECTION:
    // Reset the native input so selecting the same file again can
    // trigger another change event.
    e.target.value = '';
  };

  // Drag and drop handling.
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);

    // CORRECTION:
    // Do not use `isValid` here. `isValid` represents the entire form,
    // not the validity of the dropped files.
    //
    // `addFiles()` performs the actual file validation.
    addFiles(files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  // File removal.
  const removeFile = (index: number) => {
    // CORRECTION:
    // Files are now removed from RHF rather than a separate React state.
    const currentFiles = form.getValues('files');

    const nextFiles = currentFiles.filter(
      (_, fileIndex) => fileIndex !== index,
    );

    setValue('files', nextFiles, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // Form submission handler.
  const onSubmit = form.handleSubmit(async (values) => {
    // CORRECTION:
    // The old manual selectedFiles check is unnecessary because
    // `files.min(1)` in the Zod schema already validates this.
    //
    // At this point `values` has already passed the complete Zod
    // validation, including file validation.

    try {
      // CORRECTION:
      // `values` is already the correctly validated SoftwareUploadInput.
      // There is no need for an unsafe `as SoftwareUploadInput` cast.
      const response = await mutation.mutateAsync(values);

      // CORRECTION:
      // Use the result returned by mutateAsync() instead of reading
      // mutation.data immediately after the mutation.
      const softwareResponse: SoftwareUploadResponse = response;

      toast({
        variant: 'success',
        title: 'Software Published',
        description: `${values.name} v${softwareResponse.version} is now available.`,
        duration: 3000,
      });

      if (onSuccessNavigate) {
        onSuccessNavigate();
      } else {
        navigate('/software-library');
      }

      // CORRECTION:
      // Reset both RHF fields and the file field together because
      // files are now part of the RHF form state.
      reset();
    } catch (error: unknown) {
      toast({
        variant: 'error',
        title: 'Upload Failed',
        description:
          typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          typeof error.response === 'object' &&
          error.response !== null &&
          'data' in error.response &&
          typeof error.response.data === 'object' &&
          error.response.data !== null &&
          'detail' in error.response.data &&
          typeof error.response.data.detail === 'string'
            ? error.response.data.detail
            : 'Upload failed. Please try again.',
        duration: 3000,
      });
    }
  });

  if (isLoading) {
    return (
      <Card className="tp-card lp-upload-card">
        <div className="lp-upload-loading">
          Loading categories...
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="tp-card lp-upload-card">
        <div className="lp-upload-error">
          Failed to load categories. Please refresh and try again.
        </div>
      </Card>
    );
  }

  return (
    <Card className="tp-card lp-upload-card">
      <form
        className="lp-upload-form"
        onSubmit={onSubmit}
        noValidate
      >
        <div className="lp-form-header">
          <h1 className="lp-form-title">Publish Software</h1>

          <p className="lp-form-subtitle">
            Enter software details, version information, and upload
            artifact files.
          </p>
        </div>

        {/* Software Name */}
        <div className="lp-form-group">
          <label
            className="lp-form-label"
            htmlFor="name"
          >
            Software name
          </label>

          <Input
            id="name"
            type="text"
            {...register('name')}
            placeholder="Software name"
            aria-label="Software name"
          />

          {errors.name && (
            <p className="lp-form-error">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="lp-form-group">
          <label
            className="lp-form-label"
            htmlFor="description"
          >
            Description
          </label>

          <Textarea
            id="description"
            {...register('description')}
            placeholder="Write software summary, usage notes, and requirements"
            aria-label="Description"
          />

          {errors.description && (
            <p className="lp-form-error">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Category */}
        <div className="lp-form-group">
          <label
            className="lp-form-label"
            htmlFor="categoryId"
          >
            Category
          </label>

          <Select
            id="categoryId"
            {...register('categoryId')}
            aria-label="Category"
          >
            <option value="">Select a category</option>

            {categoriesData.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </Select>

          {errors.categoryId && (
            <p className="lp-form-error">
              {errors.categoryId.message}
            </p>
          )}
        </div>

        {/* Version / Price / Currency Row */}
        <div className="lp-form-row">
          <div className="lp-form-group">
            <label
              className="lp-form-label"
              htmlFor="version"
            >
              Version number
            </label>

            <Input
              id="version"
              type="text"
              {...register('version')}
              placeholder="1.0.0"
              aria-label="Version number"
            />

            {errors.version && (
              <p className="lp-form-error">
                {errors.version.message}
              </p>
            )}
          </div>

          <div className="lp-form-group">
            <label
              className="lp-form-label"
              htmlFor="price"
            >
              Price
            </label>

            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              // CORRECTION:
              // Zod already performs numeric coercion. Removing
              // `valueAsNumber` leaves type conversion in one place:
              // the schema.
              {...register('price')}
              placeholder="0.00"
              aria-label="Price"
            />

            {errors.price && (
              <p className="lp-form-error">
                {errors.price.message}
              </p>
            )}
          </div>

          <div className="lp-form-group">
            <label
              className="lp-form-label"
              htmlFor="currency"
            >
              Currency
            </label>

            <Select
              id="currency"
              {...register('currency')}
              aria-label="Currency"
            >
              <option value="USD">USD</option>
              <option value="KES">KES</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </Select>

            {errors.currency && (
              <p className="lp-form-error">
                {errors.currency.message}
              </p>
            )}
          </div>
        </div>

        {/* Changelog */}
        <div className="lp-form-group">
          <label
            className="lp-form-label"
            htmlFor="changelog"
          >
            Changelog
          </label>

          <Textarea
            id="changelog"
            {...register('changelog')}
            placeholder="What changed in this release"
            aria-label="Changelog"
          />
        </div>

        {/* Visibility */}
        <div className="lp-form-group">
          <label className="lp-form-checkbox">
            <input
              type="checkbox"
              // CORRECTION:
              // Register visibility with RHF instead of manually
              // calling setValue(). RHF now tracks the checkbox,
              // validation state, dirty state, and submitted value.
              {...register('visibility')}
              aria-label="Public visibility"
            />

            <span>Public visibility</span>
          </label>

          <p className="lp-form-hint">
            {isPublic
              ? 'Public software can be discovered and downloaded by authorized users.'
              : 'Private software is restricted and requires subscription access for non-owners.'}
          </p>
        </div>

        {/* Artifacts / Files */}
        <div className="lp-form-group">
          <label className="lp-form-label">
            Artifacts
          </label>

          <div
            className={`lp-drop-zone ${
              dragActive ? 'active' : ''
            }`}
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
            <div
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="lp-file-item"
            >
              <div className="lp-file-info">
                <span className="lp-file-name">
                  {file.name}
                </span>

                <span className="lp-file-size">
                  {formatBytes(file.size)}
                </span>

                <span className="lp-file-type">
                  {file.type || 'Unknown type'}
                </span>
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

          {errors.files && (
            <p className="lp-form-error">
              {errors.files.message}
            </p>
          )}
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="lp-upload-progress">
            <div className="lp-progress-bar-container">
              <div
                className="lp-progress-bar"
                style={{
                  width: `${uploadProgress}%`,
                }}
                role="progressbar"
                aria-valuenow={uploadProgress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>

            <p className="lp-progress-text">
              {uploadProgress}% uploading...
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          // CORRECTION:
          // `selectedFiles.length` is no longer needed because files
          // are part of RHF and Zod validation. `isValid` now reflects
          // the entire form, including files.
          disabled={!isValid || isUploading}
          className="lp-submit-button"
        >
          {isUploading
            ? 'Publishing...'
            : 'Publish Software'}
        </Button>
      </form>
    </Card>
  );
}