'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, TestTube, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import Navbar from '@/components/safar/Navbar';
import Footer from '@/components/safar/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ProtectedRoute from '@/components/safar/ProtectedRoute';

function SettingsInner() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  
  const [googlePlacesApiKey, setGooglePlacesApiKey] = useState('');
  const [googlePlacesEnabled, setGooglePlacesEnabled] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/marketplace/settings');
      const data = await res.json();
      
      if (data.ok && data.settings) {
        setGooglePlacesEnabled(data.settings.providers?.googlePlaces?.enabled || false);
        setHasExistingKey(data.settings.providers?.googlePlaces?.hasApiKey || false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    
    try {
      const res = await fetch('/api/marketplace/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googlePlacesApiKey,
          googlePlacesEnabled,
        }),
      });
      
      const data = await res.json();
      
      if (data.ok) {
        toast.success('Settings saved successfully');
        setGooglePlacesApiKey(''); // Clear the field after saving
        await loadSettings(); // Reload to get updated hasApiKey status
      } else {
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!hasExistingKey && !googlePlacesApiKey) {
      toast.error('Please save an API key first');
      return;
    }
    
    setTesting(true);
    setTestResult(null);
    
    try {
      const res = await fetch('/api/marketplace/settings/test-connection', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (data.ok && data.success) {
        setTestResult({ success: true, message: data.message, resultsFound: data.resultsFound });
        toast.success('Connection test successful!');
      } else {
        setTestResult({ success: false, message: data.error || 'Connection test failed' });
        toast.error(data.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult({ success: false, message: error.message });
      toast.error('Test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/20">
        <Navbar />
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-emerald2" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20">
      <Navbar />
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin/marketplace">
            <Button variant="ghost" className="rounded-full mb-4">
              <ArrowLeft className="size-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="font-display text-3xl font-bold">Marketplace Settings</h1>
          <p className="text-muted-foreground mt-1">
            Configure API providers and marketplace options
          </p>
        </div>

        {/* Google Places API Configuration */}
        <section className="rounded-3xl border bg-white p-6 mb-6">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold">Google Places API (New)</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure Google Places API (New) for business discovery
            </p>
            <p className="text-xs text-blue-600 mt-1">
              ✓ Using latest Places API (New) - future-proof and reliable
            </p>
          </div>

          <div className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="googlePlacesEnabled" className="text-base font-semibold">
                  Enable Google Places Provider
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Turn on business discovery using Google Places API
                </p>
              </div>
              <Switch
                id="googlePlacesEnabled"
                checked={googlePlacesEnabled}
                onCheckedChange={setGooglePlacesEnabled}
              />
            </div>

            {/* API Key Input */}
            <div>
              <Label htmlFor="googlePlacesApiKey" className="text-base font-semibold">
                API Key
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                {hasExistingKey 
                  ? 'API key is configured. Leave blank to keep existing key, or enter a new one to update.'
                  : 'Enter your Google Places API key to enable business discovery.'}
              </p>
              <Input
                id="googlePlacesApiKey"
                type="password"
                placeholder={hasExistingKey ? '••••••••••••••••' : 'Enter your Google Places API key'}
                value={googlePlacesApiKey}
                onChange={(e) => setGooglePlacesApiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Get your API key from{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald2 hover:underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>

            {/* API Status */}
            {hasExistingKey && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="size-5 text-emerald2 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-sm text-emerald2">API Key Configured</div>
                    <p className="text-sm text-emerald-700 mt-1">
                      Google Places API key is securely stored and ready to use.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Test Connection */}
            <div className="pt-4 border-t">
              <Button
                onClick={handleTestConnection}
                disabled={testing || (!hasExistingKey && !googlePlacesApiKey)}
                variant="outline"
                className="rounded-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <TestTube className="size-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
              
              {testResult && (
                <div className={`mt-4 rounded-xl border p-4 ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {testResult.success ? (
                      <CheckCircle className="size-5 text-emerald2 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="size-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className={`font-semibold text-sm ${
                        testResult.success ? 'text-emerald2' : 'text-rose-600'
                      }`}>
                        {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                      </div>
                      <p className={`text-sm mt-1 ${
                        testResult.success ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {testResult.message}
                      </p>
                      {testResult.success && testResult.resultsFound !== undefined && (
                        <p className="text-xs text-emerald-600 mt-1">
                          Test query returned {testResult.resultsFound} results
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Future Providers Placeholder */}
        <section className="rounded-3xl border bg-white p-6 mb-6">
          <div className="mb-4">
            <h2 className="font-display text-xl font-bold">Future Providers</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Additional data sources (coming soon)
            </p>
          </div>
          
          <div className="space-y-3">
            {['OpenStreetMap', 'Local Tourism APIs', 'CSV Import', 'Manual Entry'].map((provider) => (
              <div key={provider} className="flex items-center justify-between p-3 rounded-xl border bg-secondary/20">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{provider}</span>
                </div>
                <span className="text-xs uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                  Coming Soon
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-emerald2 hover:bg-emerald2-deep px-8"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requireRole="super_admin">
      <SettingsInner />
    </ProtectedRoute>
  );
}
