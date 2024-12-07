const encryptionKey = "8z!B#k1@Qh*Wm2^XyLp$9V&r3N-Td%FgOj";

// Encrypt text
function encrypt(text) {
    return CryptoJS.AES.encrypt(text, encryptionKey).toString();
}

// Decrypt text
function decrypt(ciphertext) {
    const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
}

// Mask the password for display
function maskPassword(pass) {
    let str = "";
    for (let index = 0; index < pass.length; index++) {
        str += "*";
    }
    return str;
}

function copyText(txt) {
    const decodedTxt = decodeURIComponent(txt);
    navigator.clipboard.writeText(decodedTxt).then(
        () => {
            document.getElementById("alert").style.display = "inline";
            setTimeout(() => {
                document.getElementById("alert").style.display = "none";
            }, 2000);
        },
        () => {
            alert("Clipboard copying failed");
        }
    );
}

// Delete a password
const deletePassword = (website) => {
    let data = localStorage.getItem("passwords");
    let arr = JSON.parse(data);
    let arrUpdated = arr.filter((e) => e.website !== website);
    localStorage.setItem("passwords", JSON.stringify(arrUpdated));
    alert(`Successfully deleted ${website}'s password`);
    showPasswords();
};

// Show passwords by decrypting them
const showPasswords = () => {
    let tb = document.querySelector("table");
    let data = localStorage.getItem("passwords");
    if (data == null || JSON.parse(data).length == 0) {
        tb.innerHTML = "No Data To Show";
    } else {
        tb.innerHTML = `<tr>
            <th>Website</th>
            <th>Username</th>
            <th>Password</th>
            <th>Delete</th>
        </tr>`;

        let arr = JSON.parse(data);
        let str = "";
        for (let index = 0; index < arr.length; index++) {
            const element = arr[index];
            str += `<tr>
    <td>${element.website} <img onclick="copyText('${encodeURIComponent(element.website)}')" src="./copy-svgrepo-com.svg" alt="Copy Button" width="10" height="10"></td>
    <td>${element.username} <img onclick="copyText('${encodeURIComponent(element.username)}')" src="./copy-svgrepo-com.svg" alt="Copy Button" width="10" height="10"></td>
    <td>${maskPassword(decrypt(element.password))} <img onclick="copyText('${encodeURIComponent(decrypt(element.password))}')" src="./copy-svgrepo-com.svg" alt="Copy Button" width="10" height="10"></td>
    <td><button class="btnsm" onclick="deletePassword('${element.website}')">Delete</button></td>
</tr>`;

        }
        tb.innerHTML += str;
    }

    website.value = "";
    username.value = "";
    password.value = "";
};

console.log("Working");
showPasswords();

// Save password with encryption
document.querySelector(".btn[type='submit']").addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Clicked....");
    console.log(username.value, password.value);

    let passwords = localStorage.getItem("passwords");
    const encryptedPassword = encrypt(password.value); // Encrypt the password

    if (passwords == null) {
        let json = [];
        json.push({
            website: website.value,
            username: username.value,
            password: encryptedPassword,
        });
        alert("Password Saved");
        localStorage.setItem("passwords", JSON.stringify(json));
    } else {
        let json = JSON.parse(passwords);
        json.push({
            website: website.value,
            username: username.value,
            password: encryptedPassword,
        });
        alert("Password Saved");
        localStorage.setItem("passwords", JSON.stringify(json));
    }

    showPasswords();
});

// Generate a strong password and set it in the input field
async function generateStrongPassword() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    const length = 16;

    // Seed with the current timestamp
    let seed = Date.now();

    for (let i = 0; i < length; i++) {
        // Update the seed for each character
        seed = (seed * 9301 + 49297) % 233280; // A simple linear congruential generator (LCG)
        const randomIndex = Math.floor(seed / 233280 * characters.length);
        password += characters.charAt(randomIndex);
    }

    document.getElementById("password").value = password;
    await checkPasswordStrength(password);
}


// Check password strength via backend API
async function checkPasswordStrength(password) {
    const response = await fetch('http://localhost:5001/evaluate_password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password }),
    });

    const data = await response.json();
    const strengthElement = document.getElementById("strengthIndicator");

    if (data.strength) {
        strengthElement.innerText = `Strength: ${data.strength}`;
    } else {
        console.error('Error:', data.error);
    }
}

// Event listener for "Generate Strong Password" button
document.getElementById("generatePassword").addEventListener("click", generateStrongPassword);

// Real-time password strength check
document.getElementById("password").addEventListener("input", (event) => {
    checkPasswordStrength(event.target.value);
});
