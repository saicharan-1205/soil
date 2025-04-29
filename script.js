// SoilPro Analytics - Script

let currentUser = null;
let isLoginMode = true;

// DOM Elements
const authForm = document.getElementById('authForm');
const actionButton = document.getElementById('actionButton');
const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const toggleText = document.getElementById('toggleText');
const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
const nameGroup = document.getElementById('nameGroup');
const emailGroup = document.getElementById('emailGroup');
const profilePhotoGroup = document.getElementById('profilePhotoGroup');
const errorMsg = document.getElementById('error-msg');
const analyzeBtn = document.getElementById('analyzeBtn');
const resultsContainer = document.getElementById('resultsContainer');
const resultElement = document.getElementById('result');
const recommendationsElement = document.getElementById('recommendations');
const fertilizerRecommendationsElement = document.getElementById('fertilizerRecommendations');
const cropsElement = document.getElementById('crops');
const logoutBtn = document.getElementById('logoutBtn');
const usernameDisplay = document.getElementById('usernameDisplay');
const profilePhotoDisplay = document.getElementById('profilePhotoDisplay');
const authModal = document.getElementById('authModal');
const themeToggleBtn = document.getElementById('themeToggleBtn');

// Init app
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    if (localStorage.getItem('currentUser')) {
        currentUser = localStorage.getItem('currentUser');
        usernameDisplay.textContent = currentUser;
        loadUserProfile();
        showApp();
    } else {
        showAuthModal();
    }

    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = 'Analyzing...';
            setTimeout(() => {
                analyzeBtn.disabled = false;
                analyzeBtn.innerHTML = 'Analyze Soil';
                analyzeSoil();
            }, 1500);
        });
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
        if (localStorage.getItem('theme') === 'light') {
            document.body.classList.add('light-mode');
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

function showAuthModal() {
    authModal.style.display = 'flex';
}

function showApp() {
    authModal.style.display = 'none';
    document.getElementById('soilForm').style.display = 'grid';
    analyzeBtn.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    errorMsg.textContent = '';
    if (isLoginMode) {
        formTitle.textContent = 'Welcome Back!';
        formSubtitle.textContent = 'Please login to access your soil analysis dashboard';
        actionButton.textContent = 'Login';
        toggleText.innerHTML = `Don't have an account? <a href="#" onclick="toggleAuthMode()">Sign up</a>`;
        confirmPasswordGroup.style.display = 'none';
        nameGroup.style.display = 'none';
        emailGroup.style.display = 'none';
        profilePhotoGroup.style.display = 'none';
    } else {
        formTitle.textContent = 'Create Account';
        formSubtitle.textContent = 'Join our soil monitoring community';
        actionButton.textContent = 'Sign Up';
        toggleText.innerHTML = `Already have an account? <a href="#" onclick="toggleAuthMode()">Login</a>`;
        confirmPasswordGroup.style.display = 'block';
        nameGroup.style.display = 'block';
        emailGroup.style.display = 'block';
        profilePhotoGroup.style.display = 'block';
    }
}

actionButton.addEventListener('click', authenticate);

function authenticate() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        Swal.fire('Error', 'Please fill in all required fields!', 'error');
        return;
    }

    if (isLoginMode) {
        const storedPassword = localStorage.getItem(`user_${username}`);
        if (storedPassword && storedPassword === password) {
            loginSuccess(username);
        } else {
            Swal.fire('Error', 'Invalid username or password.', 'error');
        }
    } else {
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const email = document.getElementById('email').value.trim();
        const name = document.getElementById('name').value.trim();
        const photoInput = document.getElementById('profilePhoto');

        if (!confirmPassword || !email || !name) {
            Swal.fire('Error', 'Please complete all signup fields!', 'error');
            return;
        }
        if (password !== confirmPassword) {
            Swal.fire('Error', "Passwords don't match.", 'error');
            return;
        }
        if (localStorage.getItem(`user_${username}`)) {
            Swal.fire('Error', 'Username already exists.', 'error');
            return;
        }

        localStorage.setItem(`user_${username}`, password);
        localStorage.setItem(`email_${username}`, email);
        localStorage.setItem(`name_${username}`, name);

        if (photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                localStorage.setItem(`photo_${username}`, e.target.result);
                loginSuccess(username);
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            loginSuccess(username);
        }
    }
}

function loginSuccess(username) {
    localStorage.setItem('currentUser', username);
    currentUser = username;
    usernameDisplay.textContent = username;
    loadUserProfile();
    showApp();
}

function logout() {
    localStorage.removeItem('currentUser');
    Swal.fire('Success', 'Logged out successfully!', 'success').then(() => {
        location.reload();
    });
}

function loadUserProfile() {
    const photo = localStorage.getItem(`photo_${currentUser}`);
    if (photo) {
        profilePhotoDisplay.src = photo;
        profilePhotoDisplay.style.display = 'block';
    }
}

// Soil Analysis Functions
function analyzeSoil() {
    const moisture = parseFloat(document.getElementById('moisture').value);
    const ph = parseFloat(document.getElementById('ph').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
    const nitrogen = parseFloat(document.getElementById('nitrogen').value);
    const phosphorus = parseFloat(document.getElementById('phosphorus').value);
    const potassium = parseFloat(document.getElementById('potassium').value);
    const organicMatter = parseFloat(document.getElementById('organicMatter').value);

    if ([moisture, ph, temperature, nitrogen, phosphorus, potassium, organicMatter].some(isNaN)) {
        Swal.fire('Error', 'Please enter valid numbers in all fields.', 'error');
        return;
    }

    const analysis = analyzeSoilData({ moisture, ph, temperature, nitrogen, phosphorus, potassium, organicMatter });
    displayResults(analysis);
}

function analyzeSoilData(soilData) {
    const { ph, nitrogen, phosphorus, potassium, organicMatter } = soilData;
    let overallStatus = 'GOOD';
    let issues = [];

    if (ph < 5.5 || ph > 7.5) {
        overallStatus = ph < 5.5 ? 'ACIDIC' : 'ALKALINE';
        issues.push(`pH level (${ph}) is ${ph < 5.5 ? 'too acidic' : 'too alkaline'}`);
    }

    const nPercent = nitrogen / 10000;
    const pPercent = phosphorus / 10000;
    const kPercent = potassium / 10000;

    if (nPercent < 0.2) {
        overallStatus = 'POOR';
        issues.push(`Nitrogen level (${nitrogen} mg/kg) is too low`);
    }
    if (pPercent < 0.02) {
        overallStatus = overallStatus === 'GOOD' ? 'MODERATE' : overallStatus;
        issues.push(`Phosphorus level (${phosphorus} mg/kg) is too low`);
    }
    if (kPercent < 0.3) {
        overallStatus = overallStatus === 'GOOD' ? 'MODERATE' : overallStatus;
        issues.push(`Potassium level (${potassium} mg/kg) is too low`);
    }
    if (organicMatter < 2) {
        overallStatus = overallStatus === 'GOOD' ? 'MODERATE' : overallStatus;
        issues.push(`Organic matter (${organicMatter}%) is too low`);
    }

    const recommendations = issues.length > 0
        ? [`Your soil has the following issues: ${issues.join(', ')}`]
        : ['Your soil is in good condition! Maintain with regular organic amendments.'];

    const fertilizers = getFertilizerRecommendations(soilData);
    const crops = getCropSuggestions(overallStatus);

    return { overallStatus, recommendations, fertilizers, crops };
}

function getFertilizerRecommendations(soilData) {
    const { ph, nitrogen, phosphorus, potassium, organicMatter } = soilData;
    const recs = [];

    if (ph < 5.5) recs.push({ type: 'Lime', description: 'Raise soil pH', rate: '5-10 lbs per 100 sq ft' });
    if (ph > 7.5) recs.push({ type: 'Sulfur', description: 'Lower soil pH', rate: '1-2 lbs per 100 sq ft' });
    if (nitrogen < 2000) recs.push({ type: 'Nitrogen Fertilizer', description: 'Boost nitrogen levels', rate: '1 lb per 100 sq ft' });
    if (phosphorus < 200) recs.push({ type: 'Phosphorus Fertilizer', description: 'Boost phosphorus', rate: '1 lb per 100 sq ft' });
    if (potassium < 3000) recs.push({ type: 'Potassium Fertilizer', description: 'Boost potassium', rate: '1.5 lbs per 100 sq ft' });
    if (organicMatter < 2) recs.push({ type: 'Compost', description: 'Improve organic matter', rate: '2-3 inches layer' });

    return recs;
}

function getCropSuggestions(status) {
    if (status === 'GOOD') return ['Wheat', 'Rice', 'Corn'];
    if (status === 'ACIDIC') return ['Potato', 'Blueberry'];
    if (status === 'ALKALINE') return ['Beetroot', 'Cabbage'];
    if (status === 'POOR' || status === 'MODERATE') return ['Clover', 'Sunflower'];
    return ['Various crops'];
}

function displayResults(analysis) {
    resultElement.textContent = `Soil Status: ${analysis.overallStatus}`;
    resultElement.className = `result-text ${analysis.overallStatus.toLowerCase()}`;
    recommendationsElement.innerHTML = analysis.recommendations.map(r => `<p>${r}</p>`).join('');
    fertilizerRecommendationsElement.innerHTML = analysis.fertilizers.map(f => `
        <div class="fertilizer-card">
            <h4>${f.type}</h4>
            <p>${f.description}</p>
            <p><strong>Rate:</strong> ${f.rate}</p>
        </div>`).join('');
    cropsElement.innerHTML = `<strong>Suggested Crops:</strong> ${analysis.crops.join(', ')}`;
    resultsContainer.style.display = 'block';
}
