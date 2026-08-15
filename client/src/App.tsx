import { Route, Switch } from 'wouter';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { PlacesSearchPage } from './pages/PlacesSearchPage';
import { PlaceDetailsPage } from './pages/PlaceDetailsPage';
import { JoinQueuePage } from './pages/JoinQueuePage';
import { ActiveTicketTrackerPage } from './pages/ActiveTicketTrackerPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { BusinessSettingsPage } from './pages/BusinessSettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-teal-500 selection:text-white font-sans">
            <Navbar />
            <main className="flex-1">
              <Switch>
                <Route path="/" component={HomePage} />
                <Route path="/places" component={PlacesSearchPage} />
                <Route path="/place/:id" component={PlaceDetailsPage} />
                <Route path="/join/:businessId" component={JoinQueuePage} />
                <Route path="/ticket/:id" component={ActiveTicketTrackerPage} />
                <Route path="/dashboard" component={UserDashboardPage} />
                <Route path="/login" component={LoginPage} />
                <Route path="/register" component={RegisterPage} />
                <Route path="/staff/login" component={StaffLoginPage} />
                <Route path="/staff/dashboard" component={StaffDashboardPage} />
                <Route path="/staff/settings/:businessId" component={BusinessSettingsPage} />
                <Route component={NotFoundPage} />
              </Switch>
            </main>
            <Footer />
          </div>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
