import { useAlkaysanOAuth } from '../AlkaysanOauthProvider';

export const GetCode = () => {
  const getUri = window.location.href;
  const splitUri = getUri.split('?');
  const params = splitUri.length > 1 ? splitUri[1] : null;

  if (params && params.includes('code')) {
    const code = params.split('=')[1];
    console.log(code);
  }
}

export const GetToken = async (code: string) => {
  const { clientId, clientSecret, redirectURI } = useAlkaysanOAuth();
  await fetch(
    "https://account.alkaysan.co.id/oauth/token",
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(
        {
          grant_type: 'authorization_code',
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectURI,
          code: code,
        }
      )
    }
  )
  .then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then((data) => {
    console.log('Success:', data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
};
