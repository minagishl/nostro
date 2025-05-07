import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNostrStore } from '@/store/useNostrStore';
import {
  uploadImageToNostr,
  getUploadUrl,
  setUploadUrl,
  DEFAULT_UPLOAD_URL,
  NOSTRCHECK_UPLOAD_URL,
} from '@/utils/fileUpload';

export const PostForm: React.FC = () => {
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadUrl, setUploadUrlState] = useState<string>(
    typeof window !== 'undefined' ? getUploadUrl() : DEFAULT_UPLOAD_URL,
  );
  const { publicKey, privateKey, isExtensionLogin, generateKeys, publishNote } = useNostrStore();

  // Keep uploadUrl in sync with localStorage
  useEffect(() => {
    setUploadUrlState(getUploadUrl());
  }, []);

  const handleUploadUrlChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const value = e.target.value;
    setUploadUrl(value);
    setUploadUrlState(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await publishNote(content);
    setContent('');
  };

  // When an image file is selected, it is automatically uploaded
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && publicKey) {
      setUploading(true);
      setUploadError(null);

      const { url, error } = await uploadImageToNostr(
        file,
        publicKey,
        privateKey,
        isExtensionLogin,
        uploadUrl,
      );

      if (url) {
        setContent((prev) => prev + `\n${url}`);
      } else if (error) {
        setUploadError(error);
      }

      setUploading(false);
    }
  };

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="p-4">
        {!publicKey ? (
          <button
            onClick={generateKeys}
            className="w-full rounded bg-indigo-500 px-4 py-2 font-bold text-white hover:bg-indigo-600"
          >
            Generate Keys to Start Posting
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mb-4 w-full rounded border bg-transparent p-2 text-[15px] dark:border-gray-600 dark:text-white"
              placeholder="What's on your mind?"
              rows={3}
            />
            <div className="mb-2 flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={uploading}
              />
              {uploading && <Loader2 className="h-5 w-5 animate-spin text-gray-500" />}
            </div>
            {/* Upload destination selector */}
            <div className="mb-2 flex items-center gap-2">
              <label
                htmlFor="upload-destination"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Upload destination:
              </label>
              <select
                id="upload-destination"
                value={uploadUrl}
                onChange={handleUploadUrlChange}
                className="rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
              >
                <option value={DEFAULT_UPLOAD_URL}>nostr.build</option>
                <option value={NOSTRCHECK_UPLOAD_URL}>cdn.nostrcheck.me</option>
                <option value="custom">Custom</option>
              </select>
              {uploadUrl === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter custom URL"
                  className="rounded border px-2 py-1 text-sm dark:bg-gray-800 dark:text-white"
                  onChange={(e) =>
                    handleUploadUrlChange(e as unknown as React.ChangeEvent<HTMLSelectElement>)
                  }
                  onBlur={(e) => setUploadUrl(e.target.value)}
                />
              )}
            </div>
            {uploadError && <div className="mb-2 text-sm text-red-500">{uploadError}</div>}
            <button
              type="submit"
              className="rounded bg-indigo-500 px-4 py-2 font-bold text-white hover:bg-indigo-600"
              disabled={!content.trim()}
            >
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
