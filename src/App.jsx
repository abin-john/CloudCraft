import './App.css';
import { Routes, Route, useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { LoginCallback } from '@okta/okta-react';
import { Security } from '@okta/okta-react';
import config from './config';
import Home from "./components/Home";
import NewPage from "./components/NewPage";
import Loading from './components/Loading';

const oktaAuth = new OktaAuth(config.oidc);

function App() {
  const navigate = useNavigate();
  const restoreOriginalUri = (_oktaAuth, originalUri) => {
    navigate(toRelativeUrl(originalUri || '/', window.location.origin));
  };

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewPage />} />
        <Route path="login/callback" element={<LoginCallback loadingElement={<Loading />} />} />
      </Routes>
    </Security>
  );
}

export default App;