// Semi-final version

// Using React, ReactDOM, and Framer Motion from CDN (loaded in index.html)
// No imports needed - they're globally available

const { useState, useEffect } = React;
const { motion, AnimatePresence } = Motion;

// ============================================================================
// AUTHENTICATION & SESSION MANAGEMENT
// ============================================================================

const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const checkSession = async () => {
            try {
                const response = await fetch('/api/session', {
                    credentials: 'include'
                });
                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Session check failed:', error);
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const signIn = async (email, password) => {
        const response = await fetch('/api/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        const data = await response.json();
        setUser(data.user);
        return data;
    };

    const signUp = async (userData) => {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(userData)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
        }

        const data = await response.json();
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        setUser(null);
    };

    return { user, loading, signIn, signUp, logout };
};

// ============================================================================
// AUTHENTICATION PAGE
// ============================================================================

const AuthPage = ({ onSignIn, onSignUp }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Sign In State
    const [signInData, setSignInData] = useState({
        email: '',
        password: ''
    });

    // Sign Up State
    const [signUpData, setSignUpData] = useState({
        email: '',
        password: '',
        studentNumber: '',
        parentEmail: '',
        gender: 'Male'
    });

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSignIn(signInData.email, signInData.password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSignUp(signUpData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-hero">
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="logo-container">
                        <div className="logo-icon">🚗</div>
                    </div>
                    <h1>DHS Carpooling</h1>
                    <p className="hero-subtitle">
                        Connect with fellow students for safe, convenient rides to school events
                    </p>
                </motion.div>
            </div>

            <div className="auth-forms-container">
                <div className="auth-toggle">
                    <button
                        className={!isSignUp ? 'active' : ''}
                        onClick={() => setIsSignUp(false)}
                    >
                        Sign In
                    </button>
                    <button
                        className={isSignUp ? 'active' : ''}
                        onClick={() => setIsSignUp(true)}
                    >
                        Sign Up
                    </button>
                </div>

                {error && (
                    <motion.div
                        className="error-message"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {error}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {!isSignUp ? (
                        <motion.form
                            key="signin"
                            className="auth-form"
                            onSubmit={handleSignIn}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="form-group">
                                <label htmlFor="signin-email">Email</label>
                                <input
                                    id="signin-email"
                                    type="email"
                                    required
                                    placeholder="your.email@example.com"
                                    value={signInData.email}
                                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="signin-password">Password</label>
                                <input
                                    id="signin-password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={signInData.password}
                                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form
                            key="signup"
                            className="auth-form"
                            onSubmit={handleSignUp}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="form-group">
                                <label htmlFor="signup-email">Email</label>
                                <input
                                    id="signup-email"
                                    type="email"
                                    required
                                    placeholder="your.email@example.com"
                                    value={signUpData.email}
                                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="signup-password">Password</label>
                                <input
                                    id="signup-password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    minLength="6"
                                    value={signUpData.password}
                                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="signup-student-number">Student Number</label>
                                <input
                                    id="signup-student-number"
                                    type="text"
                                    required
                                    placeholder="12345678"
                                    value={signUpData.studentNumber}
                                    onChange={(e) => setSignUpData({ ...signUpData, studentNumber: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="signup-parent-email">Parent/Guardian Email</label>
                                <input
                                    id="signup-parent-email"
                                    type="email"
                                    required
                                    placeholder="parent@example.com"
                                    value={signUpData.parentEmail}
                                    onChange={(e) => setSignUpData({ ...signUpData, parentEmail: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="signup-gender">Gender</label>
                                <select
                                    id="signup-gender"
                                    value={signUpData.gender}
                                    onChange={(e) => setSignUpData({ ...signUpData, gender: e.target.value })}
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Non-binary">Non-binary</option>
                                    <option value="preferNotToSay">Prefer Not To Say</option>
                                </select>
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>

            <footer className="auth-footer">
                <p>Contact Admin for Support</p>
            </footer>
        </div>
    );
};

// ============================================================================
// MAIN APP LAYOUT
// ============================================================================

const Layout = ({ children, user, onLogout, currentPage }) => {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const navItems = [
        { id: 'home', label: 'Home', icon: '🏠' },
        { id: 'request', label: 'Request Ride', icon: '📝' },
        { id: 'current', label: 'Current Rides', icon: '🚙' },
        { id: 'accept', label: 'Accept Ride', icon: '✓' },
        { id: 'feedback', label: 'Feedback', icon: '💬' }
    ];

    return (
        <div className="app-layout">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <div className="logo-small">🚗</div>
                    <h2>DHS Carpooling</h2>
                </div>

                <div className="user-info">
                    <div className="user-avatar">{user.email.charAt(0).toUpperCase()}</div>
                    <div className="user-details">
                        <span className="user-email">{user.email}</span>
                    </div>
                </div>

                <ul className="nav-links">
                    {navItems.map((item, index) => (
                        <motion.li
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <a
                                href={`#${item.id}`}
                                className={currentPage === item.id ? 'active' : ''}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </a>
                        </motion.li>
                    ))}
                </ul>

                <button
                    className="logout-btn"
                    onClick={() => setShowLogoutConfirm(true)}
                >
                    <span>🚪</span> Logout
                </button>
            </nav>

            <main className="main-content">
                {children}
            </main>

            <AnimatePresence>
                {showLogoutConfirm && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowLogoutConfirm(false)}
                    >
                        <motion.div
                            className="modal-content"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3>Confirm Logout</h3>
                            <p>Are you sure you want to logout?</p>
                            <div className="modal-actions">
                                <button onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                                <button onClick={onLogout} className="danger">Logout</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ============================================================================
// PAGE COMPONENTS
// ============================================================================

const HomePage = ({ user }) => (
    <motion.div
        className="page home-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
    >
        <h1>Welcome Back, {user.email.split('@')[0]}! 👋</h1>
        <div className="info-cards">
            <div className="info-card">
                <div className="card-icon">🎯</div>
                <h3>Quick Access</h3>
                <p>Navigate using the sidebar to request rides, view current rides, or accept ride requests from other students.</p>
            </div>
            <div className="info-card">
                <div className="card-icon">🔒</div>
                <h3>Safe & Secure</h3>
                <p>All rides are coordinated through verified student accounts with parent/guardian notification.</p>
            </div>
            <div className="info-card">
                <div className="card-icon">🤝</div>
                <h3>Community Driven</h3>
                <p>Help fellow students get to school events while reducing carbon footprint and building connections.</p>
            </div>
        </div>
    </motion.div>
);

const RequestRidePage = ({ onRequestRide }) => {
    const [formData, setFormData] = useState({
        event: '',
        pickUpTimeDate: '',
        pickUpLocation: '',
        paymentAmount: ''
    });
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onRequestRide(formData);
            setSuccess(true);
            setFormData({
                event: '',
                pickUpTimeDate: '',
                pickUpLocation: '',
                paymentAmount: ''
            });
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to request ride:', error);
        }
    };

    return (
        <motion.div
            className="page request-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1>Request a Ride 📝</h1>

            {success && (
                <motion.div
                    className="success-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    ✓ Ride request submitted successfully!
                </motion.div>
            )}

            <form className="ride-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="event">Event Name</label>
                    <input
                        id="event"
                        type="text"
                        required
                        placeholder="e.g., Basketball Game, Drama Club"
                        value={formData.event}
                        onChange={(e) => setFormData({ ...formData, event: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="pickUpTimeDate">Pick-up Date & Time</label>
                    <input
                        id="pickUpTimeDate"
                        type="datetime-local"
                        required
                        value={formData.pickUpTimeDate}
                        onChange={(e) => setFormData({ ...formData, pickUpTimeDate: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="pickUpLocation">Pick-up Location</label>
                    <input
                        id="pickUpLocation"
                        type="text"
                        required
                        placeholder="e.g., School Main Entrance"
                        value={formData.pickUpLocation}
                        onChange={(e) => setFormData({ ...formData, pickUpLocation: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="paymentAmount">Payment Amount ($)</label>
                    <input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                        value={formData.paymentAmount}
                        onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                    />
                </div>

                <button type="submit" className="submit-btn">Submit Request</button>
            </form>
        </motion.div>
    );
};

const CurrentRidesPage = ({ rides, onAcceptDriver, onDeleteRide }) => {
    const { confirmedRides, requestedRides, acceptedRides } = rides;

    const RideCard = ({ ride, type, onAccept, onDelete }) => (
        <motion.div
            className="ride-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            layout
        >
            <div className="ride-header">
                <h4>{ride.event}</h4>
                <span className={`ride-status ${type}`}>
          {type === 'confirmed' ? '✓ Confirmed' :
              type === 'requested' ? '⏳ Pending' :
                  '👤 Driver Found'}
        </span>
            </div>
            <div className="ride-details">
                <p><strong>📍 Location:</strong> {ride.location}</p>
                <p><strong>🕐 Time:</strong> {new Date(ride.timeDate).toLocaleString()}</p>
                <p><strong>💵 Payment:</strong> ${ride.payment}</p>
                {ride.driverEmail && (
                    <p><strong>🚗 Driver:</strong> {ride.driverEmail}</p>
                )}
            </div>
            <div className="ride-actions">
                {type === 'accepted' && (
                    <button onClick={() => onAccept(ride)} className="accept-btn">
                        Accept Driver
                    </button>
                )}
                <button onClick={() => onDelete(ride)} className="delete-btn">
                    Cancel Ride
                </button>
            </div>
        </motion.div>
    );

    return (
        <motion.div
            className="page current-rides-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1>Your Rides 🚙</h1>

            {confirmedRides.length === 0 && requestedRides.length === 0 && acceptedRides.length === 0 && (
                <div className="empty-state">
                    <p>No active rides yet. Request a ride to get started!</p>
                </div>
            )}

            {confirmedRides.length > 0 && (
                <div className="rides-section">
                    <h2>Confirmed Rides</h2>
                    <div className="rides-grid">
                        {confirmedRides.map((ride) => (
                            <RideCard
                                key={ride.rideId}
                                ride={ride}
                                type="confirmed"
                                onDelete={onDeleteRide}
                            />
                        ))}
                    </div>
                </div>
            )}

            {acceptedRides.length > 0 && (
                <div className="rides-section">
                    <h2>Driver Accepted (Awaiting Your Confirmation)</h2>
                    <div className="rides-grid">
                        {acceptedRides.map((ride) => (
                            <RideCard
                                key={ride.rideId}
                                ride={ride}
                                type="accepted"
                                onAccept={onAcceptDriver}
                                onDelete={onDeleteRide}
                            />
                        ))}
                    </div>
                </div>
            )}

            {requestedRides.length > 0 && (
                <div className="rides-section">
                    <h2>Pending Requests</h2>
                    <div className="rides-grid">
                        {requestedRides.map((ride) => (
                            <RideCard
                                key={ride.rideId}
                                ride={ride}
                                type="requested"
                                onDelete={onDeleteRide}
                            />
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

const AcceptRidePage = ({ availableRides, onAcceptRide }) => {
    const RideCard = ({ ride }) => (
        <motion.div
            className="ride-card available"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            layout
        >
            <div className="ride-header">
                <h4>{ride.event}</h4>
                <span className="ride-payment">💵 ${ride.payment}</span>
            </div>
            <div className="ride-details">
                <p><strong>📍 Location:</strong> {ride.location}</p>
                <p><strong>🕐 Time:</strong> {new Date(ride.timeDate).toLocaleString()}</p>
                <p><strong>👤 Requested by:</strong> {ride.riderEmail}</p>
            </div>
            <button onClick={() => onAcceptRide(ride)} className="accept-btn">
                Accept as Driver
            </button>
        </motion.div>
    );

    return (
        <motion.div
            className="page accept-rides-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1>Available Ride Requests ✓</h1>

            {availableRides.length === 0 ? (
                <div className="empty-state">
                    <p>No ride requests available at the moment. Check back later!</p>
                </div>
            ) : (
                <div className="rides-grid">
                    {availableRides.map((ride) => (
                        <RideCard key={ride.rideId} ride={ride} />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

const FeedbackPage = ({ onSubmitFeedback }) => {
    const [feedback, setFeedback] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmitFeedback(feedback);
            setSuccess(true);
            setFeedback('');
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        }
    };

    return (
        <motion.div
            className="page feedback-page"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <h1>Feedback 💬</h1>

            {success && (
                <motion.div
                    className="success-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    ✓ Thank you for your feedback!
                </motion.div>
            )}

            <form className="feedback-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="feedback">Your Feedback</label>
                    <textarea
                        id="feedback"
                        required
                        rows="8"
                        placeholder="Share your thoughts, suggestions, or report issues..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                    />
                </div>

                <button type="submit" className="submit-btn">Submit Feedback</button>
            </form>

            <div className="contact-info">
                <h3>Contact Admin</h3>
                <p>For urgent matters, please contact the administrator directly.</p>
            </div>
        </motion.div>
    );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

const CarpoolingApp = () => {
    const { user, loading, signIn, signUp, logout } = useAuth();
    const [currentPage, setCurrentPage] = useState('home');
    const [rides, setRides] = useState({
        confirmedRides: [],
        requestedRides: [],
        acceptedRides: []
    });
    const [availableRides, setAvailableRides] = useState([]);

    // Fetch rides data
    useEffect(() => {
        if (user) {
            fetchRides();
            fetchAvailableRides();
        }
    }, [user]);

    // Handle hash navigation
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            if (hash) setCurrentPage(hash);
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const fetchRides = async () => {
        try {
            const response = await fetch('/api/rides/current', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setRides(data);
            }
        } catch (error) {
            console.error('Failed to fetch rides:', error);
        }
    };

    const fetchAvailableRides = async () => {
        try {
            const response = await fetch('/api/rides/available', {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setAvailableRides(data);
            }
        } catch (error) {
            console.error('Failed to fetch available rides:', error);
        }
    };

    const handleRequestRide = async (rideData) => {
        const response = await fetch('/api/rides/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(rideData)
        });

        if (response.ok) {
            await fetchRides();
            await fetchAvailableRides();
        }
    };

    const handleAcceptRide = async (ride) => {
        const response = await fetch('/api/rides/accept-as-driver', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ rideId: ride.rideId })
        });

        if (response.ok) {
            await fetchRides();
            await fetchAvailableRides();
        }
    };

    const handleAcceptDriver = async (ride) => {
        const response = await fetch('/api/rides/accept-driver', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ rideId: ride.rideId })
        });

        if (response.ok) {
            await fetchRides();
        }
    };

    const handleDeleteRide = async (ride) => {
        if (!confirm('Are you sure you want to cancel this ride?')) return;

        const response = await fetch('/api/rides/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ rideId: ride.rideId })
        });

        if (response.ok) {
            await fetchRides();
            await fetchAvailableRides();
        }
    };

    const handleSubmitFeedback = async (feedback) => {
        await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ feedback })
        });
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <AuthPage onSignIn={signIn} onSignUp={signUp} />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <HomePage user={user} />;
            case 'request':
                return <RequestRidePage onRequestRide={handleRequestRide} />;
            case 'current':
                return (
                    <CurrentRidesPage
                        rides={rides}
                        onAcceptDriver={handleAcceptDriver}
                        onDeleteRide={handleDeleteRide}
                    />
                );
            case 'accept':
                return (
                    <AcceptRidePage
                        availableRides={availableRides}
                        onAcceptRide={handleAcceptRide}
                    />
                );
            case 'feedback':
                return <FeedbackPage onSubmitFeedback={handleSubmitFeedback} />;
            default:
                return <HomePage user={user} />;
        }
    };

    return (
        <Layout user={user} onLogout={logout} currentPage={currentPage}>
            <AnimatePresence mode="wait">
                {renderPage()}
            </AnimatePresence>
        </Layout>
    );
};

// CarpoolingApp is now globally available for the browser
// No export needed when using Babel standalone