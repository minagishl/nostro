import React, { useState } from 'react';
import { Loader2, Image, Smile, Send } from 'lucide-react';
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
    <div className="rounded-lg bg-gray-100 dark:bg-gray-800">
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
              className="mb-4 field-sizing-content min-h-20 w-full resize-none overflow-hidden rounded-md bg-transparent text-sm text-gray-900 placeholder-gray-500 focus:ring-0 focus:outline-none dark:text-gray-100 dark:placeholder-gray-400"
              placeholder="What's on your mind?"
            />
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <label className="cursor-pointer text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                    className="hidden"
                  />
                  <div className="py-1">
                    <Image className="h-4 w-4" />
                  </div>
                </label>
                {uploading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                <button
                  type="button"
                  className="cursor-pointer text-gray-500 hover:text-indigo-500 dark:text-gray-400 dark:hover:text-indigo-400"
                >
                  <div className="py-1">
                    <Smile className="h-4 w-4" />
                  </div>
                </button>
              </div>
              <button
                type="submit"
                className="rounded-md py-1 font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-500"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {uploadError && <div className="mt-2 text-sm text-red-500">{uploadError}</div>}
          </form>
        )}
      </div>
    </div>
  );
};
