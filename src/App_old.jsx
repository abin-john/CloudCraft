import './App.css';
import { useEffect } from 'react'
import { Routes, Route, useNavigate } from "react-router";
import 'bootstrap/dist/css/bootstrap.min.css';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { LoginCallback } from '@okta/okta-react';
import { Security, useOktaAuth } from '@okta/okta-react';
import { RequiredAuth } from './components/SecureRoute';
import config from './config';
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
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
      <AppContent />
    </Security>
  );
}

function AppContent() {
  const { authState } = useOktaAuth();

  useEffect(() => {
    if (authState && authState.isAuthenticated) {
      console.log('User is authenticated');
    } else {
      console.log('User is not authenticated');
    }
  }, [authState]);

  if (!authState) {
    return <Loading />;
  }

  if (authState.error) {
    console.error('Authentication error:', authState.error);
    return <div>Error: {authState.error.message}</div>;
  }

  const username = authState.isAuthenticated ? authState.idToken.claims.name : '';
  const groups = authState.isAuthenticated ? authState.idToken.claims.groups : '';

  return (
    <div className="app-wrapper">
      <div className="content-wrapper">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/new" element={<RequiredAuth />}>
            <Route path="" element={<NewPage />} />
          </Route>
          <Route path="/deploymentroster" element={<DeploymentRoster username={username} groups={groups} />}>
            <Route path="details/aws/:date/:provider" element={<DeploymentDetailsAWS />} />
            <Route path="details/gc/:date/:provider" element={<DeploymentDetailsGC />} />
          </Route>
          <Route path="login/callback" element={<LoginCallback loadingElement={<Loading />} />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;