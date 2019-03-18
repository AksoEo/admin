import { h, render } from 'preact';
import { CircularProgressIndicator } from './components/progress';
import Login from './login';
import './style';

let init;

// load polyfills as needed
if (!('fetch' in window)) {
    init = import(/* webpackChunkName: "polyfill" */ 'whatwg-fetch');
} else {
    init = Promise.resolve(null);
}

/** Shows the login screen if not logged in and opens the app. */
function beginSession () {
    const isLoggedIn = window.localStorage.demoLoggedIn;
    const app = import(/* webpackChunkName: "app", webpackPrefetch: true */ './app');

    if (!isLoggedIn) {
        const loginRoot = document.createElement('div');
        loginRoot.id = 'login-root';
        loginRoot.className = 'root-container';
        document.body.appendChild(loginRoot);

        const onLogin = function () {
            window.localStorage.demoLoggedIn = true;
            loginRoot.classList.add('animate-out');
            setTimeout(() => {
                document.body.removeChild(loginRoot);
            }, 1000);

            setTimeout(() => initApp(app, true), 300);
        };

        render(<Login onLogin={onLogin} />, loginRoot);
    } else {
        initApp(app);
    }
}

/**
 * Opens the app.
 * @param {Promise<Object>} app - the result of `import('./app')`
 * @param {boolean} shouldPlayLoginAnimation - if false, will not play the “logged in” animation
 */
function initApp (app, shouldPlayLoginAnimation = false) {
    const loadingRoot = document.createElement('div');
    loadingRoot.id = 'app-loading';
    render(<CircularProgressIndicator indeterminate />, loadingRoot);

    let appLoaded = false;
    let addedLoadingIndicator = false;
    setTimeout(() => {
        if (appLoaded) return;
        document.body.appendChild(loadingRoot);
        addedLoadingIndicator = true;
    }, 500);

    app.then(app => {
        appLoaded = true;
        if (addedLoadingIndicator) {
            loadingRoot.classList.add('animate-out');
            setTimeout(() => {
                document.body.removeChild(loadingRoot);
            }, 1000);
        }

        const appRoot = app.init(shouldPlayLoginAnimation, () => {
            // logged out
            delete window.localStorage.demoLoggedIn;
            document.body.removeChild(appRoot);
            beginSession();
        });
    }).catch(err => {
        // TODO: handle error
        alert('TODO: handle ' + err);
    });
}

init.then(beginSession);

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/**service worker file name (see webpack config)**');
}

// don’t show “add to homescreen” prompt
window.addEventListener('beforeinstallprompt', e => e.preventDefault());