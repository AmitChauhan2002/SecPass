document.getElementById('lock-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        // Validate username and password
        const response = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (result.success) {
            alert('Password validated! Please perform your hand gesture to unlock.');

            // Validate hand gesture after password validation
            const gestureResult = await validateGesture(username);
            if (gestureResult.success) {
                alert('Hand gesture validated successfully! Redirecting...');

                // Set isLoggedIn flag in localStorage
                localStorage.setItem('isLoggedIn', true);

                // Redirect to the index.html
                window.location.href = '/manager.html';
            } else {
                alert(gestureResult.message || 'Hand gesture validation failed. Try again.');
            }
        } else {
            alert(result.message || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
    }
});

async function validateGesture(username) {
    try {
        const response = await fetch('/validate-gesture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error during hand gesture validation:', error);
        return { success: false, message: 'An error occurred during hand gesture validation.' };
    }
}

function handleGestureValidation() {
    const username = document.getElementById('username').value;

    if (!username) {
        alert('Please enter your username before validating the hand gesture.');
        return;
    }

    validateGesture(username);
}
