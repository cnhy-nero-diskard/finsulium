'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useStore } from '@/lib/store';
import { deriveKeyFromPassword, importKey, base64ToSalt } from '@/lib/encryption';
import { Lock, AlertCircle } from 'lucide-react';

export default function UnlockEncryptionDialog() {
  const { encryptionConfig, encryptionKey, salt, setEncryptionKey } = useStore();
  const [password, setPassword] = useState('');
  const [keyString, setKeyString] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only show if encryption is enabled but key is not loaded
  const isOpen = encryptionConfig?.enabled && !encryptionKey;
  const isPasswordMode = encryptionConfig?.type === 'password';

  const handleUnlock = async () => {
    setLoading(true);
    setError('');

    try {
      if (isPasswordMode) {
        if (!password.trim()) {
          setError('Please enter your master password');
          setLoading(false);
          return;
        }

        if (!salt) {
          setError('Salt not found. Please re-run onboarding.');
          setLoading(false);
          return;
        }

        const saltBytes = base64ToSalt(salt);
        const { key } = await deriveKeyFromPassword(password, saltBytes);
        setEncryptionKey(key);
        setPassword('');
      } else {
        // Random key mode
        if (!keyString.trim()) {
          setError('Please enter your encryption key');
          setLoading(false);
          return;
        }

        const key = await importKey(keyString);
        setEncryptionKey(key);
        setKeyString('');
      }
    } catch (err: any) {
      setError('Failed to unlock. Please check your credentials.');
      console.error('Unlock error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Unlock Encryption
          </DialogTitle>
          <DialogDescription>
            Your data is encrypted. Please unlock to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {isPasswordMode ? (
            <div>
              <Label htmlFor="password">Master Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your master password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="key">Encryption Key</Label>
              <Input
                id="key"
                type="text"
                placeholder="Paste your encryption key"
                value={keyString}
                onChange={(e) => setKeyString(e.target.value)}
                onKeyPress={handleKeyPress}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use the key you downloaded during setup
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleUnlock} disabled={loading} className="w-full">
            {loading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </DialogFooter>

        <p className="text-xs text-muted-foreground text-center">
          🔒 Your encryption key is only stored in memory and never saved to disk
        </p>
      </DialogContent>
    </Dialog>
  );
}
