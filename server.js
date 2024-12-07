const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

const usersFilePath = path.join(__dirname, 'users.json');

function readUsers() {
    try {
        if (fs.existsSync(usersFilePath)) {
            const data = fs.readFileSync(usersFilePath, 'utf-8');
            return JSON.parse(data || '{}');
        }
    } catch (error) {
        console.error('Error reading users.json:', error);
    }
    return {};
}

function writeUsers(users) {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error('Error writing to users.json:', error);
    }
}

let userData = readUsers();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to check login status
function checkLogin(req, res, next) {
    const isLoggedIn = req.headers['x-is-logged-in'] === 'true';
    if (!isLoggedIn) {
        return res.redirect('/');
    }
    next();
}

app.get('/manager', checkLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manager.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper to hash a password using hash.py
function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', ['hash.py', password]);
        let hashedPassword = '';

        pythonProcess.stdout.on('data', (data) => {
            hashedPassword += data.toString().trim();
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error('Error in hash.py:', data.toString());
            reject(data.toString());
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve(hashedPassword);
            } else {
                reject(`Hashing process exited with code ${code}`);
            }
        });
    });
}

// Capture hand gesture during registration
app.post('/capture-gesture', (req, res) => {
    const pythonProcess = spawn('python', ['record_hand_pattern.py']);
    let responseSent = false;

    pythonProcess.stdout.on('data', (data) => {
        const rawGesture = data.toString().trim();

        if (!responseSent) {
            responseSent = true;
            if (rawGesture === 'error') {
                return res.status(500).json({ success: false, message: 'Failed to capture gesture' });
            } else {
                try {
                    const gesture = JSON.parse(rawGesture);

                    const users = readUsers();
                    const username = 'test_user'; // Placeholder
                    users[username] = { gesture }; // Save gesture for testing
                    writeUsers(users);

                    return res.json({ success: true, gesture });
                } catch (error) {
                    return res.status(500).json({ success: false, message: 'Invalid gesture format' });
                }
            }
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();

        if (
            error.includes('INFO') ||
            error.includes('WARNING') ||
            error.includes('Disabling support for feedback tensors') ||
            error.includes('Created TensorFlow Lite XNNPACK delegate') ||
            error.includes('landmark_projection_calculator') 
        ) {
            return;
        }

        if (!responseSent) {
            responseSent = true;
            return res.status(500).json({ success: false, message: 'Error during gesture capture', error });
        }
    });

    pythonProcess.on('close', (code) => {
        if (!responseSent && code !== 0) {
            responseSent = true;
            return res.status(500).json({ success: false, message: 'Unexpected error during gesture capture' });
        }
    });
});

app.post('/validate-gesture', (req, res) => {
    const { username } = req.body;

    if (!userData[username]) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const gesture = userData[username].gesture;
    const pythonProcess = spawn('python', ['hand_unlock.py', JSON.stringify(gesture)]);
    let responseSent = false;

    pythonProcess.stdout.on('data', (data) => {
        const result = data.toString().trim();
        if (!responseSent) {
            responseSent = true;
            if (result === 'success') {
                return res.json({ success: true, message: 'Gesture validated successfully' });
            } else {
                return res.status(401).json({ success: false, message: 'Gesture validation failed' });
            }
        }
    });

    pythonProcess.stderr.on('data', (data) => {
        const error = data.toString().trim();

        if (
            error.includes('INFO') ||
            error.includes('WARNING') ||
            error.includes('Disabling support for feedback tensors') ||
            error.includes('Created TensorFlow Lite XNNPACK delegate') ||
            error.includes('landmark_projection_calculator') 
        ) {
            return;
        }

        if (!responseSent) {
            responseSent = true;
            return res.status(500).json({ success: false, message: 'Error during gesture validation', error });
        }
    });

    pythonProcess.on('close', (code) => {
        if (!responseSent && code !== 0) {
            responseSent = true;
            return res.status(500).json({ success: false, message: 'Unexpected error during gesture validation' });
        }
    });
});

// Register route with password hashing
app.post('/register', async (req, res) => {
    const { username, password, gesture } = req.body;

    if (!username || !password || !gesture) {
        return res.status(400).json({ success: false, message: 'Username, password, and gesture are required' });
    }

    if (userData[username]) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    try {
        const hashedPassword = await hashPassword(password);
        userData[username] = { password: hashedPassword, gesture };
        writeUsers(userData);
        res.json({ success: true, message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error hashing password' });
    }
});

// Login route with password verification
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    if (!userData[username]) {
        return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    try {
        const hashedInputPassword = await hashPassword(password);
        if (hashedInputPassword === userData[username].password) {
            return res.json({ success: true, message: 'Login successful' });
        } else {
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error verifying password' });
    }
});

app.get('/users', (req, res) => {
    res.json({ success: true, data: userData });
});

app.post('/update-gesture', (req, res) => {
    const { username, newGesture } = req.body;

    if (!username || !userData[username]) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    userData[username].gesture = newGesture;
    writeUsers(userData);
    res.json({ success: true, message: 'Gesture updated successfully' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
