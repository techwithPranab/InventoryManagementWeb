'use client';

import { useState } from 'react';

interface PATTokenDialogProps {
  open: boolean;
  onClose: () => void;
  clientCode: string;
  inventorySetupId: string;
}

interface TokenInfo {
  hasToken: boolean;
  isActive: boolean;
  isValid: boolean;
  token?: string;
  expiryDate?: string;
  createdAt?: string;
  lastUsedAt?: string;
}

export default function PATTokenDialog({
  open,
  onClose,
  clientCode,
  inventorySetupId,
}: PATTokenDialogProps) {
  const [expiryDays, setExpiryDays] = useState<number>(90);
  const [showToken, setShowToken] = useState<boolean>(false);
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [tokenExpiry, setTokenExpiry] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState<boolean>(false);

  // Fetch token info when dialog opens
  useState(() => {
    if (open && inventorySetupId) {
      fetchTokenInfo();
    }
  });

  const fetchTokenInfo = async () => {
    setIsLoadingInfo(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/inventory-setups/${inventorySetupId}/pat-token`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTokenInfo(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch token info');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching token info:', err);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleGenerateToken = async () => {
    if (expiryDays < 1 || expiryDays > 365) {
      setError('Expiry days must be between 1 and 365');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/inventory-setups/${inventorySetupId}/pat-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ expiryDays }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGeneratedToken(data.data.token);
        setTokenExpiry(data.data.expiryDate);
        await fetchTokenInfo();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate token');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error generating token:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!window.confirm('Are you sure you want to revoke this token? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/inventory-setups/${inventorySetupId}/pat-token`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setGeneratedToken('');
        setTokenExpiry('');
        await fetchTokenInfo();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to revoke token');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error revoking token:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = () => {
    const tokenToCopy = generatedToken || tokenInfo?.token || '';
    navigator.clipboard.writeText(tokenToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClose = () => {
    setGeneratedToken('');
    setTokenExpiry('');
    setExpiryDays(90);
    setCopySuccess(false);
    setError('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900">Personal Access Token (PAT)</h2>
          </div>
          <p className="text-sm text-gray-600">
            Client Code: <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-semibold">{clientCode}</span>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Alert */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-900">
                Personal Access Tokens (PATs) function like API keys and can be used to authenticate API requests.
                Keep your tokens secure and never share them publicly.
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingInfo && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Existing Token Info */}
          {!isLoadingInfo && tokenInfo?.hasToken && tokenInfo?.isActive && !generatedToken && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Token</h3>
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={tokenInfo?.token || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    {showToken ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={handleCopyToken}
                    className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                {copySuccess && (
                  <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                    <p className="text-sm text-green-800">Token copied to clipboard!</p>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm">
                  <div className="space-y-1">
                    <p className="text-gray-600">
                      Created: <span className="text-gray-900">{tokenInfo?.createdAt && formatDate(tokenInfo.createdAt)}</span>
                    </p>
                    <p className="text-gray-600">
                      Expires: <span className="text-gray-900">{tokenInfo?.expiryDate && formatDate(tokenInfo.expiryDate)}</span>
                    </p>
                    {tokenInfo?.lastUsedAt && (
                      <p className="text-gray-600">
                        Last Used: <span className="text-gray-900">{formatDate(tokenInfo.lastUsedAt)}</span>
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    tokenInfo?.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tokenInfo?.isValid ? 'Valid' : 'Expired'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Generate New Token */}
          {!isLoadingInfo && (!tokenInfo?.hasToken || !tokenInfo?.isActive || generatedToken) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {generatedToken ? 'New Token Generated' : 'Generate New Token'}
              </h3>

              {generatedToken ? (
                <div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-900 font-semibold">
                      ⚠️ Make sure to copy your token now. You won't be able to see it again!
                    </p>
                  </div>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={generatedToken}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white font-mono text-sm"
                      />
                      <button
                        onClick={() => setShowToken(!showToken)}
                        className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-100"
                      >
                        {showToken ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={handleCopyToken}
                        className="p-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-100"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>

                    {copySuccess && (
                      <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                        <p className="text-sm text-green-800">Token copied to clipboard!</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Expires: {tokenExpiry && formatDate(tokenExpiry)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token Expiry (Days)
                    </label>
                    <input
                      type="number"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(parseInt(e.target.value) || 90)}
                      min={1}
                      max={365}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Token will expire after the specified number of days (1-365)
                    </p>
                  </div>
                  <button
                    onClick={handleGenerateToken}
                    disabled={isLoading}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    {isLoading ? 'Generating...' : 'Generate Token'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 flex justify-between">
          {tokenInfo?.hasToken && tokenInfo?.isActive && !generatedToken && (
            <button
              onClick={handleRevokeToken}
              disabled={isLoading}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Revoking...' : 'Revoke Token'}
            </button>
          )}
          <button
            onClick={handleClose}
            className="ml-auto bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
