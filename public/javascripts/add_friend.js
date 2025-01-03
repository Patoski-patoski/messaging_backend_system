/* /public/javascripts/add_friend.js */

async function checkAuth() {
    try {
        const response = await fetch('/users/auth-status');
        const data = await response.json();
        if (data.isAuthenticated) {
            console.log('User Authenticated');
        } else {
            window.location.href = '/login';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        window.location.href = '/login';
    }
}
checkAuth();

async function verifyFriend(event) {
    event.preventDefault();
    const username = document.getElementById('friend-username').value;

    const successText = document.getElementById('success-message');
    const errorText = document.getElementById('error-message');

    try {
        const response = await fetch('/add_friend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ username }),
        });

        const data = await response.json();
        // sessionStorage.setItem('currentUser', data.username);
        // alert(sessionStorage.getItem('currentUser'));
        // console.log(sessionStorage.getItem('currentUser'));

        if (response.ok) {
            errorText.textContent = '';
            successText.textContent = data.message;

            if (data.redirect) {
                alert('data redirect', data.redirect);
                window.location.href = data.redirect;
            } else {
                console.log("Successful, waiting to redirect");
                setTimeout(() => {
                    window.location.href = '/rooms';
                }, 2000);
            }
        } else {
            errorText.textContent = data.error;
            alert('response', );
            setTimeout(() => {
                errorText.textContent = '';
            }, 5000);
        }
    } catch (error) {
        errorText.textContent = 'An error occurred. Please try again.';
    }
}

document.querySelector('.add-friend-form').addEventListener('submit', verifyFriend);
