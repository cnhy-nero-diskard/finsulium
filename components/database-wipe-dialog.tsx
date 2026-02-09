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
import { AlertCircle, Trash2 } from 'lucide-react';

interface DatabaseWipeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (encryptionKey: string) => Promise<void>;
  hasEncryption: boolean;
}

export default function DatabaseWipeDialog({
  open,
  onClose,
  onConfirm,
  hasEncryption,
}: DatabaseWipeDialogProps) {
  const [encryptionKey, setEncryptionKey] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (confirmText !== 'WIPE ALL DATA') {
      setError('Please type "WIPE ALL DATA" to confirm');
      return;
    }

    if (hasEncryption && !encryptionKey.trim()) {
      setError('Please enter your encryption key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm(encryptionKey);
      setEncryptionKey('');
      setConfirmText('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to wipe database');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setEncryptionKey('');
      setConfirmText('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            Wipe Database
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. All transactions and goals will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">
              ⚠️ You are about to permanently delete all your data. This action cannot be reversed.
            </p>
          </div>

          {hasEncryption && (
            <div>
              <Label htmlFor="encryption_key">Re-enter Encryption Key</Label>
              <Input
                id="encryption_key"
                type="password"
                placeholder="Your encryption key"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter your master password or encryption key to confirm identity
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="confirm_text">Confirmation</Label>
            <Input
              id="confirm_text"
              type="text"
              placeholder="Type: WIPE ALL DATA"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Type &quot;WIPE ALL DATA&quot; to confirm deletion
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || confirmText !== 'WIPE ALL DATA'}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? 'Wiping...' : 'Wipe Database'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
