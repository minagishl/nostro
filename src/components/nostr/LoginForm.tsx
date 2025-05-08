'use client';

import { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import { useNostrStore } from '@/store/useNostrStore';
import { checkNostrProvider } from '@/utils/nostr';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { nip19 } from 'nostr-tools';

export const LoginForm = () => {
  const [privateKey, setPrivateKey] = useState('');
  const [hasExtension, setHasExtension] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setKeys, loginWithExtension } = useNostrStore();

  useEffect(() => {
    const checkExtension = async () => {
      const hasNostrExtension = await checkNostrProvider();
      setHasExtension(hasNostrExtension);
    };
    checkExtension();
  }, []);

  const handleNip07Login = async () => {
    try {
      await loginWithExtension();
      localStorage.setItem('nostro:login', 'nip07');
    } catch (e) {
      console.error('Failed to login with NIP-07:', e);
      setError('Failed to login with extension');
    }
  };

  const validatePrivateKey = (key: string): boolean => {
    if (!key.trim()) {
      setError('Please enter your private key');
      return false;
    }

    // Check if it's a nsec format
    if (key.startsWith('nsec1')) {
      try {
        const { type } = nip19.decode(key);
        if (type === 'nsec') {
          setError(null);
          return true;
        }
      } catch (e) {
        console.error('Failed to decode nsec:', e);
        setError('Invalid nsec format');
        return false;
      }
    }

    // Check if it's a hex format
    if (!/^[0-9a-f]{64}$/.test(key)) {
      setError('Invalid private key format. Please enter a valid hex or nsec format');
      return false;
    }

    setError(null);
    return true;
  };

  const handlePrivateKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validatePrivateKey(privateKey)) {
      try {
        let hexKey = privateKey;
        if (privateKey.startsWith('nsec1')) {
          const { type, data } = nip19.decode(privateKey);
          if (type !== 'nsec') {
            throw new Error('Invalid nsec type');
          }
          // Convert Uint8Array to hex string
          hexKey = Array.from(data as Uint8Array)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          // Save nsec1 key to localStorage
          localStorage.setItem('nostro:login', privateKey);
        } else {
          // For hex keys, store with a prefix to distinguish from nsec
          localStorage.setItem('nostro:login', `hex:${privateKey}`);
        }
        setKeys(hexKey);
      } catch (e) {
        console.error('Failed to decode private key:', e);
        setError('Failed to decode private key');
      }
    }
  };

  useEffect(() => {
    // Check for saved login method on mount
    const savedLogin = localStorage.getItem('nostro:login');
    if (savedLogin) {
      if (savedLogin === 'nip07') {
        // Attempt to login with NIP-07 if that was the last method
        loginWithExtension().catch(console.error);
      } else if (savedLogin.startsWith('hex:')) {
        // Handle hex key
        const hexKey = savedLogin.slice(4);
        setPrivateKey(hexKey);
        setKeys(hexKey);
      } else if (savedLogin.startsWith('nsec1')) {
        // Handle nsec key
        setPrivateKey(savedLogin);
        try {
          const { type, data } = nip19.decode(savedLogin);
          if (type === 'nsec') {
            const hexKey = Array.from(data as Uint8Array)
              .map((b) => b.toString(16).padStart(2, '0'))
              .join('');
            setKeys(hexKey);
          }
        } catch (e) {
          console.error('Failed to decode saved nsec:', e);
          localStorage.removeItem('nostro:login');
        }
      }
    }
  }, [setKeys, loginWithExtension]);

  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <Label className="text-xl font-bold">Login</Label>

      <Button
        onClick={handleNip07Login}
        variant="primary"
        className="w-full"
        disabled={!hasExtension}
      >
        <div className="flex items-center justify-center gap-2">
          <LogIn className="h-5 w-5" />
          <span>Login with Extension</span>
        </div>
      </Button>

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
          onChange={(e) => {
            setPrivateKey(e.target.value);
            if (error) validatePrivateKey(e.target.value);
          }}
          placeholder="Enter your private key in hex or nsec format"
          label="Private Key"
          error={error}
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
