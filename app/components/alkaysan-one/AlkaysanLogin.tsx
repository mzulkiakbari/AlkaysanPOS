/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { useEffect, useRef } from 'react';

import { useAlkaysanOAuth } from './AlkaysanOauthProvider';
import {
  IdConfiguration,
  AlkaysanButtonConfiguration,
  AlkaysanCredentialResponse,
} from './types';

const containerHeightMap = { large: 40, medium: 32, small: 20 };

export type AlkaysanLoginProps = {
  onSuccess?: (credentialResponse: AlkaysanCredentialResponse) => void;
  onError?: () => void;
  onLoad?: () => void;
  containerProps?: React.ComponentPropsWithoutRef<'div'>;
} & Omit<
  IdConfiguration,
  'client_id' | 'client_secret' | 'redirect_uri' | 'callback'
> &
  AlkaysanButtonConfiguration;

export default function AlkaysanLogin({
  onSuccess = () => {},
  onError,
  onLoad,
  mode = 'popup',
  type = 'button',
  theme = 'filled_light',
  size = 'large',
  text = 'signin_with',
  shape = 'pill',
  locale,
  containerProps,
  ...props
}: AlkaysanLoginProps) {
  const btnContainerRef = useRef<HTMLDivElement>(null);
  const { clientId, clientSecret, redirectURI, responseType, scriptLoadedSuccessfully } = useAlkaysanOAuth();

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!scriptLoadedSuccessfully) return;

    window?.alkaysan?.account?.id?.initialize({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectURI,
      response_type: responseType,
      callback: (credentialResponse: AlkaysanCredentialResponse) => {
        if (!credentialResponse?.credential) {
          return onErrorRef.current?.();
        }

        const { credential } = credentialResponse;
        onSuccessRef.current({
          credential
        });
      },
      ...props,
    });

    window?.alkaysan?.account?.id?.renderButton(btnContainerRef.current!, {
      mode,
      type,
      theme,
      size,
      text,
      shape,
      locale
    });
  }, [scriptLoadedSuccessfully]);

  return (
    <div
      {...containerProps}
      ref={btnContainerRef}
      style={{ height: containerHeightMap[size], ...containerProps?.style }}
    />
  );
}

