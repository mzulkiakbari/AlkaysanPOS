import { useState, useEffect, useRef } from 'react';

export interface UseLoadAlkaysanSSOScriptOptions {
  /**
   * Nonce applied to SSO script tag. Propagates to SSO inline style tag
   */
  nonce?: string;
  /**
   * Callback fires on load 
   */
  onScriptLoadSuccess?: () => void;
  /**
   * Callback fires on load
   */
  onScriptLoadError?: () => void;
}

export default function useLoadAlkaysanSSOScript(
  options: UseLoadAlkaysanSSOScriptOptions = {},
): boolean {
  const { nonce, onScriptLoadSuccess, onScriptLoadError } = options;

  const [scriptLoadedSuccessfully, setScriptLoadedSuccessfully] =
    useState(false);

  const onScriptLoadSuccessRef = useRef(onScriptLoadSuccess);
  onScriptLoadSuccessRef.current = onScriptLoadSuccess;

  const onScriptLoadErrorRef = useRef(onScriptLoadError);
  onScriptLoadErrorRef.current = onScriptLoadError;

  useEffect(() => {
    const scriptTag = document.createElement('script');
    scriptTag.src = 'https://account.alkaysan.com/sso/client';
    scriptTag.async = true;
    scriptTag.defer = true;
    scriptTag.nonce = nonce;
    scriptTag.onload = () => {
      setScriptLoadedSuccessfully(true);
      onScriptLoadSuccessRef.current?.();
    };
    scriptTag.onerror = () => {
      setScriptLoadedSuccessfully(false);
      onScriptLoadErrorRef.current?.();
    };

    document.body.appendChild(scriptTag);

    return () => {
      document.body.removeChild(scriptTag);
    };
  }, [nonce]);

  return scriptLoadedSuccessfully;
}