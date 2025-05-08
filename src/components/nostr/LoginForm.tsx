'use client';

import { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import { useNostrStore } from '@/store/useNostrStore';
import { checkNostrProvider } from '@/utils/nostr';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
        <Button onClick={loginWithExtension} variant="primary" className="w-full">
          <div className="flex items-center justify-center gap-2">
            <LogIn className="h-5 w-5" />
            <span>Login with Extension</span>
          </div>
        </Button>
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
        <Input
          type="password"
          id="privateKey"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          placeholder="Enter your private key in hex format"
          label="Private Key"
        />
        <Button type="submit" variant="outline" className="w-full">
          <div className="flex items-center justify-center gap-2">
            <LogIn className="h-5 w-5" />
            <span>Login with Private Key</span>
          </div>
        </Button>
      </form>
    </div>
  );
};
