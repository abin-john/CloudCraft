import './App.css';
import { Routes, Route, useNavigate } from "react-router";
import 'bootstrap/dist/css/bootstrap.min.css';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { LoginCallback } from '@okta/okta-react';
import { Security } from '@okta/okta-react';
import { RequiredAuth } from './components/SecureRoute';
import config from './config';
import Home from "./components/Home";
import NewPage from "./components/NewPage";
import Loading from './components/Loading';
import DeploymentRoster from './components/DeploymentRoster';
import DeploymentDetailsAWS from './components/DeploymentDetailsAWS';
import DeploymentDetailsGC from './components/DeploymentDetailsGC';

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
        <Route path="/new" element={<RequiredAuth />}>
          <Route path="" element={<NewPage />} />
        </Route>
        <Route path="/deploymentroster" element={<DeploymentRoster />}>
          <Route path="details/aws/:date/:provider" element={<DeploymentDetailsAWS />} />
          <Route path="details/gc/:date/:provider" element={<DeploymentDetailsGC />} />
        </Route>
        <Route path="login/callback" element={<LoginCallback loadingElement={<Loading />} />} />
      </Routes>
    </Security>
  );
}

export default App;