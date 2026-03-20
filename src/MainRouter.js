import React, { useEffect, useState } from 'react';
import LandingPage from './LandingPage';
import RegistrationPage from './RegistrationPage';
import ResourcesPage from './ResourcesPage';
import LoginPage from './LoginPage';
import AdminPage from './AdminPage';
import ResourcePage from './ResourcePage';
import ForgotPasswordPage from './ForgotPasswordPage';
import CheckEmailPage from './CheckEmailPage';
import APIDocs from './APIDocs';
import KnowledgeBase from './KnowledgeBase';
import SupportCenter from './SupportCenter';
import ProductUpdates from './ProductUpdates';
import SupportChatPage from './SupportChatPage';
import ProjectHubPage from './ProjectHubPage';
import UploadProjectPage from './UploadProjectPage';
import SoftwareDetailsPage from './SoftwareDetailsPage';
import VersionDetailPage from './VersionDetailPage';
import PlansPage from './PlansPage';
import CheckoutPage from './CheckoutPage';
import Header from './components/Header';
import { authApi } from './API_Wrapper';
import { trackUserActivity } from './cookieTracking';

function MainRouter() {
  const isAdmin = (candidate) => !!candidate && String(candidate.role || '').toLowerCase() === 'admin';
  const resolveInitialPage = () => {
    const search = new URLSearchParams(window.location.search);
    const fromQuery = search.get('page');
    const allowed = new Set(['landing', 'register', 'forgot_password', 'check_email', 'login']);
    return allowed.has(fromQuery) ? fromQuery : 'landing';
  };

  const [page, setPage] = useState(resolveInitialPage);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedResourceSlug, setSelectedResourceSlug] = useState(null);
  const [isSupportChatOpen, setIsSupportChatOpen] = useState(false);
  const [selectedSoftware, setSelectedSoftware] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const goTo = (target) => () => setPage(target);
  const navigate = (target) => {
    if (isLoggedIn) {
      trackUserActivity('navigate', page, { target }).catch(() => {});
    }

    if (target === 'admin' && !isAdmin(user)) {
      setPage('resources');
      return;
    }

    if (target === 'support_ai' && isLoggedIn) {
      setIsSupportChatOpen(true);
      return;
    }

    if (target === 'developers') {
      setPage('developers');
      return;
    }

    if (target === 'api_docs' || target === 'kb') {
      setPage('api_docs');
      return;
    }

    if (target === 'settings') {
      setPage('resources');
      return;
    }

    setPage(target);
  };

  const openSoftware = (software) => {
    setSelectedSoftware(software);
    setSelectedVersion(null);
    setPage('software_details');
  };

  const openVersion = (software, version) => {
    setSelectedSoftware(software);
    setSelectedVersion(version);
    setPage('version_details');
  };

  const openPlans = () => {
    setPage('plans');
  };

  const openCheckout = (plan) => {
    setSelectedPlan(plan);
    setPage('checkout');
  };

  const handleLogin = async () => {
    setIsLoggedIn(true);
    let profile = null;
    try {
      const res = await authApi.get('/api/v1/users/me');
      profile = res.data;
      setUser(profile);
    } catch {
      profile = null;
      setUser(null);
    }

    if (isAdmin(profile)) {
      setPage('admin');
    } else {
      setPage('resources');
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.post('/api/v1/auth/logout');
    } catch {
      // ignore network/server errors on logout
    }
    setIsLoggedIn(false);
    setUser(null);
    setIsSupportChatOpen(false);
    setSelectedSoftware(null);
    setSelectedVersion(null);
    setSelectedPlan(null);
    setPage('landing');
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    trackUserActivity('page_view', page).catch(() => {});
  }, [isLoggedIn, page]);

  const openResourceDetails = (slug) => {
    setSelectedResourceSlug(slug);
    setPage('resource_details');
  };

  return (
    <div className="app-root">
      {!isLoggedIn && (
        <Header onNavigate={navigate} user={user} onLogout={handleLogout} activePage={page} />
      )}

      {page === 'landing' && <LandingPage onRegister={goTo('register')} onLogin={goTo('login')} />}
      {page === 'register' && <RegistrationPage onBack={goTo('landing')} onRegistered={goTo('login')} />}
      {page === 'forgot_password' && (
        <ForgotPasswordPage onBack={goTo('login')} onCheckEmail={goTo('check_email')} />
      )}
      {page === 'check_email' && <CheckEmailPage onBack={goTo('login')} />}
      {page === 'login' && (
        <LoginPage onBack={goTo('landing')} onLogin={handleLogin} onForgot={goTo('forgot_password')} />
      )}

      {page === 'resources' && isLoggedIn && (
        <ResourcesPage user={user} onNavigate={navigate} onLogout={handleLogout} activePage="resources" />
      )}

      {page === 'projects' && isLoggedIn && (
        <ProjectHubPage
          user={user}
          onNavigate={navigate}
          onLogout={handleLogout}
          activePage="projects"
          onOpenSoftware={openSoftware}
          onNavigatePlans={openPlans}
        />
      )}

      {page === 'upload_project' && isLoggedIn && (
        <UploadProjectPage user={user} onNavigate={navigate} onLogout={handleLogout} activePage="upload_project" />
      )}

      {page === 'software_details' && isLoggedIn && (
        <SoftwareDetailsPage
          user={user}
          software={selectedSoftware}
          onNavigate={navigate}
          onLogout={handleLogout}
          onBack={() => setPage('projects')}
          onOpenVersion={openVersion}
        />
      )}

      {page === 'version_details' && isLoggedIn && (
        <VersionDetailPage
          user={user}
          software={selectedSoftware}
          version={selectedVersion}
          onNavigate={navigate}
          onLogout={handleLogout}
          onBack={() => setPage('software_details')}
        />
      )}

      {page === 'plans' && isLoggedIn && (
        <PlansPage
          user={user}
          onNavigate={navigate}
          onLogout={handleLogout}
          onSelectPlan={openCheckout}
          onBack={() => setPage('projects')}
        />
      )}

      {page === 'checkout' && isLoggedIn && (
        <CheckoutPage
          user={user}
          onNavigate={navigate}
          onLogout={handleLogout}
          selectedPlan={selectedPlan}
          onBack={() => setPage('plans')}
        />
      )}

      {page === 'developers' && isLoggedIn && (
        <APIDocs user={user} onNavigate={navigate} onLogout={handleLogout} activePage="developers" />
      )}

      {page === 'api_docs' && isLoggedIn && (
        <APIDocs user={user} onNavigate={navigate} onLogout={handleLogout} activePage="api_docs" />
      )}

      {page === 'kb' && isLoggedIn && <KnowledgeBase user={user} onOpenResource={openResourceDetails} />}
      {page === 'support' && isLoggedIn && <SupportCenter user={user} onOpenResource={openResourceDetails} />}
      {page === 'updates' && isLoggedIn && <ProductUpdates user={user} onOpenResource={openResourceDetails} />}

      {page === 'resource_details' && isLoggedIn && selectedResourceSlug && (
        <ResourcePage slug={selectedResourceSlug} onBack={goTo('resources')} />
      )}

      {page === 'admin' && isLoggedIn && isAdmin(user) && (
        <AdminPage user={user} onBack={goTo('resources')} onNavigate={navigate} />
      )}

      {isLoggedIn && (
        <SupportChatPage
          isOpen={isSupportChatOpen}
          onOpen={() => {
            trackUserActivity('support_chat_open', page).catch(() => {});
            setIsSupportChatOpen(true);
          }}
          onClose={() => {
            trackUserActivity('support_chat_close', page).catch(() => {});
            setIsSupportChatOpen(false);
          }}
          contextPage={page}
        />
      )}
    </div>
  );
}

export default MainRouter;
