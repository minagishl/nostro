import React, { useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { uploadImageToNostr } from '@/utils/fileUpload';

export const PostForm: React.FC = () => {
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { publicKey, privateKey, isExtensionLogin, generateKeys, publishNote } = useNostrStore();

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
              {uploading && (
                <svg
                  className="h-5 w-5 animate-spin text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
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
