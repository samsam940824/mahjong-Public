// frontend/auth.js

async function checkAuth() {
    try {
        const { data: { session }, error } = await window.sb.auth.getSession();

        if (error) {
            console.error("Error fetching session:", error.message);
        }

        const isLoginPage = window.location.pathname.endsWith('login.html');

        if (!session && !isLoginPage) {
            // Not logged in and trying to access a protected page
            window.location.href = 'login.html';
        } else if (session && isLoginPage) {
            // Logged in but on login page, redirect to index
            window.location.href = 'index.html';
        }
    } catch (err) {
        console.error("Auth check failed:", err);
    }
}

async function logout() {
    try {
        const { error } = await window.sb.auth.signOut();
        if (error) {
            console.error("Logout failed:", error.message);
            alert("登出失敗：" + error.message);
        } else {
            window.location.href = 'login.html';
        }
    } catch (err) {
        console.error("Logout error:", err);
    }
}

// Immediately check auth status when loaded
checkAuth();

// Fix BFCache vulnerability by ensuring auth check runs on cached pages
window.addEventListener('pageshow', async (event) => {
    if (event.persisted) {
        try {
            const { data: { session }, error } = await window.sb.auth.getSession();
            if (error) {
                console.error("Error fetching session on pageshow:", error.message);
            }
            const isLoginPage = window.location.pathname.endsWith('login.html');
            if (!session && !isLoginPage) {
                window.location.replace('login.html');
            } else if (session && isLoginPage) {
                window.location.replace('index.html');
            }
        } catch (err) {
            console.error("Auth check on pageshow failed:", err);
        }
    }
});
