'use client';

import { useState, useEffect } from "react";
import { AlkaysanOAuthProvider } from '@noonor/alkaysan-one';

export default function AlkaysanClientProvider({ children }) {
  // Determine redirect URI dynamically for Desktop/Localhost support
  const [redirectURI, setRedirectURI] = useState(process.env.NEXT_PUBLIC_REDIRECT_URI);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isRunningInElectron = window.process && window.process.type === 'renderer';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isRunningInElectron) {
        setRedirectURI('alkaysan-pos://callback');
      } else if (isLocalhost) {
        setRedirectURI(`http://${window.location.host}/auth/callback`);
      }
    }
  }, []);

  const isElectron = process.env.NEXT_PUBLIC_PLATFORM === 'electron' || 
                     (typeof window !== 'undefined' && window.process && window.process.type === 'renderer');
                     
  const clientId = isElectron 
    ? (process.env.NEXT_PUBLIC_APP_CLIENT_ID || "15")
    : (process.env.NEXT_PUBLIC_CLIENT_ID || "14");
    
  const clientSecret = isElectron
    ? (process.env.APP_CLIENT_SECRET || "OACP34J2HWTF9EHGFCcf4SVT1qa47HPNhsFqc1hA")
    : (process.env.CLIENT_SECRET || "7Jopgub3ewoD82KdZiNZPyAHv1iyWmSigIhip16L");

  return (
    <AlkaysanOAuthProvider
      clientId={clientId}
      clientSecret={clientSecret}
      redirectURI={redirectURI}
      responseType="code"
    >
      {children}
    </AlkaysanOAuthProvider>
  );
}
