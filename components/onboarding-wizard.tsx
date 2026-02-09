'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useStore } from '@/lib/store';
import { testConnection, initializeSupabase } from '@/lib/supabase';
import { 
  generateRandomKey, 
  deriveKeyFromPassword, 
  exportKey,
  saltToBase64,
  generateSalt
} from '@/lib/encryption';
import { Lock, Database, Key, CheckCircle2, AlertCircle, Download } from 'lucide-react';

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Supabase credentials
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [connectionTested, setConnectionTested] = useState(false);
  
  // Step 2: Encryption setup
  const [encryptionType, setEncryptionType] = useState<'password' | 'random_key'>('password');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [keyDownloaded, setKeyDownloaded] = useState(false);

  const { setCredentials, setEncryptionConfig, setEncryptionKey, setSalt, setOnboarded } = useStore();

  const handleTestConnection = async () => {
    setLoading(true);
    setError('');
    
    try {
      const isValid = await testConnection({ url: supabaseUrl, anonKey: supabaseKey });
      
      if (isValid) {
        setConnectionTested(true);
        setError('');
      } else {
        setError('Connection failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Connection failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Complete = () => {
    if (!connectionTested) {
      setError('Please test your connection first.');
      return;
    }
    setStep(2);
    setError('');
  };

  const handleGenerateRandomKey = async () => {
    try {
      const key = await generateRandomKey();
      const exported = await exportKey(key);
      setGeneratedKey(exported);
      setKeyDownloaded(false);
    } catch (err) {
      setError('Failed to generate key. Please try again.');
    }
  };

  const handleDownloadKey = () => {
    const blob = new Blob([generatedKey], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'finsulium-encryption-key.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setKeyDownloaded(true);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');

    try {
      // Save credentials
      const credentials = { url: supabaseUrl, anonKey: supabaseKey };
      setCredentials(credentials);
      initializeSupabase(credentials);

      // Setup encryption
      if (encryptionType === 'password') {
        if (masterPassword !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (masterPassword.length < 8) {
          setError('Password must be at least 8 characters.');
          setLoading(false);
          return;
        }

        const salt = generateSalt();
        const { key } = await deriveKeyFromPassword(masterPassword, salt);
        
        setEncryptionKey(key);
        setSalt(saltToBase64(salt));
        setEncryptionConfig({ enabled: true, type: 'password' });
      } else {
        if (!keyDownloaded) {
          setError('Please download your encryption key before continuing.');
          setLoading(false);
          return;
        }

        const key = await generateRandomKey();
        setEncryptionKey(key);
        setEncryptionConfig({ enabled: true, type: 'random_key' });
      }

      setOnboarded(true);
      setLoading(false);
    } catch (err) {
      setError('Setup failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">
            Welcome to FINSULIUM
          </CardTitle>
          <CardDescription className="text-center">
            Privacy-first personal finance tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                <Database className="w-5 h-5" />
              </div>
              <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-primary text-white' : 'bg-gray-200'}`}>
                <Lock className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Step 1: Supabase Connection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Connect Your Supabase Database</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  FINSULIUM stores your data in your own Supabase instance. You maintain full control and ownership.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="supabase-url">Supabase Project URL</Label>
                  <Input
                    id="supabase-url"
                    type="url"
                    placeholder="https://your-project.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => {
                      setSupabaseUrl(e.target.value);
                      setConnectionTested(false);
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="supabase-key">Supabase Anon Key</Label>
                  <Input
                    id="supabase-key"
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    value={supabaseKey}
                    onChange={(e) => {
                      setSupabaseKey(e.target.value);
                      setConnectionTested(false);
                    }}
                  />
                </div>

                {error && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                {connectionTested && (
                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Connection successful!</span>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={handleTestConnection}
                    disabled={loading || !supabaseUrl || !supabaseKey}
                    variant="outline"
                    className="flex-1"
                  >
                    {loading ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    onClick={handleStep1Complete}
                    disabled={!connectionTested}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Encryption Setup */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Choose Your Encryption Method</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  All your financial data will be encrypted. Choose your preferred method.
                </p>
              </div>

              <Tabs value={encryptionType} onValueChange={(value: any) => setEncryptionType(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="password">Master Password</TabsTrigger>
                  <TabsTrigger value="random_key">Random Key</TabsTrigger>
                </TabsList>

                <TabsContent value="password" className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-sm">
                    <p className="font-medium mb-2">🔒 Most Secure</p>
                    <p className="text-muted-foreground">
                      You&apos;ll enter a master password each time you access the app. 
                      This password never leaves your device.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="master-password">Master Password</Label>
                    <Input
                      id="master-password"
                      type="password"
                      placeholder="Enter a strong password (min 8 characters)"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="random_key" className="space-y-4">
                  <div className="bg-amber-50 p-4 rounded-lg text-sm">
                    <p className="font-medium mb-2">🔑 Most Convenient</p>
                    <p className="text-muted-foreground">
                      A random encryption key will be generated. Save it securely - 
                      you&apos;ll need it to access your data on other devices.
                    </p>
                  </div>

                  {!generatedKey ? (
                    <Button onClick={handleGenerateRandomKey} className="w-full">
                      <Key className="w-4 h-4 mr-2" />
                      Generate Encryption Key
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-2">Your Encryption Key:</p>
                        <p className="text-xs font-mono break-all">{generatedKey}</p>
                      </div>
                      
                      <Button
                        onClick={handleDownloadKey}
                        variant={keyDownloaded ? "outline" : "default"}
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {keyDownloaded ? 'Key Downloaded ✓' : 'Download Key'}
                      </Button>

                      {keyDownloaded && (
                        <p className="text-xs text-green-600 text-center">
                          ✓ Key saved! Keep this file safe.
                        </p>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Setting up...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
