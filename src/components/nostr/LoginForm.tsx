'use client';

import { useState, useEffect } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { checkNostrProvider } from '@/utils/nostr';

export const LoginForm = () => {
  const [privateKey, setPrivateKey] = useState('');
  const [hasExtension, setHasExtension] = useState(false);
  const { setKeys, loginWithExtension } = useNostrStore();

  useEffect(() => {
    const checkExtension = async () => {
      const hasNostrExtension = await checkNostrProvider();
      setHasExtension(hasNostrExtension);
    };
    checkExtension();
  }, []);

  const handlePrivateKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setKeys(privateKey);
  };

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <h2 className="text-xl font-bold">Login</h2>

      {hasExtension && (
        <button
          onClick={loginWithExtension}
          className="w-full rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-600"
        >
          Login with Extension
        </button>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-100 px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            OR
          </span>
        </div>
      </div>

      <form onSubmit={handlePrivateKeySubmit} className="space-y-4">
        <div>
          <label htmlFor="privateKey" className="block text-sm font-medium text-gray-700">
            Private Key
          </label>
          <input
            type="password"
            id="privateKey"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="Enter your private key in hex format"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-gray-800 px-4 py-2 font-bold text-white hover:bg-gray-900"
        >
          Login with Private Key
        </button>
      </form>
    </div>
  );
};
