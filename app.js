let encryptionKey = '';
let passwords = [];

const appContainer = document.getElementById('app-container');
const masterModal = document.getElementById('master-modal');
const masterForm = document.getElementById('master-form');
const masterPasswordInput = document.getElementById('master-password');
const toggleMasterPassword = document.querySelector('.toggle-master-password');
const passwordList = document.querySelector('.password-list');
const searchInput = document.getElementById('search-input');
const addBtn = document.getElementById('add-btn');
const modal = document.getElementById('add-modal');
const closeBtn = document.querySelector('#add-modal .close-btn');
const cancelBtn = document.querySelector('#add-modal .cancel-btn'); // Added for cancel button
const passwordForm = document.getElementById('password-form');
const togglePassword = document.querySelector('#add-modal .toggle-password');
const passwordInput = document.getElementById('password');
const strengthMeter = document.querySelector('#add-modal .strength-meter');
const strengthText = document.querySelector('#add-modal .strength-text');
const categories = document.querySelectorAll('.category');
const settingsModal = document.getElementById('settings-modal');
const editModal = document.getElementById('edit-modal');
const editCancelBtn = document.querySelector('#edit-modal .cancel-btn'); // Added for edit modal cancel
const settingsBtn = document.getElementById('settings-btn');
const autoLockTime = document.getElementById('auto-lock-time');

let currentFilter = {
    category: null,
    searchTerm: ''
};
function applyDarkModeToModals() {
    const modals = document.querySelectorAll('.modal-content, .settings-content, .sidebar .category');
    modals.forEach(modal => {
        modal.style.backgroundColor = '#1e1e2f';
        modal.style.color = '#e0e0e0';
        modal.style.borderColor = '#2c2c3e';
        const inputs = modal.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.backgroundColor = '#2c2c3e';
            input.style.borderColor = '#3d3d50';
            input.style.color = '#e0e0e0';
        });
        const labels = modal.querySelectorAll('label');
        labels.forEach(label => {
            label.style.color = '#a0a0a0';
        });
        const buttons = modal.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.backgroundColor = '#2c2c3e';
            button.style.color = '#e0e0e0';
            button.style.borderColor = '#3d3d50';
        });
        const headers = modal.querySelectorAll('.modal-header');
        headers.forEach(header => {
            header.style.backgroundColor = '#1e1e2f';
            header.style.color = '#e0e0e0';
        });
    });
}

function removeDarkModeFromModals() {
    const modals = document.querySelectorAll('.modal-content, .settings-content, .sidebar .category');
    modals.forEach(modal => {
        modal.style.backgroundColor = '#ffffff';
        modal.style.color = '#333333';
        modal.style.borderColor = '#cccccc';
        const inputs = modal.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.style.backgroundColor = '#ffffff';
            input.style.borderColor = '#cccccc';
            input.style.color = '#333333';
        });
        const labels = modal.querySelectorAll('label');
        labels.forEach(label => {
            label.style.color = '#666666';
        });
        const buttons = modal.querySelectorAll('button');
        buttons.forEach(button => {
            button.style.backgroundColor = '#007bff';
            button.style.color = '#ffffff';
            button.style.borderColor = '#0056b3';
        });
        const headers = modal.querySelectorAll('.modal-header');
        headers.forEach(header => {
            header.style.backgroundColor = '';
            header.style.color = '';
        });
    });
}
function encryptPassword(password) {
    if (typeof password !== 'string') {
        console.error('Invalid password type for encryption');
        return '';
    }
    if (!encryptionKey) {
        console.error('Encryption key not set');
        return password;
    }
    return CryptoJS.AES.encrypt(password, encryptionKey).toString();
}

function decryptPassword(encrypted) {
    try {
        if (!encryptionKey) {
            throw new Error('Encryption key not set');
        }
        const bytes = CryptoJS.AES.decrypt(encrypted, encryptionKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) throw new Error('Decryption failed - possibly wrong key');
        return decrypted;
    } catch (e) {
        console.error('Decryption failed', e);
        return null;
    }
}

function loadPasswords() {
    const savedPasswords = localStorage.getItem('encryptedPasswords');
    if (savedPasswords) {
        try {
            passwords = JSON.parse(savedPasswords);
            if (passwords.length > 0 && (!passwords[0].hasOwnProperty('date') || typeof passwords[0].password !== 'string')) {
                console.error('Invalid password format or missing date in storage');
                passwords = passwords.map(p => ({
                    ...p,
                    date: p.date || new Date().toISOString().split('T')[0] // Set default date if missing
                }));
            }
        } catch (e) {
            console.error('Error parsing saved passwords:', e);
            passwords = [];
        }
    } else {
        passwords = [];
    }
}

function savePasswords() {
    localStorage.setItem('encryptedPasswords', JSON.stringify(passwords));
}

function encryptAllPasswords() {
    if (!encryptionKey) {
        console.error('Cannot encrypt - no encryption key set');
        return;
    }
    passwords = passwords.map(p => ({
        ...p,
        password: encryptPassword(decryptPassword(p.password) || p.password)
    }));
    savePasswords();
}

function checkMasterPassword() {
    const savedHash = localStorage.getItem('masterPasswordHash');
    if (!savedHash) {
        setMasterPassword();
    } else {
        masterModal.style.display = 'flex';
    }
}

function setMasterPassword() {
    const newPassword = prompt('Set your master password (min 8 characters):');
    if (newPassword && newPassword.length >= 8) {
        const hash = CryptoJS.SHA256(newPassword).toString();
        localStorage.setItem('masterPasswordHash', hash);
        encryptionKey = newPassword;
        appContainer.style.display = 'block';
        encryptAllPasswords();
        filterPasswords();
    } else if (newPassword) {
        alert('Master password must be at least 8 characters');
        setMasterPassword();
    }
}

function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return Math.min(4, strength);
}

function updateStrengthMeter(password, meter, text) {
    const strength = checkPasswordStrength(password);
    meter.setAttribute('data-strength', strength);
    const texts = ['Very Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
    const colors = ['var(--danger)', 'var(--warning)', '#f59e0b', 'var(--success)', 'var(--success)'];
    text.textContent = `Password strength: ${texts[strength]}`;
    text.style.color = colors[strength];
}

function editPassword(e) {
    console.log('Edit button clicked');
    const entryElement = e.target.closest('.password-item');
    if (!entryElement) {
        console.error('Could not find password-item element');
        return;
    }
    const entryId = entryElement.dataset.id;
    console.log('Editing password with ID:', entryId);
    const passwordObj = passwords.find(p => p.id === entryId);
    
    if (!passwordObj) {
        console.error(`Password with ID ${entryId} not found`);
        return;
    }
    
    console.log('Password object found:', passwordObj);
    if (!editModal) {
        console.error('Edit modal not found');
        return;
    }
    
    document.getElementById('edit-id').value = passwordObj.id;
    document.getElementById('edit-account-type').value = passwordObj.type;
    document.getElementById('edit-account-name').value = passwordObj.name;
    document.getElementById('edit-username').value = passwordObj.username;
    document.getElementById('edit-password').value = decryptPassword(passwordObj.password) || '********';
    
    const editMeter = document.querySelector('#edit-modal .strength-meter');
    const editText = document.querySelector('#edit-modal .strength-text');
    updateStrengthMeter(document.getElementById('edit-password').value, editMeter, editText);
    editModal.style.display = 'flex';
    console.log('Edit modal displayed');
}

function displayPasswords(passwordsToShow) {
    passwordList.innerHTML = '';

    if (passwordsToShow.length === 0) {
        passwordList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-key"></i>
                <p>No passwords found matching your criteria.</p>
            </div>
        `;
        return;
    }

    passwordsToShow.forEach(password => {
        const passwordItem = document.createElement('div');
        passwordItem.className = 'password-item';
        passwordItem.dataset.id = password.id;
        passwordItem.innerHTML = `
            <div class="password-icon">
                <i class="fas ${getIconForType(password.type)}"></i>
            </div>
            <div class="password-details">
                <h3>${password.name}</h3>
                <p>${password.username}</p>
                <div class="password-display">
                    <span class="password-mask">••••••••</span>
                    <span class="password-text">${decryptPassword(password.password) || '********'}</span>
                </div>
            </div>
            <div class="password-actions">
                <button class="action-btn view-btn" title="View Password">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn copy-btn" title="Copy Password">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="action-btn edit-btn" title="Edit Entry">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="password-date">
                <span>${new Date(password.date).toLocaleDateString('en-GB')}</span>

            </div>
        `;
        passwordList.appendChild(passwordItem);
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });

    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', copyPassword);
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', editPassword);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deletePassword);
    });
}

function getIconForType(type) {
    const icons = {
        'social': 'fa-users',
        'banking': 'fa-university',
        'education': 'fa-book'
    };
    return icons[type] || 'fa-key';
}

function filterPasswords() {
    let filtered = passwords;
    
    if (currentFilter.category) {
        filtered = filtered.filter(p => p.type === currentFilter.category);
    }
    
    if (currentFilter.searchTerm) {
        const term = currentFilter.searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(term) || 
            p.username.toLowerCase().includes(term)
        );
    }
    
    displayPasswords(filtered);
}

function togglePasswordVisibility(e) {
    const btn = e.currentTarget;
    const passwordItem = btn.closest('.password-item');
    const mask = passwordItem.querySelector('.password-mask');
    const text = passwordItem.querySelector('.password-text');
    const icon = btn.querySelector('i');
    
    if (mask.style.display === 'none') {
        mask.style.display = 'inline';
        text.style.display = 'none';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    } else {
        mask.style.display = 'none';
        text.style.display = 'inline';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    }
}
function copyPassword(e) {
    // Ensure the event target is the button
    const btn = e.currentTarget || e.target.closest('.copy-btn');
    if (!btn) {
        console.error('Copy button not found in event target');
        alert('Failed to copy password: Button not found.');
        return;
    }

    const passwordItem = btn.closest('.password-item');
    if (!passwordItem) {
        console.error('No password item found for copy action');
        alert('Failed to copy password: Item not found.');
        return;
    }

    const entryId = passwordItem.dataset.id;
    console.log('Attempting to copy password with ID:', entryId);
    const passwordEntry = passwords.find(p => p.id === entryId);

    if (!passwordEntry) {
        console.error('Password entry not found for ID:', entryId);
        alert('Failed to copy password: Entry not found in data.');
        return;
    }

    console.log('Password entry found:', passwordEntry);
    if (!encryptionKey) {
        console.error('Encryption key not set');
        alert('Please set or enter the master password to decrypt and copy the password.');
        return;
    }

    const decryptedPassword = decryptPassword(passwordEntry.password);
    console.log('Decrypted password:', decryptedPassword ? 'Success' : 'Failed');
    if (decryptedPassword) {
        navigator.clipboard.writeText(decryptedPassword).then(() => {
            console.log('Clipboard write successful');
            const originalHTML = btn.innerHTML; // Safe to access now
            btn.innerHTML = `<i class="fas fa-check"></i>`;
            setTimeout(() => {
                btn.innerHTML = originalHTML;
            }, 2000);
            alert('Password copied to clipboard!');
        }).catch(err => {
            console.error('Clipboard write failed:', err);
            alert('Failed to copy password to clipboard. Please try again. Error: ' + err.message);
        });
    } else {
        console.error('Decryption failed for password ID:', entryId);
        alert('Unable to decrypt password. Please verify your master password and try again.');
    }
}function deletePassword(e) {
    const id = e.currentTarget.closest('.password-item').dataset.id;
    if (confirm('Are you sure you want to delete this password?')) {
        passwords = passwords.filter(p => p.id !== id);
        savePasswords();
        filterPasswords();
    }
}// ... (previous variable declarations and functions remain unchanged)

function initApp() {
    if (!appContainer || !masterModal || !passwordForm || !editModal) {
        console.error('Critical DOM elements missing');
        return;
    }

    // Initialize dark mode based on localStorage
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        applyDarkModeToModals();
    } else {
        document.body.classList.remove('dark-mode');
        removeDarkModeFromModals();
    }

    // Fix toggle logic to match "on" with dark mode
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.checked = isDarkMode; // Sync checkbox state with stored value
    darkModeToggle.addEventListener('change', () => {
        const isDarkModeNow = darkModeToggle.checked; // Use checked state directly
        document.body.classList.toggle('dark-mode', isDarkModeNow);
        localStorage.setItem('darkMode', isDarkModeNow);
        if (isDarkModeNow) {
            applyDarkModeToModals();
        } else {
            removeDarkModeFromModals();
        }
    });

    searchInput.addEventListener('input', function() {
        currentFilter.searchTerm = this.value;
        filterPasswords();
    });

    categories.forEach(category => {
        category.addEventListener('click', function() {
            const type = this.getAttribute('data-category');
            currentFilter.category = currentFilter.category === type ? null : type;
            categories.forEach(c => c.classList.remove('active'));
            if (currentFilter.category) this.classList.add('active');
            filterPasswords();
            if (type === 'settings') {
                settingsModal.style.display = 'flex';
                console.log('Settings modal opened, checking icons:', category.innerHTML); // Debug log
            }
        });
    });

    addBtn.addEventListener('click', () => modal.style.display = 'flex');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    cancelBtn.addEventListener('click', () => modal.style.display = 'none'); // Fix cancel button
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
        if (e.target === editModal) editModal.style.display = 'none';
        if (e.target === settingsModal) settingsModal.style.display = 'none';
    });

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
        this.classList.toggle('fa-eye');
    });

    toggleMasterPassword.addEventListener('click', function() {
        const type = masterPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        masterPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
        this.classList.toggle('fa-eye');
    });

    passwordInput.addEventListener('input', function() {
        updateStrengthMeter(this.value, strengthMeter, strengthText);
    });

    const editPasswordInput = document.getElementById('edit-password');
    const editMeter = document.querySelector('#edit-modal .strength-meter');
    const editText = document.querySelector('#edit-modal .strength-text');
    editPasswordInput.addEventListener('input', function() {
        updateStrengthMeter(this.value, editMeter, editText);
    });

    document.querySelector('#edit-modal .toggle-password').addEventListener('click', function() {
        const type = editPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        editPasswordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
        this.classList.toggle('fa-eye');
    });

    document.querySelector('#edit-modal .close-btn').addEventListener('click', function() {
        editModal.style.display = 'none';
    });

    editCancelBtn.addEventListener('click', () => editModal.style.display = 'none'); // Fix edit cancel button
    document.querySelector('#settings-modal .close-btn').addEventListener('click', function() {
        settingsModal.style.display = 'none';
    });

    masterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const password = masterPasswordInput.value;
        const savedHash = localStorage.getItem('masterPasswordHash');
        const inputHash = CryptoJS.SHA256(password).toString();
        
        if (inputHash === savedHash) {
            encryptionKey = password;
            masterModal.style.display = 'none';
            appContainer.style.display = 'block';
            encryptAllPasswords();
            filterPasswords();
        } else {
            alert('Incorrect master password');
            masterPasswordInput.value = '';
        }
    });

    passwordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const type = document.getElementById('account-type').value;
        const name = document.getElementById('account-name').value.trim();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!type || !name || !username || !password) {
            alert('Please fill in all fields');
            return;
        }

        const newId = String(passwords.length > 0 ? Math.max(...passwords.map(p => parseInt(p.id))) + 1 : 1);
        const encryptedPassword = encryptPassword(password);
        const currentDate = new Date().toLocaleDateString('en-GB');  // This gives DD/MM/YYYY

        
        passwords.push({
            id: newId,
            type,
            name,
            username,
            password: encryptedPassword,
            date: currentDate
        });

        savePasswords();
        this.reset();
        modal.style.display = 'none';
        strengthMeter.setAttribute('data-strength', '0');
        strengthText.textContent = 'Password strength: Very Weak';
        filterPasswords();
    });

    document.getElementById('edit-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const type = document.getElementById('edit-account-type').value;
        const name = document.getElementById('edit-account-name').value.trim();
        const username = document.getElementById('edit-username').value.trim();
        const password = document.getElementById('edit-password').value.trim();
        
        if (!type || !name || !username || !password) {
            alert('Please fill in all fields');
            return;
        }

        const index = passwords.findIndex(p => p.id === id);
        if (index !== -1) {
            passwords[index] = {
                id,
                type,
                name,
                username,
                password: encryptPassword(password),
                date: new Date().toISOString().split('T')[0] // Update date on edit
            };
            savePasswords();
            filterPasswords();
            editModal.style.display = 'none';
            alert('Password updated successfully!');
        } else {
            console.error(`Password with ID ${id} not found during edit`);
            alert('Error updating password');
        }
    });

    document.getElementById('change-master-btn').addEventListener('click', () => {
        const currentPassword = prompt('Enter your current master password:');
        if (currentPassword) {
            const inputHash = CryptoJS.SHA256(currentPassword).toString();
            const savedHash = localStorage.getItem('masterPasswordHash');
            if (inputHash === savedHash) {
                const newPassword = prompt('Enter new master password (min 8 characters):');
                if (newPassword && newPassword.length >= 8) {
                    const newHash = CryptoJS.SHA256(newPassword).toString();
                    localStorage.setItem('masterPasswordHash', newHash);
                    encryptionKey = newPassword;
                    encryptAllPasswords();
                    alert('Master password changed successfully!');
                } else {
                    alert('New master password must be at least 8 characters');
                }
            } else {
                alert('Incorrect current master password');
            }
        }
    });

    document.getElementById('export-btn').addEventListener('click', () => {
        const currentPassword = prompt('Enter your current master password to export:');
        if (currentPassword) {
            const inputHash = CryptoJS.SHA256(currentPassword).toString();
            const savedHash = localStorage.getItem('masterPasswordHash');
            if (inputHash === savedHash) {
                encryptionKey = currentPassword;
                const exportedPasswords = passwords.map(p => ({
                    id: p.id,
                    type: p.type,
                    name: p.name,
                    username: p.username,
                    password: decryptPassword(p.password) || '********',
                    date: p.date
                }));
                const dataStr = JSON.stringify(exportedPasswords, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'SecurePass_Passwords_' + new Date().toISOString().split('T')[0] + '.json';
                a.click();
                URL.revokeObjectURL(url);
                alert('Passwords exported successfully to Downloads!');
            } else {
                alert('Incorrect master password');
            }
        }
    });

    document.getElementById('import-btn').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (!Array.isArray(imported)) {
                        alert('Invalid file format');
                        return;
                    }

                    const reencryptedPasswords = imported.map(item => {
                        const decrypted = decryptPassword(item.password);
                        if (decrypted) {
                            return {
                                ...item,
                                password: encryptPassword(decrypted),
                                date: item.date || new Date().toISOString().split('T')[0] // Preserve or set date
                            };
                        } else {
                            let originalKey = prompt('Enter the original master password used to encrypt this file:');
                            while (originalKey) {
                                const tempKey = originalKey;
                                const tempDecrypted = CryptoJS.AES.decrypt(item.password, tempKey).toString(CryptoJS.enc.Utf8);
                                if (tempDecrypted) {
                                    return {
                                        ...item,
                                        password: encryptPassword(tempDecrypted),
                                        date: item.date || new Date().toISOString().split('T')[0]
                                    };
                                } else {
                                    alert('Incorrect master password. Please try again or cancel.');
                                    originalKey = prompt('Enter the original master password used to encrypt this file:');
                                }
                            }
                            alert('Import cancelled or failed due to incorrect password.');
                            return null;
                        }
                    }).filter(item => item !== null);

                    if (reencryptedPasswords.length > 0) {
                        passwords = reencryptedPasswords;
                        encryptAllPasswords();
                        savePasswords();
                        filterPasswords();
                        alert('Passwords imported successfully!');
                    }
                } catch (err) {
                    console.error('Error importing passwords:', err);
                    alert('Failed to import passwords. Please ensure the file is a valid JSON.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    autoLockTime.addEventListener('change', (e) => {
        const time = parseInt(e.target.value) * 60 * 1000;
        localStorage.setItem('autoLockTime', time);
        if (time > 0) {
            setupAutoLock(time);
            alert(`Auto-lock set to ${e.target.value} minute(s)`);
        } else {
            clearAutoLock();
            alert('Auto-lock disabled');
        }
    });

    function setupAutoLock(time) {
        clearAutoLock();
        const lockTimeout = setTimeout(() => {
            masterModal.style.display = 'flex';
            appContainer.style.display = 'none';
        }, time);
        localStorage.setItem('lockTimeout', lockTimeout);
    }

    function clearAutoLock() {
        const timeout = localStorage.getItem('lockTimeout');
        if (timeout) {
            clearTimeout(parseInt(timeout));
            localStorage.removeItem('lockTimeout');
        }
    }

    const savedTime = localStorage.getItem('autoLockTime');
    if (savedTime) {
        autoLockTime.value = (parseInt(savedTime) / 60 / 1000).toString();
        setupAutoLock(parseInt(savedTime));
    }

    // About section toggle
    const aboutTrigger = document.querySelector('.about-trigger');
    const aboutInfo = document.querySelector('.about-info');

    aboutTrigger.addEventListener('click', function () {
        if (aboutInfo.style.display === 'none' || aboutInfo.style.display === '') {
            aboutInfo.style.display = 'block';
        } else {
            aboutInfo.style.display = 'none';
        }
    });

    loadPasswords();
    checkMasterPassword();
}

document.addEventListener('DOMContentLoaded', initApp);