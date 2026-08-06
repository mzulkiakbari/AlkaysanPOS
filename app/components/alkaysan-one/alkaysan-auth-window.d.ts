import {
  IdConfiguration,
  PromptListener,
  AlkaysanButtonConfiguration,
  TokenClientConfig,
  OverridableTokenClientConfig,
  CodeClientConfig,
  TokenResponse,
} from './types';
declare global {
  interface Window {
    alkaysan?: {
      account: {
        id: {
          initialize: (input: IdConfiguration) => void;
          prompt: (promptListener?: PromptListener) => void;
          renderButton: (
            parent: HTMLElement,
            options: AlkaysanButtonConfiguration,
          ) => void;
          disableAutoSelect: () => void;
          storeCredential: (
            credential: { id: string; password: string },
            callback?: () => void,
          ) => void;
          cancel: () => void;
          revoke: (accessToken: string, done: () => void) => void;
        };
        oauth2: {
          initTokenClient: (config: TokenClientConfig) => {
            requestAccessToken: (
              overridableClientConfig?: OverridableTokenClientConfig,
            ) => void;
          };
          initCodeClient: (config: CodeClientConfig) => {
            requestCode: () => void;
          };
          hasGrantedAnyScope: (
            tokenResponse: TokenResponse,
            firstScope: string,
            ...restScopes: string[]
          ) => boolean;
          hasGrantedAllScopes: (
            tokenResponse: TokenResponse,
            firstScope: string,
            ...restScopes: string[]
          ) => boolean;
          revoke: (accessToken: string, done?: () => void) => void;
        };
      };
    };
  }
}
