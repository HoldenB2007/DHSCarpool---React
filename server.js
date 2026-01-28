const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');

// ============================================================================
// DATA STORAGE (In-Memory)
// ============================================================================

let rideCount = 0;
let allRideRequests = [];
let allDriverAcceptedRides = [];
let allConfirmedRides = [];

// Initialize with admin account
const adminSaltRounds = 10;
const adminSalt = bcrypt.genSaltSync(adminSaltRounds);
const adminHashedPassword = bcrypt.hashSync('admin', adminSalt);

let allUsersPasswords = [adminHashedPassword];
let allUsersGender = ["male"];
let allUsersParentEmail = ["admin@parent.com"];
let allUsersEmail = ["admin@gmail.com"];
let studentNumbers = ['1', '2', '3', '12345678']; // Added more valid student numbers

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

app.use(express.static('public')); // Serve static files from 'public' folder
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Session configuration
function generateSecretKey(length) {
    return crypto.randomBytes(length).toString('hex');
}

const secretKey = generateSecretKey(32);
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true when using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
};

// ============================================================================
// ROUTES
// ============================================================================

// Serve the React app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

// Check session
app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Sign In
app.post('/api/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send('Email and password are required');
        }

        const userIndex = allUsersEmail.findIndex(e => e === email);

        if (userIndex === -1) {
            return res.status(404).send('Account not found');
        }

        const match = await bcrypt.compare(password, allUsersPasswords[userIndex]);

        if (match) {
            req.session.user = {
                email: allUsersEmail[userIndex],
                parentEmail: allUsersParentEmail[userIndex],
                gender: allUsersGender[userIndex]
            };
            res.json({ user: req.session.user });
        } else {
            res.status(401).send('Incorrect password');
        }
    } catch (error) {
        console.error('Sign in error:', error);
        res.status(500).send('Internal server error');
    }
});

// Sign Up
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password, studentNumber, parentEmail, gender } = req.body;

        // Validation
        if (!email || !password || !studentNumber || !parentEmail || !gender) {
            return res.status(400).send('All fields are required');
        }

        // Check if email already exists
        if (allUsersEmail.includes(email)) {
            return res.status(409).send('Email already in use');
        }

        // Validate student number
        if (!studentNumbers.includes(studentNumber)) {
            return res.status(400).send('Invalid student number');
        }

        // Hash password
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store user
        allUsersEmail.push(email);
        allUsersPasswords.push(hashedPassword);
        allUsersParentEmail.push(parentEmail);
        allUsersGender.push(gender);

        // Create session
        req.session.user = {
            email,
            parentEmail,
            gender
        };

        res.json({ user: req.session.user });
    } catch (error) {
        console.error('Sign up error:', error);
        res.status(500).send('Internal server error');
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).send('Error logging out');
        }
        res.json({ success: true });
    });
});

// ============================================================================
// RIDE ENDPOINTS
// ============================================================================

// Get current user's rides
app.get('/api/rides/current', requireAuth, (req, res) => {
    const userEmail = req.session.user.email;

    const confirmedRides = allConfirmedRides.filter(ride =>
        ride.riderEmail === userEmail || ride.driverEmail === userEmail
    );

    const requestedRides = allRideRequests.filter(ride =>
        ride.riderEmail === userEmail
    );

    const acceptedRides = allDriverAcceptedRides.filter(ride =>
        ride.riderEmail === userEmail
    );

    res.json({
        confirmedRides,
        requestedRides,
        acceptedRides
    });
});

// Get available rides (rides requested by other users)
app.get('/api/rides/available', requireAuth, (req, res) => {
    const userEmail = req.session.user.email;

    const availableRides = allRideRequests.filter(ride =>
        ride.riderEmail !== userEmail
    );

    res.json(availableRides);
});

// Request a ride
app.post('/api/rides/request', requireAuth, (req, res) => {
    try {
        const { event, pickUpTimeDate, pickUpLocation, paymentAmount } = req.body;

        if (!event || !pickUpTimeDate || !pickUpLocation || !paymentAmount) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newRide = {
            riderEmail: req.session.user.email,
            driverEmail: '',
            event,
            timeDate: pickUpTimeDate,
            location: pickUpLocation,
            payment: paymentAmount,
            rideIndex: allRideRequests.length,
            mainList: 'allRideRequests',
            rideId: rideCount++
        };

        allRideRequests.push(newRide);
        updateRideIndices(allRideRequests);

        res.json({ success: true, ride: newRide });
    } catch (error) {
        console.error('Request ride error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Accept a ride as driver
app.post('/api/rides/accept-as-driver', requireAuth, (req, res) => {
    try {
        const { rideId } = req.body;
        const rideIndex = allRideRequests.findIndex(r => r.rideId === rideId);

        if (rideIndex === -1) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        const ride = allRideRequests[rideIndex];
        ride.driverEmail = req.session.user.email;
        ride.mainList = 'allDriverAcceptedRides';

        allDriverAcceptedRides.push(ride);
        allRideRequests.splice(rideIndex, 1);

        updateRideIndices(allRideRequests);
        updateRideIndices(allDriverAcceptedRides);

        res.json({ success: true });
    } catch (error) {
        console.error('Accept as driver error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Accept driver (rider confirms driver)
app.post('/api/rides/accept-driver', requireAuth, (req, res) => {
    try {
        const { rideId } = req.body;
        const rideIndex = allDriverAcceptedRides.findIndex(r => r.rideId === rideId);

        if (rideIndex === -1) {
            return res.status(404).json({ error: 'Ride not found' });
        }

        const ride = allDriverAcceptedRides[rideIndex];

        // Verify that the current user is the rider
        if (ride.riderEmail !== req.session.user.email) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        ride.mainList = 'allConfirmedRides';
        allConfirmedRides.push(ride);
        allDriverAcceptedRides.splice(rideIndex, 1);

        updateRideIndices(allConfirmedRides);
        updateRideIndices(allDriverAcceptedRides);

        res.json({ success: true });
    } catch (error) {
        console.error('Accept driver error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete/Cancel a ride
app.post('/api/rides/delete', requireAuth, (req, res) => {
    try {
        const { rideId } = req.body;
        const userEmail = req.session.user.email;

        // Try to find and delete from all lists
        let deleted = false;

        // Check confirmed rides
        let rideIndex = allConfirmedRides.findIndex(r => r.rideId === rideId);
        if (rideIndex !== -1) {
            const ride = allConfirmedRides[rideIndex];
            if (ride.riderEmail === userEmail || ride.driverEmail === userEmail) {
                allConfirmedRides.splice(rideIndex, 1);
                updateRideIndices(allConfirmedRides);
                deleted = true;
            }
        }

        // Check driver accepted rides
        if (!deleted) {
            rideIndex = allDriverAcceptedRides.findIndex(r => r.rideId === rideId);
            if (rideIndex !== -1) {
                const ride = allDriverAcceptedRides[rideIndex];
                if (ride.riderEmail === userEmail || ride.driverEmail === userEmail) {
                    allDriverAcceptedRides.splice(rideIndex, 1);
                    updateRideIndices(allDriverAcceptedRides);
                    deleted = true;
                }
            }
        }

        // Check ride requests
        if (!deleted) {
            rideIndex = allRideRequests.findIndex(r => r.rideId === rideId);
            if (rideIndex !== -1) {
                const ride = allRideRequests[rideIndex];
                if (ride.riderEmail === userEmail) {
                    allRideRequests.splice(rideIndex, 1);
                    updateRideIndices(allRideRequests);
                    deleted = true;
                }
            }
        }

        if (deleted) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Ride not found or not authorized' });
        }
    } catch (error) {
        console.error('Delete ride error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// FEEDBACK ENDPOINT
// ============================================================================

app.post('/api/feedback', requireAuth, (req, res) => {
    try {
        const { feedback } = req.body;
        const userEmail = req.session.user.email;

        // In a real app, store this in a database
        console.log(`Feedback from ${userEmail}: ${feedback}`);

        res.json({ success: true });
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function updateRideIndices(rideArray) {
    rideArray.forEach((ride, index) => {
        ride.rideIndex = index;
    });
}

// ============================================================================
// START SERVER
// ============================================================================

app.listen(port, () => {
    console.log('='.repeat(60));
    console.log('🚗 DHS Carpooling Server Started');
    console.log('='.repeat(60));
    console.log(`📍 Server: http://localhost:${port}`);
    console.log(`👤 Default Admin Account:`);
    console.log(`   Email: admin@gmail.com`);
    console.log(`   Password: admin`);
    console.log(`📝 Valid Student Numbers: ${studentNumbers.join(', ')}`);
    console.log('='.repeat(60));
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});