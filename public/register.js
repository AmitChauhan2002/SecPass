let capturedGesture = null; // Temporarily store the captured gesture for registration

// Function to capture the hand gesture
async function captureGesture() {
    try {
        const response = await fetch('/capture-gesture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        const result = await response.json();

        if (result.success) {
            alert('Hand gesture captured successfully! You can now proceed to register.');
            capturedGesture = result.gesture; // Save the captured gesture locally
            console.log('Captured gesture:', capturedGesture);
        } else {
            alert(result.message || 'Failed to capture hand gesture. Try again.');
        }
    } catch (error) {
        console.error('Error during hand gesture capture:', error);
        alert('An error occurred while capturing hand gesture. Please try again.');
    }
}


// Event listener for the registration form submission
document.getElementById('register-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    // Retrieve username and password entered by the user
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Ensure a hand gesture has been captured before proceeding
    if (!capturedGesture) {
        alert('Please capture your hand gesture before registering.');
        return;
    }

    console.log('Submitting registration with:', { username, password, gesture: capturedGesture }); // Debug log

    try {
        // Send the registration data to the server
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, gesture: capturedGesture }),
        });

        const result = await response.json();

        if (result.success) {
            alert('Registration successful! Redirecting to login...');
            window.location.href = '/'; // Redirect to login or lock page
        } else {
            alert(result.message || 'Failed to register. Try again.');
        }
    } catch (error) {
        console.error('Error during registration:', error);
        alert('An error occurred during registration. Please try again.');
    }
});
