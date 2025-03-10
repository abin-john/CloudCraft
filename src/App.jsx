import './App.css';
import { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router";
import 'bootstrap/dist/css/bootstrap.min.css';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { LoginCallback } from '@okta/okta-react';
import { Security } from '@okta/okta-react';
import { RequiredAuth } from './components/SecureRoute';
import config from './config';
import NavBar from "./components/NavBar"
import Footer from "./components/Footer"
import Home from "./components/Home";
import NewPage from "./components/NewPage";
import Loading from './components/Loading';
import DeploymentRoster from './components/DeploymentRoster';
import DeploymentDetailsAWS from './components/DeploymentDetailsAWS';
import DeploymentDetailsGC from './components/DeploymentDetailsGC';

const oktaAuth = new OktaAuth({
  ...config.oidc,
  tokenManager: {
    expireEarlySeconds: 300,
    autoRenew: true,
    storage: 'localStorage',
  }
});

function App() {
  const navigate = useNavigate();
  const restoreOriginalUri = (_oktaAuth, originalUri) => {
    navigate(toRelativeUrl(originalUri || '/', window.location.origin));
  };

  oktaAuth.tokenManager.on('expired', () => {
    oktaAuth.signOut();
  });


  let idleTimeout;
  const idleTimeLimit = 15 * 60 * 1000;

  const resetIdleTimeout = () => {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      oktaAuth.signOut();
    }, idleTimeLimit);
  };

  const setupIdleTimeout = () => {
    window.addEventListener('mousemove', resetIdleTimeout);
    window.addEventListener('keydown', resetIdleTimeout);
    resetIdleTimeout();
  };


  const activeTimeLimit = 8 * 60 * 60 * 1000;
  setTimeout(() => {
    oktaAuth.signOut();
  }, activeTimeLimit);


  useEffect(() => {
    setupIdleTimeout();
    return () => {
      clearTimeout(idleTimeout);
      window.removeEventListener('mousemove', resetIdleTimeout);
      window.removeEventListener('keydown', resetIdleTimeout);
    };
  }, []);

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <div className="app-wrapper">
        <div className="content-wrapper">
          <NavBar></NavBar>
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
        </div>
        <Footer></Footer>
      </div>
    </Security>
  );
}

export default App;