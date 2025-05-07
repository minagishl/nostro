import React, { useState } from 'react';
import { useNostrStore } from '@/store/useNostrStore';
import { getToken as getNip98Token } from 'nostr-tools/nip98';
import type { Event, EventTemplate } from 'nostr-tools';

const NIP96_API_URL = 'https://nostr.build/api/v2/nip96/upload';

async function getFileSHA256(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  return new Uint8Array(hashBuffer);
}

function base64encode(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

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
      try {
        const hashBytes = await getFileSHA256(file);
        const hashBase64 = base64encode(hashBytes);

        const method = 'POST';
        const url = NIP96_API_URL;
        const payload = { hash: hashBase64 };
        let authorization = '';
        if (isExtensionLogin && window.nostr) {
          const event = {
            kind: 27235,
            tags: [
              ['u', url],
              ['method', method],
              ['payload', JSON.stringify(payload)],
            ],
            created_at: Math.floor(Date.now() / 1000),
            content: '',
            pubkey: publicKey,
            id: '',
            sig: '',
          };
          const signedEvent = await window.nostr.signEvent(event);
          const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(signedEvent))));
          authorization = `Nostr ${b64}`;
        } else if (privateKey) {
          // Generate Authorization
          const sign = async (event: EventTemplate): Promise<Event> => {
            const { schnorr } = await import('@noble/curves/secp256k1');
            const { bytesToHex } = await import('@noble/hashes/utils');
            const fullEvent = {
              ...event,
              pubkey: publicKey,
              id: '',
              sig: '',
            };
            const serializeEvent = (evt: EventTemplate & { pubkey: string }) =>
              JSON.stringify([0, evt.pubkey, evt.created_at, evt.kind, evt.tags, evt.content]);
            const { sha256 } = await import('@noble/hashes/sha256');
            const utf8Encoder = new TextEncoder();
            const idBytes = sha256(utf8Encoder.encode(serializeEvent(fullEvent)));
            fullEvent.id = bytesToHex(idBytes);
            fullEvent.sig = bytesToHex(schnorr.sign(fullEvent.id, privateKey));
            return fullEvent;
          };
          authorization = await getNip98Token(url, method, sign, true, payload);
        } else {
          setUploadError('No private key available for signing.');
          setUploading(false);
          return;
        }

        // Upload via multipart/form-data
        const formData = new FormData();
        formData.append('file', file as File);

        const res = await fetch(NIP96_API_URL, {
          method: 'POST',
          body: formData,
          headers: {
            Authorization: authorization,
          },
        });
        const data = await res.json();
        if (data.status === 'success' && data.nip94_event) {
          const urlTag = data.nip94_event.tags.find(
            (tag: [string, ...string[]]) => tag[0] === 'url',
          );
          if (urlTag) {
            setContent((prev) => prev + `\n${urlTag[1]}`);
          }
        } else {
          setUploadError(data.message || 'Upload failed');
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setUploadError(err.message || 'Upload failed');
        } else {
          setUploadError('Upload failed');
        }
      } finally {
        setUploading(false);
      }
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
