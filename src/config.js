
// eslint-disable-next-line
export default {
  oidc: {
    clientId: '0oamzkf49zOQfsnaa5d7',
    issuer: 'https://dev-75470227.okta.com/oauth2/default',
    redirectUri: window.location.origin + '/login/callback',
    scopes: ['openid', 'profile', 'email', 'offline_access'],
  },
  resourceServer: {
    messagesUrl: 'http://localhost:8000/api/messages',
  },
};
