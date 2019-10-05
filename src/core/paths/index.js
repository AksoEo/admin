/// Turns a path lazy by making it a function that returns a promise with the actual object when
/// called.
///
/// - f: the () => import(...) closure
/// - map: maps on the result of f
const lazyPath = (f, map) => {
    let promise;
    function lazy () {
        if (!promise) {
            promise = f().then(map).catch(err => {
                promise = null;
                throw { type: 'chunk-load-failed', message: 'failed to load chunk' };
            });
        }
        return promise;
    }
    lazy.isLazy = true;
    return lazy;
};
const mapTasks = res => res.tasks;
const mapViews = res => res.views;

const codeholders = () => import('./codeholders');
const login = () => import('./login');

/// Task definitions.
export const tasks = {
    codeholders: lazyPath(codeholders, mapTasks),
    login: lazyPath(login, mapTasks),
};

/// View definitions.
export const views = {
    login: lazyPath(login, mapViews),
};